const CRITICAL_ESCALATION =
  /^EE-LABS-IMPACT: CRITICAL\r?\nHEAD: ([a-f0-9]{40})\r?\nRATIONALE: (.+)$/i;
const ARCHITECTURE_TEAM = 'ee-labs-architecture';

function normalizedCriticalEscalation(comment, { headSha, author }) {
  if (
    !comment ||
    typeof comment.login !== 'string' ||
    !comment.login ||
    typeof comment.body !== 'string'
  ) {
    return null;
  }

  const declaration = CRITICAL_ESCALATION.exec(comment.body.trim());
  if (!declaration || declaration[1].toLowerCase() !== headSha.toLowerCase()) return null;
  const rationale = declaration[2].trim();
  if (!rationale) return null;

  const reviewer = comment.login.toLowerCase();
  if (reviewer === author.toLowerCase() || reviewer.endsWith('[bot]')) return null;

  return { reviewer, rationale };
}

export function criticalEscalationCandidates({ classificationComments, headSha, author }) {
  if (
    !Array.isArray(classificationComments) ||
    typeof headSha !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(headSha) ||
    typeof author !== 'string' ||
    !author
  ) {
    throw new TypeError('Invalid PR impact classification evidence');
  }

  const candidates = classificationComments
    .map((comment) => normalizedCriticalEscalation(comment, { headSha, author }))
    .filter(Boolean);
  return [...new Map(candidates.map((candidate) => [candidate.reviewer, candidate])).values()];
}

/** Resolves classification independently from code review approval evidence. */
export function resolvePrGovernanceClassification({
  criticalIndicatorsPresent,
  impactEvidenceComplete,
  classificationComments,
  author,
  headSha,
  permissions,
  memberships,
}) {
  if (
    typeof criticalIndicatorsPresent !== 'boolean' ||
    typeof impactEvidenceComplete !== 'boolean' ||
    !Array.isArray(permissions) ||
    !Array.isArray(memberships)
  ) {
    throw new TypeError('Invalid PR classification authority evidence');
  }

  const candidates = criticalEscalationCandidates({
    classificationComments,
    headSha,
    author,
  });
  const authorizedEscalators =
    criticalIndicatorsPresent || !impactEvidenceComplete
      ? []
      : candidates.filter(({ reviewer }) => {
          const permission = permissions.find((entry) => entry.reviewer.toLowerCase() === reviewer);

          return (
            permission?.hasWriteAccess === true &&
            memberships.some(
              (membership) =>
                membership.reviewer.toLowerCase() === reviewer &&
                membership.teamSlug === ARCHITECTURE_TEAM &&
                membership.active,
            )
          );
        });

  const classification = !impactEvidenceComplete
    ? 'PENDING_REVIEW'
    : criticalIndicatorsPresent || authorizedEscalators.length > 0
      ? 'CRITICAL'
      : 'ORDINARY';

  return {
    classification,
    classificationAuthorized: classification !== 'PENDING_REVIEW',
    authorizedEscalators,
  };
}
