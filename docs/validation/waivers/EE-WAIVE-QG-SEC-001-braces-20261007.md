# EE-WAIVE-QG-SEC-001-braces

| Campo                  | Valor                                                                                                                                                  |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gate_id**            | QG-SEC-001                                                                                                                                             |
| **package**            | braces                                                                                                                                                 |
| **advisory**           | GHSA-vfj7-8cjw-p6xm                                                                                                                                    |
| **authority**          | Architecture                                                                                                                                           |
| **reason**             | No fixed release on npm (latest 3.0.3). Path: plop → liftoff → findup-sync → micromatch → braces. Dev-only generate tooling; not runtime product path. |
| **scope**              | Root devDependency chain via plop only                                                                                                                 |
| **effective_from**     | 2026-10-07                                                                                                                                             |
| **expires_at**         | 2026-10-14                                                                                                                                             |
| **normalization_plan** | Re-evaluate when braces > 3.0.3 publishes or replace plop/liftoff stack; track GHSA-vfj7-8cjw-p6xm                                                     |
| **Refs**               | EE-DOC-010, EE-DOC-015, EE-IMP-015-P01                                                                                                                 |
