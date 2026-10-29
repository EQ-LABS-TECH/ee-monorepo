/** PN-017: read-only, advisory PR governance evidence. Never authorizes a merge. */
import { readPullRequestEvidence } from './pr-governance.evidence.mjs';
import { classifyCriticalChange } from './pr-governance.classification.mjs';
import { evaluatePrApprovals } from './pr-governance.approvals.mjs';

export async function inspectPrGovernance({ owner, repo, number, token, fetchImpl }) {
  const evidence = await readPullRequestEvidence({ owner, repo, number, token, fetchImpl });
  const classification = classifyCriticalChange(evidence.paths);
  const evaluation = evaluatePrApprovals({
    author: evidence.author,
    headSha: evidence.headSha,
    reviews: evidence.reviews,
    critical: classification.criticalIndicatorsPresent,
  });
  // Lack of path indicators is not an affirmative noncritical classification.
  // Even when approvals are numerically sufficient, this cannot certify a merge.
  return {
    mode: 'ADVISORY',
    status: 'PENDING',
    headSha: evidence.headSha,
    classification,
    approvalEvidence: evaluation,
    reasons: [
      'impact-classification-requires-authorized-review',
      'review-evidence-must-be-current-at-merge',
      'transitional-exception-not-implemented',
    ],
  };
}
