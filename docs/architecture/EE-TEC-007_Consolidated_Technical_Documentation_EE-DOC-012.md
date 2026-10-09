# EE-TEC-007 — Consolidated Technical Documentation of EE-DOC-012

Documentación técnica consolidada (**as-built**) de la implementación de **EE-DOC-012 — Templates**, conforme a **EE-DOC-002 §18.4** y **EE-DOC-005**.

**No es normativo:** no modifica EE-DOC-012; consolida evidencia de **EE-IMP-012-P01…P06**.

---

## METADATOS

| Campo                 | Valor                                                  |
| :-------------------- | :----------------------------------------------------- |
| **ID**                | EE-TEC-007                                             |
| **Documento**         | Consolidated Technical Documentation of EE-DOC-012     |
| **Código corto**      | EE-TEC-007                                             |
| **Tipo**              | Documento Técnico                                      |
| **Clasificación**     | Implementación                                         |
| **Nivel**             | Técnico                                                |
| **Normativo**         | No                                                     |
| **Versión**           | v1.0.0                                                 |
| **Estado**            | Completado                                             |
| **Propietario**       | Equipo de Arquitectura                                 |
| **Documento padre**   | EE-DOC-012 — Templates (v0.5.0 Aprobado)               |
| **Dependencias**      | EE-DOC-006, EE-DOC-011, EE-RFC-002, EE-IMP-012-P01…P06 |
| **Aprobado por**      | Equipo de Arquitectura                                 |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, IA                   |
| **Fecha de creación** | 2026-10-02                                             |
| **Última revisión**   | 2026-10-02                                             |
| **Próxima revisión**  | 2026-12-31                                             |

---

## 01. Propósito

Registrar el estado **as-built** del sistema de templates del monorepo tras **EE-IMP-012-P01…P06**, como entrada a la **Validación Final** y eventual **congelación** de EE-DOC-012.

---

## 02. Alcance

### 02.1. Cubierto

- Árbol `templates/` y contrato `template.json` / `template.schema.json`.
- Categorías materializadas: **T-DOC**, **T-PKG**, **T-APP**, **T-CON**.
- Gate `validateTemplates()` (QG-REPO-001).
- Registro Plop `scripts/plopfile.mjs` y wrapper `scripts/generate`.
- Guards: workspace, allowedTargets, colisión, pattern, §13.1 nested packages.
- Alineación con EE-DOC-011 (A-GEN) y EE-DOC-006 (`templates/` top-level vía RFC-002).

### 02.2. No cubierto

- T-WF, T-EXT, T-CFG (Diferidos).
- Generación operativa bajo `packages/<capa>/` anidado (Diferido §13.1).
- Perfiles app adicionales (p. ej. react-vite) — backlog.
- Sustitución del engine Plop (requeriría Type B/ADR según EE-DOC-011).

---

## 03. Resumen ejecutivo as-built

| Aspecto                         | Estado                 | Evidencia               |
| :------------------------------ | :--------------------- | :---------------------- |
| `templates/` top-level          | ✅                     | EE-RFC-002 / EE-DOC-006 |
| Schema + validateTemplates      | ✅                     | P02                     |
| T-DOC (5 ids incl. ee-rfc)      | ✅                     | P03                     |
| T-PKG / T-APP / T-CON           | ✅                     | P04 `6ec3e7c`           |
| Registro `scripts/plopfile.mjs` | ✅                     | P05 `3d74d74`           |
| generate No False Pass          | ✅                     | P05                     |
| E2E +/-                         | ✅                     | P05                     |
| T-CFG evaluado                  | ✅ Diferido            | P06                     |
| EE-TEC-007                      | ✅                     | Este documento          |
| Fases IMP                       | P01–P06 **Completado** | P06                     |

---

## 04. Estructura física consolidada

```text
templates/
├── README.md
├── template.schema.json
├── document/
│   ├── ee-doc/ | ee-adr/ | ee-imp/ | ee-tec/ | ee-rfc/
│   │   ├── template.json
│   │   ├── README.md
│   │   └── files/*.md.hbs
├── package/
│   └── package-typescript-node/
├── app/
│   └── app-node/
└── connector/
    └── connector-typescript/

scripts/
├── generate                 # wrapper; --plopfile scripts/plopfile.mjs
├── plopfile.mjs             # registro único (descubrimiento)
└── README.md                # contrato + ejemplos posicionales
```

**Destinos de generación:**

| category | Destino                                      |
| :------- | :------------------------------------------- |
| T-DOC    | `docs/<relativePath>/`                       |
| T-PKG    | `packages/<name>/` (solo si workspace cubre) |
| T-APP    | `apps/<name>/`                               |
| T-CON    | `connectors/official/<name>/`                |

---

## 05. Consolidación por fase

| Fase | Entregable técnico clave                                 |
| :--- | :------------------------------------------------------- |
| P01  | Inventario; sin plopfile aún (pending → resuelto en P05) |
| P02  | Árbol + schema + validateTemplates + CODEOWNERS          |
| P03  | ee-doc, ee-adr, ee-imp, ee-tec, ee-rfc                   |
| P04  | package-typescript-node, app-node, connector-typescript  |
| P05  | Engine wiring; args posicionales Plop 4; guards          |
| P06  | Evidencia + T-CFG Diferido + este TEC                    |

---

## 06. Contrato de generación (as-built)

```powershell
pnpm run generate -- <generatorId> <inputPositional...>
```

Ejemplos: `app-node z-sample-app`, `connector-typescript z-sample-conn`.

| Fallo                               | Exit |
| :---------------------------------- | ---: |
| Sin `scripts/plopfile.mjs`          |  ≠ 0 |
| Pattern inválido                    |  ≠ 0 |
| Destino existe                      |  ≠ 0 |
| Fuera de workspace / allowedTargets |  ≠ 0 |
| Nested `packages/<a>/<b>`           |  ≠ 0 |

Muestras de prueba **no** se versionan.

---

## 07. Decisiones técnicas consolidadas

| Decisión                                     | Tipo     | Notas                            |
| :------------------------------------------- | :------- | :------------------------------- |
| Registro en `scripts/plopfile.mjs` (no raíz) | B        | EE-DOC-012 §06.2                 |
| Descubrimiento por convención                | B        | Sin plopfile por template (L-07) |
| Bypass posicional Plop 4                     | B        | No depender de `--name`          |
| ConnectorContext = `Record<string, unknown>` | B        | Evitar empty interface lint      |
| T-CFG no materializado                       | Diferido | P06 §04                          |
| Nested packages generation                   | Diferido | §13.1 → RFC 006 futuro           |

---

## 08. Alineación normativa

| Documento  | Relación as-built                                         |
| :--------- | :-------------------------------------------------------- |
| EE-DOC-012 | Cumple alcance inicial T-DOC/T-PKG/T-APP/T-CON            |
| EE-DOC-011 | `pnpm run generate` = A-GEN; engine en scripts/           |
| EE-DOC-006 | `templates/` top-level; destinos apps/connectors/packages |
| EE-DOC-002 | §18.1–18.5 reflejados en T-DOC                            |
| EE-DOC-010 | QG-REPO-001 + gates de producto sobre muestras            |

---

## 09. Quality Gates

| Gate         | Evidencia                                   |
| :----------- | :------------------------------------------ |
| QG-REPO-001  | validateTemplates en CI/`pnpm run validate` |
| QG-ARCH-001  | allowlist incluye `templates`               |
| Validate job | PASS en commits P03–P05                     |

---

## 10. Dictamen de cierre técnico

El sistema de templates está **implementado y validado** en el alcance inicial de EE-DOC-012:

- Contenido declarativo bajo `templates/`.
- Generación canónica vía `pnpm run generate`.
- Controles de seguridad de destino (workspace, colisión, pattern).
- Documentación técnica consolidada (este EE-TEC-007).

**Recomendación:** proceder a **Validación Final** y **congelación** de EE-DOC-012 por Arquitectura, actualizando EE-DOC-001.

**No bloqueantes abiertos** de tipo Adoptado. Diferidos explícitos y fuera de alcance.

---

## 11. Referencias

| ID                 | Rol                                                     |
| :----------------- | :------------------------------------------------------ |
| EE-DOC-012         | Norma                                                   |
| EE-IMP-012-P01…P06 | Implementación por fases                                |
| EE-RFC-002         | `templates/` top-level                                  |
| EE-DOC-011         | Automation / generate                                   |
| EE-TEC-006         | Predecesor automation (generate pending 012 → resuelto) |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Motivo                     | Estado         |
| :--------- | :--------- | :--------------------- | :------------------------- | :------------- |
| **v1.0.0** | 2026-10-02 | Equipo de Arquitectura | Consolidación post P01–P06 | **Completado** |

---

## FIN DEL DOCUMENTO
