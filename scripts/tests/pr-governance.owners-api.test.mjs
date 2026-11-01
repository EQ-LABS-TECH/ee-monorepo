import test from 'node:test';
import assert from 'node:assert/strict';
import { readCodeownersEvidence } from '../lib/pr-governance.owners-api.mjs';

const baseSha = 'a'.repeat(40);

const source = [
  '* @EQ-LABS-TECH/maintainers',
  '.github/ @EQ-LABS-TECH/architecture @EQ-LABS-TECH/repository-admin',
  'scripts/ @EQ-LABS-TECH/repository-admin @EQ-LABS-TECH/maintainers',
].join('\n');

const options = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  baseSha,
  paths: ['.github/workflows/ci.yml', 'scripts/lib/example.mjs'],
  token: 'test-token',
};

function response(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
  };
}

function fixture({ errors = [], content = source, contentStatus = 200, errorStatus = 200 } = {}) {
  return async (url, init) => {
    assert.equal(init.method, 'GET');
    assert.equal(init.headers.Authorization, 'Bearer test-token');
    assert.ok(url.includes(`ref=${baseSha}`));

    if (url.includes('/codeowners/errors?')) {
      return response({ errors }, errorStatus);
    }

    if (url.includes('/contents/.github/CODEOWNERS?')) {
      return response(
        {
          type: 'file',
          path: '.github/CODEOWNERS',
          encoding: 'base64',
          size: Buffer.byteLength(content),
          content: Buffer.from(content).toString('base64'),
        },
        contentStatus,
      );
    }

    throw new Error(`Unexpected GitHub API request: ${url}`);
  };
}

test('resolves CODEOWNERS from the exact base commit', async () => {
  const result = await readCodeownersEvidence({
    ...options,
    fetchImpl: fixture(),
  });

  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.baseSha, baseSha);
  assert.deepEqual(
    result.requirements.map((entry) => entry.eligibleTeams),
    [
      ['architecture', 'repository-admin'],
      ['repository-admin', 'maintainers'],
    ],
  );
});

test('GitHub CODEOWNERS errors block resolution', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      fetchImpl: fixture({
        errors: [{ line: 2, kind: 'Invalid owner' }],
      }),
    }),
    /GitHub reports invalid CODEOWNERS rules/,
  );
});

test('unavailable CODEOWNERS blocks resolution', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      fetchImpl: fixture({ contentStatus: 404 }),
    }),
    /HTTP 404/,
  );
});

test('unavailable errors endpoint blocks resolution', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      fetchImpl: fixture({ errorStatus: 403 }),
    }),
    /HTTP 403/,
  );
});

test('unsupported CODEOWNERS patterns block resolution', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      fetchImpl: fixture({
        content: '**/*.ts @EQ-LABS-TECH/architecture',
      }),
    }),
    /Unsupported CODEOWNERS pattern/,
  );
});

test('missing base SHA cannot use a mutable default branch', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      baseSha: undefined,
      fetchImpl: fixture(),
    }),
    TypeError,
  );
});

test('empty changed-file evidence is rejected', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      paths: [],
      fetchImpl: fixture(),
    }),
    TypeError,
  );
});

test('malformed CODEOWNERS content is rejected', async () => {
  await assert.rejects(
    readCodeownersEvidence({
      ...options,
      fetchImpl: async (url) =>
        url.includes('/codeowners/errors?')
          ? response({ errors: [] })
          : response({
              type: 'file',
              path: '.github/CODEOWNERS',
              encoding: 'base64',
              size: 10,
              content: '@@@@',
            }),
    }),
    /Invalid CODEOWNERS base64 content/,
  );
});
