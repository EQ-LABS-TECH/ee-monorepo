import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCodeowners, resolveCodeowners } from '@eq-labs/governance/pr-governance/codeowners';

const source = `
* @EQ-LABS-TECH/maintainers
README.md @EQ-LABS-TECH/architecture
.github/ @EQ-LABS-TECH/architecture
scripts/ @EQ-LABS-TECH/maintainers
scripts/lib/pr-governance.* @EQ-LABS-TECH/architecture
scripts/commands/enforce @EQ-LABS-TECH/architecture
scripts/commands/reconcile @EQ-LABS-TECH/architecture
scripts/commands/governance @EQ-LABS-TECH/architecture
scripts/tests/*pr-governance* @EQ-LABS-TECH/architecture
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

test('resolves a single accountable team for automation scripts', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['scripts/lib/example.mjs'],
  });

  assert.deepEqual(result[0].eligibleTeams, ['maintainers']);
});

test('resolves architectural ownership for PR Governance policy implementation and tests', () => {
  const result = resolveCodeowners({
    rules,
    paths: [
      'scripts/lib/pr-governance.evaluate.mjs',
      'scripts/commands/enforce',
      'scripts/commands/reconcile',
      'scripts/commands/governance',
      'scripts/tests/unit.pr-governance-evaluation.test.mjs',
    ],
  });

  assert.deepEqual(
    result.map((entry) => entry.eligibleTeams),
    [['architecture'], ['architecture'], ['architecture'], ['architecture'], ['architecture']],
  );
});

test('resolves mixed ownership independently for each path', () => {
  const result = resolveCodeowners({
    rules,
    paths: ['.github/workflows/ci.yml', 'scripts/lib/example.mjs', 'README.md'],
  });

  assert.deepEqual(
    result.map((entry) => entry.eligibleTeams),
    [['architecture'], ['maintainers'], ['architecture']],
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
  assert.deepEqual(result[0].eligibleTeams, ['maintainers']);
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
      'scripts/commands/enforce',
      'scripts/commands/reconcile',
      'scripts/commands/governance',
      'scripts/tests/unit.pr-governance-evaluation.test.mjs',
      '.github/workflows/ci.yml',
      'packages/config/src/index.ts',
      'packages/knowledge/src/index.ts',
      'package.json',
      'pnpm-workspace.yaml',
      'pnpm-lock.yaml',
      'turbo.json',
      'docs/validation/evidence.md',
      'docs/validation/audit/EE-AUD-Rules_Emerging.md',
      'docs/architecture/EE-DOC-007_GitHub_Governance.md',
      'packages/foundation/src/contracts/provider.ts',
      'packages/foundation/src/contracts/knowledge.ts',
      'packages/foundation/src/contracts/knowledge-status.ts',
      'infra/terraform/main.tf',
      'templates/issue/bug-report.yml',
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
  expectOwners('scripts/lib/pr-governance.evaluate.mjs', ['architecture']);
  expectOwners('scripts/commands/enforce', ['architecture']);
  expectOwners('scripts/commands/reconcile', ['architecture']);
  expectOwners('scripts/commands/governance', ['architecture']);
  expectOwners('scripts/tests/unit.pr-governance-evaluation.test.mjs', ['architecture']);
  expectOwners('.github/workflows/ci.yml', ['architecture']);
  expectOwners('packages/config/src/index.ts', ['architecture']);
  expectOwners('packages/knowledge/src/index.ts', ['maintainers']);
  expectOwners('package.json', ['architecture']);
  expectOwners('pnpm-workspace.yaml', ['architecture']);
  expectOwners('pnpm-lock.yaml', ['architecture']);
  expectOwners('turbo.json', ['architecture']);
  expectOwners('docs/validation/evidence.md', ['maintainers']);
  expectOwners('docs/validation/audit/EE-AUD-Rules_Emerging.md', ['architecture']);
  expectOwners('docs/architecture/EE-DOC-007_GitHub_Governance.md', ['architecture']);
  expectOwners('packages/foundation/src/contracts/provider.ts', ['architecture']);
  expectOwners('packages/foundation/src/contracts/knowledge.ts', ['architecture']);
  expectOwners('packages/foundation/src/contracts/knowledge-status.ts', ['architecture']);
  expectOwners('infra/terraform/main.tf', ['architecture']);
  expectOwners('templates/issue/bug-report.yml', ['architecture']);

  assert.equal(requirements.length, 22);
});
