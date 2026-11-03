import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkspaceArchitecture } from '../lib/architecture-dependencies.mjs';

test('accepts dependencies authorized by the EE-DOC-006 workspace matrix', () => {
  assert.deepEqual(
    validateWorkspaceArchitecture([
      { name: '@eq-labs/foundation', category: 'Foundation', dependencies: [] },
      { name: '@eq-labs/execution', category: 'Execution', dependencies: ['@eq-labs/foundation'] },
      { name: '@eq-labs/cli', category: 'Apps', dependencies: ['@eq-labs/execution'] },
      {
        name: '@eq-labs/connector-github',
        category: 'Connectors',
        dependencies: ['@eq-labs/foundation'],
      },
    ]),
    [],
  );
});

test('rejects forbidden workspace dependencies and dependency cycles', () => {
  const violations = validateWorkspaceArchitecture([
    { name: '@eq-labs/foundation', category: 'Foundation', dependencies: ['@eq-labs/execution'] },
    { name: '@eq-labs/execution', category: 'Execution', dependencies: ['@eq-labs/foundation'] },
  ]);
  assert.ok(violations.some(({ code }) => code === 'dependency-not-allowed'));
  assert.ok(violations.some(({ code }) => code === 'dependency-cycle'));
});

test('rejects connectors that depend on a domain package', () => {
  const violations = validateWorkspaceArchitecture([
    { name: '@eq-labs/knowledge', category: 'Knowledge', dependencies: [] },
    {
      name: '@eq-labs/connector-mcp',
      category: 'Connectors',
      dependencies: ['@eq-labs/knowledge'],
    },
  ]);
  assert.deepEqual(violations, [
    { code: 'dependency-not-allowed', from: '@eq-labs/connector-mcp', to: '@eq-labs/knowledge' },
  ]);
});

test('rejects a workspace that declares itself as a dependency', () => {
  const violations = validateWorkspaceArchitecture([
    { name: '@eq-labs/foundation', category: 'Foundation', dependencies: ['@eq-labs/foundation'] },
  ]);
  assert.ok(violations.some(({ code }) => code === 'dependency-cycle'));
});
