import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Read workspace manifests from pnpm's workspace package list. */
export function readWorkspacePackages(root, workspaceList) {
  if (!Array.isArray(workspaceList)) throw new TypeError('workspaceList must be an array');

  return workspaceList.map((entry) => {
    const manifestPath = typeof entry === 'string' ? entry : entry.path;
    if (typeof manifestPath !== 'string' || !manifestPath) {
      throw new TypeError('Each workspace entry must have a manifest path');
    }
    const path = manifestPath.endsWith('package.json')
      ? manifestPath
      : join(manifestPath, 'package.json');
    const manifest = JSON.parse(readFileSync(join(root, path), 'utf8'));
    return { name: manifest.name, version: manifest.version, private: manifest.private === true };
  });
}

/**
 * Determine packages eligible for publication using effective package metadata and registry state.
 * A package is eligible only if public and the exact name/version is absent from the registry.
 */
export function getEligiblePackages(packages, registryHasVersion) {
  if (!Array.isArray(packages)) throw new TypeError('packages must be an array');
  if (typeof registryHasVersion !== 'function') {
    throw new TypeError('registryHasVersion must be a function');
  }

  return packages.filter((pkg) => {
    if (!pkg || typeof pkg.name !== 'string' || !pkg.name || typeof pkg.version !== 'string') {
      throw new TypeError('Every package must have a name and version');
    }
    return pkg.private !== true && !registryHasVersion(pkg.name, pkg.version);
  });
}

/** Stable release order: validation/build, publication, then tag creation. */
export async function publishThenTag({
  validate,
  build,
  packages,
  registryHasVersion,
  publish,
  createTag,
}) {
  for (const [name, fn] of Object.entries({
    validate,
    build,
    registryHasVersion,
    publish,
    createTag,
  })) {
    if (typeof fn !== 'function') throw new TypeError(`${name} must be a function`);
  }
  await validate();
  await build();
  const eligible = getEligiblePackages(packages, registryHasVersion);
  for (const pkg of eligible) await publish(pkg);
  await createTag();
  return { published: eligible.map(({ name, version }) => ({ name, version })) };
}

export function listChangesetFiles(root) {
  return readdirSync(join(root, '.changeset'))
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort();
}
