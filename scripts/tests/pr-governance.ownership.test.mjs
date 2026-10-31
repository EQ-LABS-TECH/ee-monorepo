import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluatePrOwnership } from '../lib/pr-governance.ownership.mjs';
import { evaluatePrGovernanceEnforcement } from '../lib/pr-governance.enforcement.mjs';

const requirements = [
  {
    path: '.github/workflows/ci.yml',
    eligibleTeams: ['architecture', 'repository-admin'],
  },
  {
    path: 'scripts/lib/example.mjs',
    eligibleTeams: ['repository-admin', 'maintainers'],
  },
];

const permissions = [
  { reviewer: 'architect', hasWriteAccess: true },
  { reviewer: 'maintainer', hasWriteAccess: true },
  { reviewer: 'outsider', hasWriteAccess: true },
];

const memberships = [
  { reviewer: 'architect', teamSlug: 'architecture', active: true },
  { reviewer: 'maintainer', teamSlug: 'maintainers', active: true },
  { reviewer: 'outsider', teamSlug: 'contributors', active: true },
];

function evaluate(overrides = {}) {
  return evaluatePrOwnership({
    requirements,
    approvedReviewers: ['architect', 'maintainer'],
    permissions,
    memberships,
    ...overrides,
  });
}

test('verifies mixed ownership when all paths are covered', () => {
  const result = evaluate();

  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.ownershipVerified, true);
  assert.deepEqual(result.uncoveredPaths, []);
  assert.deepEqual(result.qualifiedReviewers, ['architect', 'maintainer']);
});

test('blocks ownership when one path has no qualified reviewer', () => {
  const result = evaluate({
    approvedReviewers: ['architect'],
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.ownershipVerified, false);
  assert.deepEqual(result.uncoveredPaths, ['scripts/lib/example.mjs']);
  assert.deepEqual(result.qualifiedReviewers, ['architect']);
});

test('repository write permission alone does not establish ownership', () => {
  const result = evaluate({
    approvedReviewers: ['outsider'],
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.deepEqual(result.qualifiedReviewers, []);
  assert.equal(result.uncoveredPaths.length, 2);
});

test('inactive team membership cannot satisfy ownership', () => {
  const result = evaluate({
    memberships: memberships.map((membership) =>
      membership.reviewer === 'architect' ? { ...membership, active: false } : membership,
    ),
  });

  assert.equal(result.ownershipVerified, false);
  assert.deepEqual(result.uncoveredPaths, ['.github/workflows/ci.yml']);
});

test('read-only access cannot satisfy ownership', () => {
  const result = evaluate({
    permissions: permissions.map((permission) =>
      permission.reviewer === 'architect' ? { ...permission, hasWriteAccess: false } : permission,
    ),
  });

  assert.equal(result.ownershipVerified, false);
  assert.deepEqual(result.uncoveredPaths, ['.github/workflows/ci.yml']);
});

test('one qualified reviewer may cover multiple files', () => {
  const result = evaluate({
    approvedReviewers: ['architect'],
    memberships: [
      {
        reviewer: 'architect',
        teamSlug: 'architecture',
        active: true,
      },
      {
        reviewer: 'architect',
        teamSlug: 'maintainers',
        active: true,
      },
    ],
  });

  assert.equal(result.ownershipVerified, true);
  assert.deepEqual(result.qualifiedReviewers, ['architect']);
});

test('duplicate permission evidence is rejected', () => {
  assert.throws(
    () =>
      evaluate({
        permissions: [...permissions, { reviewer: 'ARCHITECT', hasWriteAccess: true }],
      }),
    /Duplicate reviewer permission evidence/,
  );
});

test('missing ownership requirements cannot be verified', () => {
  assert.throws(() => evaluate({ requirements: [] }), TypeError);
});

test('ordinary enforcement accepts one qualified owner reviewer', () => {
  const ownership = evaluate({
    approvedReviewers: ['architect'],
    requirements: [requirements[0]],
  });

  const decision = evaluatePrGovernanceEnforcement({
    classification: 'ORDINARY',
    classificationAuthorized: true,
    qualifiedReviewers: ownership.qualifiedReviewers,
    ownershipVerified: ownership.ownershipVerified,
    evidenceCurrent: true,
  });

  assert.equal(decision.status, 'PASS');
  assert.equal(decision.requiredCount, 1);
});

test('critical enforcement requires two qualified reviewers', () => {
  const ownership = evaluate();

  const decision = evaluatePrGovernanceEnforcement({
    classification: 'CRITICAL',
    classificationAuthorized: false,
    qualifiedReviewers: ownership.qualifiedReviewers,
    ownershipVerified: ownership.ownershipVerified,
    evidenceCurrent: true,
  });

  assert.equal(decision.status, 'PASS');
  assert.equal(decision.requiredCount, 2);
});

test('critical enforcement rejects one reviewer covering all paths', () => {
  const ownership = evaluate({
    approvedReviewers: ['architect'],
    memberships: [
      { reviewer: 'architect', teamSlug: 'architecture', active: true },
      { reviewer: 'architect', teamSlug: 'maintainers', active: true },
    ],
  });

  const decision = evaluatePrGovernanceEnforcement({
    classification: 'CRITICAL',
    classificationAuthorized: false,
    qualifiedReviewers: ownership.qualifiedReviewers,
    ownershipVerified: ownership.ownershipVerified,
    evidenceCurrent: true,
  });

  assert.equal(ownership.ownershipVerified, true);
  assert.equal(decision.status, 'BLOCKED');
  assert.ok(decision.reasons.includes('insufficient-qualified-approvals'));
});

test('pending impact classification remains blocked with full ownership', () => {
  const ownership = evaluate();

  const decision = evaluatePrGovernanceEnforcement({
    classification: 'PENDING_REVIEW',
    classificationAuthorized: false,
    qualifiedReviewers: ownership.qualifiedReviewers,
    ownershipVerified: ownership.ownershipVerified,
    evidenceCurrent: true,
  });

  assert.equal(decision.status, 'BLOCKED');
  assert.ok(decision.reasons.includes('impact-classification-pending'));
});

test('uncovered paths block enforcement despite two reviewers', () => {
  const ownership = evaluate({
    requirements: [
      ...requirements,
      {
        path: 'docs/validation/report.md',
        eligibleTeams: ['repository-admin'],
      },
    ],
  });

  const decision = evaluatePrGovernanceEnforcement({
    classification: 'CRITICAL',
    classificationAuthorized: false,
    qualifiedReviewers: ownership.qualifiedReviewers,
    ownershipVerified: ownership.ownershipVerified,
    evidenceCurrent: true,
  });

  assert.equal(ownership.ownershipVerified, false);
  assert.equal(decision.status, 'BLOCKED');
  assert.ok(decision.reasons.includes('codeowner-eligibility-not-verified'));
});
