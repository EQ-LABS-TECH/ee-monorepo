# data/

Local and generated artifacts for the Engineering Ecosystem (EE-DOC-006 / EE-DOC-014).

## Layout (EE-IMP-014-P05)

| Path        | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `datasets/` | Optional local datasets (content not versioned)    |
| `models/`   | Optional local model weights / inference artifacts |

## Policy

- **Do not commit** binaries, weights, dumps, or secrets (KS-01 / KS-02).
- Canonical normative text lives in `docs/` — not here.
- Knowledge **logic** lives in `packages/knowledge`.
- Lifecycle / retention: **EE-IMP-014-P05** §04.1.
- Local Inference paths under `models/` are not automatically Knowledge corpus (EE-DOC-013).
