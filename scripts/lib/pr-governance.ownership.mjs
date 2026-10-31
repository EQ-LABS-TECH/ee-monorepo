import { evaluateReviewerAuthority } from './pr-governance.approvals.mjs';

/**
 * Evaluates CODEOWNERS coverage per changed file.
 *
 * Ownership requirements must originate from a verified CODEOWNERS
 * resolution against the PR base branch.
 *
 * Approval, permission and membership evidence must originate
 * from trusted GitHub API reads.
 *
 * This function is pure and does not authorize a merge.
 */
export function evaluatePrOwnership({ requirements, approvedReviewers, permissions, memberships }) {
  if (
    !Array.isArray(requirements) ||
    !Array.isArray(approvedReviewers) ||
    !Array.isArray(permissions) ||
    !Array.isArray(memberships) ||
    requirements.length === 0 ||
    requirements.some(
      (requirement) =>
        !requirement ||
        typeof requirement.path !== 'string' ||
        !requirement.path ||
        !Array.isArray(requirement.eligibleTeams) ||
        requirement.eligibleTeams.length === 0 ||
        requirement.eligibleTeams.some((team) => typeof team !== 'string' || !team),
    ) ||
    approvedReviewers.some((reviewer) => typeof reviewer !== 'string' || !reviewer) ||
    permissions.some(
      (permission) =>
        !permission ||
        typeof permission.reviewer !== 'string' ||
        !permission.reviewer ||
        typeof permission.hasWriteAccess !== 'boolean',
    )
  ) {
    throw new TypeError('Invalid PR ownership evidence');
  }

  const approved = new Set(approvedReviewers.map((reviewer) => reviewer.toLowerCase()));

  const candidates = new Map();

  for (const permission of permissions) {
    const reviewer = permission.reviewer.toLowerCase();

    if (candidates.has(reviewer)) {
      throw new TypeError('Duplicate reviewer permission evidence');
    }

    candidates.set(reviewer, permission);
  }

  const coverage = requirements.map((requirement) => {
    const satisfiedBy = [];

    for (const reviewer of approved) {
      const candidate = candidates.get(reviewer);

      if (!candidate) continue;

      const authority = evaluateReviewerAuthority({
        candidate,
        approvedReviewers,
        memberships,
        responsibleTeams: requirement.eligibleTeams,
      });

      if (authority.status === 'ELIGIBLE_EVIDENCE') {
        satisfiedBy.push(reviewer);
      }
    }

    return {
      path: requirement.path,
      eligibleTeams: [...requirement.eligibleTeams],
      satisfiedBy,
      covered: satisfiedBy.length > 0,
    };
  });

  const qualifiedReviewers = [...new Set(coverage.flatMap((entry) => entry.satisfiedBy))];

  const uncoveredPaths = coverage.filter((entry) => !entry.covered).map((entry) => entry.path);

  return {
    status: uncoveredPaths.length === 0 ? 'VERIFIED' : 'UNVERIFIED',
    ownershipVerified: uncoveredPaths.length === 0,
    coverage,
    qualifiedReviewers,
    uncoveredPaths,
  };
}
