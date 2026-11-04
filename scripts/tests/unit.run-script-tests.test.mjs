import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runScriptTests } from '../lib/run-script-tests.mjs';

function outputSink() {
  const output = { logs: [], errors: [], stdout: '', stderr: '' };
  return {
    output,
    sink: {
      log: (message) => output.logs.push(message),
      error: (message) => output.errors.push(message),
      writeOut: (value) => (output.stdout += value),
      writeErr: (value) => (output.stderr += value),
    },
  };
}

test('returns ERROR when the test directory is missing or empty', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-script-tests-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  for (const testsDir of [join(root, 'missing'), root]) {
    const { output, sink } = outputSink();
    const result = runScriptTests({ testsDir, output: sink });

    assert.equal(result.status, 'ERROR');
    assert.equal(result.exitCode, 1);
    assert.equal(result.files, 0);
    assert.match(output.errors.join('\n'), /no \*\.test\.mjs found/);
    assert.match(output.logs.join('\n'), /QG_RESULT .*"status":"ERROR"/);
  }
});

test('returns ERROR when the test process cannot complete with an exit code', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-script-tests-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'unit.sample.test.mjs'), '');

  const { sink } = outputSink();
  const result = runScriptTests({
    testsDir: root,
    spawnSyncImpl: () => ({ status: null, signal: 'SIGTERM', stdout: '', stderr: '' }),
    output: sink,
  });

  assert.equal(result.status, 'ERROR');
  assert.equal(result.exitCode, 1);
});

test('passes only with a complete successful TAP summary', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'ee-script-tests-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'unit.sample.test.mjs'), '');

  const { output, sink } = outputSink();
  const result = runScriptTests({
    testsDir: root,
    spawnSyncImpl: () => ({
      status: 0,
      stdout: '# tests 1\n# pass 1\n# fail 0\n# skipped 0\n',
      stderr: '',
    }),
    output: sink,
  });

  assert.equal(result.status, 'PASS');
  assert.equal(result.exitCode, 0);
  assert.match(output.logs.join('\n'), /QG_RESULT .*"status":"PASS"/);
});
