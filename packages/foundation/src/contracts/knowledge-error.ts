export type KnowledgeErrorCode =
  | 'UNAVAILABLE'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'INDEX_FAILED'
  | 'QUERY_FAILED'
  | 'NOT_IMPLEMENTED'
  | 'TIMEOUT'
  | 'INTERNAL';

export interface KnowledgeError {
  code: KnowledgeErrorCode;
  message: string;
  retryable: boolean;
  unitId?: string;
  cause?: unknown;
}

export function isKnowledgeError(value: unknown): value is KnowledgeError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  );
}
