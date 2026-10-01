# templates/

Single Source of Template for EE-LABS generative scaffolding (**EE-DOC-012**).

## Layout

| Path                   | Role                            |
| ---------------------- | ------------------------------- |
| `template.schema.json` | Metadata contract (JSON Schema) |
| `document/`            | T-DOC templates                 |
| `package/`             | T-PKG templates                 |
| `app/`                 | T-APP templates                 |
| `connector/`           | T-CON templates                 |

Each template lives at `templates/<category>/<name>/` with `template.json`, `files/`, and `README.md`.

## Boundaries

| Path                     | Role                                    |
| ------------------------ | --------------------------------------- |
| **This directory**       | Generative SSOT                         |
| `assets/templates/`      | Static resources only (EE-DOC-006 §14)  |
| `marketplace/templates/` | Distribution / extensibility — not SSOT |

Generation: `pnpm run generate` (**EE-DOC-011**). Registry: **EE-IMP-012-P05**.

## References

- EE-DOC-012 — Templates
- EE-RFC-002 — Top-level `templates/`
- EE-IMP-012-P02
