export { AI_SPI_VERSION, AI_SPI_DEFAULTS } from './version.js';
export type { AISpiVersion } from './version.js';

export type { AIErrorCode, AIError } from './error.js';
export { isAIError } from './error.js';

export type {
  InferenceRequest,
  InferenceRequestOptions,
  InferenceResponse,
  InferenceResponseMeta,
} from './inference.js';
export { createInferenceRequest } from './inference.js';

export type {
  GenerationRequest,
  GenerationRequestOptions,
  GenerationResponse,
  GenerationResponseMeta,
} from './generation.js';
export { createGenerationRequest } from './generation.js';

export type { AIProvider } from './provider.js';

export type { SpecializationMeta, CatalogPort } from './catalog.js';

export { KNOWLEDGE_PORT_VERSION } from './knowledge-version.js';
export type { KnowledgePortVersion } from './knowledge-version.js';

export type { KnowledgeErrorCode, KnowledgeError } from './knowledge-error.js';
export { isKnowledgeError } from './knowledge-error.js';

export type {
  KnowledgeUnitMeta,
  KnowledgeUnit,
  KnowledgeIndexRequest,
  KnowledgeIndexResult,
  KnowledgeQueryFilter,
  KnowledgeQueryResult,
  KnowledgeHealth,
  KnowledgeSemanticSearchRequest,
  KnowledgePort,
} from './knowledge.js';
