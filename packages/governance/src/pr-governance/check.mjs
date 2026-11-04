const SHA = /^[0-9a-f]{40}$/i;

export const PR_GOVERNANCE_CHECK_NAME = 'PR Governance';

const TEAM_LABELS = new Map([
  ['architecture', 'Architecture'],
  ['maintainers', 'Maintainers'],
  ['repository-admin', 'Repository Admin'],
  ['contributors', 'Contributors'],
]);

function formatTeam(team) {
  return TEAM_LABELS.get(team.toLowerCase()) ?? team;
}

function approvalDetails(evaluation) {
  const { decision, ownershipEvidence } = evaluation;
  const lines = [];

  if (
    Number.isSafeInteger(decision.qualifiedApprovalCount) &&
    Number.isSafeInteger(decision.requiredCount) &&
    decision.requiredCount >= 0
  ) {
    const pending = Math.max(0, decision.requiredCount - decision.qualifiedApprovalCount);
    lines.push(
      `Qualified approvals: ${decision.qualifiedApprovalCount} / ${decision.requiredCount}`,
      `Pending qualified approvals: ${pending}`,
    );
  } else if (decision.requiredCount === null) {
    lines.push('Approval threshold: not evaluated while classification is pending.');
  } else {
    lines.push('Approval count: unavailable from the evaluation evidence.');
  }

  const coverage = ownershipEvidence?.coverage;
  if (!Array.isArray(coverage) || coverage.length === 0) {
    lines.push('Eligible reviewer teams: unavailable from CODEOWNERS evidence.');
  } else {
    const groups = new Map();

    for (const entry of coverage) {
      const teams = (Array.isArray(entry?.eligibleTeams) ? entry.eligibleTeams : [])
        .filter((team) => typeof team === 'string' && team)
        .map((team) => team.toLowerCase());
      const uniqueTeams = [...new Set(teams)].sort();
      if (uniqueTeams.length === 0) continue;

      const key = uniqueTeams.join(',');
      const group = groups.get(key) ?? { teams: uniqueTeams, files: 0, covered: 0 };
      group.files += 1;
      if (entry.covered === true) group.covered += 1;
      groups.set(key, group);
    }

    const formattedGroups = [...groups.values()];
    if (formattedGroups.length === 1 && formattedGroups[0].teams.length === 1) {
      const [team] = formattedGroups[0].teams;
      const required = decision.requiredCount;
      lines.push(
        required === 1 || required === 2
          ? `Required reviewer team: ${formatTeam(team)} (${required} distinct qualified approvals total).`
          : `Eligible reviewer team: ${formatTeam(team)}.`,
      );
    } else if (formattedGroups.length > 0) {
      lines.push('Eligible reviewer teams by CODEOWNERS file group:');
      for (const group of formattedGroups) {
        const labels = group.teams.map(formatTeam).join(' or ');
        lines.push(
          `- ${labels}: ownership coverage ${group.covered} / ${group.files} changed files`,
        );
      }
    } else {
      lines.push('Eligible reviewer teams: unavailable from CODEOWNERS evidence.');
    }
  }

  const reasonLabels = new Map([
    ['impact-classification-pending', 'Impact classification is pending.'],
    ['ordinary-classification-not-authorized', 'ORDINARY classification is not authorized.'],
    ['codeowner-eligibility-not-verified', 'CODEOWNERS reviewer eligibility is not verified.'],
    ['evidence-not-current', 'Governance evidence is no longer current.'],
    ['insufficient-qualified-approvals', 'The qualified approval threshold has not been met.'],
  ]);
  const reasons = Array.isArray(decision.reasons) ? decision.reasons : [];
  if (reasons.length > 0) {
    lines.push('Blocking reasons:');
    for (const reason of reasons) {
      lines.push(`- ${reasonLabels.get(reason) ?? 'Additional governance requirement is unmet.'}`);
    }
  }

  return lines;
}

export function createPrGovernanceCheckPayload({ evaluation, expectedHeadSha }) {
  if (
    !evaluation ||
    typeof evaluation !== 'object' ||
    !SHA.test(expectedHeadSha ?? '') ||
    !SHA.test(evaluation.headSha ?? '') ||
    evaluation.headSha.toLowerCase() !== expectedHeadSha.toLowerCase() ||
    evaluation.mode !== 'EVALUATION_ONLY' ||
    !['CRITICAL', 'ORDINARY', 'PENDING_REVIEW'].includes(evaluation.classification) ||
    !evaluation.decision ||
    !['PASS', 'BLOCKED'].includes(evaluation.decision.status)
  ) {
    throw new TypeError('Invalid PR governance check evidence');
  }

  const passed = evaluation.decision.status === 'PASS';

  if (passed && evaluation.classification === 'PENDING_REVIEW') {
    throw new TypeError('Pending classification cannot produce a successful check');
  }

  return {
    name: PR_GOVERNANCE_CHECK_NAME,
    head_sha: expectedHeadSha.toLowerCase(),
    status: 'completed',
    conclusion: passed ? 'success' : 'failure',
    output: {
      title: passed ? 'PN-017 governance verified' : 'PN-017 governance blocked',
      summary: [
        `Classification: ${evaluation.classification}`,
        `Decision: ${evaluation.decision.status}`,
        ...approvalDetails(evaluation),
      ].join('\n'),
    },
  };
}
