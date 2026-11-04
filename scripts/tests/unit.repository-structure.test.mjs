import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateRepositoryStructure } from '../lib/repository-structure.mjs';

const REQUIRED_DIRECTORIES = [
  'apps',
  'apps/extensions',
  'connectors',
  'connectors/official',
  'packages',
  'packages/config',
  'packages/foundation',
  'packages/shared',
  'packages/execution',
  'packages/intelligence',
  'packages/knowledge',
  'packages/governance',
  'packages/integration',
  'packages/registry',
  'packages/sdk',
  'scripts',
];

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ee-repository-structure-'));
  for (const directory of REQUIRED_DIRECTORIES)
    mkdirSync(join(root, directory), { recursive: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('accepts a valid structure and skips ordinary top-level files', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'README.md'), 'repo');

  assert.deepEqual(validateRepositoryStructure({ root }), []);
});

test('requires configured paths to be directories', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-repository-structure-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const directory of REQUIRED_DIRECTORIES.filter((entry) => entry !== 'scripts')) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(join(root, 'scripts'), 'not a directory');

  const errors = validateRepositoryStructure({ root });
  assert.ok(errors.some((error) => error === 'Required path is not a directory: scripts'));
});

test('reports top-level stat failures instead of silently skipping entries', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'uninspectable'));
  const failingPath = join(root, 'uninspectable');
  const fsImpl = {
    readdirSync: fs.readdirSync,
    statSync(path) {
      if (path === failingPath)
        throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
      return fs.statSync(path);
    },
  };

  const errors = validateRepositoryStructure({ root, fsImpl });
  assert.ok(
    errors.some((error) => error.includes('could not inspect top-level entry "uninspectable"')),
  );
});

test('continues to reject forbidden and unlisted top-level directories', (t) => {
  const root = fixture(t);
  mkdirSync(join(root, 'k8s'));
  mkdirSync(join(root, 'new-top-level'));

  const errors = validateRepositoryStructure({ root });
  assert.ok(errors.some((error) => error.includes('forbidden top-level directory "k8s/"')));
  assert.ok(
    errors.some((error) => error.includes('unauthorized top-level directory "new-top-level/"')),
  );
});
