import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPrGovernance } from '../lib/pr-governance.inspect.mjs';

const sha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

const pr = {
  number: 7,
  user: { login: 'author' },
  head: {
    sha,
    repo: { full_name: 'author/ee-monorepo' },
  },
  base: {
    ref: 'main',
    sha: baseSha,
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
            : url.includes('/collaborators/')
              ? {
                  permission: 'write',
                  role_name: 'maintain',
                  user: {
                    login: decodeURIComponent(
                      url.split('/collaborators/')[1].split('/permission')[0],
                    ),
                  },
                }
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

test('ordinary impact declaration is evidence, not authorization', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      assert.doesNotMatch(url, /\/teams\/architecture\/memberships\//);

      return fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }])(url, init);
    },
  });

  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.ordinaryClassificationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, [
    {
      reviewer: 'reviewer',
      commitId: sha,
      permission: 'write',
      roleName: 'maintain',
      hasWriteAccess: true,
    },
  ]);

  assert.equal(report.ordinaryClassificationEvidence.reason, 'reviewer-authority-not-yet-verified');
  assert.deepEqual(report.ordinaryClassificationEvidence.authorizedReviewers, []);
  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.mode, 'ADVISORY');
  assert.equal(report.status, 'PENDING');
});

test('critical path cannot be downgraded by impact declaration', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['.github/workflows/ci.yml'],
      [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }],
    ),
  });

  assert.equal(report.classification.status, 'CRITICAL');
  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
});

test('author declaration cannot establish ordinary impact', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          user: { login: 'author' },
          body: 'EE-LABS-IMPACT: ORDINARY',
        },
      ],
    ),
  });

  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
});

test('stale declaration does not count as current evidence', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          commit_id: 'b'.repeat(40),
          body: 'EE-LABS-IMPACT: ORDINARY',
        },
      ],
    ),
  });

  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
});

test('superseded ordinary declaration is not valid evidence', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          body: 'EE-LABS-IMPACT: ORDINARY',
          submitted_at: '2026-10-29T01:00:00Z',
        },
        {
          ...review,
          body: '',
          submitted_at: '2026-10-29T02:00:00Z',
        },
      ],
    ),
  });

  assert.equal(report.approvalEvidence.status, 'PASS');
  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.status, 'PENDING');
});

test('read-only reviewer cannot authorize ordinary classification', async () => {
  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      if (url.includes('/collaborators/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            permission: 'read',
            role_name: 'read',
            user: { login: 'reviewer' },
          }),
        };
      }

      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.ordinaryClassificationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
  assert.equal(report.status, 'PENDING');
});

test('only reviewers with write access remain ordinary candidates', async () => {
  const baseFetch = fixture(
    ['README.md'],
    [
      { ...review, body: 'EE-LABS-IMPACT: ORDINARY' },
      {
        ...review,
        user: { login: 'reviewer2' },
        body: 'EE-LABS-IMPACT: ORDINARY',
      },
    ],
  );

  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      if (url.includes('/collaborators/')) {
        const reviewer = url.includes('/reviewer2/') ? 'reviewer2' : 'reviewer';

        return {
          ok: true,
          status: 200,
          json: async () => ({
            permission: reviewer === 'reviewer' ? 'write' : 'read',
            role_name: reviewer === 'reviewer' ? 'maintain' : 'read',
            user: { login: reviewer },
          }),
        };
      }

      return baseFetch(url, init);
    },
  });

  assert.equal(report.ordinaryClassificationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(
    report.ordinaryClassificationEvidence.candidates.map((candidate) => candidate.reviewer),
    ['reviewer'],
  );
  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.status, 'PENDING');
});

test('permission API failure prevents a valid inspection report', async () => {
  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  await assert.rejects(
    inspectPrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.includes('/collaborators/')) {
          return { ok: false, status: 403 };
        }

        return baseFetch(url, init);
      },
    }),
    /HTTP 403/,
  );
});

test('critical changes do not query permissions to downgrade impact', async () => {
  const baseFetch = fixture(
    ['.github/workflows/release.yml'],
    [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }],
  );

  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      assert.doesNotMatch(url, /\/collaborators\//);
      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'CRITICAL');
  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
  assert.equal(report.status, 'PENDING');
});

test('quoted ordinary declarations are not accepted as evidence', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          body: '> EE-LABS-IMPACT: ORDINARY',
        },
      ],
    ),
  });

  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
  assert.equal(report.classification.status, 'PENDING_REVIEW');
});

test('ordinary declaration embedded in review prose is not accepted', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          body: 'Example:\nEE-LABS-IMPACT: ORDINARY',
        },
      ],
    ),
  });

  assert.deepEqual(report.ordinaryClassificationEvidence.candidates, []);
  assert.equal(report.status, 'PENDING');
});

test('ordinary declaration tolerates surrounding whitespace', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          body: '  \nEE-LABS-IMPACT: ORDINARY\n  ',
        },
      ],
    ),
  });

  assert.equal(report.ordinaryClassificationEvidence.candidates.length, 1);
  assert.equal(report.ordinaryClassificationEvidence.status, 'UNVERIFIED');
  assert.equal(report.status, 'PENDING');
});

test('rejects ordinary evidence changed during permission verification', async () => {
  let reviewReads = 0;

  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  await assert.rejects(
    inspectPrGovernance({
      ...options,
      fetchImpl: async (url, init) => {
        if (url.includes('/collaborators/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              permission: 'write',
              role_name: 'write',
              user: { login: 'reviewer' },
            }),
          };
        }

        if (url.includes('/reviews?')) {
          reviewReads += 1;

          if (reviewReads > 2) {
            return {
              ok: true,
              status: 200,
              json: async () => [{ ...review, body: 'Impact requires further review' }],
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance evidence changed while verifying reviewer permissions/,
  );

  assert.equal(reviewReads, 4);
});

test('active architecture reviewer establishes ordinary impact evidence', async () => {
  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  const report = await inspectPrGovernance({
    ...options,
    membershipToken: 'membership-test-token',
    fetchImpl: async (url, init) => {
      if (url.includes('/teams/architecture/memberships/')) {
        assert.equal(init.headers.Authorization, 'Bearer membership-test-token');

        return {
          ok: true,
          status: 200,
          json: async () => ({
            state: 'active',
            role: 'member',
          }),
        };
      }

      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.ordinaryClassificationEvidence.status, 'VERIFIED');
  assert.deepEqual(report.ordinaryClassificationEvidence.authorizedReviewers, ['reviewer']);
  assert.equal(report.mode, 'ADVISORY');
  assert.equal(report.status, 'PENDING');
});

test('inactive architecture membership cannot establish ordinary impact', async () => {
  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  const report = await inspectPrGovernance({
    ...options,
    membershipToken: 'membership-test-token',
    fetchImpl: async (url, init) => {
      if (url.includes('/teams/architecture/memberships/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            state: 'pending',
            role: 'member',
          }),
        };
      }

      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'PENDING_REVIEW');
  assert.equal(report.ordinaryClassificationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.ordinaryClassificationEvidence.authorizedReviewers, []);
  assert.equal(report.status, 'PENDING');
});

test('governance membership API failure prevents ordinary classification', async () => {
  const baseFetch = fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]);

  await assert.rejects(
    inspectPrGovernance({
      ...options,
      membershipToken: 'membership-test-token',
      fetchImpl: async (url, init) => {
        if (url.includes('/teams/architecture/memberships/')) {
          return { ok: false, status: 403 };
        }

        return baseFetch(url, init);
      },
    }),
    /HTTP 403/,
  );
});

test('critical classification prevails over active architecture membership', async () => {
  const baseFetch = fixture(
    ['.github/CODEOWNERS'],
    [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }],
  );

  const report = await inspectPrGovernance({
    ...options,
    membershipToken: 'membership-test-token',
    fetchImpl: async (url, init) => {
      assert.doesNotMatch(url, /\/teams\/architecture\/memberships\//);
      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'CRITICAL');
  assert.equal(report.status, 'PENDING');
});
