import type {
  KnowledgeError,
  KnowledgeHealth,
  KnowledgeIndexRequest,
  KnowledgeIndexResult,
  KnowledgePort,
  KnowledgeQueryFilter,
  KnowledgeQueryResult,
  KnowledgeSemanticSearchRequest,
  KnowledgeUnit,
} from "@eq-labs/foundation";
import { KNOWLEDGE_PORT_VERSION } from "@eq-labs/foundation";

/**
 * In-memory KnowledgePort — evidence implementation (EE-IMP-014-P03).
 * Not a production store (No False Pass).
 */
export function createInMemoryKnowledgePort(): KnowledgePort {
  const store = new Map<string, KnowledgeUnit>();

  return {
    async health(): Promise<KnowledgeHealth> {
      return {
        ok: true,
        backend: "in-memory",
        portVersion: KNOWLEDGE_PORT_VERSION,
        details: `units=${store.size}`,
      };
    },

    async index(
      request: KnowledgeIndexRequest,
    ): Promise<KnowledgeIndexResult | KnowledgeError> {
      if (!request?.units || !Array.isArray(request.units)) {
        return {
          code: "INVALID_REQUEST",
          message: "index requires units[]",
          retryable: false,
        };
      }
      let accepted = 0;
      let rejected = 0;
      const errors: KnowledgeError[] = [];
      for (const unit of request.units) {
        if (!unit?.id || typeof unit.content !== "string") {
          rejected += 1;
          errors.push({
            code: "INVALID_REQUEST",
            message: "unit requires id and content",
            retryable: false,
            unitId: unit?.id,
          });
          continue;
        }
        store.set(unit.id, unit);
        accepted += 1;
      }
      return { accepted, rejected, errors: errors.length ? errors : undefined };
    },

    async query(
      filter: KnowledgeQueryFilter,
    ): Promise<KnowledgeQueryResult | KnowledgeError> {
      let units = [...store.values()];
      if (filter?.ids?.length) {
        const set = new Set(filter.ids);
        units = units.filter((u) => set.has(u.id));
      }
      if (filter?.tags?.length) {
        units = units.filter((u) =>
          filter.tags!.every((t) => u.meta?.tags?.includes(t)),
        );
      }
      if (filter?.source) {
        units = units.filter((u) => u.meta?.source === filter.source);
      }
      if (filter?.limit && filter.limit > 0) {
        units = units.slice(0, filter.limit);
      }
      return { units };
    },

    async retrieve(id: string): Promise<KnowledgeUnit | KnowledgeError> {
      const unit = store.get(id);
      if (!unit) {
        return {
          code: "NOT_FOUND",
          message: `unit not found: ${id}`,
          retryable: false,
          unitId: id,
        };
      }
      return unit;
    },

    async semanticSearch(
      _request: KnowledgeSemanticSearchRequest,
    ): Promise<KnowledgeQueryResult | KnowledgeError> {
      return {
        code: "NOT_IMPLEMENTED",
        message:
          "semanticSearch PENDING until Embedding ABI + store (EE-IMP-014-P04 / EE-DOC-014 §04.6)",
        retryable: false,
      };
    },
  };
}
