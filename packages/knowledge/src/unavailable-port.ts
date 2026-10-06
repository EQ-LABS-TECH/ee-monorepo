import type {
  KnowledgeError,
  KnowledgeHealth,
  KnowledgeIndexRequest,
  KnowledgePort,
  KnowledgeQueryFilter,
  KnowledgeSemanticSearchRequest,
} from "@eq-labs/foundation";
import { KNOWLEDGE_PORT_VERSION } from "@eq-labs/foundation";

const unavailable = (): KnowledgeError => ({
  code: "UNAVAILABLE",
  message: "Knowledge port is not available",
  retryable: false,
});

/**
 * KN-10 — explicit unavailability (EE-DOC-014). No invented knowledge.
 */
export function createUnavailableKnowledgePort(): KnowledgePort {
  return {
    async health(): Promise<KnowledgeHealth> {
      return {
        ok: false,
        backend: "none",
        portVersion: KNOWLEDGE_PORT_VERSION,
        details: "unavailable",
      };
    },
    async index(_request: KnowledgeIndexRequest): Promise<KnowledgeError> {
      return unavailable();
    },
    async query(_filter: KnowledgeQueryFilter): Promise<KnowledgeError> {
      return unavailable();
    },
    async retrieve(_id: string): Promise<KnowledgeError> {
      return unavailable();
    },
    async semanticSearch(
      _request: KnowledgeSemanticSearchRequest,
    ): Promise<KnowledgeError> {
      return unavailable();
    },
  };
}
