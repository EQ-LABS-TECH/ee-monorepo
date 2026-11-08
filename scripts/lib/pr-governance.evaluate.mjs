import { classifyCriticalChange } from '@eq-labs/governance/pr-governance/classification';
import { evaluatePrApprovals } from '@eq-labs/governance/pr-governance/approvals';
import { composePrGovernanceEvaluation } from '@eq-labs/governance/pr-governance/evaluation';
import {
  criticalEscalationCandidates,
  resolvePrGovernanceClassification,
} from '@eq-labs/governance/pr-governance/authority';
import { readCodeownersEvidence } from './pr-governance.owners-api.mjs';
import { createPrGovernanceEvidenceFingerprint } from './pr-governance.fingerprint.mjs';
import { evaluatePrOwnership } from '@eq-labs/governance/pr-governance/ownership';
import {
  readPullRequestEvidence,
  readReviewerRepositoryPermission,
  readReviewerTeamMembership,
  readCodeownerTeamPermission,
  readCodeownerTeamVisibility,
} from './pr-governance.evidence.mjs';
import { withGovernanceOperation } from './pr-governance.github-error.mjs';

const ARCHITECTURE_TEAM = 'ee-labs-architecture';

function sameSnapshot(first, second) {
  return (
    first.author === second.author &&
    first.headSha === second.headSha &&
    first.headRepository === second.headRepository &&
    first.baseSha === second.baseSha &&
    first.baseRef === second.baseRef &&
    JSON.stringify(first.paths) === JSON.stringify(second.paths) &&
    JSON.stringify(first.reviews) === JSON.stringify(second.reviews) &&
    JSON.stringify(first.classificationComments) === JSON.stringify(second.classificationComments)
  );
}

async function readAuthorityEvidence({ owner, repo, number, token, reviewers, teams, fetchImpl }) {
  const permissions = await Promise.all(
    reviewers.map((reviewer) =>
      withGovernanceOperation('reviewer-repository-permission', reviewer, () =>
        readReviewerRepositoryPermission({
          owner,
          repo,
          number,
          reviewer,
          token,
          fetchImpl,
        }),
      ),
    ),
  );

  const memberships = await Promise.all(
    reviewers.flatMap((reviewer) =>
      teams.map((teamSlug) =>
        withGovernanceOperation('reviewer-team-membership', teamSlug, () =>
          readReviewerTeamMembership({
            owner,
            teamSlug,
            reviewer,
            token,
            fetchImpl,
          }),
        ),
      ),
    ),
  );

  return { permissions, memberships };
}

function sameAuthorityEvidence(first, second) {
  return (
    JSON.stringify(first.permissions) === JSON.stringify(second.permissions) &&
    JSON.stringify(first.memberships) === JSON.stringify(second.memberships)
  );
}

async function readTeamPermissions({ owner, repo, teams, token, fetchImpl }) {
  return Promise.all(
    teams.map(async (teamSlug) => {
      const [permission, visibility] = await Promise.all([
        withGovernanceOperation('codeowner-team-repository-permission', teamSlug, () =>
          readCodeownerTeamPermission({
            owner,
            repo,
            teamSlug,
            token,
            fetchImpl,
          }),
        ),
        withGovernanceOperation('codeowner-team-visibility', teamSlug, () =>
          readCodeownerTeamVisibility({
            owner,
            teamSlug,
            token,
            fetchImpl,
          }),
        ),
      ]);

      if (permission.teamSlug !== visibility.teamSlug) {
        const error = new Error('CODEOWNERS team identity mismatch');
        error.governanceOperation = 'codeowner-team-identity';
        error.governanceSubject = teamSlug;
        throw error;
      }

      return {
        teamSlug: permission.teamSlug,
        hasWriteAccess: permission.hasWriteAccess,
        visible: visibility.visible,
      };
    }),
  );
}

/**
 * Evaluates PR Governance using GitHub evidence.
 *
 * The caller must provide tokens obtained in a trusted execution context.
 * A PASS is an internal policy result, not a GitHub merge authorization.
 */
export async function evaluatePrGovernance({
  owner,
  repo,
  number,
  token,
  governanceToken,
  fetchImpl,
}) {
  if (typeof governanceToken !== 'string' || !governanceToken) {
    throw new TypeError('A separate governance token is required');
  }

  const locator = { owner, repo, number, fetchImpl };

  const evidence = await withGovernanceOperation('pull-request-evidence', null, () =>
    readPullRequestEvidence({
      ...locator,
      token,
    }),
  );

  const indicators = classifyCriticalChange(evidence.paths);

  const initialApprovals = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: indicators.criticalIndicatorsPresent,
  });

  const codeowners = await withGovernanceOperation('codeowners-evidence', null, () =>
    readCodeownersEvidence({
      owner,
      repo,
      baseSha: evidence.baseSha,
      paths: evidence.paths,
      token: governanceToken,
      fetchImpl,
    }),
  );

  const ownerTeams = [...new Set(codeowners.requirements.flatMap((entry) => entry.eligibleTeams))];

  const teamPermissionQuery = {
    owner,
    repo,
    teams: ownerTeams,
    token: governanceToken,
    fetchImpl,
  };

  const teamPermissions = await readTeamPermissions(teamPermissionQuery);

  const writableTeams = new Set(
    teamPermissions
      .filter((entry) => entry.hasWriteAccess && entry.visible)
      .map((entry) => entry.teamSlug),
  );

  const ownershipRequirements = codeowners.requirements.map((entry) => ({
    ...entry,
    eligibleTeams: entry.eligibleTeams.filter((team) => writableTeams.has(team.toLowerCase())),
  }));

  const approvedReviewers = initialApprovals.approvedReviewers;
  const classificationCandidates =
    indicators.criticalIndicatorsPresent || !indicators.evidenceComplete
      ? []
      : criticalEscalationCandidates({
          classificationComments: evidence.classificationComments,
          headSha: evidence.headSha,
          author: evidence.author,
        });
  const escalationReviewers = classificationCandidates.map(({ reviewer }) => reviewer);
  const authorityReviewers = [...new Set([...approvedReviewers, ...escalationReviewers])];

  const teams = new Set(ownershipRequirements.flatMap((requirement) => requirement.eligibleTeams));

  if (escalationReviewers.length > 0) {
    teams.add(ARCHITECTURE_TEAM);
  }

  const authorityQuery = {
    owner,
    repo,
    number,
    token: governanceToken,
    reviewers: authorityReviewers,
    teams: [...teams],
    fetchImpl,
  };

  const authorityEvidence = await withGovernanceOperation('reviewer-authority', null, () =>
    readAuthorityEvidence(authorityQuery),
  );
  const { permissions, memberships } = authorityEvidence;

  const classification = resolvePrGovernanceClassification({
    criticalIndicatorsPresent: indicators.criticalIndicatorsPresent,
    impactEvidenceComplete: indicators.evidenceComplete,
    classificationComments: evidence.classificationComments,
    author: evidence.author,
    headSha: evidence.headSha,
    permissions,
    memberships,
  });

  const approvals = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: classification.classification === 'CRITICAL',
  });

  const ownership = ownershipRequirements.some(
    (requirement) => requirement.eligibleTeams.length === 0,
  )
    ? {
        status: 'UNVERIFIED',
        ownershipVerified: false,
        coverage: [],
        qualifiedReviewers: [],
        uncoveredPaths: ownershipRequirements
          .filter((requirement) => requirement.eligibleTeams.length === 0)
          .map((requirement) => requirement.path),
      }
    : evaluatePrOwnership({
        requirements: ownershipRequirements,
        approvedReviewers,
        permissions,
        memberships,
      });

  // Re-read after all external queries. An earlier snapshot cannot
  // establish that permissions, ownership and reviews are still valid.
  const confirmedEvidence = await withGovernanceOperation('confirm-pr-evidence', null, () =>
    readPullRequestEvidence({
      ...locator,
      token,
    }),
  );

  if (!sameSnapshot(evidence, confirmedEvidence)) {
    throw new Error('PR governance evidence changed during evaluation');
  }

  const confirmedAuthority = await withGovernanceOperation('confirm-reviewer-authority', null, () =>
    readAuthorityEvidence(authorityQuery),
  );

  if (!sameAuthorityEvidence(authorityEvidence, confirmedAuthority)) {
    throw new Error('PR governance reviewer authority changed during evaluation');
  }

  const confirmedTeamPermissions = await withGovernanceOperation(
    'confirm-codeowner-team-permissions',
    null,
    () => readTeamPermissions(teamPermissionQuery),
  );

  if (JSON.stringify(teamPermissions) !== JSON.stringify(confirmedTeamPermissions)) {
    throw new Error('PR governance CODEOWNERS team permissions changed during evaluation');
  }

  // Recheck the PR after the final permission and membership API calls.
  const finalEvidence = await withGovernanceOperation('final-pr-evidence', null, () =>
    readPullRequestEvidence({
      ...locator,
      token,
    }),
  );

  if (!sameSnapshot(evidence, finalEvidence)) {
    throw new Error('PR governance evidence changed during final verification');
  }

  const evaluation = composePrGovernanceEvaluation({
    pullRequestEvidence: evidence,
    criticalIndicators: indicators,
    approvalEvidence: approvals,
    ownershipEvidence: ownership,
    permissions,
    memberships,
    evidenceCurrent: true,
  });

  evaluation.evidenceFingerprint = createPrGovernanceEvidenceFingerprint({
    repository: { owner: owner.toLowerCase(), repo: repo.toLowerCase(), number },
    pullRequest: evidence,
    criticalIndicators: indicators,
    codeowners: {
      baseSha: codeowners.baseSha,
      sourcePath: codeowners.sourcePath,
      sourceSha256: codeowners.sourceSha256,
      requirements: codeowners.requirements,
    },
    codeownerTeamPermissions: teamPermissions,
    reviewerAuthority: authorityEvidence,
    classification,
    approvals,
    ownership,
    decision: evaluation.decision,
  });

  return evaluation;
}
