import { authenticatePrGovernanceWebhook } from './pr-governance.webhook.mjs';
import { dispatchPrGovernanceEvent } from './pr-governance.dispatch.mjs';

const DELIVERY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Processes one authenticated GitHub delivery.
 *
 * The store must implement atomic, shared and durable operations:
 * claim(id) ->
 *   { status: 'ACQUIRED', claimToken }
 *   | { status: 'COMPLETED' }
 *   | { status: 'IN_PROGRESS' }
 * complete(id, claimToken)
 * release(id, claimToken)
 *
 * Failed or expired leases must be recoverable by the store.
 * A valid claimToken must uniquely identify its lease.
 */
export async function processPrGovernanceDelivery({
  deliveryId,
  rawBody,
  signature,
  eventName,
  webhookSecret,
  expectedRepository,
  token,
  governanceToken,
  publisherToken,
  expectedAppId,
  store,
  dispatch = dispatchPrGovernanceEvent,
  fetchImpl = fetch,
}) {
  if (
    typeof deliveryId !== 'string' ||
    !DELIVERY_ID.test(deliveryId) ||
    !store ||
    typeof store.claim !== 'function' ||
    typeof store.complete !== 'function' ||
    typeof store.release !== 'function' ||
    typeof dispatch !== 'function'
  ) {
    throw new TypeError('Invalid PN-017 delivery context');
  }

  // Verify HMAC before accessing persistent state or privileged APIs.
  const authenticatedEvent = authenticatePrGovernanceWebhook({
    rawBody,
    signature,
    eventName,
    secret: webhookSecret,
  });

  const claim = await store.claim(deliveryId.toLowerCase());

  if (claim?.status === 'COMPLETED') {
    return { status: 'DUPLICATE_COMPLETED' };
  }

  if (claim?.status === 'IN_PROGRESS') {
    throw new Error('PN-017 delivery is already in progress');
  }

  if (claim?.status !== 'ACQUIRED' || typeof claim.claimToken !== 'string' || !claim.claimToken) {
    throw new Error('PN-017 delivery claim was not established');
  }

  const id = deliveryId.toLowerCase();
  const claimToken = claim.claimToken;

  try {
    const result = await dispatch({
      ...authenticatedEvent,
      expectedRepository,
      token,
      governanceToken,
      publisherToken,
      expectedAppId,
      fetchImpl,
    });

    if (!result || !['IGNORED', 'DISCOVERY_REQUIRED', 'EVALUATED'].includes(result.status)) {
      throw new TypeError('Invalid PN-017 delivery dispatch result');
    }

    // DISCOVERY_REQUIRED is not a completed governance operation.
    // Preserve the event for subsequent organization-wide processing.
    if (result.status === 'DISCOVERY_REQUIRED') {
      throw new Error('PN-017 organization discovery is not implemented');
    }

    const completion = await store.complete(id, claimToken);

    if (completion?.status !== 'COMPLETED') {
      throw new Error('PN-017 delivery completion was not confirmed');
    }

    return result;
  } catch (error) {
    try {
      const release = await store.release(id, claimToken);

      if (release?.status !== 'RELEASED') {
        throw new Error('PN-017 delivery release was not confirmed');
      }
    } catch (releaseError) {
      throw new AggregateError(
        [error, releaseError],
        'PN-017 delivery execution and lease release failed',
      );
    }

    throw error;
  }
}
