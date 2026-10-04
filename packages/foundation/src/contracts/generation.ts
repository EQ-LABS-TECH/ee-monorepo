import type { AISpiVersion } from "./version.js";
import { AI_SPI_VERSION } from "./version.js";

export interface GenerationRequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GenerationRequest {
  spiVersion: AISpiVersion;
  requestId: string;
  model?: string;
  /** Prompt or structured generation input (opaque at SPI layer). */
  input: unknown;
  options?: GenerationRequestOptions;
}

export interface GenerationResponseMeta {
  latencyMs?: number;
  model?: string;
  providerId?: string;
}

export interface GenerationResponse {
  spiVersion: AISpiVersion;
  requestId: string;
  output: unknown;
  meta?: GenerationResponseMeta;
}

export function createGenerationRequest(
  partial: Omit<GenerationRequest, "spiVersion"> & {
    spiVersion?: AISpiVersion;
  },
): GenerationRequest {
  return {
    spiVersion: partial.spiVersion ?? AI_SPI_VERSION,
    requestId: partial.requestId,
    model: partial.model,
    input: partial.input,
    options: partial.options,
  };
}
