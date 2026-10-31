import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateRequestedPrGovernanceHead,
  validateGovernanceSchedule,
  validateGovernanceWorkflowRun,
} from '@eq-labs/governance/pr-governance/workflow';

const repository = 'EQ-LABS-TECH/ee-monorepo';

function event(overrides = {}) {
  return {
    action: 'completed',
    repository: { full_name: repository },
    workflow_run: {
      id: 123,
      workflow_id: 456,
      name: 'CI',
      path: '.github/workflows/ci.yml',
      event: 'pull_request',
      head_sha: 'a'.repeat(40),
      repository: { full_name: repository },
      ...overrides,
    },
  };
}

const context = {
  expectedRepository: repository,
  expectedWorkflowName: 'CI',
  expectedWorkflowPath: '.github/workflows/ci.yml',
};

test('accepts a manual run only when the requested HEAD is current', () => {
  const headSha = 'a'.repeat(40);

  assert.doesNotThrow(() =>
    validateRequestedPrGovernanceHead({
      eventName: 'workflow_dispatch',
      requestedHeadSha: headSha,
      resolvedHeadSha: headSha.toUpperCase(),
    }),
  );
});

test('rejects stale or malformed requested HEAD values for manual runs', () => {
  assert.throws(
    () =>
      validateRequestedPrGovernanceHead({
        eventName: 'workflow_dispatch',
        requestedHeadSha: 'a'.repeat(40),
        resolvedHeadSha: 'b'.repeat(40),
      }),
    /does not match the current PR HEAD/,
  );
  assert.throws(
    () =>
      validateRequestedPrGovernanceHead({
        eventName: 'workflow_dispatch',
        requestedHeadSha: 'invalid',
        resolvedHeadSha: 'a'.repeat(40),
      }),
    /does not match the current PR HEAD/,
  );
});

test('ignores the manual HEAD input for automatic PR and review events', () => {
  assert.doesNotThrow(() =>
    validateRequestedPrGovernanceHead({
      eventName: 'pull_request_target',
      requestedHeadSha: undefined,
      resolvedHeadSha: 'a'.repeat(40),
    }),
  );
});

test('accepts scheduled reconciliation only on main', () => {
  assert.deepEqual(
    validateGovernanceSchedule({
      expectedRepository: repository,
      ref: 'refs/heads/main',
    }),
    {
      repository,
      sourceEvent: 'schedule',
    },
  );
});

test('rejects scheduled reconciliation outside main or with an invalid repository', () => {
  assert.throws(
    () =>
      validateGovernanceSchedule({
        expectedRepository: repository,
        ref: 'refs/heads/feat/untrusted',
      }),
    /Invalid scheduled governance context/,
  );
  assert.throws(
    () =>
      validateGovernanceSchedule({
        expectedRepository: 'OTHER/repo/extra',
        ref: 'refs/heads/main',
      }),
    /Invalid scheduled governance context/,
  );
});

test('accepts the expected CI workflow for a pull request', () => {
  const result = validateGovernanceWorkflowRun({
    ...context,
    event: event(),
  });

  assert.deepEqual(result, {
    workflowRunId: 123,
    repository,
    sourceEvent: 'pull_request',
  });
});

test('rejects a different source workflow name or path', () => {
  assert.throws(
    () =>
      validateGovernanceWorkflowRun({
        ...context,
        event: event({ name: 'Untrusted Workflow' }),
      }),
    /Untrusted or unsupported/,
  );
});

test('rejects non-pull-request executions', () => {
  assert.throws(
    () =>
      validateGovernanceWorkflowRun({
        ...context,
        event: event({ event: 'push' }),
      }),
    /Untrusted or unsupported/,
  );
});

test('rejects another repository', () => {
  assert.throws(
    () =>
      validateGovernanceWorkflowRun({
        ...context,
        event: event({
          repository: { full_name: 'OTHER/repo' },
        }),
      }),
    /Untrusted or unsupported/,
  );
});

test('rejects invalid expected workflow identity', () => {
  assert.throws(
    () =>
      validateGovernanceWorkflowRun({
        ...context,
        expectedWorkflowPath: '.github/workflows/untrusted.yml',
        event: event(),
      }),
    /Invalid governance workflow run context/,
  );
});
