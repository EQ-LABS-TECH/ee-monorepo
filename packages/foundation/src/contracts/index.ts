export { AI_SPI_VERSION, AI_SPI_DEFAULTS } from "./version.js";
export type { AISpiVersion } from "./version.js";

export type { AIErrorCode, AIError } from "./error.js";
export { isAIError } from "./error.js";

export type {
  InferenceRequest,
  InferenceRequestOptions,
  InferenceResponse,
  InferenceResponseMeta,
} from "./inference.js";
export { createInferenceRequest } from "./inference.js";

export type {
  GenerationRequest,
  GenerationRequestOptions,
  GenerationResponse,
  GenerationResponseMeta,
} from "./generation.js";
export { createGenerationRequest } from "./generation.js";

export type { AIProvider } from "./provider.js";

export type { SpecializationMeta, CatalogPort } from "./catalog.js";
