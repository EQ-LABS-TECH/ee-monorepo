import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';

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
    for (const path of git(['diff', '--name-only', `${base}...HEAD`]).split(/\r?\n/)) {
      if (path) paths.add(path.replaceAll('\\', '/'));
    }
    for (const path of git(['diff', '--name-only', '--cached', base]).split(/\r?\n/)) {
      if (path) paths.add(path.replaceAll('\\', '/'));
    }
  }
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  for (const line of status.split(/\r?\n/)) {
    const path = line.slice(3).split(' -> ').at(-1);
    if (path) paths.add(path.replaceAll('\\', '/'));
  }
  return [...paths];
}

function isKebabToken(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function invalidPathSegment(segment) {
  if (segment.startsWith('.')) return segment.length > 1 && !isKebabToken(segment.slice(1));
  return !isKebabToken(segment);
}

function isEeDocument(file) {
  return /^EE-(?:DOC|ADR|RFC|IMP|TEC|VAL|WAIVE|AUDIT)-.+\.md$/.test(file);
}

function isLegacyTestName(file) {
  return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);
}

function isExplicitTestName(file) {
  return (
    /\.(?:unit|int|component)\.test\.[cm]?[jt]sx?$/.test(file) ||
    /\.e2e\.spec\.[cm]?[jt]sx?$/.test(file)
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

export function validateRepositoryFileNames(paths) {
  if (!Array.isArray(paths) || paths.some((path) => typeof path !== 'string')) {
    throw new TypeError('File paths must be an array of strings');
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
    if (ROOT_FILE_EXCEPTIONS.has(file) || isEeDocument(file)) continue;
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
      // Existing tests remain accepted during gradual adoption; new tests must be explicit.
      if (!isExistingTestInBase(path)) violations.push({ path, code: 'test-type-suffix-required' });
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
  if (typeof branch !== 'string' || !branch) throw new TypeError('Branch name is required');
  if (['main', 'master', 'develop'].includes(branch)) return null;
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
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;

  if (process.env.GITHUB_EVENT_NAME === 'pull_request_review') {
    if (!process.env.GITHUB_EVENT_PATH) return '';

    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    return event.pull_request?.head?.ref ?? '';
  }

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
