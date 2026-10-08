export type AIErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'DEGRADED'
  | 'NOT_APPLICABLE'
  | 'INTERNAL';

export interface AIError {
  code: AIErrorCode;
  message: string;
  /** If true, caller may retry under default backoff policy. */
  retryable: boolean;
  providerId?: string;
  requestId?: string;
  cause?: unknown;
}

export function isAIError(value: unknown): value is AIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  );
}
