/** PR Governance: read-only, advisory PR governance evidence. Never authorizes a merge. */
import { classifyCriticalChange } from '@eq-labs/governance/pr-governance/classification';
import { evaluatePrApprovals } from '@eq-labs/governance/pr-governance/approvals';
import { criticalEscalationCandidates } from '@eq-labs/governance/pr-governance/authority';
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

  const escalationCandidates =
    classification.criticalIndicatorsPresent || !classification.evidenceComplete
      ? []
      : criticalEscalationCandidates({
          classificationComments: evidence.classificationComments,
          headSha: evidence.headSha,
          author: evidence.author,
        }).map(({ reviewer }) => ({ reviewer, headSha: evidence.headSha }));

  const permissionEvidence = await Promise.all(
    escalationCandidates.map(async (candidate) => {
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

  const authorizedEscalators = [];

  if (membershipToken !== undefined) {
    if (typeof membershipToken !== 'string' || !membershipToken) {
      throw new TypeError('Invalid governance membership token');
    }

    const memberships = await Promise.all(
      candidatesWithPermissions.map((candidate) =>
        readReviewerTeamMembership({
          owner,
          teamSlug: 'ee-labs-architecture',
          reviewer: candidate.reviewer,
          token: membershipToken,
          fetchImpl,
        }),
      ),
    );

    for (const membership of memberships) {
      if (membership.active) {
        authorizedEscalators.push(membership.reviewer);
      }
    }
  }

  if (escalationCandidates.length > 0) {
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
      JSON.stringify(confirmedEvidence.reviews) !== JSON.stringify(evidence.reviews) ||
      JSON.stringify(confirmedEvidence.classificationComments) !==
        JSON.stringify(evidence.classificationComments)
    ) {
      throw new Error('PR governance evidence changed while verifying reviewer permissions');
    }
  }

  const evaluation = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: classification.criticalIndicatorsPresent || authorizedEscalators.length > 0,
  });

  // Advisory evidence never authorizes a merge. Complete paths without a
  // critical indicator classify as ordinary unless an authorized escalation exists.

  return {
    mode: 'ADVISORY',
    status: 'PENDING',
    headSha: evidence.headSha,
    classification: {
      ...classification,
      status: classification.criticalIndicatorsPresent
        ? 'CRITICAL'
        : !classification.evidenceComplete
          ? 'PENDING_REVIEW'
          : authorizedEscalators.length > 0
            ? 'CRITICAL'
            : 'ORDINARY',
    },
    approvalEvidence: evaluation,
    criticalEscalationEvidence: {
      status:
        authorizedEscalators.length > 0
          ? 'VERIFIED'
          : escalationCandidates.length > 0
            ? 'UNVERIFIED'
            : 'NOT_REQUIRED',
      candidates: candidatesWithPermissions,
      authorizedReviewers: authorizedEscalators,
      reason:
        authorizedEscalators.length > 0
          ? 'architecture-escalation-verified'
          : escalationCandidates.length > 0
            ? 'architecture-escalation-not-verified'
            : 'critical-escalation-not-requested',
    },
    reasons: ['review-evidence-must-be-current-at-merge', 'transitional-exception-not-implemented'],
  };
}
