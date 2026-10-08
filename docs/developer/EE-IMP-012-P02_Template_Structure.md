# EE-IMP-012-P02 — Template Structure

Evidencia técnica de la fase **P02** de **EE-DOC-012 — Templates** (EE-DOC-002 §18.3).

---

## METADATOS

| Campo                      | Valor                                                                            |
| :------------------------- | :------------------------------------------------------------------------------- |
| **ID**                     | EE-IMP-012-P02                                                                   |
| **Documento**              | Template Structure                                                               |
| **Código corto**           | EE-IMP-012-P02                                                                   |
| **Fase de implementación** | P02 — Template Structure (EE-DOC-012)                                            |
| **Tipo**                   | Documento Técnico de Implementación                                              |
| **Clasificación**          | Implementación                                                                   |
| **Nivel**                  | Técnico                                                                          |
| **Normativo**              | No                                                                               |
| **Versión**                | v1.1.0                                                                           |
| **Estado**                 | Completado                                                                       |
| **Propietario**            | Equipo de Arquitectura                                                           |
| **Documento padre**        | EE-DOC-012 — Templates (v0.4.0)                                                  |
| **Dependencias**           | EE-IMP-012-P01 Completado, EE-DOC-006 v1.5.0, EE-RFC-002, EE-DOC-010, EE-DOC-011 |
| **Aprobado por**           | Equipo de Arquitectura                                                           |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                                                 |
| **Fecha de creación**      | 2026-10-01                                                                       |
| **Última revisión**        | 2026-10-01                                                                       |
| **Próxima revisión**       | Tras materialización y validate PASS                                             |

---

## 01. Objetivo

1. Materializar `templates/` conforme a **EE-DOC-012 §06.1** (README, schema, categorías vacías).
2. Incluir `templates` en `allowedTopLevel` (QG-ARCH-001).
3. Ownership CODEOWNERS + exclusión Prettier de `files/**`.
4. Implementar **`validateTemplates()`** en `scripts/validate` (evidencia bajo QG-REPO-001).
5. Prueba negativa: `template.json` inválido → `validate` FAIL.

**No incluye:** templates de categoría rellenos (P03/P04), plopfile (P05).

---

## 02. Artefactos a materializar

```text
templates/
├── README.md
├── template.schema.json
├── document/
│   └── .gitkeep
├── package/
│   └── .gitkeep
├── app/
│   └── .gitkeep
└── connector/
    └── .gitkeep
```

Más cambios en:

- `scripts/validate` — allowlist + `validateTemplates()`
- `.github/CODEOWNERS`
- `.prettierignore`

---

## 03. Contenidos canónicos

### 03.1. `templates/README.md`

```markdown
# templates/

Single Source of Template for EE-LABS generative scaffolding (**EE-DOC-012**).

## Layout

| Path                   | Role                            |
| ---------------------- | ------------------------------- |
| `template.schema.json` | Metadata contract (JSON Schema) |
| `document/`            | T-DOC templates                 |
| `package/`             | T-PKG templates                 |
| `app/`                 | T-APP templates                 |
| `connector/`           | T-CON templates                 |

Each template lives at `templates/<category>/<name>/` with `template.json`, `files/`, and `README.md`.

## Boundaries

| Path                     | Role                                    |
| ------------------------ | --------------------------------------- |
| **This directory**       | Generative SSOT                         |
| `assets/templates/`      | Static resources only (EE-DOC-006 §14)  |
| `marketplace/templates/` | Distribution / extensibility — not SSOT |

Generation: `pnpm run generate` (**EE-DOC-011**). Registry: **EE-IMP-012-P05**.

## References

- EE-DOC-012 — Templates
- EE-RFC-002 — Top-level `templates/`
- EE-IMP-012-P02
```

### 03.2. `templates/template.schema.json`

Usar el borrador de **EE-IMP-012-P01 §05** (schemaVersion `"1"`, categorías T-DOC|T-PKG|T-APP|T-CON).

### 03.3. CODEOWNERS (añadir)

```text
templates/                        @EQ-LABS-TECH/architecture @EQ-LABS-TECH/maintainers
```

### 03.4. `.prettierignore` (añadir)

```text
# Generative template bodies (Handlebars / mixed) — EE-DOC-012 L-06
templates/**/files/**
```

### 03.5. `scripts/validate` — cambios

1. Añadir `"templates"` a `allowedTopLevel`.
2. Añadir función `validateTemplates()` y llamarla en el pipeline (tras structure / junto a DOC/INFRA).

Comportamiento mínimo:

| Caso                                                                   | Resultado                                 |
| :--------------------------------------------------------------------- | :---------------------------------------- |
| `templates/` ausente                                                   | Error QG-REPO-001 (post-P02 debe existir) |
| `template.schema.json` ausente                                         | Error                                     |
| Categorías `document`, `package`, `app`, `connector` ausentes          | Error                                     |
| Sin ningún `template.json` bajo categorías                             | PASS (P02: solo scaffold)                 |
| `template.json` presente con JSON inválido o campos required faltantes | FAIL                                      |
| `id` duplicado entre templates                                         | FAIL                                      |
| `category` ≠ directorio padre (`document`→T-DOC, etc.)                 | FAIL                                      |

---

## 04. Procedimiento operador

### Paso 1 — Scaffold `templates/`

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

New-Item -ItemType Directory -Force -Path templates\document | Out-Null
New-Item -ItemType Directory -Force -Path templates\package | Out-Null
New-Item -ItemType Directory -Force -Path templates\app | Out-Null
New-Item -ItemType Directory -Force -Path templates\connector | Out-Null
New-Item -ItemType File -Force -Path templates\document\.gitkeep | Out-Null
New-Item -ItemType File -Force -Path templates\package\.gitkeep | Out-Null
New-Item -ItemType File -Force -Path templates\app\.gitkeep | Out-Null
New-Item -ItemType File -Force -Path templates\connector\.gitkeep | Out-Null
```

Crear `templates/README.md` y `templates/template.schema.json` con el contenido de §03 (editor o here-string).

### Paso 2 — Allowlist + `validateTemplates()`

En `scripts/validate`, dentro de `allowedTopLevel`, añadir `"templates"`.

Añadir e invocar `validateTemplates()` (ver §05 de este IMP o implementación de referencia en el mensaje de implementación).

### Paso 3 — CODEOWNERS y Prettier

Añadir líneas de §03.3 y §03.4.

### Paso 4 — Validación positiva

```powershell
pnpm run format
pnpm run validate
Get-ChildItem -Force -Recurse templates | Select-Object FullName, Length
```

### Paso 5 — Prueba negativa (obligatoria §21.2)

```powershell
# Crear template inválido temporal
New-Item -ItemType Directory -Force -Path templates\package\_invalid-test | Out-Null
Set-Content -Path templates\package\_invalid-test\template.json -Value '{ "id": "bad" }' -Encoding utf8

pnpm run validate
# Esperado: FAIL (QG-REPO-001 / validateTemplates)

# Limpiar
Remove-Item -Recurse -Force templates\package\_invalid-test
pnpm run validate
# Esperado: PASS
```

### Paso 6 — Commit

```powershell
git add templates scripts/validate .github/CODEOWNERS .prettierignore
git status --short
git commit -m "chore(templates): scaffold templates/ tree and validateTemplates (EE-IMP-012-P02)

- templates README, schema, category dirs
- allowedTopLevel + validateTemplates (QG-REPO-001)
- CODEOWNERS; prettierignore files/**

Refs: EE-DOC-012, EE-RFC-002, EE-IMP-012-P02"
git push origin main
```

---

## 05. Implementación de referencia — `validateTemplates()`

Mapa categoría directorio → enum:

| Dir         | category |
| :---------- | :------- |
| `document`  | `T-DOC`  |
| `package`   | `T-PKG`  |
| `app`       | `T-APP`  |
| `connector` | `T-CON`  |

Required keys: las de EE-DOC-012 §07.1 / schema.

Pseudo-flujo (Node, ESM, alineado al estilo de `validate`):

1. `templatesRoot = join(ROOT, "templates")`
2. Si no existe → push error
3. Si falta `template.schema.json` → error
4. Para cada dir de categoría: debe existir
5. `readdir` recursivo limitado a `templates/<cat>/<name>/template.json`
6. Parse JSON; validar required; category match; recolectar ids únicos
7. Return `errors[]`

No añadir dependencia JSON Schema runtime en P02 (validación estructural manual = suficiente Type B). Evolución a Ajv = descubrimiento futuro.

---

## 06. Evidencia de validación (2026-10-01)

| Paso                                                | Resultado                                            |
| :-------------------------------------------------- | :--------------------------------------------------- |
| validate con scaffold                               | ✅ PASS (incl. Checking templates gates QG-REPO-001) |
| `template.json` inválido en `package/_invalid-test` | ❌ FAIL (exit 1) — QG-REPO-001                       |
| Limpieza + validate                                 | ✅ PASS                                              |

## 07. Criterios de aceptación

| #   | Criterio                                  | Estado                 |
| :-- | :---------------------------------------- | :--------------------- |
| 1   | `templates/` + schema + 4 categorías      | ✅                     |
| 2   | `pnpm run validate` PASS con `templates/` | ✅                     |
| 3   | Prueba negativa FAIL luego PASS           | ✅                     |
| 4   | CODEOWNERS cubre `templates/`             | ✅ (as-built operador) |
| 5   | Prettier ignore `templates/**/files/**`   | ✅ (as-built operador) |

---

## 08. Descubrimientos

| ID        | Descripción                                         | Resultado                                                            |
| :-------- | :-------------------------------------------------- | :------------------------------------------------------------------- |
| D-P02-001 | Prueba negativa: JSON inválido (encoding PS) → FAIL | **Aceptado** — fallo seguro; preferir UTF-8 sin BOM en tests futuros |
| D-P02-002 | Gate QG-REPO-001 activo en pipeline validate        | **Adoptado** Type B                                                  |

---

## 09. Historial de Cambios

| Versión    | Fecha      | Autor                  | Motivo                                 | Estado         |
| :--------- | :--------- | :--------------------- | :------------------------------------- | :------------- |
| **v1.0.0** | 2026-10-01 | Equipo de Arquitectura | Apertura P02                           | Borrador       |
| **v1.1.0** | 2026-10-01 | Equipo de Arquitectura | Cierre P02; validate + prueba negativa | **Completado** |

---

## FIN DEL DOCUMENTO
