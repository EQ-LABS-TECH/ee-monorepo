import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPrGovernance } from '../lib/pr-governance.inspect.mjs';

const sha = 'a'.repeat(40);
const pr = {
  number: 7,
  user: { login: 'author' },
  head: {
    sha,
    repo: { full_name: 'author/ee-monorepo' },
  },
  base: {
    ref: 'main',
    repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
  },
};
const review = {
  user: { login: 'reviewer' },
  state: 'APPROVED',
  commit_id: sha,
  submitted_at: '2026-10-29T01:00:00Z',
};
const options = { owner: 'EQ-LABS-TECH', repo: 'ee-monorepo', number: 7, token: 'fake' };
function fixture(paths, reviews = [review]) {
  return async (url, init) => {
    assert.equal(init.method, 'GET');
    return {
      ok: true,
      status: 200,
      json: async () =>
        url.includes('/files?')
          ? paths.map((filename) => ({ filename }))
          : url.includes('/reviews?')
            ? reviews
            : pr,
    };
  };
}
test('critical one-approval evidence remains PENDING', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(['.github/CODEOWNERS']),
  });
  assert.equal(report.mode, 'ADVISORY');
  assert.equal(report.status, 'PENDING');
  assert.equal(report.classification.criticalIndicatorsPresent, true);
  assert.equal(report.approvalEvidence.status, 'BLOCKED');
});
test('ordinary-looking path with one approval remains PENDING', async () => {
  const report = await inspectPrGovernance({ ...options, fetchImpl: fixture(['README.md']) });
  assert.equal(report.status, 'PENDING');
  assert.equal(report.approvalEvidence.status, 'PASS');
  assert.equal(report.classification.requiresImpactReview, true);
});
test('two approvals on critical path still cannot certify merge', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['.github/workflows/ci.yml'],
      [review, { ...review, user: { login: 'reviewer2' } }],
    ),
  });
  assert.equal(report.approvalEvidence.status, 'PASS');
  assert.equal(report.status, 'PENDING');
});
test('unavailable API fails closed', async () => {
  await assert.rejects(
    inspectPrGovernance({ ...options, fetchImpl: async () => ({ ok: false, status: 403 }) }),
    /HTTP 403/,
  );
});
