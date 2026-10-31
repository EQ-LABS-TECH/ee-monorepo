import { classifyPrGovernanceEvent } from './pr-governance.events.mjs';

const REPOSITORY = /^[a-z\d-]+\/[a-z\d_.-]+$/i;

/**
 * Converts a classified, authenticated event into a routing decision.
 *
 * The caller must authenticate the webhook before invoking this function.
 * No PR HEAD, approval or permission is trusted from the payload.
 */
export function routePrGovernanceEvent({ eventName, payload, expectedRepository }) {
  if (typeof expectedRepository !== 'string' || !REPOSITORY.test(expectedRepository)) {
    throw new TypeError('Invalid trusted governance repository');
  }

  const event = classifyPrGovernanceEvent({
    eventName,
    payload,
  });

  if (event.scope === 'IGNORE') {
    return { status: 'IGNORED' };
  }

  const [owner, repo] = expectedRepository.split('/');

  if (event.scope === 'PR_SCOPE') {
    if (event.repository.toLowerCase() !== expectedRepository.toLowerCase()) {
      throw new Error('Governance event repository mismatch');
    }

    return {
      status: 'READY',
      scope: 'PR_SCOPE',
      owner,
      repo,
      number: event.number,
    };
  }

  if (event.scope === 'ORG_SCOPE') {
    if (event.organization.toLowerCase() !== owner.toLowerCase()) {
      throw new Error('Governance event organization mismatch');
    }

    return {
      status: 'DISCOVERY_REQUIRED',
      scope: 'ORG_SCOPE',
      organization: event.organization,
    };
  }

  throw new TypeError('Unsupported governance event scope');
}
