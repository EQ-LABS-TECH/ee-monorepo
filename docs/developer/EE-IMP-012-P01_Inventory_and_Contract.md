# EE-IMP-012-P01 — Inventory and Contract

Este documento registra la evidencia técnica de implementación de la fase **P01** de **EE-DOC-012 — Templates**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                       |
| :------------------------- | :---------------------------------------------------------- |
| **ID**                     | EE-IMP-012-P01                                              |
| **Documento**              | Inventory and Contract                                      |
| **Código corto**           | EE-IMP-012-P01                                              |
| **Fase**                   | Fase 3 — Core Components                                    |
| **Fase de implementación** | P01 — Inventory and Contract (Implementación de EE-DOC-012) |
| **Tipo**                   | Documento Técnico de Implementación                         |
| **Clasificación**          | Implementación                                              |
| **Nivel**                  | Técnico                                                     |
| **Normativo**              | No                                                          |
| **Versión**                | v1.1.0                                                      |
| **Estado**                 | Completado                                                  |
| **Propietario**            | Equipo de Arquitectura                                      |
| **Documento padre**        | EE-DOC-012 — Templates (v0.4.0 Aprobado)                    |
| **Dependencias**           | EE-DOC-006 v1.5.0, EE-DOC-011, EE-RFC-002, EE-DOC-010       |
| **Aprobado por**           | Equipo de Arquitectura                                      |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                            |
| **Fecha de creación**      | 2026-10-01                                                  |
| **Última revisión**        | 2026-10-01                                                  |
| **Próxima revisión**       | 2026-12-30                                                  |

---

## 01. Objetivo

1. Inventariar ubicaciones y mecanismos relacionados con templates/scaffolding en el monorepo **sin** materializar `templates/`.
2. Detectar **duplicidades** potenciales (`assets/templates/`, `marketplace/templates/`, futuros generativos).
3. Registrar **ownership** y fronteras (006 / 011 / 012 / RFC-002).
4. Documentar el **borrador del esquema** `template.schema.json` (contrato EE-DOC-012 §07) para materialización en **P02**.
5. Confirmar `pnpm run validate` PASS **sin** cambios de estructura top-level.

**Prohibido en P01:** crear `templates/`, modificar `allowedTopLevel`, plopfile operativo, o templates de categoría.

---

## 02. Alcance

### 02.1. Incluye

- Inventario de paths y artefactos listados en §04.
- Matriz de ownership y no-duplicación SSOT.
- Borrador de JSON Schema alineado a §07.1.
- Criterios de aceptación de EE-DOC-012 §21.2 (P01).

### 02.2. No incluye

| Ítem                                            | Fase          |
| :---------------------------------------------- | :------------ |
| Crear `templates/` en git                       | **P02**       |
| `allowedTopLevel` + CODEOWNERS + prettierignore | **P02**       |
| `validateTemplates()` en `scripts/validate`     | **P02**       |
| Templates T-DOC / código                        | **P03 / P04** |
| `scripts/plopfile.mjs` operativo                | **P05**       |

---

## 03. Prerrequisitos (cumplidos)

| Prerrequisito                                        | Estado                  |
| :--------------------------------------------------- | :---------------------- |
| EE-RFC-002 Aprobado                                  | ✅ v1.1.0               |
| EE-DOC-006 v1.5.0 (`templates/` autorizado en norma) | ✅                      |
| EE-DOC-012 Aprobado                                  | ✅ v0.4.0               |
| EE-DOC-001 sincronizado                              | ✅ v2.9.0               |
| Materialización física aún no hecha                  | ✅ (correcto hasta P02) |

---

## 04. Inventario as-built (baseline)

### 04.1. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

Write-Host "=== TOP-LEVEL ==="
Get-ChildItem -Force -Directory | Select-Object Name

Write-Host "=== assets/templates ==="
Test-Path assets\templates
Get-ChildItem -Force -Recurse assets\templates -ErrorAction SilentlyContinue |
  Select-Object FullName, Length

Write-Host "=== marketplace ==="
Test-Path marketplace
Get-ChildItem -Force marketplace -ErrorAction SilentlyContinue | Select-Object Name

Write-Host "=== generate / plop ==="
Test-Path scripts\generate
Test-Path plopfile.js
Test-Path plopfile.mjs
Test-Path scripts\plopfile.mjs
Select-String -Path scripts\generate -Pattern "plopfile|DOC-012|plop"

Write-Host "=== validate allowlist ==="
Select-String -Path scripts\validate -Pattern "allowedTopLevel|templates"

Write-Host "=== CODEOWNERS templates ==="
Select-String -Path .github\CODEOWNERS -Pattern "templates"

pnpm run validate
```

### 04.2. Resultado as-built (evidencia 2026-10-01)

| Path / artefacto                                        | Rol                        | Estado observado                                                                                                                                         |
| :------------------------------------------------------ | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/` (top-level)                                | SSOT generativa (012)      | **Ausente** ✅ (correcto hasta P02)                                                                                                                      |
| Top-level dirs                                          | Núcleo/soporte/datos/infra | `.changeset`, `.github`, `.vscode`, `apps`, `assets`, `connectors`, `data`, `docs`, `examples`, `infra`, `marketplace`, `packages`, `scripts` (+ caches) |
| `assets/templates/`                                     | Estático/pasivo (006 §14)  | **Presente** (`Test-Path` True); **no** SSOT generativa                                                                                                  |
| `marketplace/`                                          | Extensibilidad             | Presente: `agents`, `plugins`, `prompts`, `skills`, **`templates`**                                                                                      |
| `marketplace/templates/`                                | Extensibilidad             | Presente; **fuera** de SSOT scaffolding EE-LABS                                                                                                          |
| `scripts/generate`                                      | A-GEN (011)                | **Presente**                                                                                                                                             |
| `plopfile.js` / `plopfile.mjs` / `scripts/plopfile.mjs` | Registro engine            | **Ausentes** (P05)                                                                                                                                       |
| `scripts/validate` `allowedTopLevel`                    | QG-ARCH-001                | Sin coincidencias `templates` en Select-String (aún no en allowlist)                                                                                     |
| `.github/CODEOWNERS`                                    | Ownership                  | Sin patrón `templates/`                                                                                                                                  |
| `pnpm run validate`                                     | Agregador                  | ✅ PASS (sin `templates/` top-level)                                                                                                                     |

### 04.3. Matriz de ownership

| Superficie             | Owner normativo              | Owner operativo (equipos)                   |
| :--------------------- | :--------------------------- | :------------------------------------------ |
| `templates/` (futuro)  | EE-DOC-012                   | architecture + maintainers (P02 CODEOWNERS) |
| `assets/templates/`    | EE-DOC-006 §14               | maintainers                                 |
| `scripts/generate`     | EE-DOC-011                   | repository-admin + maintainers              |
| Registro Plop          | EE-DOC-011 §07 / IMP-012-P05 | architecture                                |
| `template.schema.json` | EE-DOC-012 §07               | architecture                                |

### 04.4. Duplicidades

| Par                                      | Dictamen                                                  |
| :--------------------------------------- | :-------------------------------------------------------- |
| `templates/` vs `assets/templates/`      | **No duplicar** generativos en assets (RFC-002 / 006 §14) |
| `templates/` vs `marketplace/templates/` | Marketplace ≠ SSOT interna                                |
| Múltiples plopfile                       | **Prohibido** (012 §20); un registro en `scripts/` (P05)  |

---

## 05. Borrador de contrato — `template.schema.json`

Materialización del archivo: **P02** en `templates/template.schema.json`.  
Contenido normativo de campos: **EE-DOC-012 §07.1**.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://eq-labs.dev/schemas/template.schema.json",
  "title": "EE-LABS generative template metadata",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "id",
    "name",
    "category",
    "version",
    "description",
    "target",
    "owner",
    "locale",
    "allowedTargets",
    "inputs",
    "outputs"
  ],
  "properties": {
    "schemaVersion": { "type": "string", "const": "1" },
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$"
    },
    "name": { "type": "string", "minLength": 1 },
    "category": {
      "type": "string",
      "enum": ["T-DOC", "T-PKG", "T-APP", "T-CON"]
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "description": { "type": "string", "minLength": 1 },
    "target": { "type": "string", "minLength": 1 },
    "owner": { "type": "string", "minLength": 1 },
    "locale": { "type": "string", "enum": ["es", "en"] },
    "allowedTargets": {
      "type": "array",
      "minItems": 1,
      "items": { "type": "string", "minLength": 1 }
    },
    "inputs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "type", "required"],
        "additionalProperties": false,
        "properties": {
          "name": { "type": "string" },
          "type": {
            "type": "string",
            "enum": ["string", "boolean", "number", "enum"]
          },
          "required": { "type": "boolean" },
          "pattern": { "type": "string" },
          "enum": {
            "type": "array",
            "items": { "type": "string" }
          },
          "default": {},
          "description": { "type": "string" }
        }
      }
    },
    "outputs": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "dependencies": {
      "type": "array",
      "items": { "type": "string" }
    },
    "preconditions": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

> **Nota:** el esquema se versiona con `schemaVersion: "1"`. Cambios incompatibles → Type B + bump de contrato en 012 / IMP.

---

## 06. Criterios de aceptación

| #   | Criterio (EE-DOC-012 §21.2 P01)                   | Estado        |
| :-- | :------------------------------------------------ | :------------ |
| 1   | Inventario ejecutado y documentado                | ✅            |
| 2   | Ownership y duplicidades resueltas / dictaminadas | ✅ §04.3–04.4 |
| 3   | Esquema documentado (borrador §05)                | ✅            |
| 4   | `pnpm run validate` PASS sin crear `templates/`   | ✅            |
| 5   | Sin materialización prematura de `templates/`     | ✅            |

---

## 07. Validaciones

| Prueba              | Resultado | Detalle                                                                        |
| :------------------ | :-------- | :----------------------------------------------------------------------------- |
| Inventario local    | ✅        | Top-level sin `templates/`; assets/templates y marketplace/templates presentes |
| `pnpm run validate` | ✅        | All validations passed; sin cambio de árbol                                    |

### 07.1. Estado de la fase

**Completado**.

---

## 08. Descubrimientos

| ID        | Descripción                             | Resultado                                                                 |
| :-------- | :-------------------------------------- | :------------------------------------------------------------------------ |
| D-P01-001 | `assets/templates/` existe (estático)   | **Aceptado** — frontera 006 §14; no migrar a generativos en P01           |
| D-P01-002 | `marketplace/templates/` existe         | **Aceptado** — fuera de SSOT 012; no confundir con top-level `templates/` |
| D-P01-003 | Sin plopfile / registro engine          | **Esperado** — EE-IMP-012-P05                                             |
| D-P01-004 | `templates` aún no en `allowedTopLevel` | **Esperado** — EE-IMP-012-P02                                             |

---

## 09. Trazabilidad

| Artefacto  | Referencia                              |
| :--------- | :-------------------------------------- |
| Norma      | EE-DOC-012 §07, §21 P01                 |
| Estructura | EE-DOC-006 v1.5.0 / EE-RFC-002          |
| Generate   | EE-DOC-011 §07                          |
| Siguiente  | **EE-IMP-012-P02** — Template Structure |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                            | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :----------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-01 | Equipo de Arquitectura | —                      | Apertura P01 | Inventario; ownership; borrador schema                             | Borrador       |
| **v1.1.0** | 2026-10-01 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P01   | Evidencia inventario; validate PASS; descubrimientos D-P01-001…004 | **Completado** |

---

## FIN DEL DOCUMENTO
