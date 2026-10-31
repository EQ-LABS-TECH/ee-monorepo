/** PN-017: read-only, advisory PR governance evidence. Never authorizes a merge. */
import { classifyCriticalChange } from './pr-governance.classification.mjs';
import { evaluatePrApprovals } from './pr-governance.approvals.mjs';
import {
  readPullRequestEvidence,
  readReviewerRepositoryPermission,
  readReviewerTeamMembership,
} from './pr-governance.evidence.mjs';

export async function inspectPrGovernance({
  owner,
  repo,
  number,
  token,
  membershipToken,
  fetchImpl,
}) {
  const evidence = await readPullRequestEvidence({ owner, repo, number, token, fetchImpl });
  const classification = classifyCriticalChange(evidence.paths);
  const evaluation = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: classification.criticalIndicatorsPresent,
  });

  const ordinaryCandidates = classification.criticalIndicatorsPresent
    ? []
    : evaluation.approvedReviewDetails
        .filter((review) => review.body.trim() === 'EE-LABS-IMPACT: ORDINARY')
        .map(({ reviewer, commitId }) => ({
          reviewer,
          commitId,
        }));

  const permissionEvidence = await Promise.all(
    ordinaryCandidates.map(async (candidate) => {
      const permission = await readReviewerRepositoryPermission({
        owner,
        repo,
        number,
        reviewer: candidate.reviewer,
        token,
        fetchImpl,
      });

      return {
        ...candidate,
        permission: permission.permission,
        roleName: permission.roleName,
        hasWriteAccess: permission.hasWriteAccess,
      };
    }),
  );

  const candidatesWithPermissions = permissionEvidence.filter(
    (candidate) => candidate.hasWriteAccess,
  );

  const authorizedOrdinaryReviewers = [];

  if (membershipToken !== undefined) {
    if (typeof membershipToken !== 'string' || !membershipToken) {
      throw new TypeError('Invalid governance membership token');
    }

    const memberships = await Promise.all(
      candidatesWithPermissions.map((candidate) =>
        readReviewerTeamMembership({
          owner,
          teamSlug: 'architecture',
          reviewer: candidate.reviewer,
          token: membershipToken,
          fetchImpl,
        }),
      ),
    );

    for (const membership of memberships) {
      if (membership.active) {
        authorizedOrdinaryReviewers.push(membership.reviewer);
      }
    }
  }

  if (ordinaryCandidates.length > 0) {
    const confirmedEvidence = await readPullRequestEvidence({
      owner,
      repo,
      number,
      token,
      fetchImpl,
    });

    if (
      confirmedEvidence.headSha !== evidence.headSha ||
      confirmedEvidence.baseSha !== evidence.baseSha ||
      confirmedEvidence.author !== evidence.author ||
      JSON.stringify(confirmedEvidence.paths) !== JSON.stringify(evidence.paths) ||
      JSON.stringify(confirmedEvidence.reviews) !== JSON.stringify(evidence.reviews)
    ) {
      throw new Error('PR governance evidence changed while verifying reviewer permissions');
    }
  }

  // Lack of path indicators is not an affirmative noncritical classification.
  // Even when approvals are numerically sufficient, this cannot certify a merge.

  return {
    mode: 'ADVISORY',
    status: 'PENDING',
    headSha: evidence.headSha,
    classification: {
      ...classification,
      status: classification.criticalIndicatorsPresent
        ? 'CRITICAL'
        : authorizedOrdinaryReviewers.length > 0
          ? 'ORDINARY'
          : 'PENDING_REVIEW',
    },
    approvalEvidence: evaluation,
    ordinaryClassificationEvidence: {
      status: authorizedOrdinaryReviewers.length > 0 ? 'VERIFIED' : 'UNVERIFIED',
      candidates: candidatesWithPermissions,
      authorizedReviewers: authorizedOrdinaryReviewers,
      reason:
        authorizedOrdinaryReviewers.length > 0
          ? 'architecture-membership-verified'
          : 'reviewer-authority-not-yet-verified',
    },
    reasons: [
      'impact-classification-requires-authorized-review',
      'review-evidence-must-be-current-at-merge',
      'transitional-exception-not-implemented',
    ],
  };
}
