import { evaluatePrGovernance } from './pr-governance.evaluate.mjs';
import {
  findCurrentSuccessfulPrGovernanceCheck,
  startPrGovernanceCheck,
  completePrGovernanceCheck,
} from './pr-governance.publish.mjs';
import { readValidateReadiness } from './pr-governance.ci.mjs';
import { getGitHubRequestId } from './pr-governance.github-error.mjs';

function diagnosticFor(error, phase, { number, expectedHeadSha }) {
  const httpStatus = getHttpStatus(error);
  const requestId = getGitHubRequestId(error);
  return {
    ...(Number.isSafeInteger(number) && number > 0 ? { number } : {}),
    ...(typeof expectedHeadSha === 'string' && /^[0-9a-f]{40}$/i.test(expectedHeadSha)
      ? { headSha: expectedHeadSha.toLowerCase() }
      : {}),
    ...(requestId ? { requestId } : {}),
    phase,
    code:
      error instanceof AggregateError
        ? 'aggregate-operation-failed'
        : httpStatus !== undefined
          ? 'github-http-error'
          : error instanceof TypeError
            ? 'invalid-evidence-or-input'
            : 'unexpected-operation-error',
    ...(httpStatus !== undefined ? { httpStatus } : {}),
  };
}

function getHttpStatus(error, seen = new Set()) {
  if (!(error instanceof Error) || seen.has(error)) return undefined;
  seen.add(error);
  const match = /\bHTTP ([1-5]\d{2})\b/.exec(error.message);
  if (match) return Number(match[1]);
  if (error instanceof AggregateError) {
    for (const nestedError of error.errors) {
      const status = getHttpStatus(nestedError, seen);
      if (status !== undefined) return status;
    }
  }
  return undefined;
}

/**
 * Trusted orchestration only.
 * The caller supplies the PR identity, expected HEAD and separate tokens.
 * Does not authorize a merge.
 */
export async function runPrGovernance({
  owner,
  repo,
  number,
  expectedHeadSha,
  expectedAppId,
  token,
  governanceToken,
  publisherToken,
  waitForApprovalReadiness = false,
  deduplicateSuccessfulChecks = false,
  fetchImpl = fetch,
}) {
  if (
    typeof token !== 'string' ||
    !token ||
    typeof governanceToken !== 'string' ||
    !governanceToken ||
    typeof publisherToken !== 'string' ||
    !publisherToken ||
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    typeof fetchImpl !== 'function'
  ) {
    throw new TypeError('Invalid PR governance execution configuration');
  }

  const publication = {
    owner,
    repo,
    number,
    expectedHeadSha,
    expectedAppId,
    token: publisherToken,
    fetchImpl,
  };

  let phase = 'validate-readiness';
  let started;

  let validation;
  try {
    validation = await readValidateReadiness({
      owner,
      repo,
      headSha: expectedHeadSha,
      token,
      fetchImpl,
    });
  } catch (error) {
    if (error instanceof Error) {
      error.pn017Diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
    }
    throw error;
  }

  if (validation.status !== 'READY') {
    return {
      mode: 'WAITING_FOR_VALIDATION',
      headSha: expectedHeadSha.toLowerCase(),
      validationCheckRunId: validation.checkRunId,
    };
  }

  let initialEvaluation;
  if (waitForApprovalReadiness || deduplicateSuccessfulChecks) {
    phase = 'evaluation';
    try {
      initialEvaluation = await evaluatePrGovernance({
        owner,
        repo,
        number,
        token,
        governanceToken,
        fetchImpl,
      });
    } catch (error) {
      if (error instanceof Error) {
        error.pn017Diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      }
      throw error;
    }

    if (initialEvaluation.headSha?.toLowerCase() !== expectedHeadSha.toLowerCase()) {
      const error = new Error('PR governance evaluation returned a superseded HEAD');
      error.pn017Diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      throw error;
    }
  }

  if (initialEvaluation?.decision.status === 'PASS' && deduplicateSuccessfulChecks) {
    phase = 'check-deduplication';
    try {
      const existing = await findCurrentSuccessfulPrGovernanceCheck({
        owner,
        repo,
        expectedHeadSha,
        expectedAppId,
        token: publisherToken,
        fetchImpl,
      });
      if (existing) {
        return {
          mode: 'ALREADY_CURRENT',
          headSha: existing.headSha,
          checkId: existing.checkId,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        error.pn017Diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      }
      throw error;
    }
  }

  phase = 'check-start';
  try {
    started = await startPrGovernanceCheck(publication);
  } catch (error) {
    if (error instanceof Error) {
      error.pn017Diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
    }
    throw error;
  }

  try {
    phase = 'evaluation';
    const evaluate = () =>
      evaluatePrGovernance({
        owner,
        repo,
        number,
        token,
        governanceToken,
        fetchImpl,
      });

    let evaluation = await evaluate();

    // A favorable decision requires fresh evidence immediately
    // before publication. Any changed evidence is evaluated again.
    if (evaluation.decision.status === 'PASS') {
      evaluation = await evaluate();
    }

    phase = 'publication';
    const completed = await completePrGovernanceCheck({
      ...publication,
      checkId: started.checkId,
      expectedAppId: started.appId,
      evaluation,
    });

    return {
      mode: 'EVALUATION_AND_PUBLICATION',
      classification: evaluation.classification,
      decision: evaluation.decision,
      ...completed,
    };
  } catch (error) {
    const diagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
    if (error instanceof Error) error.pn017Diagnostic = diagnostic;
    // Never turn an unsuccessful evaluation into a successful check.
    // If completion already failed, the fallback may also fail.
    try {
      await completePrGovernanceCheck({
        ...publication,
        checkId: started.checkId,
        expectedAppId: started.appId,
        failureReason: 'evaluation-error',
      });
    } catch (completionError) {
      const aggregate = new AggregateError(
        [error, completionError],
        'PR governance execution and failure completion were unsuccessful',
      );
      aggregate.pn017Diagnostic = { ...diagnostic, code: 'failure-publication-failed' };
      throw aggregate;
    }

    throw error;
  }
}
