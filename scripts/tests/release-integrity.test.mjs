import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertRemoteTagAbsent,
  classifyRegistryVersionLookup,
  getEligiblePackages,
  inspectRemoteReleaseTag,
  publishThenTag,
} from '../lib/release-integrity.mjs';

const packages = [
  { name: '@eq-labs/public-new', version: '1.2.0', private: false },
  { name: '@eq-labs/public-existing', version: '2.0.0', private: false },
  { name: '@eq-labs/private', version: '1.0.0', private: true },
];

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
  const result = await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    packages,
    registryHasVersion: (name) => name === '@eq-labs/public-existing',
    publish: async (pkg) => events.push(`publish:${pkg.name}`),
    verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
    createTag: async () => events.push('tag'),
  });
  assert.deepEqual(events, [
    'validate',
    'build',
    'publish:@eq-labs/public-new',
    'verify:@eq-labs/public-new',
    'tag',
  ]);
  assert.deepEqual(result.published, [{ name: '@eq-labs/public-new', version: '1.2.0' }]);
});

test('tag is not created when publication fails', async () => {
  const events = [];
  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      packages: [packages[0]],
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
      packages: releasePackages,
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

test('release fails without creating a tag when every package is private', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      packages: [packages[2]],
      registryHasVersion: () => false,
      publish: async () => events.push('publish'),
      verifyPublished: async (pkg) => events.push(`verify:${pkg.name}`),
      createTag: async () => events.push('tag'),
    }),
    /No public packages are configured/,
  );

  assert.deepEqual(events, ['validate', 'build']);
});

test('remote preflight failure prevents tag creation when no packages are eligible', async () => {
  const events = [];

  await assert.rejects(
    publishThenTag({
      validate: async () => events.push('validate'),
      build: async () => events.push('build'),
      packages: [{ name: '@eq-labs/public-package', version: '1.2.0', private: false }],
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

  await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    packages: [packages[0]],
    registryHasVersion: () => false,
    preflight: async () => events.push('preflight'),
    publish: async (pkg) => events.push(`publish:${pkg.name}`),
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
      packages: [packages[0]],
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

test('published packages are verified before tag creation', async () => {
  const events = [];

  await publishThenTag({
    validate: async () => events.push('validate'),
    build: async () => events.push('build'),
    packages: [packages[0]],
    registryHasVersion: () => false,
    publish: async () => events.push('publish'),
    verifyPublished: async (pkg) => events.push(`verify:${pkg.name}@${pkg.version}`),
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
      packages: [packages[0]],
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
