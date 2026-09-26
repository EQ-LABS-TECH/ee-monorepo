# Infrastructure runtime secrets (EE-DOC-009)

Policy baseline for **platform/runtime** secrets. This directory must **not** contain real secret values.

## Rules (S-01…S-03)

| ID       | Rule                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **S-01** | Do **not** version infrastructure runtime secrets in cleartext in this monorepo.                                                             |
| **S-02** | Inject secrets at **runtime** via the environment (platform secret store, injected env vars, sealed mechanisms). Never by committing values. |
| **S-03** | **GitHub Secrets** used by repository CI/CD remain under **EE-DOC-007**. This tree does not redefine that catalog.                           |

## What belongs here

| Allowed                                         | Forbidden                       |
| ----------------------------------------------- | ------------------------------- |
| This policy README                              | API keys, tokens, passwords     |
| `.gitignore` for local credential patterns      | `kubeconfig` with live clusters |
| Future **examples** with fake placeholders only | Production credentials          |

## IaC minimum conventions

1. Manifests under `infra/containers/` and `infra/orchestration/` must not embed secret values.
2. Prefer external references (env var names, secret store keys) over literals.
3. Local files that temporarily hold secrets must match `infra/secrets/.gitignore` patterns and stay untracked.

## Relationship to other trees

| Tree                    | Role                                                |
| ----------------------- | --------------------------------------------------- |
| `infra/containers/`     | Build packaging — no secrets in image layers (C-02) |
| `infra/orchestration/`  | Deploy manifests — no secrets in clear (S-01)       |
| `.github/` / EE-DOC-007 | CI platform secrets                                 |

## References

- EE-DOC-009 — Infrastructure (§06.4)
- EE-DOC-007 — GitHub Governance
- EE-IMP-009-P01 … P03
