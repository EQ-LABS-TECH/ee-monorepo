import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPrGovernanceCheckPayload,
  PR_GOVERNANCE_CHECK_NAME,
} from '../lib/pr-governance.check.mjs';

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
