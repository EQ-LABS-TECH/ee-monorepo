/**
 * Conservative, path-based critical-change indicators for EE-DOC-005 §08.3.
 * A noncritical result DOES NOT prove that a PR is noncritical: impact-based
 * changes (security, production data, public contracts) require human review.
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
      p.startsWith('scripts/tests/pr-governance.'),
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
    criticalIndicatorsPresent: reasons.length > 0,
    requiresImpactReview: true,
    reasons,
  };
}
