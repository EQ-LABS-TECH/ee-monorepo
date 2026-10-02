# Template: ee-tec (T-DOC)

Scaffold for **EE-TEC-XXX** consolidated technical documentation.

| Item                | Value                    |
| ------------------- | ------------------------ |
| Category            | T-DOC                    |
| Norma               | EE-DOC-002 §18.4         |
| Default destination | `docs/architecture/`     |
| Required input      | `parentDoc` (EE-DOC-XXX) |
| ID rule             | **D-01**                 |

## Files

- `template.json` — metadata contract
- `files/body.md.hbs` — TEC body (as-built consolidation)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
