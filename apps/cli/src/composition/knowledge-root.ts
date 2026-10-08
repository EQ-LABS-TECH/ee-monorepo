/**
 * Composition root evidence — Knowledge Port wiring
 * (EE-DOC-006 §13.5 / EE-DOC-014 / EE-IMP-014-P03).
 */
import type { KnowledgePort } from '@eq-labs/foundation';
import { KNOWLEDGE_PORT_VERSION } from '@eq-labs/foundation';
import { createInMemoryKnowledgePort } from '@eq-labs/knowledge';

export interface KnowledgeRoot {
  port: KnowledgePort;
  portVersion: string;
}

/** Builds a KnowledgePort instance for this runtime (in-memory evidence). */
export function createKnowledgeRoot(): KnowledgeRoot {
  return {
    port: createInMemoryKnowledgePort(),
    portVersion: KNOWLEDGE_PORT_VERSION,
  };
}
