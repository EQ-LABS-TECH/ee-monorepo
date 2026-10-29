import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCriticalChange } from '../lib/pr-governance.classification.mjs';

test('identifies governance changes as critical indicators', () => {
  const result = classifyCriticalChange(['.github/workflows/ci.yml', '.github/CODEOWNERS']);
  assert.deepEqual(
    result.reasons.map((r) => r.category),
    ['github-governance', 'github-governance'],
  );
  assert.equal(result.criticalIndicatorsPresent, true);
});

test('identifies release, public contract and infrastructure surfaces', () => {
  const result = classifyCriticalChange([
    'scripts/commands/release',
    'scripts/lib/release-integrity.mjs',
    'packages/foundation/src/contracts/provider.ts',
    'infra/example.yml',
  ]);
  assert.deepEqual(
    result.reasons.map((r) => r.category),
    ['release-workflow', 'release-workflow', 'public-contract', 'platform-infrastructure'],
  );
});

test('ordinary paths still require impact review', () => {
  const result = classifyCriticalChange(['README.md', 'apps/dashboard/src/main.ts']);
  assert.equal(result.criticalIndicatorsPresent, false);
  assert.equal(result.requiresImpactReview, true);
  assert.deepEqual(result.reasons, []);
});

test('handles path normalization without duplicate indicators', () => {
  const result = classifyCriticalChange(['.\\.github\\CODEOWNERS', '.github/CODEOWNERS']);
  assert.equal(result.reasons.length, 1);
});

test('rejects invalid and unsafe inputs', () => {
  assert.throws(() => classifyCriticalChange('a'), TypeError);
  assert.throws(() => classifyCriticalChange([null]), TypeError);
  assert.throws(() => classifyCriticalChange(['../.github/ci.yml']), TypeError);
  assert.throws(() => classifyCriticalChange(['/etc/passwd']), TypeError);
});
