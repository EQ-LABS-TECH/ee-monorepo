# Contrato de ejecución portable (catálogo EE-LABS)

Este archivo es una copia operacional autocontenida de las reglas centrales de `marketplace/skills/contract.md` para distribución individual. Cuando se usa desde el monorepo, prima la versión vigente de `contract.md` y la documentación superior.

## Origen de datos

Primero acceder por GitHub autorizado a `EQ-LABS-TECH/ee-monorepo` en `main`, fijar SHA de commit real cuando posible y leer normas vigentes del mismo ref. Si falla, `Paquetes_Archivos_Monorepo.md` solo describe contenido **fuera de `docs/`**; `docs/` exige Markdown separado. Estado de fuente: `GITHUB_PINNED`, `GITHUB_UNPINNED` con limitación, o `SNAPSHOT_FALLBACK`. No inventar lectura ni SHA.

## Escritura y exportación

Nunca escribir al remoto ni a `main`. Solo `LOCAL_WRITE` en checkout local autorizado y escribible; si no existe, `ARTIFACT_EXPORT` ZIP con árbol relativo exacto, archivos completos y `manifest.json` (schema en `marketplace/skills/contract.md` del repositorio). No tratar entrega ZIP como escritura local. Comprobar hash base antes de reemplazo; si difiere, detener y preparar diff para conciliación. No borrar archivos ni ejecutar comandos destructivos sin advertencia y revisión.

Cada reporte detallado de auditoría se guarda en `docs/validation/audit/reports/` como `EE-AUDIT-<scope-kebab-case>-<YYYYMMDDHHmmss>.md`; el timestamp se genera en UTC. En `ARTIFACT_EXPORT`, incluirlo bajo la misma ruta relativa dentro del ZIP.

## Hallazgos y evidencias

Rutas/IDs deben existir o quedar `NO_VERIFICABLE`. Mantener los tres artefactos canónicos separados: `Criteria` contiene criterios y no recibe hallazgos ordinarios; `Log` registra la auditoría y referencia el reporte; `Rules` contiene reglas emergentes y backlog pertinente, no el detalle completo de cada hallazgo. No añadir reglas duplicadas ni alterar criterios normativos sin gobernanza. `PROPUESTO_LOCAL`, `EXPORTADO` y `PUBLICADO_VERIFICADO` son diferentes.

## Gobernanza

EE-DOC-001..003 por encima de normas especializadas; EE-DOC-005 para workflow, EE-DOC-006 para estructura, EE-DOC-010 para QG de merge, EE-DOC-015 para ecosistema, EE-DOC-013 para IA. ADR/RFC subordinados según jerarquía real. Human-in-the-loop. `ee-skill-maintainer` solo manual.
