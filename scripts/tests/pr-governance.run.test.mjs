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

function fixture({ startStatus = 201, patchStatus = 200 } = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({
      method: init.method,
      url,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });

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
    ['GET', 'POST', 'GET', 'GET', 'GET', 'PATCH'],
  );

  const patch = mock.calls.find(({ method }) => method === 'PATCH');

  assert.equal(patch.body.conclusion, 'failure');
  assert.equal(patch.body.output.title, 'PN-017 governance evaluation failed');
});

test('check start error prevents evaluation and completion', async () => {
  const mock = fixture({ startStatus: 403 });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /check start returned HTTP 403/,
  );

  assert.deepEqual(
    mock.calls.map(({ method }) => method),
    ['GET', 'POST'],
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

  const reviews = reviewEvents ?? [
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'EE-LABS-IMPACT: ORDINARY',
    },
  ];

  let reviewReadCount = 0;

  const fetchImpl = async (url, init) => {
    const method = init.method;
    const authorization = init.headers.Authorization;

    calls.push({ method, url, authorization });

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
    } else if (method === 'GET' && url.includes('/commits/') && url.includes('/check-runs?')) {
      data = {
        total_count: 1,
        check_runs: [
          {
            id: 456,
            app: { id: 789 },
            name: 'PR Governance',
            head_sha: headSha,
            created_at: '2026-10-30T12:00:00Z',
          },
        ],
      };
    } else if (url.endsWith('/check-runs/456') && method === 'GET') {
      data = {
        id: 456,
        app: { id: 789 },
        name: 'PR Governance',
        head_sha: headSha,
        status: 'in_progress',
        created_at: '2026-10-30T12:00:00Z',
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
    } else {
      throw new Error(`Unexpected GitHub request: ${method} ${url}`);
    }

    const expectedToken =
      url.includes('/check-runs') ||
      (url.endsWith('/pulls/42') && authorization === 'Bearer publisher-token')
        ? authorization
        : url.includes('/pulls/42')
          ? 'Bearer pr-token'
          : 'Bearer governance-token';

    assert.equal(authorization, expectedToken);

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
    };
  };

  return { fetchImpl, calls };
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
  assert.equal(result.classification, 'PENDING_REVIEW');
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

  assert.equal(
    patches.every(({ method }) => method === 'PATCH'),
    true,
  );
});
