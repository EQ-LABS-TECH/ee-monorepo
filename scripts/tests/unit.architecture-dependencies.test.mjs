import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadWorkspacePackages,
  loadWorkspaceSourceImports,
  validateWorkspaceArchitecture,
  validateWorkspaceSourceImports,
} from '../lib/architecture-dependencies.mjs';

function makeWorkspaceFixture(importSpecifier) {
  const root = mkdtempSync(join(tmpdir(), 'ee-architecture-import-'));
  const foundationDirectory = join(root, 'packages', 'foundation');
  const executionDirectory = join(root, 'packages', 'execution');
  mkdirSync(join(root, 'apps'), { recursive: true });
  mkdirSync(join(root, 'connectors', 'official'), { recursive: true });
  mkdirSync(join(foundationDirectory, 'src'), { recursive: true });
  mkdirSync(join(executionDirectory, 'src'), { recursive: true });
  writeFileSync(
    join(foundationDirectory, 'package.json'),
    JSON.stringify({ name: '@eq-labs/foundation' }),
  );
  writeFileSync(
    join(executionDirectory, 'package.json'),
    JSON.stringify({
      name: '@eq-labs/execution',
      dependencies: { '@eq-labs/foundation': 'workspace:*' },
    }),
  );
  writeFileSync(join(foundationDirectory, 'src', 'index.mjs'), 'export const value = 1;\n');
  writeFileSync(
    join(executionDirectory, 'src', 'index.mjs'),
    `import { value } from '${importSpecifier}';\nexport { value };\n`,
  );
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

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

test('rejects relative imports that cross workspace boundaries', () => {
  const fixture = makeWorkspaceFixture('../../foundation/src/index.mjs');
  try {
    const workspaces = loadWorkspacePackages(fixture.root);
    const imports = loadWorkspaceSourceImports(workspaces, fixture.root);
    assert.ok(imports.some(({ specifier }) => specifier === '../../foundation/src/index.mjs'));
    assert.deepEqual(validateWorkspaceSourceImports(workspaces, imports), [
      {
        code: 'source-import-relative-cross-workspace',
        from: '@eq-labs/execution',
        to: '@eq-labs/foundation',
        path: 'packages/execution/src/index.mjs',
        line: 1,
      },
    ]);
  } finally {
    fixture.cleanup();
  }
});

test('accepts allowed cross-workspace imports by package name', () => {
  const fixture = makeWorkspaceFixture('@eq-labs/foundation');
  try {
    const workspaces = loadWorkspacePackages(fixture.root);
    const imports = loadWorkspaceSourceImports(workspaces, fixture.root);
    assert.ok(imports.some(({ specifier }) => specifier === '@eq-labs/foundation'));
    assert.deepEqual(validateWorkspaceSourceImports(workspaces, imports), []);
  } finally {
    fixture.cleanup();
  }
});
