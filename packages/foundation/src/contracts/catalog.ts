/**
 * Catalog port — types in Foundation; implementation in Registry;
 * injection at apps/* composition root (P04). Intelligence must not
 * import @eq-labs/registry.
 */
export interface SpecializationMeta {
  id: string;
  capabilities?: string[];
  status?: "active" | "deprecated" | "disabled";
  /** Opaque routing hints; Router interprets policy. */
  routingHints?: Record<string, unknown>;
}

export interface CatalogPort {
  getSpecialization(id: string): Promise<SpecializationMeta | null>;
  listSpecializations(): Promise<SpecializationMeta[]>;
}
