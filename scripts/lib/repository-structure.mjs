import * as nodeFs from 'node:fs';
import { join } from 'node:path';

const REQUIRED_DIRECTORIES = [
  'apps',
  'apps/extensions',
  'connectors',
  'connectors/official',
  'packages',
  'packages/config',
  'packages/foundation',
  'packages/shared',
  'packages/execution',
  'packages/intelligence',
  'packages/knowledge',
  'packages/governance',
  'packages/integration',
  'packages/registry',
  'packages/sdk',
  'scripts',
];

const ALLOWED_TOP_LEVEL = new Set([
  'apps',
  'packages',
  'connectors',
  'scripts',
  'docs',
  'assets',
  'data',
  'examples',
  'marketplace',
  'infra',
  'templates',
  '.github',
  '.vscode',
  '.changeset',
  '.devcontainer',
  '.git',
  '.turbo',
  'node_modules',
]);

const FORBIDDEN_TOP_LEVEL = new Set(['docker', 'k8s', 'kubernetes']);

function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

function statOrNull(fsImpl, fullPath) {
  try {
    return fsImpl.statSync(fullPath);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
    throw error;
  }
}

export function validateRepositoryStructure({ root, fsImpl = nodeFs }) {
  const errors = [];

  for (const directory of REQUIRED_DIRECTORIES) {
    const fullPath = join(root, directory);
    let stats;
    try {
      stats = statOrNull(fsImpl, fullPath);
    } catch (error) {
      errors.push(
        `QG-ARCH-001: cannot inspect required directory ${directory}: ${describe(error)}`,
      );
      continue;
    }

    if (!stats) {
      errors.push(`Missing required directory: ${directory}`);
    } else if (!stats.isDirectory()) {
      errors.push(`Required path is not a directory: ${directory}`);
    }
  }

  let names;
  try {
    names = fsImpl.readdirSync(root);
  } catch (error) {
    errors.push(`QG-ARCH-001: could not scan top-level directories: ${describe(error)}`);
    return errors;
  }

  for (const name of names) {
    if (name.startsWith('.')) continue;

    const fullPath = join(root, name);
    let stats;
    try {
      stats = statOrNull(fsImpl, fullPath);
    } catch (error) {
      errors.push(`QG-ARCH-001: could not inspect top-level entry "${name}": ${describe(error)}`);
      continue;
    }

    // A top-level entry that disappears during the scan is an observable failure.
    if (!stats) {
      errors.push(`QG-ARCH-001: top-level entry disappeared during scan: "${name}"`);
      continue;
    }
    if (!stats.isDirectory()) continue;

    if (FORBIDDEN_TOP_LEVEL.has(name)) {
      errors.push(
        `QG-ARCH-001: forbidden top-level directory "${name}/" (use infra/ per EE-RFC-001 / EE-DOC-006)`,
      );
    } else if (!ALLOWED_TOP_LEVEL.has(name)) {
      errors.push(
        `QG-ARCH-001: unauthorized top-level directory "${name}/" (EE-DOC-006 allowlist)`,
      );
    }
  }

  return errors;
}
