import test from 'node:test';
import assert from 'node:assert/strict';

import { runPrGovernance } from '../lib/pr-governance.run.mjs';

const headSha = 'a'.repeat(40);

const options = {
  owner: 'EQ-LABS-TECH',
  repo: 'ee-monorepo',
  number: 42,
  expectedHeadSha: headSha,
  expectedAppId: 789,
  token: 'pr-token',
  governanceToken: 'governance-token',
  publisherToken: 'publisher-token',
};

function fixture({
  startStatus = 201,
  startRequestId,
  patchStatus = 200,
  validateConclusion = 'success',
  validateRunStatus = 'completed',
  validateHttpStatus = 200,
} = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({
      method: init.method,
      url,
      authorization: init.headers.Authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });

    if (init.method === 'GET' && url.includes('/check-runs?check_name=Validate')) {
      return {
        ok: validateHttpStatus === 200,
        status: validateHttpStatus,
        json: async () => ({
          total_count: 1,
          check_runs: [
            {
              id: 111,
              app: { id: 15368 },
              name: 'Validate',
              status: validateRunStatus,
              conclusion: validateRunStatus === 'completed' ? validateConclusion : null,
              started_at: validateRunStatus === 'queued' ? null : '2026-10-30T12:00:00Z',
            },
          ],
        }),
      };
    }

    if (init.method === 'GET' && url.endsWith('/pulls/42')) {
      const publisher = init.headers.Authorization === 'Bearer publisher-token';

      return {
        ok: true,
        status: 200,
        json: async () =>
          publisher
            ? {
                number: 42,
                state: 'open',
                head: { sha: headSha },
                base: {
                  repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
                },
              }
            : {
                // Malformed PR evidence forces the evaluation-error path.
                number: 42,
              },
      };
    }

    if (init.method === 'POST' && url.endsWith('/check-runs')) {
      return {
        ok: startStatus === 201,
        status: startStatus,
        headers: {
          get: (name) => (name === 'x-github-request-id' ? (startRequestId ?? null) : null),
        },
        json: async () => ({
          id: 456,
          app: { id: 789 },
          name: 'PR Governance',
          head_sha: headSha,
          status: 'in_progress',
        }),
      };
    }

    if (init.method === 'GET' && url.endsWith('/check-runs/456')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 456,
          app: { id: 789 },
          name: 'PR Governance',
          head_sha: headSha,
          status: 'in_progress',
        }),
      };
    }

    if (init.method === 'PATCH' && url.endsWith('/check-runs/456')) {
      const payload = JSON.parse(init.body);

      assert.equal(payload.conclusion, 'failure');
      assert.equal(payload.status, 'completed');

      return {
        ok: patchStatus === 200,
        status: patchStatus,
        json: async () => ({
          id: 456,
          name: 'PR Governance',
          head_sha: headSha,
          status: 'completed',
          conclusion: 'failure',
        }),
      };
    }

    throw new Error(`Unexpected request: ${init.method} ${url}`);
  };

  return { fetchImpl, calls };
}

test('evaluation error completes the same check as failure', async () => {
  const mock = fixture();

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /Invalid GitHub pull request response/,
  );

  assert.deepEqual(
    mock.calls.map(({ method }) => method),
    ['GET', 'GET', 'POST', 'GET', 'GET', 'GET', 'PATCH'],
  );

  const patch = mock.calls.find(({ method }) => method === 'PATCH');

  assert.equal(patch.body.conclusion, 'failure');
  assert.equal(patch.body.output.title, 'PR Governance evaluation failed');
});

test('check start error includes safe GitHub request context', async () => {
  const mock = fixture({ startStatus: 403, startRequestId: 'ABCD:1234' });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    (error) => {
      assert.match(error.message, /check start returned HTTP 403/);
      assert.deepEqual(error.governanceDiagnostic, {
        number: 42,
        headSha,
        phase: 'check-start',
        code: 'github-http-error',
        httpStatus: 403,
        requestId: 'ABCD:1234',
      });
      return true;
    },
  );

  assert.deepEqual(
    mock.calls.map(({ method }) => method),
    ['GET', 'GET', 'POST'],
  );
});

test('Validate lookup errors carry a sanitized readiness diagnostic', async () => {
  const mock = fixture({ validateHttpStatus: 403 });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    (error) => {
      assert.deepEqual(error.governanceDiagnostic, {
        number: 42,
        headSha,
        phase: 'validate-readiness',
        code: 'github-http-error',
        httpStatus: 403,
      });
      assert.equal(JSON.stringify(error.governanceDiagnostic).includes('private response'), false);
      return true;
    },
  );
});

test('Validate pending returns WAITING_FOR_VALIDATION without starting a governance check', async () => {
  const mock = fixture({ validateRunStatus: 'in_progress' });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.mode, 'WAITING_FOR_VALIDATION');
  assert.equal(result.validationCheckRunId, 111);
  assert.equal(
    mock.calls.some(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')),
    false,
  );
});

test('Validate HTTP error after a same-HEAD PASS publishes a failed governance check', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const passed = await reconcile();
  mock.setValidateHttpStatus(403);

  await assert.rejects(reconcile(), (error) => {
    assert.match(error.message, /HTTP 403/);
    assert.equal(error.governanceDiagnostic.phase, 'validate-readiness');
    assert.doesNotMatch(error.message, /private response content/);
    return true;
  });

  assert.equal(passed.decision.status, 'PASS');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
  assert.deepEqual(
    mock.getGovernanceChecks().map(({ status, conclusion }) => [status, conclusion]),
    [
      ['completed', 'failure'],
      ['completed', 'success'],
    ],
  );
});

test('Validate and failure-check PATCH errors are aggregated while the new check stays in progress', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  await reconcile();
  mock.setValidateHttpStatus(403);
  mock.setPatchStatus(403);

  await assert.rejects(reconcile(), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.governanceDiagnostic.code, 'failure-publication-failed');
    assert.equal(error.governanceDiagnostic.phase, 'validate-readiness-failure-publication');
    assert.match(error.errors[0].message, /HTTP 403/);
    assert.match(error.errors[1].message, /check completion returned HTTP 403/);
    assert.doesNotMatch(error.message, /private response content/);
    return true;
  });

  assert.deepEqual(
    mock.getGovernanceChecks().map(({ status, conclusion }) => [status, conclusion]),
    [
      ['in_progress', undefined],
      ['completed', 'success'],
    ],
  );
});

test('Validate error with a changed HEAD does not publish a failure check on stale evidence', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  await reconcile();
  mock.setValidateHttpStatus(403);
  mock.setCurrentHeadSha('b'.repeat(40));

  await assert.rejects(reconcile(), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.governanceDiagnostic.code, 'failure-publication-failed');
    assert.match(error.errors[0].message, /HTTP 403/);
    assert.match(error.errors[1].message, /identity changed before check start/);
    return true;
  });

  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    1,
  );
  assert.deepEqual(
    mock.getGovernanceChecks().map(({ status, conclusion }) => [status, conclusion]),
    [['completed', 'success']],
  );
});

test('Validate error with a closed PR does not publish a failure check', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  await reconcile();
  mock.setValidateHttpStatus(403);
  mock.setPullRequestState('closed');

  await assert.rejects(reconcile(), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.governanceDiagnostic.code, 'failure-publication-failed');
    assert.match(error.errors[0].message, /HTTP 403/);
    assert.match(error.errors[1].message, /identity changed before check start/);
    return true;
  });

  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    1,
  );
  assert.deepEqual(
    mock.getGovernanceChecks().map(({ status, conclusion }) => [status, conclusion]),
    [['completed', 'success']],
  );
});

test('failed recovery exposes both evaluation and PATCH errors', async () => {
  const mock = fixture({ patchStatus: 403 });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 2);
      assert.match(error.errors[0].message, /Invalid GitHub pull request response/);
      assert.match(error.errors[1].message, /check completion returned HTTP 403/);
      return true;
    },
  );
});

function successfulFixture({
  paths = ['README.md'],
  reviewEvents,
  revokeAfterFirstEvaluation = false,
  owners = '* @EQ-LABS-TECH/ee-labs-architecture',
  teamWritable = true,
  teamVisible = true,
  architectActive = true,
  deactivateArchitectAfterCheckLookup = false,
  patchStatus = 200,
  validateHttpStatus = 200,
  validateRunStatus = 'completed',
  validateConclusion = 'success',
  pullRequestState = 'open',
} = {}) {
  const calls = [];
  const baseSha = 'b'.repeat(40);
  let currentPatchStatus = patchStatus;
  let membershipErrorStatus = null;

  const pullRequest = {
    number: 42,
    state: pullRequestState,
    user: { login: 'author' },
    head: {
      sha: headSha,
      repo: { full_name: 'author/ee-monorepo' },
    },
    base: {
      ref: 'main',
      sha: baseSha,
      repo: { full_name: 'EQ-LABS-TECH/ee-monorepo' },
    },
  };

  let reviews = reviewEvents ?? [
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'Looks good',
    },
  ];
  const classificationComments = [
    // Ordinary classification comes from complete changed-path evidence.
  ];

  let reviewReadCount = 0;
  let governanceChecks = [];

  const fetchImpl = async (url, init) => {
    const method = init.method;
    const authorization = init.headers.Authorization;

    calls.push({
      method,
      url,
      authorization,
      body: init.body ? JSON.parse(init.body) : undefined,
    });

    let data;
    let status = 200;

    if (url.endsWith('/pulls/42')) {
      data = pullRequest;
    } else if (url.includes('/pulls/42/files?')) {
      data = paths.map((filename) => ({ filename }));
    } else if (url.includes('/pulls/42/reviews?')) {
      reviewReadCount += 1;

      // readPullRequestEvidence reads reviews twice per evaluation.
      data = revokeAfterFirstEvaluation && reviewReadCount > 2 ? [] : reviews;
    } else if (url.includes('/issues/42/comments?')) {
      data = classificationComments;
    } else if (url.includes('/codeowners/errors?')) {
      data = { errors: [] };
    } else if (url.includes('/contents/.github/CODEOWNERS?')) {
      data = {
        type: 'file',
        path: '.github/CODEOWNERS',
        encoding: 'base64',
        size: Buffer.byteLength(owners),
        content: Buffer.from(owners).toString('base64'),
      };
    } else if (url.match(/\/collaborators\/[^/]+\/permission$/)) {
      const login = url.match(/\/collaborators\/([^/]+)\/permission$/)[1];
      data = {
        user: { login },
        permission: 'write',
        role_name: 'write',
      };
    } else if (url.includes('/teams/ee-labs-architecture/repos/')) {
      data = {
        full_name: 'EQ-LABS-TECH/ee-monorepo',
        permissions: { pull: true, push: teamWritable, admin: false },
      };
    } else if (url.endsWith('/orgs/EQ-LABS-TECH/teams/ee-labs-architecture')) {
      data = { slug: 'ee-labs-architecture', privacy: teamVisible ? 'closed' : 'secret' };
    } else if (url.match(/\/teams\/ee-labs-architecture\/memberships\/[^/]+$/)) {
      status = membershipErrorStatus ?? (architectActive ? 200 : 404);
      data = status === 200 ? { state: 'active', role: 'member' } : undefined;
    } else if (method === 'GET' && url.includes('/check-runs?check_name=Validate')) {
      status = validateHttpStatus;
      data = {
        total_count: 1,
        check_runs: [
          {
            id: 123,
            app: { id: 15368 },
            name: 'Validate',
            status: validateRunStatus,
            conclusion: validateRunStatus === 'completed' ? validateConclusion : null,
            started_at: validateRunStatus === 'queued' ? null : '2026-10-30T12:00:00Z',
          },
        ],
      };
    } else if (method === 'GET' && url.includes('/commits/') && url.includes('/check-runs?')) {
      data = {
        total_count: governanceChecks.length,
        check_runs: governanceChecks,
      };
      if (deactivateArchitectAfterCheckLookup && governanceChecks.length > 0) {
        architectActive = false;
      }
    } else if (url.endsWith('/check-runs/456') && method === 'GET') {
      data = {
        id: 456,
        app: { id: 789 },
        name: 'PR Governance',
        head_sha: headSha,
        status: 'in_progress',
        started_at: '2026-10-30T12:00:00Z',
      };
    } else if (url.endsWith('/check-runs') && method === 'POST') {
      const payload = JSON.parse(init.body);

      assert.equal(payload.head_sha, headSha);
      assert.equal(payload.status, 'in_progress');

      status = 201;
      data = {
        id: 456,
        app: { id: 789 },
        name: payload.name,
        head_sha: headSha,
        status: 'in_progress',
      };
      governanceChecks.unshift({
        id: 456,
        app: { id: 789 },
        name: 'PR Governance',
        head_sha: headSha,
        status: 'in_progress',
        started_at: '2026-10-30T12:00:00Z',
      });
    } else if (url.endsWith('/check-runs/456') && method === 'PATCH') {
      const payload = JSON.parse(init.body);

      assert.equal(payload.status, 'completed');
      assert.ok(['success', 'failure'].includes(payload.conclusion));

      status = currentPatchStatus;
      if (status === 200) {
        data = {
          id: 456,
          name: 'PR Governance',
          head_sha: headSha,
          status: 'completed',
          conclusion: payload.conclusion,
          external_id: payload.external_id,
          output: payload.output,
        };
        governanceChecks[0] = {
          ...governanceChecks[0],
          status: 'completed',
          conclusion: payload.conclusion,
          external_id: payload.external_id,
          output: payload.output,
        };
      } else {
        data = { message: 'private response content' };
      }
    } else {
      throw new Error(`Unexpected GitHub request: ${method} ${url}`);
    }

    const expectedToken =
      url.includes('/check-runs') ||
      (url.endsWith('/pulls/42') && authorization === 'Bearer publisher-token')
        ? authorization
        : url.includes('/pulls/42') || url.includes('/issues/42/comments')
          ? 'Bearer pr-token'
          : 'Bearer governance-token';

    assert.equal(authorization, expectedToken);

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
    };
  };

  return {
    fetchImpl,
    calls,
    setReviews(nextReviews) {
      reviews = nextReviews;
    },
    setOwners(nextOwners) {
      owners = nextOwners;
    },
    setTeamWritable(nextWritable) {
      teamWritable = nextWritable;
    },
    setTeamVisible(nextVisible) {
      teamVisible = nextVisible;
    },
    setArchitectActive(nextActive) {
      architectActive = nextActive;
    },
    setMembershipError(status) {
      membershipErrorStatus = status;
    },
    setPatchStatus(status) {
      currentPatchStatus = status;
    },
    setValidateHttpStatus(status) {
      validateHttpStatus = status;
    },
    setCurrentHeadSha(sha) {
      pullRequest.head.sha = sha;
    },
    setPullRequestState(state) {
      pullRequest.state = state;
    },
    getGovernanceChecks() {
      return structuredClone(governanceChecks);
    },
  };
}

test('ordinary governance completes the same check with success', async () => {
  const mock = successfulFixture();

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'PASS');
  assert.equal(result.checkId, 456);
  assert.equal(result.headSha, headSha);
  assert.equal(result.conclusion, 'success');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('critical governance with one approval completes as failure', async () => {
  const mock = successfulFixture({
    paths: ['.github/workflows/ci.yml'],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.classification, 'CRITICAL');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.decision.requiredCount, 2);
  assert.equal(result.checkId, 456);
  assert.equal(result.conclusion, 'failure');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('critical approval progress publishes 0/2, 1/2, then 2/2', async () => {
  const mock = successfulFixture({
    paths: ['.github/workflows/governance.yml'],
    reviewEvents: [],
  });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  assert.equal(first.classification, 'CRITICAL');
  assert.equal(first.decision.status, 'BLOCKED');

  mock.setReviews([
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'First approval',
    },
  ]);
  const second = await reconcile();
  assert.equal(second.classification, 'CRITICAL');
  assert.equal(second.decision.status, 'BLOCKED');

  mock.setReviews([
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'First approval',
    },
    {
      user: { login: 'architect-two' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:01:00Z',
      body: 'Second approval',
    },
  ]);
  const third = await reconcile();

  const summaries = mock.calls
    .filter(({ method, url }) => method === 'PATCH' && url.endsWith('/check-runs/456'))
    .map(({ body }) => body.output.summary);
  assert.equal(summaries.length, 3);
  assert.match(summaries[0], /Qualified approvals: 0 \/ 2/);
  assert.match(summaries[1], /Qualified approvals: 1 \/ 2/);
  assert.match(summaries[2], /Qualified approvals: 2 \/ 2/);
  assert.equal(third.decision.status, 'PASS');
});

test('publishes an approval block immediately and passes after a later approval', async () => {
  const mock = successfulFixture({ reviewEvents: [] });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      waitForApprovalReadiness: true,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const blocked = await reconcile();

  assert.equal(blocked.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(blocked.classification, 'ORDINARY');
  assert.equal(blocked.decision.status, 'BLOCKED');
  assert.equal(blocked.conclusion, 'failure');
  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);

  const blockedPayload = mock.calls.find(({ method }) => method === 'PATCH').body;
  assert.equal(blockedPayload.output.title, 'PR Governance blocked');
  assert.match(blockedPayload.output.summary, /Qualified approvals: 0 \/ 1/);
  assert.match(
    blockedPayload.output.summary,
    /The qualified approval threshold has not been met\./,
  );

  mock.setReviews([
    {
      user: { login: 'architect' },
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-10-29T00:00:00Z',
      body: 'Approved after initial block',
    },
  ]);

  const passed = await reconcile();

  assert.equal(passed.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(passed.classification, 'ORDINARY');
  assert.equal(passed.decision.status, 'PASS');
  assert.equal(passed.conclusion, 'success');
  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 2);
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 2);

  const completedPayloads = mock.calls
    .filter(({ method }) => method === 'PATCH')
    .map(({ body }) => body);
  assert.deepEqual(
    completedPayloads.map(({ conclusion }) => conclusion),
    ['failure', 'success'],
  );
});

test('reuses an identical current BLOCKED check after a complete fresh evaluation', async () => {
  const mock = successfulFixture({ reviewEvents: [] });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  const repeated = await reconcile();

  assert.equal(first.decision.status, 'BLOCKED');
  assert.equal(first.conclusion, 'failure');
  assert.equal(repeated.mode, 'ALREADY_CURRENT');
  assert.equal(repeated.conclusion, 'failure');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    1,
  );
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('reuses an identical current PASS check after a complete fresh evaluation', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  const repeated = await reconcile();

  assert.equal(first.decision.status, 'PASS');
  assert.equal(first.conclusion, 'success');
  assert.equal(repeated.mode, 'ALREADY_CURRENT');
  assert.equal(repeated.conclusion, 'success');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    1,
  );
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('performs only one complete evaluation after starting a new check', async () => {
  const mock = successfulFixture();

  const result = await runPrGovernance({
    ...options,
    deduplicateCurrentChecks: true,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.decision.status, 'PASS');
  const checkStartIndex = mock.calls.findIndex(
    ({ method, url }) => method === 'POST' && url.endsWith('/check-runs'),
  );
  const callsAfterStart = mock.calls.slice(checkStartIndex + 1);
  assert.equal(
    callsAfterStart.filter(
      ({ method, url, authorization }) =>
        method === 'GET' && url.endsWith('/pulls/42') && authorization === 'Bearer pr-token',
    ).length,
    6,
  );
});

test('publishes a new BLOCKED check when same-HEAD authority evidence changes', async () => {
  const mock = successfulFixture({
    paths: ['.github/workflows/governance.yml'],
    reviewEvents: [
      {
        user: { login: 'architect' },
        state: 'APPROVED',
        commit_id: headSha,
        submitted_at: '2026-10-29T00:00:00Z',
        body: 'Approved',
      },
    ],
  });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  mock.setArchitectActive(false);
  const changed = await reconcile();

  assert.equal(first.decision.status, 'BLOCKED');
  assert.equal(changed.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(changed.decision.status, 'BLOCKED');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 2);
});

test('publishes a new check when the same decision has a different CODEOWNERS source', async () => {
  const mock = successfulFixture({ reviewEvents: [] });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  mock.setOwners('* @EQ-LABS-TECH/ee-labs-architecture\n# source revision');
  const changed = await reconcile();

  assert.equal(first.decision.status, 'BLOCKED');
  assert.equal(changed.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(changed.decision.status, 'BLOCKED');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
});

test('changes a same-HEAD PASS to BLOCKED when reviewer authority is revoked', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const passed = await reconcile();
  mock.setArchitectActive(false);
  const blocked = await reconcile();

  assert.equal(passed.headSha, blocked.headSha);
  assert.equal(passed.decision.status, 'PASS');
  assert.equal(blocked.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(blocked.decision.status, 'BLOCKED');
  assert.equal(blocked.conclusion, 'failure');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 2);
});

test('publishes a failure for a new evidence error after a same-HEAD PASS', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const passed = await reconcile();
  mock.setMembershipError(403);

  await assert.rejects(reconcile(), /HTTP 403/);

  assert.equal(passed.decision.status, 'PASS');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
  const patches = mock.calls.filter(({ method }) => method === 'PATCH');
  assert.equal(patches.length, 2);
  assert.equal(patches[1].body.conclusion, 'failure');
  assert.equal(patches[1].body.output.title, 'PR Governance evaluation failed');
});

test('keeps evaluation and failure-publication errors distinct after a same-HEAD PASS', async () => {
  const mock = successfulFixture();
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  await reconcile();
  mock.setMembershipError(403);
  mock.setPatchStatus(403);

  await assert.rejects(reconcile(), (error) => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.governanceDiagnostic.code, 'failure-publication-failed');
    assert.equal(error.governanceDiagnostic.phase, 'evaluation-failure-publication');
    assert.match(error.errors[0].message, /HTTP 403/);
    assert.match(error.errors[1].message, /check completion returned HTTP 403/);
    return true;
  });
});

test('does not reuse a check when authority changes during deduplication confirmation', async () => {
  const mock = successfulFixture({
    deactivateArchitectAfterCheckLookup: true,
  });
  const reconcile = () =>
    runPrGovernance({
      ...options,
      deduplicateCurrentChecks: true,
      fetchImpl: mock.fetchImpl,
    });

  const first = await reconcile();
  const changedDuringConfirmation = await reconcile();

  assert.equal(first.decision.status, 'PASS');
  assert.equal(changedDuringConfirmation.mode, 'EVALUATION_AND_PUBLICATION');
  assert.equal(changedDuringConfirmation.decision.status, 'BLOCKED');
  assert.equal(changedDuringConfirmation.conclusion, 'failure');
  assert.equal(
    mock.calls.filter(({ method, url }) => method === 'POST' && url.endsWith('/check-runs')).length,
    2,
  );
  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 2);
});

test('missing trusted App identity prevents all API calls', async () => {
  let calls = 0;

  await assert.rejects(
    runPrGovernance({
      ...options,
      expectedAppId: undefined,
      fetchImpl: async () => {
        calls += 1;
        throw new Error('Unexpected API call');
      },
    }),
    /Invalid PR governance execution configuration/,
  );

  assert.equal(calls, 0);
});

test('approval removal blocks governance without changing HEAD', async () => {
  const mock = successfulFixture({
    reviewEvents: [],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.headSha, headSha);
  assert.equal(result.classification, 'ORDINARY');
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.conclusion, 'failure');

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  assert.equal(mock.calls.filter(({ method }) => method === 'PATCH').length, 1);
});

test('dismissed approval blocks governance on unchanged HEAD', async () => {
  const mock = successfulFixture({
    reviewEvents: [
      {
        user: { login: 'architect' },
        state: 'DISMISSED',
        commit_id: headSha,
        submitted_at: '2026-10-29T00:00:00Z',
        body: '',
      },
    ],
  });

  const result = await runPrGovernance({
    ...options,
    fetchImpl: mock.fetchImpl,
  });

  assert.equal(result.headSha, headSha);
  assert.equal(result.decision.status, 'BLOCKED');
  assert.equal(result.conclusion, 'failure');
});

test('revoked approval during execution prevents success publication', async () => {
  const mock = successfulFixture({
    revokeAfterFirstEvaluation: true,
  });

  await assert.rejects(
    runPrGovernance({
      ...options,
      fetchImpl: mock.fetchImpl,
    }),
    /PR governance evidence changed during evaluation/,
  );

  assert.equal(mock.calls.filter(({ method }) => method === 'POST').length, 1);

  const patches = mock.calls.filter(({ method }) => method === 'PATCH');

  assert.equal(patches.length, 1);
  assert.equal(patches[0].url.endsWith('/check-runs/456'), true);
});
