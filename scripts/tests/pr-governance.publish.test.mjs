import test from 'node:test';
import assert from 'node:assert/strict';

import {
  publishPrGovernanceCheck,
  startPrGovernanceCheck,
  completePrGovernanceCheck,
} from '../lib/pr-governance.publish.mjs';

const headSha = 'a'.repeat(40);

const options = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  expectedHeadSha: headSha,
  token: 'governance-publisher-token',
  evaluation: {
    mode: 'EVALUATION_ONLY',
    headSha,
    classification: 'ORDINARY',
    decision: { status: 'PASS' },
  },
};

function fixture({
  currentHeadSha = headSha,
  state = 'open',
  getStatus = 200,
  postStatus = 201,
  resultHeadSha = headSha,
} = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, ...init });

    assert.equal(init.headers.Authorization, 'Bearer governance-publisher-token');

    if (init.method === 'GET') {
      assert.match(url, /\/pulls\/42$/);

      return {
        ok: getStatus === 200,
        status: getStatus,
        json: async () => ({
          number: 42,
          state,
          head: { sha: currentHeadSha },
          base: {
            repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
          },
        }),
      };
    }

    if (init.method === 'POST') {
      assert.match(url, /\/check-runs$/);

      const payload = JSON.parse(init.body);

      assert.equal(payload.head_sha, headSha);

      return {
        ok: postStatus === 201,
        status: postStatus,
        json: async () => ({
          id: 123,
          name: payload.name,
          head_sha: resultHeadSha,
          status: payload.status,
          conclusion: payload.conclusion,
        }),
      };
    }

    throw new Error(`Unexpected request: ${init.method}`);
  };

  return { fetchImpl, calls };
}

test('publishes governance success for the exact current HEAD', async () => {
  const mock = fixture();

  const result = await publishPrGovernanceCheck({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.deepEqual(result, {
    checkId: 123,
    headSha,
    conclusion: 'success',
  });

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET', 'POST'],
  );
});

test('publishes BLOCKED as failure', async () => {
  const mock = fixture();

  const result = await publishPrGovernanceCheck({
    ...options,
    evaluation: {
      ...options.evaluation,
      decision: { status: 'BLOCKED' },
    },
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.conclusion, 'failure');
});

test('changed HEAD prevents check publication', async () => {
  const mock = fixture({ currentHeadSha: 'b'.repeat(40) });

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /HEAD or PR identity changed/,
  );

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET'],
  );
});

test('closed PR cannot receive the governance check', async () => {
  const mock = fixture({ state: 'closed' });

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /HEAD or PR identity changed/,
  );

  assert.equal(mock.calls.length, 1);
});

test('GitHub publication errors fail closed', async () => {
  const mock = fixture({ postStatus: 403 });

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /publication returned HTTP 403/,
  );
});

test('GitHub verification errors prevent publication', async () => {
  const mock = fixture({ getStatus: 403 });

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /verification returned HTTP 403/,
  );

  assert.equal(mock.calls.length, 1);
});

test('mismatched published HEAD is rejected', async () => {
  const mock = fixture({ resultHeadSha: 'c'.repeat(40) });

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /Malformed GitHub governance check publication response/,
  );
});

test('invalid evaluation never makes an API request', async () => {
  const mock = fixture();

  await assert.rejects(
    publishPrGovernanceCheck({
      ...options,
      evaluation: {
        ...options.evaluation,
        headSha: 'b'.repeat(40),
      },
      fetchImpl: mock.fetchImpl,
    }),
    /Invalid PR governance check evidence/,
  );

  assert.equal(mock.calls.length, 0);
});

test('starts governance check in progress for the current HEAD', async () => {
  const calls = [];

  const result = await startPrGovernanceCheck({
    owner: options.owner,
    repo: options.repo,
    number: options.number,
    expectedHeadSha: headSha,
    expectedAppId: 789,
    token: options.token,
    fetchImpl: async (url, init) => {
      calls.push(init.method);

      if (init.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            number: 42,
            state: 'open',
            head: { sha: headSha },
            base: {
              repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
            },
          }),
        };
      }

      assert.match(url, /\/check-runs$/);

      const payload = JSON.parse(init.body);

      assert.equal(payload.name, 'PR Governance');
      assert.equal(payload.head_sha, headSha);
      assert.equal(payload.status, 'in_progress');
      assert.equal(payload.conclusion, undefined);

      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: 456,
          app: { id: 789 },
          name: payload.name,
          head_sha: payload.head_sha,
          status: 'in_progress',
        }),
      };
    },
  });

  assert.deepEqual(result, {
    checkId: 456,
    appId: 789,
    headSha,
    status: 'in_progress',
  });

  assert.deepEqual(calls, ['GET', 'POST']);
});

test('changed HEAD prevents starting governance check', async () => {
  const calls = [];

  await assert.rejects(
    startPrGovernanceCheck({
      owner: options.owner,
      repo: options.repo,
      number: options.number,
      expectedHeadSha: headSha,
      expectedAppId: 789,
      token: options.token,
      fetchImpl: async (_url, init) => {
        calls.push(init.method);

        return {
          ok: true,
          status: 200,
          json: async () => ({
            number: 42,
            state: 'open',
            head: { sha: 'b'.repeat(40) },
            base: {
              repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
            },
          }),
        };
      },
    }),
    /HEAD or PR identity changed before check start/,
  );

  assert.deepEqual(calls, ['GET']);
});

test('check start API failure does not report success', async () => {
  await assert.rejects(
    startPrGovernanceCheck({
      owner: options.owner,
      repo: options.repo,
      number: options.number,
      expectedHeadSha: headSha,
      expectedAppId: 789,
      token: options.token,
      fetchImpl: async (_url, init) => {
        if (init.method === 'GET') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              number: 42,
              state: 'open',
              head: { sha: headSha },
              base: {
                repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
              },
            }),
          };
        }

        return { ok: false, status: 403 };
      },
    }),
    /check start returned HTTP 403/,
  );
});

function completionFixture({
  currentHeadSha = headSha,
  checkHeadSha = headSha,
  checkStatus = 'in_progress',
  patchStatus = 200,
} = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method });

    assert.equal(init.headers.Authorization, 'Bearer governance-publisher-token');

    if (init.method === 'GET' && url.endsWith('/pulls/42')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          number: 42,
          state: 'open',
          head: { sha: currentHeadSha },
          base: {
            repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
          },
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
          head_sha: checkHeadSha,
          status: checkStatus,
          created_at: '2026-10-30T12:00:00Z',
        }),
      };
    }

    if (init.method === 'GET' && url.includes('/commits/') && url.includes('/check-runs?')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
      };
    }

    if (init.method === 'PATCH') {
      assert.match(url, /\/check-runs\/456$/);

      const payload = JSON.parse(init.body);

      assert.equal(payload.status, 'completed');
      assert.ok(['success', 'failure'].includes(payload.conclusion));

      return {
        ok: patchStatus === 200,
        status: patchStatus,
        json: async () => ({
          id: 456,
          name: 'PR Governance',
          head_sha: headSha,
          status: 'completed',
          conclusion: payload.conclusion,
        }),
      };
    }

    throw new Error(`Unexpected request: ${init.method} ${url}`);
  };

  return { fetchImpl, calls };
}

test('completes the same governance check with success', async () => {
  const mock = completionFixture();

  const result = await completePrGovernanceCheck({
    ...options,
    checkId: 456,
    expectedAppId: 789,
    fetchImpl: mock.fetchImpl,
  });

  assert.deepEqual(result, {
    checkId: 456,
    headSha,
    conclusion: 'success',
  });

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET', 'GET', 'GET', 'PATCH'],
  );
});

test('completes BLOCKED governance with failure', async () => {
  const mock = completionFixture();

  const result = await completePrGovernanceCheck({
    ...options,
    checkId: 456,
    expectedAppId: 789,
    evaluation: {
      ...options.evaluation,
      decision: { status: 'BLOCKED' },
    },
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.conclusion, 'failure');
});

test('changed PR HEAD prevents check completion', async () => {
  const mock = completionFixture({
    currentHeadSha: 'b'.repeat(40),
  });

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 789,
      fetchImpl: mock.fetchImpl,
    }),
    /HEAD or PR identity changed before check completion/,
  );

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET'],
  );
});

test('mismatched check HEAD prevents completion', async () => {
  const mock = completionFixture({
    checkHeadSha: 'b'.repeat(40),
  });

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 789,
      fetchImpl: mock.fetchImpl,
    }),
    /check identity or state changed before completion/,
  );

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET', 'GET'],
  );
});

test('completed check cannot be completed again', async () => {
  const mock = completionFixture({
    checkStatus: 'completed',
  });

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 789,
      fetchImpl: mock.fetchImpl,
    }),
    /check identity or state changed before completion/,
  );

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET', 'GET'],
  );
});

test('check PATCH failure does not report completion', async () => {
  const mock = completionFixture({ patchStatus: 403 });

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 789,
      fetchImpl: mock.fetchImpl,
    }),
    /check completion returned HTTP 403/,
  );
});

test('different GitHub App cannot complete governance check', async () => {
  const mock = completionFixture();

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 999,
      fetchImpl: mock.fetchImpl,
    }),
    /check identity or state changed before completion/,
  );

  assert.deepEqual(
    mock.calls.map((call) => call.method),
    ['GET', 'GET'],
  );
});

test('unexpected GitHub App cannot establish trusted check start', async () => {
  const calls = [];

  await assert.rejects(
    startPrGovernanceCheck({
      owner: options.owner,
      repo: options.repo,
      number: options.number,
      expectedHeadSha: headSha,
      expectedAppId: 999,
      token: options.token,
      fetchImpl: async (url, init) => {
        calls.push(init.method);

        if (init.method === 'GET') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              number: 42,
              state: 'open',
              head: { sha: headSha },
              base: {
                repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
              },
            }),
          };
        }

        assert.match(url, /\/check-runs$/);

        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: 456,
            app: { id: 789 },
            name: 'PR Governance',
            head_sha: headSha,
            status: 'in_progress',
          }),
        };
      },
    }),
    /unexpected App/,
  );

  assert.deepEqual(calls, ['GET', 'POST']);
});

test('concurrent newer governance check prevents success', async () => {
  const mock = completionFixture();

  await assert.rejects(
    completePrGovernanceCheck({
      ...options,
      checkId: 456,
      expectedAppId: 789,
      fetchImpl: async (url, init) => {
        if (init.method === 'GET' && url.includes('/commits/') && url.includes('/check-runs?')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              total_count: 2,
              check_runs: [
                {
                  id: 456,
                  app: { id: 789 },
                  name: 'PR Governance',
                  head_sha: headSha,
                  created_at: '2026-10-30T12:00:00Z',
                },
                {
                  id: 457,
                  app: { id: 789 },
                  name: 'PR Governance',
                  head_sha: headSha,
                  created_at: '2026-10-30T12:01:00Z',
                },
              ],
            }),
          };
        }

        return mock.fetchImpl(url, init);
      },
    }),
    /Newer or concurrent PR governance check exists/,
  );

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 0);
});
