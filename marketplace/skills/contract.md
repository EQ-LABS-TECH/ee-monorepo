# EE-LABS — Contrato transversal de skills v1.0 (propuesta operativa)

Este documento **no es norma EE-DOC ni redefine EE-DOC-005/010/015**. Es el contrato operativo del catálogo, subordinado a la documentación vigente. Los cambios a normas congeladas requieren el mecanismo gobernado correspondiente.

## 1. Alcance y fuente

- Repositorio: `EQ-LABS-TECH/ee-monorepo`; SSOT: `main` de GitHub.
- Conector GitHub autorizado: prioridad de lectura, sin escribir remoto ni exponer tokens. Resolución de `main` a SHA verificado de commit cuando la herramienta lo permite. SHA de blob de un archivo **no** equivale al commit del repositorio.
- Para PR: base/head identificados explícitamente y diff verificable, sin equiparar a `main`.
- Si acceso a GitHub falla: `Paquetes_Archivos_Monorepo.md` es **fallback de inventario no documental**. No contiene `docs/`; para `docs/` se requieren Markdown independientes. No inferir ausencia de archivos no cubiertos ni afirmar que el snapshot es idéntico a `main`.
- Clasificar fuentes `GITHUB_PINNED`, `GITHUB_UNPINNED`, `SNAPSHOT_FALLBACK` y `NOT_VERIFIABLE`; incluir límites de procedencia.

## 2. Modos de persistencia

| Modo              | Uso                                                  | Estado                                           | Escritura                |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------ | ------------------------ |
| `LOCAL_WRITE`     | Checkout local identificado, autorizado y escribible | Cambios en archivos locales, pendiente de commit | Solo ruta local          |
| `ARTIFACT_EXPORT` | Checkout local ausente o no escribible               | Archivos descargables aún **no incorporados**    | ZIP/artefactos de salida |

- **Prohibida escritura remota por todas las skills**, incluso si el conector soporta escribir. El usuario decide cuándo incorporar y publicar los cambios.
- `ARTIFACT_EXPORT`: ZIP con rutas relativas a la raíz del monorepo; archivos completos para CREATE/UPDATE/REPLACE; `manifest.json` y `delivery-report.md` fuera de las rutas del repositorio. No entregar archivos truncados como si estuvieran completos.
- Los reportes detallados se guardan en `docs/validation/audit/reports/`. Una campaña recibe un ID secuencial de tres dígitos y su fecha de inicio; todos sus informes conservan ambos. El reporte general usa `EE-AUD-<NNN>-<YYYY-MM-DD>-<scope-kebab-case>-<YYYYMMDDHHmmss>.md`; un informe de fase inserta `phase-<n>` antes del alcance. El timestamp de ejecución se genera en UTC. En `ARTIFACT_EXPORT`, conservar la ruta relativa dentro del ZIP; manifiesto y reporte de entrega permanecen en la raíz del paquete.
- La ruta de destino **debe estar verificada en EE-DOC-006 y/o árbol real**, o documentarse como nueva ruta propuesta autorizada. El archivo de inventario sin docs no verifica destinos `docs/`.
- Operaciones `UPDATE`/`REPLACE`: registrar `base_sha256` de los bytes originales cuando se dispone de archivo completo; comprobar en el checkout de destino antes del reemplazo. Si difiere, detener y solicitar conciliación/diff. El SHA GitHub blob puede complementarse, nunca sustituye el SHA256 local de comparación.
- `manifest.json` es formato operativo propuesto (no normativo). Campos mínimos: `schema_version`, `repository`, `source`, `mode`, `files[]`: `path`, `operation`, `base_sha256` (o null), `output_sha256`, `source_ref`, `notes`. Los archivos `manifest.json` / `delivery-report.md` están al nivel superior **del paquete exportado**, no se copian al repo por defecto.
- Si no existe contenido original confiable, **no** generar un `REPLACE` como seguro: señalar conflicto/desconocimiento y producir propuesta/diff para revisión.

## 3. Trazabilidad de auditoría

- Leer desde la misma revisión los tres artefactos: `docs/validation/audit/EE-AUD-Criteria_Audited_Definition.md`, `EE-AUD-Log_Progress_Register.md`, `EE-AUD-Rules_Emerging.md`.
- Todo descubrimiento relevante de auditoría termina en modificación local o propuesta de modificación **concreta** del AUDIT correspondiente. No escribir una observación solo en el chat; no inventar nuevos IDs ni duplicar reglas existentes.
- `Criteria` contiene el criterio de `Auditado` y no se modifica para registrar un hallazgo ordinario; `Log` registra progreso y enlaza el reporte de cada ejecución; `Rules Emerging` conserva reglas emergentes y backlog, no el detalle completo de hallazgos. Para hallazgos de código, usar la sección **Auditorías técnicas y artefactos** del `Log` y vincular el informe; actualizar `Rules` solo si corresponde a una regla o acción de backlog.
- Estado de persistencia: `PROPUESTO_LOCAL` (solo borrador), `LOCAL_WRITE` (comprobado en checkout), `EXPORTADO` (ZIP disponible), `PR_VERIFICADO` (si el usuario prueba PR después), `PUBLICADO_VERIFICADO` (solo lectura comprobada de `main`). Ninguna de estas etiquetas aprueba norma por sí misma.

## 4. Handoff e integridad

Cada etapa entrega: `stage`, `skill`, `status` (`PENDIENTE`, `EN_CURSO`, `COMPLETADA`, `NO_APLICA`, `BLOQUEADA`), `source_ref/sha`, `inputs`, `artifacts`, `evidence`, `findings`, `decisions`, `tests_executed`, `blockers`, `audit_status`, `next_stage`. El orquestador exige evidencia para `COMPLETADA`, razón para `NO_APLICA` y causa para `BLOQUEADA`.

No crear bypass de quality gates. EE-DOC-010 manda sobre gates de cambio/merge; EE-DOC-015 sobre validación del ecosistema. El agente no autoaprueba sus pruebas ni PR. Mantainer solo manual.
