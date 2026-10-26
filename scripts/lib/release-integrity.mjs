import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const VALID_RELEASE_TYPES = new Set(['patch', 'minor', 'major']);
const RELEASE_TYPE_RANK = { patch: 0, minor: 1, major: 2 };

export function parseChangesetReleaseStatus(status) {
  if (!status || !Array.isArray(status.changesets)) {
    throw new Error('Invalid Changesets release status');
  }

  const changesets = status.changesets;

  if (
    changesets.some(
      (changeset) =>
        !changeset ||
        typeof changeset.id !== 'string' ||
        !CHANGESET_ID_PATTERN.test(changeset.id) ||
        !Array.isArray(changeset.releases),
    )
  ) {
    throw new Error('Changesets returned invalid Changeset IDs.');
  }

  const changesetIds = changesets.map(({ id }) => id);
  const releaseTypes = new Map();

  for (const changeset of changesets) {
    for (const release of changeset.releases) {
      if (
        !release ||
        typeof release.name !== 'string' ||
        !release.name.trim() ||
        !VALID_RELEASE_TYPES.has(release.type)
      ) {
        throw new Error('Changesets returned an invalid package release entry.');
      }

      const currentType = releaseTypes.get(release.name);

      if (!currentType || RELEASE_TYPE_RANK[release.type] > RELEASE_TYPE_RANK[currentType]) {
        releaseTypes.set(release.name, release.type);
      }
    }
  }

  if (releaseTypes.size === 0) {
    throw new Error('Changesets returned no package releases to prepare.');
  }

  const releases = [...releaseTypes.entries()]
    .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
    .map(([name, type]) => ({ name, type }));

  const types = releases.map(({ type }) => type);
  const releaseType = types.includes('major')
    ? 'major'
    : types.includes('minor')
      ? 'minor'
      : 'patch';

  return {
    releaseType,
    releases,
    changesetIds: [...new Set(changesetIds)].sort(),
  };
}

const RELEASE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const RELEASE_COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const CHANGESET_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createReleaseManifest({
  baseVersion,
  targetVersion,
  baseCommit,
  changesetIds,
  packages,
}) {
  if (
    !RELEASE_VERSION_PATTERN.test(baseVersion) ||
    !RELEASE_VERSION_PATTERN.test(targetVersion) ||
    baseVersion === targetVersion
  ) {
    throw new Error('Invalid release manifest version transition.');
  }

  if (!RELEASE_COMMIT_PATTERN.test(baseCommit)) {
    throw new Error('Invalid release manifest base commit.');
  }

  if (
    !Array.isArray(changesetIds) ||
    changesetIds.length === 0 ||
    changesetIds.some((id) => typeof id !== 'string' || !CHANGESET_ID_PATTERN.test(id))
  ) {
    throw new Error('Invalid release manifest Changeset IDs.');
  }

  if (!Array.isArray(packages) || packages.length === 0) {
    throw new Error('Release manifest must include workspace packages.');
  }

  const seenNames = new Set();

  const normalizedPackages = packages
    .map(({ name, version, private: isPrivate }) => {
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        !RELEASE_VERSION_PATTERN.test(version) ||
        typeof isPrivate !== 'boolean'
      ) {
        throw new Error('Invalid package entry in release manifest.');
      }

      if (seenNames.has(name)) {
        throw new Error(`Duplicate package in release manifest: ${name}`);
      }

      seenNames.add(name);

      return { name, version, private: isPrivate };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    schemaVersion: 1,
    releaseId: `ee-v${targetVersion}`,
    baseVersion,
    targetVersion,
    baseCommit,
    changesets: [...new Set(changesetIds)].sort(),
    packages: normalizedPackages,
  };
}

export function validateReleaseManifest(manifest, { expectedVersion, workspacePackages }) {
  if (
    !manifest ||
    manifest.schemaVersion !== 1 ||
    manifest.releaseId !== `ee-v${manifest.targetVersion}` ||
    !RELEASE_VERSION_PATTERN.test(manifest.baseVersion) ||
    !RELEASE_VERSION_PATTERN.test(manifest.targetVersion) ||
    manifest.baseVersion === manifest.targetVersion ||
    !RELEASE_COMMIT_PATTERN.test(manifest.baseCommit) ||
    !Array.isArray(manifest.changesets) ||
    manifest.changesets.length === 0 ||
    !Array.isArray(manifest.packages) ||
    manifest.packages.length === 0
  ) {
    throw new Error('Invalid release manifest.');
  }

  if (manifest.targetVersion !== expectedVersion) {
    throw new Error(
      `Release manifest target ${manifest.targetVersion} does not match root version ${expectedVersion}.`,
    );
  }

  const expected = createReleaseManifest({
    baseVersion: manifest.baseVersion,
    targetVersion: manifest.targetVersion,
    baseCommit: manifest.baseCommit,
    changesetIds: manifest.changesets,
    packages: manifest.packages,
  });

  if (JSON.stringify(expected) !== JSON.stringify(manifest)) {
    throw new Error('Release manifest is not normalized or contains duplicate entries.');
  }

  const actualPackages = createReleaseManifest({
    baseVersion: manifest.baseVersion,
    targetVersion: manifest.targetVersion,
    baseCommit: manifest.baseCommit,
    changesetIds: manifest.changesets,
    packages: workspacePackages,
  }).packages;

  if (JSON.stringify(actualPackages) !== JSON.stringify(manifest.packages)) {
    throw new Error('Release manifest workspace inventory does not match the current workspace.');
  }

  return manifest;
}

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

export function getPublicPackages(packages) {
  if (!Array.isArray(packages)) {
    throw new TypeError('packages must be an array');
  }

  return packages.filter((pkg) => pkg.private !== true);
}

export async function verifyCompletedRelease({
  tag,
  version,
  packages,
  validate,
  build,
  registryHasVersion,
}) {
  const publicPackages = getPublicPackages(packages);

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

  // Check remote state after quality gates and before registry operations.
  await preflight();

  const eligible = getEligiblePackages(packages, registryHasVersion);

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
