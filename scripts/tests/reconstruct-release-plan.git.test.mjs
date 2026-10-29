import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { reconstructReleasePlan } from '../lib/reconstruct-release-plan.mjs';

function git(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    shell: false,
    timeout: 30_000,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `Git command failed: ${args.join(' ')}\n` + (result.error?.message ?? result.stderr ?? ''),
    );
  }

  return result.stdout.trim();
}

function createRepository(t) {
  const root = mkdtempSync(join(tmpdir(), 'ee-release-git-test-'));

  t.after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  git(['init', '-b', 'main'], root);
  git(['config', 'user.name', 'EE-LABS Test'], root);
  git(['config', 'user.email', 'release-test@example.invalid'], root);

  mkdirSync(join(root, '.changeset'));

  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: '@eq-labs/test-repository',
      version: '1.0.0',
      private: true,
    }),
  );

  writeFileSync(
    join(root, '.changeset', 'test-release.md'),
    ['---', '"@eq-labs/package-a": minor', '---', '', 'Test release.', ''].join('\n'),
  );

  git(['add', '--', 'package.json', '.changeset/test-release.md'], root);
  git(['commit', '-m', 'test: initial release state'], root);

  return {
    root,
    baseCommit: git(['rev-parse', 'HEAD'], root),
  };
}

function createExecutor({ failInstall = false } = {}) {
  const commands = [];

  const executeCommand = (command, args, cwd) => {
    commands.push({ command, args: [...args], cwd });

    if (command === 'git') {
      return git(args, cwd);
    }

    if (command !== 'pnpm') {
      throw new Error(`Unexpected command: ${command}`);
    }

    if (args[0] === 'install') {
      if (failInstall) {
        throw new Error('simulated offline installation failure');
      }

      return '';
    }

    if (args[0] === 'exec' && args[1] === 'changeset' && args[2] === 'status') {
      const outputIndex = args.indexOf('--output');

      assert.notEqual(outputIndex, -1);

      writeFileSync(
        args[outputIndex + 1],
        JSON.stringify({
          changesets: [
            {
              id: 'test-release',
              releases: [
                {
                  name: '@eq-labs/package-a',
                  type: 'minor',
                },
              ],
            },
          ],
          releases: [
            {
              name: '@eq-labs/package-a',
              type: 'minor',
              oldVersion: '1.0.0',
              newVersion: '1.1.0',
            },
          ],
        }),
      );

      return '';
    }

    throw new Error(`Unexpected pnpm operation: ${args.join(' ')}`);
  };

  return { executeCommand, commands };
}

function snapshotRepository(root) {
  return {
    head: git(['rev-parse', 'HEAD'], root),
    branch: git(['branch', '--show-current'], root),
    status: git(['status', '--porcelain', '--untracked-files=all'], root),
    worktrees: git(['worktree', 'list', '--porcelain'], root),
  };
}

test('integration: real Git worktree is removed after reconstruction', (t) => {
  const { root, baseCommit } = createRepository(t);
  const executor = createExecutor();
  const before = snapshotRepository(root);

  const result = reconstructReleasePlan({
    root,
    baseCommit,
    executeCommand: executor.executeCommand,
  });

  assert.deepEqual(result, {
    changesetIds: ['test-release'],
    releases: [
      {
        name: '@eq-labs/package-a',
        version: '1.1.0',
        type: 'minor',
      },
    ],
  });

  assert.deepEqual(snapshotRepository(root), before);

  assert.equal(
    executor.commands.filter(
      ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'add',
    ).length,
    1,
  );

  assert.equal(
    executor.commands.filter(
      ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'remove',
    ).length,
    1,
  );

  assert.equal(
    executor.commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'publish'),
    false,
  );
});

test('integration: installation failure cleans real Git worktree', (t) => {
  const { root, baseCommit } = createRepository(t);
  const executor = createExecutor({ failInstall: true });
  const before = snapshotRepository(root);

  assert.throws(
    () =>
      reconstructReleasePlan({
        root,
        baseCommit,
        executeCommand: executor.executeCommand,
      }),
    /simulated offline installation failure/,
  );

  assert.deepEqual(snapshotRepository(root), before);

  assert.equal(
    executor.commands.some(({ command, args }) => command === 'pnpm' && args[0] === 'exec'),
    false,
  );

  assert.equal(
    executor.commands.some(
      ({ command, args }) => command === 'git' && args[0] === 'worktree' && args[1] === 'remove',
    ),
    true,
  );
});
