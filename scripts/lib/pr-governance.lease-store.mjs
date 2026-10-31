import { randomUUID } from 'node:crypto';
import { transitionPrGovernanceLease } from './pr-governance.lease.mjs';

const DELIVERY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Transactional storage adapter contract:
 *
 * read(id) -> { version, record }
 * compareAndSwap(id, expectedVersion, nextRecord) -> boolean
 *
 * version must be an opaque, immutable revision identifier or null
 * for an absent record. CAS must be atomic and durable.
 */
export function createPrGovernanceLeaseStore({
  storage,
  leaseMs,
  clock = Date.now,
  createToken = randomUUID,
  maxAttempts = 5,
}) {
  if (
    !storage ||
    typeof storage.read !== 'function' ||
    typeof storage.compareAndSwap !== 'function' ||
    !Number.isSafeInteger(leaseMs) ||
    leaseMs < 1 ||
    typeof clock !== 'function' ||
    typeof createToken !== 'function' ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new TypeError('Invalid PN-017 lease store configuration');
  }

  async function transition(id, operation, claimToken) {
    if (typeof id !== 'string' || !DELIVERY_ID.test(id)) {
      throw new TypeError('Invalid PN-017 delivery ID');
    }

    const token = operation === 'CLAIM' ? createToken() : claimToken;

    if (typeof token !== 'string' || !token) {
      throw new TypeError('Invalid PN-017 lease token');
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const snapshot = await storage.read(id);

      if (
        !snapshot ||
        typeof snapshot !== 'object' ||
        !Object.hasOwn(snapshot, 'version') ||
        !Object.hasOwn(snapshot, 'record') ||
        !(
          snapshot.version === null ||
          (typeof snapshot.version === 'string' && snapshot.version.length > 0)
        ) ||
        !(
          snapshot.record === null ||
          (snapshot.version !== null &&
            typeof snapshot.record === 'object' &&
            !Array.isArray(snapshot.record))
        )
      ) {
        throw new TypeError('Invalid PN-017 storage snapshot');
      }

      const { version, record } = snapshot;

      const result = transitionPrGovernanceLease({
        record,
        operation,
        claimToken: token,
        now: clock(),
        leaseMs,
      });

      if (result.status === 'STALE') {
        throw new Error('PN-017 lease is stale or no longer owned');
      }

      if (
        operation === 'CLAIM' &&
        (result.status === 'IN_PROGRESS' || result.status === 'COMPLETED')
      ) {
        return { status: result.status };
      }

      const updated = await storage.compareAndSwap(id, version, result.next);

      if (updated === true) {
        return result.status === 'ACQUIRED'
          ? { status: 'ACQUIRED', claimToken: token }
          : { status: result.status };
      }

      if (updated !== false) {
        throw new TypeError('Invalid PN-017 storage CAS result');
      }
    }

    throw new Error('PN-017 lease transaction contention limit exceeded');
  }

  return {
    claim: (id) => transition(id, 'CLAIM'),
    complete: (id, claimToken) => transition(id, 'COMPLETE', claimToken),
    release: (id, claimToken) => transition(id, 'RELEASE', claimToken),
    renew: (id, claimToken) => transition(id, 'RENEW', claimToken),
  };
}
