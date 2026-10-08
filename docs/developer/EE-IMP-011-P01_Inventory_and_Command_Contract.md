# EE-IMP-011-P01 — Inventory and Command Contract

Este documento registra la evidencia técnica de implementación de la fase **P01** de **EE-DOC-011 — Automation**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                               |
| :------------------------- | :------------------------------------------------------------------ |
| **ID**                     | EE-IMP-011-P01                                                      |
| **Documento**              | Inventory and Command Contract                                      |
| **Código corto**           | EE-IMP-011-P01                                                      |
| **Fase**                   | Fase 3 — Core Components                                            |
| **Fase de implementación** | P01 — Inventory and Command Contract (Implementación de EE-DOC-011) |
| **Tipo**                   | Documento Técnico de Implementación                                 |
| **Clasificación**          | Implementación                                                      |
| **Nivel**                  | Técnico                                                             |
| **Normativo**              | No                                                                  |
| **Versión**                | v1.1.0                                                              |
| **Estado**                 | Completado                                                          |
| **Propietario**            | Equipo de Arquitectura                                              |
| **Documento padre**        | EE-DOC-011 — Automation (v1.0.0 Aprobado)                           |
| **Dependencias**           | EE-DOC-005, EE-DOC-006 §12, EE-DOC-007, EE-DOC-011, EE-ADR-001      |
| **Aprobado por**           | Equipo de Arquitectura                                              |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                                    |
| **Fecha de creación**      | 2026-09-30                                                          |
| **Última revisión**        | 2026-09-30                                                          |
| **Próxima revisión**       | 2026-12-30                                                          |

---

## 01. Objetivo

1. Inventariar el estado **as-built** de comandos root (`package.json`) y archivos bajo `scripts/` frente a **EE-DOC-011 §04.2**.
2. Detectar gaps, sobrantes o divergencias respecto al contrato normativo.
3. Alinear **`scripts/README.md`** como documentación operativa **derivada** de §04.2 (misma ola si hay cambios).
4. Registrar evidencia de conformidad de P01 **sin** endurecer scripts (eso es **P02**).

**Naturaleza de P01:** validación + documentación de contrato. Solo se modifica código/README si el inventario exige sincronización; no es fase de hardening.

---

## 02. Alcance

### 02.1. Incluye

- Tabla comparativa §04.2 ↔ `package.json` ↔ `scripts/<name>`.
- Estado de `changeset` / `version-packages` (A-REL sin archivo en `scripts/`).
- Revisión de `scripts/README.md` vs norma.
- Criterios de aceptación y procedimiento operador.
- Descubrimientos Type A/B si aparecen.

### 02.2. No incluye

- Refactor de exit codes / `shell:true` (→ **P02**).
- Superficie CLI `@eq-labs/cli` (→ **P03**).
- Auditoría profunda generate/release (→ **P04**).
- EE-TEC-011 (→ **P05**).

---

## 03. Contrato normativo de referencia (EE-DOC-011 §04.2)

| Comando            | Implementación esperada | Categoría |
| :----------------- | :---------------------- | :-------- |
| `bootstrap`        | `scripts/bootstrap`     | A-ROOT    |
| `build`            | `scripts/build`         | A-ROOT    |
| `dev`              | `scripts/dev`           | A-ROOT    |
| `test`             | `scripts/test`          | A-ROOT    |
| `lint`             | `scripts/lint`          | A-ROOT    |
| `format`           | `scripts/format`        | A-ROOT    |
| `typecheck`        | `scripts/typecheck`     | A-ROOT    |
| `validate`         | `scripts/validate`      | A-ROOT    |
| `doctor`           | `scripts/doctor`        | A-ROOT    |
| `generate`         | `scripts/generate`      | A-GEN     |
| `release`          | `scripts/release`       | A-REL     |
| `clean`            | `scripts/clean`         | A-ROOT    |
| `changeset`        | CLI `@changesets/cli`   | A-REL     |
| `version-packages` | `changeset version`     | A-REL     |

---

## 04. Inventario as-built (referencia monorepo)

Fuente: `package.json` raíz y árbol `scripts/` (snapshot de trabajo EE / `Paquetes_Archivos_Monorepo`).

### 04.1. `package.json` → scripts

| Comando §04.2    | Presente en package.json | Valor declarado          |
| :--------------- | :----------------------: | :----------------------- |
| bootstrap        |            ✅            | `node scripts/bootstrap` |
| build            |            ✅            | `node scripts/build`     |
| dev              |            ✅            | `node scripts/dev`       |
| test             |            ✅            | `node scripts/test`      |
| lint             |            ✅            | `node scripts/lint`      |
| format           |            ✅            | `node scripts/format`    |
| typecheck        |            ✅            | `node scripts/typecheck` |
| validate         |            ✅            | `node scripts/validate`  |
| doctor           |            ✅            | `node scripts/doctor`    |
| generate         |            ✅            | `node scripts/generate`  |
| release          |            ✅            | `node scripts/release`   |
| clean            |            ✅            | `node scripts/clean`     |
| changeset        |            ✅            | `changeset`              |
| version-packages |            ✅            | `changeset version`      |

**Resultado package.json:** **14/14** comandos normativos presentes. Sin comandos root extra no documentados en §04.2 (salvo que el inventario local demuestre lo contrario).

### 04.2. Archivos bajo `scripts/`

| Path                         | Rol                                 |
| :--------------------------- | :---------------------------------- |
| `scripts/bootstrap`          | ✅ A-ROOT                           |
| `scripts/build`              | ✅ A-ROOT                           |
| `scripts/dev`                | ✅ A-ROOT                           |
| `scripts/test`               | ✅ A-ROOT                           |
| `scripts/lint`               | ✅ A-ROOT                           |
| `scripts/format`             | ✅ A-ROOT                           |
| `scripts/typecheck`          | ✅ A-ROOT                           |
| `scripts/validate`           | ✅ A-ROOT                           |
| `scripts/doctor`             | ✅ A-ROOT                           |
| `scripts/generate`           | ✅ A-GEN                            |
| `scripts/release`            | ✅ A-REL                            |
| `scripts/clean`              | ✅ A-ROOT                           |
| `scripts/README.md`          | Documentación operativa (derivada)  |
| `scripts/configure-lint.mjs` | Auxiliar (no es comando root §04.2) |

**Nota:** `configure-lint.mjs` no forma parte del contrato de comandos root; es soporte de tooling. No requiere entrada en §04.2 salvo que se exponga como `pnpm run …`.

### 04.3. Gap: `scripts/README.md`

Estado observado (as-built):

- Documenta bien la separación **pnpm** vs **Turbo** (ADR-001).
- Tabla de “Repository-level Commands” **incompleta** respecto a §04.2: lista de forma parcial (`bootstrap`, `format`, `validate`, `doctor`, `generate`, `release`) y **omite** `build`, `dev`, `test`, `lint`, `typecheck`, `clean`, `changeset`, `version-packages`.
- Algunas descripciones de implementación están simplificadas (p.ej. bootstrap ≠ solo `pnpm install` en el script real).

**Clasificación del gap:** Type A / sincronización documental — **Adoptado y cerrado** en P01 (`aab8dba`).

**Acción P01:** actualizar `scripts/README.md` para:

1. Tabla completa alineada a EE-DOC-011 §04.2 (14 comandos).
2. Indicar categoría A-ROOT / A-GEN / A-REL.
3. Aclarar que `changeset` / `version-packages` no tienen archivo en `scripts/`.
4. Aclarar `format` (write) vs verificación en `validate` (check) — EE-DOC-011 / 010.
5. Referenciar EE-DOC-011 como norma del contrato; README = derivado.

---

## 05. Matriz de conformidad P01

| Criterio EE-DOC-011 §12.2 P01                          | Estado          | Evidencia                 |
| :----------------------------------------------------- | :-------------- | :------------------------ |
| Todos los comandos §04.2 existen en `package.json`     | ✅ (inventario) | §04.1                     |
| Archivos `scripts/<name>` donde aplica                 | ✅              | §04.2                     |
| `changeset` / `version-packages` sin exigir `scripts/` | ✅              | §04.1                     |
| `scripts/README.md` alineado a §04.2                   | ✅              | Commit `aab8dba`          |
| Sin comandos root huérfanos no justificados            | ✅              | Inventario local operador |

---

## 06. Procedimiento operador (PowerShell)

### 06.1. Inventario local (Paso 1)

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# Comandos en package.json
node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).sort().join('\n'))"

# Archivos scripts/
Get-ChildItem scripts -File | Select-Object Name, Length | Format-Table -AutoSize

# README actual
Get-Content scripts\README.md
```

### 06.2. Actualizar `scripts/README.md` (Paso 2)

Reemplazar o ampliar la sección de comandos con la tabla normativa (contenido mínimo):

```markdown
## Repository-level Commands (EE-DOC-011 §04.2)

Normative contract: **EE-DOC-011 — Automation**. This README is operational documentation derived from that contract.

| Command            | Implementation      | Category | Responsibility                                          |
| ------------------ | ------------------- | -------- | ------------------------------------------------------- |
| `bootstrap`        | `scripts/bootstrap` | A-ROOT   | Environment setup                                       |
| `build`            | `scripts/build`     | A-ROOT   | Workspace build                                         |
| `dev`              | `scripts/dev`       | A-ROOT   | Local development (long-running)                        |
| `test`             | `scripts/test`      | A-ROOT   | Orchestrated tests (QG-TEST-001)                        |
| `lint`             | `scripts/lint`      | A-ROOT   | Lint (QG-LINT-001)                                      |
| `format`           | `scripts/format`    | A-ROOT   | Prettier **write** (not the format gate)                |
| `typecheck`        | `scripts/typecheck` | A-ROOT   | Typecheck (QG-TYPE-001)                                 |
| `validate`         | `scripts/validate`  | A-ROOT   | Local validation aggregator (EE-DOC-010)                |
| `doctor`           | `scripts/doctor`    | A-ROOT   | Environment diagnostics (not a substitute for validate) |
| `generate`         | `scripts/generate`  | A-GEN    | Scaffolding (Plop)                                      |
| `release`          | `scripts/release`   | A-REL    | Monorepo release orchestration                          |
| `clean`            | `scripts/clean`     | A-ROOT   | Clean build artifacts / caches                          |
| `changeset`        | `@changesets/cli`   | A-REL    | Declare SemVer changes (no `scripts/` file)             |
| `version-packages` | `changeset version` | A-REL    | Apply versions (no `scripts/` file)                     |

### Format write vs check

- `pnpm run format` rewrites files (local tool).
- The format **Quality Gate** uses check mode inside `pnpm run validate` (EE-DOC-010 / EE-DOC-011).
```

Conservar en el README las secciones existentes sobre pnpm vs Turbo (ADR-001) si siguen siendo correctas.

### 06.3. Verificar y publicar (Paso 3)

```powershell
pnpm run validate

git add scripts/README.md
git status --short
git commit -m "docs(scripts): align README with EE-DOC-011 root command contract (EE-IMP-011-P01)

- Full §04.2 command table (14 entries)
- A-REL changeset/version-packages without scripts/ files
- format write vs validate check clarification

Refs: EE-DOC-011, EE-DOC-006, EE-IMP-011-P01"
git push origin main

gh run list --workflow=ci.yml --branch main --limit 1
```

---

## 07. Criterios de aceptación

| #   | Criterio                                         | Estado                   |
| :-- | :----------------------------------------------- | :----------------------- |
| 1   | Inventario local ejecutado y pegado en evidencia | ✅                       |
| 2   | 14/14 comandos §04.2 en `package.json`           | ✅                       |
| 3   | `scripts/` completo para comandos con archivo    | ✅                       |
| 4   | `scripts/README.md` sincronizado                 | ✅ `aab8dba`             |
| 5   | `pnpm run validate` PASS                         | ✅ (post-deps `169c298`) |
| 6   | Commit + CI success                              | ✅ CI run `36783979514`  |
| 7   | Este IMP actualizado a Completado                | ✅ v1.1.0                |

---

## 08. Validaciones ejecutadas

| Prueba                          | Resultado | Detalle                                                        |
| :------------------------------ | :-------- | :------------------------------------------------------------- |
| Inventario package.json (local) | ✅        | 14 comandos listados por operador                              |
| Inventario scripts/ (local)     | ✅        | 12 entrypoints + README + `configure-lint.mjs`                 |
| README alineado                 | ✅        | `aab8dba` — tabla §04.2 completa                               |
| Mitigación QG-SEC-001           | ✅        | overrides `brace-expansion`, drop `rimraf`, turbo **2.11.5**   |
| validate                        | ✅        | All validations passed (3 moderate residual, no high blocking) |
| CI `Validate`                   | ✅        | run `36783979514` — success                                    |

### 08.1. Commits de la fase

| SHA       | Mensaje                                                                                     |
| :-------- | :------------------------------------------------------------------------------------------ |
| `aab8dba` | docs(scripts): align README with EE-DOC-011 root command contract (EE-IMP-011-P01)          |
| `169c298` | fix(deps): patch brace-expansion, drop rimraf, turbo 2.11.5; yaml editor limit (QG-SEC-001) |

### 08.2. Estado de la fase

**Completado** — inventario, contrato README y validate/CI en verde.

---

## 09. Descubrimientos

| ID        | Descripción                                        | Resultado                                                                       |
| :-------- | :------------------------------------------------- | :------------------------------------------------------------------------------ |
| D-P01-001 | `scripts/README.md` incompleto vs §04.2            | **Adoptado Type A** — sync `aab8dba`                                            |
| D-P01-002 | `configure-lint.mjs` auxiliar no root              | **Aceptado** — fuera de §04.2                                                   |
| D-P01-003 | High on `brace-expansion` vía rimraf/eslint/jest   | **Adoptado Type B** — `pnpm.overrides` + drop rimraf + turbo 2.11.5 (`169c298`) |
| D-P01-004 | `yaml.maxItemsComputed` en `.vscode/settings.json` | **Adoptado Type A** — DX editor; mismo commit deps                              |

---

## 10. Trazabilidad

| Artefacto  | Referencia                              |
| :--------- | :-------------------------------------- |
| Norma      | EE-DOC-011 v1.0.0 §04.2, §05.3, §12 P01 |
| Estructura | EE-DOC-006 §12                          |
| Siguiente  | **EE-IMP-011-P02** — Scripts Hardening  |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                                | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :--------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-09-30 | Equipo de Arquitectura | —                      | Apertura P01 | Inventario vs §04.2; gap README; procedimiento                         | Borrador       |
| **v1.1.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P01   | Evidencia local 14/14; README; SEC-001 mitigado; CI ✓; fase Completado | **Completado** |

---

## FIN DEL DOCUMENTO
