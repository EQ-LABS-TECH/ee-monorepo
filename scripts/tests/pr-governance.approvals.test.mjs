import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePrApprovals, evaluateReviewerAuthority } from '../lib/pr-governance.approvals.mjs';

const sha = 'a'.repeat(40);
const review = (
  login,
  state = 'APPROVED',
  commitId = sha,
  submittedAt = '2026-10-28T10:00:00Z',
  sequence = 1,
) => ({ login, state, commitId, submittedAt, sequence });
const run = (reviews, critical = false) =>
  evaluatePrApprovals({ author: 'author', headSha: sha, reviews, critical });

test('ordinary PR passes with one independent current approval', () => {
  assert.equal(run([review('reviewer')]).status, 'PASS');
});

test('critical PR requires two independent current approvals', () => {
  assert.equal(run([review('reviewer')], true).status, 'BLOCKED');
  assert.equal(run([review('reviewer'), review('reviewer2')], true).status, 'PASS');
});

test('author cannot self-approve and repeat approvals do not multiply', () => {
  assert.equal(
    run([review('author'), review('reviewer'), review('REVIEWER')], true).approvedCount,
    1,
  );
});

test('dismissal or changed review invalidates preceding approval', () => {
  const reviews = [
    review('reviewer'),
    review('reviewer', 'DISMISSED', sha, '2026-10-28T11:00:00Z', 2),
  ];
  assert.equal(run(reviews).status, 'BLOCKED');
});

test('stale review commit is rejected', () => {
  assert.equal(run([review('reviewer', 'APPROVED', 'b'.repeat(40))]).status, 'BLOCKED');
});

test('malformed evidence fails closed', () => {
  assert.throws(() => run([{ state: 'APPROVED' }]), TypeError);
});

test('unknown review states fail closed', () => {
  for (const state of ['UNKNOWN', 'PENDING', '']) {
    assert.throws(() => run([review('reviewer', state)]), TypeError);
  }
});

test('invalid review sequences fail closed', () => {
  for (const sequence of [undefined, null, -1, 1.5, NaN, Infinity, '1']) {
    const invalidReview = {
      ...review('reviewer'),
      sequence,
    };

    assert.throws(() => run([invalidReview]), TypeError);
  }
});

test('changes requested after approval invalidates that reviewer', () => {
  const reviews = [
    review('reviewer', 'APPROVED', sha, '2026-10-28T10:00:00Z', 0),
    review('reviewer', 'CHANGES_REQUESTED', sha, '2026-10-28T11:00:00Z', 1),
  ];

  const result = run(reviews);

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.approvedCount, 0);
});

test('reviews with identical timestamps use sequence as tiebreaker', () => {
  const timestamp = '2026-10-28T10:00:00Z';

  const reviews = [
    review('reviewer', 'APPROVED', sha, timestamp, 0),
    review('reviewer', 'DISMISSED', sha, timestamp, 1),
  ];

  const result = run(reviews);

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.approvedCount, 0);
});

test('review ordering uses submission time rather than input position', () => {
  const reviews = [
    review('reviewer', 'DISMISSED', sha, '2026-10-28T11:00:00Z', 1),
    review('reviewer', 'APPROVED', sha, '2026-10-28T10:00:00Z', 0),
  ];

  const result = run(reviews);

  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.approvedCount, 0);
});

test('approval details reflect only the latest review per reviewer', () => {
  const result = run([
    {
      ...review('reviewer', 'APPROVED', sha, '2026-10-28T10:00:00Z', 0),
      body: 'EE-LABS-IMPACT: ORDINARY',
    },
    {
      ...review('reviewer', 'APPROVED', sha, '2026-10-28T11:00:00Z', 1),
      body: '',
    },
  ]);

  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.approvedReviewDetails, [
    {
      reviewer: 'reviewer',
      commitId: sha,
      body: '',
    },
  ]);
});

const authorityEvidence = () => ({
  candidate: {
    reviewer: 'reviewer',
    hasWriteAccess: true,
  },
  approvedReviewers: ['reviewer'],
  responsibleTeams: ['maintainers'],
  memberships: [
    {
      reviewer: 'reviewer',
      teamSlug: 'maintainers',
      active: true,
    },
  ],
});

test('matches independent approval and active responsible membership', () => {
  const result = evaluateReviewerAuthority(authorityEvidence());

  assert.equal(result.status, 'ELIGIBLE_EVIDENCE');
  assert.deepEqual(result.matchedTeams, ['maintainers']);
});

test('reviewer without current approval is not eligible', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    approvedReviewers: [],
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.reason, 'current-approval-not-verified');
});

test('read-only reviewer is not eligible', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    candidate: {
      reviewer: 'reviewer',
      hasWriteAccess: false,
    },
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.reason, 'repository-write-access-required');
});

test('unverified ownership cannot establish reviewer authority', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    responsibleTeams: [],
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.equal(result.reason, 'responsible-ownership-not-verified');
});

test('membership in an unrelated team is insufficient', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    memberships: [
      {
        reviewer: 'reviewer',
        teamSlug: 'contributors',
        active: true,
      },
    ],
  });

  assert.equal(result.status, 'UNVERIFIED');
  assert.deepEqual(result.matchedTeams, []);
});

test('pending membership cannot establish authority', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    memberships: [
      {
        reviewer: 'reviewer',
        teamSlug: 'maintainers',
        active: false,
      },
    ],
  });

  assert.equal(result.status, 'UNVERIFIED');
});

test('another users team membership cannot establish authority', () => {
  const result = evaluateReviewerAuthority({
    ...authorityEvidence(),
    memberships: [
      {
        reviewer: 'another-user',
        teamSlug: 'maintainers',
        active: true,
      },
    ],
  });

  assert.equal(result.status, 'UNVERIFIED');
});

test('malformed authority evidence is rejected', () => {
  assert.throws(
    () =>
      evaluateReviewerAuthority({
        ...authorityEvidence(),
        memberships: [{ teamSlug: 'maintainers', active: true }],
      }),
    TypeError,
  );
});
