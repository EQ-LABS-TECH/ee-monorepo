# EE-WAIVE-QG-SEC-001-braces

| Campo                  | Valor                                                                                                                                                  |
| :--------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **gate_id**            | QG-SEC-001                                                                                                                                             |
| **package**            | braces                                                                                                                                                 |
| **advisory**           | GHSA-vfj7-8cjw-p6xm                                                                                                                                    |
| **authority**          | Architecture                                                                                                                                           |
| **reason**             | No fixed release on npm (latest 3.0.3). Path: plop → liftoff → findup-sync → micromatch → braces. Dev-only generate tooling; not runtime product path. |
| **scope**              | Root devDependency chain via plop only                                                                                                                 |
| **effective_from**     | 2026-10-16                                                                                                                                             |
| **expires_at**         | 2026-10-23                                                                                                                                             |
| **normalization_plan** | Re-evaluate when braces > 3.0.3 publishes or replace plop/liftoff stack; track GHSA-vfj7-8cjw-p6xm                                                     |
| **Refs**               | EE-DOC-010, EE-DOC-015, EE-IMP-015-P01                                                                                                                 |

---

## 01. Propósito

Waiver temporal de QG-SEC-001 para el advisory GHSA-vfj7-8cjw-p6xm (braces) sin release parcheada en npm.

---

## 02. Condiciones

- Path limitado a tooling de generate (plop), no runtime de producto.
- Renovar o cerrar antes de **expires_at**.
- No usar `pnpm.auditConfig.ignoreGhsas` como sustituto permanente de este waiver.

---

## 03. Evidencia / Condiciones del waiver

| Campo              | Valor                                    |
| :----------------- | :--------------------------------------- |
| **result**         | WAIVED                                   |
| **gate_id**        | QG-SEC-001                               |
| **authority**      | Architecture                             |
| **reason**         | Sin fix upstream; path dev-only vía plop |
| **scope**          | Root devDependency chain via plop only   |
| **effective_from** | 2026-10-16                               |
| **expires_at**     | 2026-10-23                               |

---

## 04. Resolución

| Campo                 | Valor                                                                                                                                       |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **status**            | RESOLVED                                                                                                                                    |
| **resolved_at**       | 2026-10-23                                                                                                                                  |
| **resolution_reason** | GitHub Advisory Database withdrew GHSA-vfj7-8cjw-p6xm.                                                                                      |
| **evidence**          | GitHub Advisory Database marks GHSA-vfj7-8cjw-p6xm as withdrawn on 2026-10-23; pnpm audit --audit-level low --json reports zero advisories. |
| **validation_scope**  | QG-SEC-001                                                                                                                                  |

---

## 05. Referencias

| Código         | Documento                        | Relación                                           |
| -------------- | -------------------------------- | -------------------------------------------------- |
| EE-DOC-010     | Quality Gates                    | Régimen de waivers y campos obligatorios (§04.6.1) |
| EE-DOC-015     | Engineering Ecosystem Validation | Validación del ecosistema                          |
| EE-IMP-015-P01 | Implementación de EE-DOC-015     | Evidencia de implementación relacionada            |

---

## 06. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                | Cambios                                                           | Estado       |
| ---------- | ---------- | ---------------------- | ---------------------- | --------------------- | ----------------------------------------------------------------- | ------------ |
| **v1.0.0** | 2026-10-16 | Equipo de Arquitectura | Equipo de Arquitectura | Creación del waiver   | Documenta la excepción temporal para braces bajo QG-SEC-001       | **Aprobado** |
| **v1.0.1** | 2026-10-23 | Equipo de Arquitectura | Equipo de Arquitectura | Resolución del waiver | Registra la retirada del advisory y la resolución de la excepción | **Aprobado** |

---

## FIN DEL DOCUMENTO
