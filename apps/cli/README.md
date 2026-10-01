# @eq-labs/cli

DX facade for the EQ-LABS Engineering Ecosystem (**EE-DOC-011 §06**).

## Role

| Layer            | Responsibility                                                           |
| ---------------- | ------------------------------------------------------------------------ |
| **Canonical**    | Root commands: `pnpm run <cmd>` (`scripts/`)                             |
| **This package** | Optional DX entry (`ee help`, `ee run <cmd>`) that **delegates** to root |

This CLI does **not** reimplement Quality Gates or change thresholds (EE-DOC-010).

## Usage

From the monorepo root (after build):

```bash
pnpm --filter @eq-labs/cli run build
node apps/cli/dist/index.js help
node apps/cli/dist/index.js run doctor
node apps/cli/dist/index.js run validate
```

`ee run validate` is equivalent in contract to `pnpm run validate`.

## Development

```bash
pnpm --filter @eq-labs/cli run typecheck
pnpm --filter @eq-labs/cli run build
pnpm --filter @eq-labs/cli run lint
```

## References

- EE-DOC-011 — Automation §06
- EE-IMP-011-P03 — CLI Surface
