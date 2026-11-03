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
  const { classification, classificationAuthorized, authorizedEscalators } =
    resolvePrGovernanceClassification({
      criticalIndicatorsPresent: criticalIndicators.criticalIndicatorsPresent,
      impactEvidenceComplete: criticalIndicators.evidenceComplete,
      classificationComments: pullRequestEvidence.classificationComments,
      author: pullRequestEvidence.author,
      headSha: pullRequestEvidence.headSha,
      permissions,
      memberships,
    });

  const decision = evaluatePrGovernanceEnforcement({
    classification,
    classificationAuthorized,
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
    authorizedEscalators,
    classificationEvidence: pullRequestEvidence.classificationComments,
    approvalEvidence,
    ownershipEvidence,
    decision,
  };
}
