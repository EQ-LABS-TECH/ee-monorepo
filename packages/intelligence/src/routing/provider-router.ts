import type {
  AIError,
  AIProvider,
  InferenceRequest,
  InferenceResponse,
} from "@eq-labs/foundation";
import { isAIError } from "@eq-labs/foundation";
import {
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from "./policy.js";

export class ProviderRouter {
  private readonly providers = new Map<string, AIProvider>();
  private defaultProviderId: string | undefined;
  private readonly policy: RoutingPolicy;

  constructor(policy: RoutingPolicy = defaultRoutingPolicy) {
    this.policy = policy;
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  setDefault(providerId: string): void {
    this.defaultProviderId = providerId;
  }

  list(): AIProvider[] {
    return [...this.providers.values()];
  }

  resolve(specializationId?: string): AIProvider | AIError {
    const decision = this.policy.selectProvider({
      specializationId,
      providers: this.list(),
      defaultProviderId: this.defaultProviderId,
    });
    if (isAIError(decision)) return decision;
    const d = decision as RoutingDecision;
    const provider = this.providers.get(d.providerId);
    if (!provider) {
      return {
        code: "PROVIDER_UNAVAILABLE",
        message: `Provider not found: ${d.providerId}`,
        retryable: false,
      };
    }
    return provider;
  }

  async infer(
    request: InferenceRequest,
    specializationId?: string,
  ): Promise<InferenceResponse | AIError> {
    const provider = this.resolve(specializationId);
    if (isAIError(provider)) return provider;
    return provider.infer(request);
  }
}
