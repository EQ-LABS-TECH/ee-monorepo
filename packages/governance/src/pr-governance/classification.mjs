/**
 * Conservative, path-based critical-change indicators for EE-DOC-005 §08.3.
 * A complete path set without a critical indicator is ORDINARY. Missing or
 * incomplete path evidence is handled as PENDING_REVIEW by the caller.
 * Pure and dependency-free so the classification can be tested independently.
 */
const RULES = Object.freeze([
  { id: 'github-governance', match: (p) => p.startsWith('.github/') },
  {
    id: 'release-workflow',
    match: (p) =>
      p === 'scripts/commands/release' ||
      p.startsWith('scripts/lib/release-') ||
      p.startsWith('scripts/lib/reconstruct-release-plan'),
  },
  {
    id: 'pr-governance',
    match: (p) =>
      p === 'scripts/commands/governance' ||
      p.startsWith('scripts/lib/pr-governance.') ||
      p.startsWith('scripts/tests/pr-governance.') ||
      p.startsWith('scripts/tests/unit.pr-governance-') ||
      p.startsWith('packages/governance/src/pr-governance/'),
  },
  { id: 'public-contract', match: (p) => p.startsWith('packages/foundation/src/contracts/') },
  { id: 'platform-infrastructure', match: (p) => p.startsWith('infra/') },
]);

function normalizePath(path) {
  if (typeof path !== 'string' || !path.length || path.includes('\0')) {
    throw new TypeError('Changed file paths must be nonempty strings without NUL');
  }
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '');
  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new TypeError(`Unsafe changed file path: ${path}`);
  }
  return normalized;
}

export function classifyCriticalChange(paths) {
  if (!Array.isArray(paths)) throw new TypeError('paths must be an array');
  if (paths.length === 0) {
    return {
      status: 'PENDING_REVIEW',
      criticalIndicatorsPresent: false,
      evidenceComplete: false,
      requiresImpactReview: true,
      reasons: [],
    };
  }
  const reasons = [];
  const seen = new Set();
  for (const raw of paths) {
    const path = normalizePath(raw);
    for (const rule of RULES) {
      if (!rule.match(path)) continue;
      const key = `${rule.id}:${path}`;
      if (!seen.has(key)) reasons.push({ category: rule.id, path });
      seen.add(key);
    }
  }
  return {
    status: reasons.length > 0 ? 'CRITICAL' : 'ORDINARY',
    criticalIndicatorsPresent: reasons.length > 0,
    evidenceComplete: true,
    requiresImpactReview: reasons.length > 0,
    reasons,
  };
}
