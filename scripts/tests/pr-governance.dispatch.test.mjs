import test from 'node:test';
import assert from 'node:assert/strict';

import { dispatchPrGovernanceEvent } from '../lib/pr-governance.dispatch.mjs';

const expectedRepository = 'EQ-LABS-TECH/ee-monorepo';
const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

const options = {
  eventName: 'pull_request_review',
  payload: {
    action: 'submitted',
    repository: { full_name: expectedRepository },
    pull_request: { number: 42 },
  },
  expectedRepository,
  authenticated: true,
  token: 'pr-token',
  governanceToken: 'evidence-token',
  publisherToken: 'publisher-token',
  expectedAppId: 789,
};

const resolved = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  expectedHeadSha: headSha,
  baseSha,
};

test('authenticated PR event resolves HEAD and invokes governance once', async () => {
  let resolveCalls = 0;
  let runCalls = 0;

  const response = await dispatchPrGovernanceEvent({
    ...options,
    resolve: async ({ route }) => {
      resolveCalls += 1;
      assert.equal(route.status, 'READY');
      assert.equal(Object.hasOwn(route, 'headSha'), false);
      return resolved;
    },
    run: async (context) => {
      runCalls += 1;
      assert.equal(context.expectedHeadSha, headSha);
      assert.equal(context.expectedAppId, 789);
      assert.equal(context.publisherToken, 'publisher-token');
      return { decision: { status: 'PASS' }, conclusion: 'success' };
    },
  });

  assert.equal(response.status, 'EVALUATED');
  assert.equal(response.result.conclusion, 'success');
  assert.equal(resolveCalls, 1);
  assert.equal(runCalls, 1);
});

test('unauthenticated event cannot resolve or publish', async () => {
  let called = false;

  await assert.rejects(
    dispatchPrGovernanceEvent({
      ...options,
      authenticated: false,
      resolve: async () => {
        called = true;
      },
      run: async () => {
        called = true;
      },
    }),
    /Invalid trusted PN-017 dispatch context/,
  );

  assert.equal(called, false);
});

test('organization event requires discovery without publishing', async () => {
  let called = false;

  const response = await dispatchPrGovernanceEvent({
    ...options,
    eventName: 'membership',
    payload: {
      action: 'removed',
      organization: { login: 'EQ-LABS-TECH' },
    },
    resolve: async () => {
      called = true;
    },
    run: async () => {
      called = true;
    },
  });

  assert.deepEqual(response, {
    status: 'DISCOVERY_REQUIRED',
    organization: 'EQ-LABS-TECH',
  });

  assert.equal(called, false);
});

test('ignored event never invokes privileged operations', async () => {
  let called = false;

  const response = await dispatchPrGovernanceEvent({
    ...options,
    eventName: 'push',
    payload: { action: 'created' },
    resolve: async () => {
      called = true;
    },
    run: async () => {
      called = true;
    },
  });

  assert.deepEqual(response, { status: 'IGNORED' });
  assert.equal(called, false);
});

test('resolver identity mismatch prevents publication', async () => {
  let published = false;

  await assert.rejects(
    dispatchPrGovernanceEvent({
      ...options,
      resolve: async () => ({
        ...resolved,
        number: 43,
      }),
      run: async () => {
        published = true;
      },
    }),
    /Invalid PN-017 resolved PR context/,
  );

  assert.equal(published, false);
});

test('missing trusted App identity prevents all work', async () => {
  let called = false;

  await assert.rejects(
    dispatchPrGovernanceEvent({
      ...options,
      expectedAppId: undefined,
      resolve: async () => {
        called = true;
      },
    }),
    /Invalid trusted PN-017 dispatch context/,
  );

  assert.equal(called, false);
});
