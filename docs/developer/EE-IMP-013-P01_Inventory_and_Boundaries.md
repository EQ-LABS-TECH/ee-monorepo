# EE-IMP-013-P01 — Inventory and Boundaries

Este documento registra la evidencia técnica de implementación de la fase **P01** de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                         |
| :------------------------- | :------------------------------------------------------------ |
| **ID**                     | EE-IMP-013-P01                                                |
| **Documento**              | Inventory and Boundaries                                      |
| **Código corto**           | EE-IMP-013-P01                                                |
| **Fase**                   | Fase 3 — Core Components                                      |
| **Fase de implementación** | P01 — Inventory and Boundaries (Implementación de EE-DOC-013) |
| **Tipo**                   | Documento Técnico de Implementación                           |
| **Clasificación**          | Implementación                                                |
| **Nivel**                  | Técnico                                                       |
| **Normativo**              | No                                                            |
| **Versión**                | v1.1.0                                                        |
| **Estado**                 | Completado                                                    |
| **Propietario**            | Equipo de Arquitectura                                        |
| **Documento padre**        | EE-DOC-013 — AI Ecosystem (Aprobado)                          |
| **Dependencias**           | EE-DOC-004; EE-DOC-006; EE-DOC-010; EE-ADR-005; EE-DOC-001    |
| **Aprobado por**           | Equipo de Arquitectura                                        |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps, IA                          |
| **Fecha de creación**      | 2026-10-03                                                    |
| **Última revisión**        | 2026-10-03                                                    |
| **Próxima revisión**       | EE-IMP-013-P02                                                |

---

## 01. Objetivo

1. Inventariar el **as-built** de paquetes y paths relacionados con la AI Layer (`intelligence`, `foundation`, `registry`, `knowledge`, connectors oficiales, `apps/*`).
2. Publicar la **matriz Registry → Router** (EE-DOC-013 §07.1) como contrato de frontera de P01.
3. Verificar alineación con la **matriz de capas** EE-DOC-006 §13.2 y **composition root** §13.5 (`apps/*` únicamente).
4. Registrar **prohibiciones** de import (Intelligence ↛ Registry/Knowledge/Connectors; Connectors ↛ Intelligence/…).
5. Evaluar `pnpm run validate` en el contexto de P01 (**sin** materializar SPI/ABI en Foundation — **P03**).

**Prohibido en P01:** implementar Router funcional, tipos SPI en Foundation, adapters de provider, composition root de wiring, o activar QG nuevos de capa.

---

## 02. Alcance

### 02.1. Incluye

- Inventario de paths y `package.json` relevantes (§04).
- Matriz de ownership y fronteras (§05–§07).
- Matriz Registry → Router publicada (§06).
- Criterios de aceptación de EE-DOC-013 §12.2 (P01).
- Descubrimiento D-01 (QG-SEC-001 / `braces`) y registro **WAIVED**.

### 02.2. No incluye

| Ítem                                                         | Fase    |
| :----------------------------------------------------------- | :------ |
| Baseline package Intelligence (deps, exports reales)         | **P02** |
| Contratos SPI / Inference / Generation / Error en Foundation | **P03** |
| Adapter boundary / connector de referencia provider          | **P03** |
| Routing + policy + catalog port wiring                       | **P04** |
| Secrets + observabilidad default §09.3                       | **P05** |
| Cierre + EE-TEC-008                                          | **P06** |

---

## 03. Prerrequisitos (cumplidos)

| Prerrequisito                                                 | Estado    |
| :------------------------------------------------------------ | :-------- |
| EE-DOC-013 Aprobado                                           | ✅ v1.0.0 |
| EE-ADR-005 Aprobado                                           | ✅        |
| EE-DOC-006 vigente (§13.2 Connectors, §13.5 composition root) | ✅        |
| EE-DOC-001 sincronizado (013 Aprobado)                        | ✅        |
| Scaffold `@eq-labs/intelligence` presente (DOC-013 §02.5)     | ✅        |

---

## 04. Inventario as-built (baseline)

### 04.1. Procedimiento operador

Ejecutado desde la raíz del monorepo (`ee-monorepo`). Evidencia consolidada 2026-10-03 a partir de:

- Snapshot `Paquetes_Archivos_Monorepo`
- `pnpm why braces` / `pnpm audit --audit-level high` (operador)
- Criterios EE-DOC-013 §02.5 / §12.2

### 04.2. Resultado as-built

| Path / artefacto                                             | Rol normativo (013 / 006)                     | Estado observado                                                             |
| :----------------------------------------------------------- | :-------------------------------------------- | :--------------------------------------------------------------------------- |
| `packages/intelligence/` (`@eq-labs/intelligence@0.1.0`)     | AI Layer / Router (blueprint)                 | Presente; scaffold; **sin** deps runtime hacia registry/knowledge/connectors |
| `packages/foundation/` (`@eq-labs/foundation@0.1.0`)         | SPI + ports (tipos SSOT)                      | Presente; **sin** ABI AI materializado (P03)                                 |
| `packages/registry/` (`@eq-labs/registry@0.1.0`)             | SSOT catálogo specialists                     | Presente                                                                     |
| `packages/knowledge/` (`@eq-labs/knowledge@0.1.0`)           | Knowledge services                            | Presente                                                                     |
| `packages/execution/`, `governance/`, `integration/`, `sdk/` | Capas 006                                     | Presentes                                                                    |
| `connectors/official/*`                                      | Adapters / límites de confianza               | a2a, docker, github, kubernetes, mcp, notebooklm (+ samples si existían)     |
| `apps/*`                                                     | **Único** composition root (§13.5)            | Presentes (`cli`, `dashboard`, `extensions`, …)                              |
| `packages/sdk/`                                              | Exposición pública — **no** composition root  | Presente                                                                     |
| `scripts/bootstrap`                                          | Setup entorno (011) — **no** composition root | Presente                                                                     |
| `marketplace/{agents,prompts,skills,…}`                      | Activos — **no** política runtime             | Presente según snapshot                                                      |
| `data/`                                                      | Datos / futuros models                        | Presente en árbol top-level                                                  |

### 04.3. Matriz de ownership (P01)

| Superficie                           | Owner normativo                 | Owner operativo                                |
| :----------------------------------- | :------------------------------ | :--------------------------------------------- |
| `packages/intelligence/`             | EE-DOC-013 / 006                | Architecture + Maintainers                     |
| `packages/foundation/` (`contracts`) | EE-DOC-013 / ADR-005            | Architecture                                   |
| `packages/registry/`                 | EE-DOC-006 + 013 §07.1          | Architecture + Maintainers                     |
| `connectors/official/*`              | ADR-005 / 006 §13               | Maintainers (+ Architecture en cambios de SPI) |
| `apps/*` (composition root)          | 006 §13.5 / ADR-005             | Repository Admin + Architecture                |
| `marketplace/*`                      | 006                             | Maintainers                                    |
| Políticas runtime AI                 | Intelligence + Foundation ports | Architecture                                   |

### 04.4. Dependencias runtime (frontera)

| Package                 | Dependencies de runtime observadas                                               | Conformidad capas              |
| :---------------------- | :------------------------------------------------------------------------------- | :----------------------------- |
| `@eq-labs/intelligence` | Ninguna hacia registry/knowledge/connectors (solo tooling Config en devDeps)     | ✅ frente a §13.2 Intelligence |
| `@eq-labs/foundation`   | Scaffold; sin SPI AI aún                                                         | ✅ baseline P01                |
| Connectors oficiales    | Tooling Config; sin Intelligence/Registry/Knowledge en runtime (plantilla T-CON) | ✅ frente a PR-08 / §13.2      |

---

## 05. Alineación de capas (EE-DOC-006 §13.2)

| Categoría            | Puede importar (norma)                 | Evidencia P01                                      |
| :------------------- | :------------------------------------- | :------------------------------------------------- |
| **Intelligence**     | Foundation, Execution, Intelligence    | Sin imports prohibidos en package scaffold         |
| **Connectors**       | Foundation (runtime); Config (tooling) | Alineado a plantilla / package.json oficiales      |
| **Registry**         | Foundation, Knowledge, Registry        | Presente; no consumido por Intelligence vía import |
| **Composition root** | `apps/*` (§13.5)                       | Apps inventariadas; `scripts/bootstrap` ≠ root     |

**Enforcement automático de imports:** PENDING (EE-DOC-010). Cumplimiento P01 = inventario + revisión de package.json; **no** se declara PASS de matriz automática.

---

## 06. Matriz Registry → Router (EE-DOC-013 §07.1) — entregable P01

| Registry **owns**               | Router **consumes**                         | Router **owns**                           |
| :------------------------------ | :------------------------------------------ | :---------------------------------------- |
| Identity de especialización     | Identity                                    | Algoritmo de selección de especialización |
| Metadata de specialists         | Capabilities relevantes para routing        | Selección de provider / backend           |
| Capabilities declaradas         | Availability / status usable para routing   | **Routing policy** versionada             |
| Lifecycle / status del catálogo | Configuración expuesta vía **catalog port** | Decisión final de enrutamiento            |

### 06.1. Catalog port (norma publicada en P01)

| Aspecto               | Norma                                                                |
| :-------------------- | :------------------------------------------------------------------- |
| **Interface (tipos)** | Foundation (`contracts`) — materialización **P03**                   |
| **Implementación**    | Registry                                                             |
| **Consumo**           | Intelligence (Router), **sin** importar el package Registry          |
| **Inyección**         | Composition root (`apps/*`) — **P04**                                |
| **Degradación**       | EE-DOC-013 §07.2 / AI-10; **prohibido** catálogo paralelo silencioso |

```text
Registry (catalog SSOT)
        │ specialization catalog (port en Foundation)
        ▼
Specialization Router
        │ routing decision
        ▼
Provider Router
        │
        ├── Remote Provider Adapter  (connectors/official/*)
        └── Local Inference Runtime  (SPI; ubicación → ADR posterior)
```

---

## 07. Fronteras y prohibiciones (checklist P01)

| ID            | Regla                                                 | Resultado P01                                 |
| :------------ | :---------------------------------------------------- | :-------------------------------------------- |
| PR-07         | Tipos SPI en Foundation; adapters en connectors       | ✅ Sin adapters provider; correcto hasta P03  |
| PR-08         | Connector runtime solo Foundation                     | ✅ Revisado en plantilla / packages oficiales |
| PR-09         | Composition root = `apps/*`                           | ✅ Documentado; bootstrap ≠ root              |
| RT-05         | SSOT catálogo = Registry                              | ✅ Matriz §06 publicada                       |
| AI-10 / §07.2 | Degradación controlada                                | ✅ Norma publicada; implementación P04        |
| Capas 006     | Intelligence no importa registry/knowledge/connectors | ✅ En scaffold package.json                   |

---

## 08. Criterios de aceptación (EE-DOC-013 §12.2 — P01)

| Criterio                       | Evidencia | Estado                                                         |
| :----------------------------- | :-------- | :------------------------------------------------------------- |
| Matriz §07.1 publicada         | §06       | ✅                                                             |
| Capas 006 documentadas para AI | §05       | ✅                                                             |
| Inventario as-built            | §04       | ✅                                                             |
| Sin materialización SPI/Router | §02.2     | ✅                                                             |
| `pnpm run validate`            | §09       | ⚠️ Bloqueado por D-01 (WAIVED); **no** es fallo de alcance P01 |

---

## 09. Validaciones ejecutadas

| Comando / prueba                                    | Resultado                    | Detalle                                                       |
| :-------------------------------------------------- | :--------------------------- | :------------------------------------------------------------ |
| Inventario paths / packages (snapshot + gobernanza) | ✅                           | §04.2                                                         |
| Revisión deps `@eq-labs/intelligence`               | ✅                           | Sin registry/knowledge/connectors runtime                     |
| `pnpm why braces`                                   | ✅                           | `plop@4.0.0` → … → `braces@3.0.3`                             |
| `pnpm audit --audit-level high`                     | ❌ / **WAIVED**              | 1 high: GHSA-vfj7-8cjw-p6xm                                   |
| `pnpm run validate`                                 | ❌ / **WAIVED** (QG-SEC-001) | Mismo hallazgo; resto de gates de estructura no es el bloqueo |

### 09.1. Resultado de la fase

**Estado: Completado.**

Entregables P01 satisfechos: inventario, fronteras, matriz Registry→Router, checklist de capas. El único bloqueo de `validate` es **supply-chain de tooling** (D-01), fuera del alcance de materialización AI de P01 y gestionado con **WAIVED**.

### 09.2. Descubrimientos

| ID       | Tipo | Hallazgo                                                                                                                                                                                                       | Decisión   |
| :------- | :--- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------- |
| **D-01** | B    | **QG-SEC-001** FAIL: `braces@3.0.3` vía `plop` → `liftoff` → `findup-sync` → `micromatch` (GHSA-vfj7-8cjw-p6xm / CVE-2026-93687). **Sin versión parcheada en npm** (`Patched versions: <0.0.0`; latest 3.0.3). | **WAIVED** |

#### 09.2.1. Registro WAIVED (EE-DOC-010 §04.6.1)

| Campo         | Valor                                                                                                                                                                                                                         |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gate**      | QG-SEC-001                                                                                                                                                                                                                    |
| **Result**    | WAIVED                                                                                                                                                                                                                        |
| **Advisory**  | GHSA-vfj7-8cjw-p6xm                                                                                                                                                                                                           |
| **Ámbito**    | Solo cadena **devDependency** `plop` (A-GEN / EE-DOC-011); **no** runtime de producto                                                                                                                                         |
| **Autoridad** | Equipo de Arquitectura                                                                                                                                                                                                        |
| **Emitido**   | 2026-10-03                                                                                                                                                                                                                    |
| **Caduca**    | **2026-10-10** (≤ 7 días, EE-DOC-005 §10.3)                                                                                                                                                                                   |
| **Plan**      | (1) Re-auditar cuando exista versión fija de `braces` en npm y aplicar override/upgrade. (2) Si no hay parche al vencimiento → renovar WAIVED o **ADR** de riesgo residual. (3) No desactivar el audit en `scripts/validate`. |

---

## 10. Trazabilidad

| Elemento                      | Referencia                            |
| :---------------------------- | :------------------------------------ |
| **Documento normativo padre** | EE-DOC-013 — AI Ecosystem             |
| **Fase**                      | P01 — Inventory and Boundaries        |
| **Implementación**            | EE-IMP-013-P01                        |
| **ADR de frontera provider**  | EE-ADR-005                            |
| **Capas / composition root**  | EE-DOC-006 §13.2 / §13.5              |
| **Quality Gates**             | EE-DOC-010 (QG-SEC-001, WAIVED)       |
| **Siguiente fase**            | **EE-IMP-013-P02** — Baseline package |

### 10.1. Conformidad

Este documento es conforme al alcance **P01** de EE-DOC-013 §12. No declara ACTIVE gates de capa AI ni ABI de provider. El ciclo de vida sigue EE-DOC-005 (Implementación → Validación parcial con WAIVED documentado → siguiente IMP).

---

## 11. Referencias

| Código                  | Documento                              | Uso                            |
| :---------------------- | :------------------------------------- | :----------------------------- |
| **EE-DOC-013**          | AI Ecosystem                           | Norma padre; §07.1, §12, §07.2 |
| **EE-DOC-006**          | Repository Structure                   | Capas; §13.5 composition root  |
| **EE-ADR-005**          | AI Provider SPI and Connector Adapters | SPI / connectors / apps/\*     |
| **EE-DOC-004**          | Engineering Architecture               | AI Layer                       |
| **EE-DOC-010**          | Quality Gates                          | QG-SEC-001; WAIVED             |
| **EE-DOC-005**          | Development Workflow                   | Bypass / caducidad 7 días      |
| **EE-DOC-002**          | Document Design Template               | §18.3                          |
| **GHSA-vfj7-8cjw-p6xm** | braces stack-exhaustion                | D-01                           |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                                               | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :------------------------------------------------------------------------------------ | :---------------- |
| **v1.0.0** | 2026-10-03 | Equipo de Arquitectura | —                      | Apertura P01 | Inventario, fronteras, matriz §07.1, checklist capas                                  | En Implementación |
| **v1.1.0** | 2026-10-03 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P01   | Evidencia as-built §04; D-01 WAIVED braces/plop; criterios §08; estado **Completado** | **Completado**    |

---

## FIN DEL DOCUMENTO
