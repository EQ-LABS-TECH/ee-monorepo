import test from 'node:test';
import assert from 'node:assert/strict';

import { createPrGovernanceLeaseStore } from '../lib/pr-governance.lease-store.mjs';

const id = '11111111-2222-4333-8444-555555555555';

function fixture() {
  let record = null;
  let version = null;
  let writes = 0;
  let time = 1000;
  let sequence = 0;

  const storage = {
    async read() {
      return {
        version,
        record: structuredClone(record),
      };
    },

    async compareAndSwap(_id, expectedVersion, next) {
      if (version !== expectedVersion) {
        return false;
      }

      record = structuredClone(next);
      writes += 1;
      version = String(writes);
      return true;
    },
  };

  const createStore = (options = {}) =>
    createPrGovernanceLeaseStore({
      storage,
      leaseMs: 100,
      clock: () => time,
      createToken: () => `lease-${++sequence}`,
      ...options,
    });

  return {
    storage,
    createStore,
    setTime: (value) => {
      time = value;
    },
    getRecord: () => record,
    getWrites: () => writes,
  };
}

test('claim acquires lease and blocks another claim', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);
  const second = await store.claim(id);

  assert.deepEqual(first, {
    status: 'ACQUIRED',
    claimToken: 'lease-1',
  });

  assert.deepEqual(second, { status: 'IN_PROGRESS' });
  assert.equal(mock.getWrites(), 1);
});

test('completion is persistent and prevents reacquisition', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);
  const completed = await store.complete(id, first.claimToken);

  assert.deepEqual(completed, { status: 'COMPLETED' });
  assert.equal(mock.getRecord().status, 'COMPLETED');
  assert.deepEqual(await store.claim(id), { status: 'COMPLETED' });
});

test('release permits another claim', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);
  assert.deepEqual(await store.release(id, first.claimToken), { status: 'RELEASED' });

  const next = await store.claim(id);

  assert.equal(next.status, 'ACQUIRED');
  assert.notEqual(next.claimToken, first.claimToken);
});

test('expired lease is reclaimed and old owner is fenced out', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.setTime(1100);

  const second = await store.claim(id);

  assert.equal(second.status, 'ACQUIRED');
  assert.notEqual(first.claimToken, second.claimToken);

  await assert.rejects(store.complete(id, first.claimToken), /lease is stale or no longer owned/);

  await assert.rejects(store.release(id, first.claimToken), /lease is stale or no longer owned/);

  assert.equal(mock.getRecord().claimToken, second.claimToken);
});

test('CAS conflict retries without overwriting another write', async () => {
  const mock = fixture();
  const original = mock.storage.compareAndSwap;
  let attempts = 0;

  mock.storage.compareAndSwap = async (...args) => {
    attempts += 1;

    if (attempts === 1) {
      return false;
    }

    return original(...args);
  };

  const result = await mock.createStore().claim(id);

  assert.equal(result.status, 'ACQUIRED');
  assert.equal(attempts, 2);
  assert.equal(mock.getWrites(), 1);
});

test('persistent CAS contention fails closed', async () => {
  const mock = fixture();

  mock.storage.compareAndSwap = async () => false;

  await assert.rejects(
    mock.createStore({ maxAttempts: 2 }).claim(id),
    /transaction contention limit exceeded/,
  );

  assert.equal(mock.getWrites(), 0);
});

test('storage errors are never interpreted as completion', async () => {
  const mock = fixture();

  mock.storage.read = async () => {
    throw new Error('Storage unavailable');
  };

  await assert.rejects(mock.createStore().claim(id), /Storage unavailable/);
});

test('invalid configuration fails before storage access', () => {
  const mock = fixture();

  assert.throws(
    () =>
      createPrGovernanceLeaseStore({
        storage: mock.storage,
        leaseMs: 0,
      }),
    /Invalid PN-017 lease store configuration/,
  );
});

test('concurrent claims cannot both acquire the same delivery', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const [first, second] = await Promise.all([store.claim(id), store.claim(id)]);

  assert.equal([first.status, second.status].filter((status) => status === 'ACQUIRED').length, 1);

  assert.equal(
    [first.status, second.status].filter((status) => status === 'IN_PROGRESS').length,
    1,
  );

  assert.equal(mock.getWrites(), 1);
  assert.equal(mock.getRecord().status, 'IN_PROGRESS');
});

test('malformed storage snapshots cannot create a new lease', async () => {
  const invalidSnapshots = [
    undefined,
    {},
    { version: null },
    { record: null },
    { version: null, record: { status: 'COMPLETED' } },
    { version: '', record: null },
  ];

  for (const snapshot of invalidSnapshots) {
    const mock = fixture();

    mock.storage.read = async () => snapshot;

    await assert.rejects(mock.createStore().claim(id), /Invalid PN-017 storage snapshot/);

    assert.equal(mock.getWrites(), 0);
  }
});

test('expired claim cannot be completed even without replacement', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.setTime(1100);

  await assert.rejects(store.complete(id, first.claimToken), /lease is stale or no longer owned/);

  assert.equal(mock.getRecord().status, 'IN_PROGRESS');
  assert.equal(mock.getWrites(), 1);
});

test('storage failure during completion never confirms success', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.storage.compareAndSwap = async () => {
    throw new Error('Persistent storage unavailable');
  };

  await assert.rejects(store.complete(id, first.claimToken), /Persistent storage unavailable/);

  assert.equal(mock.getRecord().status, 'IN_PROGRESS');
});

test('stale absent snapshot cannot overwrite a released delivery', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const originalRead = mock.storage.read.bind(mock.storage);
  let interleaved = false;

  mock.storage.read = async () => {
    const snapshot = await originalRead();

    if (!interleaved) {
      interleaved = true;

      // Another worker claims and releases after our stale read.
      const other = await store.claim(id);
      assert.equal(other.status, 'ACQUIRED');

      assert.deepEqual(await store.release(id, other.claimToken), { status: 'RELEASED' });
    }

    return snapshot;
  };

  const current = await store.claim(id);

  assert.equal(current.status, 'ACQUIRED');
  assert.equal(mock.getRecord().claimToken, current.claimToken);

  // Claim + release + retried claim.
  assert.equal(mock.getWrites(), 3);
});

test('renewal persists lease expiry using CAS', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.setTime(1050);

  assert.deepEqual(await store.renew(id, first.claimToken), { status: 'RENEWED' });

  assert.equal(mock.getRecord().expiresAt, 1150);
  assert.equal(mock.getWrites(), 2);

  mock.setTime(1100);

  assert.deepEqual(await store.claim(id), { status: 'IN_PROGRESS' });
});

test('expired owner cannot renew or complete', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.setTime(1100);

  await assert.rejects(store.renew(id, first.claimToken), /lease is stale or no longer owned/);

  await assert.rejects(store.complete(id, first.claimToken), /lease is stale or no longer owned/);

  assert.equal(mock.getWrites(), 1);
});

test('storage failure during renewal does not report success', async () => {
  const mock = fixture();
  const store = mock.createStore();

  const first = await store.claim(id);

  mock.storage.compareAndSwap = async () => {
    throw new Error('Renewal storage unavailable');
  };

  await assert.rejects(store.renew(id, first.claimToken), /Renewal storage unavailable/);

  assert.equal(mock.getWrites(), 1);
});
