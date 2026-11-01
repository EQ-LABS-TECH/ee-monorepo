import { discoverOpenGovernancePrs } from './pr-governance.discover-open.mjs';
import { resolvePrGovernanceRoute } from './pr-governance.resolve.mjs';
import { runPrGovernance } from './pr-governance.run.mjs';

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

function getErrorKind(error) {
  if (error instanceof TypeError) return 'TypeError';
  if (error instanceof AggregateError) return 'AggregateError';
  return 'Error';
}

/**
 * One-shot evaluation of open PRs.
 * Not a scheduler, webhook service, or merge authorization.
 */
export async function reconcileOpenGovernancePrs({
  owner,
  repo,
  token,
  governanceToken,
  publisherToken,
  expectedAppId,
  fetchImpl = fetch,
  discover = discoverOpenGovernancePrs,
  resolve = resolvePrGovernanceRoute,
  run = runPrGovernance,
}) {
  if (
    typeof owner !== 'string' ||
    !owner ||
    typeof repo !== 'string' ||
    !repo ||
    typeof token !== 'string' ||
    !token ||
    typeof governanceToken !== 'string' ||
    !governanceToken ||
    typeof publisherToken !== 'string' ||
    !publisherToken ||
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    typeof fetchImpl !== 'function' ||
    typeof discover !== 'function' ||
    typeof resolve !== 'function' ||
    typeof run !== 'function'
  ) {
    throw new TypeError('Invalid governance reconciliation context');
  }

  const numbers = await discover({
    owner,
    repo,
    token,
    fetchImpl,
  });

  if (
    !Array.isArray(numbers) ||
    numbers.some((number) => !Number.isSafeInteger(number) || number < 1) ||
    new Set(numbers).size !== numbers.length
  ) {
    throw new TypeError('Invalid governance discovery results');
  }

  const results = [];

  // Sequential processing avoids publishing competing checks
  // within this invocation.
  for (const number of numbers) {
    let phase = 'resolve';

    try {
      const resolved = await resolve({
        route: {
          status: 'READY',
          scope: 'PR_SCOPE',
          owner,
          repo,
          number,
        },
        token,
        fetchImpl,
      });

      if (
        resolved.owner !== owner ||
        resolved.repo !== repo ||
        resolved.number !== number ||
        resolved.baseRef !== 'main' ||
        !/^[0-9a-f]{40}$/i.test(resolved.expectedHeadSha)
      ) {
        throw new Error('Invalid resolved governance PR identity');
      }

      phase = 'execute';

      const result = await run({
        owner,
        repo,
        number,
        expectedHeadSha: resolved.expectedHeadSha,
        expectedAppId,
        token,
        governanceToken,
        publisherToken,
        fetchImpl,
      });

      if (
        result?.mode !== 'EVALUATION_AND_PUBLICATION' ||
        result.headSha?.toLowerCase() !== resolved.expectedHeadSha.toLowerCase() ||
        !['success', 'failure'].includes(result.conclusion) ||
        !Number.isSafeInteger(result.checkId) ||
        result.checkId < 1
      ) {
        throw new Error('Invalid governance execution result');
      }

      results.push({
        number,
        status: result.conclusion === 'success' ? 'PASS' : 'BLOCKED',
      });
    } catch (error) {
      // Do not expose API responses or credentials in logs.
      const httpStatus = getHttpStatus(error);

      console.error(
        'PN-017 reconciliation PR failure:',
        JSON.stringify({
          number,
          phase,
          kind: getErrorKind(error),
          ...(httpStatus !== undefined ? { httpStatus } : {}),
        }),
      );

      results.push({
        number,
        status: 'ERROR',
      });
    }
  }

  return {
    status: results.every((item) => item.status !== 'ERROR') ? 'SUCCESS' : 'INCOMPLETE',
    results,
  };
}
