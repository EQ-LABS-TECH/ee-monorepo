import { validateGateId } from './validate-gate-id.mjs';

const EXPECTED_EXIT_CODE = new Map([
  ['PASS', 0],
  ['FAIL', 1],
  ['ERROR', 1],
  ['SKIPPED', 2],
]);

function errorResult(detail) {
  return { status: 'ERROR', exitCode: 1, detail };
}

export function validateGateContract({ stdout, processExitCode, expectedGateId }) {
  if (typeof stdout !== 'string') return errorResult('gate output is unavailable');

  const markers = [...stdout.matchAll(/^QG_RESULT (.+)$/gm)];
  if (markers.length !== 1) {
    return errorResult(`expected exactly one QG_RESULT marker; found ${markers.length}`);
  }

  let contract;
  try {
    contract = JSON.parse(markers[0][1]);
  } catch {
    return errorResult('invalid QG_RESULT JSON');
  }

  const gateIdError = validateGateId(contract, expectedGateId);
  if (gateIdError) return errorResult(gateIdError);

  const expectedExitCode = EXPECTED_EXIT_CODE.get(contract.status);
  if (
    expectedExitCode === undefined ||
    contract.exitCode !== expectedExitCode ||
    processExitCode !== expectedExitCode
  ) {
    return errorResult('QG_RESULT contract does not match the process exit code');
  }

  return { status: contract.status, exitCode: processExitCode };
}
