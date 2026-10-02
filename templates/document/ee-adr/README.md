# Template: ee-adr (T-DOC)

Scaffold for **EE-ADR-XXX** Architecture Decision Records.

| Item                | Value                          |
| ------------------- | ------------------------------ |
| Category            | T-DOC                          |
| Norma               | EE-DOC-002 §18.2               |
| Default destination | `docs/adr/`                    |
| ID rule             | **D-01** — `docId` is an input |

## Files

- `template.json` — metadata contract
- `files/body.md.hbs` — ADR body (Context / Decision / Consequences)

## Generation

`pnpm run generate` after EE-IMP-012-P05.
