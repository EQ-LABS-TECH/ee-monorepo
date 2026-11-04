# Ecosystem Validation

Canonical location for Engineering Ecosystem validation artifacts
(**EE-DOC-015**, tree authorized by **EE-DOC-006**).

## Layout

| Path               | Purpose                                                                    |
| :----------------- | :------------------------------------------------------------------------- |
| `reports/`         | Formal Ecosystem Validation Reports (`EE-VAL-*`) — produced in IMP-015-P05 |
| `waivers/`         | Gate WAIVE records (`EE-WAIVE-*`) per **EE-DOC-010**                       |
| `evidence/layers/` | Manual layer-review evidence (V-ARCH-LAYERS)                               |
| `audit/`           | Canonical audit records: Criteria, Log and Rules Emerging (`EE-AUD-*`)     |

## Rules

- Domain Results of **EE-DOC-010** are consumed **without reclassification** (SKIPPED ≠ N/A).
- DEGRADED domain results require a **valid WAIVE** under `waivers/`.
- Formal ecosystem validation reports (`EE-VAL-*`) live under `reports/`.
- Detailed audit reports (`EE-AUD-*`) live under `audit/reports/` and are referenced from the audit Log.
- Audit Criteria, Log and Rules Emerging remain at the root of `audit/`.

## References

- EE-DOC-015 — Engineering Ecosystem Validation
- EE-DOC-006 — Repository Structure
- EE-DOC-010 — Quality Gates
- EE-IMP-015-P01 — Validation Bootstrap and Inventory
- `audit/EE-AUD-Criteria_Audited_Definition.md` — Operational definition of «auditado»
- `audit/EE-AUD-Log_Progress_Register.md` — Progress log
