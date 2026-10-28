import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertRemoteTagAbsent,
  classifyRegistryVersionLookup,
  createReleaseManifest,
  getEligiblePackages,
  getPublicPackages,
  inspectRemoteReleaseTag,
  publishThenTag,
  validateReleaseManifest,
  verifyCompletedRelease,
  parseChangesetReleaseStatus,
  getPlannedPublicPackages,
  runReleasePreparation,
  validateReleaseTrigger,
  validateReleaseSourcePlan,
  validateReleaseChangesetFiles,
  validateReleaseBaseVersion,
  validateReleaseChangesetContent,
  parseEffectiveChangesetsPlan,
  validateEffectiveReleaseVersions,
  validateEffectiveSourcePlan,
} from '../lib/release-integrity.mjs';

const packages = [
  { name: '@eq-labs/public-new', version: '1.2.0', private: false },
  { name: '@eq-labs/public-existing', version: '2.0.0', private: false },
  { name: '@eq-labs/private', version: '1.0.0', private: true },
];

const createPublicManifestFixture = () =>
  createReleaseManifest({
    baseVersion: '1.0.0',
    targetVersion: '1.2.0',
    baseCommit: 'a'.repeat(40),
    changesetIds: ['test-release'],
    releases: [
      {
        name: '@eq-labs/public-new',
        version: '1.2.0',
        type: 'minor',
      },
    ],
    packages,
  });

function manifestForPackages(releasePackages) {
  return createReleaseManifest({
    baseVersion: '1.0.0',
    targetVersion: '1.2.0',
    baseCommit: 'a'.repeat(40),
    changesetIds: ['test-release'],
    releases: releasePackages
      .filter((pkg) => pkg.private === false)
      .map((pkg) => ({
        name: pkg.name,
        version: pkg.version,
        type: 'patch',
      })),
    packages: releasePackages,
  });
}

test('public package selection excludes private packages', () => {
  assert.deepEqual(
    getPublicPackages([
      { name: '@eq-labs/public', version: '1.2.0', private: false },
      { name: '@eq-labs/private', version: '1.0.0', private: true },
    ]),
    [{ name: '@eq-labs/public', version: '1.2.0', private: false }],
  );
});

test('public package selection accepts an all-private workspace', () => {
  assert.deepEqual(
    getPublicPackages([
      { name: '@eq-labs/private-a', version: '1.0.0', private: true },
      { name: '@eq-labs/private-b', version: '1.0.0', private: true },
    ]),
    [],
  );
});

test('public package selection accepts an empty workspace list', () => {
  assert.deepEqual(getPublicPackages([]), []);
});

test('public package selection rejects a non-array workspace list', () => {
  assert.throws(() => getPublicPackages(null), /packages must be an array/);
});

test('completed release recovery validates and verifies every public package', async () => {
  const events = [];
  const publicPackage = {
    name: '@eq-labs/public',
    version: '1.2.3',
    private: false,
  };

  const result = await verifyCompletedRelease({
    tag: 'v1.2.3',
    version: '1.2.3',
    packages: [publicPackage, { name: '@eq-labs/private', version: '1.2.3', private: true }],
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    registryHasVersion: (name, version) => {
      events.push(`registry:${name}@${version}`);
      return true;
    },
  });

  assert.deepEqual(events, ['validate', 'build', 'registry:@eq-labs/public@1.2.3']);
  assert.deepEqual(result, {
    tag: 'v1.2.3',
    version: '1.2.3',
    publicPackages: [publicPackage],
  });
});

test('completed release recovery refuses completion when a public version is missing', async () => {
  await assert.rejects(
    verifyCompletedRelease({
      tag: 'v1.2.3',
      version: '1.2.3',
      packages: [{ name: '@eq-labs/public', version: '1.2.3', private: false }],
      validate: async () => {},
      build: async () => {},
      registryHasVersion: () => false,
    }),
    /Remote tag v1\.2\.3 already points to HEAD.*missing from npm/,
  );
});

test('eligibility excludes private packages and versions already in the registry', () => {
  const eligible = getEligiblePackages(
    packages,
    (name, version) => name === '@eq-labs/public-existing' && version === '2.0.0',
  );
  assert.deepEqual(
    eligible.map((pkg) => pkg.name),
    ['@eq-labs/public-new'],
  );
});

test('eligibility propagates registry lookup failures', () => {
  assert.throws(
    () =>
      getEligiblePackages([packages[0]], () => {
        throw new Error('npm registry unavailable');
      }),
    /npm registry unavailable/,
  );
});

test('publication happens after validation/build and before tag creation', async () => {
  const events = [];
  const registry = new Set();

  const result = await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    manifest: manifestForPackages(packages),
    registryHasVersion: (name, version) => registry.has(`${name}@${version}`),
    publish: async (pkg) => {
      events.push(`publish:${pkg.name}`);
      registry.add(`${pkg.name}@${pkg.version}`);
    },
    verifyPublished: async (pkg) => {
      events.push(`verify:${pkg.name}`);
      assert.equal(registry.has(`${pkg.name}@${pkg.version}`), true);
    },
    createTag: async () => events.push('tag'),
  });

  assert.deepEqual(events, [
    'validate',
    'build',
    'publish:@eq-labs/public-existing',
    'verify:@eq-labs/public-existing',
    'publish:@eq-labs/public-new',
    'verify:@eq-labs/public-new',
    'tag',
  ]);

  assert.deepEqual(result.published, [
    { name: '@eq-labs/public-existing', version: '2.0.0' },
    { name: '@eq-labs/public-new', version: '1.2.0' },
  ]);
});

test('tag is not created when publication fails', async () => {
  const events = [];
  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages([packages[0]]),
      registryHasVersion: () => false,
      publish: async () => {
        events.push('publish');
        throw new Error('registry unavailable');
      },
      verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
      createTag: async () => events.push('tag'),
    }),
    /registry unavailable/,
  );
  assert.deepEqual(events, ['validate', 'build', 'publish']);
});

test('retry skips an already published package after a partial release failure', async () => {
  const registry = new Set();
  const events = [];
  const releasePackages = [
    { name: '@eq-labs/package-a', version: '1.2.0', private: false },
    { name: '@eq-labs/package-b', version: '1.2.0', private: false },
  ];

  const registryHasVersion = (name, version) => registry.has(`${name}@${version}`);

  const runRelease = (failPackageB) =>
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages(releasePackages),
      registryHasVersion,
      publish: async (pkg) => {
        events.push(`publish:${pkg.name}`);

        if (pkg.name === '@eq-labs/package-b' && failPackageB) {
          throw new Error('simulated partial publication failure');
        }

        registry.add(`${pkg.name}@${pkg.version}`);
      },
      verifyPublished: async (pkg) => {
        events.push(`verify:${pkg.name}`);
        assert.equal(registryHasVersion(pkg.name, pkg.version), true);
      },
      createTag: async () => events.push('tag'),
    });

  await assert.rejects(runRelease(true), /simulated partial publication failure/);

  assert.equal(registryHasVersion('@eq-labs/package-a', '1.2.0'), true);
  assert.equal(registryHasVersion('@eq-labs/package-b', '1.2.0'), false);
  assert.equal(events.includes('tag'), false);

  events.length = 0;

  await runRelease(false);

  assert.deepEqual(events, [
    'validate',
    'build',
    'publish:@eq-labs/package-b',
    'verify:@eq-labs/package-b',
    'tag',
  ]);

  assert.equal(registryHasVersion('@eq-labs/package-a', '1.2.0'), true);
  assert.equal(registryHasVersion('@eq-labs/package-b', '1.2.0'), true);
});

test('all-private release cannot create a tag', async () => {
  const events = [];

  const manifest = {
    schemaVersion: 2,
    releaseId: 'ee-v1.2.0',
    baseVersion: '1.0.0',
    targetVersion: '1.2.0',
    baseCommit: 'a'.repeat(40),
    changesets: ['test-release'],
    releases: [
      {
        name: '@eq-labs/private',
        version: '1.0.0',
        type: 'patch',
      },
    ],
    packages: [
      {
        name: '@eq-labs/private',
        version: '1.0.0',
        private: true,
      },
    ],
  };

  await assert.rejects(
    publishThenTag({
      manifest,
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      registryHasVersion: () => {
        events.push('registry');
        return false;
      },
      publish: async () => events.push('publish'),
      verifyPublished: async () => events.push('verify'),
      createTag: async () => events.push('tag'),
    }),
    /No public packages in Changesets release plan/,
  );

  assert.deepEqual(events, []);
});

test('completed release cannot contain only private packages', async () => {
  await assert.rejects(
    verifyCompletedRelease({
      tag: 'v1.0.0',
      version: '1.0.0',
      packages: [
        {
          name: '@eq-labs/private',
          version: '1.0.0',
          private: true,
        },
      ],
      validate: async () => {},
      build: async () => {},
      registryHasVersion: () => true,
    }),
    /Cannot complete release without public packages/,
  );
});

test('remote preflight failure prevents tag creation when no packages are eligible', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages([
        { name: '@eq-labs/public-package', version: '1.2.0', private: false },
      ]),
      registryHasVersion: () => true,
      preflight: async () => {
        events.push('preflight');
        throw new Error('remote authentication failed');
      },
      publish: async () => events.push('publish'),
      verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
      createTag: async () => events.push('tag'),
    }),
    /remote authentication failed/,
  );

  assert.deepEqual(events, ['validate', 'build', 'preflight']);
});

test('remote tag preflight allows publication when the tag is absent', () => {
  assert.doesNotThrow(() => {
    assertRemoteTagAbsent({
      tag: 'v1.2.3',
      remoteTagRefs: () => '',
    });
  });
});

test('remote tag preflight rejects an existing lightweight tag', () => {
  assert.throws(() => {
    assertRemoteTagAbsent({
      tag: 'v1.2.3',
      remoteTagRefs: () => '0123456789abcdef0123456789abcdef01234567\trefs/tags/v1.2.3',
    });
  }, /Remote tag v1\.2\.3 already exists/);
});

test('remote tag preflight rejects an existing annotated tag', () => {
  assert.throws(() => {
    assertRemoteTagAbsent({
      tag: 'v1.2.3',
      remoteTagRefs: () =>
        [
          '0123456789abcdef0123456789abcdef01234567\trefs/tags/v1.2.3',
          'abcdef0123456789abcdef0123456789abcdef01\trefs/tags/v1.2.3^{}',
        ].join('\n'),
    });
  }, /Remote tag v1\.2\.3 already exists/);
});

test('remote tag preflight propagates remote query failures', () => {
  assert.throws(() => {
    assertRemoteTagAbsent({
      tag: 'v1.2.3',
      remoteTagRefs: () => {
        throw new Error('remote authentication failed');
      },
    });
  }, /remote authentication failed/);
});

test('remote tag preflight rejects invalid tag names', () => {
  assert.throws(() => {
    assertRemoteTagAbsent({
      tag: 'release/latest',
      remoteTagRefs: () => '',
    });
  }, /Invalid release tag/);
});

test('remote preflight runs after validation/build and before publication', async () => {
  const events = [];
  const registry = new Set();

  await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    manifest: manifestForPackages([packages[0]]),
    registryHasVersion: (name, version) => registry.has(`${name}@${version}`),
    preflight: async () => events.push('preflight'),
    publish: async (pkg) => {
      events.push(`publish:${pkg.name}`);
      registry.add(`${pkg.name}@${pkg.version}`);
    },
    verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
    createTag: async () => events.push('tag'),
  });

  assert.deepEqual(events, [
    'validate',
    'build',
    'preflight',
    'publish:@eq-labs/public-new',
    'verify:@eq-labs/public-new',
    'tag',
  ]);
});

test('remote preflight failure prevents publication and tag creation', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages([packages[0]]),
      registryHasVersion: () => false,
      preflight: async () => {
        events.push('preflight');
        throw new Error('remote authentication failed');
      },
      publish: async () => events.push('publish'),
      verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
      createTag: async () => events.push('tag'),
    }),
    /remote authentication failed/,
  );

  assert.deepEqual(events, ['validate', 'build', 'preflight']);
});

test('preflight failure prevents registry lookup, publication, and tag creation', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages([
        { name: '@eq-labs/public', version: '1.2.3', private: false },
      ]),
      registryHasVersion: () => {
        events.push('registry');
        return false;
      },
      preflight: async () => {
        events.push('preflight');
        throw new Error('remote authentication failed');
      },
      publish: async () => events.push('publish'),
      verifyPublished: async () => events.push('verify'),
      createTag: async () => events.push('tag'),
    }),
    /remote authentication failed/,
  );

  assert.deepEqual(events, ['validate', 'build', 'preflight']);
});

test('published packages are verified before tag creation', async () => {
  const events = [];
  const registry = new Set();

  await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    manifest: manifestForPackages([packages[0]]),
    registryHasVersion: (name, version) => registry.has(`${name}@${version}`),
    publish: async (pkg) => {
      events.push('publish');
      registry.add(`${pkg.name}@${pkg.version}`);
    },
    verifyPublished: async (pkg) => {
      assert.equal(registry.has(`${pkg.name}@${pkg.version}`), true);
      events.push(`verify:${pkg.name}@${pkg.version}`);
    },
    createTag: async () => events.push('tag'),
  });

  assert.deepEqual(events, [
    'validate',
    'build',
    'publish',
    'verify:@eq-labs/public-new@1.2.0',
    'tag',
  ]);
});

test('tag is not created when post-publication verification fails', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      manifest: manifestForPackages([packages[0]]),
      registryHasVersion: () => false,
      publish: async () => events.push('publish'),
      verifyPublished: async () => {
        events.push('verify');
        throw new Error('published version not visible in registry');
      },
      createTag: async () => events.push('tag'),
    }),
    /published version not visible in registry/,
  );

  assert.deepEqual(events, ['validate', 'build', 'publish', 'verify']);
});

test('registry lookup returns true when npm succeeds', () => {
  assert.equal(
    classifyRegistryVersionLookup({
      status: 0,
      stdout: '"1.2.3"',
      stderr: '',
    }),
    true,
  );
});

test('registry lookup returns false for an explicit npm E404', () => {
  assert.equal(
    classifyRegistryVersionLookup({
      status: 1,
      stdout: '',
      stderr: 'npm error code E404\n404 Not Found',
    }),
    false,
  );
});

test('registry lookup fails closed on authentication errors', () => {
  assert.throws(
    () =>
      classifyRegistryVersionLookup({
        status: 1,
        stdout: '',
        stderr: 'npm error code E401\nUnauthorized',
      }),
    /Unable to check npm registry/,
  );
});

test('registry lookup fails closed on network errors', () => {
  assert.throws(
    () =>
      classifyRegistryVersionLookup({
        status: 1,
        stdout: '',
        stderr: 'npm error code ECONNRESET',
      }),
    /Unable to check npm registry/,
  );
});

test('registry lookup fails closed on unknown errors', () => {
  assert.throws(
    () =>
      classifyRegistryVersionLookup({
        status: 1,
        stdout: '',
        stderr: 'unexpected registry response',
      }),
    /Unable to check npm registry/,
  );
});

const expectedReleaseCommit = '0123456789abcdef0123456789abcdef01234567';
const otherReleaseCommit = 'abcdef0123456789abcdef0123456789abcdef01';

test('remote release tag is absent when ls-remote returns no refs', () => {
  assert.deepEqual(
    inspectRemoteReleaseTag({
      tag: 'v1.2.3',
      remoteTagRefs: () => '',
      expectedCommit: expectedReleaseCommit,
    }),
    { state: 'absent' },
  );
});

test('remote lightweight tag matches when it points to the expected commit', () => {
  assert.deepEqual(
    inspectRemoteReleaseTag({
      tag: 'v1.2.3',
      remoteTagRefs: () => `${expectedReleaseCommit}\trefs/tags/v1.2.3`,
      expectedCommit: expectedReleaseCommit,
    }),
    {
      state: 'matches',
      targetCommit: expectedReleaseCommit,
    },
  );
});

test('remote annotated tag matches by its peeled commit', () => {
  const tagObject = 'abcdef0123456789abcdef0123456789abcdef01';

  assert.deepEqual(
    inspectRemoteReleaseTag({
      tag: 'v1.2.3',
      remoteTagRefs: () =>
        [`${tagObject}\trefs/tags/v1.2.3`, `${expectedReleaseCommit}\trefs/tags/v1.2.3^{}`].join(
          '\n',
        ),
      expectedCommit: expectedReleaseCommit,
    }),
    {
      state: 'matches',
      targetCommit: expectedReleaseCommit,
    },
  );
});

test('remote tag on another commit is classified as a conflict', () => {
  assert.deepEqual(
    inspectRemoteReleaseTag({
      tag: 'v1.2.3',
      remoteTagRefs: () => `${otherReleaseCommit}\trefs/tags/v1.2.3`,
      expectedCommit: expectedReleaseCommit,
    }),
    {
      state: 'conflict',
      targetCommit: otherReleaseCommit,
      expectedCommit: expectedReleaseCommit,
    },
  );
});

test('remote tag inspection fails closed on remote errors', () => {
  assert.throws(
    () =>
      inspectRemoteReleaseTag({
        tag: 'v1.2.3',
        remoteTagRefs: () => {
          throw new Error('remote authentication failed');
        },
        expectedCommit: expectedReleaseCommit,
      }),
    /remote authentication failed/,
  );
});

test('Changesets status parses the actual changesets[].releases schema', () => {
  assert.deepEqual(
    parseChangesetReleaseStatus({
      changesets: [
        {
          id: 'calm-exports-glow',
          releases: [
            { name: '@eq-labs/config-vitest', type: 'minor' },
            { name: '@eq-labs/config-jest', type: 'minor' },
          ],
        },
      ],
      releases: [],
    }),
    {
      releaseType: 'minor',
      releases: [
        { name: '@eq-labs/config-jest', type: 'minor' },
        { name: '@eq-labs/config-vitest', type: 'minor' },
      ],
      changesetIds: ['calm-exports-glow'],
    },
  );
});

test('Changesets status selects the highest release type for duplicate packages', () => {
  const result = parseChangesetReleaseStatus({
    changesets: [
      {
        id: 'first-change',
        releases: [{ name: '@eq-labs/example', type: 'patch' }],
      },
      {
        id: 'second-change',
        releases: [{ name: '@eq-labs/example', type: 'major' }],
      },
    ],
  });

  assert.deepEqual(result, {
    releaseType: 'major',
    releases: [{ name: '@eq-labs/example', type: 'major' }],
    changesetIds: ['first-change', 'second-change'],
  });
});

test('Changesets status rejects an empty release plan', () => {
  assert.throws(
    () => parseChangesetReleaseStatus({ changesets: [], releases: [] }),
    /no package releases/,
  );
});

test('Changesets status rejects invalid release types', () => {
  assert.throws(
    () =>
      parseChangesetReleaseStatus({
        changesets: [
          {
            id: 'invalid-release-type',
            releases: [{ name: '@eq-labs/example', type: 'invalid' }],
          },
        ],
      }),
    /invalid package release entry/,
  );
});

const manifestFixture = createPublicManifestFixture;

test('release manifest is normalized and includes the real workspace inventory', () => {
  const manifest = manifestFixture();

  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.releaseId, 'ee-v1.2.0');
  assert.deepEqual(manifest.changesets, ['test-release']);
  assert.deepEqual(manifest.releases, [
    {
      name: '@eq-labs/public-new',
      version: '1.2.0',
      type: 'minor',
    },
  ]);

  assert.deepEqual(
    manifest.packages.map(({ name }) => name),
    ['@eq-labs/private', '@eq-labs/public-existing', '@eq-labs/public-new'],
  );

  assert.equal(
    validateReleaseManifest(manifest, {
      expectedVersion: '1.2.0',
      workspacePackages: manifest.packages,
    }),
    manifest,
  );
});

test('release manifest rejects a target version mismatch', () => {
  assert.throws(
    () =>
      validateReleaseManifest(manifestFixture(), {
        expectedVersion: '9.9.9',
        workspacePackages: manifestFixture().packages,
      }),
    /does not match root version/,
  );
});

test('release manifest rejects a workspace inventory mismatch', () => {
  const manifest = manifestFixture();

  assert.throws(
    () =>
      validateReleaseManifest(manifest, {
        expectedVersion: '1.2.0',
        workspacePackages: [
          ...manifest.packages,
          {
            name: '@eq-labs/unexpected-package',
            version: '1.0.0',
            private: true,
          },
        ],
      }),
    /inventory does not match/,
  );
});

test('release manifest rejects duplicate package entries', () => {
  assert.throws(
    () =>
      createReleaseManifest({
        baseVersion: '1.0.0',
        targetVersion: '1.1.0',
        baseCommit: 'a'.repeat(40),
        changesetIds: ['calm-exports-glow'],
        packages: [
          { name: '@eq-labs/example', version: '1.1.0', private: true },
          { name: '@eq-labs/example', version: '1.1.0', private: true },
        ],
      }),
    /Duplicate package/,
  );
});

test('release manifest rejects invalid base commit and empty Changesets', () => {
  assert.throws(
    () =>
      createReleaseManifest({
        baseVersion: '1.0.0',
        targetVersion: '1.1.0',
        baseCommit: 'not-a-sha',
        changesetIds: ['calm-exports-glow'],
        packages: [{ name: '@eq-labs/example', version: '1.1.0', private: true }],
      }),
    /base commit/,
  );

  assert.throws(
    () =>
      createReleaseManifest({
        baseVersion: '1.0.0',
        targetVersion: '1.1.0',
        baseCommit: 'a'.repeat(40),
        changesetIds: [],
        packages: [{ name: '@eq-labs/example', version: '1.1.0', private: true }],
      }),
    /Changeset IDs/,
  );
});

test('only planned missing versions are published', async () => {
  const events = [];
  const manifest = createPublicManifestFixture();

  const registry = new Set();

  const result = await publishThenTag({
    manifest,
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    registryHasVersion: (name, version) => registry.has(`${name}@${version}`),
    publish: async (pkg) => {
      events.push(`publish:${pkg.name}`);
      registry.add(`${pkg.name}@${pkg.version}`);
    },
    verifyPublished: async (pkg) => {
      events.push(`verify:${pkg.name}`);
      assert.equal(registry.has(`${pkg.name}@${pkg.version}`), true);
    },
    createTag: async () => events.push('tag'),
  });

  assert.deepEqual(result.published, [{ name: '@eq-labs/public-new', version: '1.2.0' }]);

  assert.equal(events.includes('publish:@eq-labs/public-existing'), false);
  assert.equal(events.at(-1), 'tag');
});

test('published planned versions permit tag recovery', async () => {
  const events = [];

  const result = await publishThenTag({
    manifest: createPublicManifestFixture(),
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    registryHasVersion: () => true,
    publish: async () => events.push('publish'),
    verifyPublished: async () => events.push('verify'),
    createTag: async () => events.push('tag'),
  });

  assert.deepEqual(result.published, []);
  assert.deepEqual(events, ['validate', 'build', 'tag']);
});

test('missing release manifest fails closed', () => {
  assert.throws(() => getPlannedPublicPackages(undefined), /Missing verified release plan/);
});

test('target version mismatch is rejected', () => {
  const manifest = createPublicManifestFixture();

  assert.throws(
    () =>
      validateReleaseManifest(manifest, {
        expectedVersion: '9.9.9',
        workspacePackages: packages,
      }),
    /does not match root version/,
  );
});

test('workspace inventory mismatch is rejected', () => {
  const manifest = createPublicManifestFixture();

  assert.throws(
    () =>
      validateReleaseManifest(manifest, {
        expectedVersion: '1.2.0',
        workspacePackages: [
          ...packages,
          {
            name: '@eq-labs/unexpected',
            version: '1.0.0',
            private: false,
          },
        ],
      }),
    /inventory does not match/,
  );
});

test('unknown package in release plan is rejected', () => {
  assert.throws(
    () =>
      createReleaseManifest({
        baseVersion: '1.0.0',
        targetVersion: '1.2.0',
        baseCommit: 'a'.repeat(40),
        changesetIds: ['test-release'],
        releases: [
          {
            name: '@eq-labs/unknown',
            version: '1.2.0',
            type: 'minor',
          },
        ],
        packages,
      }),
    /Planned package not found/,
  );
});

test('unplanned public packages are not publish candidates', () => {
  const manifest = createPublicManifestFixture();

  const planned = getPlannedPublicPackages(manifest);

  assert.deepEqual(
    planned.map((pkg) => pkg.name),
    ['@eq-labs/public-new'],
  );
});

test('remote tag conflict is detected', () => {
  const result = inspectRemoteReleaseTag({
    tag: 'v1.2.0',
    expectedCommit: 'a'.repeat(40),
    remoteTagRefs: () => `${'b'.repeat(40)}\trefs/tags/v1.2.0`,
  });

  assert.equal(result.state, 'conflict');
});

test('remote tag lookup error propagates', () => {
  assert.throws(
    () =>
      inspectRemoteReleaseTag({
        tag: 'v1.2.0',
        expectedCommit: 'a'.repeat(40),
        remoteTagRefs: () => {
          throw new Error('simulated network failure');
        },
      }),
    /simulated network failure/,
  );
});

test('failed tag push can recover without republishing npm packages', async () => {
  const events = [];
  const registry = new Set();
  const manifest = createPublicManifestFixture();

  const tag = 'v1.2.0';
  const commit = 'a'.repeat(40);

  let remoteTagCommit = null;
  let failPush = true;

  const plannedPackages = getPlannedPublicPackages(manifest);

  const registryHasVersion = (name, version) => registry.has(`${name}@${version}`);

  const inspectTag = () =>
    inspectRemoteReleaseTag({
      tag,
      expectedCommit: commit,
      remoteTagRefs: () => (remoteTagCommit ? `${remoteTagCommit}\trefs/tags/${tag}` : ''),
    });

  const runRelease = async () => {
    const remoteState = inspectTag();

    if (remoteState.state === 'conflict') {
      throw new Error('Remote tag conflict');
    }

    if (remoteState.state === 'matches') {
      await verifyCompletedRelease({
        tag,
        version: '1.2.0',
        packages: plannedPackages,
        validate: async () => events.push('validate'),
        build: async () => events.push('build'),
        registryHasVersion,
      });

      return;
    }

    await publishThenTag({
      manifest,
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      registryHasVersion,
      preflight: async () => {
        assert.equal(inspectTag().state, 'absent');
      },
      publish: async (pkg) => {
        events.push(`publish:${pkg.name}`);
        registry.add(`${pkg.name}@${pkg.version}`);
      },
      verifyPublished: async (pkg) => {
        events.push(`verify:${pkg.name}`);
        assert.equal(registryHasVersion(pkg.name, pkg.version), true);
      },
      createTag: async () => {
        events.push('create-local-tag');
      },
    });

    events.push('push-tag');

    if (failPush) {
      throw new Error('simulated Git push failure');
    }

    remoteTagCommit = commit;

    assert.equal(inspectTag().state, 'matches');
  };

  // First attempt: npm succeeds, but pushing the tag fails.
  await assert.rejects(runRelease(), /simulated Git push failure/);

  assert.equal(inspectTag().state, 'absent');

  for (const pkg of plannedPackages) {
    assert.equal(registryHasVersion(pkg.name, pkg.version), true);
  }

  const firstAttemptPublications = events.filter((event) => event.startsWith('publish:'));

  assert.equal(firstAttemptPublications.length, plannedPackages.length);

  assert.equal(events.includes('create-local-tag'), true);
  assert.equal(events.includes('push-tag'), true);

  // Second attempt: remote tag is absent, but npm is complete.
  failPush = false;
  events.length = 0;

  await runRelease();

  assert.deepEqual(events, ['validate', 'build', 'create-local-tag', 'push-tag']);

  assert.equal(inspectTag().state, 'matches');

  // Third attempt: the remote release is already complete.
  events.length = 0;

  await runRelease();

  assert.deepEqual(events, ['validate', 'build']);

  assert.equal(registry.size, plannedPackages.length);
});

function createPreparationOperations(events, failAt = null) {
  const names = [
    'createBranch',
    'versionPackages',
    'synchronizeVersion',
    'prepareManifest',
    'validate',
    'build',
    'stage',
    'commit',
  ];

  return Object.fromEntries(
    names.map((name) => [
      name,
      async () => {
        events.push(name);

        if (name === failAt) {
          throw new Error(`simulated ${name} failure`);
        }
      },
    ]),
  );
}

test('T12: version-packages failure stops preparation before commit', async () => {
  const events = [];

  await assert.rejects(
    runReleasePreparation(createPreparationOperations(events, 'versionPackages')),
    /Release preparation failed at versionPackages/,
  );

  assert.deepEqual(events, ['createBranch', 'versionPackages']);

  assert.equal(events.includes('commit'), false);
  assert.equal(events.includes('stage'), false);
});

test('T12: validation failure does not repeat versioning or commit', async () => {
  const events = [];

  await assert.rejects(
    runReleasePreparation(createPreparationOperations(events, 'validate')),
    /Release preparation failed at validate/,
  );

  assert.deepEqual(events, [
    'createBranch',
    'versionPackages',
    'synchronizeVersion',
    'prepareManifest',
    'validate',
  ]);

  assert.equal(events.filter((event) => event === 'versionPackages').length, 1);

  assert.equal(events.includes('commit'), false);
  assert.equal(events.includes('stage'), false);
});

test('T12: build failure prevents staging and commit', async () => {
  const events = [];

  await assert.rejects(
    runReleasePreparation(createPreparationOperations(events, 'build')),
    /Release preparation failed at build/,
  );

  assert.deepEqual(events, [
    'createBranch',
    'versionPackages',
    'synchronizeVersion',
    'prepareManifest',
    'validate',
    'build',
  ]);

  assert.equal(events.includes('stage'), false);
  assert.equal(events.includes('commit'), false);
});

test('T12: successful preparation runs all steps in order', async () => {
  const events = [];

  await runReleasePreparation(createPreparationOperations(events));

  assert.deepEqual(events, [
    'createBranch',
    'versionPackages',
    'synchronizeVersion',
    'prepareManifest',
    'validate',
    'build',
    'stage',
    'commit',
  ]);
});

test('T12: an invalid operation fails before creating a branch', async () => {
  const events = [];
  const operations = createPreparationOperations(events);

  operations.versionPackages = null;

  await assert.rejects(runReleasePreparation(operations), /versionPackages must be a function/);

  assert.deepEqual(events, []);
});

test('T13: root version change without manifest change is rejected', () => {
  assert.throws(
    () =>
      validateReleaseTrigger({
        previousVersion: '1.0.0',
        currentVersion: '1.2.0',
        manifestChanged: false,
        manifest: createPublicManifestFixture(),
      }),
    /without a new release manifest/,
  );
});

test('T13: release manifest with an incorrect base version is rejected', () => {
  const manifest = createPublicManifestFixture();

  assert.throws(
    () =>
      validateReleaseTrigger({
        previousVersion: '1.1.0',
        currentVersion: '1.2.0',
        manifestChanged: true,
        manifest,
      }),
    /Release base version mismatch/,
  );
});

test('T13: release manifest with an incorrect target version is rejected', () => {
  const manifest = createPublicManifestFixture();

  assert.throws(
    () =>
      validateReleaseTrigger({
        previousVersion: '1.0.0',
        currentVersion: '1.3.0',
        manifestChanged: true,
        manifest,
      }),
    /Release target version mismatch/,
  );
});

test('T14: valid prepared release transition is accepted', () => {
  const manifest = createPublicManifestFixture();

  const result = validateReleaseTrigger({
    previousVersion: '1.0.0',
    currentVersion: '1.2.0',
    manifestChanged: true,
    manifest,
  });

  assert.equal(result.previousVersion, '1.0.0');
  assert.equal(result.currentVersion, '1.2.0');

  assert.deepEqual(
    result.publicPackages.map((pkg) => pkg.name),
    ['@eq-labs/public-new'],
  );
});

test('T14: valid release plan excludes unrelated public packages', () => {
  const manifest = createPublicManifestFixture();

  const result = validateReleaseTrigger({
    previousVersion: '1.0.0',
    currentVersion: '1.2.0',
    manifestChanged: true,
    manifest,
  });

  assert.equal(
    result.publicPackages.some((pkg) => pkg.name === '@eq-labs/public-existing'),
    false,
  );

  assert.equal(result.publicPackages.length, 1);
});

test('F3-02: release source plan matching the manifest is accepted', () => {
  const manifest = createPublicManifestFixture();

  const result = validateReleaseSourcePlan({
    manifest,
    sourcePlan: {
      changesetIds: ['test-release'],
      releases: [
        {
          name: '@eq-labs/public-new',
          type: 'minor',
        },
      ],
    },
  });

  assert.deepEqual(result.changesetIds, ['test-release']);
  assert.equal(result.publicPackages.length, 1);
});

test('F3-02: missing independent source plan is rejected', () => {
  assert.throws(
    () =>
      validateReleaseSourcePlan({
        manifest: createPublicManifestFixture(),
      }),
    /Missing independent Changesets source plan/,
  );
});

test('F3-02: unknown Changeset ID is rejected', () => {
  assert.throws(
    () =>
      validateReleaseSourcePlan({
        manifest: createPublicManifestFixture(),
        sourcePlan: {
          changesetIds: ['different-changeset'],
          releases: [
            {
              name: '@eq-labs/public-new',
              type: 'minor',
            },
          ],
        },
      }),
    /Changeset IDs do not match/,
  );
});

test('F3-02: unapproved package is rejected', () => {
  assert.throws(
    () =>
      validateReleaseSourcePlan({
        manifest: createPublicManifestFixture(),
        sourcePlan: {
          changesetIds: ['test-release'],
          releases: [
            {
              name: '@eq-labs/other-package',
              type: 'minor',
            },
          ],
        },
      }),
    /package releases do not match/,
  );
});

test('F3-02: release type mismatch is rejected', () => {
  assert.throws(
    () =>
      validateReleaseSourcePlan({
        manifest: createPublicManifestFixture(),
        sourcePlan: {
          changesetIds: ['test-release'],
          releases: [
            {
              name: '@eq-labs/public-new',
              type: 'patch',
            },
          ],
        },
      }),
    /package releases do not match/,
  );
});

test('F3-02: Git base Changeset inventory matches manifest', () => {
  const manifest = createPublicManifestFixture();

  const result = validateReleaseChangesetFiles({
    manifest,
    baseFiles: ['.changeset/README.md', '.changeset/test-release.md'],
  });

  assert.deepEqual(result, ['test-release']);
});

test('F3-02: missing Changeset in Git base is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetFiles({
        manifest: createPublicManifestFixture(),
        baseFiles: ['.changeset/README.md'],
      }),
    /Changeset IDs do not match Git base files/,
  );
});

test('F3-02: extra Changeset in Git base is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetFiles({
        manifest: createPublicManifestFixture(),
        baseFiles: ['.changeset/test-release.md', '.changeset/unapproved-release.md'],
      }),
    /Changeset IDs do not match Git base files/,
  );
});

test('F3-02: unexpected nested Changeset file is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetFiles({
        manifest: createPublicManifestFixture(),
        baseFiles: ['.changeset/test-release.md', '.changeset/nested/extra.md'],
      }),
    /Unexpected Changeset source file/,
  );
});

test('F3-02: invalid Git source inventory is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetFiles({
        manifest: createPublicManifestFixture(),
        baseFiles: null,
      }),
    /Invalid Git base Changeset file inventory/,
  );
});

test('F3-02: Git base root version matches manifest', () => {
  const manifest = createPublicManifestFixture();

  const result = validateReleaseBaseVersion({
    manifest,
    basePackageJson: JSON.stringify({
      name: '@eq-labs/ee-monorepo',
      version: '1.0.0',
    }),
  });

  assert.equal(result, '1.0.0');
});

test('F3-02: altered manifest base version is rejected', () => {
  const manifest = createPublicManifestFixture();

  assert.throws(
    () =>
      validateReleaseBaseVersion({
        manifest,
        basePackageJson: JSON.stringify({
          name: '@eq-labs/ee-monorepo',
          version: '0.9.0',
        }),
      }),
    /Release base version mismatch/,
  );
});

test('F3-02: invalid Git base package JSON is rejected', () => {
  assert.throws(
    () =>
      validateReleaseBaseVersion({
        manifest: createPublicManifestFixture(),
        basePackageJson: '{invalid',
      }),
    /Invalid Git base package.json/,
  );
});

test('F3-02: missing Git base package version is rejected', () => {
  assert.throws(
    () =>
      validateReleaseBaseVersion({
        manifest: createPublicManifestFixture(),
        basePackageJson: JSON.stringify({
          name: '@eq-labs/ee-monorepo',
        }),
      }),
    /Invalid Git base package version/,
  );
});

test('F3-02: original Changeset package and type match manifest', () => {
  const result = validateReleaseChangesetContent({
    manifest: createPublicManifestFixture(),
    sourceFiles: {
      'test-release': [
        '---',
        '"@eq-labs/public-new": minor',
        '---',
        '',
        'Release description.',
      ].join('\n'),
    },
  });

  assert.deepEqual(result.declaredReleases, [{ name: '@eq-labs/public-new', type: 'minor' }]);
});

test('F3-02: missing original Changeset content is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetContent({
        manifest: createPublicManifestFixture(),
        sourceFiles: {},
      }),
    /content inventory does not match/,
  );
});

test('F3-02: unapproved package in original Changeset is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetContent({
        manifest: createPublicManifestFixture(),
        sourceFiles: {
          'test-release': [
            '---',
            '"@eq-labs/other-package": minor',
            '---',
            '',
            'Release description.',
          ].join('\n'),
        },
      }),
    /Changeset source release mismatch/,
  );
});

test('F3-02: original major release cannot be downgraded', () => {
  assert.throws(
    () =>
      validateReleaseChangesetContent({
        manifest: createPublicManifestFixture(),
        sourceFiles: {
          'test-release': [
            '---',
            '"@eq-labs/public-new": major',
            '---',
            '',
            'Release description.',
          ].join('\n'),
        },
      }),
    /requires major/,
  );
});

test('F3-02: malformed Changeset frontmatter is rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetContent({
        manifest: createPublicManifestFixture(),
        sourceFiles: {
          'test-release': 'Invalid Markdown without frontmatter',
        },
      }),
    /Invalid Changeset frontmatter/,
  );
});

test('F3-02: duplicate package keys in Changeset are rejected', () => {
  assert.throws(
    () =>
      validateReleaseChangesetContent({
        manifest: createPublicManifestFixture(),
        sourceFiles: {
          'test-release': [
            '---',
            '"@eq-labs/public-new": patch',
            '"@eq-labs/public-new": minor',
            '---',
            '',
            'Release description.',
          ].join('\n'),
        },
      }),
    /Unable to parse Changeset frontmatter/,
  );
});

test('F3-02: effective Changesets releases are normalized', () => {
  const result = parseEffectiveChangesetsPlan({
    releases: [
      {
        name: '@eq-labs/package-b',
        type: 'patch',
        oldVersion: '1.0.0',
        newVersion: '1.0.1',
      },
      {
        name: '@eq-labs/package-a',
        type: 'minor',
        oldVersion: '1.0.0',
        newVersion: '1.1.0',
      },
    ],
  });

  assert.deepEqual(result, [
    {
      name: '@eq-labs/package-a',
      version: '1.1.0',
      type: 'minor',
    },
    {
      name: '@eq-labs/package-b',
      version: '1.0.1',
      type: 'patch',
    },
  ]);
});

test('F3-02: effective releases include dependency-derived packages', () => {
  const result = parseEffectiveChangesetsPlan({
    changesets: [
      {
        id: 'test-release',
        releases: [{ name: '@eq-labs/package-a', type: 'minor' }],
      },
    ],
    releases: [
      {
        name: '@eq-labs/package-a',
        type: 'minor',
        newVersion: '1.1.0',
      },
      {
        name: '@eq-labs/dependent',
        type: 'patch',
        newVersion: '2.0.1',
      },
    ],
  });

  assert.deepEqual(
    result.map(({ name }) => name),
    ['@eq-labs/dependent', '@eq-labs/package-a'],
  );
});

test('F3-02: missing effective release plan is rejected', () => {
  assert.throws(
    () => parseEffectiveChangesetsPlan({ changesets: [] }),
    /Missing effective Changesets release plan/,
  );
});

test('F3-02: empty effective release plan is rejected', () => {
  assert.throws(
    () => parseEffectiveChangesetsPlan({ releases: [] }),
    /Effective Changesets release plan is empty/,
  );
});

test('F3-02: duplicate effective package releases are rejected', () => {
  assert.throws(
    () =>
      parseEffectiveChangesetsPlan({
        releases: [
          {
            name: '@eq-labs/package-a',
            type: 'minor',
            newVersion: '1.1.0',
          },
          {
            name: '@eq-labs/package-a',
            type: 'patch',
            newVersion: '1.0.1',
          },
        ],
      }),
    /Duplicate package in effective Changesets plan/,
  );
});

test('F3-02: malformed effective version is rejected', () => {
  assert.throws(
    () =>
      parseEffectiveChangesetsPlan({
        releases: [
          {
            name: '@eq-labs/package-a',
            type: 'minor',
            newVersion: 'not-a-version',
          },
        ],
      }),
    /Invalid effective Changesets release entry/,
  );
});

test('F3-02: effective versions match the versioned workspace', () => {
  const releases = [
    { name: '@eq-labs/package-a', version: '1.1.0', type: 'minor' },
    { name: '@eq-labs/dependent', version: '2.0.1', type: 'patch' },
  ];

  const result = validateEffectiveReleaseVersions({
    effectiveReleases: releases,
    workspacePackages: [
      { name: '@eq-labs/package-a', version: '1.1.0', private: false },
      { name: '@eq-labs/dependent', version: '2.0.1', private: false },
    ],
  });

  assert.deepEqual(result, releases);
});

test('F3-02: altered versioned package is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveReleaseVersions({
        effectiveReleases: [{ name: '@eq-labs/package-a', version: '1.1.0', type: 'minor' }],
        workspacePackages: [{ name: '@eq-labs/package-a', version: '1.0.0', private: false }],
      }),
    /Effective Changesets version mismatch/,
  );
});

test('F3-02: missing dependency-derived package is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveReleaseVersions({
        effectiveReleases: [{ name: '@eq-labs/dependent', version: '2.0.1', type: 'patch' }],
        workspacePackages: [{ name: '@eq-labs/package-a', version: '1.1.0', private: false }],
      }),
    /Effective Changesets package missing from workspace/,
  );
});

test('F3-02: duplicate effective release is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveReleaseVersions({
        effectiveReleases: [
          { name: '@eq-labs/package-a', version: '1.1.0', type: 'minor' },
          { name: '@eq-labs/package-a', version: '1.1.0', type: 'minor' },
        ],
        workspacePackages: [{ name: '@eq-labs/package-a', version: '1.1.0', private: false }],
      }),
    /Duplicate effective release/,
  );
});

test('F3-02: empty effective plan is rejected before manifest creation', () => {
  assert.throws(
    () =>
      validateEffectiveReleaseVersions({
        effectiveReleases: [],
        workspacePackages: [],
      }),
    /Missing effective Changesets releases/,
  );
});

test('F3-02: independent effective plan matches manifest exactly', () => {
  const manifest = createPublicManifestFixture();

  const result = validateEffectiveSourcePlan({
    manifest,
    changesetIds: ['test-release'],
    effectiveReleases: [
      {
        name: '@eq-labs/public-new',
        version: '1.2.0',
        type: 'minor',
      },
    ],
  });

  assert.deepEqual(result.releases, manifest.releases);
});

test('F3-02: effective source version mismatch is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveSourcePlan({
        manifest: createPublicManifestFixture(),
        changesetIds: ['test-release'],
        effectiveReleases: [
          {
            name: '@eq-labs/public-new',
            version: '1.3.0',
            type: 'minor',
          },
        ],
      }),
    /release plan does not match prepared manifest/,
  );
});

test('F3-02: unplanned derived release is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveSourcePlan({
        manifest: createPublicManifestFixture(),
        changesetIds: ['test-release'],
        effectiveReleases: [
          {
            name: '@eq-labs/public-new',
            version: '1.2.0',
            type: 'minor',
          },
          {
            name: '@eq-labs/dependent',
            version: '1.0.1',
            type: 'patch',
          },
        ],
      }),
    /release plan does not match prepared manifest/,
  );
});

test('F3-02: missing effective source release is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveSourcePlan({
        manifest: createPublicManifestFixture(),
        changesetIds: ['test-release'],
        effectiveReleases: [],
      }),
    /Missing independent effective Changesets releases/,
  );
});

test('F3-02: duplicate effective source release is rejected', () => {
  assert.throws(
    () =>
      validateEffectiveSourcePlan({
        manifest: createPublicManifestFixture(),
        changesetIds: ['test-release'],
        effectiveReleases: [
          {
            name: '@eq-labs/public-new',
            version: '1.2.0',
            type: 'minor',
          },
          {
            name: '@eq-labs/public-new',
            version: '1.2.0',
            type: 'minor',
          },
        ],
      }),
    /Invalid independent effective Changesets releases/,
  );
});
