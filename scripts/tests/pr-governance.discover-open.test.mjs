import test from 'node:test';
import assert from 'node:assert/strict';

import { discoverOpenGovernancePrs } from '../lib/pr-governance.discover-open.mjs';

const owner = 'EQ-LABS-TECH';
const repo = 'ee-monorepo';

function pullRequest(number, overrides = {}) {
  return {
    number,
    state: 'open',
    draft: false,
    base: {
      ref: 'main',
      repo: { full_name: `${owner}/${repo}` },
    },
    ...overrides,
  };
}

function createFixture(pages) {
  const calls = [];

  const fetchImpl = async (url, options) => {
    calls.push({ url, options });

    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer test-token');

    const page = Number(new URL(url).searchParams.get('page'));
    const result = pages[page - 1];

    if (result instanceof Error) {
      return {
        ok: false,
        status: 503,
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => result ?? [],
    };
  };

  return {
    calls,
    fetchImpl,
  };
}

function discover(fetchImpl) {
  return discoverOpenGovernancePrs({
    owner,
    repo,
    token: 'test-token',
    fetchImpl,
  });
}

test('returns empty list when no PRs are open', async () => {
  const fixture = createFixture([[]]);

  assert.deepEqual(await discover(fixture.fetchImpl), []);
  assert.equal(fixture.calls.length, 1);
});

test('discovers open PR numbers without trusting review evidence', async () => {
  const fixture = createFixture([[pullRequest(10), pullRequest(20)]]);

  assert.deepEqual(await discover(fixture.fetchImpl), [10, 20]);

  const url = new URL(fixture.calls[0].url);

  assert.equal(url.searchParams.get('state'), 'open');
  assert.equal(url.searchParams.get('base'), 'main');
  assert.equal(url.searchParams.get('per_page'), '100');
});

test('does not reconcile draft PRs before they are ready for review', async () => {
  const fixture = createFixture([
    [pullRequest(10), pullRequest(20, { draft: true }), pullRequest(30)],
  ]);

  assert.deepEqual(await discover(fixture.fetchImpl), [10, 30]);
});

test('paginates until a page contains fewer than 100 PRs', async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => pullRequest(index + 1));

  const fixture = createFixture([firstPage, [pullRequest(101)]]);

  const result = await discover(fixture.fetchImpl);

  assert.equal(result.length, 101);
  assert.deepEqual(
    result,
    Array.from({ length: 101 }, (_, i) => i + 1),
  );
  assert.equal(fixture.calls.length, 2);
});

test('rejects PRs belonging to another target repository', async () => {
  const fixture = createFixture([
    [
      pullRequest(12, {
        base: {
          ref: 'main',
          repo: { full_name: 'OTHER-ORG/other-repo' },
        },
      }),
    ],
  ]);

  await assert.rejects(
    discover(fixture.fetchImpl),
    /Inconsistent governance PR discovery evidence/,
  );
});

test('rejects duplicated PR numbers across pages', async () => {
  const firstPage = Array.from({ length: 100 }, (_, index) => pullRequest(index + 1));

  const fixture = createFixture([firstPage, [pullRequest(100)]]);

  await assert.rejects(
    discover(fixture.fetchImpl),
    /Inconsistent governance PR discovery evidence/,
  );
});

test('rejects incomplete API evidence', async () => {
  const fixture = createFixture([[{ number: 42 }]]);

  await assert.rejects(
    discover(fixture.fetchImpl),
    /Inconsistent governance PR discovery evidence/,
  );
});

test('rejects malformed API responses', async () => {
  const fixture = createFixture([{ items: [] }]);

  await assert.rejects(discover(fixture.fetchImpl), /Invalid governance PR discovery response/);
});

test('fails closed on GitHub API errors', async () => {
  const fixture = createFixture([new Error('Unavailable')]);

  await assert.rejects(discover(fixture.fetchImpl), /HTTP 503/);
});

test('rejects missing credentials before making requests', async () => {
  let calls = 0;

  await assert.rejects(
    discoverOpenGovernancePrs({
      owner,
      repo,
      token: '',
      fetchImpl: async () => {
        calls += 1;
        throw new Error('Unexpected request');
      },
    }),
    /Invalid governance PR discovery context/,
  );

  assert.equal(calls, 0);
});
