import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePrGovernanceRoute } from '../lib/pr-governance.resolve.mjs';

const headSha = 'a'.repeat(40);
const baseSha = 'b'.repeat(40);

const route = {
  status: 'READY',
  scope: 'PR_SCOPE',
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
};

function currentPr(overrides = {}) {
  return {
    number: 42,
    state: 'open',
    base: {
      ref: 'main',
      sha: baseSha,
      repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
    },
    head: {
      sha: headSha,
      repo: { full_name: 'contributor/ee-monorepo' },
    },
    ...overrides,
  };
}

function fixture(responses) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method });

    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer reader-token');

    const next = responses[calls.length - 1];

    return {
      ok: true,
      status: 200,
      json: async () => next,
    };
  };

  return { fetchImpl, calls };
}

test('resolves current HEAD from two consistent GitHub reads', async () => {
  const mock = fixture([currentPr(), currentPr()]);

  const result = await resolvePrGovernanceRoute({
    route,
    token: 'reader-token',
    fetchImpl: mock.fetchImpl,
  });

  assert.deepEqual(result, {
    owner: 'EQ-LABS-TECH',
    repo: 'ee-monorepo',
    number: 42,
    expectedHeadSha: headSha,
    baseSha,
  });

  assert.equal(mock.calls.length, 2);
});

test('changed HEAD prevents trusted execution context', async () => {
  const mock = fixture([
    currentPr(),
    currentPr({
      head: {
        sha: 'c'.repeat(40),
        repo: { full_name: 'contributor/ee-monorepo' },
      },
    }),
  ]);

  await assert.rejects(
    resolvePrGovernanceRoute({
      route,
      token: 'reader-token',
      fetchImpl: mock.fetchImpl,
    }),
    /changed during route resolution/,
  );
});

test('changed base SHA prevents trusted execution context', async () => {
  const mock = fixture([
    currentPr(),
    currentPr({
      base: {
        ref: 'main',
        sha: 'c'.repeat(40),
        repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
      },
    }),
  ]);

  await assert.rejects(
    resolvePrGovernanceRoute({
      route,
      token: 'reader-token',
      fetchImpl: mock.fetchImpl,
    }),
    /changed during route resolution/,
  );
});

test('closed pull request is rejected', async () => {
  const mock = fixture([currentPr({ state: 'closed' })]);

  await assert.rejects(
    resolvePrGovernanceRoute({
      route,
      token: 'reader-token',
      fetchImpl: mock.fetchImpl,
    }),
    /Invalid or closed PN-017 pull request/,
  );

  assert.equal(mock.calls.length, 1);
});

test('different target repository is rejected', async () => {
  const mock = fixture([
    currentPr({
      base: {
        ref: 'main',
        sha: baseSha,
        repo: { full_name: 'OTHER-ORG/other-repo' },
      },
    }),
  ]);

  await assert.rejects(
    resolvePrGovernanceRoute({
      route,
      token: 'reader-token',
      fetchImpl: mock.fetchImpl,
    }),
    /Invalid or closed PN-017 pull request/,
  );
});

test('unresolved organization route is rejected without API calls', async () => {
  let calls = 0;

  await assert.rejects(
    resolvePrGovernanceRoute({
      route: {
        status: 'DISCOVERY_REQUIRED',
        scope: 'ORG_SCOPE',
        organization: 'EQ-LABS-TECH',
      },
      token: 'reader-token',
      fetchImpl: async () => {
        calls += 1;
        throw new Error('Unexpected API call');
      },
    }),
    /Invalid PN-017 PR resolution request/,
  );

  assert.equal(calls, 0);
});

test('missing token is rejected without API calls', async () => {
  let calls = 0;

  await assert.rejects(
    resolvePrGovernanceRoute({
      route,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('Unexpected API call');
      },
    }),
    /Invalid PN-017 PR resolution request/,
  );

  assert.equal(calls, 0);
});
