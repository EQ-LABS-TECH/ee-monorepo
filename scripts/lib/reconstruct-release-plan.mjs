import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import {
  parseChangesetReleaseStatus,
  parseEffectiveChangesetsPlan,
  validateEffectiveSourcePlan,
} from './release-integrity.mjs';

const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

function normalizeWorktreePath(path) {
  const normalized = resolve(path).replaceAll('\\', '/');

  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function isWorktreeRegistered(output, temporaryDirectory, root) {
  if (typeof output !== 'string' || !output.trim()) {
    throw new Error('Cannot verify Git worktree registration.');
  }

  const registeredPaths = output
    .split(/\r?\n/)
    .filter((line) => line.startsWith('worktree '))
    .map((line) => normalizeWorktreePath(line.slice('worktree '.length)));

  if (registeredPaths.length === 0 || !registeredPaths.includes(normalizeWorktreePath(root))) {
    throw new Error('Incomplete Git worktree registration information.');
  }

  return registeredPaths.includes(normalizeWorktreePath(temporaryDirectory));
}

function resolvePnpmExecution(args) {
  const configuredEntry = process.env.EE_RELEASE_PNPM_ENTRY;

  if (configuredEntry !== undefined) {
    if (
      !isAbsolute(configuredEntry) ||
      !/\.(?:cjs|js)$/i.test(configuredEntry) ||
      !existsSync(configuredEntry)
    ) {
      throw new Error('EE_RELEASE_PNPM_ENTRY must point to an existing absolute JavaScript file.');
    }

    return {
      executable: process.execPath,
      args: [configuredEntry, ...args],
    };
  }

  if (process.platform === 'win32') {
    const corepackEntry = join(
      dirname(process.execPath),
      'node_modules',
      'corepack',
      'dist',
      'pnpm.js',
    );

    if (!existsSync(corepackEntry)) {
      throw new Error(
        'Cannot locate Corepack PNPM entrypoint on Windows. ' +
          'Configure EE_RELEASE_PNPM_ENTRY explicitly.',
      );
    }

    return {
      executable: process.execPath,
      args: [corepackEntry, ...args],
    };
  }

  return {
    executable: 'pnpm',
    args,
  };
}

function execute(command, args, cwd) {
  const env = { ...process.env };

  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  delete env.GITHUB_TOKEN;

  const invocation =
    command === 'pnpm' ? resolvePnpmExecution(args) : { executable: command, args };

  const executable = invocation.executable;
  const executableArgs = invocation.args;

  const result = spawnSync(executable, executableArgs, {
    cwd,
    env,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120_000,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed: ` +
        (result.error?.message || result.stderr?.trim() || `exit status ${result.status}`),
    );
  }

  return result.stdout?.trim() ?? '';
}

/**
 * Reconstruct the effective Changesets plan in an isolated Git worktree.
 *
 * The source checkout is not versioned or published.
 * If worktree removal fails, its directory is preserved for diagnosis.
 */
export function reconstructReleasePlan({
  root,
  baseCommit,
  executeCommand = execute,
  prefetch = false,
}) {
  if (typeof prefetch !== 'boolean') {
    throw new TypeError('prefetch must be a boolean');
  }
  if (typeof root !== 'string' || !root.trim()) {
    throw new Error('Invalid repository root.');
  }

  if (typeof baseCommit !== 'string' || !COMMIT_PATTERN.test(baseCommit)) {
    throw new Error('Invalid release base commit.');
  }

  if (typeof executeCommand !== 'function') {
    throw new TypeError('executeCommand must be a function');
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ee-release-plan-'));

  let result;
  let operationError = null;

  try {
    executeCommand('git', ['worktree', 'add', '--detach', temporaryDirectory, baseCommit], root);

    if (prefetch) {
      executeCommand(
        'pnpm',
        ['fetch', '--frozen-lockfile', '--ignore-scripts'],
        temporaryDirectory,
      );
    }

    executeCommand(
      'pnpm',
      ['install', '--offline', '--frozen-lockfile', '--ignore-scripts'],
      temporaryDirectory,
    );

    const outputPath = join(temporaryDirectory, '.ee-changeset-status.json');

    executeCommand(
      'pnpm',
      ['exec', 'changeset', 'status', '--output', outputPath],
      temporaryDirectory,
    );

    if (!existsSync(outputPath)) {
      throw new Error('Changesets did not generate the reconstructed status.');
    }

    const status = JSON.parse(readFileSync(outputPath, 'utf8'));
    const sourcePlan = parseChangesetReleaseStatus(status);

    result = {
      changesetIds: sourcePlan.changesetIds,
      releases: parseEffectiveChangesetsPlan(status),
    };
  } catch (error) {
    operationError = error;
  }

  let removalError = null;

  try {
    executeCommand('git', ['worktree', 'remove', '--force', temporaryDirectory], root);
  } catch (error) {
    removalError = error;
  }

  if (removalError) {
    let stillRegistered;

    try {
      const output = executeCommand('git', ['worktree', 'list', '--porcelain'], root);

      stillRegistered = isWorktreeRegistered(output, temporaryDirectory, root);
    } catch (inspectionError) {
      throw new AggregateError(
        operationError
          ? [operationError, removalError, inspectionError]
          : [removalError, inspectionError],
        'Release worktree cleanup failed and registration could not be verified. ' +
          `Temporary directory preserved at: ${temporaryDirectory}`,
      );
    }

    if (stillRegistered) {
      throw new AggregateError(
        operationError ? [operationError, removalError] : [removalError],
        'Release worktree is still registered. ' +
          `Temporary directory preserved at: ${temporaryDirectory}`,
      );
    }
  }

  try {
    rmSync(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  } catch (cleanupError) {
    throw new AggregateError(
      operationError ? [operationError, cleanupError] : [cleanupError],
      `Release temporary directory cleanup failed: ${temporaryDirectory}`,
    );
  }

  if (operationError) {
    throw operationError;
  }

  return result;
}

/**
 * Reconstruct and validate the release plan before publication.
 *
 * Throws on reconstruction, cleanup, or manifest mismatch.
 */
export function verifyReconstructedReleasePlan({
  root,
  manifest,
  reconstruct = reconstructReleasePlan,
}) {
  if (typeof reconstruct !== 'function') {
    throw new TypeError('reconstruct must be a function');
  }

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Invalid release manifest.');
  }

  const sourcePlan = reconstruct({
    root,
    baseCommit: manifest.baseCommit,
  });

  if (
    !sourcePlan ||
    typeof sourcePlan !== 'object' ||
    !Array.isArray(sourcePlan.changesetIds) ||
    !Array.isArray(sourcePlan.releases) ||
    sourcePlan.releases.length === 0
  ) {
    throw new Error('Invalid reconstructed Changesets release plan.');
  }

  return validateEffectiveSourcePlan({
    manifest,
    changesetIds: sourcePlan.changesetIds,
    effectiveReleases: sourcePlan.releases,
  });
}

/**
 * Prepare historical dependencies and verify the reconstructed release plan.
 *
 * Intended for CI before publication credentials are made available.
 * The publication path must use the default offline reconstruction.
 */
export function prepareHistoricalReleaseDependencies({ root, manifest, executeCommand = execute }) {
  return verifyReconstructedReleasePlan({
    root,
    manifest,
    reconstruct: ({ root: sourceRoot, baseCommit }) =>
      reconstructReleasePlan({
        root: sourceRoot,
        baseCommit,
        executeCommand,
        prefetch: true,
      }),
  });
}

/**
 * Allow release effects only after independent plan verification succeeds.
 *
 * The callback is never invoked if reconstruction or validation throws.
 */
export function executeVerifiedRelease({
  root,
  manifest,
  verify = verifyReconstructedReleasePlan,
  onVerified,
}) {
  if (typeof verify !== 'function') {
    throw new TypeError('verify must be a function');
  }

  if (typeof onVerified !== 'function') {
    throw new TypeError('onVerified must be a function');
  }

  const verifiedPlan = verify({ root, manifest });

  if (
    !verifiedPlan ||
    !Array.isArray(verifiedPlan.releases) ||
    verifiedPlan.releases.length === 0 ||
    !Array.isArray(verifiedPlan.changesetIds)
  ) {
    throw new Error('Invalid verified release plan.');
  }

  return onVerified(verifiedPlan);
}
