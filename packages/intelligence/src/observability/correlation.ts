import { randomUUID } from 'node:crypto';

/** Correlation id for cross-service traces (AI-09). */
export function createCorrelationId(): string {
  return randomUUID();
}
