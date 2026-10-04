import type { AISpiVersion } from "./version.js";
import { AI_SPI_VERSION } from "./version.js";

export interface InferenceRequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export interface InferenceRequest {
  spiVersion: AISpiVersion;
  requestId: string;
  /** Logical model id (provider-specific mapping is adapter concern). */
  model?: string;
  input: unknown;
  options?: InferenceRequestOptions;
}

export interface InferenceResponseMeta {
  latencyMs?: number;
  model?: string;
  providerId?: string;
}

export interface InferenceResponse {
  spiVersion: AISpiVersion;
  requestId: string;
  output: unknown;
  meta?: InferenceResponseMeta;
}

export function createInferenceRequest(
  partial: Omit<InferenceRequest, "spiVersion"> & { spiVersion?: AISpiVersion },
): InferenceRequest {
  return {
    spiVersion: partial.spiVersion ?? AI_SPI_VERSION,
    requestId: partial.requestId,
    model: partial.model,
    input: partial.input,
    options: partial.options,
  };
}
