const PR_ACTIONS = new Set([
  'opened',
  'reopened',
  'synchronize',
  'edited',
  'ready_for_review',
  'converted_to_draft',
  'review_requested',
  'review_request_removed',
]);

const REVIEW_ACTIONS = new Set(['submitted', 'edited', 'dismissed']);

const ORGANIZATION_EVENTS = new Map([
  ['membership', new Set(['added', 'removed'])],
  ['team', new Set(['added_to_repository', 'removed_from_repository', 'edited'])],
  ['member', new Set(['added', 'removed', 'edited'])],
]);

/**
 * Classifies an already-authenticated GitHub webhook event.
 * Does not trust the payload as governance evidence.
 *
 * PR_SCOPE: re-evaluate one PR.
 * ORG_SCOPE: discover and re-evaluate affected open PRs.
 * IGNORE: no governance action.
 */
export function classifyPrGovernanceEvent({ eventName, payload }) {
  if (
    typeof eventName !== 'string' ||
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new TypeError('Invalid governance event');
  }

  const action = payload.action;

  if (typeof action !== 'string') {
    throw new TypeError('Invalid governance event action');
  }

  const isPrEvent = eventName === 'pull_request';
  const isReviewEvent = eventName === 'pull_request_review';

  if (isPrEvent || isReviewEvent) {
    const actions = isPrEvent ? PR_ACTIONS : REVIEW_ACTIONS;

    if (!actions.has(action)) {
      return { scope: 'IGNORE' };
    }

    const repo = payload.repository?.full_name;
    const number = payload.pull_request?.number;

    if (
      typeof repo !== 'string' ||
      !/^[a-z\d-]+\/[a-z\d_.-]+$/i.test(repo) ||
      !Number.isSafeInteger(number) ||
      number < 1
    ) {
      throw new TypeError('Invalid governance PR event identity');
    }

    return {
      scope: 'PR_SCOPE',
      repository: repo,
      number,
    };
  }

  const organizationActions = ORGANIZATION_EVENTS.get(eventName);

  if (organizationActions) {
    if (!organizationActions.has(action)) {
      return { scope: 'IGNORE' };
    }

    const organization = payload.organization?.login;

    if (typeof organization !== 'string' || !/^[a-z\d-]+$/i.test(organization)) {
      throw new TypeError('Invalid governance organization event identity');
    }

    return {
      scope: 'ORG_SCOPE',
      organization,
    };
  }

  return { scope: 'IGNORE' };
}
