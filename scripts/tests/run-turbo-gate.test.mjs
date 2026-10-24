import test from 'node:test';
import assert from 'node:assert/strict';
import { runTurboGate } from '../lib/run-turbo-gate.mjs';

function harness({ result, summary, summaryError }) {
  const output = {
    stdout: '',
    stderr: '',
    logs: [],
    errors: [],
    args: null,
  };

  const status = runTurboGate({
    task: 'typecheck',
    gateId: 'QG-TYPE-001',
    cwd: '/repo',
    spawnSyncImpl: (_command, args) => {
      output.args = args;
      return result;
    },
    listSummariesImpl: () => new Set(['previous.json']),
    readSummaryImpl: () => {
      if (summaryError) throw summaryError;
      return summary;
    },
    writeOut: (value) => {
      output.stdout += value;
    },
    writeErr: (value) => {
      output.stderr += value;
    },
    log: {
      log: (message) => output.logs.push(message),
      error: (message) => output.errors.push(message),
      warn: (message) => output.logs.push(message),
    },
  });

  return { status, output };
}

test('passes when Turbo execution evidence contains tasks', () => {
  const { status, output } = harness({
    result: {
      status: 0,
      stdout: 'Turbo completed',
      stderr: '',
    },
    summary: { tasks: [{ taskId: 'package#typecheck' }] },
  });

  assert.equal(status, 0);
  assert.deepEqual(output.logs, ['✅ QG-TYPE-001: PASS']);
  assert.deepEqual(output.errors, []);
  assert.deepEqual(output.args, ['exec', 'turbo', 'run', 'typecheck', '--summarize']);
});

test('returns SKIPPED when the execution summary has zero tasks', () => {
  const { status, output } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summary: { tasks: [] },
  });

  assert.equal(status, 2);
  assert.match(output.logs[0], /SKIPPED/);
  assert.deepEqual(output.errors, []);
});

test('returns ERROR when execution evidence is unavailable', () => {
  const { status, output } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summaryError: new Error('summary not found'),
  });

  assert.equal(status, 1);
  assert.match(output.errors[0], /ERROR.*execution evidence unavailable/);
});

test('preserves Turbo task failure as FAIL', () => {
  const { status, output } = harness({
    result: { status: 1, stdout: '', stderr: 'task failed' },
  });

  assert.equal(status, 1);
  assert.equal(output.stderr, 'task failed');
  assert.match(output.errors[0], /FAIL/);
});

test('returns ERROR when Turbo cannot be launched', () => {
  const { status, output } = harness({
    result: {
      status: null,
      error: new Error('spawn pnpm ENOENT'),
      stdout: '',
      stderr: '',
    },
  });

  assert.equal(status, 1);
  assert.match(output.errors[0], /ERROR.*unable to start Turbo/);
});
