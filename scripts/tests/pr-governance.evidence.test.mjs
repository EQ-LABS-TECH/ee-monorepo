import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readPullRequestEvidence,
  readReviewerRepositoryPermission,
  readReviewerTeamMembership,
} from '../lib/pr-governance.evidence.mjs';

const sha = 'a'.repeat(40);
const base = {
  number: 27,
  user: { login: 'contributor' },
  head: {
    sha,
    repo: { full_name: 'contributor/ee-monorepo' },
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
  submitted_at: '2026-10-29T00:00:00Z',
};

function mockFetch({
  pr = base,
  finalPr = pr,
  files = [{ filename: '.github/CODEOWNERS' }],
  reviews = [review],
  status = 200,
} = {}) {
  let prReads = 0;

  return async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.match(options.headers.Authorization, /^Bearer /);

    let data;

    if (url.includes('/files?')) {
      data = files;
    } else if (url.includes('/reviews?')) {
      data = reviews;
    } else {
      prReads += 1;
      data = prReads === 1 ? pr : finalPr;
    }

    return {
      ok: status === 200,
      status,
      json: async () => data,
    };
  };
}

const locator = { owner: 'EQ-LABS-TECH', repo: 'ee-monorepo', number: 27, token: 'test' };

test('normalizes PR files and reviews from GitHub without write calls', async () => {
  const evidence = await readPullRequestEvidence({ ...locator, fetchImpl: mockFetch() });
  assert.equal(evidence.author, 'contributor');
  assert.deepEqual(evidence.paths, ['.github/CODEOWNERS']);
  assert.deepEqual(evidence.reviews[0], {
    login: 'reviewer',
    state: 'APPROVED',
    commitId: sha,
    submittedAt: '2026-10-29T00:00:00Z',
    sequence: 0,
    body: '',
  });
  assert.equal(evidence.advisoryOnly, true);
});

test('preserves review body as classification evidence', async () => {
  const evidence = await readPullRequestEvidence({
    ...locator,
    fetchImpl: mockFetch({
      reviews: [
        {
          ...review,
          body: 'EE-LABS-IMPACT: ORDINARY',
        },
      ],
    }),
  });

  assert.equal(evidence.reviews[0].body, 'EE-LABS-IMPACT: ORDINARY');
});

test('rejects malformed review body', async () => {
  await assert.rejects(
    readPullRequestEvidence({
      ...locator,
      fetchImpl: mockFetch({
        reviews: [{ ...review, body: { unexpected: true } }],
      }),
    }),
    /Malformed GitHub review body/,
  );
});

test('ignores pending reviews', async () => {
  const evidence = await readPullRequestEvidence({
    ...locator,
    fetchImpl: mockFetch({ reviews: [{ ...review, state: 'PENDING', submitted_at: null }] }),
  });
  assert.deepEqual(evidence.reviews, []);
});

test('fails closed for HTTP errors and invalid PR identity', async () => {
  await assert.rejects(
    readPullRequestEvidence({ ...locator, fetchImpl: mockFetch({ status: 403 }) }),
    /HTTP 403/,
  );
  await assert.rejects(
    readPullRequestEvidence({
      ...locator,
      fetchImpl: mockFetch({
        pr: { ...base, number: 28 },
      }),
    }),
    /Invalid GitHub pull request response/,
  );
});

test('rejects a PR whose head SHA changes during evidence collection', async () => {
  await assert.rejects(
    readPullRequestEvidence({
      ...locator,
      fetchImpl: mockFetch({
        finalPr: {
          ...base,
          head: {
            ...base.head,
            sha: 'b'.repeat(40),
          },
        },
      }),
    }),
    /Pull request changed while collecting governance evidence/,
  );
});

test('rejects a PR whose source repository changes during evidence collection', async () => {
  await assert.rejects(
    readPullRequestEvidence({
      ...locator,
      fetchImpl: mockFetch({
        finalPr: {
          ...base,
          head: {
            ...base.head,
            repo: { full_name: 'other-owner/ee-monorepo' },
          },
        },
      }),
    }),
    /Pull request changed while collecting governance evidence/,
  );
});

test('rejects a PR whose target branch changes during evidence collection', async () => {
  await assert.rejects(
    readPullRequestEvidence({
      ...locator,
      fetchImpl: mockFetch({
        finalPr: {
          ...base,
          base: {
            ...base.base,
            ref: 'develop',
          },
        },
      }),
    }),
    /Pull request changed while collecting governance evidence/,
  );
});

test('rejects a PR whose identity changes during evidence collection', async () => {
  for (const finalPr of [
    { ...base, number: 28 },
    { ...base, user: { login: 'another-author' } },
    {
      ...base,
      base: {
        ...base.base,
        repo: { full_name: 'other-owner/ee-monorepo' },
      },
    },
  ]) {
    await assert.rejects(
      readPullRequestEvidence({
        ...locator,
        fetchImpl: mockFetch({ finalPr }),
      }),
      /Pull request changed while collecting governance evidence/,
    );
  }
});

test('reads effective reviewer repository permissions without write calls', async () => {
  const result = await readReviewerRepositoryPermission({
    ...locator,
    reviewer: 'reviewer',
    fetchImpl: async (url, options) => {
      assert.match(url, /\/collaborators\/reviewer\/permission$/);
      assert.equal(options.method, 'GET');
      assert.match(options.headers.Authorization, /^Bearer /);

      return {
        ok: true,
        status: 200,
        json: async () => ({
          permission: 'write',
          role_name: 'maintain',
          user: { login: 'reviewer' },
        }),
      };
    },
  });

  assert.deepEqual(result, {
    reviewer: 'reviewer',
    permission: 'write',
    roleName: 'maintain',
    hasWriteAccess: true,
  });
});

test('read-only repository permission is not sufficient for approval', async () => {
  const result = await readReviewerRepositoryPermission({
    ...locator,
    reviewer: 'reviewer',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        permission: 'read',
        role_name: 'read',
        user: { login: 'reviewer' },
      }),
    }),
  });

  assert.equal(result.hasWriteAccess, false);
});

test('reviewer permission lookup rejects mismatched identity', async () => {
  await assert.rejects(
    readReviewerRepositoryPermission({
      ...locator,
      reviewer: 'reviewer',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          permission: 'write',
          role_name: 'write',
          user: { login: 'another-user' },
        }),
      }),
    }),
    /Malformed GitHub reviewer permission response/,
  );
});

test('reviewer permission lookup fails closed on API errors', async () => {
  await assert.rejects(
    readReviewerRepositoryPermission({
      ...locator,
      reviewer: 'reviewer',
      fetchImpl: async () => ({
        ok: false,
        status: 403,
      }),
    }),
    /HTTP 403/,
  );
});

test('verifies active team membership using a read-only request', async () => {
  const membership = await readReviewerTeamMembership({
    owner: 'EQ-LABS-TECH',
    teamSlug: 'maintainers',
    reviewer: 'reviewer',
    token: 'test',
    fetchImpl: async (url, options) => {
      assert.equal(
        url,
        'https://api.github.com/orgs/EQ-LABS-TECH/teams/maintainers/memberships/reviewer',
      );
      assert.equal(options.method, 'GET');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          state: 'active',
          role: 'member',
        }),
      };
    },
  });

  assert.deepEqual(membership, {
    reviewer: 'reviewer',
    teamSlug: 'maintainers',
    active: true,
    role: 'member',
  });
});

test('pending team membership is not active', async () => {
  const membership = await readReviewerTeamMembership({
    owner: 'EQ-LABS-TECH',
    teamSlug: 'maintainers',
    reviewer: 'reviewer',
    token: 'test',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        state: 'pending',
        role: 'member',
      }),
    }),
  });

  assert.equal(membership.active, false);
});

test('missing team membership is not authorization', async () => {
  const membership = await readReviewerTeamMembership({
    owner: 'EQ-LABS-TECH',
    teamSlug: 'maintainers',
    reviewer: 'reviewer',
    token: 'test',
    fetchImpl: async () => ({
      ok: false,
      status: 404,
    }),
  });

  assert.equal(membership.active, false);
  assert.equal(membership.role, null);
});

test('team membership API errors fail closed', async () => {
  await assert.rejects(
    readReviewerTeamMembership({
      owner: 'EQ-LABS-TECH',
      teamSlug: 'architecture',
      reviewer: 'reviewer',
      token: 'test',
      fetchImpl: async () => ({
        ok: false,
        status: 403,
      }),
    }),
    /HTTP 403/,
  );
});

test('malformed team membership evidence is rejected', async () => {
  await assert.rejects(
    readReviewerTeamMembership({
      owner: 'EQ-LABS-TECH',
      teamSlug: 'maintainers',
      reviewer: 'reviewer',
      token: 'test',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          state: 'active',
          role: 'unknown',
        }),
      }),
    }),
    /Malformed GitHub team membership response/,
  );
});

test('rejects reviews changed during evidence collection', async () => {
  let reviewReads = 0;

  const fetchImpl = async (url, options) => {
    assert.equal(options.method, 'GET');

    if (url.includes('/files?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{ filename: 'README.md' }],
      };
    }

    if (url.includes('/reviews?')) {
      reviewReads += 1;

      return {
        ok: true,
        status: 200,
        json: async () => (reviewReads === 1 ? [review] : [{ ...review, state: 'DISMISSED' }]),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => base,
    };
  };

  await assert.rejects(
    readPullRequestEvidence({ ...locator, fetchImpl }),
    /Pull request reviews changed while collecting governance evidence/,
  );

  assert.equal(reviewReads, 2);
});

test('rejects an ordinary declaration edited during evidence collection', async () => {
  let reviewReads = 0;

  const originalReview = {
    ...review,
    body: 'EE-LABS-IMPACT: ORDINARY',
  };

  const editedReview = {
    ...originalReview,
    body: 'Impact requires further review',
  };

  const fetchImpl = async (url) => {
    if (url.includes('/files?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{ filename: 'README.md' }],
      };
    }

    if (url.includes('/reviews?')) {
      reviewReads += 1;

      return {
        ok: true,
        status: 200,
        json: async () => [reviewReads === 1 ? originalReview : editedReview],
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => base,
    };
  };

  await assert.rejects(
    readPullRequestEvidence({ ...locator, fetchImpl }),
    /Pull request reviews changed while collecting governance evidence/,
  );

  assert.equal(reviewReads, 2);
});

test('rejects a head change after the second review read', async () => {
  let prReads = 0;
  let reviewReads = 0;

  const fetchImpl = async (url) => {
    if (url.includes('/files?')) {
      return {
        ok: true,
        status: 200,
        json: async () => [{ filename: 'README.md' }],
      };
    }

    if (url.includes('/reviews?')) {
      reviewReads += 1;

      return {
        ok: true,
        status: 200,
        json: async () => [review],
      };
    }

    prReads += 1;

    return {
      ok: true,
      status: 200,
      json: async () =>
        prReads === 1
          ? base
          : {
              ...base,
              head: {
                ...base.head,
                sha: 'b'.repeat(40),
              },
            },
    };
  };

  await assert.rejects(
    readPullRequestEvidence({ ...locator, fetchImpl }),
    /Pull request changed while collecting governance evidence/,
  );

  assert.equal(reviewReads, 2);
  assert.equal(prReads, 2);
});
