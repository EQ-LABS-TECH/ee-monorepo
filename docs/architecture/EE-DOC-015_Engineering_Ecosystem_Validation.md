# EE-DOC-015 — Engineering Ecosystem Validation

Este documento sigue el estándar **EE-DOC-002 — Document Design Template**.

> **Vigencia:** tipo **Documento Normativo** en estado **Aprobado**. Marco de validación de ecosistema vigente; materialización en **EE-IMP-015**.

---

## METADATOS

| Campo                   | Valor                                                                                                                                                                                                                                                      |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                  | EE-DOC-015                                                                                                                                                                                                                                                 |
| **Documento**           | Engineering Ecosystem Validation                                                                                                                                                                                                                           |
| **Código corto**        | EE-DOC-015                                                                                                                                                                                                                                                 |
| **Tipo**                | Documento Normativo                                                                                                                                                                                                                                        |
| **Clasificación**       | Especializado                                                                                                                                                                                                                                              |
| **Nivel**               | Especializado                                                                                                                                                                                                                                              |
| **Normativo**           | Sí                                                                                                                                                                                                                                                         |
| **Versión**             | v1.1.0                                                                                                                                                                                                                                                     |
| **Estado**              | Congelado                                                                                                                                                                                                                                                  |
| **Propietario**         | Equipo de Arquitectura                                                                                                                                                                                                                                     |
| **Documento padre**     | EE-DOC-004 — Engineering Architecture (conceptual)                                                                                                                                                                                                         |
| **Serie implementable** | EE-DOC-006 — Repository Structure (padre físico serie 006–015)                                                                                                                                                                                             |
| **Dependencias**        | EE-DOC-001, EE-DOC-002, EE-DOC-003, EE-DOC-004, EE-DOC-005, EE-DOC-006, EE-DOC-007, EE-DOC-008, EE-DOC-009, EE-DOC-010, EE-DOC-011, EE-DOC-012, EE-DOC-013, EE-DOC-014, EE-ADR-001, EE-ADR-002, EE-ADR-003, EE-ADR-004, EE-ADR-005, EE-RFC-001, EE-RFC-002 |
| **Aprobado por**        | Equipo de Arquitectura                                                                                                                                                                                                                                     |
| **Audiencia**           | Arquitectura, Desarrollo, QA, DevOps, IA                                                                                                                                                                                                                   |
| **Fecha de creación**   | 2026-10-06                                                                                                                                                                                                                                                 |
| **Última revisión**     | 2026-10-07                                                                                                                                                                                                                                                 |
| **Próxima revisión**    | Tras cierre EE-IMP-015 (o cambio gobernado)                                                                                                                                                                                                                |

> **Precedente de roadmap (EE-DOC-001):** EE-DOC-014 — Knowledge Management (Fase 3 → Fase 4).

---

## 01. Propósito

Definir el **marco normativo de validación del Engineering Ecosystem** como sistema: validación **funcional**, **arquitectónica** y **end-to-end**, con evidencia reproducible y sin False Pass.

Este documento:

- establece **qué se valida** a escala de ecosistema;
- define **dimensiones**, **resultados de dominio**, **agregación por hito** y el **Validation Report**;
- separa responsabilidades respecto de **Quality Gates de merge** (**EE-DOC-010**), **CI** (**EE-DOC-007**), **paridad local** (**EE-DOC-008**) y **testing** (**EE-ADR-002**);
- habilita **EE-IMP-015**.

**No** sustituye EE-DOC-010. **No** redefine el catálogo de gates ni la agregación de merge (ACCEPT / BLOCK). **No** redefine Results de gates (PASS, FAIL, SKIPPED, NOT_APPLICABLE, WAIVED, …).

**Frontera con EE-DOC-010:** 010 = gates de **cambio/merge**; 015 = dictamen del **ecosistema** en un ref. Un PASS de 015 **no** bypasea required checks ni gates ACTIVE.

**Consumo de evidencia de Quality Gates (SSOT ejecutable):** Los dominios **V-STRUCT**, **V-ARCH-TOPLEVEL**, **V-AUTO** (integridad repo), **V-INFRA**, **V-QG** y los ítems de **V-SMOKE** que invocan comandos de gate **consumen** la evidencia de **`pnpm run validate`** / **`scripts/validate`** y de los gates ACTIVE de **EE-DOC-010**. EE-DOC-015 **no** reejecuta ni redefine la lógica interna de esos gates. Su rol es la **matriz de completitud del ecosistema** y el **Validation Report**.

**Referencias cruzadas:** se citan documentos por **código** (p. ej. EE-DOC-010). **No** se ancla la norma a un número de versión de otro documento.

---

## 02. Alcance

### 02.1. Incluye

| Dominio                  | Contenido                                                                                                          |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **Estructural**          | Inventario del ref; workspace SSOT; `required_now` vs `planned_allowed`; consumo `packages/config/*` por workspace |
| **Arquitectónico**       | TOPLEVEL (QG-ARCH); LAYERS (PENDING enforcement); COMPOSITION (root efectivo)                                      |
| **Quality baseline**     | Gates ACTIVE; anti False Pass; WAIVE conforme EE-DOC-010                                                           |
| **Integración de ports** | Coexistencia SPI + KnowledgePort desde `apps/*`; wiring **efectivo**                                               |
| **Automatización**       | CLI facade; composition root; comandos EE-DOC-011; templates vía 012 **y** QG-REPO por separado                    |
| **Infra**                | QG-INFRA + política                                                                                                |
| **Smoke / E2E**          | Smoke normativo; E2E PENDING hasta comando root `e2e`                                                              |
| **Gobernanza**           | Índice EE-DOC-001; CODEOWNERS; lista cerrada documental; precedencia QG-DOC                                        |
| **Reporte**              | `docs/validation/` (autorizado en **EE-DOC-006**)                                                                  |

### 02.2. Excluye

| Tema                                         | Responsable                        |
| :------------------------------------------- | :--------------------------------- |
| Catálogo y agregación de QG de merge         | EE-DOC-010                         |
| Branch protection / required checks          | EE-DOC-007                         |
| Taxonomía de frameworks de test              | EE-ADR-002                         |
| Vendor cloud / cluster                       | EE-DOC-009 + ADR futuros           |
| Dependencia runtime Intelligence → Knowledge | Prohibida (EE-DOC-006 / 013 / 014) |

### 02.3. Jerarquía documental

| Relación                               | Documento  |
| :------------------------------------- | :--------- |
| **Padre conceptual**                   | EE-DOC-004 |
| **Padre físico / serie implementable** | EE-DOC-006 |
| **Precedente roadmap**                 | EE-DOC-014 |
| **Plantilla**                          | EE-DOC-002 |

---

## 03. Principios (VAL-\*)

| ID         | Principio                | Norma                                                   |
| :--------- | :----------------------- | :------------------------------------------------------ |
| **VAL-01** | Ecosystem as system      | Conjunto coherente                                      |
| **VAL-02** | No False Pass            | Evidencia del ref; cero tareas ≠ PASS                   |
| **VAL-03** | Separation of concerns   | 015 ≠ 010; Results de gate se **conservan**             |
| **VAL-04** | Evidence first           | Artefacto del ref                                       |
| **VAL-05** | Progressive readiness    | Availability = EE-DOC-010; resultado de dominio = §04.3 |
| **VAL-06** | SSOT of commands         | Comandos root EE-DOC-011                                |
| **VAL-07** | Architecture constraints | Capas / composition                                     |
| **VAL-08** | Reproducibility          | Mismos comandos normativos entre reports del hito       |
| **VAL-09** | Human judgment           | Report informa; cierre formal = Arquitectura            |
| **VAL-10** | Fail explicit            | Residuales solo con WAIVE de EE-DOC-010 válido          |

---

## 04. Modelo de validación

### 04.1. Dimensiones → dominios

| Dimensión                  | Dominios                                                     |
| :------------------------- | :----------------------------------------------------------- |
| **Funcional**              | V-QG, V-SMOKE, V-INT                                         |
| **Arquitectónica**         | V-ARCH-TOPLEVEL, V-ARCH-LAYERS, V-ARCH-COMPOSITION, V-STRUCT |
| **Transversal / E2E**      | V-SMOKE, V-E2E                                               |
| **Gobernanza**             | V-GOV                                                        |
| **Automatización / infra** | V-AUTO, V-INFRA                                              |

### 04.2. Relación con EE-DOC-010

- EE-DOC-010 = SSOT del catálogo QG-\* y agregación de **merge**.
- EE-DOC-015 reutiliza Results de gates como **insumos** y los **registra sin reclasificar**.
- FAIL de gate ACTIVE → FAIL del dominio 015 consumidor (salvo **WAIVED** vigente → DEGRADED de dominio §04.3).
- **High / audit sin WAIVE** → **FAIL** de dominio.
- **SKIPPED** y **NOT_APPLICABLE** de 010 son distintos; 015 **no** convierte SKIPPED en N/A de dominio.

### 04.3. Resultados de dominio

| Resultado    | Significado                                                                                                                                                                                                                  |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PASS**     | Criterios del dominio cumplidos con evidencia del ref                                                                                                                                                                        |
| **FAIL**     | Incumplimiento bloqueante                                                                                                                                                                                                    |
| **DEGRADED** | **Solo** con **WAIVED** válido según EE-DOC-010 (campos: `gate_id`, authority, reason, scope, effective_from, **expires_at**, normalization_plan) **vigente** en la fecha del report, u otro mecanismo gobernado equivalente |
| **N/A**      | No aplicable al ref (justificación). **No** usar para sustituir SKIPPED de un gate. En **dominio obligatorio**, solo si §04.4.3 regla 4 lo autoriza                                                                          |
| **PENDING**  | Aplicable pero no materializado (**no** es PASS)                                                                                                                                                                             |

### 04.4. Agregación

#### 04.4.1. Dos niveles

| Nivel                      | Qué expresa                                                                                                                                          |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dominio**                | PASS / FAIL / DEGRADED(WAIVE) / N/A / PENDING                                                                                                        |
| **Dictamen de ecosistema** | §04.4.3. PENDING **listado** (régimen EE-DOC-005 / EE-ADR-004) contribuye a dictamen **DEGRADED de ecosistema** sin cambiar el resultado del dominio |

#### 04.4.2. Hito × dominio

| Dominio                | Baseline                         | Cierre Fase 4 / congelación 015                                   |
| :--------------------- | :------------------------------- | :---------------------------------------------------------------- |
| **V-STRUCT**           | Obligatorio                      | Obligatorio                                                       |
| **V-ARCH-TOPLEVEL**    | Obligatorio                      | Obligatorio                                                       |
| **V-ARCH-LAYERS**      | PENDING admisible                | PENDING admisible; PASS total de capas no exigido hasta validador |
| **V-ARCH-COMPOSITION** | Obligatorio (efectivo o PENDING) | Obligatorio                                                       |
| **V-QG**               | Obligatorio                      | Obligatorio                                                       |
| **V-INT**              | Obligatorio (efectivo o PENDING) | Obligatorio                                                       |
| **V-AUTO**             | Obligatorio                      | Obligatorio                                                       |
| **V-INFRA**            | Obligatorio                      | Obligatorio                                                       |
| **V-GOV**              | Obligatorio                      | Obligatorio                                                       |
| **V-SMOKE**            | Obligatorio                      | Obligatorio                                                       |
| **V-E2E**              | PENDING (nunca N/A)              | PENDING hasta `pnpm run e2e`                                      |

**Nota hito × dominio:** Para **V-ARCH-LAYERS** y **V-E2E**, baseline y cierre Fase 4 comparten resultado **PENDING** admisible; la columna de cierre **no** exige PASS de esos dominios. En cierre, LAYERS puede exigir además evidencia de revisión manual §05.2.1 si Arquitectura la solicita; E2E permanece PENDING hasta comando root `e2e`.

Congelación de 015: dictamen ecosistema **DEGRADED** admisible si PENDING listados con régimen y sin FAIL no gestionado.

#### 04.4.3. Reglas de agregación del dictamen

1. Cualquier dominio obligatorio en **FAIL** → ecosistema **FAIL**.
2. Sin FAIL: si hay dominio obligatorio en **PENDING no listado** → **FAIL** de cierre de hito.
3. Sin FAIL ni PENDING no listado: si hay **PENDING listado** y/o **DEGRADED(WAIVE)** de dominio → ecosistema **DEGRADED**.
4. **N/A en dominio obligatorio:**
   - Requiere **justificación explícita** y evidencia de no aplicabilidad en el Validation Report.
   - **N/A no contribuye a PASS** (no se cuenta como cumplimiento del dominio).
   - **N/A no autorizado** por la matriz hito × dominio (§04.4.2) ni por la definición del dominio → **FAIL** de cierre de hito.
   - Si N/A está **explícitamente permitido** para ese dominio/hito, el dictamen se resuelve con las reglas 1–3 y 5 **ignorando** ese dominio en el conjunto “todos PASS” (equivalente a excluirlo del numerador de PASS, no a tratarlo como PASS).
5. Todos los dominios obligatorios del hito en **PASS** (tras aplicar la regla 4 sobre N/A autorizados) → ecosistema **PASS**.

> **Política por defecto:** los dominios marcados **Obligatorio** en §04.4.2 **no** admiten N/A salvo nota explícita en la matriz o en el dominio. Los ítems _dentro_ de un dominio (p. ej. un comando de V-SMOKE) pueden ser N/A según §05.7 sin convertir el dominio entero en N/A.

### 04.5. Artefacto canónico de WAIVE y salida de residuales

```text
docs/validation/waivers/EE-WAIVE-<gate_id>-<YYYYMMDD>.md
```

Campos = EE-DOC-010 (WAIVED). **V-QG** exige archivo **vigente** (`expires_at` ≥ fecha del report).

**Salida del residual:**

| Situación                                                       | Acción                                                                                                                                   |
| :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| Residual &lt; ventana máxima de WAIVE (EE-DOC-010 / EE-DOC-005) | WAIVE renovable con plan de normalización                                                                                                |
| Residual **permanente** (p. ej. sin patch upstream)             | **ADR o RFC** que autorice ventana distinta, **o** cierre técnico (fix/override del paquete **efectivo**, no solo un override colateral) |
| Sin WAIVE vigente ni cierre                                     | Gate/audit FAIL → dominio **FAIL**                                                                                                       |

**EE-IMP-015-P01 — criterio de salida:** residuales conocidos (p. ej. D-01) **cerrados** en el ref **o** con **WAIVE vigente** registrado bajo `docs/validation/waivers/`.

Jerarquía de evidencia de deps:

```text
package.json overrides → pnpm-lock.yaml → árbol instalado efectivo → advisory/GHSA
```

Override de un paquete **distinto** (p. ej. `brace-expansion` vs `braces`) **no** cierra el residual.

---

## 05. Dominios de validación

### 05.1. V-STRUCT

| Check               | Criterio                                             | Evidencia                 |
| :------------------ | :--------------------------------------------------- | :------------------------ |
| Inventario          | `git ls-files` del ref                               | P01                       |
| **required_now**    | Paths de gates ACTIVE existen                        | Insumo `validate` / QG-\* |
| **planned_allowed** | Autorizados EE-DOC-006 aún no exigidos → PENDING/N/A | P01                       |
| Workspace SSOT      | `pnpm-workspace.yaml`                                | archivos                  |
| **packages/config** | Por **workspace** (tabla abajo)                      | configs del ref           |

**Matriz de consumo de config (mínimo en el report):**

| Workspace              | Config     | Aplicabilidad                             | Mecanismo permitido                                                  | Evidencia                  |
| :--------------------- | :--------- | :---------------------------------------- | :------------------------------------------------------------------- | :------------------------- |
| App/paquete TS         | TypeScript | Obligatoria si hay TS                     | Extends `packages/config` o especialización documentada (EE-DOC-006) | `tsconfig` / extends       |
| App/paquete lint       | ESLint     | Obligatoria si hay lint                   | Config compartida o override justificado                             | `eslint.config.*`          |
| Repo / formateo        | Prettier   | Obligatoria a nivel repo según EE-DOC-006 | Consumo `@eq-labs/config-prettier` o equivalente gobernado           | package / config           |
| Paquete con unit tests | Vitest     | Obligatoria si hay suite unitaria         | Extends base compartida (EE-ADR-002)                                 | `vitest.config.*` + script |
| App E2E                | Playwright | Solo si hay superficie E2E                | Config compartida + script                                           | config + script            |

| Resultado fila | Cuándo                                                        |
| :------------- | :------------------------------------------------------------ |
| **PASS**       | Consumo o especialización documentada conforme a EE-DOC-006   |
| **FAIL**       | Config obligatoria ausente o divergente **sin** justificación |
| **PENDING**    | Desviación aceptada con plan Tipo B                           |
| **N/A**        | Herramienta no aplicable al workspace                         |

**No** PASS agregado de V-STRUCT solo por existir físicamente `packages/config/`.

### 05.2. V-ARCH

| Subcheck        | Criterio                                                                                                                                      | Resultado                   |
| :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| **TOPLEVEL**    | QG-ARCH ACTIVE vía `validate`                                                                                                                 | PASS/FAIL del gate          |
| **LAYERS**      | Sin validador automático → **PENDING**. Revisión manual §05.2.1: PASS/FAIL del alcance revisado; **no** DEGRADED ni PASS total de enforcement | PENDING (típico)            |
| **COMPOSITION** | §05.2.2                                                                                                                                       | PASS solo root **efectivo** |

#### 05.2.1. Revisión manual de capas

Artefacto: `docs/validation/evidence/layers/<git-sha-short>.md` — revisor Arquitectura; deps+devDeps; resultado por package; CODEOWNER cuando aplique; excepciones solo ADR/RFC.

#### 05.2.2. Composition root efectivo

**Existencia de factory ≠ composition root efectivo.**

**Root único por runtime:** un **módulo de composición** (puede registrar AI y Knowledge en el mismo módulo o orquestarlos) **invocado desde el entrypoint de runtime** de una app bajo `apps/*`. No exige un _workspace distinto_ de la fachada CLI: la fachada DX y el composition root pueden coexistir en `apps/cli`, pero el **entrypoint de runtime** debe invocar el módulo de composición (la sola delegación `ee run` no cuenta como wiring AI/Knowledge).

PASS solo si:

1. Factory/módulo existe bajo `apps/*`;
2. Es **invocado** por el entrypoint de runtime;
3. El objeto participa en runtime verificable;
4. No hay wiring en SDK / scripts / packages internos.

Factory no invocada → **PENDING**. Varios roots efectivos sin política → **FAIL**.

| Runtime | App | Entrypoint | Módulo de composición | Ports/adapters | Evidencia |
| :------ | :-- | :--------- | :-------------------- | :------------- | :-------- |

### 05.3. V-QG

| Check                | Criterio                                                                                                                                                        |
| :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comandos             | lint, typecheck, build, test, validate                                                                                                                          |
| **Format (QG-FMT)**  | Cubierto **dentro de** `pnpm run validate` según **EE-DOC-010**. EE-DOC-015 **no** exige un comando root `format:check` independiente ni redefine el gate       |
| Anti False Pass      | ≥1 archivo o tarea **real** ejecutada (p. ej. no `tsc` sobre `files: []` vacío). Evidencia **cuantificable** en el Validation Report (§06.2), no solo narrativa |
| WAIVE                | DEGRADED solo con §04.5 vigente                                                                                                                                 |
| High/audit sin WAIVE | **FAIL**                                                                                                                                                        |

### 05.4. V-INT

Coexistencia Foundation→Intelligence y Foundation→Knowledge desde `apps/*`; sin Intelligence→Knowledge.

| Check                      | Criterio                                                                                                                                    |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| Contratos + implementación | Rutas y símbolos del ref                                                                                                                    |
| Composition                | §05.2.2                                                                                                                                     |
| Tests                      | Por port: si se declara verificable, **≥1 test** ejecutado; lado **AI sin suite** → **PENDING** hasta primera suite (alineado a EE-DOC-013) |

### 05.5. V-AUTO

| Check                      | Criterio                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CLI facade**             | Delega a `pnpm run`; **no reimplementa** Quality Gates ni umbrales                                                                                                                                                                                                                                                                                                                                                                                          |
| **Composition**            | §05.2.2 (puede residir en el mismo app que la facade)                                                                                                                                                                                                                                                                                                                                                                                                       |
| Comandos root              | Contrato EE-DOC-011 (sin `e2e` hasta cambio gobernado)                                                                                                                                                                                                                                                                                                                                                                                                      |
| **QG-REPO**                | Integridad estructural del repo / templates path → Result del gate                                                                                                                                                                                                                                                                                                                                                                                          |
| **Templates (EE-DOC-012)** | Validar el **contrato semántico definido por EE-DOC-012** (p. ej. schema, `template.json`, `files/`, outputs, ids). **PASS de QG-REPO no implica PASS del contrato de templates.** Si **EE-DOC-012** exige un mecanismo de validación y **ése** no está materializado → **PENDING**. Si el mecanismo ACTIVE del ref falla → **FAIL**. DEGRADED solo con WAIVE §04.5. EE-DOC-015 **no** inventa obligaciones de enforcement adicionales a las de 012/IMP-012 |

### 05.6. V-INFRA

QG-INFRA FAIL → V-INFRA **FAIL**. Política secrets / árbol `infra/` según hito.

### 05.7. V-SMOKE (lista normativa)

| #   | Comando             | Criterio                                                                                                                                                                                                                                                                                                                                                                                                                              |
| :-- | :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `pnpm run doctor`   | Exit 0                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2   | `pnpm run build`    | **Build completo** del monorepo (contrato EE-DOC-011). Verificar en la salida Turbo la presencia de al menos foundation, intelligence, knowledge y `apps/cli` cuando existan como workspaces                                                                                                                                                                                                                                          |
| 3   | `pnpm run test`     | **Conservar el Result de EE-DOC-010 (QG-TEST):** **PASS** → evidencia PASS del ítem; **SKIPPED** (p. ej. 0 tasks contractual) → **registrar SKIPPED** (el ítem **no** es PASS ni se reclasifica como N/A); **FAIL/ERROR** → V-SMOKE **no** puede ser PASS; **NOT_APPLICABLE** solo si 010 lo determina. N/A del ítem smoke **solo** si el smoke de tests **no aplica** al ref por justificación distinta del mecanismo 0-tasks de 010 |
| 4   | `pnpm run validate` | Interpretado con §05.3; FAIL de audit sin WAIVE → V-SMOKE no PASS                                                                                                                                                                                                                                                                                                                                                                     |

El Validation Report debe mostrar **Result original del gate** y el **mapeo** al ítem V-SMOKE.

### 05.8. V-E2E

**PENDING** hasta `pnpm run e2e` + scripts + Turbo (Tipo B/C; sync EE-DOC-011 / EE-DOC-006). Scripts workspace alineados a EE-ADR-002 (`e2e`, no solo alias ad hoc). **Prohibido N/A**.

### 05.9. V-GOV

| Check                      | Criterio                                                                                                                                                                                                                         |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EE-DOC-001                 | Matriz = narrativa = métricas                                                                                                                                                                                                    |
| CODEOWNERS                 | Patrones específicos **después** de genéricos; cobertura contracts knowledge                                                                                                                                                     |
| **Precedencia QG-DOC**     | Si **QG-DOC** ACTIVE (p. ej. QG-DOC-001/002) produjo **FAIL** en el ref → **V-GOV = FAIL**. V-GOV solo clasifica desalineaciones **no** ya fallidas por ese gate                                                                 |
| **Lista cerrada (mínimo)** | (1) Estado de ADR-002 (incl. referencias cruzadas y afirmaciones “se creará” vs as-built); (2) README raíz (fases); (3) README foundation / intelligence / knowledge; (4) `scripts/README.md` vs generate real; (5) TEC del hito |

| Caso documental                                                                     | Efecto                                                                                                                                                             |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contradice contrato/arquitectura/estado normativo **y** no cubierto por FAIL QG-DOC | **FAIL** de V-GOV                                                                                                                                                  |
| Ya FAIL en QG-DOC ACTIVE                                                            | **FAIL** de V-GOV (precedencia)                                                                                                                                    |
| Narrativa stale descriptiva (p. ej. README de package)                              | **No PASS** hasta corrección o **limitación explícita** listada en el report (contribuye a dictamen según §04.4; **no** es DEGRADED de dominio sin WAIVE)          |
| **README raíz** (fases / “Under Implementation” vs estado real Fase 4)              | **Obligatorio clasificar** en el report: actualizar el README **o** registrar hallazgo. Mientras la discrepancia no esté clasificada → **V-GOV no puede ser PASS** |

---

## 06. Validation Report

### 06.1. Ubicación canónica (EE-DOC-006)

```text
docs/validation/
  README.md
  reports/EE-VAL-<git-sha-short>-<YYYYMMDD>.md
  waivers/EE-WAIVE-<gate_id>-<YYYYMMDD>.md
  evidence/layers/<git-sha-short>.md
```

Autorizada en el árbol de **EE-DOC-006**. Materialización física: **P01** (scaffold) + reports formales en **P05**. Plantillas de idioma EE-VAL / EE-WAIVE: evolución en **EE-DOC-002** cuando se formalicen (Tipo A/B); hasta entonces el contenido mínimo es el de §06.2.

### 06.2. Contenido mínimo

- Metadatos (repo, SHA, fecha, versión de **este** documento, fuentes por **código**).
- Matriz de dominios y dictamen §04.4.3.
- Results de gates consumidos (**sin reclasificar** SKIPPED/NOT_APPLICABLE).
- WAIVE vigentes; PENDING listados; matriz composition §05.2.2.
- Matriz config §05.1 (con aplicabilidad).
- **Anti False Pass — tabla obligatoria** (valores desde salida estructurada de Turbo, runner o artefacto de `scripts/validate`; no solo narrativa):

| Gate      | Workspace    | Archivos/tareas detectados | Ejecutados | Resultado (EE-DOC-010 o comando) |
| :-------- | :----------- | :------------------------- | :--------- | :------------------------------- |
| Typecheck | `@eq-labs/…` | N                          | N          | PASS/FAIL/…                      |
| Test      | `@eq-labs/…` | N                          | N          | PASS/SKIPPED/FAIL/…              |

---

## 07. Prohibiciones

1. Reclasificar SKIPPED de EE-DOC-010 como N/A de dominio o de ítem smoke.
2. DEGRADED de dominio sin WAIVE.
3. PASS de factory no invocada.
4. Asumir PASS de templates por solo PASS de QG-REPO.
5. N/A para V-E2E Mandatory (EE-DOC-005).
6. Bypass de required checks.
7. Citar otros documentos por **número de versión** como ancla normativa.
8. Report formal fuera de `docs/validation/`.
9. Intelligence → Knowledge.
10. Typecheck/test vacío → PASS.

---

## 08. Plan de Implementación y Fases

| Unidad  | Entrega                                                                                                                                                                                                                                                 | IMP            |
| :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| **P01** | Inventario; residuales (cierre o WAIVE vigente); scaffold **`docs/validation/`** (`README.md`, `reports/`, `waivers/`, `evidence/layers/`); CODEOWNERS; sync índice; registro Tipo A (nomenclatura EE-VAL/EE-WAIVE en EE-DOC-002 / EE-DOC-006 si falta) | EE-IMP-015-P01 |
| **P02** | V-STRUCT + TOPLEVEL; layers; templates 012 → PENDING/Tipo B                                                                                                                                                                                             | EE-IMP-015-P02 |
| **P03** | V-QG anti False Pass; V-INT + composition efectiva                                                                                                                                                                                                      | EE-IMP-015-P03 |
| **P04** | V-AUTO/INFRA/SMOKE; V-E2E PENDING + ticket e2e                                                                                                                                                                                                          | EE-IMP-015-P04 |
| **P05** | Report canónico; EE-TEC-010; cierre                                                                                                                                                                                                                     | EE-IMP-015-P05 |

---

## 09. Evolución y descubrimientos

Rechazado \| Diferido \| Adoptado → Tipo A/B/C/D (EE-DOC-005).

Ejemplos: plantillas EE-VAL/EE-WAIVE en EE-DOC-002 (A/B); `pnpm run e2e` (B/C); unificar composition + entrypoint (B); turbo `test` dependsOn build (B, EE-ADR-001); validador templates 012 (B); consumo Prettier/Vitest (B).

---

## 10. Cumplimiento

| Control                  | Evidencia                                                  |
| :----------------------- | :--------------------------------------------------------- |
| EE-DOC-010               | Frontera; Results; WAIVE                                   |
| EE-DOC-006               | Capas; composition; `docs/validation/`                     |
| EE-DOC-005 / EE-ADR-004  | E2E Mandatory; régimen PENDING                             |
| EE-DOC-011               | Comandos root; build completo                              |
| EE-DOC-012               | Contrato templates ≠ solo QG-REPO                          |
| EE-ADR-002 / 005         | Testing; SPI/root                                          |
| VAL-02 / VAL-03 / VAL-08 | Anti False Pass; no reclasificar gates; smoke reproducible |

---

## 11. Referencias

| Código           | Uso                                             |
| :--------------- | :---------------------------------------------- |
| EE-DOC-001…014   | Índice y normas de dominio                      |
| EE-DOC-002       | Plantilla documental                            |
| EE-DOC-010       | Quality Gates (SSOT merge)                      |
| EE-DOC-007 / 008 | CI / local                                      |
| EE-DOC-011       | Automation / comandos root                      |
| EE-DOC-012       | Templates                                       |
| EE-ADR-001…005   | Orquestación, testing, Node, QG progresivo, SPI |
| EE-RFC-001 / 002 | infra/; templates/ top-level                    |
| EE-TEC-001…009   | As-built previo                                 |

---

## 12. Historial de Cambios

| Versión           | Fecha      | Autor                  | Aprobado por           | Motivo                              | Cambios                                                                                                                                           | Estado                         |
| :---------------- | :--------- | :--------------------- | :--------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------- |
| **v0.1.0–v0.4.0** | 2026-10-06 | Equipo de Arquitectura | —                      | Elaboración incremental             | Modelo, WAIVE, hitos, composition, smoke                                                                                                          | En Elaboración                 |
| **v0.5.0**        | 2026-10-06 | Equipo de Arquitectura | —                      | Re-revisión prioritaria (3 bloques) | SKIPPED≠N/A; docs/validation vía 006; QG-DOC precedencia; templates≠REPO; salida residual; build completo; agregación; sin refs por versión ajena | **En Elaboración**             |
| **v0.5.1**        | 2026-10-06 | Equipo de Arquitectura | —                      | Higiene agregación N/A + 006 README | Regla N/A en §04.4.3; anti-FP cuantificable; matriz config con aplicabilidad; V-GOV README raíz; templates 012 sin atribución ambigua             | **En Revisión Arquitectónica** |
| **v0.5.2**        | 2026-10-07 | Equipo de Arquitectura | —                      | Higiene revisión arquitectónica     | P01 README; V-QG FMT vía validate; dictamen ≠ aprobado; nota hito LAYERS/E2E                                                                      | **En Revisión Arquitectónica** |
| **v1.0.0**        | 2026-10-07 | Equipo de Arquitectura | Equipo de Arquitectura | Aprobación arquitectónica           | Congelación del marco de validación de ecosistema; habilita EE-IMP-015                                                                            | **Aprobado**                   |
| **v1.1.0**        | 2026-10-07 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre implementación + congelación | IMP-015 P01–P05; EE-VAL-072b5e7; EE-TEC-010; dictamen DEGRADED admisible                                                                          | **Congelado**                  |

---

## 13. Cierre Documental

### 13.1. Validación Final (CC.1)

Validación de contenido del marco normativo **completada**. Documento **Aprobado**.

### 13.2. Resultado de Quality Gates (CC.2)

No aplica como gate de merge de este documento; la ejecución de QG del monorepo es evidencia de **EE-IMP-015**, no del cierre normativo de 015.

### 13.3. Dictamen (CC.3)

| Campo                                | Valor                                                                                                        |
| :----------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Dictamen documental**              | **Aprobado** por Equipo de Arquitectura                                                                      |
| **Hallazgos bloqueantes del modelo** | Ninguno conocido                                                                                             |
| **Pendientes de materialización**    | Los PENDING de la matriz hito × dominio (p. ej. V-ARCH-LAYERS, V-E2E) y residuales as-built → **EE-IMP-015** |
| **As-built / residuales**            | D-01 y demás: salida en P01 (cierre o WAIVE)                                                                 |
| **Aprobación arquitectónica**        | **Aprobada**                                                                                                 |

### 13.4. Estado Final (CC.4)

| Campo         | Valor                                                                |
| :------------ | :------------------------------------------------------------------- |
| **Versión**   | **v1.0.0**                                                           |
| **Estado**    | **Aprobado**                                                         |
| **Siguiente** | **EE-IMP-015-P01** — materialización `docs/validation/` e inventario |

### 13.5. Checklist pre-aprobación

- [x] V-SMOKE conserva SKIPPED de EE-DOC-010
- [x] `docs/validation/` autorizado en EE-DOC-006
- [x] Precedencia QG-DOC → V-GOV
- [x] Templates 012 ≠ solo QG-REPO
- [x] Salida/renovación residuales §04.5
- [x] Referencias a otros docs **sin** anclar versión
- [x] N/A en agregación §04.4.3; README validation alineado a EE-DOC-006
- [x] Aprobación arquitectónica

---

## FIN DEL DOCUMENTO
