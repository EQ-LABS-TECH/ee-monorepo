# EE-IMP-011-P04 — Generators and Release

Este documento registra la evidencia técnica de implementación de la fase **P04** de **EE-DOC-011 — Automation**, conforme a **EE-DOC-002 §18.3** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                          |
| :------------------------- | :------------------------------------------------------------- |
| **ID**                     | EE-IMP-011-P04                                                 |
| **Documento**              | Generators and Release                                         |
| **Código corto**           | EE-IMP-011-P04                                                 |
| **Fase**                   | Fase 3 — Core Components                                       |
| **Fase de implementación** | P04 — Generators and Release (Implementación de EE-DOC-011)    |
| **Tipo**                   | Documento Técnico de Implementación                            |
| **Clasificación**          | Implementación                                                 |
| **Nivel**                  | Técnico                                                        |
| **Normativo**              | No                                                             |
| **Versión**                | v1.2.0                                                         |
| **Estado**                 | Completado                                                     |
| **Propietario**            | Equipo de Arquitectura                                         |
| **Documento padre**        | EE-DOC-011 — Automation (v1.0.0 Aprobado)                      |
| **Dependencias**           | EE-DOC-006, EE-DOC-010, EE-DOC-011 §07–§08, EE-IMP-011-P01…P03 |
| **Aprobado por**           | Equipo de Arquitectura                                         |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                               |
| **Fecha de creación**      | 2026-09-30                                                     |
| **Última revisión**        | 2026-10-01                                                     |
| **Próxima revisión**       | 2026-12-30                                                     |

---

## 01. Objetivo

1. Auditar **A-GEN** (`pnpm run generate` / Plop) frente a EE-DOC-011 §07 y EE-DOC-006.
2. Auditar **A-REL** (Changesets + `scripts/release`) frente a EE-DOC-011 §08 (no omitir validación ACTIVE).
3. Corregir defectos bloqueantes del as-built.
4. Alinear `shell` al criterio P02 (`win32`-only) en `generate` / `release`.
5. **No** implementar EE-DOC-012 (templates); documentar dependencia explícita.

---

## 02. Alcance implementado

### 02.1. Incluye

| Ítem                                                          | Resultado |
| :------------------------------------------------------------ | :-------- |
| Audit A-GEN / A-REL vs EE-DOC-011 §07–§08                     | ✅        |
| Eliminación de `cls;` en `scripts/release`                    | ✅        |
| `shell: process.platform === "win32"` en generate/release     | ✅        |
| Build de release vía `pnpm run build` (invocación canónica)   | ✅        |
| `encoding: "utf8"` en verificación Plop de `generate`         | ✅        |
| Confirmación: `pnpm validate` **antes** de publish en release | ✅        |
| Evidencia local + CI sin publish real                         | ✅        |

### 02.2. No incluye (explícito)

| Ítem                                                   | Tratamiento                          |
| :----------------------------------------------------- | :----------------------------------- |
| `plopfile.js` / templates de scaffolding               | Diferido a **EE-DOC-012**            |
| Publish npm / release end-to-end                       | Fuera de P04 (riesgo de publicación) |
| Hardening `shell` en bootstrap/clean/dev/doctor/format | Diferido (D-P04-005)                 |
| `eol=lf` para `scripts/*` en `.gitattributes`          | Diferido (D-P04-006)                 |

---

## 03. Estructura física afectada

```text
ee-monorepo/
├── scripts/
│   ├── generate          # A-GEN — Plop; pending plopfile (012)
│   └── release           # A-REL — Changesets + validate + build + publish
├── .changeset/
│   └── config.json       # baseBranch main
└── package.json          # generate, release, changeset, version-packages
```

No se crearon directorios top-level nuevos (conforme EE-DOC-006).

---

## 04. Modelo de orquestación

```text
A-GEN:
  pnpm run generate → scripts/generate → pnpm exec plop
    ├── sin plopfile.js → exit 0 + mensaje EE-DOC-012
    └── con plopfile.js → plop interactivo (futuro)
```

```text
A-REL:
A-REL — modelo histórico previo a PN-021:
  pnpm run release → scripts/release
    → branch main + working tree limpio + changesets
    → pnpm version-packages
    → sync versión raíz
    → pnpm validate
    → pnpm run build
    → pnpm -r publish
    → git tag + push

A-REL — evolución asociada a PN-021:
  preparación revisable
    → versionado + changelogs + plan y procedencia
    → Pull Request
    → merge autorizado

  finalización post-merge
    → verificación independiente de procedencia y plan
    → Quality Gates y build aplicables
    → reconciliación de estado npm y Git
    → publicación de versiones autorizadas pendientes
    → tag final sujeto a condiciones aprobadas

El primer flujo se conserva exclusivamente como referencia histórica del cierre original de P04. El segundo describe la evolución posterior vinculada a PN-021. La gobernanza GitHub de dicha evolución se relaciona con PN-030 y pertenece a EE-DOC-007. La correspondencia técnica exacta debe comprobarse frente a la implementación y su evidencia de validación.
```

### 04.1. Responsabilidades

| Componente                            | Responsabilidad                                                                                            |
| :------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| **scripts/generate**                  | Entrypoint A-GEN; no crea árboles fuera de 006                                                             |
| **Plop**                              | Motor de templates (cuando exista plopfile)                                                                |
| **scripts/release**                   | Orquestación A-REL; no omite validate                                                                      |
| **Changesets**                        | Plan SemVer (`changeset` / `version-packages`)                                                             |
| **pnpm run validate**                 | Agregador de gates ACTIVE (EE-DOC-010)                                                                     |
| **Preparación y procedencia A-REL**   | Registra el origen y el plan verificable del release, conforme al contrato de EE-DOC-011 §08.2.            |
| **Verificación y finalización A-REL** | Comprueba independientemente la correspondencia del plan y coordina publicación, recuperación y tag final. |

---

## 05. Estado pre-P04 (baseline auditado)

### 05.1. Generate

| Aspecto       | Pre-P04                                                           |
| :------------ | :---------------------------------------------------------------- |
| Invocación    | `pnpm exec plop`                                                  |
| `plopfile.js` | Ausente → exit 0 + pending 012                                    |
| `shell`       | `true` fijo                                                       |
| Defecto       | `stdio: "pipe"` sin `encoding` → `stdout` Buffer; `.trim()` falla |

### 05.2. Release

| Aspecto        | Pre-P04                                              |
| :------------- | :--------------------------------------------------- |
| Flujo          | main → version-packages → validate → build → publish |
| Omite validate | **No**                                               |
| Defecto        | Token `cls;` (sintaxis inválida)                     |
| Build          | `turbo run build` directo                            |
| `shell`        | `true` fijo                                          |

---

## 06. Decisiones de la fase

| ID  | Decisión                                                                                                       |
| :-- | :------------------------------------------------------------------------------------------------------------- |
| D1  | Templates → **EE-DOC-012**; generate permanece pending con exit 0                                              |
| D2  | Release **debe** invocar `pnpm validate` antes de publish                                                      |
| D3  | Eliminar `cls;`                                                                                                |
| D4  | `shell: process.platform === "win32"` (criterio P02)                                                           |
| D5  | Sin publish real en P04                                                                                        |
| D6  | Build vía `pnpm run build` (EE-DOC-011 §05.5 invocación canónica)                                              |
| D7  | `encoding: "utf8"` en check de versión Plop                                                                    |
| D8  | Documentación técnica consolidada de 011 = **EE-TEC-006** (serie TEC-001…; no confundir con código EE-DOC-011) |

---

## 07. Cambios implementados

### 07.1. `scripts/release`

1. Eliminada la línea `cls;`.
2. `shell: true` → `shell: process.platform === "win32"` (4 ocurrencias).
3. Build: `pnpm run build` (antes `turbo run build`).
4. Orden preservado: `version-packages` → sync → **validate** → build → publish.

### 07.2. `scripts/generate`

1. `shell: process.platform === "win32"` (2 ocurrencias).
2. `encoding: "utf8"` en `plop --version`.
3. Mensaje EE-DOC-012 y exit 0 sin `plopfile.js` conservados.

### 07.3. As-built verificado (fuentes monorepo)

| Check                                 | Resultado        |
| :------------------------------------ | :--------------- |
| `cls;` en release                     | Ausente          |
| `shell: true` en generate/release     | Ausente          |
| `shell: process.platform === "win32"` | Presente (2 + 4) |
| `pnpm validate` en release            | Presente         |
| `pnpm run build` en release           | Presente         |
| `encoding: "utf8"` en generate        | Presente         |

### 07.4. Evolución posterior — PN-021: Release y procedencia verificable

La evolución de A-REL responde al pendiente de auditoría **PN-021**, relacionado con preparación revisable, elegibilidad npm, integridad del release, publicación post-merge y recuperación. Su integración con los controles de GitHub se relaciona con **PN-030**, sin trasladar a este documento la responsabilidad normativa de EE-DOC-007.

La preparación del release produce los cambios de versionado y changelog que deben integrarse mediante Pull Request, junto con la información necesaria para verificar posteriormente su procedencia. Esta fase no realiza publicaciones npm ni crea el tag final.

La ejecución post-merge valida que el release solicitado corresponda a una preparación autorizada, contrasta el plan declarado con una reconstrucción independiente y determina qué versiones públicas planificadas requieren publicación. La ausencia de una versión en el registro no autoriza por sí sola a publicar un paquete ajeno al plan.

La secuencia de publicación preserva la verificación de prerrequisitos, los Quality Gates aplicables, el build y la comprobación final del estado del repositorio antes de efectuar operaciones irreversibles. La recuperación distingue versiones ya publicadas, publicaciones pendientes y tags existentes, rechazando inconsistencias en lugar de sobrescribir estados remotos.

La evolución incorpora controles para detectar alteraciones de la procedencia o del plan autorizado, así como condiciones de fallo explícitas cuando no puede demostrarse la correspondencia entre preparación y publicación. El tratamiento de releases sin paquetes públicos planificados permanece sujeto a la decisión normativa correspondiente.

Esta subsección registra la evolución de implementación y no modifica retrospectivamente el dictamen histórico de cierre de P04. Los resultados de pruebas, auditoría y conformidad transversal se documentan separadamente.

---

## 08. Criterios de aceptación

| #   | Criterio                                                  | Estado               |
| :-- | :-------------------------------------------------------- | :------------------- |
| 1   | `cls;` eliminado de `scripts/release`                     | ✅                   |
| 2   | `node --check scripts/release` OK                         | ✅                   |
| 3   | `pnpm run generate` exit 0 + mensaje EE-DOC-012           | ✅                   |
| 4   | Release: validate **antes** de publish                    | ✅                   |
| 5   | `shell` win32-only en generate/release                    | ✅                   |
| 6   | `pnpm run validate` PASS + CI success                     | ✅ run `36797169325` |
| 7   | Sin publish real en P04                                   | ✅                   |
| 8   | Sin descubrimientos **Adoptados** abiertos en alcance P04 | ✅                   |

---

## 09. Validaciones y evidencia

| Prueba                            | Resultado | Detalle                         |
| :-------------------------------- | :-------- | :------------------------------ |
| Select-String cls / shell:true    | ✅        | Sin resultados post-fix         |
| `node --check` release / generate | ✅        |                                 |
| `pnpm run generate`               | ✅        | Plop 4.0.0; pending 012; exit 0 |
| `pnpm run validate`               | ✅        | All validations passed          |
| CI `Validate`                     | ✅        | run `36797169325`               |
| Release E2E                       | ⚪        | No ejecutado (publicaría)       |

### 09.1. Commit

| SHA       | Mensaje                                                                         |
| :-------- | :------------------------------------------------------------------------------ |
| `bd80a70` | fix(scripts): harden generate/release; remove release cls typo (EE-IMP-011-P04) |

Push a `main` con bypass de admin (single-operator; EE-DOC-007).

---

## 10. Descubrimientos

| ID        | Descripción                              | Resultado             | Estado                       |
| :-------- | :--------------------------------------- | :-------------------- | :--------------------------- |
| D-P04-001 | `cls;` en `scripts/release`              | Adoptado Type B       | **Cerrado**                  |
| D-P04-002 | Sin `plopfile.js`                        | Diferido → EE-DOC-012 | Abierto fuera de P04         |
| D-P04-003 | Release invoca validate antes de publish | Conformidad §08       | N/A                          |
| D-P04-004 | Buffer sin encoding en generate          | Adoptado Type B       | **Cerrado**                  |
| D-P04-005 | `shell: true` en otros scripts root      | Diferido Type B       | Backlog (no bloquea P04/P05) |
| D-P04-006 | LF/CRLF warnings en scripts              | Diferido Type B       | Backlog                      |

---

## 11. Dictamen de revisión arquitectónica (cierre)

### 11.1. Conformidad normativa

| Control EE-DOC-011        | Evaluación                                                                       |
| :------------------------ | :------------------------------------------------------------------------------- |
| §07 Generators            | ✅ Entrypoint canónico; no viola 006; templates diferidos con trazabilidad a 012 |
| §08 Release               | ✅ Validate previo a publish; Changesets como mecanismo A-REL                    |
| §05.5 Invocación canónica | ✅ Build de release vía `pnpm run build`                                         |
| §05.2 Exit / shell        | ✅ Criterio P02 aplicado a generate/release                                      |
| No False Pass             | ✅ No se simuló release E2E ni templates inexistentes                            |

### 11.2. Observaciones de revisión y resolución

| #   | Observación                                                               | Severidad       | Resolución                                                                                                                                                        |
| :-- | :------------------------------------------------------------------------ | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Faltaba dictamen formal de cierre arquitectónico                          | Type A          | Añadido §11 (esta versión)                                                                                                                                        |
| R2  | Trazabilidad citaba «EE-TEC-011» de forma confusa                         | Type A          | **SSOT de consolidación = EE-TEC-006** (serie TEC correlativa a orden de emisión: TEC-001↔006 … TEC-005↔010, TEC-006↔011). El código del DOC no numera el TEC. |
| R3  | Estructura IMP ligeramente alejada de §18.3 (alcance / estructura física) | Type A          | Reordenada en v1.2.0 (§02–§04)                                                                                                                                    |
| R4  | D-P04-005/006 sin dueño temporal                                          | Type A          | Marcados backlog; **no** bloquean cierre P04                                                                                                                      |
| R5  | Nota operativa generate/012 en README                                     | Type A opcional | Tabla de comandos ya lista generate/release; detalle 012 puede vivir en P05/TEC-006                                                                               |

**Ninguna observación bloqueante permanece abierta** para el alcance de P04.

### 11.3. Dictamen

> **EE-IMP-011-P04 se declara Cerrado (Completado) v1.2.0.**  
> La revisión histórica de P04 consideró conforme la automatización A-GEN y A-REL con la especificación evaluada en su cierre original. Los diferidos registrados fueron templates (EE-DOC-012) y deuda menor de scripts no-gate (backlog). Este dictamen no constituye evidencia de validación de la evolución posterior asociada a PN-021.

---

## 12. Trazabilidad

| Artefacto                     | Referencia                                                                                 |
| :---------------------------- | :----------------------------------------------------------------------------------------- |
| Norma                         | EE-DOC-011 §07, §08, §12 P04                                                               |
| Previa                        | EE-IMP-011-P03 Completado                                                                  |
| Siguiente                     | **EE-IMP-011-P05** — Validation and Closure                                                |
| TEC consolidado               | **EE-TEC-006** (Documentación Técnica Consolidada de EE-DOC-011)                           |
| Auditoría A-REL               | **PN-021** — preparación, publicación, elegibilidad, integridad y recuperación del release |
| Gobernanza GitHub relacionada | **PN-030** — compatibilidad con protecciones, permisos, workflows y controles de GitHub    |

---

## 13. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                            | Cambios                                                                       | Estado         |
| :--------- | :--------- | :--------------------- | :--------------------- | :-------------------------------- | :---------------------------------------------------------------------------- | :------------- |
| **v1.0.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Apertura P04                      | Audit GEN/REL; procedimiento                                                  | Borrador       |
| **v1.1.0** | 2026-09-30 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre operativo                  | cls; shell; build canónico; Buffer; CI ✓                                      | Completado     |
| **v1.2.0** | 2026-10-01 | Equipo de Arquitectura | Equipo de Arquitectura | Revisión arquitectónica de cierre | Dictamen §11; alcance/estructura §02–§04; TEC-006 SSOT; backlog D-P04-005/006 | **Completado** |

---

## FIN DEL DOCUMENTO
