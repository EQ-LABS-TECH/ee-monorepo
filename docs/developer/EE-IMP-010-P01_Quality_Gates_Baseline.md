# EE-IMP-010-P01 — Quality Gates Baseline

Este documento registra la evidencia técnica de implementación de la fase **P01** de **EE-DOC-010 — Quality Gates**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                       |
| :------------------------- | :---------------------------------------------------------- |
| **ID**                     | EE-IMP-010-P01                                              |
| **Documento**              | Quality Gates Baseline                                      |
| **Código corto**           | EE-IMP-010-P01                                              |
| **Fase**                   | Fase 3 — Core Components                                    |
| **Fase de implementación** | P01 — Quality Gates Baseline (Implementación de EE-DOC-010) |
| **Tipo**                   | Documento Técnico de Implementación                         |
| **Clasificación**          | Implementación                                              |
| **Nivel**                  | Técnico                                                     |
| **Normativo**              | No                                                          |
| **Versión**                | v1.1.0                                                      |
| **Estado**                 | Completado                                                  |
| **Propietario**            | Equipo de Arquitectura                                      |
| **Documento padre**        | EE-DOC-010 — Quality Gates (v1.0.0 Aprobado)                |
| **Dependencias**           | EE-DOC-005, EE-DOC-006, EE-DOC-007, EE-DOC-010, EE-ADR-004  |
| **Aprobado por**           | Equipo de Arquitectura                                      |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps, QA                        |
| **Fecha de creación**      | 2026-09-29                                                  |
| **Última revisión**        | 2026-09-29                                                  |
| **Próxima revisión**       | 2026-12-29                                                  |

---

## 01. Objetivo

Materializar el **baseline contractual** de Quality Gates definido por **EE-DOC-010 v1.0.0**:

1. Confirmar el **Minimum Merge Set ACTIVE** y su mapeo al required check **`Validate`** (EE-DOC-007).
2. Documentar el **régimen transitorio** de gates **Mandatory + PENDING** (EE-DOC-005 §10.4 / EE-ADR-004).
3. Verificar que la suite local / `validate` y el job CI **`Validate`** ejecutan y agregan los gates ACTIVE sin False Pass.
4. Registrar evidencia de conformidad del baseline actual (TYPE, LINT, FMT, SEC-001, REPO).

Esta fase **no** activa TEST / BUILD / SEC-002 / ARCH / DOC (eso corresponde a P02–P04).

---

## 02. Alcance Implementado

### 02.1. Incluye

- Inventario de gates **ACTIVE** vs **PENDING** según EE-DOC-010 §05.1.
- Contrato de agregación (§04.8) aplicado al job `Validate` / `pnpm run validate`.
- Mapeo gate → mecanismo actual (comandos root / suite).
- Registro del régimen transitorio de Mandatory PENDING.
- Criterios de aceptación y evidencia as-built de P01.

### 02.2. No incluye

- Cableado de QG-TEST-001 / QG-BUILD-001 como gates desglosados (→ **P02**).
- Secret detection / SAST / architecture boundaries automatizados (→ **P03**).
- DOC / COV / PERF / INFRA automation (→ **P04**).
- Emisión de EE-TEC-005 (→ **P05**).
- Cambio de Rulesets de GitHub más allá de confirmar el required check existente `Validate`.

---

## 03. Estructura Física y Artefactos de Referencia

No se crean directorios top-level nuevos. Los artefactos de ejecución ya viven en el monorepo:

```text
ee-monorepo/
├── package.json                 # scripts root: validate, lint, typecheck, test, build, format
├── scripts/
│   ├── validate                 # suite agregadora local
│   ├── lint | typecheck | test | build | format | doctor
│   └── README.md
├── .github/workflows/
│   └── ci.yml                   # job Validate (EE-DOC-007)
├── .nvmrc                       # Node 24 (EE-ADR-003)
└── packages/config/
```

---

## 04. Modelo de Ejecución (Baseline)

```text
Cambio (PR / push)
    → pnpm run validate (local)  y/o  job Validate (CI)
        → typecheck (QG-TYPE-001)
        → lint (QG-LINT-001)
        → prettier --check (QG-FMT-001)
        → pnpm audit (QG-SEC-001)
        → structure / workspace checks (QG-REPO-001)
    → Agregación §04.8 (solo ACTIVE evaluados)
    → ACCEPT | ACCEPT_WITH_WARNINGS | BLOCK
```

### 04.1. Repartición de responsabilidades

| Componente           | Responsabilidad                                        |
| :------------------- | :----------------------------------------------------- |
| **EE-DOC-010**       | Norma: IDs, Severity, Availability, Result, agregación |
| **EE-DOC-005 §10**   | Mandatory Gates + régimen §10.4                        |
| **scripts/validate** | Materialización local del agregador                    |
| **job `Validate`**   | Required check CI (EE-DOC-007)                         |
| **EE-IMP-010-P01**   | Evidencia de baseline y régimen transitorio            |

---

## 05. Especificación Técnica — Minimum Merge Set ACTIVE

| Gate            | Severity | Availability | Mecanismo                                          | En agregador |
| :-------------- | :------- | :----------- | :------------------------------------------------- | :----------- |
| **QG-TYPE-001** | BLOCKING | ACTIVE       | `pnpm run typecheck`                               | Sí           |
| **QG-LINT-001** | BLOCKING | ACTIVE       | `pnpm run lint`                                    | Sí           |
| **QG-FMT-001**  | BLOCKING | ACTIVE       | Prettier `--check` vía `validate`                  | Sí           |
| **QG-SEC-001**  | BLOCKING | ACTIVE       | `pnpm audit` vía `validate` (umbral high/critical) | Sí           |
| **QG-REPO-001** | BLOCKING | ACTIVE       | Checks estructura en `validate` / `doctor`         | Sí           |

**Required status check (plataforma):** `Validate` — garantiza el conjunto anterior cuando los paths / aplicabilidad correspondan.

### 05.1. Gates Mandatory PENDING (régimen transitorio)

| Gate             | Mandatory 005                 | Availability | Régimen                               |
| :--------------- | :---------------------------- | :----------- | :------------------------------------ |
| QG-TEST-001      | Sí (Unit/Integration + E2E)   | PENDING      | EE-DOC-005 §10.4 → activar en **P02** |
| QG-BUILD-001     | Sí (Build)                    | PENDING      | EE-DOC-005 §10.4 → activar en **P02** |
| QG-SEC-002       | Sí (Secret Scanning)          | PENDING      | → **P03**                             |
| QG-ARCH-001      | Sí (Architecture & Structure) | PENDING      | → **P03**                             |
| QG-DOC-001 / 002 | Sí (Documentation Validation) | PENDING      | → **P04**                             |

**Reglas del régimen (P01):**

1. No declarar **PASS** de un gate PENDING.
2. No tratar PENDING como opcional.
3. Plan de normalización = unidades **EE-IMP-010-P02…P04**.
4. Bypass ad hoc (§10.3) **no** sustituye este régimen.

---

## 06. Contrato de Agregación (Baseline)

Conforme a EE-DOC-010 §04.8:

| Situación                                            | Decisión                 |
| :--------------------------------------------------- | :----------------------- |
| Ningún resultado ACTIVE evaluado                     | **BLOCK**                |
| ACTIVE evaluados; todos NOT_APPLICABLE con evidencia | **ACCEPT**               |
| Algún BLOCKING ACTIVE incumplido                     | **BLOCK**                |
| Solo WARNING incumplidos                             | **ACCEPT_WITH_WARNINGS** |
| ACTIVE conformes                                     | **ACCEPT**               |

PENDING **no** entra en la agregación de merge.

---

## 07. Criterios de Aceptación P01

| #   | Criterio                                                     | Evidencia esperada  | Estado |
| :-- | :----------------------------------------------------------- | :------------------ | :----- |
| 1   | `pnpm run validate` PASS en working tree alineado a main     | Log local           | ✅     |
| 2   | Job CI `Validate` success en commit de referencia            | `gh run list` / API | ✅     |
| 3   | Gates ACTIVE del §05 listados y mapeados a mecanismos reales | Esta IMP §05        | ✅     |
| 4   | Régimen transitorio de Mandatory PENDING documentado         | Esta IMP §05.1      | ✅     |
| 5   | No se declara PASS de gates PENDING                          | Revisión de logs    | ✅     |
| 6   | Required check name = `Validate` confirmado en repo          | API check-runs      | ✅     |

---

## 08. Procedimiento de Ejecución (operador)

```powershell
# Desde la raíz del monorepo (Windows PowerShell)
node -v
pnpm -v

pnpm install
pnpm run doctor
pnpm run validate

gh run list --workflow=ci.yml --branch main --limit 3
gh api repos/EQ-LABS-TECH/ee-monorepo/commits/main/check-runs --jq ".check_runs[] | {name, status, conclusion}"
```

---

## 09. Validaciones Ejecutadas

| Comando / Prueba                                        | Resultado | Detalle                                                                          |
| :------------------------------------------------------ | :-------- | :------------------------------------------------------------------------------- |
| `node -v`                                               | ✅        | v24.21.0 (≥24 <25, EE-ADR-003)                                                   |
| `pnpm -v`                                               | ✅        | 10.16.1                                                                          |
| `pnpm install`                                          | ✅        | 26 workspace projects; lockfile up to date; Done in 2.9s                         |
| `pnpm run doctor`                                       | ✅        | Diagnostic completed successfully (Node, pnpm, Git, structure, Turbo 2.9.14)     |
| `pnpm run validate`                                     | ✅        | All validations passed successfully                                              |
| — typecheck                                             | ✅        | 18 successful (FULL TURBO, cached)                                               |
| — lint                                                  | ✅        | 25 successful (FULL TURBO, cached)                                               |
| — format check                                          | ✅        | All matched files use Prettier code style                                        |
| — security audit                                        | ✅        | No known vulnerabilities found                                                   |
| — project structure / workspace                         | ✅        | Conform                                                                          |
| — test phase in validate                                | ℹ️        | 0 tasks executed (esperado: QG-TEST-001 **PENDING**; no se declara PASS de TEST) |
| `gh run list --workflow=ci.yml --branch main --limit 3` | ✅        | 3 runs success (push main)                                                       |
| `gh api .../check-runs`                                 | ✅        | `Validate` → status completed, conclusion **success**                            |

### 09.1. Resultado de la Implementación y Estado de la Fase

**Estado P01: Completado (v1.1.0).**

Todos los criterios de aceptación §07 están cumplidos. El baseline ACTIVE (TYPE, LINT, FMT, SEC-001, REPO) está verificado en local y en CI. El régimen de Mandatory PENDING queda explícito y sin False Pass.

**Siguiente:** **EE-IMP-010-P02** — Core Gates Activation (QG-TEST-001 + QG-BUILD-001 → ACTIVE cuando el mecanismo esté cableado con evidencia).

### 09.2. Correcciones / Warnings Observados

| ID        | Observación                                        | Tratamiento                                                                                          |
| :-------- | :------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| W-P01-001 | Turbo CLI reporta update available 2.9.14 → 2.11.5 | Informativo; no bloquea P01. Evaluación de upgrade diferida (Version Pinning / Type B si se adopta). |
| W-P01-002 | Fase `test` en validate: 0 tasks                   | Conforme a Availability **PENDING** de QG-TEST-001; se resuelve en P02 sin declarar False Pass.      |

---

## 10. Trazabilidad

| Artefacto           | Referencia                                            |
| :------------------ | :---------------------------------------------------- |
| Norma               | EE-DOC-010 v1.0.0 §04, §05, §09.1 P01                 |
| Workflow / adopción | EE-DOC-005 §10.4; EE-ADR-004                          |
| CI                  | EE-DOC-007 — job / required check `Validate`          |
| Comandos root       | EE-DOC-006                                            |
| Siguiente fase      | EE-IMP-010-P02 — Core Gates Activation (TEST + BUILD) |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                 | Cambios                                                                                                      | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-09-29 | Equipo de Arquitectura | —                      | Apertura P01           | Baseline contractual, Merge Set ACTIVE, régimen PENDING                                                      | Borrador       |
| **v1.1.0** | 2026-09-29 | Equipo de Arquitectura | Equipo de Arquitectura | Evidencia as-built P01 | validate PASS; doctor PASS; CI Validate success; régimen PENDING confirmado; documento único sin duplicación | **Completado** |

---

## FIN DEL DOCUMENTO
