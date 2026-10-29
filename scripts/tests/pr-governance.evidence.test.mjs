import test from 'node:test';
import assert from 'node:assert/strict';
import { readPullRequestEvidence } from '../lib/pr-governance.evidence.mjs';

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
  });
  assert.equal(evidence.advisoryOnly, true);
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
