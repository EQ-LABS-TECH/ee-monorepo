# EE-IMP-012-P04 — Code Templates

Evidencia técnica de **P04** (T-PKG / T-APP / T-CON) de **EE-DOC-012 — Templates**.

---

## METADATOS

| Campo                      | Valor                                                         |
| :------------------------- | :------------------------------------------------------------ |
| **ID**                     | EE-IMP-012-P04                                                |
| **Documento**              | Code Templates                                                |
| **Código corto**           | EE-IMP-012-P04                                                |
| **Fase de implementación** | P04 — Code Templates (T-PKG, T-APP, T-CON)                    |
| **Tipo**                   | Documento Técnico de Implementación                           |
| **Clasificación**          | Implementación                                                |
| **Nivel**                  | Técnico                                                       |
| **Normativo**              | No                                                            |
| **Versión**                | v1.1.0                                                        |
| **Estado**                 | Completado                                                    |
| **Propietario**            | Equipo de Arquitectura                                        |
| **Documento padre**        | EE-DOC-012 — Templates (v0.5.0)                               |
| **Dependencias**           | EE-IMP-012-P03 Completado, EE-DOC-006, EE-ADR-002, EE-ADR-003 |
| **Aprobado por**           | Equipo de Arquitectura                                        |
| **Audiencia**              | Arquitectura, Desarrollo                                      |
| **Fecha de creación**      | 2026-10-01                                                    |
| **Última revisión**        | 2026-10-01                                                    |
| **Próxima revisión**       | — (fase Completada)                                           |

---

## 01. Objetivo

Materializar templates de código bajo `templates/package/`, `templates/app/` y `templates/connector/` conforme a **EE-DOC-012 §10–§12**.

| id                        | Categoría | Norma | Destino canónico                                                |
| :------------------------ | :-------- | :---- | :-------------------------------------------------------------- |
| `package-typescript-node` | T-PKG     | §10   | `packages/` (guard §13.1: sin materializar bajo capa hasta RFC) |
| `app-node`                | T-APP     | §11   | `apps/`                                                         |
| `connector-typescript`    | T-CON     | §12   | `connectors/official/`                                          |

**Perfiles adoptados (A-02):** un perfil mínimo por categoría (Node/TypeScript). `react-vite` y otros perfiles → backlog / fase posterior.

**Idioma:** código, `package.json`, README técnicos → **en-US** (EE-DOC-012 §08).

**No incluye:** plopfile / `pnpm run generate` (P05); generación real hacia monorepo (P05); T-WF/T-EXT/T-CFG.

---

## 02. Layout a materializar

```text
templates/
├── package/
│   └── package-typescript-node/
│       ├── template.json
│       ├── README.md
│       └── files/
│           ├── package.json.hbs
│           ├── tsconfig.json.hbs
│           ├── eslint.config.mjs.hbs
│           ├── src/index.ts.hbs
│           └── README.md.hbs
├── app/
│   └── app-node/
│       ├── template.json
│       ├── README.md
│       └── files/
│           ├── package.json.hbs
│           ├── tsconfig.json.hbs
│           ├── eslint.config.mjs.hbs
│           ├── src/index.ts.hbs
│           └── README.md.hbs
└── connector/
    └── connector-typescript/
        ├── template.json
        ├── README.md
        └── files/
            ├── package.json.hbs
            ├── tsconfig.json.hbs
            ├── eslint.config.mjs.hbs
            ├── src/index.ts.hbs
            └── README.md.hbs
```

Eliminar `.gitkeep` de `package/`, `app/`, `connector/` cuando existan templates.

**JSON:** UTF-8 **sin BOM** (`[System.IO.File]::WriteAllText` + `UTF8Encoding($false)`).

---

## 03. `template.json` canónicos

### 03.1. T-PKG — `templates/package/package-typescript-node/template.json`

```json
{
  "schemaVersion": "1",
  "id": "package-typescript-node",
  "name": "TypeScript Node package",
  "category": "T-PKG",
  "version": "0.1.0",
  "description": "Skeleton Node.js TypeScript workspace package (EE-DOC-012 §10).",
  "target": "packages/",
  "owner": "architecture",
  "locale": "en",
  "allowedTargets": ["packages/"],
  "inputs": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Package short name (kebab-case); becomes @eq-labs/<name>."
    }
  ],
  "outputs": ["package.json", "tsconfig.json", "eslint.config.mjs", "src/index.ts", "README.md"],
  "preconditions": [
    "name must not collide with existing workspace package",
    "generation under packages/<layer>/ requires EE-DOC-006 nested patterns (EE-DOC-012 §13.1 deferred)"
  ]
}
```

### 03.2. T-APP — `templates/app/app-node/template.json`

```json
{
  "schemaVersion": "1",
  "id": "app-node",
  "name": "Node TypeScript application",
  "category": "T-APP",
  "version": "0.1.0",
  "description": "Minimal Node.js TypeScript app under apps/ (EE-DOC-012 §11).",
  "target": "apps/",
  "owner": "architecture",
  "locale": "en",
  "allowedTargets": ["apps/"],
  "inputs": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "App directory name; package @eq-labs/<name>."
    }
  ],
  "outputs": ["package.json", "tsconfig.json", "eslint.config.mjs", "src/index.ts", "README.md"],
  "preconditions": ["destination under apps/", "name must not collide with existing app"]
}
```

### 03.3. T-CON — `templates/connector/connector-typescript/template.json`

```json
{
  "schemaVersion": "1",
  "id": "connector-typescript",
  "name": "Official TypeScript connector",
  "category": "T-CON",
  "version": "0.1.0",
  "description": "Official connector skeleton under connectors/official/ (EE-DOC-012 §12).",
  "target": "connectors/official/",
  "owner": "architecture",
  "locale": "en",
  "allowedTargets": ["connectors/official/"],
  "inputs": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "Connector short name; package @eq-labs/connector-<name>."
    }
  ],
  "outputs": ["package.json", "tsconfig.json", "eslint.config.mjs", "src/index.ts", "README.md"],
  "preconditions": [
    "destination under connectors/official/ only (C-01, C-05)",
    "no secrets or IaC manifests (C-03, C-04)"
  ]
}
```

---

## 04. Cuerpos `.hbs` (baseline compartido)

Placeholders Handlebars: `{{name}}`. Reglas **P-02…P-06**, **A-03**, **C-06**.

### 04.1. `package.json.hbs` — T-PKG

```handlebars
{
  "name": "@eq-labs/{{name}}",
  "version": "0.1.0",
  "private": true,
  "description": "{{name}} package for the EQ-LABS Engineering Ecosystem.",
  "license": "Apache-2.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint ."
  },
  "engines": {
    "node": ">=24 <25"
  },
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "@eq-labs/config-eslint": "workspace:*",
    "typescript": "5.9.2",
    "eslint": "9.35.0"
  }
}
```

### 04.2. `package.json.hbs` — T-APP

```handlebars
{
  "name": "@eq-labs/{{name}}",
  "version": "0.1.0",
  "private": true,
  "description": "{{name}} application for the EQ-LABS Engineering Ecosystem.",
  "license": "Apache-2.0",
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node dist/index.js",
    "lint": "eslint ."
  },
  "engines": {
    "node": ">=24 <25"
  },
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "@eq-labs/config-eslint": "workspace:*",
    "@types/node": "24.0.0",
    "typescript": "5.9.2",
    "eslint": "9.35.0"
  }
}
```

### 04.3. `package.json.hbs` — T-CON

```handlebars
{
  "name": "@eq-labs/connector-{{name}}",
  "version": "0.1.0",
  "private": true,
  "description": "Official {{name}} connector for the EQ-LABS Engineering Ecosystem.",
  "license": "Apache-2.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint ."
  },
  "engines": {
    "node": ">=24 <25"
  },
  "devDependencies": {
    "@eq-labs/config-typescript": "workspace:*",
    "@eq-labs/config-eslint": "workspace:*",
    "typescript": "5.9.2",
    "eslint": "9.35.0"
  }
}
```

### 04.4. Comunes (las tres categorías)

**`tsconfig.json.hbs`:**

```handlebars
{ "extends": "@eq-labs/config-typescript/node.json", "compilerOptions": { "outDir": "dist",
"rootDir": "src" }, "include": ["src/**/*"] }
```

> Ajustar path `extends` al artefacto real de `@eq-labs/config-typescript` en el monorepo (p. ej. `node` / `tsconfig.node.json`).

**`eslint.config.mjs.hbs`:**

```handlebars
import base from "@eq-labs/config-eslint/typescript"; export default [...base];
```

> Ajustar import al export real de `@eq-labs/config-eslint`.

**`src/index.ts.hbs` (T-PKG / T-APP):**

```handlebars
/** * @eq-labs/{{name}}
* Scaffold generated from EE templates (EE-DOC-012). */ export function main(): void { // TODO:
implement } main();
```

**`src/index.ts.hbs` (T-CON):**

```handlebars
/** * @eq-labs/connector-{{name}}
* Official connector boundary (EE-DOC-012 §12). No secrets; no platform IaC. */ export interface
ConnectorContext { // Integration boundary types } export function createConnector(_ctx:
ConnectorContext = {}): void { // TODO: implement adapter }
```

**`README.md.hbs` (T-PKG):**

```handlebars
# @eq-labs/{{name}}

TypeScript package scaffold (**EE-DOC-012** T-PKG). ## Scripts - `pnpm --filter @eq-labs/{{name}}
run build` - `pnpm --filter @eq-labs/{{name}}
run typecheck` - `pnpm --filter @eq-labs/{{name}}
run lint` ## References - EE-DOC-012 §10 - EE-IMP-012-P04
```

**`README.md.hbs` (T-APP):** similar; name `@eq-labs/{{name}}`; destino `apps/{{name}}`.

**`README.md.hbs` (T-CON):**

```handlebars
# @eq-labs/connector-{{name}}

Official connector scaffold (**EE-DOC-012** T-CON). Trust boundary only; no secrets; no platform IaC
(C-03, C-04). ## Scripts - `pnpm --filter @eq-labs/connector-{{name}}
run build` - `pnpm --filter @eq-labs/connector-{{name}}
run typecheck` - `pnpm --filter @eq-labs/connector-{{name}}
run lint` ## References - EE-DOC-012 §12 - EE-IMP-012-P04
```

---

## 05. README por template

### 05.1. `package-typescript-node/README.md`

```markdown
# Template: package-typescript-node (T-PKG)

Baseline TypeScript Node package (**EE-DOC-012 §10**).

| Item            | Value               |
| --------------- | ------------------- |
| Category        | T-PKG               |
| Package name    | `@eq-labs/{{name}}` |
| Allowed targets | `packages/`         |
| Language        | en-US               |

## Rules

P-01…P-10. No `test` script without real Vitest tests (P-04). Exact versions only (P-02).

## Note (§13.1)

Operational generation under nested `packages/<layer>/` remains deferred until an additive RFC on EE-DOC-006. This template is validated statically as the composition base for T-APP/T-CON.
```

### 05.2. `app-node/README.md`

```markdown
# Template: app-node (T-APP)

Minimal Node TypeScript application (**EE-DOC-012 §11**).

| Item        | Value           |
| ----------- | --------------- |
| Category    | T-APP           |
| Destination | `apps/{{name}}` |
| Profile     | node (A-02)     |

No core reusable business logic in apps (A-04).
```

### 05.3. `connector-typescript/README.md`

```markdown
# Template: connector-typescript (T-CON)

Official connector under `connectors/official/` (**EE-DOC-012 §12**).

| Item         | Value                          |
| ------------ | ------------------------------ |
| Category     | T-CON                          |
| Package name | `@eq-labs/connector-{{name}}`  |
| Destination  | `connectors/official/{{name}}` |

C-01…C-06. Community/experimental not workspace targets until executable code exists (C-05).
```

---

## 06. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# Directorios
@(
  "templates\package\package-typescript-node\files\src",
  "templates\app\app-node\files\src",
  "templates\connector\connector-typescript\files\src"
) | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

Remove-Item -Force templates\package\.gitkeep, templates\app\.gitkeep, templates\connector\.gitkeep -ErrorAction SilentlyContinue

# Escribir template.json (UTF-8 sin BOM), README.md y files/*.hbs según §03–§05

# Verificar ids
Get-ChildItem -Path templates -Recurse -Filter template.json | ForEach-Object {
  $j = Get-Content $_.FullName -Raw | ConvertFrom-Json
  [PSCustomObject]@{ Path = $_.FullName; Id = $j.id; Cat = $j.category }
} | Format-Table -AutoSize

pnpm run format
pnpm run validate
```

**Esperado:** PASS con ids únicos:  
`ee-doc`, `ee-adr`, `ee-imp`, `ee-tec`, `ee-rfc`, `package-typescript-node`, `app-node`, `connector-typescript`.

```powershell
git add templates/package templates/app templates/connector
git commit -m "feat(templates): add T-PKG/T-APP/T-CON code scaffolds (EE-IMP-012-P04)

- package-typescript-node, app-node, connector-typescript
- exact versions; workspace:* for config packages
- EE-DOC-012 §10–§12 (P-*, A-*, C-*)

Refs: EE-DOC-012, EE-IMP-012-P04, EE-ADR-003"
git push origin main
```

---

## 07. Criterios de aceptación

| #   | Criterio                                                       | Estado |
| :-- | :------------------------------------------------------------- | :----- |
| 1   | 3 templates código con `template.json` válido                  | ✅     |
| 2   | category T-PKG / T-APP / T-CON alineada al directorio          | ✅     |
| 3   | ids únicos globales (no colisión con T-DOC)                    | ✅     |
| 4   | `allowedTargets` correctos                                     | ✅     |
| 5   | package.json.hbs: scripts build/typecheck/lint; sin test vacío | ✅     |
| 6   | versiones exactas + `workspace:*` en config                    | ✅     |
| 7   | engines.node `>=24 <25` si se declara                          | ✅     |
| 8   | T-CON: `@eq-labs/connector-{{name}}`                           | ✅     |
| 9   | README por template                                            | ✅     |
| 10  | `pnpm run validate` PASS                                       | ✅     |

---

## 08. Descubrimientos

| ID        | Descripción                                             | Resultado                                                                                                      |
| :-------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| D-P04-001 | Perfil único node por categoría (sin react-vite en P04) | **Adoptado** — A-02 especialización                                                                            |
| D-P04-002 | Path exacto de `extends` / eslint                       | **Adoptado** — `@eq-labs/config-typescript/node`; `import typescript from "@eq-labs/config-eslint/typescript"` |

---

## 09. Trazabilidad

| Norma              | Evidencia                                          |
| :----------------- | :------------------------------------------------- |
| EE-DOC-012 §10–§12 | Este IMP                                           |
| EE-DOC-012 §13.1   | Preconditions T-PKG; sin generar packages anidados |
| EE-ADR-002         | Sin test placeholder                               |
| EE-ADR-003         | engines Node 24                                    |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Motivo                                                                  | Estado         |
| :--------- | :--------- | :--------------------- | :---------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-01 | Equipo de Arquitectura | Apertura P04 tras cierre P03                                            | Borrador       |
| **v1.1.0** | 2026-10-01 | Equipo de Arquitectura | Cierre: 3 code templates en main (`6ec3e7c`), 8 ids, validate + CI PASS | **Completado** |

---

## FIN DEL DOCUMENTO
