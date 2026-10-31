const STATES = new Set(['IN_PROGRESS', 'COMPLETED']);
const POSITIVE_TIME = (value) => Number.isSafeInteger(value) && value > 0;

function validRecord(record) {
  if (!record || typeof record !== 'object' || !STATES.has(record.status)) {
    return false;
  }

  if (record.status === 'COMPLETED') {
    return POSITIVE_TIME(record.completedAt);
  }

  return (
    typeof record.claimToken === 'string' &&
    record.claimToken.length > 0 &&
    POSITIVE_TIME(record.expiresAt)
  );
}

/**
 * Pure lease transition.
 * The storage adapter must commit changes atomically using CAS or
 * an equivalent conditional transaction.
 *
 * null indicates no existing delivery record.
 */
export function transitionPrGovernanceLease({ record, operation, claimToken, now, leaseMs }) {
  if (
    (record !== null && !validRecord(record)) ||
    !['CLAIM', 'COMPLETE', 'RELEASE', 'RENEW'].includes(operation) ||
    !POSITIVE_TIME(now) ||
    typeof claimToken !== 'string' ||
    !claimToken
  ) {
    throw new TypeError('Invalid PN-017 lease transition');
  }

  if (operation === 'CLAIM') {
    if (!POSITIVE_TIME(leaseMs) || !Number.isSafeInteger(now + leaseMs)) {
      throw new TypeError('Invalid PN-017 lease duration');
    }

    if (record?.status === 'COMPLETED') {
      return { status: 'COMPLETED', next: record };
    }

    if (record?.status === 'IN_PROGRESS' && record.expiresAt > now) {
      return { status: 'IN_PROGRESS', next: record };
    }

    return {
      status: 'ACQUIRED',
      next: {
        status: 'IN_PROGRESS',
        claimToken,
        expiresAt: now + leaseMs,
      },
    };
  }

  // Operations from expired or superseded leases must not mutate state.
  if (
    record?.status !== 'IN_PROGRESS' ||
    record.claimToken !== claimToken ||
    record.expiresAt <= now
  ) {
    return { status: 'STALE', next: record };
  }

  if (operation === 'RENEW') {
    if (!POSITIVE_TIME(leaseMs) || !Number.isSafeInteger(now + leaseMs)) {
      throw new TypeError('Invalid PN-017 lease duration');
    }

    return {
      status: 'RENEWED',
      next: {
        status: 'IN_PROGRESS',
        claimToken,
        expiresAt: Math.max(record.expiresAt, now + leaseMs),
      },
    };
  }

  if (operation === 'COMPLETE') {
    return {
      status: 'COMPLETED',
      next: {
        status: 'COMPLETED',
        completedAt: now,
      },
    };
  }

  return { status: 'RELEASED', next: null };
}
