import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGateId } from '../lib/validate-gate-id.mjs';

test('accepts the expected gateId', () => {
  assert.equal(
    validateGateId({ gateId: 'QG-TYPE-001', status: 'PASS', exitCode: 0 }, 'QG-TYPE-001'),
    null,
  );
});

test('rejects a different gateId even when status is PASS', () => {
  const error = validateGateId(
    { gateId: 'QG-LINT-001', status: 'PASS', exitCode: 0 },
    'QG-TYPE-001',
  );

  assert.equal(error, 'QG_RESULT gateId mismatch: expected QG-TYPE-001, received QG-LINT-001');
});

test('rejects a missing gateId', () => {
  const error = validateGateId({ status: 'PASS', exitCode: 0 }, 'QG-TYPE-001');

  assert.equal(error, 'QG_RESULT gateId mismatch: expected QG-TYPE-001, received (missing)');
});
