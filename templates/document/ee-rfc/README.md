# Template: ee-rfc (T-DOC)

Scaffold for **EE-RFC-XXX** Request for Comments (governed change Tipo D).

| Item                | Value                          |
| ------------------- | ------------------------------ |
| Category            | T-DOC                          |
| Norma               | EE-DOC-002 §18.5               |
| Default destination | `docs/rfc/`                    |
| Title language      | English (document name)        |
| Body language       | Spanish (governance sections)  |
| ID rule             | **D-01** — `docId` is an input |
| Precedents          | EE-RFC-001, EE-RFC-002         |

## Files

- `template.json` — metadata contract
- `files/EE-RFC-XXX_Title.md.hbs` — RFC body (§18.5)

## Generation

`pnpm run generate` after EE-IMP-012-P05. Does **not** apply the governed change — only scaffolds the RFC document.
