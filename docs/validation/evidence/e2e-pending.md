# V-E2E — PENDING (EE-DOC-015 section 05.8)

| Campo | Valor |
| :--- | :---- |
| **domain** | V-E2E |
| **status** | **PENDING** |
| **git_sha** | 88647f9 |
| **date** | 2026-10-07 |
| **N/A** | **Prohibido** |

## Gap

* No pnpm run e2e in root command contract (EE-DOC-011 / EE-DOC-006).
* Workspace-level Playwright may exist without root gate.

## Ticket / plan

1. Tipo B/C: add root e2e + Turbo pipeline (sync EE-DOC-011 / EE-DOC-006 if needed).
2. Align workspace scripts to EE-ADR-002 (e2e).
3. Wire QG / V-E2E when mechanism is ACTIVE.

## Refs

* EE-DOC-015 section 05.8
* EE-IMP-015-P04
* EE-ADR-002
