import type { AIError, AIProvider } from '@eq-labs/foundation';

export interface RoutingDecision {
  providerId: string;
  specializationId?: string;
}

export interface RoutingPolicy {
  selectProvider(input: {
    specializationId?: string;
    providers: readonly AIProvider[];
    defaultProviderId?: string;
  }): RoutingDecision | AIError;
}

export const defaultRoutingPolicy: RoutingPolicy = {
  selectProvider({ providers, defaultProviderId, specializationId }) {
    if (providers.length === 0) {
      return {
        code: 'PROVIDER_UNAVAILABLE',
        message: 'No AI providers registered in ProviderRouter',
        retryable: false,
      };
    }
    if (defaultProviderId) {
      const found = providers.find((p) => p.id === defaultProviderId);
      if (!found) {
        return {
          code: 'PROVIDER_UNAVAILABLE',
          message: `Default provider not registered: ${defaultProviderId}`,
          retryable: false,
        };
      }
      return { providerId: found.id, specializationId };
    }
    const first = providers[0];
    if (!first) {
      return {
        code: 'PROVIDER_UNAVAILABLE',
        message: 'No AI providers registered in ProviderRouter',
        retryable: false,
      };
    }
    return { providerId: first.id, specializationId };
  },
};
