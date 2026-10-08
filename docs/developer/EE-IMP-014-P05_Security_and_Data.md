# EE-IMP-014-P05 — Security and Data

Este documento sigue el estándar **EE-DOC-002 §18.3** y materializa la unidad **P05** de **EE-DOC-014 — Knowledge Management**.

---

## METADATOS

| Campo                 | Valor                                                              |
| :-------------------- | :----------------------------------------------------------------- |
| **ID**                | EE-IMP-014-P05                                                     |
| **Documento**         | Security and Data (Knowledge)                                      |
| **Código corto**      | EE-IMP-014-P05                                                     |
| **Tipo**              | Documento Técnico de Implementación                                |
| **Clasificación**     | Implementación                                                     |
| **Nivel**             | Técnico                                                            |
| **Normativo**         | No                                                                 |
| **Versión**           | v1.1.0                                                             |
| **Estado**            | Completado                                                         |
| **Propietario**       | Equipo de Arquitectura                                             |
| **Documento padre**   | EE-DOC-014 — Knowledge Management                                  |
| **Dependencias**      | EE-DOC-006, EE-DOC-009, EE-DOC-013, EE-DOC-014, EE-IMP-014-P01…P04 |
| **Aprobado por**      | Equipo de Arquitectura                                             |
| **Audiencia**         | Arquitectura, Desarrollo, Seguridad                                |
| **Fecha de creación** | 2026-10-06                                                         |
| **Última revisión**   | 2026-10-06                                                         |
| **Unidad de fase**    | P05 de EE-DOC-014 §09.1                                            |

---

## 01. Objetivo

1. Cerrar checklist **KS-01…KS-06** con evidencia verificable.
2. Validar subpaths **`data/datasets/`** y **`data/models/`** (candidatos 014 §07.2) y materializar estructura mínima.
3. Extender **`.gitignore`** para no versionar dumps, pesos, índices y credenciales (KS-02).
4. Documentar **retención / borrado / lifecycle** (KS-04).
5. Alinear logs de consulta: default **sin payload sensible** (KS-03 / 013 §09.3).
6. **No** implementar sync de producto ni stores remotos (fuera de alcance P05).

---

## 02. Criterios de aceptación

| #      | Criterio                                                     | Esperado                 |
| :----- | :----------------------------------------------------------- | :----------------------- |
| **C1** | Matriz KS-01…KS-06 con estado PASS / N/A documentado         | PASS                     |
| **C2** | `data/datasets/` + `data/models/` + README de política       | PASS                     |
| **C3** | `.gitignore` cubre artefactos knowledge/data sensibles       | PASS                     |
| **C4** | Política de retención/borrado en este IMP + `data/README.md` | PASS                     |
| **C5** | KS-06 CODEOWNERS (ya P01) reconfirmado                       | PASS                     |
| **C6** | `pnpm run validate` sin regresiones de estructura            | PASS (FAIL solo D-01 OK) |

---

## 03. Matriz KS-\* (evidencia)

| ID        | Regla                                    | Evidencia P05                                                                      | Estado                       |
| :-------- | :--------------------------------------- | :--------------------------------------------------------------------------------- | :--------------------------- |
| **KS-01** | Credenciales solo secretos runtime (009) | No hay credenciales en knowledge/data; stores futuros → GitHub Secrets / vault 009 | **PASS** (política)          |
| **KS-02** | No versionar dumps sensibles             | `.gitignore` §05 + `data/**` generados                                             | **PASS** (al materializar)   |
| **KS-03** | Logs sin payload completo                | §04.2; in-memory no loguea corpus; futuros sinks → metadata only                   | **PASS** (política)          |
| **KS-04** | Retención y borrado                      | §04.1 lifecycle                                                                    | **PASS** (documental)        |
| **KS-05** | Versiones exactas + SEC-001              | vitest pin; overrides; D-01 braces WAIVED                                          | **PASS** (con residual D-01) |
| **KS-06** | CODEOWNERS fino knowledge                | P01 `packages/knowledge/` + `foundation/.../knowledge*.ts`                         | **PASS** (reconfirm)         |

---

## 04. Políticas

### 04.1. Lifecycle de datos (KS-04)

| Clase                        | Descripción                                      | Git                  | Retención            | Borrado                   |
| :--------------------------- | :----------------------------------------------- | :------------------- | :------------------- | :------------------------ |
| **Canónico versionable**     | Corpus editorial en `docs/` (normativo)          | Sí (proceso 005/007) | Según de documento   | Via PR / gobernanza       |
| **Generado / reconstruible** | Índices, embeddings cache, dumps de query        | **No**               | Local / CI ephemeral | Rebuild o `clean`         |
| **Local-only**               | Pesos de modelo, datasets grandes, PII de prueba | **No**               | Operador local       | Manual; no subir a remoto |
| **Runtime secrets**          | API keys de stores                               | **No**               | Rotación 009         | Secrets store             |

**Ownership operativo:** Arquitectura (política) + implementador IMP-014 (artefactos).

**Retention default (primer ciclo):**

- Índices in-memory: **efímeros** (proceso).
- Cachés bajo `data/`: **local-only**; no backup institucional hasta ADR de store.
- No hay obligación de retention legal en este ciclo (sin PII de producción).

### 04.2. Logs de consulta (KS-03)

| Permitido por default                                  | Prohibido por default                         |
| :----------------------------------------------------- | :-------------------------------------------- |
| `unitId`, counts, latency, error codes, correlation id | Contenido completo de `content`, prompts, PII |
| `backend`, `portVersion`                               | API keys, tokens                              |

Alineado a EE-DOC-013 §09.3 (sin raw por default). Opt-in de payload solo con política explícita futura (IMP/ADR).

### 04.3. `data/` vs package

| Va en `packages/knowledge` | Va en `data/`                   |
| :------------------------- | :------------------------------ |
| Código, tests, port impl   | Datasets pesados, pesos, caches |
| README de API              | README de lifecycle (este IMP)  |

**Decisión P05 (Tipo B):** adoptar físicamente:

```text
data/
  README.md
  datasets/
    .gitkeep
    README.md
  models/
    .gitkeep
    README.md
```

Paths de **Local Inference (013)** bajo `data/models/` **no** son corpus Knowledge automáticamente; si se comparten, documentar separación en ADR futuro.

---

## 05. Materialización `.gitignore`

Añadir al final del `.gitignore` raíz (sin borrar reglas existentes):

```gitignore
###############################################################################
# Knowledge / data artifacts (EE-DOC-014 KS-02 / EE-IMP-014-P05)
###############################################################################

# Generated / local-only under data (keep structure + README)
data/datasets/**
!data/datasets/.gitkeep
!data/datasets/README.md
data/models/**
!data/models/.gitkeep
!data/models/README.md

# Binary / model weights (anywhere)
*.onnx
*.gguf
*.safetensors
*.pt
*.pth
*.bin
!**/package.json

# Knowledge runtime caches / indexes
**/.knowledge-cache/
**/knowledge-index/
```

---

## 06. Contenido README

### 06.1. `data/README.md`

```markdown
# data/

Local and generated artifacts for the Engineering Ecosystem (EE-DOC-006 / EE-DOC-014).

## Layout (EE-IMP-014-P05)

| Path        | Purpose                                            |
| ----------- | -------------------------------------------------- |
| `datasets/` | Optional local datasets (not versioned content)    |
| `models/`   | Optional local model weights / inference artifacts |

## Policy

- **Do not commit** binaries, weights, dumps, or secrets (KS-01 / KS-02).
- Canonical normative text lives in `docs/` — not here.
- Knowledge **logic** lives in `packages/knowledge`.
- Lifecycle: see EE-IMP-014-P05 §04.1.
```

### 06.2. `data/datasets/README.md` / `data/models/README.md`

Breve: local-only; ver `data/README.md` y EE-IMP-014-P05.

### 06.3. Nota en `packages/knowledge/README.md`

Añadir sección **Security & data** apuntando a EE-IMP-014-P05 y prohibición de log de payload completo.

---

## 07. Script PowerShell (copiar/pegar)

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

New-Item -ItemType Directory -Force -Path data\datasets, data\models | Out-Null
New-Item -ItemType File -Force -Path data\datasets\.gitkeep, data\models\.gitkeep | Out-Null

Write-NoBom "data\README.md" @'
# data/

Local and generated artifacts for the Engineering Ecosystem (EE-DOC-006 / EE-DOC-014).

## Layout (EE-IMP-014-P05)

| Path | Purpose |
| ---- | ------- |
| `datasets/` | Optional local datasets (content not versioned) |
| `models/` | Optional local model weights / inference artifacts |

## Policy

- **Do not commit** binaries, weights, dumps, or secrets (KS-01 / KS-02).
- Canonical normative text lives in `docs/` — not here.
- Knowledge **logic** lives in `packages/knowledge`.
- Lifecycle / retention: **EE-IMP-014-P05** §04.1.
- Local Inference paths under `models/` are not automatically Knowledge corpus (EE-DOC-013).
'@

Write-NoBom "data\datasets\README.md" @'
# data/datasets/

Local-only datasets. Do not commit dumps or PII (EE-DOC-014 KS-02).

See `../README.md` and EE-IMP-014-P05.
'@

Write-NoBom "data\models\README.md" @'
# data/models/

Local-only model weights / artifacts. Do not commit binaries (EE-DOC-014 KS-02).

Not automatically Knowledge product corpus (EE-DOC-013 Local Inference vs Knowledge).

See `../README.md` and EE-IMP-014-P05.
'@

# Append gitignore if section missing
$gi = Get-Content .gitignore -Raw
if ($gi -notmatch "EE-IMP-014-P05") {
  $block = @'

###############################################################################
# Knowledge / data artifacts (EE-DOC-014 KS-02 / EE-IMP-014-P05)
###############################################################################

data/datasets/**
!data/datasets/.gitkeep
!data/datasets/README.md
data/models/**
!data/models/.gitkeep
!data/models/README.md

*.onnx
*.gguf
*.safetensors
*.pt
*.pth

**/.knowledge-cache/
**/knowledge-index/
'@
  [System.IO.File]::WriteAllText((Join-Path $root ".gitignore"), $gi.TrimEnd() + "`n" + $block + "`n", $utf8)
  Write-Host "OK  .gitignore appended"
}

# Extend knowledge README (append section if missing)
$kr = Get-Content packages\knowledge\README.md -Raw
if ($kr -notmatch "Security & data") {
  $kr2 = $kr.TrimEnd() + @'

## Security & data

- Credentials: runtime secrets only (EE-DOC-009) — **KS-01**
- Do not log full query/unit payloads by default — **KS-03**
- Heavy artifacts: `data/datasets`, `data/models` (EE-IMP-014-P05)
- CODEOWNERS: `packages/knowledge/` — **KS-06**
'@
  Write-NoBom "packages\knowledge\README.md" $kr2
}

# KS-06 reconfirm
Select-String -Path .github\CODEOWNERS -Pattern "knowledge"

# Structure allowed by validate (data/ already on allowlist from 009/006)
pnpm run format
pnpm run validate
# FAIL solo D-01 = OK

git add data .gitignore packages/knowledge/README.md
git status --short
git commit -m "chore(knowledge): data layout, gitignore, KS policy (EE-IMP-014-P05)

- data/datasets + data/models structure + README lifecycle
- gitignore for weights/dumps/caches (KS-02)
- KS-01..06 checklist evidence; retention §04.1

Refs: EE-DOC-014, EE-IMP-014-P05, EE-DOC-006, EE-DOC-009"
git push origin main
```

---

## 08. Descubrimientos

| ID        | Tipo | Hallazgo                                | Decisión        |
| :-------- | :--- | :-------------------------------------- | :-------------- |
| D-P05-001 | B    | Adoptar `data/datasets` + `data/models` | Adoptado        |
| D-P05-002 | B    | gitignore knowledge artifacts           | Adoptado        |
| D-01      | B    | braces                                  | WAIVED residual |

**No** ADR: no se elige vendor de store ni retention legal de producción.

---

## 09. Trazabilidad

| Elemento   | Referencia                      |
| :--------- | :------------------------------ |
| Padre      | EE-DOC-014 §07 / §09.1 P05      |
| Predecesor | EE-IMP-014-P04                  |
| Siguiente  | EE-IMP-014-P06 + **EE-TEC-009** |
| data/      | EE-DOC-006; EE-DOC-009 frontera |

---

## 10. Evidencia de cierre (2026-10-06)

| Control                                  | Resultado                                      |
| :--------------------------------------- | :--------------------------------------------- |
| `data/datasets` + `data/models` + README | ✅                                             |
| `.gitignore` KS-02                       | ✅                                             |
| CODEOWNERS KS-06                         | ✅                                             |
| README knowledge Security & data         | ✅                                             |
| validate                                 | ⚠️ FAIL solo D-01 braces (+ moderate residual) |
| Commit                                   | `ccc463c` on `main`                            |
| CI Validate                              | ❌ esperado (SEC-001 = braces WAIVED)          |

### 10.1. Matriz KS (cierre)

| ID          | Estado                            |
| :---------- | :-------------------------------- |
| KS-01…KS-04 | PASS (política + materialización) |
| KS-05       | PASS con residual D-01            |
| KS-06       | PASS                              |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                     | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :-------------------------- | :---------------- |
| **v1.0.0** | 2026-10-06 | Equipo de Arquitectura | —                      | Apertura P05 | KS; data/; gitignore        | En Implementación |
| **v1.1.0** | 2026-10-06 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P05   | Evidencia; commit `ccc463c` | **Completado**    |

---

## 12. Cierre de unidad

| Campo             | Valor                               |
| :---------------- | :---------------------------------- |
| **Estado**        | **Completado**                      |
| **Siguiente**     | **EE-IMP-014-P06** + **EE-TEC-009** |
| **No False Pass** | Knowledge **no** ACTIVE de producto |

---

## FIN DEL DOCUMENTO
