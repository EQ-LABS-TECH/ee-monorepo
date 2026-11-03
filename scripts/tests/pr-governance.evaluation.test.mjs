import test from 'node:test';
import assert from 'node:assert/strict';

import { composePrGovernanceEvaluation } from '@eq-labs/governance/pr-governance/evaluation';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);
const classificationComment = {
  id: 1,
  login: 'architect',
  body: `EE-LABS-IMPACT: ORDINARY\nHEAD: ${headSha}`,
  createdAt: '2026-10-29T00:00:00Z',
  updatedAt: '2026-10-29T00:00:00Z',
  sequence: 0,
};

function input(overrides = {}) {
  return {
    pullRequestEvidence: {
      headSha,
      baseSha,
      author: 'contributor',
      classificationComments: [classificationComment],
    },
    criticalIndicators: { criticalIndicatorsPresent: false, evidenceComplete: true, reasons: [] },
    approvalEvidence: {
      approvedReviewDetails: [{ reviewer: 'reviewer', body: 'Looks good' }],
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
  assert.deepEqual(result.authorizedEscalators, []);
  assert.equal(result.decision.status, 'PASS');
});

test('composes incomplete path evidence as pending and blocked', () => {
  const result = composePrGovernanceEvaluation(
    input({
      pullRequestEvidence: { headSha, baseSha, author: 'contributor', classificationComments: [] },
      criticalIndicators: {
        criticalIndicatorsPresent: false,
        evidenceComplete: false,
        reasons: [],
      },
      approvalEvidence: {
        approvedReviewDetails: [{ reviewer: 'reviewer', body: 'EE-LABS-IMPACT: ORDINARY' }],
      },
    }),
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
        evidenceComplete: true,
        reasons: [{ category: 'github-governance', path: '.github/CODEOWNERS' }],
      },
    }),
  );

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.ok(result.decision.reasons.includes('insufficient-qualified-approvals'));
});

test('requires two qualified approvals when Architecture escalates the impact to critical', () => {
  const result = composePrGovernanceEvaluation(
    input({
      pullRequestEvidence: {
        headSha,
        baseSha,
        author: 'contributor',
        classificationComments: [
          {
            ...classificationComment,
            body: `EE-LABS-IMPACT: CRITICAL\nHEAD: ${headSha}\nRATIONALE: Cross-cutting security impact`,
          },
        ],
      },
      ownershipEvidence: {
        ownershipVerified: true,
        qualifiedReviewers: ['architect'],
        coverage: [],
        uncoveredPaths: [],
      },
    }),
  );

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.requiredCount, 2);
  assert.equal(result.decision.status, 'BLOCKED');
  assert.ok(result.decision.reasons.includes('insufficient-qualified-approvals'));
});

test('blocks a decision when the caller cannot establish current evidence', () => {
  const result = composePrGovernanceEvaluation(input({ evidenceCurrent: false }));

  assert.equal(result.decision.status, 'BLOCKED');
  assert.ok(result.decision.reasons.includes('evidence-not-current'));
});
