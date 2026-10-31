import test from 'node:test';
import assert from 'node:assert/strict';

import { transitionPrGovernanceLease } from '../lib/pr-governance.lease.mjs';

const claim = (record, claimToken, now = 1000) =>
  transitionPrGovernanceLease({
    record,
    operation: 'CLAIM',
    claimToken,
    now,
    leaseMs: 100,
  });

const mutate = (record, operation, claimToken, now = 1050) =>
  transitionPrGovernanceLease({
    record,
    operation,
    claimToken,
    now,
  });

test('first delivery claim acquires a lease', () => {
  assert.deepEqual(claim(null, 'lease-a'), {
    status: 'ACQUIRED',
    next: {
      status: 'IN_PROGRESS',
      claimToken: 'lease-a',
      expiresAt: 1100,
    },
  });
});

test('active lease prevents another claim', () => {
  const first = claim(null, 'lease-a');
  const second = claim(first.next, 'lease-b', 1050);

  assert.equal(second.status, 'IN_PROGRESS');
  assert.deepEqual(second.next, first.next);
});

test('expired lease can be reclaimed', () => {
  const first = claim(null, 'lease-a');
  const second = claim(first.next, 'lease-b', 1100);

  assert.equal(second.status, 'ACQUIRED');
  assert.equal(second.next.claimToken, 'lease-b');
});

test('expired worker cannot complete a reclaimed lease', () => {
  const first = claim(null, 'lease-a');
  const second = claim(first.next, 'lease-b', 1100);

  const stale = mutate(second.next, 'COMPLETE', 'lease-a', 1120);

  assert.equal(stale.status, 'STALE');
  assert.deepEqual(stale.next, second.next);
});

test('expired worker cannot release another workers lease', () => {
  const first = claim(null, 'lease-a');
  const second = claim(first.next, 'lease-b', 1100);

  const stale = mutate(second.next, 'RELEASE', 'lease-a', 1120);

  assert.equal(stale.status, 'STALE');
  assert.deepEqual(stale.next, second.next);
});

test('valid completion permanently deduplicates the delivery', () => {
  const first = claim(null, 'lease-a');
  const completed = mutate(first.next, 'COMPLETE', 'lease-a');

  assert.equal(completed.status, 'COMPLETED');
  assert.equal(claim(completed.next, 'lease-b', 1200).status, 'COMPLETED');
});

test('valid release permits a retry', () => {
  const first = claim(null, 'lease-a');
  const released = mutate(first.next, 'RELEASE', 'lease-a');

  assert.deepEqual(released, { status: 'RELEASED', next: null });
  assert.equal(claim(released.next, 'lease-b').status, 'ACQUIRED');
});

test('lease completion after expiry is rejected', () => {
  const first = claim(null, 'lease-a');

  assert.equal(mutate(first.next, 'COMPLETE', 'lease-a', 1100).status, 'STALE');
});

test('invalid states and unsafe durations fail closed', () => {
  assert.throws(() => claim({ status: 'UNKNOWN' }, 'lease-a'), TypeError);

  assert.throws(
    () =>
      transitionPrGovernanceLease({
        record: null,
        operation: 'CLAIM',
        claimToken: 'lease-a',
        now: Number.MAX_SAFE_INTEGER,
        leaseMs: 100,
      }),
    TypeError,
  );

  assert.throws(() => mutate(null, 'UNKNOWN', 'lease-a'), TypeError);
});

test('valid owner renews an active lease', () => {
  const first = claim(null, 'lease-a');
  const renewed = transitionPrGovernanceLease({
    record: first.next,
    operation: 'RENEW',
    claimToken: 'lease-a',
    now: 1050,
    leaseMs: 100,
  });

  assert.equal(renewed.status, 'RENEWED');
  assert.equal(renewed.next.expiresAt, 1150);
  assert.equal(renewed.next.claimToken, 'lease-a');
});

test('wrong owner cannot renew an active lease', () => {
  const first = claim(null, 'lease-a');
  const result = transitionPrGovernanceLease({
    record: first.next,
    operation: 'RENEW',
    claimToken: 'lease-b',
    now: 1050,
    leaseMs: 100,
  });

  assert.equal(result.status, 'STALE');
  assert.deepEqual(result.next, first.next);
});

test('expired lease cannot be renewed', () => {
  const first = claim(null, 'lease-a');
  const result = transitionPrGovernanceLease({
    record: first.next,
    operation: 'RENEW',
    claimToken: 'lease-a',
    now: 1100,
    leaseMs: 100,
  });

  assert.equal(result.status, 'STALE');
});

test('renewal cannot shorten an active lease', () => {
  const first = claim(null, 'lease-a');
  const result = transitionPrGovernanceLease({
    record: first.next,
    operation: 'RENEW',
    claimToken: 'lease-a',
    now: 1010,
    leaseMs: 10,
  });

  assert.equal(result.status, 'RENEWED');
  assert.equal(result.next.expiresAt, 1100);
});
