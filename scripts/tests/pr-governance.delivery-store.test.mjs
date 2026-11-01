import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { processPrGovernanceDelivery } from '../lib/pr-governance.delivery.mjs';
import { createPrGovernanceLeaseStore } from '../lib/pr-governance.lease-store.mjs';

const deliveryId = '11111111-2222-4333-8444-555555555555';
const webhookSecret = 'test-webhook-secret';

const rawBody = Buffer.from(
  JSON.stringify({
    action: 'submitted',
    repository: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
    pull_request: { number: 42 },
  }),
);

const signature = `sha256=${createHmac('sha256', webhookSecret).update(rawBody).digest('hex')}`;

const options = {
  deliveryId,
  rawBody,
  signature,
  eventName: 'pull_request_review',
  webhookSecret,
  expectedRepository: 'EQ-LABS-TECH/ee-monorepo',
  token: 'pr-token',
  governanceToken: 'evidence-token',
  publisherToken: 'publisher-token',
  expectedAppId: 789,
};

function createFixture() {
  let record = null;
  let version = null;
  let revisions = 0;
  let tokens = 0;
  let now = 1000;

  // Test double only. No production persistence is implied.
  const storage = {
    async read() {
      return {
        version,
        record: structuredClone(record),
      };
    },

    async compareAndSwap(id, expectedVersion, nextRecord) {
      assert.equal(id, deliveryId);

      if (version !== expectedVersion) {
        return false;
      }

      record = structuredClone(nextRecord);
      revisions += 1;
      version = String(revisions);
      return true;
    },
  };

  const store = createPrGovernanceLeaseStore({
    storage,
    leaseMs: 1000,
    clock: () => now,
    createToken: () => `lease-${++tokens}`,
  });

  return {
    store,
    getRecord: () => structuredClone(record),
    getRevisions: () => revisions,
    advanceClock: (milliseconds) => {
      now += milliseconds;
    },
  };
}

function process(store, dispatch) {
  return processPrGovernanceDelivery({
    ...options,
    store,
    dispatch,
  });
}

test('completed delivery is not dispatched a second time', async () => {
  const fixture = createFixture();
  let executions = 0;

  const dispatch = async () => {
    executions += 1;
    return { status: 'EVALUATED' };
  };

  const first = await process(fixture.store, dispatch);
  const second = await process(fixture.store, dispatch);

  assert.equal(first.status, 'EVALUATED');
  assert.deepEqual(second, { status: 'DUPLICATE_COMPLETED' });
  assert.equal(executions, 1);
  assert.equal(fixture.getRecord().status, 'COMPLETED');
  assert.equal(fixture.getRevisions(), 2);
});

test('failed dispatch releases the lease and permits retry', async () => {
  const fixture = createFixture();

  await assert.rejects(
    process(fixture.store, async () => {
      throw new Error('Temporary governance failure');
    }),
    /Temporary governance failure/,
  );

  assert.equal(fixture.getRecord(), null);

  const result = await process(fixture.store, async () => ({
    status: 'EVALUATED',
  }));

  assert.equal(result.status, 'EVALUATED');
  assert.equal(fixture.getRecord().status, 'COMPLETED');
});

test('concurrent duplicate cannot execute while lease is active', async () => {
  const fixture = createFixture();

  let signalStarted;
  let releaseFirst;

  const started = new Promise((resolve) => {
    signalStarted = resolve;
  });

  const blocked = new Promise((resolve) => {
    releaseFirst = resolve;
  });

  let executions = 0;

  const first = process(fixture.store, async () => {
    executions += 1;
    signalStarted();
    await blocked;
    return { status: 'EVALUATED' };
  });

  await started;

  try {
    await assert.rejects(
      process(fixture.store, async () => {
        executions += 1;
        return { status: 'EVALUATED' };
      }),
      /delivery is already in progress/,
    );

    assert.equal(executions, 1);
  } finally {
    releaseFirst();
  }

  assert.equal((await first).status, 'EVALUATED');
  assert.equal(fixture.getRecord().status, 'COMPLETED');
});

test('expired lease cannot acknowledge a late execution', async () => {
  const fixture = createFixture();

  await assert.rejects(
    process(fixture.store, async () => {
      fixture.advanceClock(1000);
      return { status: 'EVALUATED' };
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.errors[0].message, /lease is stale or no longer owned/);
      return true;
    },
  );

  assert.equal(fixture.getRecord().status, 'IN_PROGRESS');
});

test('renewed lease prevents duplicate execution after original expiry', async () => {
  const fixture = createFixture();
  let resolveStarted;
  let finishEvaluation;

  const started = new Promise((resolve) => {
    resolveStarted = resolve;
  });

  const blocked = new Promise((resolve) => {
    finishEvaluation = resolve;
  });

  let executions = 0;

  const first = process(fixture.store, async () => {
    executions += 1;
    resolveStarted();
    await blocked;
    return { status: 'EVALUATED' };
  });

  await started;

  // The original lease expires at t=2000.
  fixture.advanceClock(900);

  const record = fixture.getRecord();

  assert.deepEqual(await fixture.store.renew(deliveryId, record.claimToken), { status: 'RENEWED' });

  // t=2100: original expiry passed; renewed lease remains active.
  fixture.advanceClock(200);

  try {
    await assert.rejects(
      process(fixture.store, async () => {
        executions += 1;
        return { status: 'EVALUATED' };
      }),
      /delivery is already in progress/,
    );

    assert.equal(executions, 1);
  } finally {
    finishEvaluation();
  }

  assert.equal((await first).status, 'EVALUATED');
  assert.equal(fixture.getRecord().status, 'COMPLETED');
});

test('reclaimed lease rejects renewal from previous owner', async () => {
  const fixture = createFixture();

  const first = await fixture.store.claim(deliveryId);

  fixture.advanceClock(1000);

  const second = await fixture.store.claim(deliveryId);

  assert.equal(second.status, 'ACQUIRED');
  assert.notEqual(second.claimToken, first.claimToken);

  await assert.rejects(
    fixture.store.renew(deliveryId, first.claimToken),
    /lease is stale or no longer owned/,
  );

  assert.equal(fixture.getRecord().claimToken, second.claimToken);

  assert.deepEqual(await fixture.store.complete(deliveryId, second.claimToken), {
    status: 'COMPLETED',
  });
});
