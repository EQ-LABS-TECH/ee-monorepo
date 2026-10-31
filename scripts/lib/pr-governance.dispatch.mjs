import { routePrGovernanceEvent } from './pr-governance.route.mjs';
import { resolvePrGovernanceRoute } from './pr-governance.resolve.mjs';
import { runPrGovernance } from './pr-governance.run.mjs';

/**
 * Invoked only after webhook authentication by trusted infrastructure.
 * Event payloads establish routing, never governance evidence.
 */
export async function dispatchPrGovernanceEvent({
  eventName,
  payload,
  expectedRepository,
  authenticated,
  token,
  governanceToken,
  publisherToken,
  expectedAppId,
  fetchImpl = fetch,
  resolve = resolvePrGovernanceRoute,
  run = runPrGovernance,
}) {
  if (
    authenticated !== true ||
    typeof token !== 'string' ||
    !token ||
    typeof governanceToken !== 'string' ||
    !governanceToken ||
    typeof publisherToken !== 'string' ||
    !publisherToken ||
    !Number.isSafeInteger(expectedAppId) ||
    expectedAppId < 1 ||
    typeof fetchImpl !== 'function' ||
    typeof resolve !== 'function' ||
    typeof run !== 'function'
  ) {
    throw new TypeError('Invalid trusted PN-017 dispatch context');
  }

  const route = routePrGovernanceEvent({
    eventName,
    payload,
    expectedRepository,
  });

  if (route.status === 'IGNORED') {
    return { status: 'IGNORED' };
  }

  if (route.status === 'DISCOVERY_REQUIRED') {
    return {
      status: 'DISCOVERY_REQUIRED',
      organization: route.organization,
    };
  }

  if (route.status !== 'READY') {
    throw new TypeError('Unsupported PN-017 dispatch route');
  }

  const resolved = await resolve({
    route,
    token,
    fetchImpl,
  });

  if (
    resolved?.owner !== route.owner ||
    resolved?.repo !== route.repo ||
    resolved?.number !== route.number ||
    !/^[0-9a-f]{40}$/i.test(resolved.expectedHeadSha ?? '')
  ) {
    throw new TypeError('Invalid PN-017 resolved PR context');
  }

  const result = await run({
    owner: resolved.owner,
    repo: resolved.repo,
    number: resolved.number,
    expectedHeadSha: resolved.expectedHeadSha,
    expectedAppId,
    token,
    governanceToken,
    publisherToken,
    fetchImpl,
  });

  return {
    status: 'EVALUATED',
    result,
  };
}
