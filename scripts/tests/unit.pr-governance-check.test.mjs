import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPrGovernanceCheckPayload,
  PR_GOVERNANCE_CHECK_NAME,
} from '@eq-labs/governance/pr-governance/check';

const headSha = 'a'.repeat(40);

function evaluation(classification, status) {
  return {
    mode: 'EVALUATION_ONLY',
    headSha,
    classification,
    decision: { status },
  };
}

test('publishes ordinary PASS only for the expected HEAD', () => {
  const payload = createPrGovernanceCheckPayload({
    evaluation: evaluation('ORDINARY', 'PASS'),
    expectedHeadSha: headSha,
  });

  assert.equal(payload.name, PR_GOVERNANCE_CHECK_NAME);
  assert.equal(payload.head_sha, headSha);
  assert.equal(payload.status, 'completed');
  assert.equal(payload.conclusion, 'success');
});

test('critical PASS maps to success', () => {
  const payload = createPrGovernanceCheckPayload({
    evaluation: evaluation('CRITICAL', 'PASS'),
    expectedHeadSha: headSha,
  });

  assert.equal(payload.conclusion, 'success');
});

test('blocked governance maps to failure', () => {
  for (const classification of ['CRITICAL', 'ORDINARY', 'PENDING_REVIEW']) {
    const payload = createPrGovernanceCheckPayload({
      evaluation: evaluation(classification, 'BLOCKED'),
      expectedHeadSha: headSha,
    });

    assert.equal(payload.conclusion, 'failure');
  }
});

test('check summaries render the renamed GitHub team slugs', () => {
  const teamLabels = [
    ['ee-labs-architecture', 'EE-Labs Architecture'],
    ['ee-labs-repository-admin', 'EE-Labs Repository Admin'],
    ['ee-labs-maintainers', 'EE-Labs Maintainers'],
    ['ee-labs-contributors', 'EE-Labs Contributors'],
  ];

  for (const [teamSlug, label] of teamLabels) {
    const payload = createPrGovernanceCheckPayload({
      evaluation: {
        ...evaluation('ORDINARY', 'BLOCKED'),
        decision: {
          status: 'BLOCKED',
          qualifiedApprovalCount: 0,
          requiredCount: 2,
          reasons: [],
        },
        ownershipEvidence: {
          coverage: [{ eligibleTeams: [teamSlug], covered: false }],
        },
      },
      expectedHeadSha: headSha,
    });

    assert.match(payload.output.summary, new RegExp(`Required reviewer team: ${label}`));
  }
});

test('cannot publish an evaluation for a different HEAD', () => {
  assert.throws(
    () =>
      createPrGovernanceCheckPayload({
        evaluation: evaluation('ORDINARY', 'PASS'),
        expectedHeadSha: 'b'.repeat(40),
      }),
    /Invalid PR governance check evidence/,
  );
});

test('pending classification can never publish success', () => {
  assert.throws(
    () =>
      createPrGovernanceCheckPayload({
        evaluation: evaluation('PENDING_REVIEW', 'PASS'),
        expectedHeadSha: headSha,
      }),
    /Pending classification cannot produce a successful check/,
  );
});

test('malformed evaluation cannot publish a check', () => {
  assert.throws(
    () =>
      createPrGovernanceCheckPayload({
        evaluation: {
          mode: 'ADVISORY',
          headSha,
          classification: 'ORDINARY',
          decision: { status: 'PASS' },
        },
        expectedHeadSha: headSha,
      }),
    /Invalid PR governance check evidence/,
  );
});
