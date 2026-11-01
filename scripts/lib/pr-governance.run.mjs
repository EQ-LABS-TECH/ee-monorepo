import { evaluatePrGovernance } from './pr-governance.evaluate.mjs';
import { startPrGovernanceCheck, completePrGovernanceCheck } from './pr-governance.publish.mjs';

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

  const started = await startPrGovernanceCheck(publication);

  try {
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
      throw new AggregateError(
        [error, completionError],
        'PR governance execution and failure completion were unsuccessful',
      );
    }

    throw error;
  }
}
