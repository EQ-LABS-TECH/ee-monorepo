# @eq-labs/knowledge

Knowledge layer of the EQ-LABS Engineering Ecosystem (**EE-DOC-014**).

## Status

- **Form:** flat package (`packages/knowledge`) — not nested workspaces
- **Visibility:** `private: true` (workspace API via `exports`; no npm publish in this cycle)
- **Contracts:** `KnowledgePort` / embedding ABI → **EE-IMP-014-P03+** (Foundation)

## Scripts

```bash
pnpm --filter @eq-labs/knowledge run lint
pnpm --filter @eq-labs/knowledge run typecheck
pnpm --filter @eq-labs/knowledge run build
```

## References

- EE-DOC-014 — Knowledge Management
- EE-IMP-014-P02 — Baseline Package
