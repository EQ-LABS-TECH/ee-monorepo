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
function classificationComment(
  login = 'reviewer',
  body = `EE-LABS-IMPACT: CRITICAL\nHEAD: ${sha}\nRATIONALE: Public contract impact`,
) {
  return {
    id: 123,
    user: { login },
    body,
    created_at: '2026-10-29T01:00:00Z',
    updated_at: '2026-10-29T01:00:00Z',
  };
}

function fixture(paths, reviews = [review], classificationComments = []) {
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
            : url.includes('/issues/7/comments?')
              ? classificationComments
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

test('ordinary-looking path with one approval is ORDINARY without Architecture review', async () => {
  const report = await inspectPrGovernance({ ...options, fetchImpl: fixture(['README.md']) });
  assert.equal(report.status, 'PENDING');
  assert.equal(report.approvalEvidence.status, 'PASS');
  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.classification.requiresImpactReview, false);
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

test('unauthorized critical escalation leaves the complete noncritical change ordinary', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      assert.doesNotMatch(url, /\/teams\/architecture\/memberships\//);

      return fixture(['README.md'], [review], [classificationComment()])(url, init);
    },
  });

  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.criticalEscalationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.criticalEscalationEvidence.candidates, [
    {
      reviewer: 'reviewer',
      headSha: sha,
      permission: 'write',
      roleName: 'maintain',
      hasWriteAccess: true,
    },
  ]);

  assert.equal(report.criticalEscalationEvidence.reason, 'architecture-escalation-not-verified');
  assert.deepEqual(report.criticalEscalationEvidence.authorizedReviewers, []);
  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.mode, 'ADVISORY');
  assert.equal(report.status, 'PENDING');
});

test('critical path cannot be downgraded by impact declaration', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(['.github/workflows/ci.yml'], [review], [classificationComment()]),
  });

  assert.equal(report.classification.status, 'CRITICAL');
  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
});

test('author declaration cannot escalate a complete noncritical change', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          user: { login: 'author' },
        },
      ],
      [classificationComment('author')],
    ),
  });

  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
});

test('stale escalation does not count as current evidence', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
        },
      ],
      [classificationComment('reviewer', `EE-LABS-IMPACT: ORDINARY\nHEAD: ${'b'.repeat(40)}`)],
    ),
  });

  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
});

test('approval review text alone cannot classify impact', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(['README.md'], [{ ...review, body: 'EE-LABS-IMPACT: ORDINARY' }]),
  });

  assert.equal(report.approvalEvidence.status, 'PASS');
  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.status, 'PENDING');
});

test('read-only reviewer cannot escalate an ordinary classification', async () => {
  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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

  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.criticalEscalationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
  assert.equal(report.status, 'PENDING');
});

test('only reviewers with write access remain escalation candidates', async () => {
  const baseFetch = fixture(
    ['README.md'],
    [
      review,
      {
        ...review,
        user: { login: 'reviewer2' },
      },
    ],
    [classificationComment(), classificationComment('reviewer2')],
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

  assert.equal(report.criticalEscalationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(
    report.criticalEscalationEvidence.candidates.map((candidate) => candidate.reviewer),
    ['reviewer'],
  );
  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.status, 'PENDING');
});

test('permission API failure prevents a valid inspection report', async () => {
  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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
  const baseFetch = fixture(['.github/workflows/release.yml'], [review], [classificationComment()]);

  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: async (url, init) => {
      assert.doesNotMatch(url, /\/collaborators\//);
      return baseFetch(url, init);
    },
  });

  assert.equal(report.classification.status, 'CRITICAL');
  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
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
          body: 'regular code review',
        },
      ],
      [classificationComment('reviewer', `> EE-LABS-IMPACT: ORDINARY\nHEAD: ${sha}`)],
    ),
  });

  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
  assert.equal(report.classification.status, 'ORDINARY');
});

test('critical escalation embedded in review prose is not accepted', async () => {
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
      [classificationComment('reviewer', `Example:\nEE-LABS-IMPACT: ORDINARY\nHEAD: ${sha}`)],
    ),
  });

  assert.deepEqual(report.criticalEscalationEvidence.candidates, []);
  assert.equal(report.status, 'PENDING');
});

test('critical escalation tolerates surrounding whitespace', async () => {
  const report = await inspectPrGovernance({
    ...options,
    fetchImpl: fixture(
      ['README.md'],
      [
        {
          ...review,
          body: 'regular review text',
        },
      ],
      [
        classificationComment(
          'reviewer',
          `  \nEE-LABS-IMPACT: CRITICAL\nHEAD: ${sha}\nRATIONALE: Public contract impact\n  `,
        ),
      ],
    ),
  });

  assert.equal(report.criticalEscalationEvidence.candidates.length, 1);
  assert.equal(report.criticalEscalationEvidence.status, 'UNVERIFIED');
  assert.equal(report.status, 'PENDING');
});

test('rejects escalation evidence changed during permission verification', async () => {
  let commentReads = 0;

  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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

        if (url.includes('/issues/7/comments?')) {
          commentReads += 1;

          if (commentReads > 2) {
            return {
              ok: true,
              status: 200,
              json: async () => [],
            };
          }
        }

        return baseFetch(url, init);
      },
    }),
    /PR governance evidence changed while verifying reviewer permissions/,
  );

  assert.equal(commentReads, 4);
});

test('active architecture reviewer can escalate to critical', async () => {
  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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

  assert.equal(report.classification.status, 'CRITICAL');
  assert.equal(report.criticalEscalationEvidence.status, 'VERIFIED');
  assert.deepEqual(report.criticalEscalationEvidence.authorizedReviewers, ['reviewer']);
  assert.equal(report.approvalEvidence.requiredCount, 2);
  assert.equal(report.approvalEvidence.status, 'BLOCKED');
  assert.equal(report.mode, 'ADVISORY');
  assert.equal(report.status, 'PENDING');
});

test('inactive architecture membership cannot escalate impact', async () => {
  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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

  assert.equal(report.classification.status, 'ORDINARY');
  assert.equal(report.criticalEscalationEvidence.status, 'UNVERIFIED');
  assert.deepEqual(report.criticalEscalationEvidence.authorizedReviewers, []);
  assert.equal(report.status, 'PENDING');
});

test('governance membership API failure prevents ordinary classification', async () => {
  const baseFetch = fixture(['README.md'], [review], [classificationComment()]);

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
  const baseFetch = fixture(['.github/CODEOWNERS'], [review], [classificationComment()]);

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
