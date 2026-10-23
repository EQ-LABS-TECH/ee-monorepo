# EE-WAIVE-QG-SEC-001-sprintf-js

| Campo                  | Valor                                                                                                       |
| :--------------------- | :---------------------------------------------------------------------------------------------------------- |
| **gate_id**            | QG-SEC-001                                                                                                  |
| **package**            | sprintf-js                                                                                                  |
| **advisory**           | GHSA-hp3w-g68c-fv3c                                                                                         |
| **authority**          | Architecture                                                                                                |
| **reason**             | No fixed release beyond 1.1.3. Path: config-jest → jest → istanbul/js-yaml/argparse. Dev/test tooling only. |
| **scope**              | packages/config/jest transitive                                                                             |
| **effective_from**     | 2026-10-16                                                                                                  |
| **expires_at**         | 2026-10-23                                                                                                  |
| **normalization_plan** | Re-audit when sprintf-js patches or jest drops the path; track GHSA-hp3w-g68c-fv3c                          |
| **Refs**               | EE-DOC-010, EE-DOC-015, EE-IMP-015-P01                                                                      |

---

## 01. Propósito

Waiver temporal de QG-SEC-001 para el advisory GHSA-hp3w-g68c-fv3c (sprintf-js) sin release parcheada en npm.

---

## 02. Condiciones

- Path limitado a tooling de test (jest/istanbul), no runtime de producto.
- Renovar o cerrar antes de **expires_at**.
- No usar `pnpm.auditConfig.ignoreGhsas` como sustituto permanente de este waiver.

---

## 03. Evidencia / Condiciones del waiver

| Campo              | Valor                                         |
| :----------------- | :-------------------------------------------- |
| **result**         | WAIVED                                        |
| **gate_id**        | QG-SEC-001                                    |
| **authority**      | Architecture                                  |
| **reason**         | Sin fix upstream; path dev/test only vía jest |
| **scope**          | packages/config/jest transitive               |
| **effective_from** | 2026-10-16                                    |
| **expires_at**     | 2026-10-23                                    |

---

## 04. Resolución

| Campo                 | Valor                                               |
| :-------------------- | :-------------------------------------------------- |
| **status**            | RESOLVED                                            |
| **resolved_at**       | 2026-10-23                                          |
| **resolution_reason** | GitHub Advisory GHSA-hp3w-g68c-fv3c withdrawn       |
| **evidence**          | `pnpm audit --json` no devuelve GHSA-hp3w-g68c-fv3c |
| **validation_scope**  | QG-SEC-001                                          |

---

## 05. Referencias

| Código         | Documento                        | Relación                                           |
| -------------- | -------------------------------- | -------------------------------------------------- |
| EE-DOC-010     | Quality Gates                    | Régimen de waivers y campos obligatorios (§04.6.1) |
| EE-DOC-015     | Engineering Ecosystem Validation | Validación del ecosistema                          |
| EE-IMP-015-P01 | Implementación de EE-DOC-015     | Evidencia de implementación relacionada            |

---

## 06. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                | Cambios                                                         | Estado       |
| ---------- | ---------- | ---------------------- | ---------------------- | --------------------- | --------------------------------------------------------------- | ------------ |
| **v1.0.0** | 2026-10-16 | Equipo de Arquitectura | Equipo de Arquitectura | Creación del waiver   | Documenta la excepción temporal para sprintf-js bajo QG-SEC-001 | **Aprobado** |
| **v1.0.1** | 2026-10-23 | Equipo de Arquitectura | Equipo de Arquitectura | Resolución del waiver | Registra la resolución de la excepción para sprintf-js          | **Aprobado** |

---

## FIN DEL DOCUMENTO
