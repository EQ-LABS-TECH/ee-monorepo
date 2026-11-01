import { evaluatePrGovernanceEnforcement } from './enforcement.mjs';
import { resolvePrGovernanceClassification } from './authority.mjs';

/**
 * Composes a governance result from evidence already collected and revalidated
 * by the trusted GitHub adapter.
 */
export function composePrGovernanceEvaluation({
  pullRequestEvidence,
  criticalIndicators,
  approvalEvidence,
  ownershipEvidence,
  permissions,
  memberships,
  evidenceCurrent,
}) {
  const { classification, authorizedOrdinaryReviewers } = resolvePrGovernanceClassification({
    criticalIndicatorsPresent: criticalIndicators.criticalIndicatorsPresent,
    approvedReviewDetails: approvalEvidence.approvedReviewDetails,
    permissions,
    memberships,
  });

  const decision = evaluatePrGovernanceEnforcement({
    classification,
    classificationAuthorized:
      classification === 'ORDINARY' && authorizedOrdinaryReviewers.length > 0,
    qualifiedReviewers: ownershipEvidence.qualifiedReviewers,
    ownershipVerified: ownershipEvidence.ownershipVerified,
    evidenceCurrent,
  });

  return {
    mode: 'EVALUATION_ONLY',
    headSha: pullRequestEvidence.headSha,
    baseSha: pullRequestEvidence.baseSha,
    classification,
    criticalIndicators: criticalIndicators.reasons,
    authorizedOrdinaryReviewers,
    approvalEvidence,
    ownershipEvidence,
    decision,
  };
}
