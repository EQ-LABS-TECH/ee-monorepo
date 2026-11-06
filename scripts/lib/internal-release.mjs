const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** Classify a previously validated Changesets plan without consulting npm. */
export function classifyReleasePlan(manifest) {
  if (!manifest || !Array.isArray(manifest.releases) || manifest.releases.length === 0) {
    throw new Error('Internal release classification requires a non-empty release plan.');
  }

  if (!Array.isArray(manifest.packages) || manifest.packages.length === 0) {
    throw new Error('Internal release classification requires a workspace inventory.');
  }

  const packages = new Map(manifest.packages.map((pkg) => [pkg.name, pkg]));
  const plannedPackages = manifest.releases.map((release) => {
    const pkg = packages.get(release.name);
    if (!pkg || typeof pkg.private !== 'boolean') {
      throw new Error(`Release plan has no verified privacy status for ${release.name}.`);
    }
    return pkg;
  });

  if (new Set(manifest.releases.map(({ name }) => name)).size !== manifest.releases.length) {
    throw new Error('Release plan contains duplicate packages.');
  }

  const publicPackages = plannedPackages.filter((pkg) => pkg.private === false);
  return {
    releaseType: publicPackages.length > 0 ? 'public' : 'internal',
    plannedPackages,
    publicPackages,
  };
}

export function getReleaseTag(releaseType, version) {
  if (!VERSION_PATTERN.test(version)) throw new Error(`Invalid release version: ${version}`);
  if (releaseType === 'public') return `v${version}`;
  if (releaseType === 'internal') return `platform-v${version}`;
  throw new Error(`Unsupported release type: ${releaseType}`);
}

/** Validate, build, and finalize an internal tag with retry-safe remote checks. */
export async function finalizeInternalRelease({ validate, build, inspectTag, createTag }) {
  for (const [name, fn] of Object.entries({ validate, build, inspectTag, createTag })) {
    if (typeof fn !== 'function') throw new TypeError(`${name} must be a function`);
  }

  const initialState = await inspectTag();
  if (initialState.state === 'conflict') {
    throw new Error('Internal release tag points to a different commit. Refusing to move it.');
  }

  await validate();
  await build();

  const finalState = await inspectTag();
  if (finalState.state === 'conflict') {
    throw new Error('Internal release tag changed during validation. Refusing to move it.');
  }
  if (finalState.state === 'matches') return { state: 'already-complete' };

  await createTag();
  return { state: 'created' };
}
