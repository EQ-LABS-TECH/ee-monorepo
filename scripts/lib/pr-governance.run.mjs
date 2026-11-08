import { evaluatePrGovernance } from './pr-governance.evaluate.mjs';
import {
  findCurrentPrGovernanceCheck,
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
    ...(typeof error?.governanceOperation === 'string' &&
    /^[a-z\d-]{1,64}$/i.test(error.governanceOperation)
      ? { operation: error.governanceOperation }
      : {}),
    ...(typeof error?.governanceSubject === 'string' &&
    /^[a-z\d_-]{1,100}$/i.test(error.governanceSubject)
      ? { subject: error.governanceSubject }
      : {}),
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

async function publishPreStartFailure(publication, context, phase, originalError) {
  const diagnostic = diagnosticFor(originalError, phase, context);
  if (originalError instanceof Error) originalError.governanceDiagnostic = diagnostic;

  try {
    const failedCheck = await startPrGovernanceCheck(publication);
    await completePrGovernanceCheck({
      ...publication,
      checkId: failedCheck.checkId,
      expectedAppId: failedCheck.appId,
      failureReason: 'evaluation-error',
    });
  } catch (publicationError) {
    const aggregate = new AggregateError(
      [originalError, publicationError],
      'PR governance pre-check failed and its failure check could not be published',
    );
    aggregate.governanceDiagnostic = {
      ...diagnostic,
      phase: `${phase}-failure-publication`,
      code: 'failure-publication-failed',
    };
    throw aggregate;
  }
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
  deduplicateCurrentChecks = false,
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
    await publishPreStartFailure(publication, { number, expectedHeadSha }, phase, error);
    if (error instanceof Error) {
      error.governanceDiagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
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
  if (waitForApprovalReadiness || deduplicateCurrentChecks) {
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
      await publishPreStartFailure(publication, { number, expectedHeadSha }, phase, error);
      if (error instanceof Error) {
        error.governanceDiagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      }
      throw error;
    }

    if (initialEvaluation.headSha?.toLowerCase() !== expectedHeadSha.toLowerCase()) {
      const error = new Error('PR governance evaluation returned a superseded HEAD');
      error.governanceDiagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      throw error;
    }
  }

  if (initialEvaluation && deduplicateCurrentChecks) {
    phase = 'check-deduplication';
    try {
      const expectedConclusion =
        initialEvaluation.decision.status === 'PASS' ? 'success' : 'failure';
      const existing = await findCurrentPrGovernanceCheck({
        owner,
        repo,
        expectedHeadSha,
        expectedAppId,
        expectedConclusion,
        evidenceFingerprint: initialEvaluation.evidenceFingerprint,
        token: publisherToken,
        fetchImpl,
      });
      if (existing) {
        const confirmedEvaluation = await evaluatePrGovernance({
          owner,
          repo,
          number,
          token,
          governanceToken,
          fetchImpl,
        });

        if (
          confirmedEvaluation.headSha?.toLowerCase() !== expectedHeadSha.toLowerCase() ||
          confirmedEvaluation.evidenceFingerprint !== initialEvaluation.evidenceFingerprint ||
          confirmedEvaluation.decision.status !== initialEvaluation.decision.status
        ) {
          initialEvaluation = confirmedEvaluation;
        } else {
          return {
            mode: 'ALREADY_CURRENT',
            headSha: existing.headSha,
            checkId: existing.checkId,
            conclusion: existing.conclusion,
          };
        }
      }
    } catch (error) {
      await publishPreStartFailure(publication, { number, expectedHeadSha }, phase, error);
      if (error instanceof Error) {
        error.governanceDiagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
      }
      throw error;
    }
  }

  phase = 'check-start';
  try {
    started = await startPrGovernanceCheck(publication);
  } catch (error) {
    if (error instanceof Error) {
      error.governanceDiagnostic = diagnosticFor(error, phase, { number, expectedHeadSha });
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

    // Re-read and confirm all evidence immediately before publishing either
    // outcome. The Checks API is not atomic with evidence changes, so this
    // narrows but cannot eliminate the final race window.
    const evaluation = await evaluate();

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
    if (error instanceof Error) error.governanceDiagnostic = diagnostic;
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
      aggregate.governanceDiagnostic = { ...diagnostic, code: 'failure-publication-failed' };
      throw aggregate;
    }

    throw error;
  }
}
