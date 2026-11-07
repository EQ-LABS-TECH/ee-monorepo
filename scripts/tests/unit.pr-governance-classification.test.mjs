import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCriticalChange } from '@eq-labs/governance/pr-governance/classification';

test('identifies governance changes as critical indicators', () => {
  const result = classifyCriticalChange(['.github/workflows/ci.yml', '.github/CODEOWNERS']);
  assert.deepEqual(
    result.reasons.map((r) => r.category),
    ['github-governance', 'github-governance'],
  );
  assert.equal(result.criticalIndicatorsPresent, true);
});

test('identifies the governance package domain as a critical indicator', () => {
  const result = classifyCriticalChange([
    'packages/governance/src/pr-governance/classification.mjs',
  ]);

  assert.deepEqual(result.reasons, [
    {
      category: 'pr-governance',
      path: 'packages/governance/src/pr-governance/classification.mjs',
    },
  ]);
});

test('identifies renamed PR governance policy tests as critical indicators', () => {
  const path = 'scripts/tests/unit.pr-governance-classification.test.mjs';
  const result = classifyCriticalChange([path]);

  assert.deepEqual(result.reasons, [{ category: 'pr-governance', path }]);
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

test('complete paths without critical indicators classify as ordinary', () => {
  const result = classifyCriticalChange(['README.md', 'apps/dashboard/src/main.ts']);
  assert.equal(result.criticalIndicatorsPresent, false);
  assert.equal(result.status, 'ORDINARY');
  assert.equal(result.evidenceComplete, true);
  assert.equal(result.requiresImpactReview, false);
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

test('critical indicators produce an explicit CRITICAL status', () => {
  const result = classifyCriticalChange(['.github/workflows/release.yml']);

  assert.equal(result.status, 'CRITICAL');
  assert.equal(result.criticalIndicatorsPresent, true);
  assert.equal(result.requiresImpactReview, true);
});

test('empty changed-path evidence remains pending', () => {
  const result = classifyCriticalChange([]);
  assert.equal(result.status, 'PENDING_REVIEW');
  assert.equal(result.evidenceComplete, false);
});

test('absence of critical indicators classifies complete paths as ordinary', () => {
  const result = classifyCriticalChange(['apps/dashboard/src/main.ts']);

  assert.equal(result.status, 'ORDINARY');
  assert.equal(result.criticalIndicatorsPresent, false);
  assert.equal(result.requiresImpactReview, false);
});

test('mixed changes cannot downgrade a critical classification', () => {
  const result = classifyCriticalChange([
    'README.md',
    '.github/CODEOWNERS',
    'apps/dashboard/src/main.ts',
  ]);

  assert.equal(result.status, 'CRITICAL');
  assert.ok(result.reasons.some((reason) => reason.category === 'github-governance'));
});
