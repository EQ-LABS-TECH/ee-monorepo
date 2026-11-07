import { createHash } from 'node:crypto';

export const EVIDENCE_SCHEMA_VERSION = 'pr-governance-evidence-v1';
export const GOVERNANCE_POLICY_VERSION = 'pr-governance-policy-v1';

const SHA256 = /^[a-f0-9]{64}$/;

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize).sort((left, right) => {
      const first = JSON.stringify(left);
      const second = JSON.stringify(right);
      return first < second ? -1 : first > second ? 1 : 0;
    });
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }

  throw new TypeError('Governance evidence must contain only JSON-safe values');
}

export function createPrGovernanceEvidenceFingerprint(evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new TypeError('Invalid PR Governance evidence fingerprint input');
  }

  const envelope = canonicalize({
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    policyVersion: GOVERNANCE_POLICY_VERSION,
    evidence,
  });

  return createHash('sha256').update(JSON.stringify(envelope), 'utf8').digest('hex');
}

export function prGovernanceExternalId(fingerprint) {
  if (typeof fingerprint !== 'string' || !SHA256.test(fingerprint)) {
    throw new TypeError('Invalid PR Governance evidence fingerprint');
  }

  return `${EVIDENCE_SCHEMA_VERSION}:${GOVERNANCE_POLICY_VERSION}:${fingerprint}`;
}

export function isPrGovernanceExternalId(externalId, fingerprint) {
  return (
    typeof externalId === 'string' &&
    typeof fingerprint === 'string' &&
    SHA256.test(fingerprint) &&
    externalId === prGovernanceExternalId(fingerprint)
  );
}
