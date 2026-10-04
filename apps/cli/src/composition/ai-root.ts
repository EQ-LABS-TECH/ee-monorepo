/**
 * Composition root (evidence) — EE-DOC-006 §13.5 / EE-ADR-005 / EE-IMP-013-P04.
 */
import type { CatalogPort } from "@eq-labs/foundation";
import { ProviderRouter, SpecializationRouter } from "@eq-labs/intelligence";
import { noopProvider } from "./noop-provider.js";

export interface AiRootOptions {
  catalog?: CatalogPort | null;
  defaultProviderId?: string;
}

export function createAiRoot(options: AiRootOptions = {}) {
  const providerRouter = new ProviderRouter();
  providerRouter.register(noopProvider);
  providerRouter.setDefault(options.defaultProviderId ?? "noop");

  const specializationRouter = new SpecializationRouter(
    providerRouter,
    options.catalog ?? null,
  );

  return {
    providerRouter,
    specializationRouter,
    rootId: "apps/cli/composition/ai-root",
  };
}
