# Infrastructure (EE-DOC-009)

Canonical product/platform Infrastructure as Code for `ee-monorepo`.

## Layout

| Path             | Purpose                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `containers/`    | Product containerization (images, Compose-style product stacks). Detail in EE-IMP-009-P02.                 |
| `orchestration/` | Deployed orchestration manifests (e.g. Kubernetes/Helm/Kustomize or equivalent). Detail in EE-IMP-009-P03. |

## Boundaries

| This tree                                       | Not this tree                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Product/platform runtime and deploy definitions | Local **Dev Container** (EE-DOC-008 → `.devcontainer/`)                                   |
| How the platform is built/run/deployed          | Integration **adapters** (`connectors/official/docker`, `connectors/official/kubernetes`) |

## Rules

- Do **not** commit runtime secrets.
- Do **not** place platform IaC under `connectors/`.
- Structural authority: EE-DOC-006 v1.4.0 + EE-RFC-001.
- Domain rules: EE-DOC-009.

## References

- EE-DOC-009 — Infrastructure
- EE-DOC-006 — Repository Structure
- EE-RFC-001 — Incorporation of `infra/` into the Top-Level Repository Tree and Index Synchronization

## Secrets

Runtime infrastructure secrets policy: see [secrets/](./secrets/) (EE-DOC-009 S-01…S-03). **Do not** commit secret values.
