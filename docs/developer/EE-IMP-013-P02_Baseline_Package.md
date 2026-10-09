# EE-IMP-013-P02 — Baseline Package

Este documento registra la evidencia técnica de implementación de la fase **P02** de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                          |
| :------------------------- | :------------------------------------------------------------- |
| **ID**                     | EE-IMP-013-P02                                                 |
| **Documento**              | Baseline Package                                               |
| **Código corto**           | EE-IMP-013-P02                                                 |
| **Fase**                   | Fase 3 — Core Components                                       |
| **Fase de implementación** | P02 — Baseline package (Implementación de EE-DOC-013)          |
| **Tipo**                   | Documento Técnico de Implementación                            |
| **Clasificación**          | Implementación                                                 |
| **Nivel**                  | Técnico                                                        |
| **Normativo**              | No                                                             |
| **Versión**                | v1.1.0                                                         |
| **Estado**                 | Completado                                                     |
| **Propietario**            | Equipo de Arquitectura                                         |
| **Documento padre**        | EE-DOC-013 — AI Ecosystem (Aprobado)                           |
| **Dependencias**           | EE-DOC-006; EE-DOC-013; EE-ADR-005; EE-IMP-013-P01; EE-DOC-010 |
| **Aprobado por**           | Equipo de Arquitectura                                         |
| **Audiencia**              | Arquitectura, Desarrollo                                       |
| **Fecha de creación**      | 2026-10-03                                                     |
| **Última revisión**        | 2026-10-03                                                     |
| **Próxima revisión**       | EE-IMP-013-P03                                                 |

---

## 01. Objetivo

1. Establecer el **baseline del paquete plano** `@eq-labs/intelligence` (EE-DOC-013 §04.9 / §12.1).
2. Cumplir el **criterio de dependencias**: `package.json` **sin** `@eq-labs/registry` ni `@eq-labs/knowledge` (Tipo B / EE-DOC-005 §10.4).
3. Alinear **README** al rol normativo (Router / orquestación de enrutamiento; no negocio de producto; no import de connectors).
4. Eliminar residuos de build (`src/index.js` junto a `index.ts`) si existen.
5. Verificar **lint / typecheck / build** del paquete.

**Prohibido en P02:** SPI/ABI en Foundation (P03), adapters de provider (P03), wiring composition root (P04), Router funcional completo.

---

## 02. Alcance

### 02.1. Incluye

| Artefacto                            | Acción                                        |
| :----------------------------------- | :-------------------------------------------- |
| `packages/intelligence/package.json` | Verificar criterio deps; description alineada |
| `packages/intelligence/README.md`    | Reescribir a contrato EE-DOC-013              |
| `packages/intelligence/src/index.ts` | Mantener export mínimo (placeholder)          |
| `packages/intelligence/src/index.js` | **Eliminar** si existe (residuo)              |
| Scripts package                      | `lint`, `typecheck`, `build` OK               |

### 02.2. No incluye

| Ítem                                      | Fase                               |
| :---------------------------------------- | :--------------------------------- |
| `src/contracts` / SPI en Foundation       | **P03**                            |
| `dependencies` a Foundation por tipos SPI | **P03** (cuando existan contratos) |
| Specialization / Provider Router          | **P04**                            |
| Composition root en `apps/*`              | **P04**                            |

---

## 03. Prerrequisitos

| Prerrequisito                    | Estado              |
| :------------------------------- | :------------------ |
| EE-IMP-013-P01 Completado        | ✅ v1.1.0           |
| EE-DOC-013 Aprobado              | ✅                  |
| Scaffold `packages/intelligence` | ✅                  |
| D-01 WAIVED (braces/plop)        | ✅ hasta 2026-10-10 |

---

## 04. Criterio normativo de dependencias (P02)

EE-DOC-013 §12.1 / §12.2:

```text
packages/intelligence/package.json
  MUST NOT list:
    @eq-labs/registry
    @eq-labs/knowledge
  MUST NOT list runtime connectors:
    @eq-labs/connector-*
```

Imports permitidos por capa (006 §13.2) cuando se materialicen: **Foundation**, **Execution**, **Intelligence**.  
En P02 el package puede quedar **sin** `dependencies` runtime (solo Config tooling en `devDependencies`), coherente con scaffold hasta P03.

---

## 05. Especificación de artefactos

### 05.1. `package.json` (objetivo)

Mantener forma alineada a peers (`foundation`, `execution`). Campos mínimos:

```json
{
  "name": "@eq-labs/intelligence",
  "version": "0.1.0",
  "private": true,
  "description": "Intelligence layer: routing and AI orchestration for the EQ-LABS Engineering Ecosystem (EE-DOC-013).",
  "license": "Apache-2.0",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit false",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "clean": "node -e \"require('node:fs').rmSync('dist', { recursive: true, force: true })\"",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "typescript": "5.9.2",
    "eslint": "9.35.0",
    "@eq-labs/config-eslint": "workspace:*"
  }
}
```

**No** añadir `dependencies` a registry/knowledge/connectors.

### 05.2. `src/index.ts` (placeholder)

```typescript
/**
 * @eq-labs/intelligence — public surface (EE-DOC-013).
 * Router / SPI consumers land in later IMP phases (P03–P04).
 * Do not import @eq-labs/registry, @eq-labs/knowledge, or connectors here.
 */
export {};
```

### 05.3. `README.md` (objetivo)

````markdown
# @eq-labs/intelligence

Intelligence layer of the EQ-LABS Engineering Ecosystem (**EE-DOC-013**).

## Role

| Responsibility                                   | Owner                                                        |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Specialization Router / Provider Router (target) | This package                                                 |
| Provider SPI types                               | `@eq-labs/foundation` (P03)                                  |
| Provider adapters                                | `connectors/official/*` (EE-ADR-005)                         |
| Composition root (wiring)                        | `apps/*` only (EE-DOC-006 §13.5)                             |
| Specialization catalog SSOT                      | `@eq-labs/registry` via **catalog port** (not imported here) |

## Layer rules (EE-DOC-006 §13.2)

- **May depend on:** Foundation, Execution, Intelligence.
- **Must not depend on:** Registry, Knowledge, Connectors (runtime).

## Current status

Baseline package (EE-IMP-013-P02). No functional Router yet.
SPI and adapters: **EE-IMP-013-P03**. Routing wiring: **P04**.

## Development

```bash
pnpm --filter @eq-labs/intelligence run lint
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run build
```

## References

- EE-DOC-013 — AI Ecosystem
- EE-ADR-005 — AI Provider SPI and Connector Adapters
- EE-DOC-006 — Repository Structure (§13.2, §13.5)
````

### 05.4. Limpieza

```powershell
# Eliminar residuo de emit JS junto al TS fuente (si existe)
Remove-Item -Force packages\intelligence\src\index.js -ErrorAction SilentlyContinue
```

---

## 06. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# 1. Limpieza residuo
Remove-Item -Force packages\intelligence\src\index.js -ErrorAction SilentlyContinue

# 2. Actualizar package.json description + README + index.ts
#    (contenido §05 — editor o Set-Content UTF-8 sin BOM)

# 3. Criterio deps
Select-String -Path packages\intelligence\package.json -Pattern "registry|knowledge|connector-"
# Debe: sin coincidencias en dependencies (devDeps config-* OK)

# 4. Gates del package
pnpm --filter @eq-labs/intelligence run lint
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run build

# 5. (Opcional) validate global — puede seguir FAIL por D-01 (braces/plop WAIVED)
pnpm run validate
```

---

## 07. Criterios de aceptación (EE-DOC-013 §12.2 — P02)

| Criterio                                                           | Evidencia                                     | Estado        |
| :----------------------------------------------------------------- | :-------------------------------------------- | :------------ |
| Paquete plano bajo `packages/intelligence/`                        | Path existente                                | ✅            |
| `package.json` **sin** `@eq-labs/registry` ni `@eq-labs/knowledge` | Select-String vacío                           | ✅            |
| Lint / typecheck / build OK                                        | filter intelligence exit 0 (2026-10-03)       | ✅            |
| README alineado a 013 / ADR-005 / 006                              | Contenido §05.3 (si aplicado en working tree) | ✅ / operador |
| Sin `src/index.js` residual                                        | Remove-Item ejecutado                         | ✅            |
| Sin SPI/Router funcional                                           | Placeholder only                              | ✅            |

---

## 08. Validaciones ejecutadas

| Comando                                             | Resultado      | Detalle                                                                                              |
| :-------------------------------------------------- | :------------- | :--------------------------------------------------------------------------------------------------- |
| Residuo `src/index.js`                              | ✅             | `Remove-Item` ejecutado                                                                              |
| Criterio deps `package.json`                        | ✅             | `Select-String` registry\|knowledge\|connector- → **sin coincidencias**                              |
| `pnpm --filter @eq-labs/intelligence run lint`      | ✅             | eslint . exit 0                                                                                      |
| `pnpm --filter @eq-labs/intelligence run typecheck` | ✅             | tsc --noEmit exit 0                                                                                  |
| `pnpm --filter @eq-labs/intelligence run build`     | ✅             | tsc emit exit 0                                                                                      |
| `pnpm run validate`                                 | ⚠️ FAIL = D-01 | Solo QG-SEC-001 (`braces` vía plop); structure/DOC/INFRA/templates OK en el tramo posterior al audit |

### 08.1. Resultado de la fase

**Estado: Completado.**

Criterios EE-DOC-013 §12.2 (P02) satisfechos: lint/typecheck/build del package OK; `package.json` sin registry/knowledge. El FAIL global de `validate` es **únicamente** D-01 (WAIVED, EE-IMP-013-P01 §09.2.1) y **no** invalida el alcance P02.

### 08.2. Descubrimientos

| ID   | Tipo | Hallazgo                                  | Decisión                                 |
| :--- | :--- | :---------------------------------------- | :--------------------------------------- |
| D-01 | B    | QG-SEC-001 braces vía plop (arrastre P01) | **WAIVED** hasta 2026-10-10 (sin cambio) |

---

## 09. Trazabilidad

| Elemento                      | Referencia                                  |
| :---------------------------- | :------------------------------------------ |
| **Documento normativo padre** | EE-DOC-013                                  |
| **Fase**                      | P02 — Baseline package                      |
| **Implementación**            | EE-IMP-013-P02                              |
| **Predecesor**                | EE-IMP-013-P01                              |
| **Siguiente**                 | EE-IMP-013-P03 — Provider SPI and contracts |
| **Capas**                     | EE-DOC-006 §13.2                            |
| **SPI boundary**              | EE-ADR-005                                  |

### 09.1. Conformidad

Conforme al alcance P02 de EE-DOC-013 §12. No materializa contratos Foundation ni adapters.

---

## 10. Referencias

| Código             | Documento                          |
| :----------------- | :--------------------------------- |
| **EE-DOC-013**     | AI Ecosystem §04.9, §12            |
| **EE-DOC-006**     | Repository Structure §13.2 / §13.5 |
| **EE-ADR-005**     | Provider SPI / connectors          |
| **EE-IMP-013-P01** | Inventory and Boundaries           |
| **EE-DOC-002**     | §18.3                              |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                                                       | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :-------------------------------------------------------------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-03 | Equipo de Arquitectura | —                      | Apertura P02 | Baseline package plano; criterio deps; README; limpieza index.js                              | En Implementación |
| **v1.1.0** | 2026-10-03 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P02   | Evidencia lint/typecheck/build; deps criterion; D-01 WAIVED sin cambio; estado **Completado** | **Completado**    |

---

## FIN DEL DOCUMENTO
