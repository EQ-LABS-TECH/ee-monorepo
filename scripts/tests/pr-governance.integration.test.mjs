import test from 'node:test';
import assert from 'node:assert/strict';
import { readPullRequestEvidence } from '../lib/pr-governance.evidence.mjs';
import { classifyCriticalChange } from '../lib/pr-governance.classification.mjs';
import { evaluatePrApprovals } from '../lib/pr-governance.approvals.mjs';

const headSha = 'a'.repeat(40);
const base = {
  number: 42,
  user: { login: 'author' },
  head: {
    sha: headSha,
    repo: { full_name: 'author/ee-monorepo' },
  },
  base: {
    ref: 'main',
    repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
  },
};
const approval = (login, state = 'APPROVED', commitId = headSha, second = 0) => ({
  user: { login },
  state,
  commit_id: commitId,
  submitted_at: `2026-10-29T00:00:${String(second).padStart(2, '0')}Z`,
});
const locator = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  token: 'fixture-token',
};
function responseFor({ paths, reviews, pr = base, brokenEndpoint } = {}) {
  return async (url, options) => {
    assert.equal(options.method, 'GET');
    const endpoint = url.includes('/files?')
      ? 'files'
      : url.includes('/reviews?')
        ? 'reviews'
        : 'pr';
    if (endpoint === brokenEndpoint) return { ok: false, status: 403 };
    const data =
      endpoint === 'files'
        ? paths.map((filename) => ({ filename }))
        : endpoint === 'reviews'
          ? reviews
          : pr;
    return { ok: true, json: async () => data };
  };
}
async function snapshot({ paths, reviews, brokenEndpoint }) {
  const evidence = await readPullRequestEvidence({
    ...locator,
    fetchImpl: responseFor({ paths, reviews, brokenEndpoint }),
  });
  const classification = classifyCriticalChange(evidence.paths);
  return { evidence, classification };
}
function evaluate(evidence, critical) {
  return evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical,
  });
}

test('ordinary PR: one independent approval meets numerical threshold only', async () => {
  const { evidence, classification } = await snapshot({
    paths: ['README.md'],
    reviews: [approval('reviewer-a')],
  });
  assert.equal(classification.criticalIndicatorsPresent, false);
  assert.equal(classification.requiresImpactReview, true);
  assert.equal(evidence.advisoryOnly, true);
  const result = evaluate(evidence, false);
  assert.equal(result.status, 'PASS');
  assert.equal(result.approvedCount, 1);
});

test('critical route: one approval blocked and two independent approvals pass threshold', async () => {
  const one = await snapshot({
    paths: ['.github/CODEOWNERS'],
    reviews: [approval('reviewer-a')],
  });
  assert.equal(one.classification.criticalIndicatorsPresent, true);
  assert.equal(evaluate(one.evidence, true).status, 'BLOCKED');
  const two = await snapshot({
    paths: ['.github/CODEOWNERS'],
    reviews: [approval('reviewer-a'), approval('reviewer-b')],
  });
  assert.equal(evaluate(two.evidence, true).status, 'PASS');
  assert.equal(evaluate(two.evidence, true).requiredCount, 2);
});

test('new changes or dismissed reviews invalidate previous approval evidence', async () => {
  const { evidence } = await snapshot({
    paths: ['infra/deploy.yml'],
    reviews: [
      approval('reviewer-a'),
      approval('reviewer-a', 'DISMISSED', headSha, 1),
      approval('reviewer-b', 'APPROVED', 'b'.repeat(40)),
    ],
  });
  assert.equal(evaluate(evidence, true).approvedCount, 0);
  assert.equal(evaluate(evidence, true).status, 'BLOCKED');
});

test('self approval is never counted', async () => {
  const { evidence } = await snapshot({
    paths: ['scripts/commands/release'],
    reviews: [approval('author'), approval('reviewer-a')],
  });
  assert.equal(evaluate(evidence, true).approvedCount, 1);
  assert.equal(evaluate(evidence, true).status, 'BLOCKED');
});

test('GitHub API failure prevents producing any review decision', async () => {
  await assert.rejects(
    snapshot({ paths: ['README.md'], reviews: [], brokenEndpoint: 'reviews' }),
    /HTTP 403/,
  );
});

test('impact is unresolved for ordinary-looking paths', async () => {
  const { evidence, classification } = await snapshot({
    paths: ['packages/execution/src/engine.ts'],
    reviews: [approval('reviewer-a')],
  });
  assert.equal(classification.criticalIndicatorsPresent, false);
  assert.equal(classification.requiresImpactReview, true);
  // Do not automatically pass `critical: false` to a production enforcement decision.
  assert.equal(evidence.advisoryOnly, true);
});
