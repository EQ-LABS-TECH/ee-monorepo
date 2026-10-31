import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE = /^sha256=([a-f0-9]{64})$/i;
const EVENT_NAME = /^[a-z][a-z_]*$/;

export function authenticatePrGovernanceWebhook({ rawBody, signature, eventName, secret }) {
  if (
    !Buffer.isBuffer(rawBody) ||
    typeof signature !== 'string' ||
    typeof eventName !== 'string' ||
    !EVENT_NAME.test(eventName) ||
    typeof secret !== 'string' ||
    !secret
  ) {
    throw new TypeError('Invalid PN-017 webhook authentication request');
  }

  const match = SIGNATURE.exec(signature);

  if (!match) {
    throw new Error('Invalid PN-017 webhook signature');
  }

  const expected = createHmac('sha256', secret).update(rawBody).digest();

  const received = Buffer.from(match[1], 'hex');

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error('Invalid PN-017 webhook signature');
  }

  let payload;

  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new TypeError('Invalid PN-017 webhook JSON');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('Invalid PN-017 webhook payload');
  }

  return {
    authenticated: true,
    eventName,
    payload,
  };
}
