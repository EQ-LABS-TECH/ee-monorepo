import { classifyCriticalChange } from '@eq-labs/governance/pr-governance/classification';
import { evaluatePrApprovals } from '@eq-labs/governance/pr-governance/approvals';
import { composePrGovernanceEvaluation } from '@eq-labs/governance/pr-governance/evaluation';
import { readCodeownersEvidence } from './pr-governance.owners-api.mjs';
import { evaluatePrOwnership } from '@eq-labs/governance/pr-governance/ownership';
import {
  readPullRequestEvidence,
  readReviewerRepositoryPermission,
  readReviewerTeamMembership,
  readCodeownerTeamPermission,
  readCodeownerTeamVisibility,
} from './pr-governance.evidence.mjs';

const ARCHITECTURE_TEAM = 'architecture';

function sameSnapshot(first, second) {
  return (
    first.author === second.author &&
    first.headSha === second.headSha &&
    first.baseSha === second.baseSha &&
    JSON.stringify(first.paths) === JSON.stringify(second.paths) &&
    JSON.stringify(first.reviews) === JSON.stringify(second.reviews)
  );
}

async function readAuthorityEvidence({ owner, repo, number, token, reviewers, teams, fetchImpl }) {
  const permissions = await Promise.all(
    reviewers.map((reviewer) =>
      readReviewerRepositoryPermission({
        owner,
        repo,
        number,
        reviewer,
        token,
        fetchImpl,
      }),
    ),
  );

  const memberships = await Promise.all(
    reviewers.flatMap((reviewer) =>
      teams.map((teamSlug) =>
        readReviewerTeamMembership({
          owner,
          teamSlug,
          reviewer,
          token,
          fetchImpl,
        }),
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
        readCodeownerTeamPermission({
          owner,
          repo,
          teamSlug,
          token,
          fetchImpl,
        }),
        readCodeownerTeamVisibility({
          owner,
          teamSlug,
          token,
          fetchImpl,
        }),
      ]);

      if (permission.teamSlug !== visibility.teamSlug) {
        throw new Error('CODEOWNERS team identity mismatch');
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
 * Evaluates PN-017 using GitHub evidence.
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

  const evidence = await readPullRequestEvidence({
    ...locator,
    token,
  });

  const indicators = classifyCriticalChange(evidence.paths);

  const approvals = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: indicators.criticalIndicatorsPresent,
  });

  const codeowners = await readCodeownersEvidence({
    owner,
    repo,
    baseSha: evidence.baseSha,
    paths: evidence.paths,
    token: governanceToken,
    fetchImpl,
  });

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

  const approvedReviewers = approvals.approvedReviewers;

  const teams = new Set(ownershipRequirements.flatMap((requirement) => requirement.eligibleTeams));

  if (!indicators.criticalIndicatorsPresent) {
    teams.add(ARCHITECTURE_TEAM);
  }

  const authorityQuery = {
    owner,
    repo,
    number,
    token: governanceToken,
    reviewers: approvedReviewers,
    teams: [...teams],
    fetchImpl,
  };

  const authorityEvidence = await readAuthorityEvidence(authorityQuery);
  const { permissions, memberships } = authorityEvidence;

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
  const confirmedEvidence = await readPullRequestEvidence({
    ...locator,
    token,
  });

  if (!sameSnapshot(evidence, confirmedEvidence)) {
    throw new Error('PR governance evidence changed during evaluation');
  }

  const confirmedAuthority = await readAuthorityEvidence(authorityQuery);

  if (!sameAuthorityEvidence(authorityEvidence, confirmedAuthority)) {
    throw new Error('PR governance reviewer authority changed during evaluation');
  }

  const confirmedTeamPermissions = await readTeamPermissions(teamPermissionQuery);

  if (JSON.stringify(teamPermissions) !== JSON.stringify(confirmedTeamPermissions)) {
    throw new Error('PR governance CODEOWNERS team permissions changed during evaluation');
  }

  // Recheck the PR after the final permission and membership API calls.
  const finalEvidence = await readPullRequestEvidence({
    ...locator,
    token,
  });

  if (!sameSnapshot(evidence, finalEvidence)) {
    throw new Error('PR governance evidence changed during final verification');
  }

  return composePrGovernanceEvaluation({
    pullRequestEvidence: evidence,
    criticalIndicators: indicators,
    approvalEvidence: approvals,
    ownershipEvidence: ownership,
    permissions,
    memberships,
    evidenceCurrent: true,
  });
}
