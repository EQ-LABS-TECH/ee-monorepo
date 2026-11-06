import { URLSearchParams } from 'node:url';

import { createGitHubHttpError } from './pr-governance.github-error.mjs';
import { readValidateReadiness } from './pr-governance.ci.mjs';

const OWNER = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;
const REPO = /^[a-z\d_.-]+$/i;
const MAX_RUN_PAGES = 100;
const RUNS_PER_PAGE = 100;

function isPullRequestRun(run, number) {
  return Array.isArray(run.pull_requests) && run.pull_requests.some((pr) => pr?.number === number);
}

function validateRunList(result) {
  if (
    !result ||
    !Number.isSafeInteger(result.total_count) ||
    !Array.isArray(result.workflow_runs) ||
    result.workflow_runs.length > RUNS_PER_PAGE
  ) {
    throw new TypeError('Malformed governance workflow run list');
  }

  for (const run of result.workflow_runs) {
    if (
      !run ||
      !Number.isSafeInteger(run.id) ||
      run.id < 1 ||
      !Number.isSafeInteger(run.run_number) ||
      run.run_number < 1 ||
      typeof run.event !== 'string' ||
      !Array.isArray(run.pull_requests) ||
      !['queued', 'in_progress', 'completed'].includes(run.status)
    ) {
      throw new TypeError('Malformed governance workflow run');
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

export function governanceDispatchTitle({ number, headSha, reviewRunNumber }) {
  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    typeof headSha !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(headSha) ||
    !Number.isSafeInteger(reviewRunNumber) ||
    reviewRunNumber < 1
  ) {
    throw new TypeError('Invalid governance dispatch identity');
  }

  return `PN-017 PR-${number} SHA-${headSha.toLowerCase()} REVIEW-${reviewRunNumber}`;
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
    const runs = validateRunList(
      await getJson({
        url: `${url}?${query}`,
        token,
        fetchImpl,
        operation: 'Governance review event lookup',
      }),
    );

    const samePrRuns = runs.filter(
      (run) => run.event === 'pull_request_review' && isPullRequestRun(run, number),
    );
    const newerRun = samePrRuns.find((run) => run.run_number > currentRunNumber);
    if (newerRun) {
      return { status: 'SUPERSEDED', newerRunId: newerRun.id, newerRunNumber: newerRun.run_number };
    }

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
  const exactTitle = governanceDispatchTitle({ number, headSha, reviewRunNumber });
  const samePrHeadPrefix = `PN-017 PR-${number} SHA-${headSha.toLowerCase()} REVIEW-`;

  for (let page = 1; page <= MAX_RUN_PAGES; page += 1) {
    const query = new URLSearchParams({
      event: 'workflow_dispatch',
      per_page: String(RUNS_PER_PAGE),
      page: String(page),
      sort: 'created',
      direction: 'desc',
    });
    const runs = validateRunList(
      await getJson({
        url: `${url}?${query}`,
        token,
        fetchImpl,
        operation: 'Governance dispatch deduplication lookup',
      }),
    );

    for (const run of runs) {
      if (run.event !== 'workflow_dispatch') continue;
      if (run.display_title === exactTitle) return { exact: true, active: false };
      if (
        typeof run.display_title === 'string' &&
        run.display_title.startsWith(samePrHeadPrefix) &&
        run.status !== 'completed'
      ) {
        return { exact: false, active: true };
      }
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
    throw new TypeError('Invalid governance review relay context');
  }

  let order = await reviewRunOrder({
    owner,
    repo,
    number,
    currentRunId,
    currentRunNumber,
    token,
    fetchImpl,
  });
  if (order.status === 'SUPERSEDED') return order;

  const repositoryUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const readPr = () =>
    getJson({
      url: `${repositoryUrl}/pulls/${number}`,
      token,
      fetchImpl,
      operation: 'Governance relay PR lookup',
    });

  let pr = await readPr();
  if (!ensurePrMatches(pr, { owner, repo, number, expectedHeadSha })) {
    return { status: 'SUPERSEDED' };
  }

  let validation = await readValidateReadiness({
    owner,
    repo,
    headSha: expectedHeadSha,
    token,
    fetchImpl,
  });
  if (validation.status !== 'READY') {
    return { status: 'WAITING_FOR_CI', validationCheckRunId: validation.checkRunId };
  }

  const title = governanceDispatchTitle({
    number,
    headSha: expectedHeadSha,
    reviewRunNumber: currentRunNumber,
  });
  const dispatchState = await dispatchedForReview({
    owner,
    repo,
    number,
    headSha: expectedHeadSha,
    reviewRunNumber: currentRunNumber,
    token,
    fetchImpl,
  });
  if (dispatchState.exact || dispatchState.active) {
    return { status: 'ALREADY_CURRENT' };
  }

  // Re-read event order and readiness immediately before dispatch. This is
  // idempotent coordination, not a timing window; GitHub still creates one
  // relay run for each webhook delivery.
  order = await reviewRunOrder({
    owner,
    repo,
    number,
    currentRunId,
    currentRunNumber,
    token,
    fetchImpl,
  });
  if (order.status === 'SUPERSEDED') return order;

  pr = await readPr();
  if (!ensurePrMatches(pr, { owner, repo, number, expectedHeadSha })) {
    return { status: 'SUPERSEDED' };
  }

  validation = await readValidateReadiness({
    owner,
    repo,
    headSha: expectedHeadSha,
    token,
    fetchImpl,
  });
  if (validation.status !== 'READY') {
    return { status: 'WAITING_FOR_CI', validationCheckRunId: validation.checkRunId };
  }

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

  return { status: 'DISPATCHED', dispatchTitle: title };
}
