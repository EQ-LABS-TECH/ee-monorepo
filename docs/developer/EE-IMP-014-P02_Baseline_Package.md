# EE-IMP-014-P02 — Baseline Package

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** (§18.3) y materializa la unidad **P02** de **EE-DOC-014 — Knowledge Management** (Aprobado).

---

## METADATOS

| Campo                 | Valor                                                          |
| :-------------------- | :------------------------------------------------------------- |
| **ID**                | EE-IMP-014-P02                                                 |
| **Documento**         | Baseline Package (`@eq-labs/knowledge`)                        |
| **Código corto**      | EE-IMP-014-P02                                                 |
| **Tipo**              | Documento Técnico de Implementación                            |
| **Clasificación**     | Implementación                                                 |
| **Nivel**             | Técnico                                                        |
| **Normativo**         | No                                                             |
| **Versión**           | v1.1.0                                                         |
| **Estado**            | Completado                                                     |
| **Propietario**       | Equipo de Arquitectura                                         |
| **Documento padre**   | EE-DOC-014 — Knowledge Management                              |
| **Dependencias**      | EE-DOC-006, EE-DOC-010, EE-DOC-014, EE-IMP-014-P01, EE-ADR-003 |
| **Aprobado por**      | Equipo de Arquitectura                                         |
| **Audiencia**         | Arquitectura, Desarrollo                                       |
| **Fecha de creación** | 2026-10-05                                                     |
| **Última revisión**   | 2026-10-05                                                     |
| **Unidad de fase**    | P02 de EE-DOC-014 §09.1                                        |

---

## 01. Objetivo

1. Exponer **API consumible en el workspace** (`main` / `types` / `exports` / `files`) alineada a `@eq-labs/foundation`.
2. Habilitar **emit** TypeScript (`declaration` + `dist/`).
3. Eliminar residual **`src/index.js`**.
4. Verificar gates **lint / typecheck / build** del package.
5. Confirmar **deps §04.5** (sin intelligence, connectors, execution, registry runtime).
6. Decidir y registrar **`private: true`** vs publicación npm (independiente de exports).
7. Confirmar **KS-06** si CODEOWNERS fino ya está en `main` (P01).

**No** implementa KnowledgePort (P03), Embedding ABI, stores ni acquisition pipeline.

---

## 02. Criterios de aceptación (EE-DOC-014)

| #      | Criterio                                                      | Resultado esperado       |
| :----- | :------------------------------------------------------------ | :----------------------- |
| **C1** | `exports` / `main` / `types` presentes                        | PASS                     |
| **C2** | `tsc` emite `dist/` + `.d.ts`                                 | PASS                     |
| **C3** | lint + typecheck + build package                              | PASS                     |
| **C4** | Sin deps runtime prohibidas                                   | PASS                     |
| **C5** | `private: true` (npm no publicado) **o** decisión documentada | PASS (decisión)          |
| **C6** | Residual `src/index.js` eliminado                             | PASS                     |
| **C7** | KS-06 paths en CODEOWNERS (post-P01)                          | PASS si ya materializado |

---

## 03. As-built (pre-P02) — resumen P01

| Ítem                         | Estado pre                       |
| :--------------------------- | :------------------------------- |
| `private`                    | `true`                           |
| `exports` / `main` / `types` | **Ausentes**                     |
| `tsconfig`                   | `noEmit: true`                   |
| `src/index.ts`               | `export {}`                      |
| `src/index.js`               | residual `export {}`             |
| Runtime deps                 | ninguna                          |
| CODEOWNERS knowledge         | materializado en P01 (`c476d61`) |

---

## 04. Decisiones de esta fase

| ID            | Tema              | Decisión                                                               |
| :------------ | :---------------- | :--------------------------------------------------------------------- |
| **D-P02-001** | Surface workspace | **Adoptar** patrón foundation: `main`/`types`/`exports`/`files`        |
| **D-P02-002** | npm publish       | **Mantener `private: true`** (no publicación externa en este ciclo)    |
| **D-P02-003** | Implementación    | Stub tipado mínimo (`export {}` + comentario de capa); Port en **P03** |
| **D-P02-004** | KS-06             | **PASS** si CODEOWNERS fino de P01 está en `main`                      |

Tipo: **B** (especialización técnica de package surface; no cambia arquitectura 014).

---

## 05. Contenido objetivo

### 05.1. `packages/knowledge/package.json`

```json
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
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "typescript": "5.9.2",
    "eslint": "9.35.0",
    "@eq-labs/config-eslint": "workspace:*"
  }
}
```

### 05.2. `packages/knowledge/tsconfig.json`

```json
{
  "extends": "@eq-labs/config-typescript/node",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"]
}
```

### 05.3. `packages/knowledge/src/index.ts`

```typescript
/**
 * @eq-labs/knowledge — Knowledge layer baseline (EE-DOC-014).
 * Surface for workspace consumption. KnowledgePort contracts land in P03 (Foundation).
 */
export {};
```

### 05.4. Eliminar

```text
packages/knowledge/src/index.js
```

### 05.5. README (mínimo)

Actualizar description para citar EE-DOC-014 y aclarar: package plano, private, Port en P03.

---

## 06. Script PowerShell (copiar/pegar)

````powershell
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

# 1. Residual
Remove-Item -Force packages\knowledge\src\index.js -ErrorAction SilentlyContinue

# 2. package.json
Write-NoBom "packages\knowledge\package.json" @'
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
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
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
'@

# 3. tsconfig
Write-NoBom "packages\knowledge\tsconfig.json" @'
{
  "extends": "@eq-labs/config-typescript/node",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": false,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*.ts"]
}
'@

# 4. index.ts
Write-NoBom "packages\knowledge\src\index.ts" @'
/**
 * @eq-labs/knowledge — Knowledge layer baseline (EE-DOC-014).
 * Surface for workspace consumption. KnowledgePort contracts land in P03 (Foundation).
 */
export {};
'@

# 5. README
Write-NoBom "packages\knowledge\README.md" @'
# @eq-labs/knowledge

Knowledge layer of the EQ-LABS Engineering Ecosystem (**EE-DOC-014**).

## Status

- **Form:** flat package (`packages/knowledge`) — not nested workspaces
- **Visibility:** `private: true` (workspace API via `exports`; no npm publish in this cycle)
- **Contracts:** `KnowledgePort` / embedding ABI → **EE-IMP-014-P03+** (Foundation)

## Scripts

```bash
pnpm --filter @eq-labs/knowledge run lint
pnpm --filter @eq-labs/knowledge run typecheck
pnpm --filter @eq-labs/knowledge run build
```

## References

- EE-DOC-014 — Knowledge Management
- EE-IMP-014-P02 — Baseline Package
'@

# 6. Gates
pnpm install
pnpm --filter @eq-labs/knowledge run lint
pnpm --filter @eq-labs/knowledge run typecheck
pnpm --filter @eq-labs/knowledge run build

# 7. KS-06 + deps check
Select-String -Path .github\CODEOWNERS -Pattern "knowledge"
Select-String -Path packages\knowledge\package.json -Pattern "intelligence|connector-|execution|registry"
Test-Path packages\knowledge\src\index.js
Test-Path packages\knowledge\dist\index.d.ts

# 8. Repo gates (FAIL solo D-01 braces = OK)
pnpm run format
pnpm run validate

# 9. Commit
git add packages/knowledge
git status --short
git commit -m "chore(knowledge): baseline package exports and emit (EE-IMP-014-P02)

- main/types/exports/files; declaration emit
- remove residual src/index.js
- private: true (workspace surface only)

Refs: EE-DOC-014, EE-IMP-014-P02, EE-IMP-014-P01"
git push origin main
````

---

## 07. Validaciones

| Comando                                          | Criterio                            |
| :----------------------------------------------- | :---------------------------------- |
| `pnpm --filter @eq-labs/knowledge run lint`      | exit 0                              |
| `pnpm --filter @eq-labs/knowledge run typecheck` | exit 0                              |
| `pnpm --filter @eq-labs/knowledge run build`     | `dist/index.js` + `dist/index.d.ts` |
| `Test-Path ...\src\index.js`                     | **False**                           |
| deps prohibidas                                  | **sin matches**                     |
| CODEOWNERS `knowledge`                           | presente (P01)                      |
| `pnpm run validate`                              | FAIL **solo** D-01 braces = OK      |

---

## 08. Descubrimientos

| ID            | Tipo | Hallazgo          | Decisión                              |
| :------------ | :--- | :---------------- | :------------------------------------ |
| D-P02-001…004 | B    | Surface + private | §04                                   |
| D-01          | B    | braces/plop       | **WAIVED** hasta 2026-10-12 (P01/P05) |

---

## 09. Trazabilidad

| Elemento       | Referencia                                            |
| :------------- | :---------------------------------------------------- |
| Padre          | EE-DOC-014 §04.3 / §09.1 P02                          |
| Predecesor     | EE-IMP-014-P01                                        |
| Siguiente      | EE-IMP-014-P03 — KnowledgePort + contracts Foundation |
| Patrón package | EE-IMP-013-P02 / foundation                           |

---

## 10. Evidencia de cierre (2026-10-06)

| Comando / control                             | Resultado                                                          |
| :-------------------------------------------- | :----------------------------------------------------------------- |
| lint / typecheck / build `@eq-labs/knowledge` | ✅                                                                 |
| `dist/index.d.ts`                             | ✅                                                                 |
| sin `src/index.js`                            | ✅                                                                 |
| CODEOWNERS knowledge (KS-06)                  | ✅                                                                 |
| sin deps prohibidas                           | ✅                                                                 |
| override `source-map-js@>=1.2.2`              | ✅                                                                 |
| `pnpm run validate`                           | ⚠️ FAIL solo **D-01** braces (high) + moderate sprintf-js residual |
| Commit                                        | `774cdd8` on `main`                                                |
| CI Validate                                   | ❌ esperado (SEC-001 high = braces; D-01 WAIVED hasta 2026-10-12)  |

### 10.1. Descubrimientos

| ID            | Tipo | Hallazgo                                    | Decisión                     |
| :------------ | :--- | :------------------------------------------ | :--------------------------- |
| D-P02-001…004 | B    | Surface + private                           | Adoptados                    |
| D-01          | B    | braces/plop                                 | **WAIVED** hasta 2026-10-12  |
| D-02          | B    | sprintf-js moderate, sin patch (jest stack) | Residual; no bloquea SEC-001 |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                              | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :------------------------------------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-05 | Equipo de Arquitectura | —                      | Apertura P02 | Baseline exports/emit; private; script operador; criterios           | En Implementación |
| **v1.1.0** | 2026-10-06 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P02   | Evidencia gates; source-map-js override; commit 774cdd8; CI X = D-01 | **Completado**    |

---

## 12. Cierre de unidad

| Campo                        | Valor                                                        |
| :--------------------------- | :----------------------------------------------------------- |
| **Estado**                   | **Completado**                                               |
| **Siguiente**                | **EE-IMP-014-P03** — KnowledgePort + contracts en Foundation |
| **Desviación de EE-DOC-014** | Ninguna                                                      |

---

## FIN DEL DOCUMENTO
