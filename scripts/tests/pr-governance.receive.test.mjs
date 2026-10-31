import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { receivePrGovernanceWebhook } from '../lib/pr-governance.receive.mjs';

const webhookSecret = 'test-webhook-secret';

const payload = {
  action: 'submitted',
  repository: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
  pull_request: { number: 42 },
};

const rawBody = Buffer.from(JSON.stringify(payload));

function sign(body, secret = webhookSecret) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

const options = {
  rawBody,
  signature: sign(rawBody),
  eventName: 'pull_request_review',
  webhookSecret,
  expectedRepository: 'EQ-LABS-TECH/ee-monorepo',
  token: 'pr-token',
  governanceToken: 'evidence-token',
  publisherToken: 'publisher-token',
  expectedAppId: 789,
};

test('valid signature reaches dispatcher with authenticated event', async () => {
  let calls = 0;

  const result = await receivePrGovernanceWebhook({
    ...options,
    dispatch: async (context) => {
      calls += 1;

      assert.equal(context.authenticated, true);
      assert.equal(context.eventName, 'pull_request_review');
      assert.deepEqual(context.payload, payload);
      assert.equal(context.expectedRepository, options.expectedRepository);
      assert.equal(context.expectedAppId, 789);
      assert.equal(context.publisherToken, 'publisher-token');

      return { status: 'EVALUATED' };
    },
  });

  assert.deepEqual(result, { status: 'EVALUATED' });
  assert.equal(calls, 1);
});

test('invalid signature cannot reach dispatcher', async () => {
  let calls = 0;

  await assert.rejects(
    receivePrGovernanceWebhook({
      ...options,
      signature: sign(rawBody, 'wrong-secret'),
      dispatch: async () => {
        calls += 1;
      },
    }),
    /Invalid PN-017 webhook signature/,
  );

  assert.equal(calls, 0);
});

test('modified payload cannot reach dispatcher', async () => {
  let calls = 0;

  await assert.rejects(
    receivePrGovernanceWebhook({
      ...options,
      rawBody: Buffer.from(JSON.stringify({ ...payload, action: 'dismissed' })),
      dispatch: async () => {
        calls += 1;
      },
    }),
    /Invalid PN-017 webhook signature/,
  );

  assert.equal(calls, 0);
});

test('authenticated flag supplied by caller cannot bypass HMAC', async () => {
  let calls = 0;

  await assert.rejects(
    receivePrGovernanceWebhook({
      ...options,
      authenticated: true,
      signature: 'sha256=invalid',
      dispatch: async () => {
        calls += 1;
      },
    }),
    /Invalid PN-017 webhook signature/,
  );

  assert.equal(calls, 0);
});

test('authenticated organization event remains discovery-only', async () => {
  const organizationPayload = {
    action: 'removed',
    organization: { login: 'EQ-LABS-TECH' },
  };

  const body = Buffer.from(JSON.stringify(organizationPayload));
  let resolveCalls = 0;

  const result = await receivePrGovernanceWebhook({
    ...options,
    rawBody: body,
    signature: sign(body),
    eventName: 'membership',
    dispatch: async (context) => {
      assert.equal(context.authenticated, true);
      assert.deepEqual(context.payload, organizationPayload);
      resolveCalls += 1;
      return {
        status: 'DISCOVERY_REQUIRED',
        organization: 'EQ-LABS-TECH',
      };
    },
  });

  assert.deepEqual(result, {
    status: 'DISCOVERY_REQUIRED',
    organization: 'EQ-LABS-TECH',
  });
  assert.equal(resolveCalls, 1);
});

test('invalid dispatcher is rejected after authentication', async () => {
  await assert.rejects(
    receivePrGovernanceWebhook({
      ...options,
      dispatch: null,
    }),
    /Invalid PN-017 webhook dispatcher/,
  );
});
