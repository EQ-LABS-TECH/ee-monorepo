/**
 * @eq-labs/intelligence — routing surface (EE-DOC-013 / EE-IMP-013-P04).
 * Does not import registry, knowledge, or connectors.
 */
export {
  ProviderRouter,
  SpecializationRouter,
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from "./routing/index.js";
