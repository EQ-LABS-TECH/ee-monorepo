import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../commands/reconcile';

const command = fileURLToPath(new URL('../commands/reconcile', import.meta.url));

const repository = 'EQ-LABS-TECH/ee-monorepo';

function execute(env = {}) {
  return spawnSync(process.execPath, [command], {
    encoding: 'utf8',
    timeout: 10000,
    env: {
      PATH: process.env.PATH,
      SYSTEMROOT: process.env.SYSTEMROOT,
      ...env,
    },
  });
}

function withEvent(event, callback) {
  const dir = mkdtempSync(join(tmpdir(), 'pn-017-'));

  try {
    const path = join(dir, 'event.json');
    writeFileSync(path, JSON.stringify(event), 'utf8');
    return callback(path);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function ciPullRequestEvent() {
  return {
    action: 'completed',
    repository: { full_name: repository },
    workflow_run: {
      id: 123,
      workflow_id: 456,
      name: 'CI',
      path: '.github/workflows/ci.yml',
      event: 'pull_request',
      head_sha: 'a'.repeat(40),
      status: 'completed',
      conclusion: 'success',
      repository: { full_name: repository },
    },
  };
}

function pullRequestReviewEvent() {
  return {
    action: 'submitted',
    repository: { full_name: repository },
    pull_request: {
      number: 51,
      base: { ref: 'main', repo: { full_name: repository } },
    },
    review: { id: 456, state: 'approved' },
  };
}

test('runs reconciliation directly for a trusted PR review signal', async () => {
  await withEvent(pullRequestReviewEvent(), async (path) => {
    let received;

    await main(
      {
        GITHUB_EVENT_NAME: 'pull_request_review',
        GITHUB_EVENT_PATH: path,
        GITHUB_REPOSITORY: repository,
        GOVERNANCE_PR_TOKEN: 'reader',
        GOVERNANCE_EVIDENCE_TOKEN: 'evidence',
        GOVERNANCE_PUBLISHER_TOKEN: 'publisher',
        GOVERNANCE_APP_ID: '123',
      },
      {
        reconcile: async (context) => {
          received = context;
          return { status: 'SUCCESS', results: [{ number: 10, status: 'PASS' }] };
        },
      },
    );

    assert.deepEqual(received, {
      owner: 'EQ-LABS-TECH',
      repo: 'ee-monorepo',
      token: 'reader',
      governanceToken: 'evidence',
      publisherToken: 'publisher',
      expectedAppId: 123,
    });
  });
});

test('policy-blocked result is a successful reconciliation operation', async () => {
  await main(
    {
      GITHUB_EVENT_NAME: 'schedule',
      GITHUB_REF: 'refs/heads/main',
      GITHUB_REPOSITORY: repository,
    },
    {
      reconcile: async () => ({
        status: 'SUCCESS',
        results: [{ number: 10, status: 'BLOCKED' }],
      }),
    },
  );
});

test('waiting for Validate is a successful non-decision reconciliation result', async () => {
  await main(
    {
      GITHUB_EVENT_NAME: 'schedule',
      GITHUB_REF: 'refs/heads/main',
      GITHUB_REPOSITORY: repository,
    },
    {
      reconcile: async () => ({
        status: 'SUCCESS',
        results: [{ number: 10, status: 'WAITING_FOR_VALIDATION' }],
      }),
    },
  );
});

test('operational reconciliation errors fail the command', async () => {
  await assert.rejects(
    main(
      {
        GITHUB_EVENT_NAME: 'schedule',
        GITHUB_REF: 'refs/heads/main',
        GITHUB_REPOSITORY: repository,
      },
      {
        reconcile: async () => ({
          status: 'INCOMPLETE',
          results: [{ number: 10, status: 'ERROR' }],
        }),
      },
    ),
    /reconciliation is incomplete/,
  );
});

test('rejects unsupported event before privileged execution', () => {
  const result = execute({
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REPOSITORY: repository,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /PN-017 reconciliation error: \{"phase":"reconciliation","code":"unexpected-operation-error","kind":"Error"\}/,
  );
});

test('rejects missing GitHub event path', () => {
  const result = execute({
    GITHUB_EVENT_NAME: 'workflow_run',
    GITHUB_REPOSITORY: repository,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /PN-017 reconciliation error: \{"phase":"reconciliation","code":"unexpected-operation-error","kind":"Error"\}/,
  );
});

test('rejects scheduled reconciliation outside main', () => {
  const result = execute({
    GITHUB_EVENT_NAME: 'schedule',
    GITHUB_REF: 'refs/heads/feat/untrusted',
    GITHUB_REPOSITORY: repository,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /PN-017 reconciliation error: \{"phase":"reconciliation","code":"invalid-input-or-evidence","kind":"TypeError"\}/,
  );
});

test('rejects an unexpected source workflow', () => {
  const event = ciPullRequestEvent();
  event.workflow_run.name = 'Untrusted Workflow';

  withEvent(event, (path) => {
    const result = execute({
      GITHUB_EVENT_NAME: 'workflow_run',
      GITHUB_EVENT_PATH: path,
      GITHUB_REPOSITORY: repository,
    });

    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /PN-017 reconciliation error: \{"phase":"reconciliation","code":"unexpected-operation-error","kind":"Error"\}/,
    );
  });
});

test('rejects CI workflow runs from another repository', () => {
  const event = ciPullRequestEvent();
  event.workflow_run.repository.full_name = 'OTHER/repo';

  withEvent(event, (path) => {
    const result = execute({
      GITHUB_EVENT_NAME: 'workflow_run',
      GITHUB_EVENT_PATH: path,
      GITHUB_REPOSITORY: repository,
    });

    assert.equal(result.status, 1);
  });
});

test('does not print supplied credentials on rejection', () => {
  const credentials = {
    GOVERNANCE_PR_TOKEN: 'sensitive-reader-token',
    GOVERNANCE_EVIDENCE_TOKEN: 'sensitive-evidence-token',
    GOVERNANCE_PUBLISHER_TOKEN: 'sensitive-publisher-token',
  };

  const result = execute({
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REPOSITORY: repository,
    ...credentials,
  });

  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 1);

  for (const value of Object.values(credentials)) {
    assert.equal(output.includes(value), false);
  }
});
