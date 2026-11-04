import { readdirSync, readFileSync, statSync } from 'node:fs';
import { parse } from '@typescript-eslint/typescript-estree';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ALLOWED = Object.freeze({
  Config: [],
  Foundation: ['Foundation'],
  Execution: ['Foundation', 'Execution'],
  Intelligence: ['Foundation', 'Intelligence'],
  Knowledge: ['Foundation', 'Knowledge'],
  Governance: ['Foundation', 'Execution', 'Knowledge', 'Governance'],
  Integration: ['Foundation', 'Execution', 'Governance', 'Integration'],
  Registry: ['Foundation', 'Knowledge', 'Registry'],
  SDK: [
    'Foundation',
    'Execution',
    'Intelligence',
    'Knowledge',
    'Governance',
    'Integration',
    'Registry',
  ],
  Shared: ['Config', 'Foundation', 'Shared'],
  Apps: [
    'Config',
    'Foundation',
    'Shared',
    'Execution',
    'Intelligence',
    'Knowledge',
    'Governance',
    'Integration',
    'Registry',
    'Connectors',
  ],
  Connectors: ['Foundation'],
});

const PACKAGE_CATEGORY = new Map([
  ['foundation', 'Foundation'],
  ['execution', 'Execution'],
  ['intelligence', 'Intelligence'],
  ['knowledge', 'Knowledge'],
  ['governance', 'Governance'],
  ['integration', 'Integration'],
  ['registry', 'Registry'],
  ['sdk', 'SDK'],
  ['shared', 'Shared'],
]);

function categoryFor(relativePath, packageName) {
  const normalized = relativePath.replaceAll('\\', '/');
  if (normalized.startsWith('apps/')) return 'Apps';
  if (normalized.startsWith('connectors/')) return 'Connectors';
  if (normalized === 'packages/config' || normalized.startsWith('packages/config/'))
    return 'Config';
  return PACKAGE_CATEGORY.get(packageName.replace(/^@eq-labs\//, '')) ?? null;
}

function collectPackageDirectories(directory, results) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || ['node_modules', '.git', 'dist', 'build'].includes(entry.name))
      continue;
    const child = join(directory, entry.name);
    if (statSync(child).isDirectory()) {
      if (readdirSync(child).includes('package.json')) results.push(child);
      collectPackageDirectories(child, results);
    }
  }
}

const SOURCE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const IGNORED_SOURCE_DIRECTORIES = new Set(['build', 'dist', 'node_modules', 'test-results']);
const IGNORED_TEST_FILES = /\.(?:test|spec)\.[^.]+$/;

function collectSourceFiles(directory, results) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_SOURCE_DIRECTORIES.has(entry.name)) {
        collectSourceFiles(join(directory, entry.name), results);
      }
      continue;
    }
    if (
      entry.isFile() &&
      SOURCE_EXTENSIONS.has(extname(entry.name)) &&
      !IGNORED_TEST_FILES.test(entry.name)
    ) {
      results.push(join(directory, entry.name));
    }
  }
}

function isStringLiteral(node) {
  return (
    (node &&
      (node.type === 'Literal' || node.type === 'StringLiteral') &&
      typeof node.value === 'string') ||
    (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
  );
}

function stringValue(node) {
  return node.type === 'TemplateLiteral' ? node.quasis[0].value.cooked : node.value;
}

function collectImportSpecifiers(ast) {
  const imports = [];
  const visited = new Set();

  function visit(node) {
    if (!node || typeof node !== 'object' || visited.has(node)) return;
    visited.add(node);

    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportNamedDeclaration' ||
        node.type === 'ExportAllDeclaration') &&
      isStringLiteral(node.source)
    ) {
      imports.push({ specifier: stringValue(node.source), line: node.loc?.start.line ?? 1 });
    } else if (node.type === 'TSImportType' && isStringLiteral(node.argument)) {
      imports.push({ specifier: stringValue(node.argument), line: node.loc?.start.line ?? 1 });
    } else if (node.type === 'ImportExpression') {
      imports.push({
        ...(isStringLiteral(node.source)
          ? { specifier: stringValue(node.source) }
          : { unresolved: true }),
        line: node.loc?.start.line ?? 1,
      });
    } else if (
      node.type === 'CallExpression' &&
      ((node.callee?.type === 'Identifier' && node.callee.name === 'require') ||
        (node.callee?.type === 'MemberExpression' &&
          node.callee.object?.type === 'Identifier' &&
          node.callee.object.name === 'module' &&
          node.callee.property?.name === 'require'))
    ) {
      imports.push({
        ...(isStringLiteral(node.arguments?.[0])
          ? { specifier: stringValue(node.arguments[0]) }
          : { unresolved: true }),
        line: node.loc?.start.line ?? 1,
      });
    } else if (
      node.type === 'TSImportEqualsDeclaration' &&
      node.moduleReference?.type === 'TSExternalModuleReference'
    ) {
      const expression = node.moduleReference.expression;
      imports.push({
        ...(isStringLiteral(expression)
          ? { specifier: stringValue(expression) }
          : { unresolved: true }),
        line: node.loc?.start.line ?? 1,
      });
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'range' || key === 'tokens' || key === 'comments') continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }

  visit(ast);
  return imports;
}

function owningWorkspace(filePath, workspaces, root) {
  const normalized = resolve(filePath);
  return workspaces
    .filter((workspace) => {
      const workspacePath = resolve(root, workspace.path);
      const relativePath = relative(workspacePath, normalized);
      return relativePath === '' || (!relativePath.startsWith(`..${sep}`) && relativePath !== '..');
    })
    .sort((left, right) => right.path.length - left.path.length)[0];
}

export function loadWorkspaceSourceImports(workspaces, root = process.cwd(), parseSource = parse) {
  if (!Array.isArray(workspaces)) throw new TypeError('Workspace packages must be an array');
  const imports = [];
  const byPackageName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));

  for (const workspace of workspaces) {
    const sourceDirectory = join(root, workspace.path, 'src');
    if (!statSync(sourceDirectory, { throwIfNoEntry: false })?.isDirectory()) continue;
    const files = [];
    collectSourceFiles(sourceDirectory, files);

    for (const filePath of files) {
      const source = readFileSync(filePath, 'utf8');
      const ast = parseSource(source, {
        filePath,
        loc: true,
        jsx: true,
        sourceType: 'unambiguous',
      });

      for (const { specifier, line, unresolved } of collectImportSpecifiers(ast)) {
        const path = relative(root, filePath).replaceAll('\\', '/');
        if (unresolved) {
          imports.push({ from: workspace.name, path, line, unresolved: true });
          continue;
        }
        const target = [...byPackageName.keys()]
          .sort((left, right) => right.length - left.length)
          .find((name) => specifier === name || specifier.startsWith(`${name}/`));
        const targetWorkspace = target
          ? byPackageName.get(target)
          : specifier.startsWith('.')
            ? owningWorkspace(resolve(dirname(filePath), specifier), workspaces, root)
            : undefined;

        if (targetWorkspace && targetWorkspace.name !== workspace.name) {
          imports.push({
            from: workspace.name,
            to: targetWorkspace.name,
            specifier,
            path,
            line,
          });
        } else if (specifier.startsWith('@eq-labs/') && !targetWorkspace) {
          imports.push({
            from: workspace.name,
            to: specifier.split('/').slice(0, 2).join('/'),
            path,
            line,
            unresolved: true,
          });
        }
      }
    }
  }

  return imports;
}

export function loadWorkspacePackages(root = process.cwd()) {
  const directories = [];
  for (const parent of ['packages', 'apps', 'connectors/official']) {
    const path = join(root, parent);
    if (statSync(path).isDirectory()) collectPackageDirectories(path, directories);
  }
  return directories.map((directory) => {
    const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    const path = relative(root, directory).replaceAll('\\', '/');
    return {
      name: manifest.name,
      path,
      category: categoryFor(path, manifest.name),
      dependencies: Object.keys({
        ...manifest.dependencies,
        ...manifest.optionalDependencies,
        ...manifest.peerDependencies,
      }),
    };
  });
}

function cyclePaths(edges) {
  const cycles = [];
  const state = new Map();
  const stack = [];
  const reported = new Set();
  function visit(node) {
    state.set(node, 1);
    stack.push(node);
    for (const next of edges.get(node) ?? []) {
      if (!state.has(next)) visit(next);
      else if (state.get(next) === 1) {
        const cycle = [...stack.slice(stack.indexOf(next)), next];
        const key = [...cycle.slice(0, -1)].sort().join('|');
        if (!reported.has(key)) {
          cycles.push(cycle);
          reported.add(key);
        }
      }
    }
    stack.pop();
    state.set(node, 2);
  }
  for (const node of edges.keys()) if (!state.has(node)) visit(node);
  return cycles;
}

export function validateWorkspaceArchitecture(workspaces) {
  if (!Array.isArray(workspaces)) throw new TypeError('Workspace packages must be an array');
  const byName = new Map();
  for (const workspace of workspaces) {
    if (
      !workspace ||
      typeof workspace.name !== 'string' ||
      !workspace.name ||
      !ALLOWED[workspace.category] ||
      !Array.isArray(workspace.dependencies)
    ) {
      throw new TypeError('Malformed workspace architecture input');
    }
    byName.set(workspace.name, workspace);
  }
  const edges = new Map([...byName.keys()].map((name) => [name, new Set()]));
  const violations = [];
  for (const workspace of workspaces) {
    for (const dependencyName of workspace.dependencies) {
      const dependency = byName.get(dependencyName);
      if (!dependency) continue;
      if (!ALLOWED[workspace.category].includes(dependency.category)) {
        violations.push({
          code: 'dependency-not-allowed',
          from: workspace.name,
          to: dependencyName,
        });
      }
      edges.get(workspace.name).add(dependencyName);
    }
  }
  for (const cycle of cyclePaths(edges)) violations.push({ code: 'dependency-cycle', path: cycle });
  return violations;
}

export function validateWorkspaceSourceImports(workspaces, imports) {
  if (!Array.isArray(imports)) throw new TypeError('Workspace source imports must be an array');
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const violations = [];

  for (const sourceImport of imports) {
    if (sourceImport.unresolved) {
      violations.push({
        code: 'source-import-unresolved',
        from: sourceImport.from,
        ...(sourceImport.to ? { to: sourceImport.to } : {}),
        path: sourceImport.path,
        line: sourceImport.line,
      });
      continue;
    }
    const from = byName.get(sourceImport.from);
    const to = byName.get(sourceImport.to);
    if (sourceImport.specifier?.startsWith('.')) {
      violations.push({
        code: 'source-import-relative-cross-workspace',
        from: sourceImport.from,
        to: sourceImport.to,
        path: sourceImport.path,
        line: sourceImport.line,
      });
      continue;
    }
    if (!from || !to || !ALLOWED[from.category].includes(to.category)) {
      violations.push({
        code: 'source-import-not-allowed',
        from: sourceImport.from,
        to: sourceImport.to,
        path: sourceImport.path,
        line: sourceImport.line,
      });
      continue;
    }
    if (!from.dependencies.includes(to.name)) {
      violations.push({
        code: 'source-import-not-declared',
        from: sourceImport.from,
        to: sourceImport.to,
        path: sourceImport.path,
        line: sourceImport.line,
      });
    }
  }

  return violations;
}

export { ALLOWED as ALLOWED_WORKSPACE_DEPENDENCIES };
