#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

function emitResult({ gateId, status, exitCode, detail, writeOut, log }) {
  const message = `${gateId}: ${status}${detail ? ` — ${detail}` : ''}`;

  if (status === 'PASS') {
    log.log(`✅ ${message}`);
  } else if (status === 'SKIPPED') {
    log.warn(`⚠️ ${message}`);
  } else {
    log.error(`❌ ${message}`);
  }

  writeOut(`\nQG_RESULT ${JSON.stringify({ gateId, status, exitCode })}\n`);

  return exitCode;
}

function readExecutionSummary({ cwd, stdout, stderr }) {
  // The summary path identifies this invocation; the JSON supplies the evidence.
  const output = `${stdout}\n${stderr}`;
  const match = output.match(/^Summary:\s*(.+\.json)\s*$/m);

  if (!match) {
    throw new Error('Turbo did not report a run summary path.');
  }

  const runsDirectory = resolve(cwd, '.turbo', 'runs');
  const summaryPath = resolve(cwd, match[1]);
  const pathFromRuns = relative(runsDirectory, summaryPath);

  if (
    pathFromRuns === '' ||
    pathFromRuns === '..' ||
    pathFromRuns.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRuns)
  ) {
    throw new Error('Turbo summary path is outside .turbo/runs/.');
  }

  const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));

  if (!Array.isArray(summary.tasks)) {
    throw new Error('Turbo run summary does not contain a tasks array.');
  }

  return summary;
}

function evaluateTasks(tasks) {
  if (tasks.length === 0) {
    return {
      status: 'SKIPPED',
      detail: 'Turbo executed zero tasks.',
    };
  }

  for (const task of tasks) {
    if (typeof task.execution?.exitCode === 'number') {
      if (task.execution.exitCode !== 0) {
        return {
          status: 'FAIL',
          detail: `Task ${task.taskId ?? '(unknown task)'} exited with ${task.execution.exitCode}.`,
        };
      }

      continue;
    }

    // A successful cache hit is evidence that Turbo satisfied this task from cache.
    if (task.cache?.status === 'HIT') {
      continue;
    }

    return {
      status: 'ERROR',
      detail: `Execution result unavailable for task ${task.taskId ?? '(unknown task)'}.`,
    };
  }

  return { status: 'PASS' };
}

/**
 * Exit contract:
 *   0 = PASS
 *   1 = FAIL or ERROR
 *   2 = SKIPPED (confirmed zero-task summary)
 */
export function runTurboGate({
  task,
  gateId,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  spawnSyncImpl = spawnSync,
  readSummaryImpl = readExecutionSummary,
  writeOut = (value) => process.stdout.write(value),
  writeErr = (value) => process.stderr.write(value),
  log = console,
}) {
  const result = spawnSyncImpl('pnpm', ['exec', 'turbo', 'run', task, ...args, '--summarize'], {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
    cwd,
    env,
  });

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';

  if (stdout) writeOut(stdout);
  if (stderr) writeErr(stderr);

  if (result.error) {
    return emitResult({
      gateId,
      status: 'ERROR',
      exitCode: 1,
      detail: `unable to start Turbo: ${result.error.message}`,
      writeOut,
      log,
    });
  }

  if (result.status !== 0) {
    return emitResult({
      gateId,
      status: 'FAIL',
      exitCode: 1,
      detail: `Turbo exited with status ${result.status ?? 'unknown'}.`,
      writeOut,
      log,
    });
  }

  let summary;

  try {
    summary = readSummaryImpl({ cwd, stdout, stderr });
  } catch (error) {
    return emitResult({
      gateId,
      status: 'ERROR',
      exitCode: 1,
      detail: `execution evidence unavailable: ${error instanceof Error ? error.message : String(error)}`,
      writeOut,
      log,
    });
  }

  const evaluated = evaluateTasks(summary.tasks);

  return emitResult({
    gateId,
    status: evaluated.status,
    exitCode: evaluated.status === 'PASS' ? 0 : evaluated.status === 'SKIPPED' ? 2 : 1,
    detail: evaluated.detail,
    writeOut,
    log,
  });
}
