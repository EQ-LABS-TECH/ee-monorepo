# EE-IMP-014-P04 — Minimum Capability

Este documento sigue el estándar **EE-DOC-002 §18.3** y materializa la unidad **P04** de **EE-DOC-014 — Knowledge Management**.

---

## METADATOS

| Campo                 | Valor                                              |
| :-------------------- | :------------------------------------------------- |
| **ID**                | EE-IMP-014-P04                                     |
| **Documento**         | Minimum Capability (Knowledge)                     |
| **Código corto**      | EE-IMP-014-P04                                     |
| **Tipo**              | Documento Técnico de Implementación                |
| **Clasificación**     | Implementación                                     |
| **Nivel**             | Técnico                                            |
| **Normativo**         | No                                                 |
| **Versión**           | v1.1.0                                             |
| **Estado**            | Completado                                         |
| **Propietario**       | Equipo de Arquitectura                             |
| **Documento padre**   | EE-DOC-014 — Knowledge Management                  |
| **Dependencias**      | EE-DOC-014, EE-ADR-002, EE-DOC-010, EE-IMP-014-P03 |
| **Aprobado por**      | Equipo de Arquitectura                             |
| **Audiencia**         | Arquitectura, Desarrollo                           |
| **Fecha de creación** | 2026-10-06                                         |
| **Última revisión**   | 2026-10-06                                         |
| **Unidad de fase**    | P04 de EE-DOC-014 §09.1                            |

---

## 01. Objetivo

1. Demostrar **capability mínima** del port: **health**, **index**, **query**, **retrieve** sobre backend **in-memory** (sin vendor).
2. Verificar **KN-10**: backend/port ausente o no disponible → **`KnowledgeError` explícito** (sin “conocimiento inventado”).
3. Introducir **suite Vitest hermética** en `@eq-labs/knowledge` (PASS de fase medible).
4. Mantener **semanticSearch PENDING** (`NOT_IMPLEMENTED`).
5. **No** declarar Knowledge ACTIVE de producto (No False Pass).

---

## 02. Criterios de aceptación (EE-DOC-014 §09.3)

| #      | Criterio                                           | Esperado |
| :----- | :------------------------------------------------- | :------- |
| **C1** | Test: index + retrieve (o query) OK                | PASS     |
| **C2** | Test: health OK (in-memory)                        | PASS     |
| **C3** | Test: backend ausente → `KnowledgeError` (KN-10)   | PASS     |
| **C4** | semanticSearch → `NOT_IMPLEMENTED`                 | PASS     |
| **C5** | `pnpm --filter @eq-labs/knowledge run test` exit 0 | PASS     |
| **C6** | Sin stores externos / secretos en tests            | PASS     |
| **C7** | Tipo B QG-TEST-001 documentado (salida de SKIPPED) | PASS     |

---

## 03. Decisiones

| ID            | Tema                 | Decisión                                                                                             |
| :------------ | :------------------- | :--------------------------------------------------------------------------------------------------- |
| **D-P04-001** | Backend primer ciclo | **In-memory** (P03); sin vendor                                                                      |
| **D-P04-002** | KN-10                | Factory `createUnavailableKnowledgePort()` + tests                                                   |
| **D-P04-003** | Vitest               | Añadir a knowledge; config vía `@eq-labs/config-vitest` / vitest directo                             |
| **D-P04-004** | QG-TEST-001          | **Tipo B**: suite package puede sacar turbo test de SKIPPED (0 tasks) cuando knowledge define `test` |
| **D-P04-005** | semanticSearch       | Sigue **PENDING** de producto                                                                        |

---

## 04. Extensión de implementación

### 04.1. `createUnavailableKnowledgePort()` (KN-10)

Todas las operaciones devuelven:

```typescript
{
  code: "UNAVAILABLE",
  message: "Knowledge port is not available",
  retryable: false,
}
```

`health()` → `{ ok: false, backend: "none", portVersion, details: "unavailable" }` **o** `KnowledgeError` — **preferencia**: health explícito `ok: false` + ops con `UNAVAILABLE` para que el caller distinga “degradado” vs “error de índice”.

**Decisión P04:**

- `health()` → `KnowledgeHealth` con `ok: false`, `backend: "none"`.
- `index` / `query` / `retrieve` / `semanticSearch` → `KnowledgeError` `UNAVAILABLE`.

### 04.2. Tests (`src/in-memory-port.test.ts`)

| Caso                 | Assert                                   |
| :------------------- | :--------------------------------------- |
| health in-memory     | `ok === true`, `backend === "in-memory"` |
| index + retrieve     | unit round-trip                          |
| query por id         | filtra                                   |
| retrieve missing     | `NOT_FOUND`                              |
| semanticSearch       | `NOT_IMPLEMENTED`                        |
| unavailable health   | `ok === false`                           |
| unavailable retrieve | `UNAVAILABLE` + `isKnowledgeError`       |

### 04.3. `package.json` scripts

```json
"test": "vitest run"
```

`devDependencies`: `vitest` (versión exacta alineada al monorepo si existe en lockfile; si no, pin reciente estable p.ej. `3.2.4` o la que use `config-vitest`).

---

## 05. Script PowerShell (copiar/pegar)

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

# --- unavailable factory ---
Write-NoBom "packages\knowledge\src\unavailable-port.ts" @'
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

const unavailable = (): KnowledgeError => ({
  code: "UNAVAILABLE",
  message: "Knowledge port is not available",
  retryable: false,
});

/**
 * KN-10 — explicit unavailability (EE-DOC-014). No invented knowledge.
 */
export function createUnavailableKnowledgePort(): KnowledgePort {
  return {
    async health(): Promise<KnowledgeHealth> {
      return {
        ok: false,
        backend: "none",
        portVersion: KNOWLEDGE_PORT_VERSION,
        details: "unavailable",
      };
    },
    async index(_request: KnowledgeIndexRequest): Promise<KnowledgeError> {
      return unavailable();
    },
    async query(_filter: KnowledgeQueryFilter): Promise<KnowledgeError> {
      return unavailable();
    },
    async retrieve(_id: string): Promise<KnowledgeError> {
      return unavailable();
    },
    async semanticSearch(
      _request: KnowledgeSemanticSearchRequest,
    ): Promise<KnowledgeError> {
      return unavailable();
    },
  };
}
'@

# --- tests ---
Write-NoBom "packages\knowledge\src\in-memory-port.test.ts" @'
import { describe, expect, it } from "vitest";
import { isKnowledgeError, KNOWLEDGE_PORT_VERSION } from "@eq-labs/foundation";
import { createInMemoryKnowledgePort } from "./in-memory-port.js";
import { createUnavailableKnowledgePort } from "./unavailable-port.js";

describe("createInMemoryKnowledgePort", () => {
  it("reports healthy in-memory backend", async () => {
    const port = createInMemoryKnowledgePort();
    const health = await port.health();
    expect(isKnowledgeError(health)).toBe(false);
    if (isKnowledgeError(health)) return;
    expect(health.ok).toBe(true);
    expect(health.backend).toBe("in-memory");
    expect(health.portVersion).toBe(KNOWLEDGE_PORT_VERSION);
  });

  it("indexes and retrieves a unit", async () => {
    const port = createInMemoryKnowledgePort();
    const indexed = await port.index({
      units: [{ id: "u1", content: "hello knowledge", meta: { id: "u1", tags: ["t1"] } }],
    });
    expect(isKnowledgeError(indexed)).toBe(false);
    if (isKnowledgeError(indexed)) return;
    expect(indexed.accepted).toBe(1);

    const unit = await port.retrieve("u1");
    expect(isKnowledgeError(unit)).toBe(false);
    if (isKnowledgeError(unit)) return;
    expect(unit.content).toBe("hello knowledge");
  });

  it("queries by id filter", async () => {
    const port = createInMemoryKnowledgePort();
    await port.index({
      units: [
        { id: "a", content: "A" },
        { id: "b", content: "B" },
      ],
    });
    const result = await port.query({ ids: ["b"] });
    expect(isKnowledgeError(result)).toBe(false);
    if (isKnowledgeError(result)) return;
    expect(result.units).toHaveLength(1);
    expect(result.units[0]?.id).toBe("b");
  });

  it("returns NOT_FOUND for missing id", async () => {
    const port = createInMemoryKnowledgePort();
    const unit = await port.retrieve("missing");
    expect(isKnowledgeError(unit)).toBe(true);
    if (!isKnowledgeError(unit)) return;
    expect(unit.code).toBe("NOT_FOUND");
  });

  it("returns NOT_IMPLEMENTED for semanticSearch", async () => {
    const port = createInMemoryKnowledgePort();
    const result = await port.semanticSearch({ text: "q" });
    expect(isKnowledgeError(result)).toBe(true);
    if (!isKnowledgeError(result)) return;
    expect(result.code).toBe("NOT_IMPLEMENTED");
  });
});

describe("createUnavailableKnowledgePort (KN-10)", () => {
  it("reports unhealthy health", async () => {
    const port = createUnavailableKnowledgePort();
    const health = await port.health();
    expect(isKnowledgeError(health)).toBe(false);
    if (isKnowledgeError(health)) return;
    expect(health.ok).toBe(false);
    expect(health.backend).toBe("none");
  });

  it("returns UNAVAILABLE on retrieve", async () => {
    const port = createUnavailableKnowledgePort();
    const unit = await port.retrieve("any");
    expect(isKnowledgeError(unit)).toBe(true);
    if (!isKnowledgeError(unit)) return;
    expect(unit.code).toBe("UNAVAILABLE");
  });
});
'@

# --- index exports ---
Write-NoBom "packages\knowledge\src\index.ts" @'
/**
 * @eq-labs/knowledge — Knowledge layer (EE-DOC-014).
 * Port types live in @eq-labs/foundation; this package implements the port.
 * Not a production store (No False Pass) until product backends are ACTIVE.
 */
export { createInMemoryKnowledgePort } from "./in-memory-port.js";
export { createUnavailableKnowledgePort } from "./unavailable-port.js";
'@

# --- vitest config (minimal) ---
Write-NoBom "packages\knowledge\vitest.config.ts" @'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
'@

# --- package.json: add test script + vitest ---
# Prefer exact version from monorepo; fallback pin
pnpm --filter @eq-labs/knowledge add -D vitest@3.2.4

# Ensure test script exists — rewrite package.json carefully
$pkg = Get-Content packages\knowledge\package.json -Raw | ConvertFrom-Json
# Use node to patch scripts if needed after pnpm add
node -e @"
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('packages/knowledge/package.json','utf8'));
p.scripts = p.scripts || {};
p.scripts.test = 'vitest run';
fs.writeFileSync('packages/knowledge/package.json', JSON.stringify(p, null, 2) + '\n');
console.log('test script OK');
"@

pnpm install

# Gates
pnpm --filter @eq-labs/knowledge run build
pnpm --filter @eq-labs/knowledge run typecheck
pnpm --filter @eq-labs/knowledge run lint
pnpm --filter @eq-labs/knowledge run test

# Optional: root test may now execute knowledge tasks
pnpm run test

pnpm run format
pnpm run validate
# FAIL solo D-01 braces = OK

git add packages/knowledge
git status --short
git commit -m "test(knowledge): hermetic Vitest suite and KN-10 unavailable port (EE-IMP-014-P04)

- in-memory health/index/query/retrieve coverage
- createUnavailableKnowledgePort (KN-10)
- semanticSearch remains NOT_IMPLEMENTED
- Tipo B: package test script for QG-TEST-001

Refs: EE-DOC-014, EE-IMP-014-P04, EE-ADR-002"
git push origin main
```

---

## 06. Notas

1. Si `vitest@3.2.4` no resuelve, usar la versión ya presente en el lockfile (`pnpm why vitest` / `config-vitest`).
2. Excluir `*.test.ts` del emit de `tsc` si hace falta: en `tsconfig.json`  
   `"exclude": ["src/**/*.test.ts"]`  
   o `include` solo fuentes no test — si build falla por vitest types.
3. **No False Pass:** tests no equivalen a Knowledge de producto ACTIVE.

---

## 07. Descubrimientos

| ID            | Tipo | Hallazgo | Decisión            |
| :------------ | :--- | :------- | :------------------ |
| D-P04-001…005 | B    | §03      | Adoptados           |
| D-01          | B    | braces   | WAIVED (si vigente) |

---

## 08. Trazabilidad

| Elemento   | Referencia                              |
| :--------- | :-------------------------------------- |
| Padre      | EE-DOC-014 §09.1 P04 / §09.3 / KN-10    |
| Predecesor | EE-IMP-014-P03                          |
| Siguiente  | EE-IMP-014-P05 — Security / data / sync |
| Testing    | EE-ADR-002; EE-DOC-010 QG-TEST-001      |

---

## 09. Evidencia de cierre (2026-10-06)

| Control                         | Resultado                                |
| :------------------------------ | :--------------------------------------- |
| lint knowledge                  | ✅                                       |
| 7 tests herméticos Vitest       | ✅                                       |
| QG-TEST-001 (root)              | ✅ PASS                                  |
| vitest 4.1.11 + tinypool ≥2.1.2 | ✅ (0 critical)                          |
| audit residual                  | braces high (D-01) + sprintf-js moderate |
| Commit                          | `517fba2` on `main`                      |
| CI Validate                     | ❌ esperado (SEC-001 = braces WAIVED)    |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                        | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :------------------------------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-06 | Equipo de Arquitectura | —                      | Apertura P04 | Vitest; KN-10; script                                          | En Implementación |
| **v1.1.0** | 2026-10-06 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P04   | Tests PASS; vitest 4.1.11; tinypool override; commit `517fba2` | **Completado**    |

---

## 11. Cierre de unidad

| Campo             | Valor                                                                     |
| :---------------- | :------------------------------------------------------------------------ |
| **Estado**        | **Completado**                                                            |
| **Siguiente**     | **EE-IMP-014-P05** — Security / data / sync (KS-\*, gitignore, retención) |
| **No False Pass** | Knowledge **no** ACTIVE de producto                                       |

---

## FIN DEL DOCUMENTO
