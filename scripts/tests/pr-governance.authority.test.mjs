import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePrGovernanceClassification } from '@eq-labs/governance/pr-governance/authority';

function evidence(overrides = {}) {
  return {
    criticalIndicatorsPresent: false,
    approvedReviewDetails: [{ reviewer: 'architect', body: 'EE-LABS-IMPACT: ORDINARY' }],
    permissions: [{ reviewer: 'architect', hasWriteAccess: true }],
    memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: true }],
    ...overrides,
  };
}

test('authorizes ordinary classification with a declaration and architecture authority', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence()), {
    classification: 'ORDINARY',
    authorizedOrdinaryReviewers: ['architect'],
  });
});

test('critical indicators take precedence over an ordinary declaration', () => {
  assert.deepEqual(
    resolvePrGovernanceClassification(evidence({ criticalIndicatorsPresent: true })),
    {
      classification: 'CRITICAL',
      authorizedOrdinaryReviewers: ['architect'],
    },
  );
});

test('keeps classification pending without verified write access or active architecture membership', () => {
  const noWriteAccess = resolvePrGovernanceClassification(
    evidence({ permissions: [{ reviewer: 'architect', hasWriteAccess: false }] }),
  );
  const noMembership = resolvePrGovernanceClassification(
    evidence({ memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: false }] }),
  );

  assert.equal(noWriteAccess.classification, 'PENDING_REVIEW');
  assert.deepEqual(noWriteAccess.authorizedOrdinaryReviewers, []);
  assert.equal(noMembership.classification, 'PENDING_REVIEW');
  assert.deepEqual(noMembership.authorizedOrdinaryReviewers, []);
});

test('keeps classification pending when no critical indicators or declaration are present', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence({ approvedReviewDetails: [] })), {
    classification: 'PENDING_REVIEW',
    authorizedOrdinaryReviewers: [],
  });
});
