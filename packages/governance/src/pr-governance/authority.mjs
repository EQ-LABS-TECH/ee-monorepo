const ORDINARY_DECLARATION = /^EE-LABS-IMPACT: ORDINARY\r?\nHEAD: ([a-f0-9]{40})$/i;
const ARCHITECTURE_TEAM = 'architecture';

function normalizedOrdinaryComment(comment, { headSha, author }) {
  if (
    !comment ||
    typeof comment.login !== 'string' ||
    !comment.login ||
    typeof comment.body !== 'string'
  ) {
    return null;
  }

  const declaration = ORDINARY_DECLARATION.exec(comment.body.trim());
  if (!declaration || declaration[1].toLowerCase() !== headSha.toLowerCase()) return null;

  const reviewer = comment.login.toLowerCase();
  if (reviewer === author.toLowerCase() || reviewer.endsWith('[bot]')) return null;

  return reviewer;
}

export function ordinaryClassificationCandidates({ classificationComments, headSha, author }) {
  if (
    !Array.isArray(classificationComments) ||
    typeof headSha !== 'string' ||
    !/^[a-f0-9]{40}$/i.test(headSha) ||
    typeof author !== 'string' ||
    !author
  ) {
    throw new TypeError('Invalid PR impact classification evidence');
  }

  return [
    ...new Set(
      classificationComments
        .map((comment) => normalizedOrdinaryComment(comment, { headSha, author }))
        .filter(Boolean),
    ),
  ];
}

/** Resolves classification independently from code review approval evidence. */
export function resolvePrGovernanceClassification({
  criticalIndicatorsPresent,
  classificationComments,
  author,
  headSha,
  permissions,
  memberships,
}) {
  if (
    typeof criticalIndicatorsPresent !== 'boolean' ||
    !Array.isArray(permissions) ||
    !Array.isArray(memberships)
  ) {
    throw new TypeError('Invalid PR classification authority evidence');
  }

  const candidates = ordinaryClassificationCandidates({
    classificationComments,
    headSha,
    author,
  });
  const authorizedClassifiers = criticalIndicatorsPresent
    ? []
    : candidates.filter((reviewer) => {
        const permission = permissions.find((entry) => entry.reviewer === reviewer);

        return (
          permission?.hasWriteAccess === true &&
          memberships.some(
            (membership) =>
              membership.reviewer === reviewer &&
              membership.teamSlug === ARCHITECTURE_TEAM &&
              membership.active,
          )
        );
      });

  const classification = criticalIndicatorsPresent
    ? 'CRITICAL'
    : authorizedClassifiers.length > 0
      ? 'ORDINARY'
      : 'PENDING_REVIEW';

  return {
    classification,
    classificationAuthorized: classification === 'CRITICAL' || authorizedClassifiers.length > 0,
    authorizedClassifiers,
  };
}
