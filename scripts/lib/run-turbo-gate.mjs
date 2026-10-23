#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

/**
 * Executes a required Turbo gate and reports PASS, SKIPPED, or FAIL distinctly.
 * Captured output is forwarded unchanged and inspected for Turbo's empty-task result.
 */
export function runTurboGate({
  task,
  gateId,
  args = [],
  cwd = process.cwd(),
  env = process.env,
  spawnSyncImpl = spawnSync,
  writeOut = (value) => process.stdout.write(value),
  writeErr = (value) => process.stderr.write(value),
  log = console,
}) {
  const result = spawnSyncImpl('pnpm', ['exec', 'turbo', 'run', task, ...args], {
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
    log.error(`❌ ${gateId}: FAIL — unable to start Turbo: ${result.error.message}`);
    return 1;
  }

  if (result.status !== 0) {
    log.error(`❌ ${gateId}: FAIL — Turbo exited with status ${result.status ?? 1}.`);
    return result.status ?? 1;
  }

  const output = `${stdout}\n${stderr}`;
  const zeroTasks =
    /No tasks were executed as part of this run/i.test(output) ||
    /Tasks:\s*0 successful,\s*0 total/i.test(output);

  if (zeroTasks) {
    log.warn(`⚠️ ${gateId}: SKIPPED — Turbo completed without executing any tasks (exit code 2).`);
    return 2;
  }

  log.log(`✅ ${gateId}: PASS`);
  return 0;
}
