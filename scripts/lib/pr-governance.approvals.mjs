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
  const required = critical ? 2 : 1;
  return {
    status: approved.length >= required ? 'PASS' : 'BLOCKED',
    approvedCount: approved.length,
    requiredCount: required,
    approvedReviewers: approved,
    reason:
      approved.length >= required
        ? 'threshold-met'
        : critical && approved.length === 1
          ? 'critical-review-capacity-or-second-approval-required'
          : 'insufficient-valid-approvals',
  };
}
