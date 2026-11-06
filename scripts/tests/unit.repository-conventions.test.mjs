import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import YAML from 'yaml';
import {
  getCurrentBranchName,
  parsePorcelainStatus,
  validateBranchName,
  validateCommitMessages,
  validateRepositoryFileNames,
} from '../lib/repository-conventions.mjs';

test('preserves the first path in porcelain status when its status column is blank', () => {
  assert.deepEqual(parsePorcelainStatus(' M README.md\r\n?? scripts/new-file.mjs\r\n'), [
    'README.md',
    'scripts/new-file.mjs',
  ]);
});

test('ignores deleted source paths while retaining renamed destinations', () => {
  assert.deepEqual(
    parsePorcelainStatus(
      ' D docs/validation/audit/EE-AUDIT-old-name.md\r\nR  old-name.md -> EE-AUD-new-name.md\r\n',
    ),
    ['EE-AUD-new-name.md'],
  );
});

test('accepts kebab-case artifacts and governed EE document and audit filenames', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'scripts/lib/repository-conventions.mjs',
      'docs/architecture/EE-DOC-006_Repository_Structure.md',
      'docs/validation/audit/EE-AUD-Log_Progress_Register.md',
      'docs/validation/audit/reports/EE-AUD-001-2026-11-01-phase-9-ci-efficiency-20261104190542.md',
    ]),
    [],
  );
});

test('accepts governed EE document template filenames only in their template directories', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'templates/document/ee-adr/files/EE-ADR-XXX_Title.md.hbs',
      'templates/document/ee-doc/files/EE-DOC-XXX_Title.md.hbs',
      'templates/document/ee-imp/files/EE-IMP-XXX-PXX_Title.md.hbs',
      'templates/document/ee-rfc/files/EE-RFC-XXX_Title.md.hbs',
      'templates/document/ee-tec/files/EE-TEC-XXX_Title.md.hbs',
    ]),
    [],
  );

  assert.deepEqual(
    validateRepositoryFileNames([
      'templates/document/ee-doc/files/EE-DOC-XXX_Title.md.hbs',
      'scripts/EE-DOC-XXX_Title.md.hbs',
      'templates/document/ee-doc/files/EE-ADR-XXX_Title.md.hbs',
    ]),
    [
      { path: 'scripts/EE-DOC-XXX_Title.md.hbs', code: 'file-not-kebab-case' },
      {
        path: 'templates/document/ee-doc/files/EE-ADR-XXX_Title.md.hbs',
        code: 'file-not-kebab-case',
      },
    ],
  );
});

test('accepts the Codex skill entrypoint only at skill roots', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'marketplace/skills/ee-example-skill/SKILL.md',
      'marketplace/skills/ee-example-skill/references/SKILL.md',
      'marketplace/SKILL.md',
    ]),
    [
      {
        path: 'marketplace/skills/ee-example-skill/references/SKILL.md',
        code: 'file-not-kebab-case',
      },
      { path: 'marketplace/SKILL.md', code: 'file-not-kebab-case' },
    ],
  );
});

test('rejects non-kebab-case new artifacts and directories', () => {
  const violations = validateRepositoryFileNames(['scripts/lib/MyModule.mjs', 'BadDir/file.mjs']);
  assert.deepEqual(
    violations.map(({ code }) => code),
    ['file-not-kebab-case', 'directory-not-kebab-case'],
  );
});

test('requires a type prefix for new test files in any directory', () => {
  const violations = validateRepositoryFileNames([
    'packages/new-package/src/engine.test.ts',
    'packages/new-package/src/engine.unit.test.ts',
    'packages/new-package/src/engine.integration.test.ts',
    'packages/new-package/src/engine.unit.spec.ts',
    'packages/new-package/src/engine.e2e.spec.ts',
  ]);
  assert.deepEqual(violations, [
    { path: 'packages/new-package/src/engine.test.ts', code: 'test-type-prefix-required' },
    {
      path: 'packages/new-package/src/engine.unit.test.ts',
      code: 'test-type-prefix-required',
    },
    {
      path: 'packages/new-package/src/engine.integration.test.ts',
      code: 'test-type-prefix-required',
    },
    { path: 'packages/new-package/src/engine.unit.spec.ts', code: 'test-type-prefix-required' },
    { path: 'packages/new-package/src/engine.e2e.spec.ts', code: 'test-type-prefix-required' },
  ]);
});

test('accepts normative type prefixes for new test files', () => {
  assert.deepEqual(
    validateRepositoryFileNames([
      'packages/new-package/src/unit.engine.test.ts',
      'packages/new-package/src/int.engine.test.ts',
      'packages/new-package/src/component.engine.test.ts',
      'apps/dashboard/tests/e2e/e2e.dashboard.spec.ts',
    ]),
    [],
  );
});

test('keeps existing suffix-style test names valid during gradual adoption', () => {
  const legacyPaths = [
    'scripts/tests/repository-conventions.unit.test.mjs',
    'scripts/tests/security-audit.test.mjs',
  ];
  const inspectedPaths = [];
  assert.deepEqual(
    validateRepositoryFileNames(legacyPaths, {
      isExistingTest: (path) => {
        inspectedPaths.push(path);
        return true;
      },
    }),
    [],
  );
  assert.deepEqual(inspectedPaths, legacyPaths);
});

test('rejects removed legacy files as new when no longer present in base', () => {
  const legacyPath = 'scripts/tests/repository-conventions.unit.test.mjs';
  assert.deepEqual(validateRepositoryFileNames([legacyPath], { isExistingTest: () => false }), [
    { path: legacyPath, code: 'test-type-prefix-required' },
  ]);
});

test('does not consult base for correctly prefixed test files', () => {
  assert.deepEqual(
    validateRepositoryFileNames(['scripts/tests/unit.repository-conventions.test.mjs'], {
      isExistingTest: () => {
        throw new Error('Base lookup must not be required for normative names');
      },
    }),
    [],
  );
});

test('requires an existing test checker function', () => {
  assert.throws(
    () => validateRepositoryFileNames([], { isExistingTest: true }),
    /The existing test checker must be a function/,
  );
});

test('accepts standard branch prefixes with kebab-case descriptions', () => {
  assert.equal(validateBranchName('feat/pr-governance-rules'), null);
  assert.equal(validateBranchName('main'), null);
  assert.equal(validateBranchName('feature/user-authentication'), null);
  assert.equal(validateBranchName('feature/MyFeature')?.code, 'branch-name-invalid');
});

function makeDependabotContext({
  branch = 'dependabot/github_actions/all-actions-6212fb2f78',
  login = 'dependabot[bot]',
  headRepository = 'EQ-LABS-TECH/ee-monorepo',
  baseRepository = 'EQ-LABS-TECH/ee-monorepo',
  repository = 'EQ-LABS-TECH/ee-monorepo',
  eventName = 'pull_request',
} = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ee-dependabot-context-'));
  const eventPath = join(directory, 'event.json');
  writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        user: { login },
        head: { ref: branch, repo: { full_name: headRepository } },
        base: { repo: { full_name: baseRepository } },
      },
    }),
  );

  const keys = ['GITHUB_EVENT_NAME', 'GITHUB_EVENT_PATH', 'GITHUB_REPOSITORY'];
  const previous = keys.map((key) => [key, process.env[key]]);
  process.env.GITHUB_EVENT_NAME = eventName;
  process.env.GITHUB_EVENT_PATH = eventPath;
  process.env.GITHUB_REPOSITORY = repository;

  return () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(directory, { recursive: true, force: true });
  };
}

test('accepts only Dependabot branches generated by configured update groups', () => {
  const restore = makeDependabotContext();
  try {
    const config = YAML.parse(
      readFileSync(new URL('../../.github/dependabot.yml', import.meta.url), 'utf8'),
    );
    const ecosystemPaths = {
      'github-actions': 'github_actions',
      npm: 'npm_and_yarn',
    };
    const configuredBranches = config.updates.flatMap((update) =>
      Object.keys(update.groups ?? {}).map(
        (group) => `dependabot/${ecosystemPaths[update['package-ecosystem']]}/${group}-abc123`,
      ),
    );

    assert.deepEqual(configuredBranches, [
      'dependabot/github_actions/all-actions-abc123',
      'dependabot/npm_and_yarn/all-deps-abc123',
    ]);

    for (const branch of configuredBranches) {
      const restoreBranch = makeDependabotContext({ branch });
      try {
        assert.equal(validateBranchName(branch), null);
      } finally {
        restoreBranch();
      }
    }
  } finally {
    restore();
  }
});

test('rejects Dependabot branch impersonation and untrusted repositories', () => {
  const scenarios = [
    { login: 'edus194' },
    { headRepository: 'attacker/fork' },
    { baseRepository: 'attacker/fork' },
    { repository: 'attacker/fork' },
    { branch: 'dependabot/github_actions/unknown-group-abc123' },
    { branch: 'dependabot/github_actions/all-actions-abc123', eventName: 'push' },
    { branch: 'dependabot/github_actions/all-actions-abc123', branchPayload: 'other-branch' },
  ];

  for (const scenario of scenarios) {
    const { branchPayload, ...contextOptions } = scenario;
    const restore = makeDependabotContext(contextOptions);
    try {
      const branch = scenario.branch ?? 'dependabot/github_actions/all-actions-6212fb2f78';
      if (branchPayload) {
        const eventPath = process.env.GITHUB_EVENT_PATH;
        const event = JSON.parse(readFileSync(eventPath, 'utf8'));
        event.pull_request.head.ref = branchPayload;
        writeFileSync(eventPath, JSON.stringify(event));
      }
      assert.equal(validateBranchName(branch)?.code, 'branch-name-invalid');
    } finally {
      restore();
    }
  }
});

test('fails closed when Dependabot event context is incomplete', () => {
  const keys = ['GITHUB_EVENT_NAME', 'GITHUB_EVENT_PATH', 'GITHUB_REPOSITORY'];
  const previous = keys.map((key) => [key, process.env[key]]);
  try {
    process.env.GITHUB_EVENT_NAME = 'pull_request';
    delete process.env.GITHUB_EVENT_PATH;
    process.env.GITHUB_REPOSITORY = 'EQ-LABS-TECH/ee-monorepo';
    assert.equal(
      validateBranchName('dependabot/github_actions/all-actions-abc123')?.code,
      'branch-name-invalid',
    );
    assert.equal(validateBranchName('')?.code, 'branch-name-required');
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('validates Conventional Commit headers', () => {
  assert.deepEqual(validateCommitMessages(['feat(auth): add login', 'fix: correct retry']), []);
  assert.equal(validateCommitMessages(['update dependencies'])[0].code, 'commit-message-invalid');
});

test('resolves the PR source branch during pull_request_review', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'ee-pr-review-'));
  const eventPath = join(directory, 'event.json');

  const keys = ['GITHUB_HEAD_REF', 'GITHUB_EVENT_NAME', 'GITHUB_EVENT_PATH'];
  const previous = keys.map((key) => [key, process.env[key]]);

  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }

    rmSync(directory, { recursive: true, force: true });
  });

  delete process.env.GITHUB_HEAD_REF;
  process.env.GITHUB_EVENT_NAME = 'pull_request_review';
  process.env.GITHUB_EVENT_PATH = eventPath;

  writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        head: { ref: 'feat/ee-repository-standards' },
      },
    }),
  );

  assert.equal(getCurrentBranchName(), 'feat/ee-repository-standards');
  assert.equal(validateBranchName(getCurrentBranchName()), null);

  writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        head: { ref: 'feat/Invalid-Branch' },
      },
    }),
  );

  assert.equal(validateBranchName(getCurrentBranchName())?.code, 'branch-name-invalid');
});
