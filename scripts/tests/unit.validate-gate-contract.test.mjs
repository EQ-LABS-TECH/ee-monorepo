import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGateContract } from '../lib/validate-gate-contract.mjs';

function marker(contract) {
  return `QG_RESULT ${JSON.stringify(contract)}\n`;
}

test('preserves a valid PASS result and its exit code', () => {
  assert.deepEqual(
    validateGateContract({
      stdout: marker({ gateId: 'QG-TYPE-001', status: 'PASS', exitCode: 0 }),
      processExitCode: 0,
      expectedGateId: 'QG-TYPE-001',
    }),
    { status: 'PASS', exitCode: 0 },
  );
});

test('preserves SKIPPED instead of converting it to PASS', () => {
  assert.deepEqual(
    validateGateContract({
      stdout: marker({ gateId: 'QG-TEST-001', status: 'SKIPPED', exitCode: 2 }),
      processExitCode: 2,
      expectedGateId: 'QG-TEST-001',
    }),
    { status: 'SKIPPED', exitCode: 2 },
  );
});

test('reports a missing contract as ERROR with nonzero exit even if the child exited zero', () => {
  assert.deepEqual(
    validateGateContract({
      stdout: 'gate finished without a contract',
      processExitCode: 0,
      expectedGateId: 'QG-TYPE-001',
    }),
    {
      status: 'ERROR',
      exitCode: 1,
      detail: 'expected exactly one QG_RESULT marker; found 0',
    },
  );
});

test('reports malformed JSON as ERROR with nonzero exit', () => {
  const result = validateGateContract({
    stdout: 'QG_RESULT {invalid}\n',
    processExitCode: 0,
    expectedGateId: 'QG-TYPE-001',
  });

  assert.equal(result.status, 'ERROR');
  assert.equal(result.exitCode, 1);
  assert.equal(result.detail, 'invalid QG_RESULT JSON');
});

test('reports a contract exit-code mismatch as ERROR with nonzero exit', () => {
  const result = validateGateContract({
    stdout: marker({ gateId: 'QG-TYPE-001', status: 'PASS', exitCode: 0 }),
    processExitCode: 1,
    expectedGateId: 'QG-TYPE-001',
  });

  assert.equal(result.status, 'ERROR');
  assert.equal(result.exitCode, 1);
});

test('rejects a result for a different gate as ERROR', () => {
  const result = validateGateContract({
    stdout: marker({ gateId: 'QG-LINT-001', status: 'PASS', exitCode: 0 }),
    processExitCode: 0,
    expectedGateId: 'QG-TYPE-001',
  });

  assert.equal(result.status, 'ERROR');
  assert.equal(result.exitCode, 1);
  assert.match(result.detail, /gateId mismatch/);
});
