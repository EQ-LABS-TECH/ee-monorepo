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
    { number: 10, status: 'success' },
    { number: 20, status: 'success' },
  ]);
});

test('continues after an individual failure', async () => {
  const calls = [];

  const { context } = fixture({
    run: async ({ number }) => {
      calls.push(number);

      if (number === 10) {
        throw new Error('Evaluation failed');
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
    { number: 10, status: 'error' },
    { number: 20, status: 'success' },
  ]);
});

test('a blocked PR makes the execution incomplete', async () => {
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

  assert.equal(result.status, 'INCOMPLETE');
  assert.deepEqual(result.results, [{ number: 10, status: 'failure' }]);
});

test('rejects duplicate discovery results', async () => {
  const { context } = fixture({
    discover: async () => [10, 10],
  });

  await assert.rejects(reconcileOpenGovernancePrs(context), /Invalid governance discovery results/);
});

test('rejects an unexpected target branch', async () => {
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
  assert.equal(result.results[0].status, 'error');
});

test('fails when discovery is unavailable', async () => {
  const { context } = fixture({
    discover: async () => {
      throw new Error('GitHub API unavailable');
    },
  });

  await assert.rejects(reconcileOpenGovernancePrs(context), /GitHub API unavailable/);
});
