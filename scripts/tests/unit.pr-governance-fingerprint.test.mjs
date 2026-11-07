import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPrGovernanceEvidenceFingerprint,
  isPrGovernanceExternalId,
  prGovernanceExternalId,
} from '../lib/pr-governance.fingerprint.mjs';

const evidence = {
  headSha: 'a'.repeat(40),
  baseSha: 'b'.repeat(40),
  reviews: [
    { login: 'maintainer', state: 'APPROVED', sequence: 0 },
    { login: 'architect', state: 'DISMISSED', sequence: 1 },
  ],
  authority: {
    permissions: [{ reviewer: 'maintainer', permission: 'write' }],
    memberships: [{ reviewer: 'maintainer', team: 'maintainers', active: true }],
  },
};

test('fingerprint canonicalizes object keys and unordered evidence collections', () => {
  const first = createPrGovernanceEvidenceFingerprint(evidence);
  const reordered = createPrGovernanceEvidenceFingerprint({
    authority: {
      memberships: [...evidence.authority.memberships],
      permissions: [...evidence.authority.permissions],
    },
    reviews: [...evidence.reviews].reverse(),
    baseSha: evidence.baseSha,
    headSha: evidence.headSha,
  });

  assert.equal(first, reordered);
});

test('fingerprint changes for HEAD, review, CODEOWNERS, or authority evidence changes', () => {
  const baseline = createPrGovernanceEvidenceFingerprint(evidence);
  const variants = [
    { ...evidence, headSha: 'c'.repeat(40) },
    { ...evidence, reviews: [{ ...evidence.reviews[0], state: 'DISMISSED' }] },
    { ...evidence, codeowners: { sourceSha256: 'd'.repeat(64) } },
    {
      ...evidence,
      authority: {
        ...evidence.authority,
        memberships: [{ reviewer: 'maintainer', team: 'maintainers', active: false }],
      },
    },
  ];

  for (const variant of variants) {
    assert.notEqual(createPrGovernanceEvidenceFingerprint(variant), baseline);
  }
});

test('external ID contains only version markers and the opaque fingerprint', () => {
  const fingerprint = createPrGovernanceEvidenceFingerprint(evidence);
  const externalId = prGovernanceExternalId(fingerprint);

  assert.match(externalId, /^pr-governance-evidence-v1:pr-governance-policy-v1:[a-f0-9]{64}$/);
  assert.equal(isPrGovernanceExternalId(externalId, fingerprint), true);
  assert.equal(isPrGovernanceExternalId(externalId, 'e'.repeat(64)), false);
});

test('rejects incomplete or non-JSON-safe fingerprint input', () => {
  assert.throws(() => createPrGovernanceEvidenceFingerprint(null), /Invalid PR Governance/);
  assert.throws(
    () => createPrGovernanceEvidenceFingerprint({ token: undefined }),
    /JSON-safe values/,
  );
  assert.throws(() => prGovernanceExternalId('invalid'), /Invalid PR Governance evidence/);
});
