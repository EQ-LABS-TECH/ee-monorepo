import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyPrGovernanceEvent } from '../lib/pr-governance.events.mjs';

const prPayload = {
  repository: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
  pull_request: { number: 42 },
};

test('PR lifecycle changes require scoped reevaluation', () => {
  for (const action of [
    'opened',
    'reopened',
    'synchronize',
    'edited',
    'ready_for_review',
    'converted_to_draft',
    'review_requested',
    'review_request_removed',
  ]) {
    assert.deepEqual(
      classifyPrGovernanceEvent({
        eventName: 'pull_request',
        payload: { ...prPayload, action },
      }),
      {
        scope: 'PR_SCOPE',
        repository: 'EQ-LABS-TECH/ee-monorepo',
        number: 42,
      },
    );
  }
});

test('review changes require reevaluation even without new commits', () => {
  for (const action of ['submitted', 'edited', 'dismissed']) {
    assert.deepEqual(
      classifyPrGovernanceEvent({
        eventName: 'pull_request_review',
        payload: { ...prPayload, action },
      }),
      {
        scope: 'PR_SCOPE',
        repository: 'EQ-LABS-TECH/ee-monorepo',
        number: 42,
      },
    );
  }
});

test('organization authority changes require wider reevaluation', () => {
  for (const [eventName, action] of [
    ['membership', 'removed'],
    ['membership', 'added'],
    ['team', 'removed_from_repository'],
    ['team', 'edited'],
    ['member', 'removed'],
  ]) {
    assert.deepEqual(
      classifyPrGovernanceEvent({
        eventName,
        payload: {
          action,
          organization: { login: 'EQ-LABS-TECH' },
        },
      }),
      {
        scope: 'ORG_SCOPE',
        organization: 'EQ-LABS-TECH',
      },
    );
  }
});

test('unrelated events are ignored', () => {
  assert.deepEqual(
    classifyPrGovernanceEvent({
      eventName: 'push',
      payload: { action: 'created' },
    }),
    { scope: 'IGNORE' },
  );

  assert.deepEqual(
    classifyPrGovernanceEvent({
      eventName: 'pull_request',
      payload: { ...prPayload, action: 'labeled' },
    }),
    { scope: 'IGNORE' },
  );
});

test('malformed actionable PR events fail closed', () => {
  for (const payload of [
    { action: 'synchronize', pull_request: { number: 42 } },
    { action: 'synchronize', repository: { full_name: 'invalid' } },
    { ...prPayload, action: 'synchronize', pull_request: { number: 0 } },
  ]) {
    assert.throws(
      () =>
        classifyPrGovernanceEvent({
          eventName: 'pull_request',
          payload,
        }),
      TypeError,
    );
  }
});

test('malformed actionable organization events fail closed', () => {
  assert.throws(
    () =>
      classifyPrGovernanceEvent({
        eventName: 'membership',
        payload: { action: 'removed' },
      }),
    TypeError,
  );
});
