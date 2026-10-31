import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluatePrGovernanceEnforcement } from '../lib/pr-governance.enforcement.mjs';

const verified = {
  classification: 'ORDINARY',
  classificationAuthorized: true,
  qualifiedReviewers: ['reviewer1'],
  ownershipVerified: true,
  evidenceCurrent: true,
};

test('ordinary change passes with one qualified approval and authorized classification', () => {
  const result = evaluatePrGovernanceEnforcement(verified);

  assert.equal(result.status, 'PASS');
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.requiredCount, 1);
  assert.equal(result.qualifiedApprovalCount, 1);
  assert.deepEqual(result.reasons, []);
});

test('ordinary change without architecture authorization is blocked', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classificationAuthorized: false,
  });

  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('ordinary-classification-not-authorized'));
});

test('critical change with one qualified approval is blocked', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classification: 'CRITICAL',
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.requiredCount, 2);
  assert.ok(result.reasons.includes('insufficient-qualified-approvals'));
});

test('critical change passes with two qualified approvals', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classification: 'CRITICAL',
    classificationAuthorized: false,
    qualifiedReviewers: ['reviewer1', 'reviewer2'],
  });

  assert.equal(result.status, 'PASS');
  assert.equal(result.requiredCount, 2);
  assert.equal(result.qualifiedApprovalCount, 2);
});

test('critical change cannot use ordinary authorization to reduce threshold', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classification: 'CRITICAL',
    qualifiedReviewers: ['reviewer1'],
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.requiredCount, 2);
});

test('pending classification is blocked even with multiple approvals', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classification: 'PENDING_REVIEW',
    qualifiedReviewers: ['reviewer1', 'reviewer2'],
  });

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.requiredCount, null);
  assert.ok(result.reasons.includes('impact-classification-pending'));
});

test('unverified ownership blocks ordinary changes', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    ownershipVerified: false,
  });

  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('codeowner-eligibility-not-verified'));
});

test('unverified ownership blocks critical changes', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    classification: 'CRITICAL',
    qualifiedReviewers: ['reviewer1', 'reviewer2'],
    ownershipVerified: false,
  });

  assert.equal(result.status, 'BLOCKED');
});

test('stale evidence blocks otherwise sufficient reviews', () => {
  const result = evaluatePrGovernanceEnforcement({
    ...verified,
    evidenceCurrent: false,
  });

  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('evidence-not-current'));
});

test('duplicate reviewer identities cannot inflate approval counts', () => {
  assert.throws(
    () =>
      evaluatePrGovernanceEnforcement({
        ...verified,
        qualifiedReviewers: ['Reviewer1', 'reviewer1'],
      }),
    /Qualified reviewers must be unique/,
  );
});

test('rejects unsupported classifications', () => {
  assert.throws(
    () =>
      evaluatePrGovernanceEnforcement({
        ...verified,
        classification: 'LOW',
      }),
    TypeError,
  );
});

test('rejects incomplete evidence', () => {
  assert.throws(
    () =>
      evaluatePrGovernanceEnforcement({
        ...verified,
        evidenceCurrent: undefined,
      }),
    TypeError,
  );
});
