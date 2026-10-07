# EE-WAIVE-QG-SEC-001-sprintf-js

| Campo                  | Valor                                                                                                       |
| :--------------------- | :---------------------------------------------------------------------------------------------------------- |
| **gate_id**            | QG-SEC-001                                                                                                  |
| **package**            | sprintf-js                                                                                                  |
| **advisory**           | GHSA-hp3w-g68c-fv3c                                                                                         |
| **authority**          | Architecture                                                                                                |
| **reason**             | No fixed release beyond 1.1.3. Path: config-jest → jest → istanbul/js-yaml/argparse. Dev/test tooling only. |
| **scope**              | packages/config/jest transitive                                                                             |
| **effective_from**     | 2026-10-07                                                                                                  |
| **expires_at**         | 2026-10-14                                                                                                  |
| **normalization_plan** | Re-audit when sprintf-js patches or jest drops the path; track GHSA-hp3w-g68c-fv3c                          |
| **Refs**               | EE-DOC-010, EE-DOC-015, EE-IMP-015-P01                                                                      |
