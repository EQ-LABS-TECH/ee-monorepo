# @eq-labs/intelligence

Intelligence layer of the EQ-LABS Engineering Ecosystem (**EE-DOC-013**).

## Role

| Responsibility                                   | Owner                                                        |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Specialization Router / Provider Router (target) | This package                                                 |
| Provider SPI types                               | `@eq-labs/foundation` (P03)                                  |
| Provider adapters                                | `connectors/official/*` (EE-ADR-005)                         |
| Composition root (wiring)                        | `apps/*` only (EE-DOC-006 §13.5)                             |
| Specialization catalog SSOT                      | `@eq-labs/registry` via **catalog port** (not imported here) |

## Layer rules (EE-DOC-006 §13.2)

- **May depend on:** Foundation, Intelligence (see EE-DOC-006 §13.2, updated by EE-ADR-006).
- **Must not depend on:** Registry, Knowledge, Connectors (runtime).

## Current status

Functional package (EE-IMP-013-P01–P06).
Includes ProviderRouter, SpecializationRouter, and observability logging.

## Development

```bash
pnpm --filter @eq-labs/intelligence run lint
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run build
```

## References

- EE-DOC-013 — AI Ecosystem
- EE-ADR-005 — AI Provider SPI and Connector Adapters
- EE-DOC-006 — Repository Structure (§13.2, §13.5)
