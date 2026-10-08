# EE-IMP-014-P03 — Knowledge Port ABI

Este documento sigue el estándar **EE-DOC-002 §18.3** y materializa la unidad **P03** de **EE-DOC-014 — Knowledge Management**.

---

## METADATOS

| Campo                 | Valor                                                                          |
| :-------------------- | :----------------------------------------------------------------------------- |
| **ID**                | EE-IMP-014-P03                                                                 |
| **Documento**         | Knowledge Port ABI                                                             |
| **Código corto**      | EE-IMP-014-P03                                                                 |
| **Tipo**              | Documento Técnico de Implementación                                            |
| **Clasificación**     | Implementación                                                                 |
| **Nivel**             | Técnico                                                                        |
| **Normativo**         | No                                                                             |
| **Versión**           | v1.1.0                                                                         |
| **Estado**            | Completado                                                                     |
| **Propietario**       | Equipo de Arquitectura                                                         |
| **Documento padre**   | EE-DOC-014 — Knowledge Management                                              |
| **Dependencias**      | EE-DOC-006, EE-DOC-013, EE-DOC-014, EE-IMP-014-P01, EE-IMP-014-P02, EE-ADR-005 |
| **Aprobado por**      | Equipo de Arquitectura                                                         |
| **Audiencia**         | Arquitectura, Desarrollo                                                       |
| **Fecha de creación** | 2026-10-06                                                                     |
| **Última revisión**   | 2026-10-06                                                                     |
| **Unidad de fase**    | P03 de EE-DOC-014 §09.1                                                        |

---

## 01. Objetivo

1. Materializar en **Foundation** el ABI: **`KnowledgePort`**, **`KnowledgeError`**, **`KNOWLEDGE_PORT_VERSION` = `1.0.0`**.
2. Implementación mínima en **`@eq-labs/knowledge`** (in-memory / noop) que **implemente** el port — **no** store de producto ACTIVE.
3. Demostrar **construcción e inyección** en composition root **`apps/cli`** (mismo patrón que AI root).
4. **No** declarar Knowledge ACTIVE en producción (No False Pass).
5. **`semanticSearch`**: contrato presente; implementación puede devolver error **NOT_IMPLEMENTED** / PENDING hasta P04 + Embedding ABI.

---

## 02. Criterios de aceptación

| #      | Criterio                                                                                   | Esperado          |
| :----- | :----------------------------------------------------------------------------------------- | :---------------- |
| **C1** | Tipos + `KnowledgeError` + versión en Foundation                                           | PASS              |
| **C2** | Export público desde `@eq-labs/foundation`                                                 | PASS              |
| **C3** | `@eq-labs/knowledge` implementa `KnowledgePort`                                            | PASS              |
| **C4** | `knowledge` depende de `foundation` (workspace); **sin** intelligence/connectors/execution | PASS              |
| **C5** | Root `apps/cli` construye/inyecta el port (evidencia)                                      | PASS              |
| **C6** | Gates foundation + knowledge + cli                                                         | PASS              |
| **C7** | No se declara API de producto ACTIVE                                                       | PASS (documental) |

---

## 03. Diseño del ABI (Foundation)

### 03.1. Archivos

```text
packages/foundation/src/contracts/
  knowledge-version.ts   # KNOWLEDGE_PORT_VERSION
  knowledge-error.ts     # KnowledgeError (≠ AIError)
  knowledge.ts           # KnowledgePort + DTOs
  index.ts               # re-exports
```

### 03.2. Versión

```typescript
/** Knowledge Port contract version (EE-DOC-014 / EE-IMP-014-P03). */
export const KNOWLEDGE_PORT_VERSION = '1.0.0' as const;
export type KnowledgePortVersion = typeof KNOWLEDGE_PORT_VERSION;
```

### 03.3. Error (SSOT; no reutilizar AIError)

```typescript
export type KnowledgeErrorCode =
  | 'UNAVAILABLE'
  | 'NOT_FOUND'
  | 'INVALID_REQUEST'
  | 'INDEX_FAILED'
  | 'QUERY_FAILED'
  | 'NOT_IMPLEMENTED'
  | 'TIMEOUT'
  | 'INTERNAL';

export interface KnowledgeError {
  code: KnowledgeErrorCode;
  message: string;
  retryable: boolean;
  unitId?: string;
  cause?: unknown;
}

export function isKnowledgeError(value: unknown): value is KnowledgeError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  );
}
```

### 03.4. Port y DTOs

```typescript
export interface KnowledgeUnitMeta {
  id: string;
  version?: string;
  source?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface KnowledgeUnit {
  id: string;
  content: string;
  meta?: KnowledgeUnitMeta;
}

export interface KnowledgeIndexRequest {
  units: KnowledgeUnit[];
}

export interface KnowledgeIndexResult {
  accepted: number;
  rejected: number;
  errors?: KnowledgeError[];
}

export interface KnowledgeQueryFilter {
  ids?: string[];
  tags?: string[];
  source?: string;
  limit?: number;
}

export interface KnowledgeQueryResult {
  units: KnowledgeUnit[];
}

export interface KnowledgeHealth {
  ok: boolean;
  backend: 'in-memory' | 'local' | 'remote' | 'none';
  portVersion: string;
  details?: string;
}

export interface KnowledgeSemanticSearchRequest {
  text: string;
  limit?: number;
  filter?: KnowledgeQueryFilter;
}

/**
 * Knowledge Port — EE-DOC-014 §04.3.2.
 * semanticSearch may remain NOT_IMPLEMENTED until Embedding ABI + store (P04).
 */
export interface KnowledgePort {
  health(): Promise<KnowledgeHealth | KnowledgeError>;
  index(request: KnowledgeIndexRequest): Promise<KnowledgeIndexResult | KnowledgeError>;
  query(filter: KnowledgeQueryFilter): Promise<KnowledgeQueryResult | KnowledgeError>;
  retrieve(id: string): Promise<KnowledgeUnit | KnowledgeError>;
  semanticSearch(
    request: KnowledgeSemanticSearchRequest,
  ): Promise<KnowledgeQueryResult | KnowledgeError>;
}
```

---

## 04. Implementación mínima (`@eq-labs/knowledge`)

| Ítem             | Valor                                                |
| :--------------- | :--------------------------------------------------- |
| Clase/factory    | `createInMemoryKnowledgePort()`                      |
| Backend          | **in-memory** Map                                    |
| `semanticSearch` | `{ code: "NOT_IMPLEMENTED", retryable: false, ... }` |
| Deps             | `"@eq-labs/foundation": "workspace:*"`               |

Export desde `packages/knowledge/src/index.ts`.

---

## 05. Composition root (`apps/cli`)

| Ítem     | Valor                                                   |
| :------- | :------------------------------------------------------ |
| Archivo  | `apps/cli/src/composition/knowledge-root.ts`            |
| Función  | `createKnowledgeRoot()` → `{ port, portVersion }`       |
| Deps cli | `@eq-labs/foundation`, `@eq-labs/knowledge` (workspace) |
| Alcance  | **Evidencia de wiring** — no CLI de producto knowledge  |

Opcional: re-export desde un índice de composition si existe.

---

## 06. Script PowerShell (copiar/pegar)

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

$utf8 = New-Object System.Text.UTF8Encoding $false
$root = (Resolve-Path .).Path
function Write-NoBom([string]$RelPath, [string]$Content) {
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($full, $Content.TrimStart() + "`n", $utf8)
  Write-Host "OK  $RelPath"
}

# --- Foundation contracts ---
Write-NoBom "packages\foundation\src\contracts\knowledge-version.ts" @'
/** Knowledge Port contract version (EE-DOC-014 / EE-IMP-014-P03). */
export const KNOWLEDGE_PORT_VERSION = "1.0.0" as const;
export type KnowledgePortVersion = typeof KNOWLEDGE_PORT_VERSION;
'@

Write-NoBom "packages\foundation\src\contracts\knowledge-error.ts" @'
export type KnowledgeErrorCode =
  | "UNAVAILABLE"
  | "NOT_FOUND"
  | "INVALID_REQUEST"
  | "INDEX_FAILED"
  | "QUERY_FAILED"
  | "NOT_IMPLEMENTED"
  | "TIMEOUT"
  | "INTERNAL";

export interface KnowledgeError {
  code: KnowledgeErrorCode;
  message: string;
  retryable: boolean;
  unitId?: string;
  cause?: unknown;
}

export function isKnowledgeError(value: unknown): value is KnowledgeError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "retryable" in value
  );
}
'@

Write-NoBom "packages\foundation\src\contracts\knowledge.ts" @'
import type { KnowledgeError } from "./knowledge-error.js";
import type { KnowledgePortVersion } from "./knowledge-version.js";
import { KNOWLEDGE_PORT_VERSION } from "./knowledge-version.js";

export interface KnowledgeUnitMeta {
  id: string;
  version?: string;
  source?: string;
  tags?: string[];
  updatedAt?: string;
}

export interface KnowledgeUnit {
  id: string;
  content: string;
  meta?: KnowledgeUnitMeta;
}

export interface KnowledgeIndexRequest {
  units: KnowledgeUnit[];
}

export interface KnowledgeIndexResult {
  accepted: number;
  rejected: number;
  errors?: KnowledgeError[];
}

export interface KnowledgeQueryFilter {
  ids?: string[];
  tags?: string[];
  source?: string;
  limit?: number;
}

export interface KnowledgeQueryResult {
  units: KnowledgeUnit[];
}

export interface KnowledgeHealth {
  ok: boolean;
  backend: "in-memory" | "local" | "remote" | "none";
  portVersion: KnowledgePortVersion | string;
  details?: string;
}

export interface KnowledgeSemanticSearchRequest {
  text: string;
  limit?: number;
  filter?: KnowledgeQueryFilter;
}

/**
 * Knowledge Port — EE-DOC-014 §04.3.2.
 * semanticSearch may return NOT_IMPLEMENTED until Embedding ABI + store (P04).
 */
export interface KnowledgePort {
  health(): Promise<KnowledgeHealth | KnowledgeError>;
  index(request: KnowledgeIndexRequest): Promise<KnowledgeIndexResult | KnowledgeError>;
  query(filter: KnowledgeQueryFilter): Promise<KnowledgeQueryResult | KnowledgeError>;
  retrieve(id: string): Promise<KnowledgeUnit | KnowledgeError>;
  semanticSearch(
    request: KnowledgeSemanticSearchRequest,
  ): Promise<KnowledgeQueryResult | KnowledgeError>;
}

export { KNOWLEDGE_PORT_VERSION };
'@

# Patch contracts/index.ts — append knowledge exports (read current first if custom)
$contractsIndex = Get-Content packages\foundation\src\contracts\index.ts -Raw
if ($contractsIndex -notmatch "knowledge") {
  $append = @'

export { KNOWLEDGE_PORT_VERSION } from "./knowledge-version.js";
export type { KnowledgePortVersion } from "./knowledge-version.js";

export type { KnowledgeErrorCode, KnowledgeError } from "./knowledge-error.js";
export { isKnowledgeError } from "./knowledge-error.js";

export type {
  KnowledgeUnitMeta,
  KnowledgeUnit,
  KnowledgeIndexRequest,
  KnowledgeIndexResult,
  KnowledgeQueryFilter,
  KnowledgeQueryResult,
  KnowledgeHealth,
  KnowledgeSemanticSearchRequest,
  KnowledgePort,
} from "./knowledge.js";
'@
  Write-NoBom "packages\foundation\src\contracts\index.ts" ($contractsIndex.TrimEnd() + "`n" + $append)
}

# --- knowledge implementation ---
# Ensure foundation dep
$kp = Get-Content packages\knowledge\package.json -Raw | ConvertFrom-Json
if (-not $kp.dependencies) { $kp | Add-Member -NotePropertyName dependencies -NotePropertyValue (@{}) -Force }
$deps = @{}; if ($kp.dependencies) { $kp.dependencies.PSObject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
$deps["@eq-labs/foundation"] = "workspace:*"
$kp.dependencies = $deps
# rewrite package.json preserving structure via Write-NoBom content
$pkgJson = @'
{
  "name": "@eq-labs/knowledge",
  "version": "0.1.0",
  "private": true,
  "description": "Knowledge layer of the EQ-LABS Engineering Ecosystem (EE-DOC-014).",
  "license": "Apache-2.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "clean": "node -e \"require('node:fs').rmSync('dist', { recursive: true, force: true })\"",
    "lint": "eslint ."
  },
  "dependencies": {
    "@eq-labs/foundation": "workspace:*"
  },
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "typescript": "5.9.2",
    "eslint": "9.35.0",
    "@eq-labs/config-eslint": "workspace:*"
  }
}
'@
Write-NoBom "packages\knowledge\package.json" $pkgJson

Write-NoBom "packages\knowledge\src\in-memory-port.ts" @'
import type {
  KnowledgeError,
  KnowledgeHealth,
  KnowledgeIndexRequest,
  KnowledgeIndexResult,
  KnowledgePort,
  KnowledgeQueryFilter,
  KnowledgeQueryResult,
  KnowledgeSemanticSearchRequest,
  KnowledgeUnit,
} from "@eq-labs/foundation";
import { KNOWLEDGE_PORT_VERSION } from "@eq-labs/foundation";

/**
 * In-memory KnowledgePort — evidence implementation (EE-IMP-014-P03).
 * Not a production store (No False Pass).
 */
export function createInMemoryKnowledgePort(): KnowledgePort {
  const store = new Map<string, KnowledgeUnit>();

  return {
    async health(): Promise<KnowledgeHealth> {
      return {
        ok: true,
        backend: "in-memory",
        portVersion: KNOWLEDGE_PORT_VERSION,
        details: `units=${store.size}`,
      };
    },

    async index(request: KnowledgeIndexRequest): Promise<KnowledgeIndexResult | KnowledgeError> {
      if (!request?.units || !Array.isArray(request.units)) {
        return {
          code: "INVALID_REQUEST",
          message: "index requires units[]",
          retryable: false,
        };
      }
      let accepted = 0;
      let rejected = 0;
      const errors: KnowledgeError[] = [];
      for (const unit of request.units) {
        if (!unit?.id || typeof unit.content !== "string") {
          rejected += 1;
          errors.push({
            code: "INVALID_REQUEST",
            message: "unit requires id and content",
            retryable: false,
            unitId: unit?.id,
          });
          continue;
        }
        store.set(unit.id, unit);
        accepted += 1;
      }
      return { accepted, rejected, errors: errors.length ? errors : undefined };
    },

    async query(filter: KnowledgeQueryFilter): Promise<KnowledgeQueryResult | KnowledgeError> {
      let units = [...store.values()];
      if (filter?.ids?.length) {
        const set = new Set(filter.ids);
        units = units.filter((u) => set.has(u.id));
      }
      if (filter?.tags?.length) {
        units = units.filter((u) =>
          filter.tags!.every((t) => u.meta?.tags?.includes(t)),
        );
      }
      if (filter?.source) {
        units = units.filter((u) => u.meta?.source === filter.source);
      }
      if (filter?.limit && filter.limit > 0) {
        units = units.slice(0, filter.limit);
      }
      return { units };
    },

    async retrieve(id: string): Promise<KnowledgeUnit | KnowledgeError> {
      const unit = store.get(id);
      if (!unit) {
        return {
          code: "NOT_FOUND",
          message: `unit not found: ${id}`,
          retryable: false,
          unitId: id,
        };
      }
      return unit;
    },

    async semanticSearch(
      _request: KnowledgeSemanticSearchRequest,
    ): Promise<KnowledgeQueryResult | KnowledgeError> {
      return {
        code: "NOT_IMPLEMENTED",
        message:
          "semanticSearch PENDING until Embedding ABI + store (EE-IMP-014-P04 / EE-DOC-014 §04.6)",
        retryable: false,
      };
    },
  };
}
'@

Write-NoBom "packages\knowledge\src\index.ts" @'
/**
 * @eq-labs/knowledge — Knowledge layer (EE-DOC-014).
 * Port types live in @eq-labs/foundation; this package implements the port.
 */
export { createInMemoryKnowledgePort } from "./in-memory-port.js";
'@

# --- cli composition ---
Write-NoBom "apps\cli\src\composition\knowledge-root.ts" @'
/**
 * Composition root evidence — Knowledge Port wiring
 * (EE-DOC-006 §13.5 / EE-DOC-014 / EE-IMP-014-P03).
 */
import type { KnowledgePort } from "@eq-labs/foundation";
import { KNOWLEDGE_PORT_VERSION } from "@eq-labs/foundation";
import { createInMemoryKnowledgePort } from "@eq-labs/knowledge";

export interface KnowledgeRoot {
  port: KnowledgePort;
  portVersion: string;
}

/** Builds a KnowledgePort instance for this runtime (in-memory evidence). */
export function createKnowledgeRoot(): KnowledgeRoot {
  return {
    port: createInMemoryKnowledgePort(),
    portVersion: KNOWLEDGE_PORT_VERSION,
  };
}
'@

# Add knowledge dep to cli package.json (manual check)
$cliPkgPath = "apps\cli\package.json"
$cli = Get-Content $cliPkgPath -Raw
if ($cli -notmatch '@eq-labs/knowledge') {
  $cliObj = $cli | ConvertFrom-Json
  if (-not $cliObj.dependencies) { $cliObj | Add-Member dependencies (@{}) }
  # Use pnpm instead for safe edit:
}
pnpm --filter @eq-labs/cli add @eq-labs/knowledge@workspace:* @eq-labs/foundation@workspace:*

pnpm install

# Gates (order: foundation → knowledge → cli)
pnpm --filter @eq-labs/foundation run build
pnpm --filter @eq-labs/foundation run typecheck
pnpm --filter @eq-labs/foundation run lint

pnpm --filter @eq-labs/knowledge run build
pnpm --filter @eq-labs/knowledge run typecheck
pnpm --filter @eq-labs/knowledge run lint

pnpm --filter @eq-labs/cli run build
pnpm --filter @eq-labs/cli run typecheck
pnpm --filter @eq-labs/cli run lint

# Deps guard
Select-String -Path packages\knowledge\package.json -Pattern "intelligence|connector-|execution|registry"

pnpm run format
pnpm run validate
# FAIL solo D-01 braces = OK

git add packages/foundation packages/knowledge apps/cli package.json pnpm-lock.yaml
git status --short
git commit -m "feat(knowledge): KnowledgePort ABI v1.0.0 and in-memory wiring (EE-IMP-014-P03)

- Foundation: KnowledgePort, KnowledgeError, KNOWLEDGE_PORT_VERSION
- knowledge: createInMemoryKnowledgePort; semanticSearch NOT_IMPLEMENTED
- apps/cli: createKnowledgeRoot composition evidence

Refs: EE-DOC-014, EE-IMP-014-P03, EE-DOC-006"
git push origin main
```

---

## 07. Notas de ejecución

1. Si `contracts/index.ts` ya tiene contenido, el script **añade** exports knowledge (no borra AI SPI).
2. Si `pnpm --filter @eq-labs/cli add` falla por versiones, editar a mano:

   ```json
   "dependencies": {
     "@eq-labs/foundation": "workspace:*",
     "@eq-labs/intelligence": "workspace:*",
     "@eq-labs/knowledge": "workspace:*"
   }
   ```

3. **No False Pass:** README knowledge debe seguir diciendo que no es store de producción.

---

## 08. Descubrimientos

| ID        | Tipo | Hallazgo                                     | Decisión         |
| :-------- | :--- | :------------------------------------------- | :--------------- |
| D-P03-001 | B    | `KNOWLEDGE_PORT_VERSION = 1.0.0`             | Adoptado         |
| D-P03-002 | B    | semanticSearch → `NOT_IMPLEMENTED` hasta P04 | Adoptado (014)   |
| D-01      | B    | braces                                       | WAIVED (vigente) |

---

## 09. Trazabilidad

| Elemento   | Referencia                                           |
| :--------- | :--------------------------------------------------- |
| Padre      | EE-DOC-014 §04.3 / §09.1 P03                         |
| Predecesor | EE-IMP-014-P02                                       |
| Siguiente  | EE-IMP-014-P04 — health/index/query + test hermético |
| Patrón     | EE-IMP-013-P03 SPI / EE-DOC-006 §13.5                |

---

## 10. Evidencia de cierre (2026-10-06)

| Control                             | Resultado                                      |
| :---------------------------------- | :--------------------------------------------- |
| foundation build / typecheck / lint | ✅                                             |
| knowledge build / typecheck / lint  | ✅                                             |
| cli build / typecheck / lint        | ✅                                             |
| deps knowledge sin prohibidas       | ✅                                             |
| validate                            | ⚠️ FAIL solo D-01 braces (+ moderate residual) |
| Commit                              | `6a0c415` on `main`                            |
| CI Validate                         | ❌ esperado (SEC-001 high = braces WAIVED)     |

### 10.1. Artefactos

| Path                                              | Rol                      |
| :------------------------------------------------ | :----------------------- |
| `packages/foundation/src/contracts/knowledge*.ts` | ABI v1.0.0               |
| `packages/knowledge/src/in-memory-port.ts`        | Implementación evidencia |
| `apps/cli/src/composition/knowledge-root.ts`      | Composition root         |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                 | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :-------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-06 | Equipo de Arquitectura | —                      | Apertura P03 | ABI; in-memory; cli root                | En Implementación |
| **v1.1.0** | 2026-10-06 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P03   | Gates OK; commit `6a0c415`; CI X = D-01 | **Completado**    |

---

## 12. Cierre de unidad

| Campo             | Valor                                                                                 |
| :---------------- | :------------------------------------------------------------------------------------ |
| **Estado**        | **Completado**                                                                        |
| **Siguiente**     | **EE-IMP-014-P04** — capability mínima + test hermético; semanticSearch sigue PENDING |
| **No False Pass** | Knowledge **no** declarado ACTIVE de producto                                         |

---

## FIN DEL DOCUMENTO
