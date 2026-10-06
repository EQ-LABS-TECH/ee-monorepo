import type { KnowledgeError } from "./knowledge-error.js";
import type { KnowledgePortVersion } from "./knowledge-version.js";
import { KNOWLEDGE_PORT_VERSION } from "./knowledge-version.js";

export interface KnowledgeUnitMeta {
  id: string;
  version?: string;
  source?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface KnowledgeUnit {
  id: string;
  content: string;
  meta?: KnowledgeUnitMeta;
}

export interface KnowledgeIndexRequest {
  units: KnowledgeUnit[];
}

export interface KnowledgeIndexResult {
  accepted: number;
  rejected: number;
  errors?: KnowledgeError[];
}

export interface KnowledgeQueryFilter {
  ids?: string[];
  tags?: string[];
  source?: string;
  limit?: number;
}

export interface KnowledgeQueryResult {
  units: KnowledgeUnit[];
}

export interface KnowledgeHealth {
  ok: boolean;
  backend: "in-memory" | "local" | "remote" | "none";
  portVersion: KnowledgePortVersion | string;
  details?: string;
}

export interface KnowledgeSemanticSearchRequest {
  text: string;
  limit?: number;
  filter?: KnowledgeQueryFilter;
}

/**
 * Knowledge Port — EE-DOC-014 §04.3.2.
 * semanticSearch may return NOT_IMPLEMENTED until Embedding ABI + store (P04).
 */
export interface KnowledgePort {
  health(): Promise<KnowledgeHealth | KnowledgeError>;
  index(
    request: KnowledgeIndexRequest,
  ): Promise<KnowledgeIndexResult | KnowledgeError>;
  query(
    filter: KnowledgeQueryFilter,
  ): Promise<KnowledgeQueryResult | KnowledgeError>;
  retrieve(id: string): Promise<KnowledgeUnit | KnowledgeError>;
  semanticSearch(
    request: KnowledgeSemanticSearchRequest,
  ): Promise<KnowledgeQueryResult | KnowledgeError>;
}

export { KNOWLEDGE_PORT_VERSION };
