/** AI Provider SPI contract version (EE-DOC-013 / EE-ADR-005 / EE-IMP-013-P03). */
export const AI_SPI_VERSION = '1.0.0' as const;
export type AISpiVersion = typeof AI_SPI_VERSION;

export const AI_SPI_DEFAULTS = {
  timeoutMs: 30_000,
  maxRetries: 2,
  backoffBaseMs: 200,
} as const;
