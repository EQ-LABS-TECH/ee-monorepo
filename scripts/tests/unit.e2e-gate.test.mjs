import test from 'node:test';
import assert from 'node:assert/strict';
import { runE2EGate } from '../lib/e2e-gate.mjs';

test('orchestrates every workspace declaring the E2E task without a fixed package filter', () => {
  let options;
  const status = runE2EGate((receivedOptions) => {
    options = receivedOptions;
    return 0;
  });

  assert.equal(status, 0);
  assert.deepEqual(options, { task: 'test:e2e', gateId: 'QG-TEST-E2E' });
});
