import type {
  AIError,
  CatalogPort,
  InferenceRequest,
  InferenceResponse,
} from '@eq-labs/foundation';
import type { ProviderRouter } from './provider-router.js';

export class SpecializationRouter {
  constructor(
    private readonly providerRouter: ProviderRouter,
    private readonly catalog: CatalogPort | null = null,
  ) {}

  async inferForSpecialization(
    specializationId: string | undefined,
    request: InferenceRequest,
  ): Promise<InferenceResponse | AIError> {
    if (specializationId && !this.catalog) {
      return {
        code: 'DEGRADED',
        message:
          'CatalogPort not injected; cannot resolve specialization (no silent parallel catalog)',
        retryable: false,
        requestId: request.requestId,
      };
    }

    if (specializationId && this.catalog) {
      const meta = await this.catalog.getSpecialization(specializationId);
      if (!meta) {
        return {
          code: 'NOT_APPLICABLE',
          message: `Unknown specialization: ${specializationId}`,
          retryable: false,
          requestId: request.requestId,
        };
      }
      if (meta.status === 'disabled') {
        return {
          code: 'NOT_APPLICABLE',
          message: `Specialization disabled: ${specializationId}`,
          retryable: false,
          requestId: request.requestId,
        };
      }
    }

    return this.providerRouter.infer(request, specializationId);
  }
}
