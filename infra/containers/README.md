# Product / platform containers (EE-DOC-009)

Baseline for **product/platform** containerization under `infra/containers/`.

## Layout

| Path         | Purpose                                                                          |
| ------------ | -------------------------------------------------------------------------------- |
| `templates/` | Reusable image templates (e.g. Node 24).                                         |
| `compose/`   | Reserved for **local product stack** (Compose or equivalent). Not Dev Container. |

## Boundaries

| This tree                                        | Not this tree                                                   |
| ------------------------------------------------ | --------------------------------------------------------------- |
| Product/platform images and local product stacks | Dev Container (EE-DOC-008 → `.devcontainer/`)                   |
| How product runtimes are packaged                | Integration adapter `connectors/official/docker`                |
| Build context for platform services              | Deployed orchestration (`infra/orchestration/`, EE-IMP-009-P03) |

## Rules (EE-DOC-009 C-01…C-04)

- Version container build definitions under this tree (C-01).
- **Never** embed secrets in image layers (C-02).
- Node-based services: base image compatible with **Node ≥ 24 < 25** (EE-ADR-003) (C-03).
- Dev Container does **not** replace product images (C-04).

## Template

See `templates/Dockerfile.node` for a minimal Node 24 starting point.

## References

- EE-DOC-009 — Infrastructure
- EE-IMP-009-P01 — Infra Scaffold
- EE-ADR-003 — Node.js Baseline 24 LTS
