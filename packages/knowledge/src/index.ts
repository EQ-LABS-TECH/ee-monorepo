/**
 * @eq-labs/knowledge — Knowledge layer (EE-DOC-014).
 * Port types live in @eq-labs/foundation; this package implements the port.
 * Not a production store (No False Pass) until product backends are ACTIVE.
 */
export { createInMemoryKnowledgePort } from './in-memory-port.js';
export { createUnavailableKnowledgePort } from './unavailable-port.js';
