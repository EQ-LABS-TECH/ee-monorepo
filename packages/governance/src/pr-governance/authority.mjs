const ORDINARY_DECLARATION = 'EE-LABS-IMPACT: ORDINARY';
const ARCHITECTURE_TEAM = 'architecture';

/**
 * Resolves a PR classification from critical indicators and verified ordinary
 * classification approval evidence. Missing authority remains pending review.
 */
export function resolvePrGovernanceClassification({
  criticalIndicatorsPresent,
  approvedReviewDetails,
  permissions,
  memberships,
}) {
  const ordinaryDeclarations = approvedReviewDetails.filter(
    (review) => review.body.trim() === ORDINARY_DECLARATION,
  );

  const authorizedOrdinaryReviewers = ordinaryDeclarations
    .filter(({ reviewer }) => {
      const permission = permissions.find((entry) => entry.reviewer === reviewer.toLowerCase());

      return (
        permission?.hasWriteAccess === true &&
        memberships.some(
          (membership) =>
            membership.reviewer === reviewer.toLowerCase() &&
            membership.teamSlug === ARCHITECTURE_TEAM &&
            membership.active,
        )
      );
    })
    .map(({ reviewer }) => reviewer.toLowerCase());

  const classification = criticalIndicatorsPresent
    ? 'CRITICAL'
    : authorizedOrdinaryReviewers.length > 0
      ? 'ORDINARY'
      : 'PENDING_REVIEW';

  return {
    classification,
    authorizedOrdinaryReviewers,
  };
}
