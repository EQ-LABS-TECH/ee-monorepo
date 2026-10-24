export function validateGateId(contract, expectedGateId) {
  if (contract.gateId === expectedGateId) {
    return null;
  }

  return `QG_RESULT gateId mismatch: expected ${expectedGateId}, received ${
    contract.gateId ?? '(missing)'
  }`;
}
