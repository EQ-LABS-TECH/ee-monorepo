import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { processPrGovernanceDelivery } from '../lib/pr-governance.delivery.mjs';

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

function fixture({ claimStatus = 'ACQUIRED' } = {}) {
  const operations = [];

  const store = {
    claim: async (id) => {
      operations.push(['claim', id]);

      return claimStatus === 'ACQUIRED'
        ? { status: 'ACQUIRED', claimToken: 'lease-1' }
        : { status: claimStatus };
    },
    complete: async (id, claimToken) => {
      operations.push(['complete', id, claimToken]);
      return { status: 'COMPLETED' };
    },
    release: async (id, claimToken) => {
      operations.push(['release', id, claimToken]);
      return { status: 'RELEASED' };
    },
  };

  return { store, operations };
}

test('verified delivery is dispatched and marked completed', async () => {
  const mock = fixture();
  let calls = 0;

  const result = await processPrGovernanceDelivery({
    ...options,
    store: mock.store,
    dispatch: async (event) => {
      calls += 1;
      assert.equal(event.authenticated, true);
      assert.equal(event.expectedAppId, 789);
      return { status: 'EVALUATED' };
    },
  });

  assert.equal(result.status, 'EVALUATED');
  assert.equal(calls, 1);
  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim', 'complete'],
  );
});

test('completed delivery never dispatches again', async () => {
  const mock = fixture({ claimStatus: 'COMPLETED' });
  let calls = 0;

  const result = await processPrGovernanceDelivery({
    ...options,
    store: mock.store,
    dispatch: async () => {
      calls += 1;
    },
  });

  assert.deepEqual(result, { status: 'DUPLICATE_COMPLETED' });
  assert.equal(calls, 0);
  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim'],
  );
});

test('invalid signature cannot claim a delivery', async () => {
  const mock = fixture();

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      signature: 'sha256=' + '0'.repeat(64),
      store: mock.store,
    }),
    /Invalid PN-017 webhook signature/,
  );

  assert.equal(mock.operations.length, 0);
});

test('failed dispatch releases the claim for retry', async () => {
  const mock = fixture();

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => {
        throw new Error('Temporary evaluation error');
      },
    }),
    /Temporary evaluation error/,
  );

  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim', 'release'],
  );
});

test('organization discovery fails and releases its lease', async () => {
  const mock = fixture();

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => ({
        status: 'DISCOVERY_REQUIRED',
        organization: 'EQ-LABS-TECH',
      }),
    }),
    /organization discovery is not implemented/,
  );

  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim', 'release'],
  );
});

test('invalid claim evidence prevents privileged dispatch', async () => {
  const mock = fixture();
  mock.store.claim = async () => ({ status: 'ACQUIRED' });
  let called = false;

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => {
        called = true;
      },
    }),
    /delivery claim was not established/,
  );

  assert.equal(called, false);
});

test('lease cleanup errors remain visible', async () => {
  const mock = fixture();

  mock.store.release = async () => {
    throw new Error('Storage unavailable');
  };

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => {
        throw new Error('Evaluation unavailable');
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 2);
      return true;
    },
  );
});

test('malformed delivery ID is rejected before claiming', async () => {
  const mock = fixture();

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      deliveryId: 'invalid',
      store: mock.store,
    }),
    /Invalid PN-017 delivery context/,
  );

  assert.equal(mock.operations.length, 0);
});

test('in-progress delivery cannot be acknowledged as completed', async () => {
  const mock = fixture({ claimStatus: 'IN_PROGRESS' });
  let dispatched = false;

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => {
        dispatched = true;
      },
    }),
    /delivery is already in progress/,
  );

  assert.equal(dispatched, false);
  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim'],
  );
});

test('unconfirmed completion cannot acknowledge delivery', async () => {
  const mock = fixture();

  mock.store.complete = async () => ({ status: 'STALE' });

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => ({ status: 'EVALUATED' }),
    }),
    /delivery completion was not confirmed/,
  );

  assert.deepEqual(
    mock.operations.map(([operation]) => operation),
    ['claim', 'release'],
  );
});

test('unconfirmed release exposes both execution and storage errors', async () => {
  const mock = fixture();

  mock.store.release = async () => ({ status: 'STALE' });

  await assert.rejects(
    processPrGovernanceDelivery({
      ...options,
      store: mock.store,
      dispatch: async () => {
        throw new Error('Evaluation failed');
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.match(error.errors[0].message, /Evaluation failed/);
      assert.match(error.errors[1].message, /delivery release was not confirmed/);
      return true;
    },
  );
});
