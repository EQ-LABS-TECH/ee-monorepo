const SHA = /^[0-9a-f]{40}$/i;
const REPOSITORY = /^[a-z\d-]+\/[a-z\d_.-]+$/i;

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
    run?.event !== 'pull_request' ||
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
