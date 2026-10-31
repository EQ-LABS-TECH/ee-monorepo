import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import { authenticatePrGovernanceWebhook } from '../lib/pr-governance.webhook.mjs';

const secret = 'test-webhook-secret';

const eventName = 'pull_request_review';

const payload = {
  action: 'submitted',
  repository: {
    full_name: 'EQ-LABS-TECH/ee-monorepo',
  },
  pull_request: {
    number: 42,
  },
};

const rawBody = Buffer.from(JSON.stringify(payload));

function signatureFor(body, key = secret) {
  return `sha256=${createHmac('sha256', key).update(body).digest('hex')}`;
}

test('authenticates a valid GitHub webhook', () => {
  const result = authenticatePrGovernanceWebhook({
    rawBody,
    signature: signatureFor(rawBody),
    eventName,
    secret,
  });

  assert.deepEqual(result, {
    authenticated: true,
    eventName,
    payload,
  });
});

test('rejects a modified webhook body', () => {
  const modified = Buffer.from(
    JSON.stringify({
      ...payload,
      action: 'dismissed',
    }),
  );

  assert.throws(
    () =>
      authenticatePrGovernanceWebhook({
        rawBody: modified,
        signature: signatureFor(rawBody),
        eventName,
        secret,
      }),
    /Invalid PN-017 webhook signature/,
  );
});

test('rejects an incorrect webhook secret', () => {
  assert.throws(
    () =>
      authenticatePrGovernanceWebhook({
        rawBody,
        signature: signatureFor(rawBody, 'wrong-secret'),
        eventName,
        secret,
      }),
    /Invalid PN-017 webhook signature/,
  );
});

test('rejects missing or malformed signatures', () => {
  for (const signature of ['', 'sha1=abc', 'sha256=abc', 'sha256=' + 'z'.repeat(64)]) {
    assert.throws(
      () =>
        authenticatePrGovernanceWebhook({
          rawBody,
          signature,
          eventName,
          secret,
        }),
      /Invalid PN-017 webhook signature/,
    );
  }
});

test('rejects invalid JSON even with a valid signature', () => {
  const invalidBody = Buffer.from('{invalid-json');

  assert.throws(
    () =>
      authenticatePrGovernanceWebhook({
        rawBody: invalidBody,
        signature: signatureFor(invalidBody),
        eventName,
        secret,
      }),
    /Invalid PN-017 webhook JSON/,
  );
});

test('rejects non-object JSON payloads', () => {
  const invalidBody = Buffer.from('[]');

  assert.throws(
    () =>
      authenticatePrGovernanceWebhook({
        rawBody: invalidBody,
        signature: signatureFor(invalidBody),
        eventName,
        secret,
      }),
    /Invalid PN-017 webhook payload/,
  );
});

test('rejects untrusted authentication inputs', () => {
  for (const override of [
    { rawBody: '{"action":"submitted"}' },
    { eventName: 'invalid event' },
    { secret: '' },
  ]) {
    assert.throws(
      () =>
        authenticatePrGovernanceWebhook({
          rawBody,
          signature: signatureFor(rawBody),
          eventName,
          secret,
          ...override,
        }),
      /Invalid PN-017 webhook authentication request/,
    );
  }
});
