import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { createReleaseManifest } from '../lib/release-integrity.mjs';

import {
  executeVerifiedRelease,
  prepareHistoricalReleaseDependencies,
  reconstructReleasePlan,
  verifyReconstructedReleasePlan,
} from '../lib/reconstruct-release-plan.mjs';

const BASE_COMMIT = 'a'.repeat(40);

function createExecutor({ failAt = null, generateStatus = true } = {}) {
  const commands = [];
  let worktreePath = null;

  const executeCommand = (command, args, cwd) => {
    commands.push({ command, args: [...args], cwd });

    if (command === 'git' && args[0] === 'worktree') {
      if (args[1] === 'add') {
        worktreePath = args[3];

        if (failAt === 'worktree-add') {
          throw new Error('simulated worktree add failure');
        }
      }

      if (
        args[1] === 'remove' &&
        ['worktree-remove', 'worktree-remove-residual', 'worktree-list'].includes(failAt)
      ) {
        throw new Error('simulated worktree cleanup failure');
      }

      if (args[1] === 'list') {
        if (failAt === 'worktree-list') {
          throw new Error('simulated Git worktree inspection failure');
        }

        const rootEntry = `worktree ${cwd}\n`;

        if (failAt === 'worktree-remove') {
          return `${rootEntry}worktree ${worktreePath}\n`;
        }

        return rootEntry;
      }
    }

    if (command === 'pnpm' && args[0] === 'install') {
      if (failAt === 'install') {
        throw new Error('simulated offline installation failure');
      }
    }

    if (command === 'pnpm' && args[0] === 'exec' && args[1] === 'changeset') {
      if (failAt === 'status') {
        throw new Error('simulated Changesets status failure');
      }

      if (generateStatus) {
        const outputIndex = args.indexOf('--output');

        assert.notEqual(outputIndex, -1);

        writeFileSync(
          args[outputIndex + 1],
          JSON.stringify({
            changesets: [
              {
                id: 'test-release',
                releases: [{ name: '@eq-labs/example', type: 'minor' }],
              },
            ],
            releases: [
              {
                name: '@eq-labs/example',
                type: 'minor',
                oldVersion: '1.0.0',
                newVersion: '1.1.0',
              },
            ],
          }),
        );
      }
    }

    return '';
  };

  return {
    executeCommand,
    commands,
    getWorktreePath: () => worktreePath,
  };
}

function reconstruct(executor) {
  return reconstructReleasePlan({
    root: process.cwd(),
    baseCommit: BASE_COMMIT,
    executeCommand: executor.executeCommand,
  });
}

test('invalid base commit runs no commands', () => {
  const executor = createExecutor();

  assert.throws(
    () =>
      reconstructReleasePlan({
        root: process.cwd(),
        baseCommit: 'invalid-sha',
        executeCommand: executor.executeCommand,
      }),
    /Invalid release base commit/,
  );

  assert.deepEqual(executor.commands, []);
});

test('invalid executor is rejected', () => {
  assert.throws(
    () =>
      reconstructReleasePlan({
        root: process.cwd(),
        baseCommit: BASE_COMMIT,
        executeCommand: null,
      }),
    /executeCommand must be a function/,
  );
});

test('invalid prefetch option is rejected', () => {
  const executor = createExecutor();

  assert.throws(
    () =>
      reconstructReleasePlan({
        root: process.cwd(),
        baseCommit: BASE_COMMIT,
        prefetch: 'true',
        executeCommand: executor.executeCommand,
      }),
    /prefetch must be a boolean/,
  );

  assert.deepEqual(executor.commands, []);
});

test('successful reconstruction returns the effective plan', () => {
  const executor = createExecutor();

  assert.deepEqual(reconstruct(executor), {
    changesetIds: ['test-release'],
    releases: [
      {
        name: '@eq-labs/example',
        version: '1.1.0',
        type: 'minor',
      },
    ],
  });

  assert.deepEqual(
    executor.commands.map(({ command, args }) => `${command} ${args.slice(0, 2).join(' ')}`),
    ['git worktree add', 'pnpm install --offline', 'pnpm exec changeset', 'git worktree remove'],
  );
  assert.equal(
    executor.commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'fetch'),
    false,
    'Default release reconstruction must remain strictly offline',
  );
  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('installation failure prevents Changesets execution', () => {
  const executor = createExecutor({ failAt: 'install' });

  assert.throws(() => reconstruct(executor), /simulated offline installation failure/);

  assert.equal(
    executor.commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'exec'),
    false,
  );

  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('Changesets status failure triggers cleanup', () => {
  const executor = createExecutor({ failAt: 'status' });

  assert.throws(() => reconstruct(executor), /simulated Changesets status failure/);

  assert.equal(executor.commands.at(-1).args[1], 'remove');
  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('missing status output fails closed', () => {
  const executor = createExecutor({ generateStatus: false });

  assert.throws(() => reconstruct(executor), /did not generate the reconstructed status/);

  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('cleanup failure preserves temporary worktree', (t) => {
  const executor = createExecutor({ failAt: 'worktree-remove' });

  t.after(() => {
    const path = executor.getWorktreePath();

    // This executor never registers a real Git worktree.
    // Only remove the temporary directory created for this test.
    if (path) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  assert.throws(() => reconstruct(executor), /Release worktree is still registered/);

  assert.equal(existsSync(executor.getWorktreePath()), true);
});

test('partial worktree add failure triggers removal attempt', () => {
  const executor = createExecutor({ failAt: 'worktree-add' });

  assert.throws(() => reconstruct(executor), /simulated worktree add failure/);

  assert.equal(
    executor.commands.some(
      ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'remove',
    ),
    true,
  );

  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('deregistered worktree residual is removed', () => {
  const executor = createExecutor({
    failAt: 'worktree-remove-residual',
  });

  const plan = reconstruct(executor);

  assert.deepEqual(plan, {
    changesetIds: ['test-release'],
    releases: [
      {
        name: '@eq-labs/example',
        version: '1.1.0',
        type: 'minor',
      },
    ],
  });

  assert.equal(existsSync(executor.getWorktreePath()), false);

  assert.equal(
    executor.commands.some(
      ({ command, args }) =>
        command === 'git' &&
        args[0] === 'worktree' &&
        args[1] === 'list' &&
        args[2] === '--porcelain',
    ),
    true,
  );
});

test('unverifiable worktree registration preserves directory', (t) => {
  const executor = createExecutor({
    failAt: 'worktree-list',
  });

  t.after(() => {
    const path = executor.getWorktreePath();

    // The mocked executor never registers a real Git worktree.
    if (path) {
      rmSync(path, { recursive: true, force: true });
    }
  });

  assert.throws(
    () => reconstruct(executor),
    (error) =>
      error instanceof AggregateError && /registration could not be verified/.test(error.message),
  );

  assert.equal(existsSync(executor.getWorktreePath()), true);
});

function createVerificationManifest() {
  const releases = [
    {
      name: '@eq-labs/example',
      version: '1.1.0',
      type: 'minor',
    },
  ];

  const manifest = createReleaseManifest({
    baseCommit: BASE_COMMIT,
    baseVersion: '1.0.0',
    targetVersion: '1.1.0',
    changesetIds: ['test-release'],
    releases,
    packages: [
      {
        name: '@eq-labs/example',
        version: '1.1.0',
        private: false,
      },
    ],
  });

  // The test must use the canonical schema generated by the factory.
  // Do not add release entries if the factory has already included them.
  if (!Array.isArray(manifest.releases) || manifest.releases.length === 0) {
    throw new Error(
      'createReleaseManifest did not include effective releases. ' +
        'Inspect the local manifest factory contract before proceeding.',
    );
  }

  return manifest;
}

test('reconstructed release plan is checked before publication', () => {
  const manifest = createVerificationManifest();

  assert.ok(
    Array.isArray(manifest.releases) && manifest.releases.length > 0,
    'The verification fixture must contain effective releases.',
  );

  let called = false;

  const result = verifyReconstructedReleasePlan({
    root: process.cwd(),
    manifest,
    reconstruct: ({ baseCommit }) => {
      called = true;
      assert.equal(baseCommit, manifest.baseCommit);

      return {
        changesetIds: [...manifest.changesets],
        releases: manifest.releases.map(({ name, version, type }) => ({
          name,
          version,
          type,
        })),
      };
    },
  });

  assert.equal(called, true);
  assert.deepEqual(result.releases, manifest.releases);
});

test('reconstructed version mismatch blocks release', () => {
  const manifest = createVerificationManifest();

  assert.ok(
    Array.isArray(manifest.releases) && manifest.releases.length > 0,
    'The verification fixture must contain effective releases.',
  );

  assert.throws(
    () =>
      verifyReconstructedReleasePlan({
        root: process.cwd(),
        manifest,
        reconstruct: () => ({
          changesetIds: [...manifest.changesets],
          releases: manifest.releases.map((release, index) => ({
            name: release.name,
            type: release.type,
            version: index === 0 ? '999.0.0' : release.version,
          })),
        }),
      }),
    /release plan does not match prepared manifest/,
  );
});

test('reconstruction failure propagates', () => {
  assert.throws(
    () =>
      verifyReconstructedReleasePlan({
        root: process.cwd(),
        manifest: createVerificationManifest(),
        reconstruct: () => {
          throw new Error('simulated offline reconstruction failure');
        },
      }),
    /simulated offline reconstruction failure/,
  );
});

test('invalid reconstruction callback is rejected', () => {
  assert.throws(
    () =>
      verifyReconstructedReleasePlan({
        root: process.cwd(),
        manifest: createVerificationManifest(),
        reconstruct: null,
      }),
    /reconstruct must be a function/,
  );
});

test('plan mismatch prevents all downstream release effects', async () => {
  const manifest = createVerificationManifest();
  const effects = [];

  const inspectRemoteTag = async () => {
    effects.push('inspect-remote-tag');
  };

  const registryHasVersion = async () => {
    effects.push('registry-lookup');
  };

  const publish = async () => {
    effects.push('npm-publish');
  };

  const createTag = async () => {
    effects.push('create-tag');
  };

  const executePublication = async () => {
    verifyReconstructedReleasePlan({
      root: process.cwd(),
      manifest,
      reconstruct: () => ({
        changesetIds: [...manifest.changesets],
        releases: manifest.releases.map((release) => ({
          ...release,
          version: '999.0.0',
        })),
      }),
    });

    await inspectRemoteTag();
    await registryHasVersion();
    await publish();
    await createTag();
  };

  await assert.rejects(executePublication(), /release plan does not match prepared manifest/);

  assert.deepEqual(effects, []);
});

test('reconstruction failure prevents recovery and publication', async () => {
  const manifest = createVerificationManifest();
  const effects = [];

  const executeRelease = async (mode) => {
    verifyReconstructedReleasePlan({
      root: process.cwd(),
      manifest,
      reconstruct: () => {
        throw new Error('simulated reconstruction failure');
      },
    });

    // Both paths must remain unreachable if verification fails.
    effects.push(mode);
  };

  await assert.rejects(executeRelease('normal-publication'), /simulated reconstruction failure/);

  await assert.rejects(
    executeRelease('completed-release-recovery'),
    /simulated reconstruction failure/,
  );

  assert.deepEqual(effects, []);
});

test('valid plan permits the next release phase', async () => {
  const manifest = createVerificationManifest();
  const effects = [];

  const verify = () =>
    verifyReconstructedReleasePlan({
      root: process.cwd(),
      manifest,
      reconstruct: () => ({
        changesetIds: [...manifest.changesets],
        releases: manifest.releases.map(({ name, version, type }) => ({
          name,
          version,
          type,
        })),
      }),
    });

  verify();

  effects.push('release-preflight');

  assert.deepEqual(effects, ['release-preflight']);
});

test('verification failure blocks publication effects', async () => {
  const effects = [];

  await assert.rejects(
    async () =>
      executeVerifiedRelease({
        root: process.cwd(),
        manifest: createVerificationManifest(),
        verify: () => {
          throw new Error('simulated release plan mismatch');
        },
        onVerified: async () => {
          effects.push('registry-lookup');
          effects.push('npm-publish');
          effects.push('create-tag');
        },
      }),
    /simulated release plan mismatch/,
  );

  assert.deepEqual(effects, []);
});

test('verification failure blocks completed-release recovery', async () => {
  const effects = [];

  await assert.rejects(
    async () =>
      executeVerifiedRelease({
        root: process.cwd(),
        manifest: createVerificationManifest(),
        verify: () => {
          throw new Error('simulated reconstruction failure');
        },
        onVerified: async () => {
          effects.push('inspect-remote-tag');
          effects.push('completed-release-recovery');
          effects.push('registry-lookup');
        },
      }),
    /simulated reconstruction failure/,
  );

  assert.deepEqual(effects, []);
});

test('valid verification enables downstream preflight', async () => {
  const manifest = createVerificationManifest();
  const effects = [];

  const result = await executeVerifiedRelease({
    root: process.cwd(),
    manifest,
    verify: ({ root, manifest: received }) => {
      assert.equal(root, process.cwd());
      assert.equal(received, manifest);

      return verifyReconstructedReleasePlan({
        root,
        manifest: received,
        reconstruct: () => ({
          changesetIds: [...manifest.changesets],
          releases: manifest.releases.map(({ name, version, type }) => ({
            name,
            version,
            type,
          })),
        }),
      });
    },
    onVerified: async (plan) => {
      effects.push('preflight');

      assert.deepEqual(plan.releases, manifest.releases);

      return 'preflight-completed';
    },
  });

  assert.equal(result, 'preflight-completed');
  assert.deepEqual(effects, ['preflight']);
});

test('invalid verified result blocks downstream effects', () => {
  const effects = [];

  assert.throws(
    () =>
      executeVerifiedRelease({
        root: process.cwd(),
        manifest: createVerificationManifest(),
        verify: () => ({
          changesetIds: [],
          releases: [],
        }),
        onVerified: () => {
          effects.push('npm-publish');
        },
      }),
    /Invalid verified release plan/,
  );

  assert.deepEqual(effects, []);
});

test('prefetch failure blocks reconstruction and cleans the worktree', () => {
  const commands = [];
  const prefetchError = new Error('Historical dependency prefetch failed');

  const executeCommand = (command, args, cwd) => {
    commands.push({ command, args, cwd });

    if (command === 'pnpm' && args[0] === 'fetch') {
      throw prefetchError;
    }

    return '';
  };

  assert.throws(
    () =>
      reconstructReleasePlan({
        root: process.cwd(),
        baseCommit: 'a'.repeat(40),
        prefetch: true,
        executeCommand,
      }),
    (error) => error === prefetchError,
  );

  assert.deepEqual(
    commands.map(({ command, args }) => `${command} ${args.slice(0, 2).join(' ')}`),
    ['git worktree add', 'pnpm fetch --frozen-lockfile', 'git worktree remove'],
  );

  assert.equal(
    commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'install'),
    false,
  );
  const worktreePath = commands.find(
    ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'add',
  )?.args[3];

  assert.ok(worktreePath, 'Expected a temporary Git worktree path');
  assert.equal(existsSync(worktreePath), false);
});

test('successful prefetch precedes offline installation', () => {
  const executor = createExecutor();

  const plan = reconstructReleasePlan({
    root: process.cwd(),
    baseCommit: BASE_COMMIT,
    prefetch: true,
    executeCommand: executor.executeCommand,
  });

  assert.deepEqual(plan.changesetIds, ['test-release']);

  assert.deepEqual(
    executor.commands.map(({ command, args }) => `${command} ${args.slice(0, 2).join(' ')}`),
    [
      'git worktree add',
      'pnpm fetch --frozen-lockfile',
      'pnpm install --offline',
      'pnpm exec changeset',
      'git worktree remove',
    ],
  );

  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('historical dependency preparation validates the manifest', () => {
  const executor = createExecutor();
  const manifest = createVerificationManifest();

  const result = prepareHistoricalReleaseDependencies({
    root: process.cwd(),
    manifest,
    executeCommand: executor.executeCommand,
  });

  assert.deepEqual(result.releases, manifest.releases);

  assert.equal(
    executor.commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'fetch'),
    true,
  );

  assert.equal(existsSync(executor.getWorktreePath()), false);
});

test('historical preparation rejects an inconsistent manifest', () => {
  const executor = createExecutor();
  const manifest = createVerificationManifest();

  manifest.releases[0].version = '999.0.0';

  assert.throws(
    () =>
      prepareHistoricalReleaseDependencies({
        root: process.cwd(),
        manifest,
        executeCommand: executor.executeCommand,
      }),
    /Planned version mismatch for @eq-labs\/example: 999\.0\.0 != 1\.1\.0/,
  );

  assert.equal(existsSync(executor.getWorktreePath()), false);
  assert.equal(
    executor.commands.some(
      ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'remove',
    ),
    true,
  );
});
