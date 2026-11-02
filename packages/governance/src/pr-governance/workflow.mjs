const SHA = /^[0-9a-f]{40}$/i;
const REPOSITORY = /^[a-z\d-]+\/[a-z\d_.-]+$/i;
const RECONCILABLE_WORKFLOW_EVENTS = new Set(['pull_request', 'pull_request_review']);

export function validateRequestedPrGovernanceHead({
  eventName,
  requestedHeadSha,
  resolvedHeadSha,
}) {
  if (eventName !== 'workflow_dispatch') {
    return;
  }

  if (
    !SHA.test(requestedHeadSha ?? '') ||
    !SHA.test(resolvedHeadSha ?? '') ||
    requestedHeadSha.toLowerCase() !== resolvedHeadSha.toLowerCase()
  ) {
    throw new Error('Requested PR HEAD does not match the current PR HEAD');
  }
}

export function validateGovernanceSchedule({ expectedRepository, ref }) {
  if (!REPOSITORY.test(expectedRepository ?? '') || ref !== 'refs/heads/main') {
    throw new TypeError('Invalid scheduled governance context');
  }

  return {
    repository: expectedRepository,
    sourceEvent: 'schedule',
  };
}

export function validateGovernanceWorkflowRun({
  event,
  expectedRepository,
  expectedWorkflowName,
  expectedWorkflowPath,
}) {
  if (
    !REPOSITORY.test(expectedRepository ?? '') ||
    expectedWorkflowName !== 'CI' ||
    expectedWorkflowPath !== '.github/workflows/ci.yml' ||
    !event ||
    typeof event !== 'object'
  ) {
    throw new TypeError('Invalid governance workflow run context');
  }

  const run = event.workflow_run;

  if (
    event.action !== 'completed' ||
    run?.status !== 'completed' ||
    !RECONCILABLE_WORKFLOW_EVENTS.has(run?.event) ||
    run.name !== expectedWorkflowName ||
    run.path !== expectedWorkflowPath ||
    !Number.isSafeInteger(run.workflow_id) ||
    run.workflow_id < 1 ||
    !Number.isSafeInteger(run.id) ||
    run.id < 1 ||
    run.repository?.full_name?.toLowerCase() !== expectedRepository.toLowerCase() ||
    event.repository?.full_name?.toLowerCase() !== expectedRepository.toLowerCase() ||
    !SHA.test(run.head_sha ?? '')
  ) {
    throw new Error('Untrusted or unsupported governance workflow run');
  }

  return {
    workflowRunId: run.id,
    repository: expectedRepository,
    sourceEvent: run.event,
  };
}

export function validateGovernanceIssueComment({ event, expectedRepository }) {
  const repository = REPOSITORY.exec(expectedRepository ?? '');
  const issue = event?.issue;
  const pullRequestUrl = issue?.pull_request?.url;
  const number = Number.isSafeInteger(issue?.number) ? issue.number : null;
  const [owner, repo] = expectedRepository?.split('/') ?? [];
  const expectedUrl =
    repository && number !== null
      ? `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`
      : '';

  if (
    !repository ||
    !event ||
    !['created', 'edited', 'deleted'].includes(event.action) ||
    event.repository?.full_name?.toLowerCase() !== expectedRepository.toLowerCase() ||
    number === null ||
    number < 1 ||
    typeof pullRequestUrl !== 'string' ||
    pullRequestUrl.toLowerCase() !== expectedUrl.toLowerCase() ||
    !Number.isSafeInteger(event.comment?.id) ||
    event.comment.id < 1 ||
    typeof event.comment.user?.login !== 'string' ||
    !event.comment.user.login
  ) {
    throw new TypeError('Invalid governance PR comment context');
  }

  return {
    repository: expectedRepository,
    number,
    sourceEvent: 'issue_comment',
  };
}
