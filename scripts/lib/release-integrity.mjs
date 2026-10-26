import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Check whether a release tag exists in the remote repository.
 * Fail closed: a Git/network/authentication error must never be
 * interpreted as an absent tag.
 */
export function assertRemoteTagAbsent({ tag, remoteTagRefs }) {
  if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`Invalid release tag: ${tag}`);
  }

  if (typeof remoteTagRefs !== 'function') {
    throw new TypeError('remoteTagRefs must be a function');
  }

  const refs = remoteTagRefs(tag);

  if (typeof refs !== 'string') {
    throw new TypeError('remoteTagRefs must return a string');
  }

  if (refs.trim().length > 0) {
    throw new Error(
      `Remote tag ${tag} already exists. Refusing to publish; inspect the release state before recovery.`,
    );
  }
}

/**
 * Classify a remote release tag without mutating the repository.
 *
 * remoteTagRefs must return the raw output of:
 *   git ls-remote --tags origin refs/tags/vX.Y.Z refs/tags/vX.Y.Z^{}
 *
 * For annotated tags, the peeled ref (^{}) identifies the target commit.
 * For lightweight tags, the direct ref is the target commit.
 */
export function inspectRemoteReleaseTag({ tag, remoteTagRefs, expectedCommit }) {
  if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`Invalid release tag: ${tag}`);
  }

  if (typeof remoteTagRefs !== 'function') {
    throw new TypeError('remoteTagRefs must be a function');
  }

  if (typeof expectedCommit !== 'string' || !/^[0-9a-f]{40}$/.test(expectedCommit)) {
    throw new Error('expectedCommit must be a full Git commit SHA');
  }

  const output = remoteTagRefs(tag);

  if (typeof output !== 'string') {
    throw new TypeError('remoteTagRefs must return a string');
  }

  const refs = new Map();

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^([0-9a-f]{40})\s+(refs\/tags\/.+)$/);

    if (!match) {
      throw new Error(`Unable to parse remote tag reference: ${line}`);
    }

    refs.set(match[2], match[1]);
  }

  const directRef = `refs/tags/${tag}`;
  const peeledRef = `${directRef}^{}`;
  const direct = refs.get(directRef);
  const peeled = refs.get(peeledRef);

  if (!direct) {
    if (peeled) {
      throw new Error(`Remote tag ${tag} has a peeled ref but no direct ref`);
    }

    return { state: 'absent' };
  }

  // For an annotated tag, use the peeled commit. For a lightweight tag,
  // the direct ref is already the commit SHA.
  const targetCommit = peeled ?? direct;

  if (targetCommit !== expectedCommit) {
    return {
      state: 'conflict',
      targetCommit,
      expectedCommit,
    };
  }

  return {
    state: 'matches',
    targetCommit,
  };
}

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

export function assertPublicPackagesConfigured(packages) {
  if (!Array.isArray(packages)) {
    throw new TypeError('packages must be an array');
  }

  const publicPackages = packages.filter((pkg) => pkg.private !== true);

  if (publicPackages.length === 0) {
    throw new Error(
      'No public packages are configured for this release. Refusing to complete the release.',
    );
  }

  return publicPackages;
}

export async function verifyCompletedRelease({
  tag,
  version,
  packages,
  validate,
  build,
  registryHasVersion,
}) {
  const publicPackages = assertPublicPackagesConfigured(packages);

  for (const [name, fn] of Object.entries({
    validate,
    build,
    registryHasVersion,
  })) {
    if (typeof fn !== 'function') {
      throw new TypeError(`${name} must be a function`);
    }
  }

  await validate();
  await build();

  const missingVersions = [];

  for (const pkg of publicPackages) {
    if (!registryHasVersion(pkg.name, pkg.version)) {
      missingVersions.push(`${pkg.name}@${pkg.version}`);
    }
  }

  if (missingVersions.length > 0) {
    throw new Error(
      `Remote tag ${tag} already points to HEAD, but these package versions are missing from npm: ${missingVersions.join(', ')}. Refusing to move the tag or silently republish.`,
    );
  }

  return {
    tag,
    version,
    publicPackages,
  };
}

export function classifyRegistryVersionLookup({ status, stdout = '', stderr = '' }) {
  if (status === 0) {
    return true;
  }

  const output = `${stdout}\n${stderr}`;

  // Only npm's explicit E404 code proves that the requested version is absent.
  if (/\bnpm (?:ERR!|error) code E404\b/i.test(output)) {
    return false;
  }

  throw new Error(
    `Unable to check npm registry for the requested package version:\n${output.trim() || `npm exited with status ${status}`}`,
  );
}

/** Stable release order: validation/build, publication, then tag creation. */
export async function publishThenTag({
  validate,
  build,
  packages,
  registryHasVersion,
  preflight = async () => {},
  publish,
  verifyPublished,
  createTag,
}) {
  for (const [name, fn] of Object.entries({
    validate,
    build,
    registryHasVersion,
    preflight,
    publish,
    verifyPublished,
    createTag,
  })) {
    if (typeof fn !== 'function') {
      throw new TypeError(`${name} must be a function`);
    }
  }

  await validate();
  await build();

  const eligible = getEligiblePackages(packages, registryHasVersion);
  const publicPackages = assertPublicPackagesConfigured(packages);

  // Check remote state after quality gates and immediately before publishing.
  await preflight();

  for (const pkg of eligible) {
    await publish(pkg);
    await verifyPublished(pkg);
  }

  await createTag();

  return {
    published: eligible.map(({ name, version }) => ({ name, version })),
  };
}

export function listChangesetFiles(root) {
  return readdirSync(join(root, '.changeset'))
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort();
}
