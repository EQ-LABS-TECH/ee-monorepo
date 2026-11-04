import { runTurboGate } from './run-turbo-gate.mjs';

export function runE2EGate(runTurboGateImpl = runTurboGate) {
  return runTurboGateImpl({ task: 'test:e2e', gateId: 'QG-TEST-E2E' });
}
