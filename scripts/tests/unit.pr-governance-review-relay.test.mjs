import test from 'node:test';
import assert from 'node:assert/strict';

import {
  governanceDispatchTitle,
  runGovernanceReviewRelay,
} from '../lib/pr-governance.review-relay.mjs';

const owner = 'EQ-LABS-TECH';
const repo = 'ee-monorepo';
const number = 52;
const headSha = 'a'.repeat(40);

function apiResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function run({ id, runNumber, prNumber = number, event = 'pull_request_review' }) {
  return {
    id,
    run_number: runNumber,
    event,
    status: 'completed',
    display_title: event === 'workflow_dispatch' ? '' : 'Governance review relay',
    pull_requests: prNumber === null ? [] : [{ number: prNumber }],
  };
}

function fixture({
  reviewPages = [[run({ id: 101, runNumber: 165 })]],
  dispatchRuns = [],
  validateReady = true,
  currentHeadSha = headSha,
  dispatchStatus = 204,
  currentRunId = 101,
  currentRunNumber = 165,
} = {}) {
  const requests = [];
  const fetchImpl = async (urlValue, init = {}) => {
    const url = new URL(urlValue);
    requests.push({ url: url.toString(), method: init.method ?? 'GET', body: init.body });

    if (url.pathname.endsWith('/actions/workflows/governance.yml/runs')) {
      const page = Number(url.searchParams.get('page')) - 1;
      const runs =
        url.searchParams.get('event') === 'pull_request_review'
          ? (reviewPages[page] ?? [])
          : dispatchRuns;
      return apiResponse({ total_count: runs.length, workflow_runs: runs });
    }

    if (url.pathname === `/repos/${owner}/${repo}/pulls/${number}`) {
      return apiResponse({
        number,
        state: 'open',
        user: { login: 'pr-author' },
        base: { ref: 'main', repo: { full_name: `${owner}/${repo}` } },
        head: { sha: currentHeadSha },
      });
    }

    if (url.pathname.endsWith(`/commits/${headSha}/check-runs`)) {
      return apiResponse({
        total_count: 1,
        check_runs: validateReady
          ? [
              {
                id: 800,
                name: 'Validate',
                app: { id: 15368 },
                status: 'completed',
                conclusion: 'success',
                created_at: '2026-11-06T17:00:00Z',
                started_at: '2026-11-06T17:00:00Z',
              },
            ]
          : [],
      });
    }

    if (url.pathname.endsWith('/actions/workflows/governance.yml/dispatches')) {
      return apiResponse(null, dispatchStatus);
    }

    throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`);
  };

  return {
    requests,
    fetchImpl,
    context: {
      owner,
      repo,
      number,
      expectedHeadSha: headSha,
      currentRunId,
      currentRunNumber,
      token: 'test-token',
      fetchImpl,
    },
  };
}

test('uses an explicit review run identity for workflow dispatch names', () => {
  assert.equal(
    governanceDispatchTitle({ number, reviewRunNumber: 165 }),
    `GV PR #${number} · R165`,
  );
});

test('dispatches each review event even when a newer event for the same PR exists', async () => {
  const setup = fixture({
    reviewPages: [[run({ id: 102, runNumber: 166 }), run({ id: 101, runNumber: 165 })]],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.deepEqual(
    JSON.parse(setup.requests.find((request) => request.method === 'POST').body).inputs,
    { pr_number: String(number), head_sha: headSha, review_run_number: '165' },
  );
});

test('paginates review runs and ignores newer events from other PRs', async () => {
  const unrelatedRuns = Array.from({ length: 100 }, (_, index) =>
    run({ id: 900 + index, runNumber: 300 - index, prNumber: 88 }),
  );
  const setup = fixture({
    reviewPages: [unrelatedRuns, [run({ id: 101, runNumber: 165 })]],
    validateReady: false,
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'WAITING_FOR_CI');
  assert.equal(
    setup.requests.filter((request) => request.url.includes('event=pull_request_review')).length,
    2,
  );
});

test('waits for Validate instead of dispatching governance early', async () => {
  const setup = fixture({ validateReady: false });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'WAITING_FOR_CI');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    false,
  );
});

test('dispatches once after CI success and sends the review run number', async () => {
  const setup = fixture();

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  const dispatch = setup.requests.find((request) => request.method === 'POST');
  assert.deepEqual(JSON.parse(dispatch.body), {
    ref: 'main',
    inputs: {
      pr_number: String(number),
      head_sha: headSha,
      review_run_number: '165',
    },
  });
});

test('dispatches a trusted reevaluation after the first approval even below the threshold', async () => {
  const setup = fixture();

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    true,
  );
});

test('reevaluates every distinct review event so Governance can publish the latest qualified count', async () => {
  const setup = fixture({
    reviewPages: [[run({ id: 102, runNumber: 166 })]],
    currentRunId: 102,
    currentRunNumber: 166,
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.deepEqual(
    JSON.parse(setup.requests.find((request) => request.method === 'POST').body).inputs,
    { pr_number: String(number), head_sha: headSha, review_run_number: '166' },
  );
});
test('does not dispatch when the PR HEAD changed after the review event', async () => {
  const setup = fixture({ currentHeadSha: 'b'.repeat(40) });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'SUPERSEDED');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    false,
  );
});

test('does not dispatch the same review event twice', async () => {
  const title = governanceDispatchTitle({ number, reviewRunNumber: 165 });
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'completed',
        display_title: title,
        pull_requests: [],
      },
    ],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'ALREADY_CURRENT');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    false,
  );
});

test('does not reuse a pending dispatch from a different review event', async () => {
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'queued',
        display_title: `GV PR #${number} · R164`,
      },
    ],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    true,
  );
});

test('handles a newer relay while the previous review dispatch is still waiting', async () => {
  const setup = fixture({
    currentRunId: 190,
    currentRunNumber: 190,
    reviewPages: [[run({ id: 190, runNumber: 190 }), run({ id: 189, runNumber: 189 })]],
    dispatchRuns: [
      {
        id: 191,
        run_number: 191,
        event: 'workflow_dispatch',
        status: 'waiting',
        display_title: `GV PR #${number} · R189`,
      },
    ],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    true,
  );
});

test('accepts transient dispatch states without requiring pull request run fields', async (t) => {
  for (const status of ['requested', 'waiting', 'pending']) {
    await t.test(status, async () => {
      const setup = fixture({
        dispatchRuns: [
          {
            id: 202,
            run_number: 32,
            event: 'workflow_dispatch',
            status,
            display_title: `GV PR #${number} · R164`,
          },
        ],
      });

      const result = await runGovernanceReviewRelay(setup.context);

      assert.equal(result.status, 'DISPATCHED');
      assert.equal(
        setup.requests.some((request) => request.method === 'POST'),
        true,
      );
    });
  }
});

test('deduplicates a legacy title only for the same PR, HEAD and review run', async () => {
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'waiting',
        display_title: `OPS-123 PR-${number} SHA-${headSha} REVIEW-165`,
      },
    ],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'ALREADY_CURRENT');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    false,
  );
});

test('does not deduplicate a legacy run when the PR HEAD differs', async () => {
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'in_progress',
        display_title: `OPS-123 PR-${number} SHA-${'b'.repeat(40)} REVIEW-165`,
      },
    ],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.equal(result.status, 'DISPATCHED');
  assert.equal(
    setup.requests.some((request) => request.method === 'POST'),
    true,
  );
});

test('reports the dispatch lookup phase for malformed run evidence', async () => {
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'invalid',
        display_title: `GV PR #${number} · R164`,
      },
    ],
  });

  await assert.rejects(runGovernanceReviewRelay(setup.context), (error) => {
    assert.equal(error.phase, 'dispatch-lookup');
    assert.equal(error.code, 'malformed-run');
    return true;
  });
});

test('reports dispatch failures instead of treating them as completed', async () => {
  const setup = fixture({ dispatchStatus: 503 });

  await assert.rejects(runGovernanceReviewRelay(setup.context), (error) => {
    assert.match(error.message, /HTTP 503/);
    assert.equal(error.phase, 'dispatch-create');
    assert.equal(error.code, 'github-http-error');
    return true;
  });
});
