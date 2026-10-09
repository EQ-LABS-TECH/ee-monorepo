# EE-IMP-011-P02 — Scripts Hardening

Este documento registra la evidencia técnica de implementación de la fase **P02** de **EE-DOC-011 — Automation**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                          |
| :------------------------- | :------------------------------------------------------------- |
| **ID**                     | EE-IMP-011-P02                                                 |
| **Documento**              | Scripts Hardening                                              |
| **Código corto**           | EE-IMP-011-P02                                                 |
| **Fase**                   | Fase 3 — Core Components                                       |
| **Fase de implementación** | P02 — Scripts Hardening (Implementación de EE-DOC-011)         |
| **Tipo**                   | Documento Técnico de Implementación                            |
| **Clasificación**          | Implementación                                                 |
| **Nivel**                  | Técnico                                                        |
| **Normativo**              | No                                                             |
| **Versión**                | v1.1.0                                                         |
| **Estado**                 | Completado                                                     |
| **Propietario**            | Equipo de Arquitectura                                         |
| **Documento padre**        | EE-DOC-011 — Automation (v1.0.0 Aprobado)                      |
| **Dependencias**           | EE-DOC-006, EE-DOC-010, EE-DOC-011, EE-IMP-011-P01, EE-ADR-001 |
| **Aprobado por**           | Equipo de Arquitectura                                         |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                               |
| **Fecha de creación**      | 2026-09-30                                                     |
| **Última revisión**        | 2026-09-30                                                     |
| **Próxima revisión**       | 2026-12-30                                                     |

---

## 01. Objetivo

Endurecer los scripts root que materializan Quality Gates y orquestación, sin cambiar el **catálogo de comandos** (§04.2):

1. **Exit Code First** — fallo del mecanismo → `process.exit(≠0)` predecible.
2. **Mensajes contractuales** — scripts de gate etiquetan el **ID QG** cuando reportan FAIL/PASS/SKIPPED.
3. **Deuda `shell: true`** — reducir o documentar; evitar `DEP0190` donde sea viable en Win/POSIX.
4. **No Silent Divergence** — no alterar umbrales de EE-DOC-010.

**Fuera de alcance P02:** CLI surface (P03), generate/release audit profundo (P04), TEC-011 (P05).

---

## 02. Inventario as-built (deuda)

| Script                                                 |  `shell: true`   |        Mensaje QG-ID        | Exit ≠0 en fallo | Notas                                      |
| :----------------------------------------------------- | :--------------: | :-------------------------: | :--------------: | :----------------------------------------- |
| `lint`                                                 |        ✅        |         ❌ genérico         |        ✅        | Debe citar **QG-LINT-001**                 |
| `typecheck`                                            |        ✅        |         ❌ genérico         |        ✅        | **QG-TYPE-001**                            |
| `build`                                                |        ✅        |         ❌ genérico         |        ✅        | **QG-BUILD-001**                           |
| `test`                                                 |        ✅        |       ✅ QG-TEST-001        |        ✅        | SKIPPED en 0 tasks (ya conforme §05.4 010) |
| `validate`                                             | ✅ (execCommand) | ✅ parcial (DOC/INFRA/ARCH) |        ✅        | Mantener; no redefinir agregación          |
| `format`                                               |        ✅        |             N/A             |        ✅        | Herramienta write; **no** es gate          |
| `doctor`                                               |     posible      |             N/A             |        ✅        | No sustituye validate                      |
| `bootstrap` / `dev` / `clean` / `generate` / `release` |       var.       |             N/A             |       var.       | No son gates ACTIVE de merge               |

**Hallazgo:** scripts de gate “simples” (`lint`, `typecheck`, `build`) no etiquetan QG-ID; patrón de `spawnSync(..., { shell: true })` generalizado (aviso Node DEP0190 en algunos entornos).

---

## 03. Decisiones de hardening

### 03.1. Mensajes QG (obligatorio P02)

| Script      | Prefijo / texto en fallo | Prefijo en éxito (opcional) |
| :---------- | :----------------------- | :-------------------------- |
| `lint`      | `❌ QG-LINT-001: FAIL`   | `✅ QG-LINT-001: PASS`      |
| `typecheck` | `❌ QG-TYPE-001: FAIL`   | `✅ QG-TYPE-001: PASS`      |
| `build`     | `❌ QG-BUILD-001: FAIL`  | `✅ QG-BUILD-001: PASS`     |
| `test`      | (ya existe)              | (ya existe SKIPPED/PASS)    |

### 03.2. `shell: true` (Type B — pragmatic)

| Opción | Descripción                                                               | Decisión P02                     |
| :----- | :------------------------------------------------------------------------ | :------------------------------- |
| **A**  | Quitar `shell: true` y usar `pnpm exec turbo` / binarios explícitos       | Preferida donde no rompa Windows |
| **B**  | Mantener `shell: true` documentado como deuda aceptada en Win para `.cmd` | Fallback si A falla en Windows   |

**Norma de implementación:** intentar invocar vía:

```js
spawnSync('pnpm', ['exec', 'turbo', 'run', '<task>'], {
  stdio: 'inherit',
  shell: false,
  cwd: process.cwd(),
});
```

Si en Windows `pnpm` no resuelve sin shell, usar:

```js
spawnSync('pnpm', ['exec', 'turbo', 'run', '<task>'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: process.cwd(),
});
```

No introducir `shell: true` **y** concatenación insegura de args de usuario (scripts actuales usan arrays fijos → riesgo bajo).

### 03.3. Helper opcional (recomendado)

Si se repite el patrón, se puede extraer en un módulo local **solo bajo `scripts/`** (no nuevo paquete workspace), p.ej. `scripts/lib/run-turbo.mjs` — **opcional** en P02; no es obligatorio si el diff por script es pequeño.

---

## 04. Cambios esperados por archivo

### 04.1. `scripts/lint` (plantilla)

```js
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

console.log('🔍 Running linter (QG-LINT-001)...');
console.log('');

const result = spawnSync('pnpm', ['exec', 'turbo', 'run', 'lint'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: process.cwd(),
});

if (result.status !== 0) {
  console.error('');
  console.error('❌ QG-LINT-001: FAIL');
  process.exit(result.status ?? 1);
}

console.log('');
console.log('✅ QG-LINT-001: PASS');
```

### 04.2. `scripts/typecheck` / `scripts/build`

Mismo patrón con **QG-TYPE-001** y **QG-BUILD-001** y tareas `typecheck` / `build`.

### 04.3. `scripts/test`

Solo unificar estilo de cabecera si hace falta; **no** cambiar semántica SKIPPED/0 tasks.

### 04.4. `scripts/validate`

- Sustituir `shell: true` fijo en `execCommand` por `shell: process.platform === "win32"` (o `false` si se verifica en CI Linux).
- No cambiar orden de fases ni umbrales SEC/DOC/ARCH.

### 04.5. Resto

`format`, `doctor`, `bootstrap`, `clean`, `dev`, `generate`, `release`: mismo criterio de `shell` si se tocan; **sin** inventar QG-IDs.

---

## 05. Procedimiento operador

### Paso 1 — Baseline

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo
Select-String -Path scripts\lint,scripts\typecheck,scripts\build,scripts\test,scripts\validate -Pattern "shell:\s*true|QG-"
```

### Paso 2 — Aplicar cambios

Editar `lint`, `typecheck`, `build` (+ `validate` execCommand) según §04.

### Paso 3 — Verificar

```powershell
pnpm run format
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test
pnpm run validate
```

### Paso 4 — Commit

```powershell
git add scripts/lint scripts/typecheck scripts/build scripts/test scripts/validate
git status --short
git commit -m "refactor(scripts): harden gate scripts exit codes and QG labels (EE-IMP-011-P02)

- QG-LINT-001 / QG-TYPE-001 / QG-BUILD-001 messaging
- reduce shell:true to win32-only where applicable
- preserve QG-TEST-001 SKIPPED semantics

Refs: EE-DOC-011, EE-DOC-010, EE-IMP-011-P02"
git push origin main
gh run list --workflow=ci.yml --branch main --limit 1
```

---

## 06. Criterios de aceptación

| #   | Criterio                                                   | Estado                  |
| :-- | :--------------------------------------------------------- | :---------------------- |
| 1   | `lint` / `typecheck` / `build` reportan QG-ID en FAIL/PASS | ✅                      |
| 2   | Fallo de turbo → exit ≠ 0                                  | ✅ (contrato mantenido) |
| 3   | `test` mantiene SKIPPED con 0 tasks (no PASS)              | ✅                      |
| 4   | `validate` PASS local                                      | ✅                      |
| 5   | CI `Validate` success                                      | ✅ run `36790490802`    |
| 6   | Sin cambio de catálogo §04.2 / package.json scripts        | ✅                      |
| 7   | IMP cerrado Completado                                     | ✅ v1.1.0               |

---

## 07. Validaciones ejecutadas

| Prueba                        | Resultado | Detalle                                                                                   |
| :---------------------------- | :-------- | :---------------------------------------------------------------------------------------- |
| QG-LINT-001 PASS              | ✅        | Local                                                                                     |
| QG-TYPE-001 PASS              | ✅        | Local                                                                                     |
| QG-BUILD-001 PASS             | ✅        | Local                                                                                     |
| QG-TEST-001 SKIPPED (0 tasks) | ✅        | Conforme EE-DOC-010 §05.4                                                                 |
| validate                      | ✅        | All validations passed                                                                    |
| CI Validate                   | ✅        | `b4712f8` / run `36790490802`                                                             |
| DEP0190 en win32              | ℹ️        | Esperado: `shell: true` solo en Windows; args fijos (arrays). Deuda aceptada documentada. |

### 07.1. Commit

| SHA       | Mensaje                                                                          |
| :-------- | :------------------------------------------------------------------------------- |
| `b4712f8` | refactor(scripts): harden gate scripts exit codes and QG labels (EE-IMP-011-P02) |

### 07.2. Estado de la fase

**Completado**.

---

## 08. Descubrimientos

| ID        | Descripción                                        | Resultado                                      |
| :-------- | :------------------------------------------------- | :--------------------------------------------- |
| D-P02-001 | Mensajes de gate sin QG-ID en lint/typecheck/build | **Adoptado Type B** — esta fase                |
| D-P02-002 | `shell: true` generalizado / DEP0190               | **Adoptado Type B** — win32-only o `pnpm exec` |

---

## 09. Trazabilidad

| Artefacto | Referencia                              |
| :-------- | :-------------------------------------- |
| Norma     | EE-DOC-011 §05.2, §05.4, §05.5, §12 P02 |
| Gates     | EE-DOC-010                              |
| Previa    | EE-IMP-011-P01 Completado               |
| Siguiente | **EE-IMP-011-P03** — CLI Surface        |

---

## 10. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                       | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :-------------------------------------------- | :------------- |
| **v1.0.0** | 2026-09-30 | Equipo de Arquitectura | —                      | Apertura P02 | Inventario deuda; plantillas QG; shell policy | Borrador       |
| **v1.1.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P02   | QG labels; shell win32-only; CI ✓             | **Completado** |

---

## FIN DEL DOCUMENTO
