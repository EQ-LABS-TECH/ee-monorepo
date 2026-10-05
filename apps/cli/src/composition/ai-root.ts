/**
 * Composition root (evidence) — EE-DOC-006 §13.5 / EE-ADR-005 /
 * EE-IMP-013-P04 (routing) + EE-IMP-013-P05 (observability).
 */
import type {
  AIError,
  CatalogPort,
  InferenceRequest,
  InferenceResponse,
} from "@eq-labs/foundation";
import { isAIError } from "@eq-labs/foundation";
import {
  ProviderRouter,
  SpecializationRouter,
  createCorrelationId,
  createInvocationLogger,
  DEFAULT_OBSERVABILITY_POLICY,
  type InvocationLogSink,
  type ObservabilityPolicy,
} from "@eq-labs/intelligence";
import { noopProvider } from "./noop-provider.js";

export interface AiRootOptions {
  catalog?: CatalogPort | null;
  defaultProviderId?: string;
  /** Defaults to DEFAULT_OBSERVABILITY_POLICY (no raw prompt/response). */
  observabilityPolicy?: ObservabilityPolicy;
  /** Optional sink for metadata-only invocation events. */
  logSink?: InvocationLogSink;
}

export function createAiRoot(options: AiRootOptions = {}) {
  const providerRouter = new ProviderRouter();
  providerRouter.register(noopProvider);
  providerRouter.setDefault(options.defaultProviderId ?? "noop");

  const specializationRouter = new SpecializationRouter(
    providerRouter,
    options.catalog ?? null,
  );

  const logger = createInvocationLogger(
    options.observabilityPolicy ?? DEFAULT_OBSERVABILITY_POLICY,
    options.logSink ??
      ((event) => {
        // Metadata only; raw fields omitted by default policy.
        console.info("[ai-invocation]", JSON.stringify(event));
      }),
  );

  /**
   * Instrumented infer: correlation id + latency + error code; never logs
   * raw prompt/response unless policy.allowRawPromptResponse === true.
   */
  async function infer(
    request: InferenceRequest,
    specializationId?: string,
  ): Promise<InferenceResponse | AIError> {
    const correlationId = createCorrelationId();
    const started = Date.now();
    const result = await specializationRouter.inferForSpecialization(
      specializationId,
      request,
    );
    const latencyMs = Date.now() - started;
    const resolved = providerRouter.resolve(specializationId);
    const providerId = isAIError(resolved) ? undefined : resolved.id;

    logger.emit({
      correlationId,
      requestId: request.requestId,
      providerId,
      specializationId,
      spiVersion: request.spiVersion,
      latencyMs,
      errorCode: isAIError(result) ? result.code : undefined,
    });

    return result;
  }

  return {
    providerRouter,
    specializationRouter,
    logger,
    infer,
    rootId: "apps/cli/composition/ai-root",
  };
}
