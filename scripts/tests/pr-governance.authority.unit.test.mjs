import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePrGovernanceClassification } from '@eq-labs/governance/pr-governance/authority';

const headSha = 'a'.repeat(40);
const escalation = (login = 'architect', sha = headSha, rationale = 'Public contract impact') => ({
  login,
  body: `EE-LABS-IMPACT: CRITICAL\nHEAD: ${sha}\nRATIONALE: ${rationale}`,
});

function evidence(overrides = {}) {
  return {
    criticalIndicatorsPresent: false,
    impactEvidenceComplete: true,
    author: 'contributor',
    headSha,
    classificationComments: [escalation()],
    permissions: [{ reviewer: 'architect', hasWriteAccess: true }],
    memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: true }],
    ...overrides,
  };
}

test('complete noncritical path evidence defaults to ORDINARY without Architecture evidence', () => {
  assert.deepEqual(
    resolvePrGovernanceClassification(
      evidence({ classificationComments: [], permissions: [], memberships: [] }),
    ),
    { classification: 'ORDINARY', classificationAuthorized: true, authorizedEscalators: [] },
  );
});

test('authorizes critical escalation only from a qualified HEAD-bound Architecture member', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence()), {
    classification: 'CRITICAL',
    classificationAuthorized: true,
    authorizedEscalators: [{ reviewer: 'architect', rationale: 'Public contract impact' }],
  });
});

test('automatic critical indicators cannot be downgraded by comments', () => {
  assert.deepEqual(
    resolvePrGovernanceClassification(evidence({ criticalIndicatorsPresent: true })),
    { classification: 'CRITICAL', classificationAuthorized: true, authorizedEscalators: [] },
  );
});

test('ignores escalations without current HEAD, rationale, valid author, or active authority', () => {
  for (const comment of [
    escalation('architect', 'b'.repeat(40)),
    escalation('contributor'),
    escalation('dependabot[bot]'),
    escalation('architect', headSha, '  '),
  ]) {
    const result = resolvePrGovernanceClassification(
      evidence({ classificationComments: [comment] }),
    );
    assert.equal(result.classification, 'ORDINARY');
    assert.deepEqual(result.authorizedEscalators, []);
  }
  const revoked = resolvePrGovernanceClassification(
    evidence({ memberships: [{ reviewer: 'architect', teamSlug: 'architecture', active: false }] }),
  );
  assert.equal(revoked.classification, 'ORDINARY');
});

test('keeps classification pending when path evidence is incomplete', () => {
  assert.deepEqual(resolvePrGovernanceClassification(evidence({ impactEvidenceComplete: false })), {
    classification: 'PENDING_REVIEW',
    classificationAuthorized: false,
    authorizedEscalators: [],
  });
});

test('rejects malformed classification inputs', () => {
  assert.throws(() => resolvePrGovernanceClassification(evidence({ headSha: 'bad' })), TypeError);
});
