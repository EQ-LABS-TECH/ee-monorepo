export function aggregateGateResults(validations, gateResults) {
  const resultsByGate = new Map(gateResults.map((result) => [result.gate, result]));

  let hasErrors = false;
  const warnings = [];

  for (const validation of validations) {
    const result = resultsByGate.get(validation.label);

    if (result?.status === 'PASS') {
      continue;
    }

    if (validation.critical) {
      hasErrors = true;
    } else {
      warnings.push(`⚠️ ${validation.label}: ${result?.status ?? 'ERROR'}`);
    }
  }

  return { hasErrors, warnings };
}
