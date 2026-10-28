import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePrettierOutput } from '../lib/parse-prettier-output.mjs';

test('counts unchanged files', () => {
  const result = parsePrettierOutput('README.md 12ms (unchanged)\npackage.json 3ms (unchanged)\n');

  assert.equal(result.processed, 2);
  assert.equal(result.modifiedFiles.length, 0);
  assert.equal(result.unchangedFiles.length, 2);
  assert.deepEqual(result.otherLines, []);
});

test('counts modified files', () => {
  const result = parsePrettierOutput('scripts/commands/format 7ms\nREADME.md 12ms (unchanged)\n');

  assert.equal(result.processed, 2);
  assert.deepEqual(result.modifiedFiles, ['scripts/commands/format 7ms']);
  assert.equal(result.unchangedFiles.length, 1);
});

test('supports Windows line endings', () => {
  const result = parsePrettierOutput('package.json 3ms (unchanged)\r\nREADME.md 7ms\r\n');

  assert.equal(result.processed, 2);
  assert.equal(result.modifiedFiles.length, 1);
  assert.equal(result.unchangedFiles.length, 1);
});

test('preserves unexpected output without counting it as files', () => {
  const result = parsePrettierOutput('Warning: unexpected message\nREADME.md 3ms (unchanged)\n');

  assert.equal(result.processed, 1);
  assert.deepEqual(result.otherLines, ['Warning: unexpected message']);
});

test('handles empty output', () => {
  const result = parsePrettierOutput('');

  assert.equal(result.processed, 0);
  assert.deepEqual(result.modifiedFiles, []);
  assert.deepEqual(result.unchangedFiles, []);
});

test('rejects invalid input', () => {
  assert.throws(() => parsePrettierOutput(null), TypeError);
});
