# EE-IMP-014-P01 — Inventory and Boundaries

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** (§18.3 — Documentos Técnicos de Implementación EE-IMP-XXX-PXX) y materializa la unidad **P01** de **EE-DOC-014 — Knowledge Management** (Aprobado v1.0.0).

---

## METADATOS

| Campo                 | Valor                                                                                                                |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **ID**                | EE-IMP-014-P01                                                                                                       |
| **Documento**         | Inventory and Boundaries (Knowledge Layer)                                                                           |
| **Código corto**      | EE-IMP-014-P01                                                                                                       |
| **Tipo**              | Documento Técnico de Implementación                                                                                  |
| **Clasificación**     | Especializado                                                                                                        |
| **Normativo**         | No (evidencia de implementación)                                                                                     |
| **Versión**           | v1.1.0                                                                                                               |
| **Estado**            | Completado                                                                                                           |
| **Propietario**       | Equipo de Arquitectura                                                                                               |
| **Documento padre**   | EE-DOC-014 — Knowledge Management                                                                                    |
| **Dependencias**      | EE-DOC-006, EE-DOC-007, EE-DOC-010, EE-DOC-013, EE-ADR-001, EE-ADR-005, EE-TEC-005, EE-IMP-013-P05 (precedente D-01) |
| **Aprobado por**      | Equipo de Arquitectura                                                                                               |
| **Audiencia**         | Arquitectura, Desarrollo                                                                                             |
| **Fecha de creación** | 2026-10-05                                                                                                           |
| **Última revisión**   | 2026-10-05                                                                                                           |
| **Unidad de fase**    | P01 de EE-DOC-014 §09.1                                                                                              |

---

## 01. Objetivo

Formalizar el **inventario as-built** de la Knowledge Layer, verificar **fronteras** (Intelligence / Registry / `docs/` / 006), inspeccionar **CODEOWNERS** frente a **KS-06**, registrar precondiciones **QG-SEC-001** y el **riesgo residual** single-operator, y adoptar el descubrimiento **Tipo B** si faltan paths finos de ownership.

**No** materializa el Knowledge Port (P03), ni exports del package (P02), ni backends de store (P04/P05).

---

## 02. Criterios de aceptación (EE-DOC-014 §09.1 / §09.3)

| #      | Criterio                                                                                  | Resultado                                      |
| :----- | :---------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **C1** | Inventario escrito del as-built (Port, exports, stub, nested vs plano)                    | ✅ PASS                                        |
| **C2** | Boundaries sin ambigüedad (013 / Registry / docs / 006)                                   | ✅ PASS                                        |
| **C3** | CODEOWNERS: comprobar `packages/knowledge/**` y path de contracts knowledge en Foundation | ⚠️ **FAIL controlado** → Tipo B adoptado (§06) |
| **C4** | Precondición estado QG-SEC-001 documentada                                                | ✅ PASS (registro)                             |
| **C5** | Riesgo single-operator documentado                                                        | ✅ PASS                                        |

**Dictamen de fase:** P01 **Completado** con KS-06 **no satisfecho** hasta materializar CODEOWNERS (§06 / P02).

---

## 03. Inventario as-built (canónico)

> Fuente: monorepo `ee-monorepo` / snapshot `Paquetes_Archivos_Monorepo` (2026-10-05). Este inventario **sustituye** la dependencia de la sola fecha en EE-DOC-014 §04.3.1.

### 03.1. Workspace y forma del paquete

| Ítem                             | Evidencia              | Norma 014                    |
| :------------------------------- | :--------------------- | :--------------------------- |
| Entrada en `pnpm-workspace.yaml` | `- packages/knowledge` | ✅                           |
| Nested `knowledge-engine/`, etc. | **Ausentes**           | ✅ Paquete **plano** (§04.2) |
| Otros workspaces knowledge       | **No**                 | ✅                           |

### 03.2. `@eq-labs/knowledge`

| Campo                        | As-built                                                                       | Gap vs 014                               |
| :--------------------------- | :----------------------------------------------------------------------------- | :--------------------------------------- |
| `name`                       | `@eq-labs/knowledge`                                                           | —                                        |
| `version`                    | `0.1.0`                                                                        | —                                        |
| `private`                    | `true`                                                                         | Decisión npm → **P02**                   |
| `exports` / `main` / `types` | **Ausentes**                                                                   | Gap → **P02** (API workspace)            |
| Runtime `dependencies`       | **Ninguna** (solo config tooling en devDependencies)                           | ✅ Sin intelligence/connectors/execution |
| `devDependencies`            | `@eq-labs/config-typescript`, `typescript`, `eslint`, `@eq-labs/config-eslint` | ✅ Tooling permitido                     |
| Implementación               | Stub / sin KnowledgePort                                                       | Gap → **P03/P04**                        |
| Residual `src/index.js`      | Esperado en inventario histórico                                               | Limpiar en **P02**                       |

### 03.3. Foundation — contratos Knowledge

| Artefacto                | Estado                                                  |
| :----------------------- | :------------------------------------------------------ |
| `KnowledgePort`          | **Ausente**                                             |
| `KnowledgeError`         | **Ausente**                                             |
| `KNOWLEDGE_PORT_VERSION` | **Ausente**                                             |
| Contratos AI presentes   | SPI, inference, generation, provider, catalog, error AI |

→ Cierre en **EE-IMP-014-P03**.

### 03.4. Consumidores y composition root

| Ítem                            | Estado                                                           |
| :------------------------------ | :--------------------------------------------------------------- |
| Consumidor de KnowledgePort     | **Ninguno** cableado                                             |
| `apps/cli` composition (AI)     | Presente (EE-IMP-013); Knowledge **no** registrado aún → **P03** |
| Registry → `@eq-labs/knowledge` | **No** (correcto; consumo futuro vía port)                       |

### 03.5. `data/` y acquisition primer ciclo

| Ítem                             | Estado                                                 |
| :------------------------------- | :----------------------------------------------------- |
| `data/` top-level                | Autorizado por 006; ownership genérico maintainers     |
| `data/datasets/`, `data/models/` | **Candidatos** (P05); no obligatorios en P01           |
| Acquisition externa              | **Diferida** (014 §04.7); primer ciclo = `docs/` / git |

---

## 04. Fronteras (boundaries)

| Frontera                  | Norma (014)                                                                           | Evidencia P01                                       |
| :------------------------ | :------------------------------------------------------------------------------------ | :-------------------------------------------------- |
| Intelligence ↔ Knowledge | **Prohibido** en ambas direcciones                                                    | knowledge sin dep intelligence; no cableado         |
| Registry vs Knowledge     | Registry = specialists; Knowledge = conocimiento; **CatalogPort** sin tipos Knowledge | Sin import package knowledge en registry (as-built) |
| Knowledge → Execution     | **Prohibido** (política 014)                                                          | Sin dep execution                                   |
| Knowledge → connectors    | **Prohibido**                                                                         | Sin deps connector                                  |
| `docs/` SSOT editorial    | Knowledge indexa; no write-back Congelados                                            | N/A código P01                                      |
| Composition root          | Solo `apps/*`; no SDK                                                                 | Sin root knowledge aún                              |
| Embeddings de producto    | Store ownership Knowledge; capability vía Foundation + root                           | Embedding ABI → P03/P04                             |

---

## 05. CODEOWNERS e inspección KS-06

### 05.1. As-built relevante

```text
packages/config/                @EQ-LABS-TECH/architecture @EQ-LABS-TECH/maintainers
packages/                       @EQ-LABS-TECH/maintainers
```

| Path requerido (014 KS-06)                    | Presente                        | Notas                                       |
| :-------------------------------------------- | :------------------------------ | :------------------------------------------ |
| `packages/knowledge/**` (fino + architecture) | **No**                          | Cubierto solo por `packages/` → maintainers |
| Contracts knowledge en Foundation             | **N/A** (archivo aún no existe) | Pre-declarar patrón en P01/P02              |

**Conclusión:** el patrón genérico `packages/` **no** satisface KS-06 PASS (014 §07.1).

### 05.2. Descubrimiento Tipo B — Adoptado

| Campo         | Valor                                                                                    |
| :------------ | :--------------------------------------------------------------------------------------- |
| **ID**        | D-IMP-014-P01-001                                                                        |
| **Tipo**      | **B — Especialización Técnica** (EE-DOC-007 ownership paths; no cambia arquitectura 014) |
| **Resultado** | **Adoptado**                                                                             |
| **Acción**    | Materializar paths finos en `.github/CODEOWNERS`                                         |

**Contenido normativo propuesto (UTF-8):**

```text
# Knowledge Layer (EE-DOC-014 / KS-06 / EE-IMP-014-P01)
packages/knowledge/                          @EQ-LABS-TECH/architecture @EQ-LABS-TECH/maintainers
packages/foundation/src/contracts/knowledge.ts @EQ-LABS-TECH/architecture
```

> Insertar **después** de `packages/config/` y **antes** del patrón genérico `packages/`, para que “last matching pattern” no anule el ownership de architecture sobre knowledge.

**Estado materialización:** pendiente de commit en repo (operador). Tras push → KS-06 puede declararse **PASS** en evidencia P02 o en addendum de este IMP.

---

## 06. Precondiciones y riesgos

### 06.1. QG-SEC-001 y D-01 (mismo patrón que EE-IMP-013-P05)

Evidencia ejecutada **2026-10-05**:

```text
pnpm audit
→ high: braces <=3.0.3 (GHSA-vfj7-8cjw-p6xm)
→ Path: .>plop>liftoff>findup-sync>micromatch>braces
→ Patched versions: None (<0.0.0)
```

`pnpm run validate` → **Critical errors** únicamente por este hallazgo (QG-SEC-001).

| Campo                     | Valor                                                                                                                                                                                                                                |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID descubrimiento**     | **D-01** (continuidad de EE-IMP-013-P05)                                                                                                                                                                                             |
| **Tipo**                  | **B — Especialización técnica**                                                                                                                                                                                                      |
| **Gate**                  | QG-SEC-001                                                                                                                                                                                                                           |
| **Resultado contractual** | **WAIVED** (EE-DOC-010 §04.6.1)                                                                                                                                                                                                      |
| **authority**             | Equipo de Arquitectura                                                                                                                                                                                                               |
| **reason**                | Transitive **dev-only** vía `plop`; **sin release parcheado upstream** (CVE-2026-93687 / GHSA-vfj7-8cjw-p6xm). No es dependencia de runtime de `packages/knowledge` ni de apps de producto.                                          |
| **scope**                 | Solo path `plop>liftoff>findup-sync>micromatch>braces`                                                                                                                                                                               |
| **effective_from**        | 2026-10-05 (renovación bajo IMP-014)                                                                                                                                                                                                 |
| **expires_at**            | **2026-10-12** (máx. 7 días; alineado a 005 §10.3)                                                                                                                                                                                   |
| **normalization_plan**    | (1) Re-auditar cuando exista `braces` parcheado o cadena plop/micromatch sin la vuln. (2) Si el WAIVE se repite: evaluar sustitución de plop o aislamiento del generador. (3) **No** usar `pnpm.overrides` a versiones inexistentes. |
| **Criterio de fase**      | `pnpm run validate` con **FAIL solo D-01** = **OK** para cierre de P01 (mismo criterio que EE-IMP-013-P05 §08 / §11). **No** es False Pass: el hallazgo queda registrado y acotado.                                                  |

> **No** es regresión introducida por Knowledge / P01. El baseline de tooling (plop) preexiste.

### 06.2. Turbo (EE-ADR-001)

| Campo        | Valor                                                                                      |
| :----------- | :----------------------------------------------------------------------------------------- |
| As-built     | `turbo@2.11.5` (root `devDependencies`)                                                    |
| Objetivo P01 | **`turbo@2.11.7`** (patch de línea 2.11.x; mensaje CI: Update available v2.11.5 ≫ v2.11.7) |
| `turbo.json` | Sin cambio de esquema de tasks requerido para el bump; solo versión del paquete            |
| Acción       | `pnpm add -D turbo@2.11.7 -w` + lockfile + `pnpm run validate` (aceptar D-01)              |

### 06.3. Riesgo residual — single-operator / bypass

| Campo       | Registro                                                                                                           |
| :---------- | :----------------------------------------------------------------------------------------------------------------- |
| Referencia  | TEC-002 W-P03-001 / merges directos a `main` con bypass de ruleset                                                 |
| Impacto     | Debilita CODEOWNERS + required reviews como enforcement interim (014 §04.5.1)                                      |
| Tratamiento | **Aceptado** en fase temprana; mitigación: revisión explícita en cada commit de IMP-014; endurecimiento progresivo |
| Ownership   | Arquitectura / Repository Admin                                                                                    |

---

## 07. Pasos de materialización (operador)

Ejecutar en la raíz del monorepo (`PowerShell`). Orden: **format → validate** cuando se compruebe estilo.

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# --- A. CODEOWNERS (KS-06) ---
Select-String -Path .github\CODEOWNERS -Pattern "knowledge|packages/"

# Insertar ANTES de la línea genérica "packages/" (last match wins):
#   # Knowledge Layer (EE-DOC-014 / KS-06 / EE-IMP-014-P01)
#   packages/knowledge/                            @EQ-LABS-TECH/architecture @EQ-LABS-TECH/maintainers
#   packages/foundation/src/contracts/knowledge.ts @EQ-LABS-TECH/architecture

# --- B. Inventario knowledge ---
Get-Content packages\knowledge\package.json
Select-String -Path packages\knowledge\package.json -Pattern "intelligence|connector-|execution|registry"
Test-Path packages\knowledge\knowledge-engine
Get-ChildItem packages\knowledge -Name

# --- C. Turbo 2.11.5 → 2.11.7 (EE-ADR-001) ---
pnpm add -D turbo@2.11.7 -w
pnpm install

# --- D. Audit + validate (patrón P05) ---
pnpm why braces
pnpm audit
# Esperado: 1 high braces vía plop — D-01 WAIVED

pnpm run format
pnpm run validate
# FAIL solo D-01 = OK (no otros critical)

# --- E. Commits sugeridos ---
git add .github/CODEOWNERS
git commit -m "chore(governance): CODEOWNERS fine paths for knowledge (KS-06, EE-IMP-014-P01)

Refs: EE-DOC-014, EE-IMP-014-P01, EE-DOC-007"

git add package.json pnpm-lock.yaml
git commit -m "chore(deps): bump turbo 2.11.5 to 2.11.7 (EE-ADR-001, EE-IMP-014-P01)

Refs: EE-IMP-014-P01, EE-ADR-001"

git push origin main
gh run list --workflow=ci.yml --branch main --limit 1
```

---

## 08. Validaciones ejecutadas (patrón EE-IMP-013-P05)

| Comando / control       | Resultado | Detalle                                        |
| :---------------------- | :-------- | :--------------------------------------------- |
| Inventario as-built §03 | ✅        | Plano; sin Port; sin exports; deps limpias     |
| Boundaries §04          | ✅        | Alineado 013/006/014                           |
| CODEOWNERS KS-06        | ⚠️        | Paths finos pendientes de materializar (§05.2) |
| `pnpm audit`            | ⚠️ D-01   | solo braces — **WAIVED** hasta 2026-10-12      |
| `pnpm run validate`     | ⚠️ D-01   | FAIL solo SEC-001 por braces = **OK** de fase  |
| Turbo                   | ⬜ → ✅   | Operador: bump **2.11.7** (§06.2 / §07)        |

### 08.1. Descubrimientos

| ID                    | Tipo | Hallazgo                                                  | Decisión                                                             |
| :-------------------- | :--- | :-------------------------------------------------------- | :------------------------------------------------------------------- |
| **D-01**              | B    | braces vía plop (GHSA-vfj7-8cjw-p6xm); sin patch upstream | **WAIVED** hasta **2026-10-12** (renovación IMP-014; precedente P05) |
| **D-IMP-014-P01-001** | B    | CODEOWNERS sin paths finos knowledge                      | **Adoptado** — materializar §05.2                                    |
| **D-IMP-014-P01-002** | B    | turbo 2.11.5 → 2.11.7                                     | **Adoptado** — bump en §07                                           |

---

## 09. Evidencia y trazabilidad

| Evidencia         | Ubicación                                          |
| :---------------- | :------------------------------------------------- |
| Inventario §03    | Este documento                                     |
| D-01 WAIVE        | §06.1 (mismo criterio que EE-IMP-013-P05)          |
| Tipo B CODEOWNERS | §05.2                                              |
| Turbo             | §06.2 / §07                                        |
| Norma             | EE-DOC-014 §04–§09; EE-DOC-010 §04.6.1; EE-ADR-001 |

---

## 10. Siguiente fase

| Fase    | Documento      | Notas                                                                                           |
| :------ | :------------- | :---------------------------------------------------------------------------------------------- |
| **P02** | EE-IMP-014-P02 | exports/types, limpiar residuales, gates package, confirmar KS-06 PASS si CODEOWNERS ya en main |
| **P03** | EE-IMP-014-P03 | KnowledgePort + KnowledgeError + `KNOWLEDGE_PORT_VERSION`; wiring mínimo en `apps/cli`          |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                 | Cambios                                                                                                      | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-05 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P01             | Inventario as-built; boundaries; KS-06 FAIL→Tipo B; QG-SEC-001; riesgo single-operator; pasos operador       | **Completado** |
| **v1.1.0** | 2026-10-05 | Equipo de Arquitectura | Equipo de Arquitectura | Alineación P05 + turbo | D-01 WAIVED formal (hasta 2026-10-12); validate FAIL solo D-01 = OK; turbo 2.11.7; pasos operador unificados | **Completado** |

---

## 12. Cierre de unidad

| Campo                        | Valor                                                         |
| :--------------------------- | :------------------------------------------------------------ |
| **Estado de la unidad**      | **Completado** (acciones operador: CODEOWNERS + turbo 2.11.7) |
| **KS-06**                    | **No PASS** hasta commit §05.2                                |
| **QG-SEC-001**               | **WAIVED** D-01 (no bloquea cierre de fase)                   |
| **Bloqueantes de modelo**    | Ninguno                                                       |
| **Desviación de EE-DOC-014** | Ninguna                                                       |

---

## FIN DEL DOCUMENTO
