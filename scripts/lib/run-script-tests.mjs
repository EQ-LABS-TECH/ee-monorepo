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
import { dirname, join, relative, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const GATE_ID = 'QG-SCRIPTS-001';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const TESTS_DIR = join(ROOT, 'scripts', 'tests');

function discover(testsDir, fsImpl) {
  if (!fsImpl.existsSync(testsDir)) return [];

  return fsImpl
    .readdirSync(testsDir)
    .filter((name) => name.endsWith('.test.mjs'))
    .sort()
    .map((name) => join(testsDir, name));
}

function parseTapCount(output, name) {
  const match = output.match(new RegExp(`^# ${name} (\\d+)$`, 'm'));
  return match ? Number(match[1]) : null;
}

function finish({ status, exitCode, files, tests, passed, failed, skipped, durationMs }, output) {
  output.log('');
  output.log(`📊 ${GATE_ID} — Script tests summary`);
  output.log(`   Files:    ${files}`);
  output.log(`   Tests:    ${tests ?? 'unavailable'}`);
  output.log(`   Passed:   ${passed ?? 'unavailable'}`);
  output.log(`   Failed:   ${failed ?? 'unavailable'}`);
  output.log(`   Skipped:  ${skipped ?? 'unavailable'}`);
  output.log(`   Duration: ${durationMs} ms`);
  output.log('');
  const icon = status === 'PASS' ? '✅' : status === 'SKIPPED' ? '⚠️' : '❌';
  output.log(`${icon} ${GATE_ID}: ${status}`);
  output.log('');

  output.log(
    `QG_RESULT ${JSON.stringify({
      gateId: GATE_ID,
      status,
      exitCode,
    })}`,
  );

  return { status, exitCode, files, tests, passed, failed, skipped };
}

export function runScriptTests({
  testsDir = TESTS_DIR,
  fsImpl = { existsSync, readdirSync },
  spawnSyncImpl = spawnSync,
  output = {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    writeOut: (value) => process.stdout.write(value),
    writeErr: (value) => process.stderr.write(value),
  },
} = {}) {
  const startedAt = performance.now();
  const files = discover(testsDir, fsImpl);

  if (files.length === 0) {
    output.error('❌ test:scripts — no *.test.mjs found under scripts/tests/');

    return finish(
      {
        status: 'ERROR',
        exitCode: 1,
        files: 0,
        tests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        durationMs: Math.round(performance.now() - startedAt),
      },
      output,
    );
  }

  output.log(`▶ ${GATE_ID} — test:scripts (${files.length} file(s))`);

  for (const file of files) {
    output.log(`  - ${relative(ROOT, file).replace(/\\/g, '/')}`);
  }

  const result = spawnSyncImpl(process.execPath, ['--test', '--test-reporter=tap', ...files], {
    encoding: 'utf8',
    cwd: ROOT,
    maxBuffer: 16 * 1024 * 1024,
  });

  const outputText = result.stdout ?? '';
  const durationMs = Math.round(performance.now() - startedAt);

  const tests = parseTapCount(outputText, 'tests');
  const passed = parseTapCount(outputText, 'pass');
  const failed = parseTapCount(outputText, 'fail');
  const skipped = parseTapCount(outputText, 'skipped');

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
    output.error(`\n❌ ${GATE_ID}: script tests ${status}`);

    if (result.error) {
      output.error(`Test runner error: ${result.error.message}`);
    }

    const lines = outputText.split(/\r?\n/);
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

      output.writeOut(`${lines.slice(index, end).join('\n')}\n`);
    }

    if (failureIndexes.length === 0 && outputText) {
      output.error('No se pudo identificar un subtest fallido en la salida TAP.');
      output.writeOut(`${outputText.split(/\r?\n/).slice(-12).join('\n')}\n`);
    }
  }

  if (result.stderr) {
    output.writeErr(result.stderr);
  }

  return finish(
    {
      status,
      exitCode: status === 'PASS' ? 0 : 1,
      files: files.length,
      tests,
      passed,
      failed,
      skipped,
      durationMs,
    },
    output,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runScriptTests().exitCode;
}
