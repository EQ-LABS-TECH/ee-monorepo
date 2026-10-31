/**
 * PN-017: deterministic enforcement policy evaluation.
 *
 * Inputs must be produced by a trusted evidence adapter.
 * PASS does not bypass GitHub branch rules, CODEOWNERS or quality gates.
 */

const CLASSIFICATIONS = new Set(['CRITICAL', 'ORDINARY', 'PENDING_REVIEW']);

export function evaluatePrGovernanceEnforcement({
  classification,
  classificationAuthorized,
  qualifiedReviewers,
  ownershipVerified,
  evidenceCurrent,
}) {
  if (
    !CLASSIFICATIONS.has(classification) ||
    typeof classificationAuthorized !== 'boolean' ||
    !Array.isArray(qualifiedReviewers) ||
    qualifiedReviewers.some(
      (reviewer) =>
        typeof reviewer !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,38}[a-z\d])?$/i.test(reviewer),
    ) ||
    typeof ownershipVerified !== 'boolean' ||
    typeof evidenceCurrent !== 'boolean'
  ) {
    throw new TypeError('Invalid PR governance enforcement evidence');
  }

  const normalizedReviewers = qualifiedReviewers.map((reviewer) => reviewer.toLowerCase());

  if (new Set(normalizedReviewers).size !== normalizedReviewers.length) {
    throw new TypeError('Qualified reviewers must be unique');
  }

  const requiredCount =
    classification === 'CRITICAL' ? 2 : classification === 'ORDINARY' ? 1 : null;

  const reasons = [];

  if (classification === 'PENDING_REVIEW') {
    reasons.push('impact-classification-pending');
  }

  if (classification === 'ORDINARY' && !classificationAuthorized) {
    reasons.push('ordinary-classification-not-authorized');
  }

  if (!ownershipVerified) {
    reasons.push('codeowner-eligibility-not-verified');
  }

  if (!evidenceCurrent) {
    reasons.push('evidence-not-current');
  }

  if (requiredCount !== null && normalizedReviewers.length < requiredCount) {
    reasons.push('insufficient-qualified-approvals');
  }

  return {
    status: reasons.length === 0 ? 'PASS' : 'BLOCKED',
    classification,
    requiredCount,
    qualifiedApprovalCount: normalizedReviewers.length,
    reasons,
  };
}
