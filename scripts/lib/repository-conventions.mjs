import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const BRANCH_TYPES = new Set([
  'feat',
  'feature',
  'fix',
  'bugfix',
  'hotfix',
  'release',
  'docs',
  'refactor',
  'test',
  'chore',
  'build',
  'ci',
  'perf',
  'revert',
  'spike',
  'experiment',
]);
const COMMIT_TYPES = new Set([
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
  'build',
  'revert',
]);
const ROOT_FILE_EXCEPTIONS = new Set([
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CODEOWNERS',
  'CONTRIBUTING.md',
  'Dockerfile',
  'LICENSE',
  'Makefile',
  'NOTICE',
  'README.md',
]);
const DEPENDABOT_ECOSYSTEMS = new Map([
  ['github-actions', 'github_actions'],
  ['npm', 'npm_and_yarn'],
]);

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function baseRef() {
  const base = process.env.GITHUB_BASE_REF || 'main';
  const ref = `origin/${base}`;
  try {
    git(['rev-parse', '--verify', ref]);
    return ref;
  } catch {
    return null;
  }
}

function changedPaths() {
  const base = baseRef();
  const paths = new Set();
  if (base) {
    for (const path of git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]).split(
      /\r?\n/,
    )) {
      if (path) paths.add(path.replaceAll('\\', '/'));
    }
    for (const path of git(['diff', '--name-only', '--diff-filter=ACMR', '--cached', base]).split(
      /\r?\n/,
    )) {
      if (path) paths.add(path.replaceAll('\\', '/'));
    }
  }
  const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).replace(/(?:\r?\n)+$/, '');
  for (const path of parsePorcelainStatus(status)) paths.add(path);
  return [...paths];
}

export function parsePorcelainStatus(status) {
  if (typeof status !== 'string') throw new TypeError('Git status output must be a string');

  return status.split(/\r?\n/).flatMap((line) => {
    if (!line) return [];
    if (line.slice(0, 2).includes('D')) return [];
    const path = line.slice(3).split(' -> ').at(-1);
    return path ? [path.replaceAll('\\', '/')] : [];
  });
}

function isKebabToken(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function invalidPathSegment(segment) {
  if (segment.startsWith('.')) return segment.length > 1 && !isKebabToken(segment.slice(1));
  return !isKebabToken(segment);
}

function isEeDocument(file) {
  return /^EE-(?:DOC|ADR|RFC|IMP|TEC|VAL|WAIVE|AUD)-.+\.md$/.test(file);
}

function isCodexSkillEntrypoint(path) {
  return /^marketplace\/skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/SKILL\.md$/.test(path);
}

function isLegacyTestName(file) {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);
}

function isExplicitTestName(file) {
  return (
    /^(?:unit|int|component)\..+\.test\.[cm]?[jt]sx?$/.test(basename(file)) ||
    /^e2e\..+\.spec\.[cm]?[jt]sx?$/.test(basename(file))
  );
}

function isExistingTestInBase(path) {
  const base = baseRef();
  if (!base) return false;
  try {
    execFileSync('git', ['cat-file', '-e', `${base}:${path}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

export function validateRepositoryFileNames(paths, { isExistingTest = isExistingTestInBase } = {}) {
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== 'string')) {
    throw new TypeError('File paths must be an array of strings');
  }
  if (typeof isExistingTest !== 'function') {
    throw new TypeError('The existing test checker must be a function');
  }
  const violations = [];
  for (const rawPath of paths) {
    const path = rawPath.replaceAll('\\', '/');
    const segments = path.split('/');
    const file = segments.pop();
    if (segments.some(invalidPathSegment)) {
      violations.push({ path, code: 'directory-not-kebab-case' });
      continue;
    }
    if (ROOT_FILE_EXCEPTIONS.has(file) || isEeDocument(file) || isCodexSkillEntrypoint(path))
      continue;
    if (file.startsWith('.')) {
      if (
        file
          .slice(1)
          .split('.')
          .some((token) => !isKebabToken(token))
      ) {
        violations.push({ path, code: 'file-not-kebab-case' });
      }
      continue;
    }
    const ext = extname(file);
    const stem = basename(file, ext);
    if (isLegacyTestName(file) && !isExplicitTestName(file)) {
      // Existing names remain accepted during gradual adoption; new tests must use a type prefix.
      if (!isExistingTest(path)) violations.push({ path, code: 'test-type-prefix-required' });
      continue;
    }
    const tokens = stem.split('.');
    if (tokens.some((token) => !isKebabToken(token))) {
      violations.push({ path, code: 'file-not-kebab-case' });
    }
  }
  return violations;
}

export function validateBranchName(branch) {
  if (typeof branch !== 'string' || !branch) {
    return { branch: typeof branch === 'string' ? branch : '', code: 'branch-name-required' };
  }
  if (['main', 'master', 'develop'].includes(branch)) return null;
  if (branch.startsWith('dependabot/')) {
    return isAuthorizedDependabotBranch(branch) ? null : { branch, code: 'branch-name-invalid' };
  }
  const match = /^([^/]+)\/(.+)$/.exec(branch);
  if (!match || !BRANCH_TYPES.has(match[1])) {
    return { branch, code: 'branch-name-invalid' };
  }
  if (match[1] === 'release') {
    if (!/^v?\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(match[2])) {
      return { branch, code: 'release-branch-version-invalid' };
    }
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(match[2])) {
    return { branch, code: 'branch-name-invalid' };
  }
  return null;
}

function isAuthorizedDependabotBranch(branch) {
  const context = getCurrentPullRequestContext();
  const pullRequest = context?.pullRequest;
  const repository = context?.repository;

  if (
    !context ||
    !['pull_request', 'pull_request_review'].includes(context.eventName) ||
    pullRequest?.user?.login !== 'dependabot[bot]' ||
    !repository ||
    pullRequest.head?.ref !== branch ||
    pullRequest.head?.repo?.full_name !== repository ||
    pullRequest.base?.repo?.full_name !== repository
  ) {
    return false;
  }

  try {
    const dependabotConfig = YAML.parse(
      readFileSync(new URL('../../.github/dependabot.yml', import.meta.url), 'utf8'),
    );
    return (dependabotConfig.updates ?? []).some((update) => {
      const ecosystem = DEPENDABOT_ECOSYSTEMS.get(update['package-ecosystem']);
      if (!ecosystem) return false;

      return Object.keys(update.groups ?? {}).some((group) => {
        const escapedEcosystem = ecosystem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedGroup = group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^dependabot/${escapedEcosystem}/${escapedGroup}-[a-z0-9]+$`).test(
          branch,
        );
      });
    });
  } catch {
    return false;
  }
}

export function getCurrentPullRequestContext() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  if (!['pull_request', 'pull_request_review'].includes(eventName)) return null;
  if (!process.env.GITHUB_EVENT_PATH)
    return { eventName, repository: process.env.GITHUB_REPOSITORY };

  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    return {
      eventName,
      repository: process.env.GITHUB_REPOSITORY,
      pullRequest: event.pull_request,
    };
  } catch {
    return { eventName, repository: process.env.GITHUB_REPOSITORY };
  }
}

export function validateCommitMessages(messages) {
  if (!Array.isArray(messages) || messages.some((message) => typeof message !== 'string')) {
    throw new TypeError('Commit messages must be an array of strings');
  }
  const violations = [];
  messages.forEach((message) => {
    const match = /^([a-z]+)(?:\(([a-z0-9-]+)\))?(!)?: .+$/.exec(message);
    if (!match || !COMMIT_TYPES.has(match[1]))
      violations.push({ message, code: 'commit-message-invalid' });
  });
  return violations;
}

export function getChangedRepositoryPaths() {
  return changedPaths();
}

export function getCurrentBranchName() {
  const pullRequestContext = getCurrentPullRequestContext();
  if (pullRequestContext) return pullRequestContext.pullRequest?.head?.ref ?? '';
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;

  return git(['branch', '--show-current']);
}

export function getPullRequestCommitMessages() {
  const base = baseRef();
  if (!base) throw new Error('Cannot resolve the trusted base branch for commit validation');
  const commits = git(['rev-list', '--no-merges', `${base}...HEAD`]);
  if (!commits) return [];
  return commits.split(/\r?\n/).map((sha) => git(['show', '-s', '--format=%s', sha]));
}

export function repositoryRoot() {
  return ROOT;
}
