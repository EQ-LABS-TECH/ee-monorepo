import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { lintScripts } from '../lib/lint-scripts.mjs';

function createFixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'qg-lint-scripts-'));
  const scripts = join(cwd, 'scripts');

  mkdirSync(join(scripts, 'commands'), { recursive: true });
  mkdirSync(join(scripts, 'lib'), { recursive: true });
  mkdirSync(join(scripts, 'tests'), { recursive: true });
  writeFileSync(join(scripts, 'eslint.config.mjs'), 'export default [];\n');
  writeFileSync(join(scripts, 'commands', 'lint'), '#!/usr/bin/env node\n');
  writeFileSync(join(scripts, 'lib', 'helper.mjs'), 'export {};\n');
  writeFileSync(join(scripts, 'tests', 'helper.test.mjs'), 'export {};\n');
  writeFileSync(join(scripts, 'plopfile.mjs'), 'export {};\n');

  return { cwd, scripts };
}

function eslintResult(filePaths, { status = 0, errors = 0 } = {}) {
  return {
    status,
    stdout: JSON.stringify(
      filePaths.map((filePath, index) => ({
        filePath,
        errorCount: errors && index === 0 ? errors : 0,
        warningCount: 0,
        messages:
          errors && index === 0 ? [{ severity: 2, line: 1, column: 1, message: 'lint error' }] : [],
      })),
    ),
    stderr: '',
  };
}

test('lints source modules, tests, config, and extensionless command entrypoints', () => {
  const { cwd, scripts } = createFixture();
  let invocation;

  try {
    const result = lintScripts({
      cwd,
      spawnSyncImpl: (command, args, options) => {
        invocation = { command, args, options };
        return eslintResult(
          [
            join(scripts, 'eslint.config.mjs'),
            join(scripts, 'commands', 'lint'),
            join(scripts, 'lib', 'helper.mjs'),
            join(scripts, 'tests', 'helper.test.mjs'),
            join(scripts, 'plopfile.mjs'),
          ].sort(),
        );
      },
      writeOut: () => {},
      writeErr: () => {},
    });

    assert.equal(result.status, 'PASS');
    assert.equal(invocation.command, process.execPath);
    assert.equal(invocation.args[0], join(scripts, 'lib', 'run-eslint-scripts.mjs'));
    assert.deepEqual(JSON.parse(invocation.options.input), [
      join(scripts, 'commands', 'lint'),
      join(scripts, 'eslint.config.mjs'),
      join(scripts, 'lib', 'helper.mjs'),
      join(scripts, 'plopfile.mjs'),
      join(scripts, 'tests', 'helper.test.mjs'),
    ]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('fails closed when no script source files are discovered', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'qg-lint-empty-'));

  try {
    mkdirSync(join(cwd, 'scripts'));

    const result = lintScripts({ cwd, spawnSyncImpl: () => assert.fail('ESLint must not run') });

    assert.equal(result.status, 'ERROR');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('fails when ESLint omits discovered files from its evidence', () => {
  const { cwd } = createFixture();

  try {
    const result = lintScripts({
      cwd,
      spawnSyncImpl: () => ({ status: 0, stdout: '[]', stderr: '' }),
      writeOut: () => {},
      writeErr: () => {},
    });

    assert.equal(result.status, 'ERROR');
    assert.match(result.detail, /omitted/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('fails when ESLint reports errors', () => {
  const { cwd } = createFixture();

  try {
    const result = lintScripts({
      cwd,
      spawnSyncImpl: (_command, _args, options) =>
        eslintResult(JSON.parse(options.input), { status: 1, errors: 1 }),
      writeOut: () => {},
      writeErr: () => {},
    });

    assert.equal(result.status, 'FAIL');
    assert.match(result.detail, /1 error/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('returns ERROR when the ESLint process cannot start', () => {
  const { cwd } = createFixture();

  try {
    const result = lintScripts({
      cwd,
      spawnSyncImpl: () => ({ status: null, error: new Error('pnpm unavailable') }),
    });

    assert.equal(result.status, 'ERROR');
    assert.match(result.detail, /Unable to start ESLint/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
