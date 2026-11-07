import { URLSearchParams } from 'node:url';

import { createGitHubHttpError } from './pr-governance.github-error.mjs';
import { readValidateReadiness } from './pr-governance.ci.mjs';

const OWNER = /^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i;
const REPO = /^[a-z\d_.-]+$/i;
const MAX_RUN_PAGES = 100;
const RUNS_PER_PAGE = 100;
const MAX_REVIEW_PAGES = 100;
const PR_GOVERNANCE_CHECK = 'PR Governance';
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

function validateGovernanceCheckList(result, expectedAppId, headSha) {
  if (
    !result ||
    !Number.isSafeInteger(result.total_count) ||
    !Array.isArray(result.check_runs) ||
    result.check_runs.length > RUNS_PER_PAGE
  ) {
    throw new TypeError('Malformed PR Governance check list');
  }

  for (const check of result.check_runs) {
    const validTimestamp = (value) =>
      value === null || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
    if (
      !check ||
      check.name !== PR_GOVERNANCE_CHECK ||
      !Number.isSafeInteger(check.id) ||
      check.id < 1 ||
      !check.app ||
      !Number.isSafeInteger(check.app.id) ||
      !['queued', 'in_progress', 'completed'].includes(check.status) ||
      (check.conclusion !== null &&
        check.conclusion !== undefined &&
        typeof check.conclusion !== 'string') ||
      !validTimestamp(check.started_at) ||
      !validTimestamp(check.completed_at) ||
      (check.status === 'completed' && typeof check.completed_at !== 'string') ||
      (check.status !== 'completed' && check.completed_at !== null) ||
      (check.status === 'completed' &&
        (!check.output ||
          typeof check.output.title !== 'string' ||
          typeof check.output.summary !== 'string'))
    ) {
      throw new TypeError('Malformed PR Governance check run');
    }
  }

  const candidates = result.check_runs.filter(
    (check) =>
      check.app.id === expectedAppId && check.head_sha?.toLowerCase() === headSha.toLowerCase(),
  );
  if (!candidates.length) return null;

  // An active check may still publish a newer decision; never reuse a completed
  // BLOCKED result while that outcome is unresolved or its relative age is unclear.
  if (candidates.some((check) => check.status !== 'completed')) return null;

  const sorted = [...candidates].sort(
    (left, right) => Date.parse(right.completed_at) - Date.parse(left.completed_at),
  );
  if (
    sorted.length > 1 &&
    Date.parse(sorted[0].completed_at) === Date.parse(sorted[1].completed_at)
  ) {
    return null;
  }
  return sorted[0];
}

async function currentGovernanceDecision({ owner, repo, headSha, appId, token, fetchImpl }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs`;
  const query = new URLSearchParams({
    check_name: PR_GOVERNANCE_CHECK,
    app_id: String(appId),
    filter: 'latest',
    per_page: '100',
  });
  const checks = await getJson({
    url: `${url}?${query}`,
    token,
    fetchImpl,
    operation: 'PR Governance check lookup',
  });
  const latest = validateGovernanceCheckList(checks, appId, headSha);
  if (
    !latest ||
    latest.status !== 'completed' ||
    latest.conclusion !== 'failure' ||
    latest.output.title !== 'PR Governance blocked'
  ) {
    return null;
  }

  const classification = /^Classification: (CRITICAL|ORDINARY|PENDING_REVIEW)$/m.exec(
    latest.output.summary,
  )?.[1];
  const decision = /^Decision: (PASS|BLOCKED)$/m.exec(latest.output.summary)?.[1];
  const approvals = /^Qualified approvals: (\d+) \/ (\d+)$/m.exec(latest.output.summary);
  if (!classification || decision !== 'BLOCKED' || !approvals) return null;

  const qualified = Number(approvals[1]);
  const required = Number(approvals[2]);
  if (
    !Number.isSafeInteger(qualified) ||
    qualified < 0 ||
    !Number.isSafeInteger(required) ||
    required < 1
  ) {
    return null;
  }

  return { checkId: latest.id, classification, required };
}

async function currentRawApprovalCount({
  owner,
  repo,
  number,
  headSha,
  authorLogin,
  token,
  fetchImpl,
}) {
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/reviews`;
  const latestByReviewer = new Map();

  for (let page = 1; page <= MAX_REVIEW_PAGES; page += 1) {
    const query = new URLSearchParams({ per_page: String(RUNS_PER_PAGE), page: String(page) });
    const reviews = await getJson({
      url: `${baseUrl}?${query}`,
      token,
      fetchImpl,
      operation: 'Pull request review evidence lookup',
    });
    if (!Array.isArray(reviews) || reviews.length > RUNS_PER_PAGE) {
      throw new TypeError('Malformed pull request review list');
    }

    for (const review of reviews) {
      if (
        !review ||
        !Number.isSafeInteger(review.id) ||
        review.id < 1 ||
        typeof review.user?.login !== 'string' ||
        !['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'].includes(review.state) ||
        typeof review.commit_id !== 'string' ||
        typeof review.submitted_at !== 'string' ||
        !Number.isFinite(Date.parse(review.submitted_at))
      ) {
        throw new TypeError('Malformed pull request review evidence');
      }

      const reviewer = review.user.login.toLowerCase();
      const previous = latestByReviewer.get(reviewer);
      if (
        !previous ||
        Date.parse(review.submitted_at) > Date.parse(previous.submitted_at) ||
        (Date.parse(review.submitted_at) === Date.parse(previous.submitted_at) &&
          review.id > previous.id)
      ) {
        latestByReviewer.set(reviewer, review);
      }
    }

    if (reviews.length < RUNS_PER_PAGE) return countCurrentApprovals();
  }

  throw new Error('Pull request review lookup exceeded supported pagination');

  function countCurrentApprovals() {
    let count = 0;
    for (const review of latestByReviewer.values()) {
      if (
        review.state === 'APPROVED' &&
        review.commit_id.toLowerCase() === headSha.toLowerCase() &&
        review.user.login.toLowerCase() !== authorLogin.toLowerCase() &&
        !review.user.login.toLowerCase().endsWith('[bot]')
      ) {
        count += 1;
      }
    }
    return count;
  }
}

async function waitingForApprovals({ owner, repo, number, pr, headSha, appId, token, fetchImpl }) {
  if (!Number.isSafeInteger(appId) || appId < 1 || typeof pr?.user?.login !== 'string') return null;
  const decision = await currentGovernanceDecision({
    owner,
    repo,
    headSha,
    appId,
    token,
    fetchImpl,
  });
  // PENDING_REVIEW may become ORDINARY when missing classification evidence is
  // added. Only a completed ordinary/critical block has a monotonic minimum.
  if (!decision || !['ORDINARY', 'CRITICAL'].includes(decision.classification)) return null;

  const approvalCount = await currentRawApprovalCount({
    owner,
    repo,
    number,
    headSha,
    authorLogin: pr.user.login,
    token,
    fetchImpl,
  });
  return approvalCount < decision.required
    ? {
        status: 'WAITING_FOR_APPROVALS',
        headSha: headSha.toLowerCase(),
        checkRunId: decision.checkId,
        approvalCount,
        required: decision.required,
      }
    : null;
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
  expectedAppId,
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
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    typeof token !== 'string' ||
    !token ||
    typeof fetchImpl !== 'function'
  ) {
    const error = new TypeError('Invalid governance review relay context');
    error.phase = 'relay-context';
    error.code = 'invalid-relay-context';
    throw error;
  }

  let order = await withPhase('review-run-lookup', () =>
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
  if (order.status === 'SUPERSEDED') return order;

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

  await withPhase('approval-evidence', () =>
    waitingForApprovals({
      owner,
      repo,
      number,
      pr,
      headSha: expectedHeadSha,
      appId: expectedAppId,
      token,
      fetchImpl,
    }),
  );

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

  // Re-read event order and readiness immediately before dispatch. This is
  // idempotent coordination, not a timing window; GitHub still creates one
  // relay run for each webhook delivery.
  order = await withPhase('review-run-lookup', () =>
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
  if (order.status === 'SUPERSEDED') return order;

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

  const latestWaiting = await withPhase('approval-evidence', () =>
    waitingForApprovals({
      owner,
      repo,
      number,
      pr,
      headSha: expectedHeadSha,
      appId: expectedAppId,
      token,
      fetchImpl,
    }),
  );
  if (latestWaiting) return latestWaiting;

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
