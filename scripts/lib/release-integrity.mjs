import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const VALID_RELEASE_TYPES = new Set(['patch', 'minor', 'major']);
const RELEASE_TYPE_RANK = { patch: 0, minor: 1, major: 2 };

/**
 * Compare the complete effective Changesets plan with a prepared manifest.
 *
 * effectiveReleases must come from an independently calculated
 * Changesets status result, not from manifest.releases.
 */
export function validateEffectiveSourcePlan({ manifest, changesetIds, effectiveReleases }) {
  getPlannedPublicPackages(manifest);

  if (
    !Array.isArray(changesetIds) ||
    changesetIds.length === 0 ||
    changesetIds.some((id) => typeof id !== 'string')
  ) {
    throw new Error('Invalid independent Changesets identifiers.');
  }

  const expectedIds = [...changesetIds].sort();
  const actualIds = [...manifest.changesets].sort();

  if (
    new Set(expectedIds).size !== expectedIds.length ||
    JSON.stringify(expectedIds) !== JSON.stringify(actualIds)
  ) {
    throw new Error('Effective Changesets identifiers do not match manifest.');
  }

  if (!Array.isArray(effectiveReleases) || effectiveReleases.length === 0) {
    throw new Error('Missing independent effective Changesets releases.');
  }

  const normalize = (releases) =>
    releases
      .map(({ name, version, type }) => ({ name, version, type }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const expected = normalize(effectiveReleases);
  const actual = normalize(manifest.releases);

  const expectedNames = expected.map(({ name }) => name);

  if (
    new Set(expectedNames).size !== expectedNames.length ||
    expected.some(
      ({ name, version, type }) =>
        typeof name !== 'string' ||
        !name.trim() ||
        typeof version !== 'string' ||
        !/^\d+\.\d+\.\d+$/.test(version) ||
        !['patch', 'minor', 'major'].includes(type),
    )
  ) {
    throw new Error('Invalid independent effective Changesets releases.');
  }

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error('Effective Changesets release plan does not match prepared manifest.');
  }

  return {
    changesetIds: expectedIds,
    releases: expected,
  };
}

/**
 * Compare the effective Changesets plan against the workspace
 * after changeset version has completed.
 *
 * Does not write files or execute external commands.
 */
export function validateEffectiveReleaseVersions({ effectiveReleases, workspacePackages }) {
  if (!Array.isArray(effectiveReleases) || effectiveReleases.length === 0) {
    throw new Error('Missing effective Changesets releases.');
  }

  if (!Array.isArray(workspacePackages)) {
    throw new TypeError('workspacePackages must be an array');
  }

  const workspace = new Map();

  for (const pkg of workspacePackages) {
    if (!pkg || typeof pkg.name !== 'string' || !pkg.name || typeof pkg.version !== 'string') {
      throw new Error('Invalid workspace package in release verification.');
    }

    if (workspace.has(pkg.name)) {
      throw new Error(`Duplicate workspace package: ${pkg.name}`);
    }

    workspace.set(pkg.name, pkg);
  }

  const seen = new Set();

  for (const release of effectiveReleases) {
    if (
      !release ||
      typeof release.name !== 'string' ||
      !release.name ||
      typeof release.version !== 'string' ||
      !/^\d+\.\d+\.\d+$/.test(release.version) ||
      !['patch', 'minor', 'major'].includes(release.type)
    ) {
      throw new Error('Invalid effective release entry.');
    }

    if (seen.has(release.name)) {
      throw new Error(`Duplicate effective release: ${release.name}`);
    }

    seen.add(release.name);

    const pkg = workspace.get(release.name);

    if (!pkg) {
      throw new Error(`Effective Changesets package missing from workspace: ${release.name}`);
    }

    if (pkg.version !== release.version) {
      throw new Error(
        `Effective Changesets version mismatch for ${release.name}: ` +
          `expected ${release.version}, found ${pkg.version}.`,
      );
    }
  }

  return effectiveReleases;
}

/**
 * Normalize the aggregate release plan produced by Changesets status.
 *
 * Unlike changesets[].releases, status.releases contains the
 * effective package release entries calculated by Changesets.
 */
export function parseEffectiveChangesetsPlan(status) {
  if (!status || !Array.isArray(status.releases)) {
    throw new Error('Missing effective Changesets release plan.');
  }

  if (status.releases.length === 0) {
    throw new Error('Effective Changesets release plan is empty.');
  }

  const allowedTypes = new Set(['patch', 'minor', 'major']);
  const versionPattern = /^\d+\.\d+\.\d+$/;
  const seen = new Set();

  const releases = status.releases.map((release) => {
    if (
      !release ||
      typeof release.name !== 'string' ||
      !release.name.trim() ||
      !allowedTypes.has(release.type) ||
      typeof release.newVersion !== 'string' ||
      !versionPattern.test(release.newVersion)
    ) {
      throw new Error('Invalid effective Changesets release entry.');
    }

    if (seen.has(release.name)) {
      throw new Error(`Duplicate package in effective Changesets plan: ${release.name}`);
    }

    seen.add(release.name);

    return {
      name: release.name,
      version: release.newVersion,
      type: release.type,
    };
  });

  return releases.sort((a, b) => a.name.localeCompare(b.name));
}

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
  releases,
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

  if (!Array.isArray(releases) || releases.length === 0) {
    throw new Error('Release manifest requires a Changesets release plan.');
  }

  const packageMap = new Map(normalizedPackages.map((pkg) => [pkg.name, pkg]));
  const seenReleases = new Set();

  const normalizedReleases = releases
    .map((release) => {
      if (
        !release ||
        typeof release !== 'object' ||
        Array.isArray(release) ||
        typeof release.name !== 'string' ||
        !release.name.trim() ||
        typeof release.version !== 'string' ||
        !RELEASE_VERSION_PATTERN.test(release.version) ||
        !VALID_RELEASE_TYPES.has(release.type)
      ) {
        throw new Error('Invalid Changesets release entry.');
      }

      const { name, version, type } = release;

      if (seenReleases.has(name)) {
        throw new Error(`Duplicate planned release: ${name}`);
      }

      seenReleases.add(name);

      const pkg = packageMap.get(name);

      if (!pkg) {
        throw new Error(`Planned package not found: ${name}`);
      }

      if (pkg.version !== version) {
        throw new Error(`Planned version mismatch for ${name}: ${version} != ${pkg.version}`);
      }

      return { name, version, type };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const publicReleases = normalizedReleases.filter(
    ({ name }) => packageMap.get(name).private === false,
  );

  if (publicReleases.length === 0) {
    throw new Error('No public packages in Changesets release plan. Refusing release.');
  }

  return {
    schemaVersion: 2,
    releaseId: `ee-v${targetVersion}`,
    baseVersion,
    targetVersion,
    baseCommit,
    changesets: [...new Set(changesetIds)].sort(),
    releases: normalizedReleases,
    packages: normalizedPackages,
  };
}

export function validateReleaseManifest(manifest, { expectedVersion, workspacePackages }) {
  if (
    !manifest ||
    manifest.schemaVersion !== 2 ||
    !Array.isArray(manifest.releases) ||
    manifest.releases.length === 0 ||
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
    releases: manifest.releases,
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
    releases: manifest.releases,
    baseVersion: manifest.baseVersion,
    targetVersion: manifest.targetVersion,
    baseCommit: manifest.baseCommit,
    changesetIds: manifest.changesets,
    packages: workspacePackages,
  }).packages;

  if (JSON.stringify(actualPackages) !== JSON.stringify(manifest.packages)) {
    throw new Error('Release manifest workspace inventory does not match the current workspace.');
  }

  const plannedNames = new Set(manifest.releases.map((release) => release.name));

  if (plannedNames.size !== manifest.releases.length) {
    throw new Error('Duplicate package in release plan.');
  }

  for (const release of manifest.releases) {
    const pkg = actualPackages.find((item) => item.name === release.name);

    if (!pkg || pkg.version !== release.version) {
      throw new Error(`Release plan does not match workspace: ${release.name}`);
    }
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

  if (publicPackages.length === 0) {
    throw new Error('Cannot complete release without public packages.');
  }

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

/**
 * Confirm that the release base version is backed by the
 * root package.json stored in the recorded Git base commit.
 */
export function validateReleaseBaseVersion({ manifest, basePackageJson }) {
  if (
    !manifest ||
    typeof manifest.baseVersion !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(manifest.baseVersion)
  ) {
    throw new Error('Invalid release base version metadata.');
  }

  let basePackage;

  try {
    basePackage = JSON.parse(basePackageJson);
  } catch {
    throw new Error('Invalid Git base package.json.');
  }

  if (
    !basePackage ||
    typeof basePackage.version !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(basePackage.version)
  ) {
    throw new Error('Invalid Git base package version.');
  }

  if (basePackage.version !== manifest.baseVersion) {
    throw new Error(
      `Release base version mismatch: manifest declares ` +
        `${manifest.baseVersion}, Git base contains ${basePackage.version}.`,
    );
  }

  return basePackage.version;
}

/**
 * Verify that a manifest identifies exactly the Changeset files
 * present in its Git base commit.
 *
 * baseFiles must come from git ls-tree, not from the manifest.
 * This does not verify the effective Changesets release plan.
 */
export function validateReleaseChangesetFiles({ manifest, baseFiles }) {
  if (
    !manifest ||
    typeof manifest.baseCommit !== 'string' ||
    !/^[0-9a-f]{40}$/.test(manifest.baseCommit) ||
    !Array.isArray(manifest.changesets) ||
    manifest.changesets.length === 0
  ) {
    throw new Error('Invalid release Changeset source metadata.');
  }

  if (!Array.isArray(baseFiles) || baseFiles.some((file) => typeof file !== 'string')) {
    throw new Error('Invalid Git base Changeset file inventory.');
  }

  const sourceIds = baseFiles
    .filter((file) => file !== '.changeset/README.md')
    .map((file) => {
      const match = /^\.changeset\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/.exec(file);

      if (!match) {
        throw new Error(`Unexpected Changeset source file: ${file}`);
      }

      return match[1];
    })
    .sort();

  const declaredIds = [...manifest.changesets].sort();

  if (
    new Set(sourceIds).size !== sourceIds.length ||
    new Set(declaredIds).size !== declaredIds.length
  ) {
    throw new Error('Duplicate Changeset source identifiers.');
  }

  if (JSON.stringify(sourceIds) !== JSON.stringify(declaredIds)) {
    throw new Error('Release manifest Changeset IDs do not match Git base files.');
  }

  return sourceIds;
}

/**
 * Verify explicitly requested package releases against Changeset
 * Markdown files read from the release base commit.
 *
 * Dependency-derived releases are not reconstructed here.
 */
export function validateReleaseChangesetContent({ manifest, sourceFiles }) {
  const plannedPublicPackages = getPlannedPublicPackages(manifest);

  if (!sourceFiles || typeof sourceFiles !== 'object' || Array.isArray(sourceFiles)) {
    throw new Error('Missing Changeset source content.');
  }

  const expectedIds = [...manifest.changesets].sort();
  const actualIds = Object.keys(sourceFiles).sort();

  if (JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) {
    throw new Error('Changeset source content inventory does not match manifest.');
  }

  const rank = { patch: 1, minor: 2, major: 3 };
  const declaredReleases = new Map();

  for (const id of expectedIds) {
    const source = sourceFiles[id];

    if (typeof source !== 'string') {
      throw new Error(`Invalid Changeset content: ${id}`);
    }

    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);

    if (!match) {
      throw new Error(`Invalid Changeset frontmatter: ${id}`);
    }

    let metadata;

    try {
      metadata = parseYaml(match[1], { uniqueKeys: true });
    } catch {
      throw new Error(`Unable to parse Changeset frontmatter: ${id}`);
    }

    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error(`Invalid Changeset release metadata: ${id}`);
    }

    for (const [name, type] of Object.entries(metadata)) {
      if (typeof name !== 'string' || !name.trim() || !Object.hasOwn(rank, type)) {
        throw new Error(`Invalid Changeset package release in ${id}.`);
      }

      const previous = declaredReleases.get(name);

      if (!previous || rank[type] > rank[previous]) {
        declaredReleases.set(name, type);
      }
    }
  }

  const planned = new Map(manifest.releases.map(({ name, type }) => [name, type]));

  for (const [name, type] of declaredReleases) {
    const plannedType = planned.get(name);

    if (!plannedType || rank[plannedType] < rank[type]) {
      throw new Error(`Changeset source release mismatch: ${name} requires ${type}.`);
    }
  }

  return {
    declaredReleases: [...declaredReleases.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, type]) => ({ name, type })),
    publicPackages: plannedPublicPackages,
  };
}

/**
 * Compare a prepared release manifest against an independently
 * reconstructed Changesets plan.
 *
 * sourcePlan must originate from trusted release source evidence,
 * not from the manifest being validated.
 */
export function validateReleaseSourcePlan({ manifest, sourcePlan }) {
  if (
    !sourcePlan ||
    !Array.isArray(sourcePlan.changesetIds) ||
    !Array.isArray(sourcePlan.releases)
  ) {
    throw new Error('Missing independent Changesets source plan.');
  }

  const publicPackages = getPlannedPublicPackages(manifest);

  const expectedChangesets = [...new Set(sourcePlan.changesetIds)].sort();
  const actualChangesets = [...manifest.changesets].sort();

  if (JSON.stringify(expectedChangesets) !== JSON.stringify(actualChangesets)) {
    throw new Error('Release manifest Changeset IDs do not match the source plan.');
  }

  const normalizeReleases = (releases) =>
    releases.map(({ name, type }) => ({ name, type })).sort((a, b) => a.name.localeCompare(b.name));

  const expectedReleases = normalizeReleases(sourcePlan.releases);
  const actualReleases = normalizeReleases(manifest.releases);

  if (JSON.stringify(expectedReleases) !== JSON.stringify(actualReleases)) {
    throw new Error('Release manifest package releases do not match the source plan.');
  }

  return {
    changesetIds: expectedChangesets,
    releases: expectedReleases,
    publicPackages,
  };
}

/**
 * Validate the release transition detected by CI.
 *
 * This validates the prepared manifest contract, not PR approval
 * or the provenance of the original Changesets.
 */
export function validateReleaseTrigger({
  previousVersion,
  currentVersion,
  manifestChanged,
  manifest,
}) {
  const versionPattern = /^\d+\.\d+\.\d+$/;

  if (
    typeof previousVersion !== 'string' ||
    typeof currentVersion !== 'string' ||
    !versionPattern.test(previousVersion) ||
    !versionPattern.test(currentVersion)
  ) {
    throw new Error('Invalid release transition versions.');
  }

  if (previousVersion === currentVersion) {
    throw new Error('Release transition has no version change.');
  }

  if (manifestChanged !== true) {
    throw new Error('Root version changed without a new release manifest.');
  }

  if (!manifest || manifest.schemaVersion !== 2) {
    throw new Error('Invalid prepared release manifest schema.');
  }

  if (manifest.baseVersion !== previousVersion) {
    throw new Error(
      `Release base version mismatch: expected ${previousVersion}, ` +
        `found ${manifest.baseVersion}.`,
    );
  }

  if (manifest.targetVersion !== currentVersion) {
    throw new Error(
      `Release target version mismatch: expected ${currentVersion}, ` +
        `found ${manifest.targetVersion}.`,
    );
  }

  const publicPackages = getPlannedPublicPackages(manifest);

  return {
    previousVersion,
    currentVersion,
    publicPackages,
  };
}

export function getPlannedPublicPackages(manifest) {
  if (!manifest || !Array.isArray(manifest.releases)) {
    throw new Error('Missing verified release plan.');
  }

  if (!Array.isArray(manifest.packages)) {
    throw new Error('Invalid release workspace inventory.');
  }

  validateReleaseManifest(manifest, {
    expectedVersion: manifest.targetVersion,
    workspacePackages: manifest.packages,
  });

  const packageMap = new Map(manifest.packages.map((pkg) => [pkg.name, pkg]));

  const result = manifest.releases
    .map((release) => packageMap.get(release.name))
    .filter((pkg) => pkg.private === false);

  if (result.length === 0) {
    throw new Error('No public packages configured for this release.');
  }

  return result;
}

/** Stable release order: validation/build, publication, then tag creation. */
export async function publishThenTag({
  validate,
  build,
  manifest,
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

  // Reject invalid or empty public release plans before any operation.
  const plannedPackages = getPlannedPublicPackages(manifest);

  await validate();
  await build();

  // Check remote state after quality gates and before registry operations.
  await preflight();

  const eligible = getEligiblePackages(plannedPackages, registryHasVersion);

  for (const pkg of eligible) {
    await publish(pkg);
    await verifyPublished(pkg);
  }

  for (const pkg of plannedPackages) {
    if (!registryHasVersion(pkg.name, pkg.version)) {
      throw new Error(`Release incomplete: ${pkg.name}@${pkg.version} is missing from npm.`);
    }
  }

  await createTag();

  return {
    published: eligible.map(({ name, version }) => ({ name, version })),
  };
}

/**
 * Execute release preparation in a fixed order.
 *
 * External effects are injected to support deterministic failure tests.
 * A failed preparation is never automatically retried or rolled back:
 * the generated branch and working tree remain available for inspection.
 */
export async function runReleasePreparation({
  createBranch,
  versionPackages,
  synchronizeVersion,
  prepareManifest,
  validate,
  build,
  stage,
  commit,
}) {
  const operations = {
    createBranch,
    versionPackages,
    synchronizeVersion,
    prepareManifest,
    validate,
    build,
    stage,
    commit,
  };

  for (const [name, operation] of Object.entries(operations)) {
    if (typeof operation !== 'function') {
      throw new TypeError(`${name} must be a function`);
    }
  }

  const steps = [
    'createBranch',
    'versionPackages',
    'synchronizeVersion',
    'prepareManifest',
    'validate',
    'build',
    'stage',
    'commit',
  ];

  for (const step of steps) {
    try {
      await operations[step]();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);

      throw new Error(
        `Release preparation failed at ${step}: ${detail}. ` +
          'Inspect the current branch and working tree before retrying. ' +
          'Do not repeat version-packages automatically.',
        { cause: error },
      );
    }
  }
}

export function listChangesetFiles(root) {
  return readdirSync(join(root, '.changeset'))
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort();
}
