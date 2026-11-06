import test from 'node:test';
import assert from 'node:assert/strict';

import { runPrGovernance } from '../lib/pr-governance.run.mjs';

const headSha = 'a'.repeat(40);

const options = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  expectedHeadSha: headSha,
  expectedAppId: 789,
  token: 'pr-token',
  governanceToken: 'governance-token',
  publisherToken: 'publisher-token',
};

function fixture({
  startStatus = 201,
  startRequestId,
  patchStatus = 200,
  validateConclusion = 'success',
} = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({
      method: init.method,
      url,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });

    if (init.method === 'GET' && url.includes('/check-runs?check_name=Validate')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          total_count: 1,
          check_runs: [
            {
              id: 111,
              app: { id: 15368 },
              name: 'Validate',
              status: 'completed',
              conclusion: validateConclusion,
              started_at: '2026-10-30T12:00:00Z',
            },
          ],
        }),
      };
    }

    if (init.method === 'GET' && url.endsWith('/pulls/42')) {
      const publisher = init.headers.Authorization === 'Bearer publisher-token';

      return {
        ok: true,
        status: 200,
        json: async () =>
          publisher
            ? {
                number: 42,
                state: 'open',
                head: { sha: headSha },
                base: {
                  repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
                },
              }
            : {
                // Malformed PR evidence forces the evaluation-error path.
                number: 42,
              },
      };
    }

    if (init.method === 'POST' && url.endsWith('/check-runs')) {
      return {
        ok: startStatus === 201,
        status: startStatus,
        headers: {
          get: (name) => (name === 'x-github-request-id' ? (startRequestId ?? null) : null),
        },
        json: async () => ({
          id: 456,
          app: { id: 789 },
          name: 'PR Governance',
          head_sha: headSha,
          status: 'in_progress',
        }),
      };
    }

    if (init.method === 'GET' && url.endsWith('/check-runs/456')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 456,
          app: { id: 789 },
          name: 'PR Governance',
          head_sha: headSha,
          status: 'in_progress',
        }),
      };
    }

    if (init.method === 'PATCH' && url.endsWith('/check-runs/456')) {
      const payload = JSON.parse(init.body);

      assert.equal(payload.conclusion, 'failure');
      assert.equal(payload.status, 'completed');

      return {
        ok: patchStatus === 200,
        status: patchStatus,
        json: async () => ({
          id: 456,
          name: 'PR Governance',
          head_sha: headSha,
          status: 'completed',
          conclusion: 'failure',
        }),
      };
    }

    throw new Error(`Unexpected request: ${init.method} ${url}`);
  };

  return { fetchImpl, calls };
}

test('evaluation error completes the same check as failure', async () => {
  const mock = fixture();

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /Invalid GitHub pull request response/,
  );

  assert.deepEqual(
    mock.calls.map(({ method }) => method),
    ['GET', 'GET', 'POST', 'GET', 'GET', 'GET', 'PATCH'],
  );

  const patch = mock.calls.find(({ method }) => method === 'PATCH');

  assert.equal(patch.body.conclusion, 'failure');
  assert.equal(patch.body.output.title, 'PN-017 governance evaluation failed');
});

test('check start error includes safe GitHub request context', async () => {
  const mock = fixture({ startStatus: 403, startRequestId: 'ABCD:1234' });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    (error) => {
      assert.match(error.message, /check start returned HTTP 403/);
      assert.deepEqual(error.pn017Diagnostic, {
        number: 42,
        headSha,
        phase: 'check-start',
        code: 'github-http-error',
        httpStatus: 403,
        requestId: 'ABCD:1234',
      });
      return true;
    },
  );

  assert.deepEqual(
    mock.calls.map(({ method }) => method),
    ['GET', 'GET', 'POST'],
  );
});

test('Validate lookup errors carry a sanitized readiness diagnostic', async () => {
  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        json: async () => ({ message: 'private response content' }),
      }),
    }),
    (error) => {
      assert.deepEqual(error.pn017Diagnostic, {
        number: 42,
        headSha,
        phase: 'validate-readiness',
        code: 'github-http-error',
        httpStatus: 403,
      });
      assert.equal(JSON.stringify(error.pn017Diagnostic).includes('private response'), false);
      return true;
    },
  );
});

test('failed recovery exposes both evaluation and PATCH errors', async () => {
  const mock = fixture({ patchStatus: 403 });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 2);
      assert.match(error.errors[0].message, /Invalid GitHub pull request response/);
      assert.match(error.errors[1].message, /check completion returned HTTP 403/);
      return true;
    },
  );
});

function successfulFixture({
  paths = ['README.md'],
  reviewEvents,
  revokeAfterFirstEvaluation = false,
} = {}) {
  const calls = [];
  const baseSha = 'b'.repeat(40);
  const owners = '* @EQ-LABS-TECH/architecture';

  const pullRequest = {
    number: 42,
    state: 'open',
    user: { login: 'author' },
    head: {
      sha: headSha,
      repo: { full_name: 'author/ee-monorepo' },
    },
    base: {
      ref: 'main',
      sha: baseSha,
      repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
    },
  };

  let reviews = reviewEvents ?? [
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'Looks good',
    },
  ];
  const classificationComments = [
    // Ordinary classification comes from complete changed-path evidence.
  ];

  let reviewReadCount = 0;
  let governanceChecks = [];

  const fetchImpl = async (url, init) => {
    const method = init.method;
    const authorization = init.headers.Authorization;

    calls.push({
      method,
      url,
      authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });

    let data;
    let status = 200;

    if (url.endsWith('/pulls/42')) {
      data = pullRequest;
    } else if (url.includes('/pulls/42/files?')) {
      data = paths.map((filename) => ({ filename }));
    } else if (url.includes('/pulls/42/reviews?')) {
      reviewReadCount += 1;

      // readPullRequestEvidence reads reviews twice per evaluation.
      data = revokeAfterFirstEvaluation && reviewReadCount > 2 ? [] : reviews;
    } else if (url.includes('/issues/42/comments?')) {
      data = classificationComments;
    } else if (url.includes('/codeowners/errors?')) {
      data = { errors: [] };
    } else if (url.includes('/contents/.github/CODEOWNERS?')) {
      data = {
        type: 'file',
        path: '.github/CODEOWNERS',
        encoding: 'base64',
        size: Buffer.byteLength(owners),
        content: Buffer.from(owners).toString('base64'),
      };
    } else if (url.includes('/collaborators/architect/permission')) {
      data = {
        user: { login: 'architect' },
        permission: 'write',
        role_name: 'write',
      };
    } else if (url.includes('/teams/architecture/repos/')) {
      data = {
        full_name: 'EQ-LABS-TECH/ee-monorepo',
        permissions: { pull: true, push: true, admin: false },
      };
    } else if (url.endsWith('/orgs/EQ-LABS-TECH/teams/architecture')) {
      data = { slug: 'architecture', privacy: 'closed' };
    } else if (url.includes('/teams/architecture/memberships/architect')) {
      data = { state: 'active', role: 'member' };
    } else if (method === 'GET' && url.includes('/check-runs?check_name=Validate')) {
      data = {
        total_count: 1,
        check_runs: [
          {
            id: 123,
            app: { id: 15368 },
            name: 'Validate',
            status: 'completed',
            conclusion: 'success',
            started_at: '2026-10-30T12:00:00Z',
          },
        ],
      };
    } else if (method === 'GET' && url.includes('/commits/') && url.includes('/check-runs?')) {
      data = {
        total_count: governanceChecks.length,
        check_runs: governanceChecks,
      };
    } else if (url.endsWith('/check-runs/456') && method === 'GET') {
      data = {
        id: 456,
        app: { id: 789 },
        name: 'PR Governance',
        head_sha: headSha,
        status: 'in_progress',
        started_at: '2026-10-30T12:00:00Z',
      };
    } else if (url.endsWith('/check-runs') && method === 'POST') {
      const payload = JSON.parse(init.body);

      assert.equal(payload.head_sha, headSha);
      assert.equal(payload.status, 'in_progress');

      status = 201;
      data = {
        id: 456,
        app: { id: 789 },
        name: payload.name,
        head_sha: headSha,
        status: 'in_progress',
      };
      governanceChecks.unshift({
        id: 456,
        app: { id: 789 },
        name: 'PR Governance',
        head_sha: headSha,
        status: 'in_progress',
        started_at: '2026-10-30T12:00:00Z',
      });
    } else if (url.endsWith('/check-runs/456') && method === 'PATCH') {
      const payload = JSON.parse(init.body);

      assert.equal(payload.status, 'completed');
      assert.ok(['success', 'failure'].includes(payload.conclusion));

      data = {
        id: 456,
        name: 'PR Governance',
        head_sha: headSha,
        status: 'completed',
        conclusion: payload.conclusion,
      };
      governanceChecks[0] = {
        ...governanceChecks[0],
        status: 'completed',
        conclusion: payload.conclusion,
      };
    } else {
      throw new Error(`Unexpected GitHub request: ${method} ${url}`);
    }

    const expectedToken =
      url.includes('/check-runs') ||
      (url.endsWith('/pulls/42') && authorization === 'Bearer publisher-token')
        ? authorization
        : url.includes('/pulls/42') || url.includes('/issues/42/comments')
          ? 'Bearer pr-token'
          : 'Bearer governance-token';

    assert.equal(authorization, expectedToken);

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
    };
  };

  return {
    fetchImpl,
    calls,
    setReviews(nextReviews) {
      reviews = nextReviews;
    },
  };
}

test('ordinary governance completes the same check with success', async () => {
  const mock = successfulFixture();

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'PASS');
  assert.equal(result.checkId, 456);
  assert.equal(result.headSha, headSha);
  assert.equal(result.conclusion, 'success');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('critical governance with one approval completes as failure', async () => {
  const mock = successfulFixture({
    paths: ['.github/workflows/ci.yml'],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.decision.requiredCount, 2);
  assert.equal(result.checkId, 456);
  assert.equal(result.conclusion, 'failure');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('publishes an approval block immediately and passes after a later approval', async () => {
  const mock = successfulFixture({ reviewEvents: [] });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      waitForApprovalReadiness: true,
      deduplicateSuccessfulChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const blocked = await reconcile();

  assert.equal(blocked.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(blocked.classification, 'ORDINARY');
  assert.equal(blocked.decision.status, 'BLOCKED');
  assert.equal(blocked.conclusion, 'failure');
  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);

  const blockedPayload = mock.calls.find(({ method }) => method === 'PATCH').body;
  assert.equal(blockedPayload.output.title, 'PN-017 governance blocked');
  assert.match(blockedPayload.output.summary, /Qualified approvals: 0 \/ 1/);
  assert.match(
    blockedPayload.output.summary,
    /The qualified approval threshold has not been met\./,
  );

  mock.setReviews([
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'Approved after initial block',
    },
  ]);

  const passed = await reconcile();

  assert.equal(passed.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(passed.classification, 'ORDINARY');
  assert.equal(passed.decision.status, 'PASS');
  assert.equal(passed.conclusion, 'success');
  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 2);
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 2);

  const completedPayloads = mock.calls
    .filter(({ method }) => method === 'PATCH')
    .map(({ body }) => body);
  assert.deepEqual(
    completedPayloads.map(({ conclusion }) => conclusion),
    ['failure', 'success'],
  );
});

test('missing trusted App identity prevents all API calls', async () => {
  let calls = 0;

  await assert.rejects(
    runPrGovernance({
      ...options,
      expectedAppId: undefined,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('Unexpected API call');
      },
    }),
    /Invalid PR governance execution configuration/,
  );

  assert.equal(calls, 0);
});

test('approval removal blocks governance without changing HEAD', async () => {
  const mock = successfulFixture({
    reviewEvents: [],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.headSha, headSha);
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.conclusion, 'failure');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('dismissed approval blocks governance on unchanged HEAD', async () => {
  const mock = successfulFixture({
    reviewEvents: [
      {
        user: { login: 'architect' },
        state: 'DISMISSED',
        commit_id: headSha,
        submitted_at: '2026-10-29T00:00:00Z',
        body: '',
      },
    ],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.headSha, headSha);
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.conclusion, 'failure');
});

test('revoked approval during execution prevents success publication', async () => {
  const mock = successfulFixture({
    revokeAfterFirstEvaluation: true,
  });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /PR governance evidence changed during evaluation/,
  );

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  const patches = mock.calls.filter(({ method }) => method === 'PATCH');

  assert.equal(patches.length, 1);
  assert.equal(patches[0].url.endsWith('/check-runs/456'), true);
});
