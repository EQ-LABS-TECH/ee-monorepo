import { URLSearchParams } from 'node:url';

import { createGitHubHttpError } from './pr-governance.github-error.mjs';
import { readValidateReadiness } from './pr-governance.ci.mjs';

const OWNER = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;
const REPO = /^[a-z\d_.-]+$/i;
const MAX_RUN_PAGES = 100;
const RUNS_PER_PAGE = 100;
const RUN_STATUSES = new Set([
  'queued',
  'in_progress',
  'completed',
  'requested',
  'waiting',
  'pending',
]);
const LEGACY_DISPATCH_TITLE = /^[A-Z][A-Z\d]*-\d+ PR-(\d+) SHA-([0-9a-f]{40}) REVIEW-(\d+)$/i;

async function withPhase(phase, operation) {
  try {
    return await operation();
  } catch (error) {
    const diagnostic = error instanceof Error ? error : new Error('Unknown relay operation error');
    const hasHttpStatus = /\bHTTP [1-5]\d{2}\b/.test(diagnostic.message);
    diagnostic.phase ??= phase;
    diagnostic.code ??= hasHttpStatus
      ? 'github-http-error'
      : diagnostic instanceof TypeError
        ? 'invalid-github-response'
        : 'unexpected-operation-error';
    throw diagnostic;
  }
}

function isPullRequestRun(run, number) {
  return Array.isArray(run.pull_requests) && run.pull_requests.some((pr) => pr?.number === number);
}

function validateRunList(result, { event, phase }) {
  if (
    !result ||
    !Number.isSafeInteger(result.total_count) ||
    !Array.isArray(result.workflow_runs) ||
    result.workflow_runs.length > RUNS_PER_PAGE
  ) {
    const error = new TypeError('Malformed governance workflow run list');
    error.code = 'malformed-run-list';
    error.phase = phase;
    throw error;
  }

  for (const run of result.workflow_runs) {
    if (
      !run ||
      !Number.isSafeInteger(run.id) ||
      run.id < 1 ||
      !Number.isSafeInteger(run.run_number) ||
      run.run_number < 1 ||
      typeof run.event !== 'string' ||
      run.event !== event ||
      !RUN_STATUSES.has(run.status) ||
      (event === 'pull_request_review' && !Array.isArray(run.pull_requests)) ||
      (event === 'workflow_dispatch' && typeof run.display_title !== 'string')
    ) {
      const error = new TypeError('Malformed governance workflow run');
      error.code = 'malformed-run';
      error.phase = phase;
      throw error;
    }
  }

  return result.workflow_runs;
}

async function getJson({ url, token, fetchImpl, operation }) {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok || response.status !== 200) {
    throw createGitHubHttpError(response, operation);
  }

  return response.json();
}

export function governanceDispatchTitle({ number, reviewRunNumber }) {
  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !Number.isSafeInteger(reviewRunNumber) ||
    reviewRunNumber < 1
  ) {
    throw new TypeError('Invalid governance dispatch identity');
  }

  return `GV PR #${number} · R${reviewRunNumber}`;
}

function isLegacyDispatchForReview(title, { number, headSha, reviewRunNumber }) {
  if (typeof title !== 'string') return false;
  const match = LEGACY_DISPATCH_TITLE.exec(title);
  return (
    match !== null &&
    Number(match[1]) === number &&
    match[2].toLowerCase() === headSha.toLowerCase() &&
    Number(match[3]) === reviewRunNumber
  );
}

async function reviewRunOrder({
  owner,
  repo,
  number,
  currentRunId,
  currentRunNumber,
  token,
  fetchImpl,
}) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/governance.yml/runs`;

  for (let page = 1; page <= MAX_RUN_PAGES; page += 1) {
    const query = new URLSearchParams({
      event: 'pull_request_review',
      per_page: String(RUNS_PER_PAGE),
      page: String(page),
      sort: 'created',
      direction: 'desc',
    });
    const result = await withPhase('review-run-lookup', () =>
      getJson({
        url: `${url}?${query}`,
        token,
        fetchImpl,
        operation: 'Governance review event lookup',
      }),
    );
    const runs = validateRunList(result, {
      event: 'pull_request_review',
      phase: 'review-run-lookup',
    });

    const samePrRuns = runs.filter(
      (run) => run.event === 'pull_request_review' && isPullRequestRun(run, number),
    );
    if (samePrRuns.some((run) => run.id === currentRunId && run.run_number === currentRunNumber)) {
      return { status: 'CURRENT' };
    }

    if (runs.length < RUNS_PER_PAGE) break;
  }

  throw new Error('Current governance review run was not found in paginated history');
}

async function dispatchedForReview({
  owner,
  repo,
  number,
  headSha,
  reviewRunNumber,
  token,
  fetchImpl,
}) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/governance.yml/runs`;
  const exactTitle = governanceDispatchTitle({ number, reviewRunNumber });

  for (let page = 1; page <= MAX_RUN_PAGES; page += 1) {
    const query = new URLSearchParams({
      event: 'workflow_dispatch',
      per_page: String(RUNS_PER_PAGE),
      page: String(page),
      sort: 'created',
      direction: 'desc',
    });
    const result = await withPhase('dispatch-lookup', () =>
      getJson({
        url: `${url}?${query}`,
        token,
        fetchImpl,
        operation: 'Governance dispatch deduplication lookup',
      }),
    );
    const runs = validateRunList(result, { event: 'workflow_dispatch', phase: 'dispatch-lookup' });

    for (const run of runs) {
      if (run.event !== 'workflow_dispatch') continue;
      if (
        run.display_title === exactTitle ||
        isLegacyDispatchForReview(run.display_title, { number, headSha, reviewRunNumber })
      )
        return { exact: true };
    }

    if (runs.length < RUNS_PER_PAGE) return { exact: false, active: false };
  }

  throw new Error('Governance dispatch lookup exceeded supported pagination');
}

function ensurePrMatches(pr, { owner, repo, number, expectedHeadSha }) {
  if (
    pr?.number !== number ||
    pr?.state !== 'open' ||
    pr?.base?.ref !== 'main' ||
    pr?.base?.repo?.full_name?.toLowerCase() !== `${owner}/${repo}`.toLowerCase()
  ) {
    return false;
  }

  return pr?.head?.sha?.toLowerCase() === expectedHeadSha.toLowerCase();
}

export async function runGovernanceReviewRelay({
  owner,
  repo,
  number,
  expectedHeadSha,
  currentRunId,
  currentRunNumber,
  token,
  fetchImpl = fetch,
}) {
  if (
    !OWNER.test(owner ?? '') ||
    !REPO.test(repo ?? '') ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    typeof expectedHeadSha !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(expectedHeadSha) ||
    !Number.isSafeInteger(currentRunId) ||
    currentRunId < 1 ||
    !Number.isSafeInteger(currentRunNumber) ||
    currentRunNumber < 1 ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    const error = new TypeError('Invalid governance review relay context');
    error.phase = 'relay-context';
    error.code = 'invalid-relay-context';
    throw error;
  }

  await withPhase('review-run-lookup', () =>
    reviewRunOrder({
      owner,
      repo,
      number,
      currentRunId,
      currentRunNumber,
      token,
      fetchImpl,
    }),
  );

  const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const readPr = () =>
    getJson({
      url: `${repositoryUrl}/pulls/${number}`,
      token,
      fetchImpl,
      operation: 'Governance relay PR lookup',
    });

  let pr = await withPhase('pull-request-lookup', readPr);
  if (!ensurePrMatches(pr, { owner, repo, number, expectedHeadSha })) {
    return { status: 'SUPERSEDED' };
  }

  let validation = await withPhase('validate-readiness', () =>
    readValidateReadiness({
      owner,
      repo,
      headSha: expectedHeadSha,
      token,
      fetchImpl,
    }),
  );
  if (validation.status !== 'READY') {
    return { status: 'WAITING_FOR_CI', validationCheckRunId: validation.checkRunId };
  }

  const title = governanceDispatchTitle({
    number,
    reviewRunNumber: currentRunNumber,
  });
  const dispatchState = await withPhase('dispatch-lookup', () =>
    dispatchedForReview({
      owner,
      repo,
      number,
      headSha: expectedHeadSha,
      reviewRunNumber: currentRunNumber,
      token,
      fetchImpl,
    }),
  );
  if (dispatchState.exact) {
    return { status: 'ALREADY_CURRENT' };
  }

  // Confirm this event is still represented and re-read readiness before
  // dispatch. Newer review events do not suppress this event's reconciliation;
  // protected main serializes publication and evaluates current evidence.
  await withPhase('review-run-lookup', () =>
    reviewRunOrder({
      owner,
      repo,
      number,
      currentRunId,
      currentRunNumber,
      token,
      fetchImpl,
    }),
  );
  pr = await withPhase('pull-request-lookup', readPr);
  if (!ensurePrMatches(pr, { owner, repo, number, expectedHeadSha })) {
    return { status: 'SUPERSEDED' };
  }

  validation = await withPhase('validate-readiness', () =>
    readValidateReadiness({
      owner,
      repo,
      headSha: expectedHeadSha,
      token,
      fetchImpl,
    }),
  );
  if (validation.status !== 'READY') {
    return { status: 'WAITING_FOR_CI', validationCheckRunId: validation.checkRunId };
  }

  await withPhase('dispatch-create', async () => {
    const dispatchResponse = await fetchImpl(
      `${repositoryUrl}/actions/workflows/governance.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            pr_number: String(number),
            head_sha: expectedHeadSha.toLowerCase(),
            review_run_number: String(currentRunNumber),
          },
        }),
      },
    );

    if (!dispatchResponse.ok || dispatchResponse.status !== 204) {
      throw createGitHubHttpError(dispatchResponse, 'Governance workflow dispatch');
    }
  });

  return { status: 'DISPATCHED', dispatchTitle: title };
}
