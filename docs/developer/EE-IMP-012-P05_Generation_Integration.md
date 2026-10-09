# EE-IMP-012-P05 — Generation Integration

Evidencia técnica de **P05** de **EE-DOC-012 — Templates** (integración con **EE-DOC-011** A-GEN).

---

## METADATOS

| Campo                      | Valor                                                             |
| :------------------------- | :---------------------------------------------------------------- |
| **ID**                     | EE-IMP-012-P05                                                    |
| **Documento**              | Generation Integration                                            |
| **Código corto**           | EE-IMP-012-P05                                                    |
| **Fase de implementación** | P05 — Generation Integration                                      |
| **Tipo**                   | Documento Técnico de Implementación                               |
| **Clasificación**          | Implementación                                                    |
| **Nivel**                  | Técnico                                                           |
| **Normativo**              | No                                                                |
| **Versión**                | v1.1.0                                                            |
| **Estado**                 | Completado                                                        |
| **Propietario**            | Equipo de Arquitectura                                            |
| **Documento padre**        | EE-DOC-012 — Templates (v0.5.0)                                   |
| **Dependencias**           | EE-IMP-012-P04 Completado, EE-DOC-011, EE-IMP-011-P04, EE-DOC-006 |
| **Aprobado por**           | Equipo de Arquitectura                                            |
| **Audiencia**              | Arquitectura, Desarrollo                                          |
| **Fecha de creación**      | 2026-10-01                                                        |
| **Última revisión**        | 2026-10-02                                                        |
| **Próxima revisión**       | — (fase Completada)                                               |

---

## 01. Objetivo

1. Materializar el **registro** del engine en **`scripts/plopfile.mjs`** (EE-DOC-012 §06.2 / D-012-04; Type B sobre EE-DOC-011).
2. Ajustar **`scripts/generate`**: localizar el registro, **reenviar argumentos** (no interactivo), **exit ≠ 0** si falta registro o falla generación (§14.4 — No False Pass).
3. Descubrir templates por convención `templates/*/*/template.json` (sin plopfile por template — L-07).
4. Pruebas E2E verificables (positivas T-APP/T-CON; negativas guard T-PKG anidado / inválidos).
5. **No** commitear artefactos de muestra generados.

**No incluye:** P06 (cierre TEC-007), reactivar T-WF/T-EXT/T-CFG, RFC nested `packages/<capa>/`.

---

## 02. Descubrimiento Type B (registro)

| ID            | Descripción                                                                      | Resultado                                                                                     |
| :------------ | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| **D-P05-001** | Reubicar registro de `plopfile.js` (raíz) → **`scripts/plopfile.mjs`**           | **Adoptado** Type B — EE-DOC-012 §06.2; sin cambio de contrato de comando `pnpm run generate` |
| **D-P05-002** | Reenvío de `process.argv` a Plop para modo no interactivo                        | **Adoptado** Type B — EE-DOC-012 §14.4                                                        |
| **D-P05-003** | Sin registro / fallo de generación → **exit ≠ 0** (antes exit 0 + pending)       | **Adoptado** — No False Pass (§14.4)                                                          |
| **D-P05-004** | Plop 4.0.0: bypass no interactivo por **args posicionales**, no `--name`         | **Adoptado** Type B — documentado en §04 y README                                             |
| **D-P05-005** | Scaffold conector: `interface` vacía → lint fail; usar `Record<string, unknown>` | **Adoptado** — `1c8d7c6`                                                                      |

Sincronizar: `scripts/README.md` (hecho). Addendum **EE-TEC-006** / **EE-TEC-007** → **P06**.

---

## 03. Artefactos a materializar

| Path                   | Acción                                                       |
| :--------------------- | :----------------------------------------------------------- |
| `scripts/plopfile.mjs` | **Crear** — registro único                                   |
| `scripts/generate`     | **Modificar** — path registro, args, exit codes              |
| `scripts/README.md`    | **Actualizar** — ubicación del registro y uso no interactivo |

---

## 04. Contrato de invocación

```text
pnpm run generate                              # lista generadores (Plop)
pnpm run generate -- <generator> <input1> ...  # bypass posicional (Plop 4)
```

> **As-built (Plop 4.0.0):** los prompts se rellenan con **argumentos posicionales** en el orden de `inputs[]`. La forma `--name value` **no** bypasea prompts.

Ejemplos:

```powershell
pnpm run generate -- app-node z-sample-app
pnpm run generate -- connector-typescript z-sample-conn
pnpm run generate -- package-typescript-node some-name
```

| Condición                                                                    | Exit |
| :--------------------------------------------------------------------------- | ---: |
| Plop no instalado                                                            |  ≠ 0 |
| `scripts/plopfile.mjs` ausente                                               |  ≠ 0 |
| Generador / inputs inválidos                                                 |  ≠ 0 |
| Destino fuera de workspace / no cubierto                                     |  ≠ 0 |
| Destino ya existe (colisión)                                                 |  ≠ 0 |
| T-PKG hacia path tipo `packages/<capa>/<name>` (anidado no autorizado §13.1) |  ≠ 0 |
| Generación OK                                                                |    0 |

---

## 05. `scripts/generate` (canónico post-P05)

```javascript
#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PLOPFILE = join(ROOT, 'scripts', 'plopfile.mjs');

console.log('🔧 Code Generator');
console.log('=================');
console.log('');

const plopCheck = spawnSync('pnpm', ['exec', 'plop', '--version'], {
  stdio: 'pipe',
  encoding: 'utf8',
  shell: process.platform === 'win32',
  cwd: ROOT,
});

if (plopCheck.status !== 0) {
  console.error('❌ Plop is not available. Please run: pnpm install');
  process.exit(1);
}

console.log(`  Plop: ${plopCheck.stdout.trim()}`);
console.log(`  Registry: scripts/plopfile.mjs`);
console.log('');

if (!existsSync(PLOPFILE)) {
  console.error('❌ scripts/plopfile.mjs not found (EE-DOC-012 / EE-IMP-012-P05).');
  console.error('   Generation registry is required (No False Pass).');
  process.exit(1);
}

// Forward args after `node scripts/generate` / `pnpm run generate -- ...`
const forward = process.argv.slice(2);

console.log('📦 Generating from templates...');
console.log('');

const result = spawnSync('pnpm', ['exec', 'plop', '--plopfile', PLOPFILE, ...forward], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: ROOT,
});

process.exit(result.status ?? 1);
```

---

## 06. `scripts/plopfile.mjs` (registro)

Comportamiento requerido:

1. **Descubrir** `templates/<categoryDir>/<templateId>/template.json`.
2. Registrar un generador Plop por cada `id` (nombre del generador = `id`).
3. Prompts desde `inputs[]` del `template.json`.
4. **`addMany`**: copiar `files/**` → destino, strip `.hbs`, aplicar Handlebars.
5. **Guards antes de escribir:**
   - `name` / `docId` según `pattern` del input.
   - Destino debe caer bajo `allowedTargets`.
   - Destino **no** debe existir ya.
   - Destino debe estar **cubierto** por globs de `pnpm-workspace.yaml` (T-APP → `apps/*`; T-CON → `connectors/official/*`; T-PKG → solo si el path está en los patrones; los 9 paquetes literales no admiten nombres arbitrarios → fallo seguro para `packages/nuevo` si no hay glob `packages/*`).
   - Rechazar paths con más de un segmento bajo `packages/` cuando equivalga a `packages/<capa>/<name>` (§13.1 diferido): p.ej. `packages/foundation/foo` → fail.
6. T-DOC: destino `docs/{{relativePath}}/` (default por template); no exige workspace pnpm.

### 06.1. Mapa destino por categoría

| category | Destino de generación                                                |
| :------- | :------------------------------------------------------------------- |
| `T-PKG`  | `packages/{{name}}/`                                                 |
| `T-APP`  | `apps/{{name}}/`                                                     |
| `T-CON`  | `connectors/official/{{name}}/`                                      |
| `T-DOC`  | `docs/{{relativePath}}/` (+ nombre de archivo desde outputs / docId) |

### 06.2. Implementación de referencia

```javascript
// scripts/plopfile.mjs
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = process.cwd();
const TEMPLATES_ROOT = join(ROOT, 'templates');

function loadWorkspaceGlobs() {
  const raw = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
  const doc = parseYaml(raw);
  return Array.isArray(doc?.packages) ? doc.packages : [];
}

/** Minimal glob: only * at end of segment (as-built workspace patterns). */
function matchesGlob(relPosix, glob) {
  const g = glob.replace(/\\/g, '/');
  const t = relPosix.replace(/\\/g, '/');
  if (!g.includes('*')) return t === g;
  const re = new RegExp(
    '^' +
      g
        .split('*')
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*') +
      '$',
  );
  return re.test(t);
}

function isCoveredByWorkspace(relPath, globs) {
  const posix = relPath.split(sep).join('/');
  return globs.some((g) => matchesGlob(posix, g) || matchesGlob(posix + '/*', g));
}

function discoverTemplates() {
  const out = [];
  if (!existsSync(TEMPLATES_ROOT)) return out;
  for (const cat of readdirSync(TEMPLATES_ROOT)) {
    const catPath = join(TEMPLATES_ROOT, cat);
    if (!statSync(catPath).isDirectory()) continue;
    if (cat === 'node_modules') continue;
    for (const id of readdirSync(catPath)) {
      const metaPath = join(catPath, id, 'template.json');
      if (!existsSync(metaPath)) continue;
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      out.push({ catDir: cat, dir: join(catPath, id), meta });
    }
  }
  return out;
}

function resolveDest(meta, data) {
  switch (meta.category) {
    case 'T-PKG':
      return join('packages', data.name);
    case 'T-APP':
      return join('apps', data.name);
    case 'T-CON':
      return join('connectors', 'official', data.name);
    case 'T-DOC': {
      const rel = data.relativePath || 'architecture';
      return join('docs', rel);
    }
    default:
      throw new Error(`Unknown category: ${meta.category}`);
  }
}

function assertGuards(meta, data, destRel) {
  const globs = loadWorkspaceGlobs();
  const destAbs = join(ROOT, destRel);

  if (meta.category === 'T-PKG') {
    const parts = destRel.split(sep);
    // packages/<layer>/<name> → blocked (section 13.1)
    if (parts.length > 2) {
      throw new Error(`QG-REPO / §13.1: nested package path not authorized: ${destRel}`);
    }
  }

  if (existsSync(destAbs) && meta.category !== 'T-DOC') {
    // T-DOC may write a single file; for dirs of code templates, refuse existing
    throw new Error(`Destination already exists: ${destRel}`);
  }

  if (meta.category !== 'T-DOC') {
    if (!isCoveredByWorkspace(destRel, globs)) {
      throw new Error(`Destination not covered by pnpm-workspace.yaml: ${destRel}`);
    }
  }

  const allowed = meta.allowedTargets || [];
  const posix = destRel.split(sep).join('/') + '/';
  const ok = allowed.some((a) => posix.startsWith(a.replace(/\\/g, '/')));
  if (allowed.length && !ok) {
    throw new Error(`Destination outside allowedTargets (${allowed.join(', ')}): ${destRel}`);
  }
}

export default function (plop) {
  const templates = discoverTemplates();
  if (templates.length === 0) {
    throw new Error('No templates discovered under templates/*/*/template.json');
  }

  for (const { dir, meta } of templates) {
    const filesDir = join(dir, 'files');
    plop.setGenerator(meta.id, {
      description: meta.description || meta.name,
      prompts: (meta.inputs || []).map((input) => ({
        type: 'input',
        name: input.name,
        message: input.description || input.name,
        default: input.default,
        validate(value) {
          if (input.required && !value) return `${input.name} is required`;
          if (input.pattern && value) {
            const re = new RegExp(input.pattern);
            if (!re.test(value)) return `${input.name} must match ${input.pattern}`;
          }
          return true;
        },
      })),
      actions(data) {
        const destRel = resolveDest(meta, data);
        assertGuards(meta, data, destRel);

        if (meta.category === 'T-DOC') {
          // Single markdown body → docs/<relativePath>/<docId>_<sanitized>.md
          const body = join(
            filesDir,
            `${meta.id === 'ee-imp' ? 'EE-IMP-XXX-PXX_Title.md.hbs' : meta.id === 'ee-doc' ? 'EE-DOC-XXX_Title.md.hbs' : meta.id === 'ee-adr' ? 'EE-ADR-XXX_Title.md.hbs' : meta.id === 'ee-tec' ? 'EE-TEC-XXX_Title.md.hbs' : 'EE-RFC-XXX_Title.md.hbs'}`,
          );
          const baseName = `${data.docId}_${String(data.title || 'Title').replace(/\s+/g, '_')}.md`;
          return [
            {
              type: 'add',
              path: join(ROOT, destRel, baseName),
              templateFile: body,
            },
          ];
        }

        return [
          {
            type: 'addMany',
            destination: join(ROOT, destRel),
            base: filesDir,
            templateFiles: ['**/*'],
            globOptions: { dot: true },
            // strip .hbs
            transform(content) {
              return content;
            },
          },
        ];
      },
    });
  }
}
```

> **Nota de implementación:** Plop `addMany` renombra `file.hbs` → `file` si se configura `stripExtensions` / naming. Verificar en Plop 4: usar `templateFiles: '**/*.hbs'` y `path` con `{{name}}` o la opción `stripExtensions: ['.hbs']` según API instalada. Si `addMany` no strippea `.hbs`, usar acciones `add` por archivo descubierto con `path: dest + '/' + relative.replace(/\.hbs$/, '')`.

### 06.3. Preferencia operativa (add por archivo)

Más predecible en Windows:

```javascript
function collectHbs(filesDir, prefix = '') {
  const entries = readdirSync(join(filesDir, prefix || '.'), { withFileTypes: true });
  const list = [];
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) list.push(...collectHbs(filesDir, rel));
    else if (e.name.endsWith('.hbs')) list.push(rel);
  }
  return list;
}

// en actions, para T-PKG/T-APP/T-CON:
const actions = collectHbs(filesDir).map((rel) => ({
  type: 'add',
  path: join(ROOT, destRel, rel.replace(/\.hbs$/, '')),
  templateFile: join(filesDir, rel),
}));
```

---

## 07. Procedimiento de prueba (operador)

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# 1. Materializar scripts/plopfile.mjs + scripts/generate (§05–§06)
# 2. Actualizar scripts/README.md (ruta del registro)

node --check scripts/generate
node --check scripts/plopfile.mjs

pnpm run format
pnpm run validate
```

### 07.1. Positivas (no commitear muestras)

```powershell
pnpm run generate -- app-node z-sample-app
pnpm run generate -- connector-typescript z-sample-conn

pnpm install
pnpm run format
pnpm run validate
# PASS esperado

# Limpiar muestras (obligatorio)
Remove-Item -Recurse -Force apps\z-sample-app, connectors\official\z-sample-conn
pnpm install
pnpm run format
pnpm run validate
```

### 07.2. Negativas (exit ≠ 0)

```powershell
# Sin registro (renombrar temporalmente) → fail
# Nombre inválido
pnpm run generate -- app-node "INVALID"
# Destino duplicado (si existe apps/cli)
pnpm run generate -- app-node cli
# T-PKG no cubierto por workspace (nombre arbitrario)
pnpm run generate -- package-typescript-node z-not-in-workspace
# Anidado bloqueado (si el generador expusiera capa; path packages/a/b)
```

### 07.3. Commit (solo scripts; sin muestras)

```powershell
git add scripts/plopfile.mjs scripts/generate scripts/README.md
git status --short
git commit -m "feat(generate): plop registry scripts/plopfile.mjs + non-interactive generate (EE-IMP-012-P05)

- discover templates/*/*/template.json
- exit != 0 if registry missing (No False Pass)
- workspace / allowedTargets / collision guards

Refs: EE-DOC-012, EE-DOC-011, EE-IMP-012-P05"
git push origin main
```

---

## 08. Criterios de aceptación

| #   | Criterio                                                                              | Estado                     |
| :-- | :------------------------------------------------------------------------------------ | :------------------------- |
| 1   | Existe `scripts/plopfile.mjs`                                                         | ✅                         |
| 2   | `scripts/generate` usa `--plopfile scripts/plopfile.mjs` y reenvía args               | ✅                         |
| 3   | Sin registro → exit ≠ 0                                                               | ✅ (código; No False Pass) |
| 4   | `pnpm run generate -- app-node z-sample-app` crea árbol bajo `apps/`                  | ✅                         |
| 5   | `pnpm run generate -- connector-typescript z-sample-conn` bajo `connectors/official/` | ✅                         |
| 6   | Tras muestras: `pnpm install && pnpm run validate` PASS                               | ✅                         |
| 7   | Muestras no commiteadas (solo scripts + fix template)                                 | ✅                         |
| 8   | T-PKG / destino no workspace → exit ≠ 0                                               | ✅                         |
| 9   | Input inválido / colisión → exit ≠ 0                                                  | ✅                         |
| 10  | `pnpm run validate` PASS con muestras o tras limpieza                                 | ✅                         |
| 11  | CI verde (`3d74d74`, `1c8d7c6`)                                                       | ✅                         |

---

## 09. Trazabilidad

| Norma                 | Evidencia                           |
| :-------------------- | :---------------------------------- |
| EE-DOC-012 §06.2, §14 | Este IMP                            |
| EE-DOC-012 §21 P05    | Criterios §08                       |
| EE-DOC-011 A-GEN      | `pnpm run generate`                 |
| EE-DOC-012 §13.1      | Guard nested packages               |
| L-07                  | Sin acciones Plop bajo `templates/` |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Motivo                                                                                                 | Estado         |
| :--------- | :--------- | :--------------------- | :----------------------------------------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-01 | Equipo de Arquitectura | Apertura P05 tras P04 Completado                                                                       | Borrador       |
| **v1.1.0** | 2026-10-02 | Equipo de Arquitectura | Cierre: E2E +/- PASS, commits `3d74d74`/`1c8d7c6`, CI verde; args posicionales; fix connector template | **Completado** |

---

## FIN DEL DOCUMENTO
