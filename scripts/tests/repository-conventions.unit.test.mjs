import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getCurrentBranchName,
  validateBranchName,
  validateCommitMessages,
  validateRepositoryFileNames,
} from '../lib/repository-conventions.mjs';

test('accepts kebab-case artifacts and the governed EE document filename exception', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'scripts/lib/repository-conventions.mjs',
      'docs/architecture/EE-DOC-006_Repository_Structure.md',
    ]),
    [],
  );
});

test('rejects non-kebab-case new artifacts and directories', () => {
  const violations = validateRepositoryFileNames(['scripts/lib/MyModule.mjs', 'BadDir/file.mjs']);
  assert.deepEqual(
    violations.map(({ code }) => code),
    ['file-not-kebab-case', 'directory-not-kebab-case'],
  );
});

test('requires an explicit type suffix for new test files in any directory', () => {
  const violations = validateRepositoryFileNames([
    'packages/new-package/src/engine.test.ts',
    'packages/new-package/src/engine.unit.test.ts',
    'packages/new-package/src/engine.integration.test.ts',
    'packages/new-package/src/engine.unit.spec.ts',
    'packages/new-package/src/engine.e2e.spec.ts',
  ]);
  assert.deepEqual(violations, [
    { path: 'packages/new-package/src/engine.test.ts', code: 'test-type-suffix-required' },
    {
      path: 'packages/new-package/src/engine.integration.test.ts',
      code: 'test-type-suffix-required',
    },
    { path: 'packages/new-package/src/engine.unit.spec.ts', code: 'test-type-suffix-required' },
  ]);
});

test('accepts only the normative test type suffixes for new files', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'packages/new-package/src/engine.unit.test.ts',
      'packages/new-package/src/engine.int.test.ts',
      'packages/new-package/src/engine.component.test.ts',
      'apps/dashboard/tests/e2e/dashboard.e2e.spec.ts',
    ]),
    [],
  );
});

test('accepts standard branch prefixes with kebab-case descriptions', () => {
  assert.equal(validateBranchName('feat/pr-governance-rules'), null);
  assert.equal(validateBranchName('main'), null);
  assert.equal(validateBranchName('feature/user-authentication'), null);
  assert.equal(validateBranchName('feature/MyFeature')?.code, 'branch-name-invalid');
});

test('validates Conventional Commit headers', () => {
  assert.deepEqual(validateCommitMessages(['feat(auth): add login', 'fix: correct retry']), []);
  assert.equal(validateCommitMessages(['update dependencies'])[0].code, 'commit-message-invalid');
});

test('resolves the PR source branch during pull_request_review', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'ee-pr-review-'));
  const eventPath = join(directory, 'event.json');

  const keys = ['GITHUB_HEAD_REF', 'GITHUB_EVENT_NAME', 'GITHUB_EVENT_PATH'];
  const previous = keys.map((key) => [key, process.env[key]]);

  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    rmSync(directory, { recursive: true, force: true });
  });

  delete process.env.GITHUB_HEAD_REF;
  process.env.GITHUB_EVENT_NAME = 'pull_request_review';
  process.env.GITHUB_EVENT_PATH = eventPath;

  writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        head: { ref: 'feat/ee-repository-standards' },
      },
    }),
  );

  assert.equal(getCurrentBranchName(), 'feat/ee-repository-standards');
  assert.equal(validateBranchName(getCurrentBranchName()), null);

  writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        head: { ref: 'feat/Invalid-Branch' },
      },
    }),
  );

  assert.equal(validateBranchName(getCurrentBranchName())?.code, 'branch-name-invalid');
});
