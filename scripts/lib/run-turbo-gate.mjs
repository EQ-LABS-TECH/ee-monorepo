#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function listRunSummaries(cwd) {
  const directory = join(cwd, '.turbo', 'runs');

  try {
    return new Set(readdirSync(directory).filter((file) => file.endsWith('.json')));
  } catch {
    return new Set();
  }
}

function readExecutionSummary({ cwd, previousFiles }) {
  const directory = join(cwd, '.turbo', 'runs');
  const currentFiles = readdirSync(directory).filter((file) => file.endsWith('.json'));
  const newFiles = currentFiles.filter((file) => !previousFiles.has(file));

  if (newFiles.length !== 1) {
    throw new Error(`Expected one new Turbo run summary; found ${newFiles.length}.`);
  }

  const summary = JSON.parse(readFileSync(join(directory, newFiles[0]), 'utf-8'));

  if (!Array.isArray(summary.tasks)) {
    throw new Error('Turbo run summary does not contain a tasks array.');
  }

  return summary;
}

/**
 * Executes a Turbo quality gate and distinguishes PASS, SKIPPED, FAIL and ERROR.
 *
 * Exit codes:
 *   0 = PASS
 *   1 = FAIL or ERROR
 *   2 = SKIPPED (no tasks executed)
 */
export function runTurboGate({
  task,
  gateId,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  spawnSyncImpl = spawnSync,
  readSummaryImpl = readExecutionSummary,
  listSummariesImpl = listRunSummaries,
  writeOut = (value) => process.stdout.write(value),
  writeErr = (value) => process.stderr.write(value),
  log = console,
}) {
  let previousFiles;

  try {
    previousFiles = listSummariesImpl(cwd);
  } catch (error) {
    log.error(`❌ ${gateId}: ERROR — cannot inspect Turbo run summaries: ${error.message}`);
    return 1;
  }

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
    log.error(`❌ ${gateId}: ERROR — unable to start Turbo: ${result.error.message}`);
    return 1;
  }

  if (result.status !== 0) {
    log.error(`❌ ${gateId}: FAIL — Turbo exited with status ${result.status ?? 1}.`);
    return result.status && result.status > 0 ? result.status : 1;
  }

  let summary;

  try {
    summary = readSummaryImpl({ cwd, previousFiles });
  } catch (error) {
    log.error(`❌ ${gateId}: ERROR — execution evidence unavailable: ${error.message}`);
    return 1;
  }

  if (summary.tasks.length === 0) {
    log.warn(`⚠️ ${gateId}: SKIPPED — Turbo executed zero tasks.`);
    return 2;
  }

  log.log(`✅ ${gateId}: PASS`);
  return 0;
}
