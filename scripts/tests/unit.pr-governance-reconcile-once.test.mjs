import test from 'node:test';
import assert from 'node:assert/strict';

import { reconcileOpenGovernancePrs } from '../lib/pr-governance.reconcile-once.mjs';

const sha = 'a'.repeat(40);

function fixture(overrides = {}) {
  const calls = [];

  return {
    calls,
    context: {
      owner: 'EQ-LABS-TECH',
      repo: 'ee-monorepo',
      token: 'reader',
      governanceToken: 'evidence',
      publisherToken: 'publisher',
      expectedAppId: 123,
      discover: async () => [10, 20],
      resolve: async ({ route }) => ({
        owner: route.owner,
        repo: route.repo,
        number: route.number,
        baseRef: 'main',
        expectedHeadSha: sha,
      }),
      run: async ({ number }) => {
        calls.push(number);

        return {
          mode: 'EVALUATION_AND_PUBLICATION',
          headSha: sha,
          checkId: number,
          conclusion: 'success',
        };
      },
      ...overrides,
    },
  };
}

test('evaluates all discovered PRs', async () => {
  const { context, calls } = fixture();

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(calls, [10, 20]);
  assert.deepEqual(result.results, [
    { number: 10, status: 'PASS' },
    { number: 20, status: 'PASS' },
  ]);
});

test('continues after an individual failure and logs sanitized execution details', async (t) => {
  const calls = [];
  const logs = [];

  t.mock.method(console, 'error', (...args) => logs.push(args));

  const { context } = fixture({
    run: async ({ number }) => {
      calls.push(number);

      if (number === 10) {
        throw new Error('Evaluation failed with HTTP 403 and sensitive-token');
      }

      return {
        mode: 'EVALUATION_AND_PUBLICATION',
        headSha: sha,
        checkId: 20,
        conclusion: 'success',
      };
    },
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'INCOMPLETE');
  assert.deepEqual(calls, [10, 20]);
  assert.deepEqual(result.results, [
    { number: 10, status: 'ERROR' },
    { number: 20, status: 'PASS' },
  ]);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][0], 'PR Governance reconciliation PR failure:');
  assert.deepEqual(JSON.parse(logs[0][1]), {
    number: 10,
    status: 'ERROR',
    headSha: sha,
    phase: 'execute',
    code: 'github-http-error',
    kind: 'Error',
    httpStatus: 403,
  });
  assert.equal(JSON.stringify(logs).includes('sensitive-token'), false);
});

test('logs resolution failures without external error messages', async (t) => {
  const logs = [];

  t.mock.method(console, 'error', (...args) => logs.push(args));

  const { context } = fixture({
    discover: async () => [10],
    resolve: async () => {
      throw new TypeError('GitHub lookup returned HTTP 404 and private details');
    },
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'INCOMPLETE');
  assert.deepEqual(JSON.parse(logs[0][1]), {
    number: 10,
    status: 'ERROR',
    phase: 'resolve',
    code: 'github-http-error',
    kind: 'TypeError',
    httpStatus: 404,
  });
  assert.equal(JSON.stringify(logs).includes('private details'), false);
});

test('preserves sanitized orchestration phase and stable error code', async (t) => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));

  const { context } = fixture({
    discover: async () => [10],
    run: async () => {
      const error = new Error('Private response text must not be logged');
      error.governanceDiagnostic = { phase: 'publication', code: 'check-run-conflict' };
      error.githubRequestId = 'ABCD:5678';
      throw error;
    },
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'INCOMPLETE');
  assert.deepEqual(JSON.parse(logs[0][1]), {
    number: 10,
    status: 'ERROR',
    headSha: sha,
    requestId: 'ABCD:5678',
    phase: 'publication',
    code: 'check-run-conflict',
    kind: 'Error',
  });
  assert.equal(JSON.stringify(logs).includes('Private response text'), false);
});

test('extracts HTTP status from AggregateError causes without logging messages', async (t) => {
  const logs = [];

  t.mock.method(console, 'error', (...args) => logs.push(args));

  const { context } = fixture({
    discover: async () => [10],
    run: async () => {
      throw new AggregateError(
        [new Error('GitHub evidence returned HTTP 403 with private details')],
        'Governance evaluation and failure publication both failed',
      );
    },
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'INCOMPLETE');
  assert.deepEqual(JSON.parse(logs[0][1]), {
    number: 10,
    status: 'ERROR',
    headSha: sha,
    phase: 'execute',
    code: 'github-http-error',
    kind: 'AggregateError',
    httpStatus: 403,
  });
  assert.equal(JSON.stringify(logs).includes('private details'), false);
});

test('a policy-blocked PR is distinct from an operational error', async () => {
  const { context } = fixture({
    discover: async () => [10],
    run: async () => ({
      mode: 'EVALUATION_AND_PUBLICATION',
      headSha: sha,
      checkId: 10,
      conclusion: 'failure',
    }),
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'SUCCESS');
  assert.deepEqual(result.results, [{ number: 10, status: 'BLOCKED' }]);
});

test('rejects duplicate discovery results', async () => {
  const { context } = fixture({
    discover: async () => [10, 10],
  });

  await assert.rejects(reconcileOpenGovernancePrs(context), /Invalid governance discovery results/);
});

test('rejects an unexpected target branch and records it as a resolution error', async (t) => {
  const logs = [];

  t.mock.method(console, 'error', (...args) => logs.push(args));

  const { context } = fixture({
    discover: async () => [10],
    resolve: async () => ({
      owner: 'EQ-LABS-TECH',
      repo: 'ee-monorepo',
      number: 10,
      baseRef: 'develop',
      expectedHeadSha: sha,
    }),
  });

  const result = await reconcileOpenGovernancePrs(context);

  assert.equal(result.status, 'INCOMPLETE');
  assert.equal(result.results[0].status, 'ERROR');
  assert.deepEqual(JSON.parse(logs[0][1]), {
    number: 10,
    status: 'ERROR',
    phase: 'resolve',
    code: 'unexpected-operation-error',
    kind: 'Error',
  });
});

test('fails when discovery is unavailable', async () => {
  const { context } = fixture({
    discover: async () => {
      throw new Error('GitHub API unavailable');
    },
  });

  await assert.rejects(reconcileOpenGovernancePrs(context), /GitHub API unavailable/);
});
