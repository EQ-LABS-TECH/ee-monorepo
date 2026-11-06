import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runDoctor } from '../lib/doctor.mjs';

test('does not report a command as passed when it exits unsuccessfully', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-doctor-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  for (const path of [
    'pnpm-workspace.yaml',
    'turbo.json',
    '.npmrc',
    '.nvmrc',
    '.editorconfig',
    '.gitignore',
    '.gitattributes',
    'LICENSE',
    'NOTICE',
    'README.md',
    'CHANGELOG.md',
  ]) {
    writeFileSync(join(root, path), '');
  }
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      devDependencies: { turbo: '2.x' },
      packageManager: 'pnpm@10',
      engines: { node: '>=24' },
    }),
  );
  for (const path of [
    'apps',
    'packages',
    'connectors/official',
    'connectors/community',
    'connectors/experimental',
    'scripts',
    '.github',
    '.vscode',
  ]) {
    mkdirSync(join(root, path), { recursive: true });
  }

  const logs = [];
  const errors = [];
  let calls = 0;
  const result = runDoctor({
    root,
    spawnSyncImpl: () => ({ status: ++calls === 1 ? 1 : 0 }),
    output: { log: (value) => logs.push(value), error: (value) => errors.push(value) },
  });
  const output = logs.join('\n');

  assert.deepEqual(result, { status: 'FAIL', exitCode: 1 });
  assert.match(output, /Checking Node\.js/);
  assert.match(output, /✗ Node\.js: failed/);
  assert.doesNotMatch(output, /✓ Node\.js: passed/);
  assert.doesNotMatch(output, /Diagnostic completed successfully/);
  assert.match(errors.join('\n'), /Diagnostic completed with errors/);
});
