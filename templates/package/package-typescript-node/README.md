# Template: package-typescript-node (T-PKG)

Baseline TypeScript Node package (**EE-DOC-012 section 10**).

| Item            | Value               |
| --------------- | ------------------- |
| Category        | T-PKG               |
| Package name    | `@eq-labs/{{name}}` |
| Allowed targets | `packages/`         |
| Language        | en-US               |

## Rules

P-01…P-10. No `test` script without real Vitest tests (P-04). Exact versions only (P-02).

## Note (section 13.1)

Operational generation under nested `packages/<layer>/` remains deferred until an additive RFC on EE-DOC-006. This template is validated statically as the composition base for T-APP/T-CON.
