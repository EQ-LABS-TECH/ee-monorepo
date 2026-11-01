import { authenticatePrGovernanceWebhook } from './pr-governance.webhook.mjs';
import { dispatchPrGovernanceEvent } from './pr-governance.dispatch.mjs';

/**
 * Trusted webhook entry point.
 *
 * Authentication precedes routing, resolution and publication.
 * No authentication flag is accepted from external callers.
 */
export async function receivePrGovernanceWebhook({
  rawBody,
  signature,
  eventName,
  webhookSecret,
  expectedRepository,
  token,
  governanceToken,
  publisherToken,
  expectedAppId,
  fetchImpl = fetch,
  dispatch = dispatchPrGovernanceEvent,
}) {
  const authenticatedEvent = authenticatePrGovernanceWebhook({
    rawBody,
    signature,
    eventName,
    secret: webhookSecret,
  });

  if (typeof dispatch !== 'function') {
    throw new TypeError('Invalid PN-017 webhook dispatcher');
  }

  return dispatch({
    ...authenticatedEvent,
    expectedRepository,
    token,
    governanceToken,
    publisherToken,
    expectedAppId,
    fetchImpl,
  });
}
