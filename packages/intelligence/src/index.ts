/**
 * @eq-labs/intelligence — routing + observability (EE-DOC-013).
 * Does not import registry, knowledge, or connectors.
 * AI-11: tests must not call real providers or require model secrets in CI.
 */
export {
  ProviderRouter,
  SpecializationRouter,
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from "./routing/index.js";

export {
  DEFAULT_OBSERVABILITY_POLICY,
  createCorrelationId,
  createInvocationLogger,
  redactSensitive,
  looksSensitive,
  type ObservabilityPolicy,
  type InvocationLogEvent,
  type InvocationLogSink,
} from "./observability/index.js";
