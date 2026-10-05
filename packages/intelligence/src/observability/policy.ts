/**
 * Observability policy — EE-DOC-013 §09.3 / AI-09.
 * Default: no raw prompt/response persistence or logging.
 */
export interface ObservabilityPolicy {
  /** Default false. Raw bodies only with explicit opt-in + versioned policy. */
  allowRawPromptResponse: boolean;
  /** Include latencyMs in metadata events. */
  includeLatency: boolean;
}

export const DEFAULT_OBSERVABILITY_POLICY: ObservabilityPolicy = {
  allowRawPromptResponse: false,
  includeLatency: true,
};
