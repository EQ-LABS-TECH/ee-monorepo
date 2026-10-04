import type {
  AIError,
  AIProvider,
  InferenceRequest,
  InferenceResponse,
} from "@eq-labs/foundation";
import { AI_SPI_VERSION } from "@eq-labs/foundation";

export const noopProvider: AIProvider = {
  id: "noop",
  spiVersion: AI_SPI_VERSION,
  async infer(request: InferenceRequest): Promise<InferenceResponse | AIError> {
    return {
      spiVersion: AI_SPI_VERSION,
      requestId: request.requestId,
      output: { ok: true, echo: request.input },
      meta: { providerId: "noop", model: request.model },
    };
  },
};
