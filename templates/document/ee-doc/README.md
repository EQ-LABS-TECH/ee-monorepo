# Template: ee-doc (T-DOC)

Scaffold for **EE-DOC-XXX** normative documents.

| Item                | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Category            | T-DOC                                                          |
| Norma               | EE-DOC-002 §18.1                                               |
| Default destination | `docs/architecture/`                                           |
| ID rule             | **D-01** — `docId` is an input; never assigned by the template |

## Files

- `template.json` — metadata contract
- `files/body.md.hbs` — document body (Handlebars)

## Generation

`pnpm run generate` (EE-DOC-011 / EE-IMP-012-P05). Until P05, this template is validated only by `validateTemplates()`.
