import test from 'node:test';
import assert from 'node:assert/strict';
import { runTurboGate } from '../lib/run-turbo-gate.mjs';

function harness(result) {
  const output = { stdout: '', stderr: '', logs: [], errors: [], args: null };
  const status = runTurboGate({
    task: 'typecheck',
    gateId: 'QG-TYPE-001',
    spawnSyncImpl: (_command, args) => {
      output.args = args;
      return result;
    },
    writeOut: (value) => { output.stdout += value; },
    writeErr: (value) => { output.stderr += value; },
    log: {
      log: (message) => output.logs.push(message),
      error: (message) => output.errors.push(message),
      warn: (message) => output.logs.push(message),
    },
  });
  return { status, output };
}

test('passes only when Turbo reports executed tasks', () => {
  const { status, output } = harness({
    status: 0,
    stdout: 'Tasks: 3 successful, 3 total',
    stderr: '',
  });
  assert.equal(status, 0);
  assert.deepEqual(output.logs, ['✅ QG-TYPE-001: PASS']);
  assert.deepEqual(output.errors, []);
  assert.deepEqual(output.args, ['exec', 'turbo', 'run', 'typecheck']);
});

test('classifies Turbo success with no executed tasks as SKIPPED', () => {
  const { status, output } = harness({
    status: 0,
    stdout: 'No tasks were executed as part of this run',
    stderr: '',
  });
  assert.equal(status, 0);
  assert.match(output.logs[0], /SKIPPED/);
  assert.deepEqual(output.errors, []);
});

test('classifies a zero-task summary as SKIPPED', () => {
  const { status, output } = harness({
    status: 0,
    stdout: 'Tasks: 0 successful, 0 total',
    stderr: '',
  });
  assert.equal(status, 2);
  assert.match(output.logs[0], /SKIPPED/);
  assert.deepEqual(output.errors, []);
});

test('preserves Turbo failure status', () => {
  const { status, output } = harness({ status: 2, stdout: '', stderr: 'task failed' });
  assert.equal(status, 2);
  assert.equal(output.stderr, 'task failed');
  assert.match(output.errors[0], /status 2/);
});

test('fails when the process cannot be launched', () => {
  const { status, output } = harness({
    status: null,
    error: new Error('spawn pnpm ENOENT'),
    stdout: '',
    stderr: '',
  });
  assert.equal(status, 1);
  assert.match(output.errors[0], /unable to start Turbo/);
});
