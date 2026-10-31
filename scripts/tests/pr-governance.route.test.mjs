import test from 'node:test';
import assert from 'node:assert/strict';

import { routePrGovernanceEvent } from '@eq-labs/governance/pr-governance/route';

const expectedRepository = 'EQ-LABS-TECH/ee-monorepo';

const prPayload = {
  action: 'submitted',
  repository: { full_name: expectedRepository },
  pull_request: {
    number: 42,
    head: { sha: 'a'.repeat(40) },
  },
};

test('routes review events to the trusted repository', () => {
  assert.deepEqual(
    routePrGovernanceEvent({
      eventName: 'pull_request_review',
      payload: prPayload,
      expectedRepository,
    }),
    {
      status: 'READY',
      scope: 'PR_SCOPE',
      owner: 'EQ-LABS-TECH',
      repo: 'ee-monorepo',
      number: 42,
    },
  );
});

test('event claims cannot become governance evidence', () => {
  const result = routePrGovernanceEvent({
    eventName: 'pull_request_review',
    payload: {
      ...prPayload,
      review: {
        state: 'APPROVED',
        body: 'EE-LABS-IMPACT: ORDINARY',
      },
      conclusion: 'success',
      pull_request: {
        number: 42,
        head: { sha: 'invalid-or-stale' },
      },
    },
    expectedRepository,
  });

  assert.deepEqual(result, {
    status: 'READY',
    scope: 'PR_SCOPE',
    owner: 'EQ-LABS-TECH',
    repo: 'ee-monorepo',
    number: 42,
  });
});

test('rejects a different repository', () => {
  assert.throws(
    () =>
      routePrGovernanceEvent({
        eventName: 'pull_request_review',
        payload: {
          ...prPayload,
          repository: { full_name: 'OTHER-ORG/other-repo' },
        },
        expectedRepository,
      }),
    /repository mismatch/,
  );
});

test('organization changes require discovery', () => {
  assert.deepEqual(
    routePrGovernanceEvent({
      eventName: 'membership',
      payload: {
        action: 'removed',
        organization: { login: 'EQ-LABS-TECH' },
      },
      expectedRepository,
    }),
    {
      status: 'DISCOVERY_REQUIRED',
      scope: 'ORG_SCOPE',
      organization: 'EQ-LABS-TECH',
    },
  );
});

test('rejects unrelated organization events', () => {
  assert.throws(
    () =>
      routePrGovernanceEvent({
        eventName: 'membership',
        payload: {
          action: 'removed',
          organization: { login: 'OTHER-ORG' },
        },
        expectedRepository,
      }),
    /organization mismatch/,
  );
});

test('unrelated events do not schedule evaluation', () => {
  assert.deepEqual(
    routePrGovernanceEvent({
      eventName: 'push',
      payload: { action: 'created' },
      expectedRepository,
    }),
    { status: 'IGNORED' },
  );
});

test('invalid trusted repository fails closed', () => {
  assert.throws(
    () =>
      routePrGovernanceEvent({
        eventName: 'pull_request_review',
        payload: prPayload,
        expectedRepository: 'invalid',
      }),
    /Invalid trusted governance repository/,
  );
});
