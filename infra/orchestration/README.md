# Platform orchestration (EE-DOC-009)

Baseline for **deployed platform orchestration** under `infra/orchestration/`.

## Layout

| Path                        | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `environments/development/` | Logical **development** environment overlays/manifests. |
| `environments/production/`  | Logical **production** environment overlays/manifests.  |

Staging is optional (EE-DOC-009 O-02) and is not created in this baseline.

## Boundaries

| This tree                                            | Not this tree                                          |
| ---------------------------------------------------- | ------------------------------------------------------ |
| How the platform is **deployed** across environments | How product images are **built** (`infra/containers/`) |
| Environment-specific orchestration as code           | Integration adapter `connectors/official/kubernetes`   |
| Platform workload lifecycle                          | Local Dev Container (EE-DOC-008)                       |

## Rules (EE-DOC-009 O-01…O-03)

- Express platform workload orchestration as code under this tree (O-01).
- Keep at least **development** and **production** distinguishable (O-02).
- The concrete orchestrator (Kubernetes or other) is an **implementation choice** documented later via IMP/ADR; this baseline does **not** freeze a vendor (O-03).

## Adding manifests

Place environment-specific files under the corresponding `environments/<name>/` directory. Prefer declarative, reviewable artifacts. Do **not** commit runtime secrets (see EE-DOC-009 S-01…S-02 / EE-IMP-009-P04).

## References

- EE-DOC-009 — Infrastructure
- EE-IMP-009-P01 — Infra Scaffold
- EE-IMP-009-P02 — Product Containers
- EE-DOC-003 — Vendor Agnostic
