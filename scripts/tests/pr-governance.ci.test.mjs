import test from 'node:test';
import assert from 'node:assert/strict';

import { readValidateReadiness } from '../lib/pr-governance.ci.mjs';

const context = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  headSha: 'a'.repeat(40),
  token: 'reader',
};

function check(overrides = {}) {
  return {
    id: 1,
    name: 'Validate',
    app: { id: 15368 },
    status: 'completed',
    conclusion: 'success',
    started_at: '2026-11-01T12:00:00Z',
    ...overrides,
  };
}

function fetchRuns(checkRuns) {
  return async (url, options) => {
    assert.match(url, new RegExp(`/commits/${context.headSha}/check-runs\\?check_name=Validate`));
    assert.match(url, /app_id=15368&filter=latest/);
    assert.equal(options.method, 'GET');
    return {
      ok: true,
      status: 200,
      json: async () => ({ total_count: checkRuns.length, check_runs: checkRuns }),
    };
  };
}

test('allows evaluation only after GitHub Actions Validate succeeds on the requested HEAD', async () => {
  assert.deepEqual(await readValidateReadiness({ ...context, fetchImpl: fetchRuns([check()]) }), {
    status: 'READY',
    checkRunId: 1,
  });
});

test('waits when the newest Validate run is pending, failed, or cancelled', async () => {
  for (const status of ['queued', 'in_progress', 'completed']) {
    const conclusion = status === 'completed' ? 'failure' : null;
    const result = await readValidateReadiness({
      ...context,
      fetchImpl: fetchRuns([
        check({
          id: 2,
          status,
          conclusion,
          started_at: status === 'queued' ? null : '2026-11-01T13:00:00Z',
        }),
        check({ id: 1 }),
      ]),
    });
    assert.deepEqual(result, { status: 'WAITING', checkRunId: 2 });
  }
});

test('ignores similarly named checks from other integrations', async () => {
  const result = await readValidateReadiness({
    ...context,
    fetchImpl: fetchRuns([check({ app: { id: 999 } })]),
  });
  assert.deepEqual(result, { status: 'WAITING', checkRunId: null });
});

test('fails closed on malformed check evidence or GitHub API errors', async () => {
  const result = await readValidateReadiness({
    ...context,
    fetchImpl: fetchRuns([
      check({ id: 2, status: 'queued', conclusion: null, started_at: null }),
      check({ id: 1 }),
    ]),
  });
  assert.deepEqual(result, { status: 'WAITING', checkRunId: 2 });

  await assert.rejects(
    readValidateReadiness({ ...context, fetchImpl: fetchRuns([check({ started_at: null })]) }),
    /Malformed Validate check run/,
  );
  await assert.rejects(
    readValidateReadiness({
      ...context,
      fetchImpl: async () => ({ ok: false, status: 403 }),
    }),
    /HTTP 403/,
  );
});
