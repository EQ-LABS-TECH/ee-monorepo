#!/usr/bin/env node
/**
 * Shared discovery + execution for scripts/tests/*.test.mjs.
 *
 * Keeps test discovery deterministic and portable across Windows and CI.
 * Emits the standard QG_RESULT contract consumed by scripts/commands/validate.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { performance } from 'node:perf_hooks';

const GATE_ID = 'QG-SCRIPTS-001';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const TESTS_DIR = join(ROOT, 'scripts', 'tests');

function discover() {
  if (!existsSync(TESTS_DIR)) return [];

  return readdirSync(TESTS_DIR)
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => join(TESTS_DIR, name));
}

function parseTapCount(output, name) {
  const match = output.match(new RegExp(`^# ${name} (\\d+)$`, 'm'));
  return match ? Number(match[1]) : null;
}

function finish({ status, exitCode, files, tests, passed, failed, skipped, durationMs }) {
  console.log('');
  console.log(`📊 ${GATE_ID} — Script tests summary`);
  console.log(`   Files:    ${files}`);
  console.log(`   Tests:    ${tests ?? 'unavailable'}`);
  console.log(`   Passed:   ${passed ?? 'unavailable'}`);
  console.log(`   Failed:   ${failed ?? 'unavailable'}`);
  console.log(`   Skipped:  ${skipped ?? 'unavailable'}`);
  console.log(`   Duration: ${durationMs} ms`);
  console.log('');
  console.log(
    `${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${GATE_ID}: ${status}`,
  );
  console.log('');

  console.log(
    `QG_RESULT ${JSON.stringify({
      gateId: GATE_ID,
      status,
      exitCode,
    })}`,
  );

  process.exitCode = exitCode;
}

function main() {
  const startedAt = performance.now();
  const files = discover();

  if (files.length === 0) {
    console.error('❌ test:scripts — no *.test.mjs found under scripts/tests/');

    finish({
      status: 'ERROR',
      exitCode: 1,
      files: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return;
  }

  console.log(`▶ ${GATE_ID} — test:scripts (${files.length} file(s))`);

  for (const file of files) {
    console.log(`  - ${relative(ROOT, file).replace(/\\/g, '/')}`);
  }

  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 16 * 1024 * 1024,
  });

  const output = result.stdout ?? '';
  const durationMs = Math.round(performance.now() - startedAt);

  const tests = parseTapCount(output, 'tests');
  const passed = parseTapCount(output, 'pass');
  const failed = parseTapCount(output, 'fail');
  const skipped = parseTapCount(output, 'skipped');

  const hasValidSummary = tests !== null && passed !== null && failed !== null && skipped !== null;

  const status =
    result.error || result.status === null
      ? 'ERROR'
      : result.status !== 0
        ? 'FAIL'
        : !hasValidSummary
          ? 'ERROR'
          : failed > 0
            ? 'FAIL'
            : 'PASS';

  if (status !== 'PASS') {
    console.error(`\n❌ ${GATE_ID}: script tests ${status}`);

    if (result.error) {
      console.error(`Test runner error: ${result.error.message}`);
    }

    const lines = output.split(/\r?\n/);
    const failureIndexes = [];

    for (let i = 0; i < lines.length; i += 1) {
      if (/^not ok \d+ - /.test(lines[i])) {
        failureIndexes.push(i);
      }
    }

    for (const index of failureIndexes) {
      let end = index + 1;

      while (end < lines.length && !/^not ok \d+ - |^ok \d+ - /.test(lines[end])) {
        end += 1;
      }

      process.stdout.write(`${lines.slice(index, end).join('\n')}\n`);
    }

    if (failureIndexes.length === 0 && output) {
      console.error('No se pudo identificar un subtest fallido en la salida TAP.');
      process.stdout.write(`${output.split(/\r?\n/).slice(-12).join('\n')}\n`);
    }
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  finish({
    status,
    exitCode: status === 'PASS' ? 0 : 1,
    files: files.length,
    tests,
    passed,
    failed,
    skipped,
    durationMs,
  });
}

main();
