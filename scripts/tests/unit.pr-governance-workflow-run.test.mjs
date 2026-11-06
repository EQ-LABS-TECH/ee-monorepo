import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateRequestedPrGovernanceHead,
  validateGovernanceSchedule,
  validateGovernanceWorkflowRun,
  validateGovernanceIssueComment,
  validateGovernancePullRequestReview,
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
      status: 'completed',
      conclusion: 'success',
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

test('accepts the expected CI workflow for a review signal', () => {
  const result = validateGovernanceWorkflowRun({
    ...context,
    event: event({ event: 'pull_request_review' }),
  });

  assert.deepEqual(result, {
    workflowRunId: 123,
    repository,
    sourceEvent: 'pull_request_review',
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

test('rejects unsupported workflow run event origins', () => {
  assert.throws(
    () =>
      validateGovernanceWorkflowRun({
        ...context,
        event: event({ event: 'push' }),
      }),
    /Untrusted or unsupported/,
  );
});

test('accepts PR issue-comment events as trusted reevaluation signals', () => {
  const event = {
    action: 'created',
    repository: { full_name: repository },
    issue: {
      number: 28,
      pull_request: {
        url: 'https://api.github.com/repos/EQ-LABS-TECH/ee-monorepo/pulls/28',
      },
    },
    comment: { id: 123, user: { login: 'edus-architecture' } },
  };

  assert.deepEqual(validateGovernanceIssueComment({ event, expectedRepository: repository }), {
    repository,
    number: 28,
    sourceEvent: 'issue_comment',
  });
});

test('accepts submitted reviews for pull requests targeting main', () => {
  const event = {
    action: 'submitted',
    repository: { full_name: repository },
    pull_request: {
      number: 51,
      base: { ref: 'main', repo: { full_name: repository } },
    },
    review: { id: 456, state: 'approved' },
  };

  assert.deepEqual(validateGovernancePullRequestReview({ event, expectedRepository: repository }), {
    repository,
    number: 51,
    sourceEvent: 'pull_request_review',
  });
});

test('rejects review signals for another repository or non-main pull requests', () => {
  const event = {
    action: 'submitted',
    repository: { full_name: repository },
    pull_request: {
      number: 51,
      base: { ref: 'develop', repo: { full_name: repository } },
    },
    review: { id: 456, state: 'approved' },
  };

  assert.throws(
    () => validateGovernancePullRequestReview({ event, expectedRepository: repository }),
    /Invalid governance PR review context/,
  );
  assert.throws(
    () =>
      validateGovernancePullRequestReview({
        event: { ...event, repository: { full_name: 'OTHER/repo' } },
        expectedRepository: repository,
      }),
    /Invalid governance PR review context/,
  );
});

test('rejects issue comments that are not for a pull request in the trusted repository', () => {
  const event = {
    action: 'created',
    repository: { full_name: repository },
    issue: { number: 28 },
    comment: { id: 123, user: { login: 'edus-architecture' } },
  };

  assert.throws(
    () => validateGovernanceIssueComment({ event, expectedRepository: repository }),
    /Invalid governance PR comment context/,
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
