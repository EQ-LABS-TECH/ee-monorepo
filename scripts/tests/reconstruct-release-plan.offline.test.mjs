import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { reconstructReleasePlan } from '../lib/reconstruct-release-plan.mjs';

const ENABLED = process.env.EE_RELEASE_OFFLINE_INTEGRATION === '1';
const SOURCE_ROOT = fileURLToPath(new URL('../../', import.meta.url));

function run(command, args, cwd) {
  const env = { ...process.env };

  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  delete env.GITHUB_TOKEN;

  const isWindowsPnpm = process.platform === 'win32' && command === 'pnpm';

  const executable = isWindowsPnpm ? 'cmd.exe' : command;

  const executableArgs = isWindowsPnpm ? ['/d', '/s', '/c', 'pnpm', ...args] : args;

  const result = spawnSync(executable, executableArgs, {
    cwd,
    env,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: 180_000,
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed:\n` +
        (result.error?.message ||
          result.stderr?.trim() ||
          result.stdout?.trim() ||
          `exit status ${result.status}`),
    );
  }

  return result.stdout.trim();
}

function copyTrackedFiles(sourceRoot, destinationRoot) {
  const output = run('git', ['ls-files', '--cached', '--full-name', '-z'], sourceRoot);

  const files = output.split('\0').filter(Boolean);

  assert.ok(files.length > 0, 'No tracked files were found.');

  const destination = resolve(destinationRoot);

  for (const file of files) {
    const source = resolve(sourceRoot, file);
    const target = resolve(destinationRoot, file);

    assert.ok(
      target.startsWith(`${destination}${sep}`),
      `Tracked file escapes temporary fixture: ${file}`,
    );

    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

function createFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'ee-release-offline-fixture-'));

  const fixture = join(root, 'repository');

  t.after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  // Copy tracked workspace files into a disposable directory.
  // No clone and no access to the source repository's object database.
  mkdirSync(fixture, { recursive: true });

  copyTrackedFiles(SOURCE_ROOT, fixture);

  run('git', ['init', '-b', 'main'], fixture);

  run('git', ['add', '--all'], fixture);

  run(
    'git',
    [
      '-c',
      'user.name=EE-LABS Integration Test',
      '-c',
      'user.email=integration@example.invalid',
      'commit',
      '-m',
      'test: initialize disposable workspace fixture',
    ],
    fixture,
  );

  // Reuse the original lockfile and pinned package manager.
  const rootPackage = JSON.parse(readFileSync(join(fixture, 'package.json'), 'utf8'));

  assert.equal(
    rootPackage.packageManager,
    'pnpm@10.16.1',
    'Fixture must use the pinned PNPM version.',
  );

  run('pnpm', ['install', '--offline', '--frozen-lockfile', '--ignore-scripts'], fixture);

  // Add a dedicated public package only to the disposable fixture.
  // The real EE-LABS workspace remains untouched.
  const packageName = '@eq-labs/offline-integration-fixture';
  const packageDirectory = join(fixture, 'packages', 'offline-integration-fixture');

  mkdirSync(packageDirectory, { recursive: true });

  writeFileSync(
    join(packageDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: packageName,
        version: '1.0.0',
        private: false,
      },
      null,
      2,
    )}\n`,
  );

  // Synchronize the disposable workspace lockfile before creating baseCommit.
  run('pnpm', ['install', '--offline', '--lockfile-only', '--ignore-scripts'], fixture);

  const changesetId = 'ee-offline-integration-check';

  writeFileSync(
    join(fixture, '.changeset', `${changesetId}.md`),
    [
      '---',
      `"${packageName}": minor`,
      '---',
      '',
      'Validate isolated offline release reconstruction.',
      '',
    ].join('\n'),
  );

  run(
    'git',
    [
      'add',
      '--',
      `.changeset/${changesetId}.md`,
      'packages/offline-integration-fixture/package.json',
      'pnpm-lock.yaml',
    ],
    fixture,
  );

  run(
    'git',
    [
      '-c',
      'user.name=EE-LABS Integration Test',
      '-c',
      'user.email=integration@example.invalid',
      'commit',
      '-m',
      'test: add disposable Changeset',
    ],
    fixture,
  );

  return {
    root,
    fixture,
    changesetId,
    packageName,
    baseCommit: run('git', ['rev-parse', 'HEAD'], fixture),
  };
}

test(
  'integration: Git, PNPM offline and real Changesets reconstruct together',
  { skip: !ENABLED },
  (t) => {
    const { fixture, changesetId, packageName, baseCommit } = createFixture(t);

    const before = {
      head: run('git', ['rev-parse', 'HEAD'], fixture),
      status: run('git', ['status', '--porcelain', '--untracked-files=all'], fixture),
      worktrees: run('git', ['worktree', 'list', '--porcelain'], fixture),
    };

    assert.equal(before.status, '', 'Fixture must be clean');

    // Production reconstructor; Git, PNPM and Changesets are all real.
    const plan = reconstructReleasePlan({
      root: fixture,
      baseCommit,
    });

    assert.ok(plan.changesetIds.includes(changesetId));

    assert.ok(
      plan.releases.some(
        ({ name, version, type }) =>
          name === packageName &&
          /^\d+\.\d+\.\d+$/.test(version) &&
          ['patch', 'minor', 'major'].includes(type),
      ),
      `Effective plan must include ${packageName}`,
    );

    // CI preparation: real Git worktree, PNPM fetch, offline install,
    // and Changesets, all against the same disposable base commit.
    const prefetchedPlan = reconstructReleasePlan({
      root: fixture,
      baseCommit,
      prefetch: true,
    });

    assert.deepEqual(
      prefetchedPlan,
      plan,
      'Historical prefetch must not change the effective release plan',
    );

    assert.ok(
      prefetchedPlan.changesetIds.includes(changesetId),
      'Prefetched plan must include the disposable Changeset',
    );

    assert.ok(
      prefetchedPlan.releases.some(
        ({ name, version, type }) =>
          name === packageName &&
          /^\d+\.\d+\.\d+$/.test(version) &&
          ['patch', 'minor', 'major'].includes(type),
      ),
      `Prefetched plan must include ${packageName}`,
    );

    assert.deepEqual(
      {
        head: run('git', ['rev-parse', 'HEAD'], fixture),
        status: run('git', ['status', '--porcelain', '--untracked-files=all'], fixture),
        worktrees: run('git', ['worktree', 'list', '--porcelain'], fixture),
      },
      before,
    );
  },
);
