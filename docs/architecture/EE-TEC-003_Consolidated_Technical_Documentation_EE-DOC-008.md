# EE-TEC-003 — Consolidated Technical Documentation of EE-DOC-008 (Development Environment)

Este documento registra la documentación técnica consolidada (estado as-built) correspondiente a la implementación de **EE-DOC-008 — Development Environment**, conforme a los estándares **EE-DOC-002** y **EE-DOC-005**.

---

## METADATOS

| Campo                 | Valor                                                    |
| :-------------------- | :------------------------------------------------------- |
| **ID**                | EE-TEC-003                                               |
| **Documento**         | Consolidated Technical Documentation of EE-DOC-008       |
| **Código corto**      | EE-TEC-003                                               |
| **Tipo**              | Documento Técnico                                        |
| **Clasificación**     | Implementación                                           |
| **Nivel**             | Técnico                                                  |
| **Normativo**         | No                                                       |
| **Versión**           | v1.0.1                                                   |
| **Estado**            | Aprobado (as-built post Validación Final)                |
| **Propietario**       | Equipo de Arquitectura                                   |
| **Documento padre**   | EE-DOC-008 — Development Environment                     |
| **Dependencias**      | EE-DOC-008, EE-IMP-008-P01 … P06, EE-ADR-003, EE-DOC-007 |
| **Aprobado por**      | Equipo de Arquitectura                                   |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, IA                     |
| **Fecha de creación** | 2026-09-24                                               |
| **Última revisión**   | 2026-09-24                                               |
| **Próxima revisión**  | 2026-12-24                                               |

---

## 01. Propósito

Consolidar el estado **as-built** del entorno de desarrollo del monorepo `ee-monorepo` tras la serie **EE-IMP-008-P01 … P06**, integrando evidencias de runtime, editor, tooling, deferimiento de Dev Container y paridad local ↔ CI.

---

## 02. Alcance

### 02.1. Cubierto

- Fases P01–P06 de EE-DOC-008.
- Artefactos: `.nvmrc`, `packageManager` / engines, scripts raíz, `.vscode/`.
- Decisión de deferimiento de `.devcontainer/`.
- Paridad de comandos con el job CI `Validate` (EE-DOC-007).

### 02.2. No cubierto

- Infraestructura de producto (EE-DOC-009).
- Catálogo normativo de Quality Gates (EE-DOC-010).
- Materialización futura de Dev Containers (requiere ADR si pasa a obligatorio).

---

## 03. Resumen Ejecutivo del Estado As-Built

| Aspecto                                            |   Estado    | Evidencia principal |
| :------------------------------------------------- | :---------: | :------------------ |
| Runtime Node 24 / pnpm packageManager              |     ✅      | EE-IMP-008-P01      |
| Bootstrap doctor + validate                        |     ✅      | EE-IMP-008-P01      |
| `.vscode/` extensions + settings                   |     ✅      | EE-IMP-008-P02      |
| Editor tooling (tasks/launch)                      | ✅ Opción A | EE-IMP-008-P03      |
| Dev Container                                      | ✅ Diferido | EE-IMP-008-P04      |
| Paridad local ↔ CI (lint/typecheck/test/validate) |     ✅      | EE-IMP-008-P05      |
| Consolidación implementación                       |     ✅      | EE-IMP-008-P06      |
| Conformidad mínima del entorno                     |     ✅      | P01+P02+P03+P05+P06 |

| Ítem             | Valor                                        |
| :--------------- | :------------------------------------------- |
| Norma            | EE-DOC-008 v1.0.0 → **Congelado**            |
| Repo             | `EQ-LABS-TECH/ee-monorepo`                   |
| Node as-built    | `v24.21.0` (`.nvmrc` = `24`)                 |
| pnpm as-built    | `10.16.1` (`packageManager`: `pnpm@10.16.1`) |
| Validación Final | **Conforme** (2026-09-24)                    |

---

## 04. Estructura Física Consolidada

```text
ee-monorepo/
├── .nvmrc                              # 24
├── package.json                        # engines.node / engines.pnpm / packageManager
├── pnpm-workspace.yaml
├── turbo.json
├── scripts/
│   ├── doctor | validate | lint | typecheck | test | …
├── .markdownlint.json                  # MD024 siblings_only; MD013 off
├── .vscode/
│   ├── extensions.json
│   └── settings.json                   # Prettier, ESLint flat, js/ts.tsdk.*; markdownlint.ignore
├── .devcontainer/                      # NO PRESENTE (P04 diferido)
└── .github/workflows/ci.yml            # job Validate (EE-DOC-007) — referencia paridad
```

> **Alineación:** sin desviaciones silenciosas respecto de EE-DOC-008. P04 es diferimiento explícito (política §07.1).

---

## 05. Detalle por fase

### 05.1. P01 — Runtime and Local Bootstrap

| Campo      | Valor                                |
| :--------- | :----------------------------------- |
| IMP        | EE-IMP-008-P01 v1.1.0                |
| Naturaleza | Validar / alinear (sin recrear)      |
| Resultado  | install + doctor + validate **pass** |

### 05.2. P02 — VS Code Workspace Governance

| Campo      | Valor                                                                                                    |
| :--------- | :------------------------------------------------------------------------------------------------------- |
| IMP        | EE-IMP-008-P02 v1.2.0                                                                                    |
| Artefactos | extensions.json + settings.json + **`.markdownlint.json`**                                               |
| Type B     | `js/ts.tsdk.path`; markdownlint SSOT (MD024 siblings_only, MD013 off); ignores LICENSE/NOTICE/CODEOWNERS |

### 05.3. P03 — Editor Tooling Specialization

| Campo                         | Valor                                           |
| :---------------------------- | :---------------------------------------------- |
| IMP                           | EE-IMP-008-P03 v1.1.0                           |
| Decisión                      | **Opción A** — sin `tasks.json` / `launch.json` |
| CODEOWNERS / LICENSE / NOTICE | Exclusiones markdownlint + plaintext (P02)      |

### 05.4. P04 — Dev Container

| Campo           | Valor                                           |
| :-------------- | :---------------------------------------------- |
| IMP             | EE-IMP-008-P04 v1.1.0                           |
| Estado          | **Diferido**; `Test-Path .devcontainer` = False |
| Adopción futura | ADR si pasa a baseline obligatorio              |

### 05.5. P05 — Local–CI Parity

| Campo     | Valor                                                                         |
| :-------- | :---------------------------------------------------------------------------- |
| IMP       | EE-IMP-008-P05 v1.0.0                                                         |
| Controles | lint / typecheck / test / validate = job `Validate`                           |
| doctor    | Excluido de paridad                                                           |
| Warnings  | W-P05-001 (0 test tasks); W-P05-002 (no runs CI listables en main al momento) |

### 05.6. P06 — Consolidation

| Campo     | Valor                                                |
| :-------- | :--------------------------------------------------- |
| IMP       | EE-IMP-008-P06 v1.0.0                                |
| Resultado | Implementación cerrada; conformidad mínima alcanzada |

---

## 06. Decisiones Técnicas Consolidadas

| ID   | Decisión                                                | Justificación                                | Origen                 |
| :--- | :------------------------------------------------------ | :------------------------------------------- | :--------------------- |
| D-01 | packageManager = baseline efectivo; engines = rango     | Reproducibility / Corepack                   | EE-DOC-008 §04.2 / P01 |
| D-02 | `.nvmrc` = `24` exacto (ADR-003)                        | No ampliar ADR unilateralmente               | EE-ADR-003 / P01       |
| D-03 | Editor recommended, core agnostic                       | Bootstrap sin IDE obligatorio                | EE-DOC-008 §06 / P02   |
| D-07 | `.markdownlint.json` SSOT; no config embebida deprecada | Falsos positivos legales/changelog; MD013=80 | P02 addendum Type B    |
| D-04 | tasks/launch opcionales (Opción A)                      | Conformidad mínima sin atajos VS Code        | P03                    |
| D-05 | Dev Container diferido                                  | Política §07.1; bootstrap viable             | P04                    |
| D-06 | Paridad = comandos del job Validate                     | SSOT CI en EE-DOC-007                        | P05                    |

---

## 07. Alineación con EE-DOC-008 y Descubrimientos

| Elemento normativo            | Estado as-built         | Clasificación                              |
| :---------------------------- | :---------------------- | :----------------------------------------- |
| §04 Runtime Node/pnpm         | ✅ Cumple               | —                                          |
| §05 Bootstrap doctor/validate | ✅ Cumple               | —                                          |
| §06 `.vscode/` + markdownlint | ✅ Cumple               | B-P02-001 (tsdk); B-P02-002 (markdownlint) |
| §07 Dev Containers            | ✅ Diferido documentado | —                                          |
| §08 / §12.8 Paridad CI        | ✅ Cumple (comandos)    | W-P05-002 (runs CI)                        |
| Conformidad mínima §12        | ✅ Cumple               | —                                          |

No existen desviaciones silenciosas.

---

## 08. Quality Gates y Validación Aplicables

| Comando              | Rol              | Resultado consolidado |
| :------------------- | :--------------- | :-------------------- |
| `pnpm run doctor`    | Entorno (P01)    | ✅                    |
| `pnpm run lint`      | Calidad / CI     | ✅                    |
| `pnpm run typecheck` | Calidad / CI     | ✅                    |
| `pnpm run test`      | Calidad / CI     | ✅ (0 tasks)          |
| `pnpm run validate`  | Verja local + CI | ✅                    |

Referencia de plataforma: `.github/workflows/ci.yml` job **Validate** (EE-DOC-007).

---

## 09. Referencias

| Código                       | Documento                  | Descripción               |
| :--------------------------- | :------------------------- | :------------------------ |
| **EE-DOC-008**               | Development Environment    | Documento normativo padre |
| **EE-IMP-008-P01** … **P06** | Unidades de implementación | Evidencia por fase        |
| **EE-ADR-003**               | Node.js Baseline 24 LTS    | Runtime                   |
| **EE-DOC-007**               | GitHub Governance          | CI de referencia          |
| **EE-DOC-002**               | Document Design Template   | Plantilla §18.4           |
| **EE-DOC-005**               | Development Workflow       | Ciclo de vida             |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                    | Cambios                                          | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :------------------------ | :----------------------------------------------- | :----------- |
| **v1.0.0** | 2026-09-24 | Equipo de Arquitectura | Equipo de Arquitectura | Consolidación post-IMP    | As-built P01–P06; Validación Final conforme      | Aprobado     |
| **v1.0.1** | 2026-09-25 | Equipo de Arquitectura | Equipo de Arquitectura | Addendum P02 markdownlint | D-07; B-P02-002; artefactos `.markdownlint.json` | **Aprobado** |

---

## FIN DEL DOCUMENTO
