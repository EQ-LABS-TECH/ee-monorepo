# Ecosystem Validation

Canonical location for Engineering Ecosystem validation artifacts
(**EE-DOC-015**, tree authorized by **EE-DOC-006**).

## Layout

| Path               | Purpose                                                          |
| :----------------- | :--------------------------------------------------------------- |
| `reports/`         | Formal Validation Reports (`EE-VAL-*`) — produced in IMP-015-P05 |
| `waivers/`         | Gate WAIVE records (`EE-WAIVE-*`) per **EE-DOC-010**             |
| `evidence/layers/` | Manual layer-review evidence (V-ARCH-LAYERS)                     |

## Rules

- Domain Results of **EE-DOC-010** are consumed **without reclassification** (SKIPPED ≠ N/A).
- DEGRADED domain results require a **valid WAIVE** under `waivers/`.
- Formal reports live only under this tree (EE-DOC-015).

## References

- EE-DOC-015 — Engineering Ecosystem Validation
- EE-DOC-006 — Repository Structure
- EE-DOC-010 — Quality Gates
- EE-IMP-015-P01 — Validation Bootstrap and Inventory
