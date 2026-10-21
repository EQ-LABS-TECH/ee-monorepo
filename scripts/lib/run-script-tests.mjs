#!/usr/bin/env node
/**
 * Shared discovery + execution for scripts/tests/*.test.mjs.
 *
 * Why this file exists (M-04a):
 * - `node --test scripts/tests/` does not accept a directory on Node 24 (verified).
 * - Globs via shell are not portable (Windows/PowerShell does not expand globs to
 *   external processes; `spawnSync` with `shell: true` behaves differently across OS).
 * - This wrapper discovers test files deterministically and passes an explicit list
 *   to `node --test`, producing identical behavior in local and CI.
 *
 * Used by:
 * - package.json "test:scripts"
 * - scripts/commands/validate (fase "Script tests")
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

function main() {
  const files = discover();

  if (files.length === 0) {
    console.warn('⚠️ test:scripts — no *.test.mjs found under scripts/tests/');
    process.exit(0);
  }

  console.log(`▶ test:scripts — ${files.length} file(s)`);
  for (const file of files) console.log(`  - ${file.replace(ROOT + '/', '').replace(/\\/g, '/')}`);

  const result = spawnSync(process.execPath, ['--test', ...files], {
    stdio: 'inherit',
    cwd: ROOT,
  });

  process.exit(result.status ?? 1);
}

main();
