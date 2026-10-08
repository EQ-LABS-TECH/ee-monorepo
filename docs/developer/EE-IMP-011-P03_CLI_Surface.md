# EE-IMP-011-P03 — CLI Surface

Este documento registra la evidencia técnica de implementación de la fase **P03** de **EE-DOC-011 — Automation**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                                  |
| :------------------------- | :--------------------------------------------------------------------- |
| **ID**                     | EE-IMP-011-P03                                                         |
| **Documento**              | CLI Surface                                                            |
| **Código corto**           | EE-IMP-011-P03                                                         |
| **Fase**                   | Fase 3 — Core Components                                               |
| **Fase de implementación** | P03 — CLI Surface (Implementación de EE-DOC-011)                       |
| **Tipo**                   | Documento Técnico de Implementación                                    |
| **Clasificación**          | Implementación                                                         |
| **Nivel**                  | Técnico                                                                |
| **Normativo**              | No                                                                     |
| **Versión**                | v1.1.0                                                                 |
| **Estado**                 | Completado                                                             |
| **Propietario**            | Equipo de Arquitectura                                                 |
| **Documento padre**        | EE-DOC-011 — Automation (v1.0.0 Aprobado)                              |
| **Dependencias**           | EE-DOC-006, EE-DOC-011 §06, EE-IMP-011-P01, EE-IMP-011-P02, EE-ADR-003 |
| **Aprobado por**           | Equipo de Arquitectura                                                 |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                                       |
| **Fecha de creación**      | 2026-09-30                                                             |
| **Última revisión**        | 2026-09-30                                                             |
| **Próxima revisión**       | 2026-12-30                                                             |

---

## 01. Objetivo

Alinear el **`@eq-labs/cli`** existente (`apps/cli`) a **EE-DOC-011 §06**:

1. Documentar la superficie actual y su rol de **fachada DX** (no mecanismo canónico).
2. Evitar reimplementar Quality Gates; **delegar** en comandos root (`pnpm run …`).
3. Sustituir el stub “Hello World” por una superficie mínima útil: `help` + delegación a comandos root seleccionados.
4. Registrar si el cambio es **alineación** (esta fase) o **cambio de modelo** (ADR/RFC — no aplica si se mantiene fachada).

**Naturaleza P03:** alineación del baseline existente (Phase 5 Apps), **no** greenfield ni API programática tipada obligatoria.

---

## 02. Estado as-built (pre-P03)

| Artefacto               | Estado                                                                  |
| :---------------------- | :---------------------------------------------------------------------- |
| `apps/cli/package.json` | `@eq-labs/cli` 0.1.0; scripts build/typecheck/start/lint; **sin** `bin` |
| `apps/cli/src/index.ts` | `console.log("Hello World")`                                            |
| `apps/cli/README.md`    | Declara implementación mínima Phase 5                                   |
| Runtime                 | Node ≥ 24 (workspace / ADR-003)                                         |

**Gap vs §06:** no actúa como fachada DX; no delega; no documenta frontera scripts vs CLI.

---

## 03. Decisiones de diseño (alineación)

| Decisión           | Valor                                                                                                         |
| :----------------- | :------------------------------------------------------------------------------------------------------------ |
| Modelo             | **Fachada DX** sobre comandos root (EE-DOC-011 §06.2 / §06.3)                                                 |
| Mecanismo canónico | Sigue siendo `pnpm run <cmd>` en la raíz del monorepo                                                         |
| Superficie P03     | `help` (default) + `run <script>` delegando a `pnpm run <script>`                                             |
| Scripts delegables | Subconjunto documentado de §04.2 (p.ej. `doctor`, `validate`, `lint`, `typecheck`, `test`, `build`, `format`) |
| Prohibido          | Reimplementar umbrales QG; flags globales fuera de `packages/config/`                                         |
| `bin`              | Añadir binario `ee` → `dist/index.js` tras build (invocación local vía workspace)                             |
| API library        | **Fuera de alcance** P03                                                                                      |

---

## 04. Cambios esperados

### 04.1. `apps/cli/src/index.ts` (comportamiento mínimo)

```ts
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const ALLOWED = new Set([
  'doctor',
  'validate',
  'lint',
  'typecheck',
  'test',
  'build',
  'format',
  'bootstrap',
  'clean',
]);

function printHelp(): void {
  console.log(`@eq-labs/cli — Engineering Ecosystem DX facade (EE-DOC-011 §06)

Usage:
  ee help
  ee run <root-command>

Root commands are the canonical automation surface (pnpm run <cmd>).
This CLI does not reimplement Quality Gates.

Delegable commands:
  ${[...ALLOWED].join(', ')}
`);
}

function runRoot(cmd: string): number {
  if (!ALLOWED.has(cmd)) {
    console.error(`Unknown or non-delegable command: ${cmd}`);
    printHelp();
    return 1;
  }
  const result = spawnSync('pnpm', ['run', cmd], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: process.cwd(),
  });
  return result.status ?? 1;
}

const args = process.argv.slice(2);
const [verb, target] = args;

if (!verb || verb === 'help' || verb === '--help' || verb === '-h') {
  printHelp();
  process.exit(0);
}

if (verb === 'run' && target) {
  process.exit(runRoot(target));
}

console.error(`Unknown usage: ${args.join(' ')}`);
printHelp();
process.exit(1);
```

### 04.2. `apps/cli/package.json`

Añadir (tras asegurar `build` genera `dist/index.js`):

```json
"bin": {
  "ee": "./dist/index.js"
},
"files": ["dist"]
```

Opcional: script `"ee": "node dist/index.js"` para desarrollo post-build.

### 04.3. `apps/cli/README.md`

Reescribir conforme a §06:

- Rol: fachada DX; canónico = root scripts.
- Uso: `pnpm --filter @eq-labs/cli build` luego `pnpm --filter @eq-labs/cli start` o `node apps/cli/dist/index.js`.
- `ee run validate` ≡ `pnpm run validate` (misma invocación canónica).
- Referencias: EE-DOC-011, EE-IMP-011-P03.

### 04.4. Fuera de alcance

- No nuevo árbol top-level.
- No cambios a EE-DOC-011 norma (solo evidencia IMP).
- No ADR salvo que se cambie el modelo (no previsto).

---

## 05. Procedimiento operador

### Paso 1 — Baseline

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo
Get-Content apps\cli\src\index.ts
Get-Content apps\cli\package.json
Get-Content apps\cli\README.md
```

### Paso 2 — Materializar §04

Editar `src/index.ts`, `package.json` (`bin`), `README.md`.

### Paso 3 — Verificar

```powershell
pnpm --filter @eq-labs/cli run build
pnpm --filter @eq-labs/cli run typecheck
node apps\cli\dist\index.js help
node apps\cli\dist\index.js run doctor
# opcional (más costoso):
# node apps\cli\dist\index.js run validate

pnpm run format
pnpm run validate
```

### Paso 4 — Commit

```powershell
git add apps/cli
git status --short
git commit -m "feat(cli): align @eq-labs/cli as DX facade over root commands (EE-IMP-011-P03)

- help + run <cmd> delegates to pnpm run (canonical)
- bin ee; README per EE-DOC-011 §06
- no QG reimplementation

Refs: EE-DOC-011, EE-IMP-011-P03"
git push origin main
gh run list --workflow=ci.yml --branch main --limit 1
```

---

## 06. Criterios de aceptación

| #   | Criterio                                              | Estado                       |
| :-- | :---------------------------------------------------- | :--------------------------- |
| 1   | CLI deja de ser solo “Hello World”                    | ✅                           |
| 2   | `help` documenta rol fachada + comandos delegables    | ✅                           |
| 3   | `run <cmd>` delega a `pnpm run` (exit code propagado) | ✅ `run doctor`              |
| 4   | No reimplementa gates ni umbrales                     | ✅                           |
| 5   | README alineado a EE-DOC-011 §06                      | ✅                           |
| 6   | `pnpm run validate` PASS + CI success                 | ✅ `e8c273a` / `36794262329` |
| 7   | Clasificado como **alineación** (no ADR/RFC)          | ✅                           |

---

## 07. Validaciones ejecutadas

| Prueba                | Resultado | Detalle                 |
| :-------------------- | :-------- | :---------------------- |
| typecheck / build CLI | ✅        |                         |
| help                  | ✅        | Superficie fachada      |
| run doctor            | ✅        | Delega a scripts/doctor |
| validate              | ✅        |                         |
| CI Validate           | ✅        | run `36794262329`       |

### 07.1. Commit

| SHA       | Mensaje                                                                        |
| :-------- | :----------------------------------------------------------------------------- |
| `e8c273a` | feat(cli): align @eq-labs/cli as DX facade over root commands (EE-IMP-011-P03) |

### 07.2. Estado de la fase

**Completado** — alineación §06; sin ADR/RFC.

---

## 08. Descubrimientos

| ID        | Descripción                     | Resultado                                   |
| :-------- | :------------------------------ | :------------------------------------------ |
| D-P03-001 | CLI era stub Hello World vs §06 | **Adoptado Type B** — fachada mínima en P03 |

---

## 09. Trazabilidad

| Artefacto | Referencia                                  |
| :-------- | :------------------------------------------ |
| Norma     | EE-DOC-011 §06, §12.3                       |
| Previa    | EE-IMP-011-P02 Completado                   |
| Siguiente | **EE-IMP-011-P04** — Generators and Release |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                 | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :-------------------------------------- | :------------- |
| **v1.0.0** | 2026-09-30 | Equipo de Arquitectura | —                      | Apertura P03 | As-built; diseño fachada; procedimiento | Borrador       |
| **v1.1.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P03   | Fachada DX; bin ee; @types/node; CI ✓   | **Completado** |

---

## FIN DEL DOCUMENTO
