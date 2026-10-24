import test from 'node:test';
import assert from 'node:assert/strict';
import { runTurboGate } from '../lib/run-turbo-gate.mjs';

function harness({ result, summary, summaryError }) {
  const output = {
    stdout: '',
    stderr: '',
    logs: [],
    errors: [],
    warnings: [],
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
      warn: (message) => output.warnings.push(message),
    },
  });

  const marker = output.stdout.split(/\r?\n/).find((line) => line.startsWith('QG_RESULT '));

  return {
    status,
    output,
    contract: marker ? JSON.parse(marker.slice('QG_RESULT '.length)) : null,
  };
}

test('passes when execution evidence contains successful tasks', () => {
  const { status, output, contract } = harness({
    result: {
      status: 0,
      stdout: 'Turbo completed',
      stderr: '',
    },
    summary: {
      tasks: [
        {
          taskId: 'package#typecheck',
          execution: { exitCode: 0 },
        },
      ],
    },
  });

  assert.equal(status, 0);
  assert.equal(contract.status, 'PASS');
  assert.equal(contract.gateId, 'QG-TYPE-001');
  assert.deepEqual(output.errors, []);
  assert.deepEqual(output.args, ['exec', 'turbo', 'run', 'typecheck', '--summarize']);
});

test('returns SKIPPED only when the execution summary has zero tasks', () => {
  const { status, contract } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summary: { tasks: [] },
  });

  assert.equal(status, 2);
  assert.equal(contract.status, 'SKIPPED');
});

test('returns ERROR when execution evidence is unavailable', () => {
  const { status, contract } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summaryError: new Error('summary not found'),
  });

  assert.equal(status, 1);
  assert.equal(contract.status, 'ERROR');
});

test('returns ERROR when a task has no execution or cache evidence', () => {
  const { status, contract } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summary: {
      tasks: [{ taskId: 'package#typecheck' }],
    },
  });

  assert.equal(status, 1);
  assert.equal(contract.status, 'ERROR');
});

test('returns FAIL when task evidence reports a nonzero exit code', () => {
  const { status, contract } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summary: {
      tasks: [
        {
          taskId: 'package#typecheck',
          execution: { exitCode: 1 },
        },
      ],
    },
  });

  assert.equal(status, 1);
  assert.equal(contract.status, 'FAIL');
});

test('returns PASS for a successful cache hit', () => {
  const { status, contract } = harness({
    result: { status: 0, stdout: '', stderr: '' },
    summary: {
      tasks: [
        {
          taskId: 'package#typecheck',
          cache: { status: 'HIT' },
        },
      ],
    },
  });

  assert.equal(status, 0);
  assert.equal(contract.status, 'PASS');
});

test('preserves a Turbo process failure as FAIL', () => {
  const { status, output, contract } = harness({
    result: {
      status: 2,
      stdout: '',
      stderr: 'task failed',
    },
  });

  assert.equal(status, 1);
  assert.equal(output.stderr, 'task failed');
  assert.equal(contract.status, 'FAIL');
});

test('returns ERROR when Turbo cannot be launched', () => {
  const { status, output, contract } = harness({
    result: {
      status: null,
      error: new Error('spawn pnpm ENOENT'),
      stdout: '',
      stderr: '',
    },
  });

  assert.equal(status, 1);
  assert.match(output.errors[0], /ERROR.*unable to start Turbo/);
  assert.equal(contract.status, 'ERROR');
});
