# Template: ee-imp (T-DOC)

Scaffold for **EE-IMP-XXX-PXX** implementation units.

| Item                | Value                               |
| ------------------- | ----------------------------------- |
| Category            | T-DOC                               |
| Norma               | EE-DOC-002 §18.3                    |
| Default destination | `docs/developer/`                   |
| ID rule             | **D-01** — pattern `EE-IMP-NNN-PNN` |

## Files

- `template.json` — metadata contract
- `files/body.md.hbs` — IMP body (objectives, evidence, acceptance)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
