# Ecosystem Validation

Canonical location for Engineering Ecosystem validation artifacts
(**EE-DOC-015**, tree authorized by **EE-DOC-006**).

## Layout

| Path               | Purpose                                                                    |
| :----------------- | :------------------------------------------------------------------------- |
| `reports/`         | Formal Ecosystem Validation Reports (`EE-VAL-*`) — produced in IMP-015-P05 |
| `waivers/`         | Gate WAIVE records (`EE-WAIVE-*`) per **EE-DOC-010**                       |
| `evidence/layers/` | Manual layer-review evidence (V-ARCH-LAYERS)                               |
| `audit/`           | Audit records: Criteria, Log, Rules Register and Backlog (`EE-AUD-*`)      |

## Current validation artifact inventory

| Artifact                                                         | Type and scope                | Current interpretation                                                                  |
| :--------------------------------------------------------------- | :---------------------------- | :-------------------------------------------------------------------------------------- |
| `reports/EE-VAL-072b5e7_Ecosystem_Validation_Report_20261007.md` | Ecosystem validation snapshot | Historical evidence for the inspected ref; it does not describe the current gate state. |
| `waivers/EE-WAIVE-QG-SEC-001_braces_20261007.md`                 | QG-SEC-001 / braces           | Expired historical authorization; superseded by the later record and no longer active.  |
| `waivers/EE-WAIVE-QG-SEC-001_sprintf-js_20261007.md`             | QG-SEC-001 / sprintf-js       | Expired historical authorization; superseded by the later record and no longer active.  |
| `waivers/EE-WAIVE-QG-SEC-001_braces_20261016.md`                 | QG-SEC-001 / braces           | Resolved after the associated advisory was withdrawn; no renewal is in force.           |
| `waivers/EE-WAIVE-QG-SEC-001_sprintf-js_20261016.md`             | QG-SEC-001 / sprintf-js       | Resolved after the associated advisory was withdrawn; no renewal is in force.           |

The phase 1 audit report records the resolution evidence and the decision not to renew these waivers.

## Rules

- Domain Results of **EE-DOC-010** are consumed **without reclassification** (SKIPPED ≠ N/A).
- DEGRADED domain results require a **valid WAIVE** under `waivers/`.
- Formal ecosystem validation reports (`EE-VAL-*`) live under `reports/`.
- Detailed audit reports (`EE-AUD-*`) live under `audit/reports/` and are referenced from the audit Log.
- Audit Criteria, Log, Rules Register and Backlog remain at the root of `audit/`.
- The `PC-*`, `PN-*` and `PA-*` work backlog is maintained separately in `audit/EE-AUD-Backlog_Register.md`.

## References

- EE-DOC-015 — Engineering Ecosystem Validation
- EE-DOC-006 — Repository Structure
- EE-DOC-010 — Quality Gates
- `audit/EE-AUD-Rules_Register.md` — rule index and AR traceability
- `audit/EE-AUD-Backlog_Register.md` — audit backlog PC/PN/PA
- EE-IMP-015-P01 — Validation Bootstrap and Inventory
- `audit/EE-AUD-Criteria_Audited_Definition.md` — Operational definition of «auditado»
- `audit/EE-AUD-Log_Progress_Register.md` — Progress log
