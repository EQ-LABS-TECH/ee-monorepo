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
      currentRunId: 101,
      currentRunNumber: 165,
      token: 'test-token',
      fetchImpl,
    },
  };
}

test('uses an explicit review run identity for workflow dispatch names', () => {
  assert.equal(
    governanceDispatchTitle({ number, headSha, reviewRunNumber: 165 }),
    `PN-017 PR-${number} SHA-${headSha} REVIEW-165`,
  );
});

test('supersedes a dismissed relay when a newer review event exists for the same PR', async () => {
  const setup = fixture({
    reviewPages: [[run({ id: 102, runNumber: 166 }), run({ id: 101, runNumber: 165 })]],
  });

  const result = await runGovernanceReviewRelay(setup.context);

  assert.deepEqual(result, {
    status: 'SUPERSEDED',
    newerRunId: 102,
    newerRunNumber: 166,
  });
  assert.equal(setup.requests.length, 1);
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
  const title = governanceDispatchTitle({ number, headSha, reviewRunNumber: 165 });
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

test('reuses a pending protected dispatch for the same PR and HEAD', async () => {
  const setup = fixture({
    dispatchRuns: [
      {
        id: 202,
        run_number: 32,
        event: 'workflow_dispatch',
        status: 'queued',
        display_title: `PN-017 PR-${number} SHA-${headSha} REVIEW-164`,
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

test('reports dispatch failures instead of treating them as completed', async () => {
  const setup = fixture({ dispatchStatus: 503 });

  await assert.rejects(runGovernanceReviewRelay(setup.context), /HTTP 503/);
});
