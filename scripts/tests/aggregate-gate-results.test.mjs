import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateGateResults } from '../lib/aggregate-gate-results.mjs';

const validations = [
  { label: 'Type checking', critical: true },
  { label: 'Tests', critical: true },
];

test('all critical gates PASS when every result is PASS', () => {
  assert.deepEqual(
    aggregateGateResults(validations, [
      { gate: 'Type checking', status: 'PASS', exitCode: 0 },
      { gate: 'Tests', status: 'PASS', exitCode: 0 },
    ]),
    { hasErrors: false, warnings: [] },
  );
});

test('a required SKIPPED gate fails global aggregation', () => {
  assert.deepEqual(
    aggregateGateResults(validations, [
      { gate: 'Type checking', status: 'PASS', exitCode: 0 },
      { gate: 'Tests', status: 'SKIPPED', exitCode: 2 },
    ]),
    { hasErrors: true, warnings: [] },
  );
});

test('a missing critical gate result fails global aggregation', () => {
  assert.deepEqual(
    aggregateGateResults(validations, [{ gate: 'Type checking', status: 'PASS', exitCode: 0 }]),
    { hasErrors: true, warnings: [] },
  );
});

test('a non-critical SKIPPED gate produces a warning, not a global failure', () => {
  assert.deepEqual(
    aggregateGateResults(
      [{ label: 'Optional check', critical: false }],
      [{ gate: 'Optional check', status: 'SKIPPED', exitCode: 2 }],
    ),
    {
      hasErrors: false,
      warnings: ['⚠️ Optional check: SKIPPED'],
    },
  );
});
