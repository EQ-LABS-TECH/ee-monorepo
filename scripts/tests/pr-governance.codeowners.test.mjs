import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCodeowners, resolveCodeowners } from '../lib/pr-governance.codeowners.mjs';

const source = `
* @EQ-LABS-TECH/maintainers
README.md @EQ-LABS-TECH/architecture
.github/ @EQ-LABS-TECH/architecture @EQ-LABS-TECH/repository-admin
scripts/ @EQ-LABS-TECH/repository-admin @EQ-LABS-TECH/maintainers
packages/ @EQ-LABS-TECH/maintainers
packages/foundation/src/contracts/knowledge*.ts @EQ-LABS-TECH/architecture
`;

const rules = parseCodeowners(source, 'EQ-LABS-TECH');

test('resolves default owner for an ordinary application path', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['apps/dashboard/src/main.ts'],
  });

  assert.deepEqual(result[0].eligibleTeams, ['maintainers']);
});

test('uses last matching CODEOWNERS rule', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['packages/foundation/src/contracts/knowledge.ts'],
  });

  assert.equal(result[0].pattern, 'packages/foundation/src/contracts/knowledge*.ts');
  assert.deepEqual(result[0].eligibleTeams, ['architecture']);
});

test('preserves alternative owners on one rule', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['scripts/lib/example.mjs'],
  });

  assert.deepEqual(result[0].eligibleTeams, ['repository-admin', 'maintainers']);
});

test('resolves mixed ownership independently for each path', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['.github/workflows/ci.yml', 'scripts/lib/example.mjs', 'README.md'],
  });

  assert.deepEqual(
    result.map((entry) => entry.eligibleTeams),
    [['architecture', 'repository-admin'], ['repository-admin', 'maintainers'], ['architecture']],
  );
});

test('rejects unsupported ownership syntax', () => {
  assert.throws(
    () => parseCodeowners('src/**/internal/*.ts @EQ-LABS-TECH/architecture', 'EQ-LABS-TECH'),
    /Unsupported CODEOWNERS/,
  );
});

test('rejects owner from another organization', () => {
  assert.throws(
    () => parseCodeowners('* @OTHER-ORG/maintainers', 'EQ-LABS-TECH'),
    /Unsupported CODEOWNERS owner/,
  );
});

test('rejects uncovered paths', () => {
  const restricted = parseCodeowners('scripts/ @EQ-LABS-TECH/maintainers', 'EQ-LABS-TECH');

  assert.throws(
    () =>
      resolveCodeowners({
        rules: restricted,
        paths: ['README.md'],
      }),
    /No CODEOWNERS rule covers/,
  );
});

test('rejects unsafe paths', () => {
  assert.throws(
    () =>
      resolveCodeowners({
        rules,
        paths: ['../scripts/example.mjs'],
      }),
    TypeError,
  );
});

test('matches file names case-sensitively', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['readme.md'],
  });

  assert.deepEqual(result[0].eligibleTeams, ['maintainers']);
});

test('matches unanchored file patterns in nested directories', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['examples/README.md'],
  });

  assert.equal(result[0].pattern, 'README.md');
  assert.deepEqual(result[0].eligibleTeams, ['architecture']);
});

test('matches unanchored directory patterns at any depth', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['tools/scripts/example.mjs'],
  });

  assert.equal(result[0].pattern, 'scripts/');
  assert.deepEqual(result[0].eligibleTeams, ['repository-admin', 'maintainers']);
});

test('preserves root anchoring for patterns containing directories', () => {
  const result = resolveCodeowners({
    rules,
    paths: [
      'packages/foundation/src/contracts/knowledge.ts',
      'examples/packages/foundation/src/contracts/knowledge.ts',
    ],
  });

  assert.deepEqual(
    result.map((entry) => entry.eligibleTeams),
    [['architecture'], ['maintainers']],
  );
});

test('repository CODEOWNERS resolves actual governance boundaries', async () => {
  const { readFile } = await import('node:fs/promises');

  const source = await readFile(new URL('../../.github/CODEOWNERS', import.meta.url), 'utf8');

  const rules = parseCodeowners(source, 'EQ-LABS-TECH');

  const requirements = resolveCodeowners({
    rules,
    paths: [
      'apps/dashboard/src/main.ts',
      'README.md',
      'scripts/lib/pr-governance.evaluate.mjs',
      '.github/workflows/ci.yml',
      'packages/config/src/index.ts',
      'docs/validation/evidence.md',
      'packages/foundation/src/contracts/provider.ts',
      'infra/terraform/main.tf',
    ],
  });

  const ownersByPath = new Map(
    requirements.map(({ path, eligibleTeams }) => [path, [...eligibleTeams].sort()]),
  );

  const expectOwners = (path, teams) => {
    assert.deepEqual(ownersByPath.get(path), [...teams].sort());
  };

  expectOwners('apps/dashboard/src/main.ts', ['maintainers']);
  expectOwners('README.md', ['architecture']);
  expectOwners('scripts/lib/pr-governance.evaluate.mjs', ['repository-admin', 'maintainers']);
  expectOwners('.github/workflows/ci.yml', ['architecture', 'repository-admin']);
  expectOwners('packages/config/src/index.ts', ['architecture', 'maintainers']);
  expectOwners('docs/validation/evidence.md', ['architecture']);
  expectOwners('packages/foundation/src/contracts/provider.ts', ['architecture']);
  expectOwners('infra/terraform/main.tf', ['architecture', 'repository-admin']);

  assert.equal(requirements.length, 8);
});
