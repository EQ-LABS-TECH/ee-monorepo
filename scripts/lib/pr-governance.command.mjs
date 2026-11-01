import { runPrGovernance } from './pr-governance.run.mjs';

const SHA = /^[0-9a-f]{40}$/i;
const REPOSITORY = /^([a-z\d-]+)\/([a-z\d_.-]+)$/i;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

function parsePositiveInteger(value) {
  if (typeof value !== 'string' || !POSITIVE_INTEGER.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function readGovernanceCommandContext(env) {
  const repository = REPOSITORY.exec(env?.GITHUB_REPOSITORY ?? '');

  const number = parsePositiveInteger(env?.PR_NUMBER);
  const expectedAppId = parsePositiveInteger(env?.GOVERNANCE_APP_ID);
  const expectedHeadSha = env?.PR_HEAD_SHA;

  const token = env?.GOVERNANCE_PR_TOKEN;
  const governanceToken = env?.GOVERNANCE_EVIDENCE_TOKEN;
  const publisherToken = env?.GOVERNANCE_PUBLISHER_TOKEN;

  if (
    !repository ||
    number === null ||
    expectedAppId === null ||
    typeof expectedHeadSha !== 'string' ||
    !SHA.test(expectedHeadSha) ||
    typeof token !== 'string' ||
    !token ||
    typeof governanceToken !== 'string' ||
    !governanceToken ||
    typeof publisherToken !== 'string' ||
    !publisherToken
  ) {
    throw new TypeError('Invalid PN-017 trusted execution context');
  }

  return {
    owner: repository[1],
    repo: repository[2],
    number,
    expectedHeadSha: expectedHeadSha.toLowerCase(),
    expectedAppId,
    token,
    governanceToken,
    publisherToken,
  };
}

export async function executeGovernanceCommand({ env, run = runPrGovernance, log = console.log }) {
  const context = readGovernanceCommandContext(env);
  const result = await run(context);

  if (
    result?.mode !== 'EVALUATION_AND_PUBLICATION' ||
    !['CRITICAL', 'ORDINARY', 'PENDING_REVIEW'].includes(result.classification) ||
    !['PASS', 'BLOCKED'].includes(result.decision?.status) ||
    result.headSha?.toLowerCase() !== context.expectedHeadSha ||
    result.checkId < 1 ||
    !Number.isSafeInteger(result.checkId)
  ) {
    throw new TypeError('Invalid PN-017 execution result');
  }

  const passed =
    result.decision.status === 'PASS' &&
    result.conclusion === 'success' &&
    result.classification !== 'PENDING_REVIEW';

  if (!passed && result.conclusion !== 'failure') {
    throw new TypeError('Inconsistent PN-017 check conclusion');
  }

  log(
    JSON.stringify({
      checkId: result.checkId,
      headSha: result.headSha,
      classification: result.classification,
      status: result.decision.status,
      conclusion: result.conclusion,
    }),
  );

  return passed ? 0 : 1;
}
