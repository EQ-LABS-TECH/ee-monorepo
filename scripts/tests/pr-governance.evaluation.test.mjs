import test from 'node:test';
import assert from 'node:assert/strict';

import { composePrGovernanceEvaluation } from '@eq-labs/governance/pr-governance/evaluation';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

function input(overrides = {}) {
  return {
    pullRequestEvidence: { headSha, baseSha },
    criticalIndicators: { criticalIndicatorsPresent: false, reasons: [] },
    approvalEvidence: {
      approvedReviewDetails: [{ reviewer: 'architect', body: 'EE-LABS-IMPACT: ORDINARY' }],
    },
    ownershipEvidence: {
      ownershipVerified: true,
      qualifiedReviewers: ['architect'],
      coverage: [],
      uncoveredPaths: [],
    },
    permissions: [{ reviewer: 'architect', hasWriteAccess: true }],
    memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: true }],
    evidenceCurrent: true,
    ...overrides,
  };
}

test('composes an ordinary passing result from verified domain evidence', () => {
  const result = composePrGovernanceEvaluation(input());

  assert.equal(result.mode, 'EVALUATION_ONLY');
  assert.equal(result.headSha, headSha);
  assert.equal(result.baseSha, baseSha);
  assert.equal(result.classification, 'ORDINARY');
  assert.deepEqual(result.authorizedOrdinaryReviewers, ['architect']);
  assert.equal(result.decision.status, 'PASS');
});

test('composes pending classification as blocked', () => {
  const result = composePrGovernanceEvaluation(
    input({ approvalEvidence: { approvedReviewDetails: [] } }),
  );

  assert.equal(result.classification, 'PENDING_REVIEW');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.deepEqual(result.decision.reasons, ['impact-classification-pending']);
});

test('blocks critical changes without the required qualified approvals', () => {
  const result = composePrGovernanceEvaluation(
    input({
      criticalIndicators: {
        criticalIndicatorsPresent: true,
        reasons: [{ category: 'github-governance', path: '.github/CODEOWNERS' }],
      },
    }),
  );

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.ok(result.decision.reasons.includes('insufficient-qualified-approvals'));
});

test('blocks a decision when the caller cannot establish current evidence', () => {
  const result = composePrGovernanceEvaluation(input({ evidenceCurrent: false }));

  assert.equal(result.decision.status, 'BLOCKED');
  assert.ok(result.decision.reasons.includes('evidence-not-current'));
});
