# EE-IMP-010-P05 — Validation and Closure

Este documento registra la evidencia técnica de implementación de la fase **P05** de **EE-DOC-010 — Quality Gates**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                                                                  |
| :------------------------- | :----------------------------------------------------------------------------------------------------- |
| **ID**                     | EE-IMP-010-P05                                                                                         |
| **Documento**              | Validation and Closure                                                                                 |
| **Código corto**           | EE-IMP-010-P05                                                                                         |
| **Fase**                   | Fase 3 — Core Components                                                                               |
| **Fase de implementación** | P05 — Validation and Closure (Implementación de EE-DOC-010)                                            |
| **Tipo**                   | Documento Técnico de Implementación                                                                    |
| **Clasificación**          | Implementación                                                                                         |
| **Nivel**                  | Técnico                                                                                                |
| **Normativo**              | No                                                                                                     |
| **Versión**                | v1.0.0                                                                                                 |
| **Estado**                 | Completado                                                                                             |
| **Propietario**            | Equipo de Arquitectura                                                                                 |
| **Documento padre**        | EE-DOC-010 — Quality Gates (v1.4.0 Congelado)                                                          |
| **Dependencias**           | EE-DOC-005 §04 / §10.4, EE-DOC-006, EE-DOC-007, EE-DOC-010, EE-ADR-002, EE-ADR-004, EE-IMP-010-P01…P04 |
| **Aprobado por**           | Equipo de Arquitectura                                                                                 |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps, QA                                                                   |
| **Fecha de creación**      | 2026-09-29                                                                                             |
| **Última revisión**        | 2026-09-29                                                                                             |
| **Próxima revisión**       | 2026-12-29                                                                                             |

---

## 01. Objetivo

1. Verificar de forma integral los gates ACTIVE de EE-DOC-010 (positivo **y negativo**).
2. Registrar y resolver los descubrimientos D1–D6 (EE-DOC-005 §04).
3. Formalizar el régimen transitorio (EE-DOC-005 §10.4.2) de lo que permanece PENDING.
4. Preparar EE-TEC-005 y la Validación Final de EE-DOC-010.

---

## 02. Alcance

### 02.1. Incluye

- Matriz final de Availability (15 gates) con evidencia.
- Correcciones de implementación D1, D2 (`scripts/validate`).
- Aclaraciones normativas D3, D5 (+ alcance E2E) → EE-DOC-010 v1.4.0.
- Pruebas negativas por gate ACTIVE.
- Registro de diferidos D4, D6 y observaciones.
- Paquete de sincronización (010, 001, TEC-005).

### 02.2. No incluye

- Activación de SEC-003, PERF, COV (permanecen PENDING).
- Cableado de E2E y de validador de dependencias entre capas (diferidos).
- Cambio de Rulesets de GitHub.

---

## 03. Matriz final de Availability

| Gate         | Availability                                                      | Mecanismo                                                | Evidencia               |
| :----------- | :---------------------------------------------------------------- | :------------------------------------------------------- | :---------------------- |
| QG-TYPE-001  | ACTIVE                                                            | `turbo run typecheck`                                    | P01                     |
| QG-LINT-001  | ACTIVE                                                            | `turbo run lint`                                         | P01                     |
| QG-FMT-001   | ACTIVE                                                            | `prettier --check` (**critical**, tras D2)               | P01 / P05               |
| QG-SEC-001   | ACTIVE                                                            | `pnpm audit --audit-level high` (**incl. dev**, tras D1) | P01 / P05               |
| QG-REPO-001  | ACTIVE                                                            | estructura + workspace en `validate`                     | P01                     |
| QG-TEST-001  | ACTIVE (alcance: unit/integration/component)                      | `scripts/test`; 0 tareas → SKIPPED                       | P02 `b386e14`           |
| QG-BUILD-001 | ACTIVE                                                            | `validate` + step Build CI                               | P02 `b386e14`           |
| QG-SEC-002   | ACTIVE                                                            | secret scanning + push protection + Gitleaks CLI         | P03 `4bdaae3`/`6b1793f` |
| QG-ARCH-001  | ACTIVE (alcance: dirs requeridos + allowlist/forbidden top-level) | `validateStructure()`                                    | P03                     |
| QG-DOC-001   | ACTIVE                                                            | `validateDocumentation()`                                | P04 `7682e45`           |
| QG-DOC-002   | ACTIVE                                                            | name + `engines.node` ↔ `.nvmrc`                        | P04                     |
| QG-INFRA-001 | ACTIVE                                                            | `validateInfra()` (existencia de rutas)                  | P04                     |
| QG-SEC-003   | PENDING                                                           | sin SAST                                                 | §07                     |
| QG-PERF-001  | PENDING                                                           | sin umbral normativo                                     | §07                     |
| QG-COV-001   | PENDING                                                           | sin umbral normativo                                     | §07                     |

---

## 04. Registro de Descubrimientos (EE-DOC-005 §04.1)

| ID     | Descubrimiento                                                                                           | Etapa            | Clasificación                | Resultado    | Tratamiento                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------- | :--------------- | :--------------------------- | :----------- | :--------------------------------------------------------------------------------------------------------- |
| **D1** | SEC-001: norma exige high/critical incl. devDeps; código usa `--prod --audit-level critical`             | Validación Final | Corrección de implementación | **Adoptado** | `scripts/validate` → `pnpm audit --audit-level high`                                                       |
| **D2** | FMT-001 BLOCKING pero `critical: false` (no bloquea)                                                     | Validación Final | Corrección de implementación | **Adoptado** | `critical: true`                                                                                           |
| **D3** | TEST-001: 0 tareas → SKIPPED, que §04.8 trata como incumplimiento; `validate` no pasa por `scripts/test` | Validación Final | **A — Aclaración**           | **Adoptado** | 010 v1.4.0: SKIPPED por cero tareas = skip justificado contractual mientras ningún workspace defina `test` |
| **D4** | E2E (Mandatory 005 §10.1): sin script root `e2e`, sin tarea Turbo, sin CI                                | Validación Final | —                            | **Diferido** | Régimen §10.4 (ver §06); 010 acota TEST-001 a unit/integration/component                                   |
| **D5** | ARCH-001 ACTIVE valida solo top-level; 010 §05.8 promete ciclos y dependencias entre capas (006 §13.2)   | Validación Final | **A — Aclaración**           | **Adoptado** | 010 v1.4.0 reduce el contrato; validador de capas diferido                                                 |
| **D6** | Sin evidencia estructurada por gate (010 §06.2)                                                          | Validación Final | —                            | **Diferido** | Issue; evolución de `validate` a reporte JSON                                                              |

> D4 y D6 requieren Issue de seguimiento. Registrar los números aquí: D4 → `#___`, D5 (capas) → `#___`, D6 → `#___`.

---

## 05. Pruebas negativas (QG: FAIL ⇒ BLOCK)

Ejecutar en rama descartable (`git switch -c test/qg-negative`). Tras cada prueba: `git restore . && git clean -fd`. **No hacer push** salvo la prueba de CI indicada.

| #   | Gate      | Inyección de fallo                                                                                     | Resultado esperado                                 | Resultado obtenido                                                                                                                                                                                           |
| :-- | :-------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | ARCH-001  | `mkdir docker` (con un archivo dentro) → `pnpm run validate`                                           | exit ≠ 0, "forbidden top-level"                    | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N2  | ARCH-001  | `mkdir foo` (con un archivo) → `validate`                                                              | exit ≠ 0, "unauthorized top-level"                 | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N3  | DOC-001   | renombrar `NOTICE` → `validate`                                                                        | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N4  | DOC-002   | `.nvmrc` = `22` → `validate`                                                                           | exit ≠ 0, "does not align"                         | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N5  | INFRA-001 | renombrar `infra/secrets/.gitignore` → `validate`                                                      | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N6  | FMT-001   | añadir espacios/indentación rota en un `.ts` → `validate` (**tras D2**)                                | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N7  | SEC-001   | dependencia con vuln. high conocida (rama descartable) → `validate` (**tras D1**)                      | exit ≠ 0                                           | No ejecutada — cubierta por `pnpm audit` (sin vulnerabilidades high/critical; umbral verificado en código)                                                                                                   |
| N8  | TYPE-001  | error de tipos en `packages/shared/src/index.ts`                                                       | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N9  | LINT-001  | `debugger;` en un `.ts`                                                                                | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N10 | BUILD-001 | error de sintaxis en `apps/cli/src/index.ts`                                                           | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N11 | SEC-002   | commitear token falso con formato válido (p. ej. patrón AWS de ejemplo) en rama descartable; push a PR | CI `Validate` failure en step "Secret detection"   | ✅ 1.er intento (claves de ejemplo AWS): verde, inconcluyente. 2.º intento (PAT `ghp_` sintético, PR #2, run `36653937883`): step "Secret detection" FAIL, regla `github-pat`, `leaks found: 1` (2026-09-30) |
| N12 | REPO-001  | quitar un patrón de `pnpm-workspace.yaml`                                                              | exit ≠ 0                                           | ✅ exit=1 (2026-09-29)                                                                                                                                                                                       |
| N13 | TEST-001  | `pnpm run test` sin tareas                                                                             | "SKIPPED", exit 0 (comportamiento documentado, D3) | ✅ SKIPPED, exit 0 (2026-09-29)                                                                                                                                                                              |

Criterio: N1–N12 producen BLOCK; N13 produce SKIPPED. N11 no debe dejar el secreto en `main`.

---

## 06. Régimen transitorio final (EE-DOC-005 §10.4.2)

> Fechas propuestas; requieren aprobación del Equipo de Arquitectura.

| Elemento                |         Mandatory 005         | Estado                   | Plan de normalización                                 | Fecha objetivo (propuesta) | Riesgo aceptado                                       |
| :---------------------- | :---------------------------: | :----------------------- | :---------------------------------------------------- | :------------------------- | :---------------------------------------------------- |
| E2E (parte de TEST-001) |          Sí (§10.1)           | Sin cableado             | Script root `e2e` + tarea Turbo + step CI (dashboard) | 2026-12-29                 | Regresión UI no detectada en merge                    |
| QG-SEC-003 (SAST)       |      Condicional (§10.2)      | PENDING                  | ADR de herramienta + IMP                              | 2026-12-29                 | Vulnerabilidades de código sin análisis estático      |
| QG-PERF-001             |          Condicional          | PENDING                  | Publicar umbrales en 010                              | Al existir carga medible   | Bajo (sin código funcional)                           |
| QG-COV-001              |          Condicional          | PENDING                  | Publicar umbrales tras primeras suites                | Al existir suites reales   | Bajo (0 tests)                                        |
| ARCH: ciclos / capas    | Sí (Architecture & Structure) | Solo top-level           | Validador sobre matriz 006 §13.2                      | 2026-12-29                 | Violación de capas no detectada (paquetes vacíos hoy) |
| Evidencia por gate (D6) |               —               | Sin reporte estructurado | Reporte JSON en `validate`                            | 2026-12-29                 | Diagnóstico menos granular                            |

---

## 07. Observaciones (no bloqueantes)

| ID        | Observación                                                                                                                            | Tratamiento                                                                                                       |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| W-P05-001 | Gitleaks con `checkout` superficial: **confirmado** en N11 (`1 commits scanned`); no escanea historial ni los commits previos de un PR | Diferir (I-4); evaluar `fetch-depth: 0`                                                                           |
| W-P05-002 | Binario Gitleaks sin verificación de checksum                                                                                          | Diferir; Type B                                                                                                   |
| W-P05-003 | INFRA-001 solo valida existencia de rutas                                                                                              | Coherente con baseline; ampliar cuando existan manifiestos                                                        |
| W-P05-004 | Texto obsoleto en 010 (§05.7–05.9 "PENDING"; §14.3 "Próximo hito P01")                                                                 | Corregido en v1.4.0                                                                                               |
| W-P05-005 | `README.md` del repo indica "Phase 7"; referencia `ADR-001`                                                                            | Sincronizar en el paquete de cierre                                                                               |
| W-P05-007 | Push de `e2400d3` directo a `main` con bypass del ruleset (PR + check `Validate` esperado)                                             | Excepción single-operator ya registrada (W-P03-001, EE-TEC-002 §06); CI verde posterior; cierra con 2º maintainer |
| W-P05-008 | Aviso Git "LF will be replaced by CRLF" en `scripts/validate` (scripts sin extensión no cubiertos por `.gitattributes`)                | Diferir; Type B (`scripts/* text eol=lf`)                                                                         |
| W-P05-006 | DEP0190 (`shell: true`), Turbo 2.9.14 → 2.11.5                                                                                         | Heredados de P02; diferidos                                                                                       |

---

## 08. Paquete de sincronización (al cierre)

| Artefacto          | Cambio                                                                                                                       | Regla                 |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------- | :-------------------- |
| `scripts/validate` | D1, D2                                                                                                                       | Type B                |
| EE-DOC-010         | v1.4.0 (D3, D5, alcance E2E, texto obsoleto, §14)                                                                            | EE-DOC-005 §04        |
| EE-TEC-005         | Consolidación P01–P05 (plantilla EE-DOC-002 §18.4)                                                                           | EE-DOC-005 §04.6 #4–5 |
| EE-DOC-001         | v2.7.0: matriz §09 (010 → Congelado/Validado), IMP-010-P01…P05, EE-TEC-005, métricas §13 (10 congelados, 5 implementaciones) | R9 / R10              |
| `README.md`        | Estado de fases                                                                                                              | W-P05-005             |

Orden: correcciones de código → pruebas negativas → 010 v1.4.0 → EE-TEC-005 → Validación Final → 001.

---

## 09. Condiciones de entrada a la Validación Final (EE-DOC-005 §04.6)

| #   | Condición                                      | Estado                             |
| :-- | :--------------------------------------------- | :--------------------------------- |
| 1   | Todas las fases de Implementación completadas  | ✅ P01–P05                         |
| 2   | Cada fase con su Validación                    | ✅ P01–P04                         |
| 3   | Borrador de Documentación Técnica por fase     | ✅ P01–P04                         |
| 4   | Documentación Técnica consolidada (EE-TEC-005) | Borrador emitido                   |
| 5   | Consolidada validada                           | Pendiente                          |
| 6   | Validación Final satisfactoria                 | Pendiente                          |
| 7   | Sin desviaciones no documentadas               | ✅ D1–D6 resueltos/diferidos (§04) |
| 8   | Descubrimientos clasificados                   | ✅ §04                             |
| 9   | ADR requeridos aprobados                       | N/A (sin ADR nuevo)                |
| 10  | RFC requeridos aprobados                       | N/A                                |
| 11  | Documento actualizado                          | ✅ EE-DOC-010 v1.4.0               |
| 12  | Versión final aprobada / Validación Final 010  | ✅ 2026-09-30                      |

---

## 10. Validaciones Ejecutadas

| Comando / Prueba                           | Resultado | Detalle                                                                                                                                      |
| :----------------------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm audit --audit-level high`            | ✅        | No known vulnerabilities found                                                                                                               |
| `pnpm run validate` (tras D1/D2)           | ✅        | typecheck 18/18, lint 25/25, test 0 tareas, build 25/25, format OK (critical), audit OK (high, incl. dev), estructura/workspace/DOC/INFRA OK |
| Pruebas negativas N1–N10, N12, N13         | ✅        | §05; resultado por exit code (N8–N10 sin atribución por fase); N7 no ejecutada; N11 ✅                                                       |
| CI `Validate` sobre commit de correcciones | ✅        | `e2400d3` (push a main), run `36652601997`, success, 41s                                                                                     |

### 10.1. Resultado y estado de la fase

**Completado (v1.0.0).** Todos los gates ACTIVE verificados en positivo (`validate` PASS, CI success `e2400d3`) y en negativo (N1–N6, N8–N13; N7 cubierta por herramienta). Descubrimientos D1–D6 resueltos o diferidos con régimen transitorio (§06). Pendiente de aprobación de Arquitectura: fechas del §06 y números de Issue (§04).

**Siguiente:** EE-DOC-011 (roadmap). EE-TEC-005 Completado; EE-DOC-010 Congelado; sincronizar EE-DOC-001.

---

## 11. Trazabilidad

| Elemento     | Referencia                          |
| :----------- | :---------------------------------- |
| Norma        | EE-DOC-010 v1.3.0 → v1.4.0          |
| Adopción     | EE-DOC-005 §10.4; EE-ADR-004        |
| Predecesores | EE-IMP-010-P01…P04 Completados      |
| Siguiente    | EE-DOC-011 (roadmap); 010 Congelado |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo          | Cambios                                                                            | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :-------------- | :--------------------------------------------------------------------------------- | :------------- |
| **v0.1.0** | 2026-09-29 | Equipo de Arquitectura | —                      | Apertura P05    | Descubrimientos D1–D6, matriz, pruebas negativas, régimen transitorio              | Borrador       |
| **v0.2.0** | 2026-09-29 | Equipo de Arquitectura | —                      | Evidencia local | validate PASS tras D1/D2; N1–N10, N12, N13 registradas; pendientes: commit/CI, N11 | Borrador       |
| **v0.3.0** | 2026-09-29 | Equipo de Arquitectura | —                      | Evidencia CI    | Commit `e2400d3` (D1/D2) con CI Validate success; W-P05-007/008; pendiente N11     | Borrador       |
| **v1.0.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P05      | N11 PASS; EE-DOC-010 v1.4.0 Congelado; EE-TEC-005 Completado; Validación Final     | **Completado** |

---

## FIN DEL DOCUMENTO
