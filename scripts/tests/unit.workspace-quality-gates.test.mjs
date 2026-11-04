import test from 'node:test';
import assert from 'node:assert/strict';
import { runWorkspaceQualityGate } from '../lib/workspace-quality-gates.mjs';

const expectedGates = [
  ['typecheck', 'typecheck', 'QG-TYPE-001'],
  ['lint', 'lint', 'QG-LINT-001'],
  ['test', 'test', 'QG-TEST-001'],
  ['build', 'build', 'QG-BUILD-001'],
];

test('maps every workspace wrapper to its task and gate contract', () => {
  for (const [name, task, gateId] of expectedGates) {
    let received;
    const status = runWorkspaceQualityGate(name, {
      runTurboGateImpl: (options) => {
        received = options;
        return 7;
      },
    });

    assert.equal(status, 7, `${name} must preserve the Turbo gate exit code`);
    assert.deepEqual(received, { task, gateId });
  }
});

test('passes additional checks through the lint wrapper contract', () => {
  const lintScripts = () => ({ status: 'PASS' });
  let received;

  runWorkspaceQualityGate('lint', {
    additionalChecks: [lintScripts],
    runTurboGateImpl: (options) => {
      received = options;
      return 0;
    },
  });

  assert.deepEqual(received, {
    task: 'lint',
    gateId: 'QG-LINT-001',
    additionalChecks: [lintScripts],
  });
});

test('rejects unknown wrapper names and invalid runners', () => {
  assert.throws(() => runWorkspaceQualityGate('release'), /Unknown workspace quality gate/);
  assert.throws(
    () => runWorkspaceQualityGate('build', { runTurboGateImpl: null }),
    /runTurboGateImpl must be a function/,
  );
});
