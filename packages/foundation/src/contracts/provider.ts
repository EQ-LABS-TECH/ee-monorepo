import type { AISpiVersion } from './version.js';
import type { InferenceRequest, InferenceResponse } from './inference.js';
import type { GenerationRequest, GenerationResponse } from './generation.js';
import type { AIError } from './error.js';

/**
 * Provider SPI — implemented by connectors/official/* (remote)
 * or Local Inference Runtime (ADR posterior).
 * Intelligence consumes this interface; it does not implement vendor SDKs.
 */
export interface AIProvider {
  readonly id: string;
  readonly spiVersion: AISpiVersion;
  infer(request: InferenceRequest): Promise<InferenceResponse | AIError>;
  generate?(request: GenerationRequest): Promise<GenerationResponse | AIError>;
}
