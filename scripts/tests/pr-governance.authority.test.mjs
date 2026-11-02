import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePrGovernanceClassification } from '@eq-labs/governance/pr-governance/authority';

const headSha = 'a'.repeat(40);
const classificationComment = (login = 'architect', sha = headSha, bodyOverride) => ({
  login,
  body: bodyOverride ?? `EE-LABS-IMPACT: ORDINARY\nHEAD: ${sha}`,
});

function evidence(overrides = {}) {
  return {
    criticalIndicatorsPresent: false,
    author: 'contributor',
    headSha,
    classificationComments: [classificationComment()],
    permissions: [{ reviewer: 'architect', hasWriteAccess: true }],
    memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: true }],
    ...overrides,
  };
}

test('authorizes ORDINARY from a separate HEAD-bound Architecture classification comment', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence()), {
    classification: 'ORDINARY',
    classificationAuthorized: true,
    authorizedClassifiers: ['architect'],
  });
});

test('critical path indicators take precedence over an ordinary classification comment', () => {
  assert.deepEqual(
    resolvePrGovernanceClassification(evidence({ criticalIndicatorsPresent: true })),
    {
      classification: 'CRITICAL',
      classificationAuthorized: true,
      authorizedClassifiers: [],
    },
  );
});

test('keeps classification pending without write access or active Architecture membership', () => {
  const noWriteAccess = resolvePrGovernanceClassification(
    evidence({ permissions: [{ reviewer: 'architect', hasWriteAccess: false }] }),
  );
  const noMembership = resolvePrGovernanceClassification(
    evidence({ memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: false }] }),
  );

  assert.equal(noWriteAccess.classification, 'PENDING_REVIEW');
  assert.equal(noWriteAccess.classificationAuthorized, false);
  assert.deepEqual(noWriteAccess.authorizedClassifiers, []);
  assert.equal(noMembership.classification, 'PENDING_REVIEW');
  assert.deepEqual(noMembership.authorizedClassifiers, []);
});

test('requires a current HEAD-bound comment and rejects author or bot declarations', () => {
  for (const declaration of [
    classificationComment('architect', 'b'.repeat(40)),
    classificationComment('contributor'),
    classificationComment('dependabot[bot]'),
    classificationComment('architect', headSha, 'EE-LABS-IMPACT: ORDINARY'),
  ]) {
    const result = resolvePrGovernanceClassification(
      evidence({ classificationComments: [declaration] }),
    );
    assert.equal(result.classification, 'PENDING_REVIEW');
    assert.equal(result.classificationAuthorized, false);
  }
});

test('keeps classification pending without a declaration', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence({ classificationComments: [] })), {
    classification: 'PENDING_REVIEW',
    classificationAuthorized: false,
    authorizedClassifiers: [],
  });
});
