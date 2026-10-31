const SHA = /^[0-9a-f]{40}$/i;

export const PR_GOVERNANCE_CHECK_NAME = 'PR Governance';

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
      ].join('\n'),
    },
  };
}
