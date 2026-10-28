import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { reconstructReleasePlan } from '../lib/reconstruct-release-plan.mjs';

const require = createRequire(import.meta.url);
const changesetBin = require.resolve('@changesets/cli/bin.js');

function executeProcess(command, args, cwd) {
  const env = { ...process.env };

  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  delete env.GITHUB_TOKEN;

  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    shell: false,
    timeout: 30_000,
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

function createFixtureRepository(t) {
  const root = mkdtempSync(join(tmpdir(), 'ee-changesets-real-test-'));

  t.after(() => {
    rmSync(root, { recursive: true, force: true });
  });

  executeProcess('git', ['init', '-b', 'main'], root);
  executeProcess('git', ['config', 'user.name', 'EE-LABS Integration Test'], root);
  executeProcess('git', ['config', 'user.email', 'test@example.invalid'], root);

  mkdirSync(join(root, '.changeset'));
  mkdirSync(join(root, 'packages', 'example'), {
    recursive: true,
  });

  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify(
      {
        name: '@eq-labs/test-root',
        version: '1.0.0',
        private: true,
        packageManager: 'pnpm@10.16.1',
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");

  writeFileSync(
    join(root, 'packages', 'example', 'package.json'),
    `${JSON.stringify(
      {
        name: '@eq-labs/test-package',
        version: '1.0.0',
        private: false,
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(root, '.changeset', 'config.json'),
    `${JSON.stringify(
      {
        changelog: false,
        commit: false,
        fixed: [],
        linked: [],
        access: 'public',
        baseBranch: 'main',
        updateInternalDependencies: 'patch',
        ignore: [],
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(root, '.changeset', 'test-release.md'),
    [
      '---',
      '"@eq-labs/test-package": minor',
      '---',
      '',
      'Test the effective Changesets release plan.',
      '',
    ].join('\n'),
  );

  executeProcess('git', ['add', '--all'], root);
  executeProcess('git', ['commit', '-m', 'test: create Changesets fixture'], root);

  return {
    root,
    baseCommit: executeProcess('git', ['rev-parse', 'HEAD'], root),
  };
}

test('integration: real Changesets calculates the effective release plan', (t) => {
  const { root, baseCommit } = createFixtureRepository(t);

  const before = {
    head: executeProcess('git', ['rev-parse', 'HEAD'], root),
    status: executeProcess('git', ['status', '--porcelain'], root),
    worktrees: executeProcess('git', ['worktree', 'list', '--porcelain'], root),
    packageJson: readFileSync(join(root, 'packages', 'example', 'package.json'), 'utf8'),
  };

  const commands = [];

  const executeCommand = (command, args, cwd) => {
    commands.push({ command, args: [...args], cwd });

    if (command === 'git') {
      return executeProcess(command, args, cwd);
    }

    if (command !== 'pnpm') {
      throw new Error(`Unexpected command: ${command}`);
    }

    if (args[0] === 'install') {
      // Dependencies are supplied by the already installed EE-LABS CLI.
      // No installation or network operation is performed.
      assert.deepEqual(args, ['install', '--offline', '--frozen-lockfile', '--ignore-scripts']);

      return '';
    }

    if (args[0] === 'exec' && args[1] === 'changeset' && args[2] === 'status') {
      const outputIndex = args.indexOf('--output');

      assert.notEqual(outputIndex, -1);

      return executeProcess(
        process.execPath,
        [changesetBin, 'status', '--output', args[outputIndex + 1]],
        cwd,
      );
    }

    throw new Error(`Unexpected pnpm command: ${args.join(' ')}`);
  };

  const plan = reconstructReleasePlan({
    root,
    baseCommit,
    executeCommand,
  });

  assert.deepEqual(plan, {
    changesetIds: ['test-release'],
    releases: [
      {
        name: '@eq-labs/test-package',
        version: '1.1.0',
        type: 'minor',
      },
    ],
  });

  assert.equal(executeProcess('git', ['rev-parse', 'HEAD'], root), before.head);

  assert.equal(executeProcess('git', ['status', '--porcelain'], root), before.status);

  assert.equal(executeProcess('git', ['worktree', 'list', '--porcelain'], root), before.worktrees);

  assert.equal(
    readFileSync(join(root, 'packages', 'example', 'package.json'), 'utf8'),
    before.packageJson,
  );

  assert.equal(
    commands.filter(
      ({ command, args }) => command === 'pnpm' && args[0] === 'exec' && args[1] === 'changeset',
    ).length,
    1,
  );

  assert.equal(
    commands.some(({ command, args }) => command === 'pnpm' && args.includes('publish')),
    false,
  );
});
