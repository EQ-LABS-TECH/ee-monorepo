/** Pure evaluation of GitHub PR review evidence. Does not authorize bypasses. */
const REVIEW_STATES = new Set(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED']);

export function evaluatePrApprovals({ author, headSha, reviews, critical }) {
  if (
    typeof author !== 'string' ||
    !author ||
    typeof headSha !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(headSha) ||
    !Array.isArray(reviews) ||
    typeof critical !== 'boolean'
  ) {
    throw new TypeError('Invalid PR approval evaluation input');
  }
  const latest = new Map();
  for (const review of reviews) {
    if (
      !review ||
      typeof review !== 'object' ||
      typeof review.login !== 'string' ||
      !review.login ||
      typeof review.state !== 'string' ||
      !REVIEW_STATES.has(review.state.toUpperCase()) ||
      typeof review.submittedAt !== 'string' ||
      !Number.isFinite(Date.parse(review.submittedAt)) ||
      typeof review.commitId !== 'string' ||
      !Number.isSafeInteger(review.sequence) ||
      review.sequence < 0
    ) {
      throw new TypeError('Malformed review evidence');
    }
    const login = review.login.toLowerCase();
    const prev = latest.get(login);
    const timestamp = Date.parse(review.submittedAt);
    if (
      !prev ||
      timestamp > prev.timestamp ||
      (timestamp === prev.timestamp && review.sequence > prev.sequence)
    ) {
      latest.set(login, {
        state: review.state.toUpperCase(),
        commitId: review.commitId,
        timestamp,
        sequence: review.sequence,
        body: review.body ?? '',
      });
    }
  }
  const approved = [...latest]
    .filter(
      ([login, review]) =>
        login !== author.toLowerCase() &&
        review.state === 'APPROVED' &&
        review.commitId.toLowerCase() === headSha.toLowerCase(),
    )
    .map(([login]) => login);
  const approvedReviewDetails = approved.map((login) => {
    const review = latest.get(login);

    return {
      reviewer: login,
      commitId: review.commitId,
      body: review.body,
    };
  });

  const required = critical ? 2 : 1;
  return {
    status: approved.length >= required ? 'PASS' : 'BLOCKED',
    approvedCount: approved.length,
    requiredCount: required,
    approvedReviewers: approved,
    approvedReviewDetails,
    reason:
      approved.length >= required
        ? 'threshold-met'
        : critical && approved.length === 1
          ? 'critical-review-capacity-or-second-approval-required'
          : 'insufficient-valid-approvals',
  };
}

/**
 * Evaluates reviewer eligibility evidence only.
 * responsibleTeams must come from independently verified ownership rules.
 * This function does not authorize an ordinary classification or a merge.
 */
export function evaluateReviewerAuthority({
  candidate,
  approvedReviewers,
  memberships,
  responsibleTeams,
}) {
  if (
    !candidate ||
    typeof candidate.reviewer !== 'string' ||
    !candidate.reviewer ||
    typeof candidate.hasWriteAccess !== 'boolean' ||
    !Array.isArray(approvedReviewers) ||
    !Array.isArray(memberships) ||
    !Array.isArray(responsibleTeams) ||
    approvedReviewers.some((reviewer) => typeof reviewer !== 'string') ||
    responsibleTeams.some((team) => typeof team !== 'string' || !team) ||
    memberships.some(
      (membership) =>
        !membership ||
        typeof membership.reviewer !== 'string' ||
        typeof membership.teamSlug !== 'string' ||
        typeof membership.active !== 'boolean',
    )
  ) {
    throw new TypeError('Invalid reviewer authority evidence');
  }

  const reviewer = candidate.reviewer.toLowerCase();

  const approved = approvedReviewers.some((login) => login.toLowerCase() === reviewer);

  const responsible = new Set(responsibleTeams.map((team) => team.toLowerCase()));

  const matchedTeams = memberships
    .filter(
      (membership) =>
        membership.reviewer.toLowerCase() === reviewer &&
        membership.active &&
        responsible.has(membership.teamSlug.toLowerCase()),
    )
    .map((membership) => membership.teamSlug);

  const eligible =
    approved && candidate.hasWriteAccess && responsible.size > 0 && matchedTeams.length > 0;

  return {
    status: eligible ? 'ELIGIBLE_EVIDENCE' : 'UNVERIFIED',
    reviewer,
    matchedTeams: eligible ? [...new Set(matchedTeams)] : [],
    reason: !approved
      ? 'current-approval-not-verified'
      : !candidate.hasWriteAccess
        ? 'repository-write-access-required'
        : responsible.size === 0
          ? 'responsible-ownership-not-verified'
          : matchedTeams.length === 0
            ? 'active-responsible-team-membership-required'
            : 'eligibility-evidence-matched',
  };
}
