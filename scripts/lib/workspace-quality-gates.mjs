import { runTurboGate } from './run-turbo-gate.mjs';

const GATES = Object.freeze({
  typecheck: Object.freeze({ task: 'typecheck', gateId: 'QG-TYPE-001' }),
  lint: Object.freeze({ task: 'lint', gateId: 'QG-LINT-001' }),
  test: Object.freeze({ task: 'test', gateId: 'QG-TEST-001' }),
  build: Object.freeze({ task: 'build', gateId: 'QG-BUILD-001' }),
});

export function runWorkspaceQualityGate(
  name,
  { runTurboGateImpl = runTurboGate, additionalChecks = [] } = {},
) {
  const gate = GATES[name];
  if (!gate) throw new RangeError(`Unknown workspace quality gate: ${name}`);
  if (typeof runTurboGateImpl !== 'function') {
    throw new TypeError('runTurboGateImpl must be a function');
  }

  return runTurboGateImpl({
    ...gate,
    ...(additionalChecks.length ? { additionalChecks } : {}),
  });
}
