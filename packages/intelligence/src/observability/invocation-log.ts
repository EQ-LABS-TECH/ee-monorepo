import type { ObservabilityPolicy } from "./policy.js";
import { DEFAULT_OBSERVABILITY_POLICY } from "./policy.js";
import { redactSensitive } from "./redaction.js";

/** Metadata-only invocation event (SEC-03 / §09.3). */
export interface InvocationLogEvent {
  correlationId: string;
  requestId: string;
  providerId?: string;
  specializationId?: string;
  spiVersion?: string;
  latencyMs?: number;
  errorCode?: string;
  /** Never populated unless policy.allowRawPromptResponse === true. */
  rawPrompt?: string;
  rawResponse?: string;
}

export type InvocationLogSink = (event: InvocationLogEvent) => void;

const noopSink: InvocationLogSink = () => {
  /* default: no external sink; callers may inject */
};

export function createInvocationLogger(
  policy: ObservabilityPolicy = DEFAULT_OBSERVABILITY_POLICY,
  sink: InvocationLogSink = noopSink,
) {
  return {
    policy,
    emit(event: InvocationLogEvent): void {
      const safe: InvocationLogEvent = {
        correlationId: event.correlationId,
        requestId: event.requestId,
        providerId: event.providerId,
        specializationId: event.specializationId,
        spiVersion: event.spiVersion,
        latencyMs: policy.includeLatency ? event.latencyMs : undefined,
        errorCode: event.errorCode,
      };

      if (policy.allowRawPromptResponse) {
        if (event.rawPrompt !== undefined) {
          safe.rawPrompt = redactSensitive(event.rawPrompt);
        }
        if (event.rawResponse !== undefined) {
          safe.rawResponse = redactSensitive(event.rawResponse);
        }
      }

      sink(safe);
    },
  };
}
