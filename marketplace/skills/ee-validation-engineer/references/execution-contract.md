# Contrato de ejecución portable (catálogo EE-LABS)

Este archivo es una copia operacional autocontenida de las reglas centrales de `marketplace/skills/contract.md` para distribución individual. Cuando se usa desde el monorepo, prima la versión vigente de `contract.md` y la documentación superior.

## Origen de datos

Primero acceder por GitHub autorizado a `EQ-LABS-TECH/ee-monorepo` en `main`, fijar SHA de commit real cuando posible y leer normas vigentes del mismo ref. Si falla, `Paquetes_Archivos_Monorepo.md` solo describe contenido **fuera de `docs/`**; `docs/` exige Markdown separado. Estado de fuente: `GITHUB_PINNED`, `GITHUB_UNPINNED` con limitación, o `SNAPSHOT_FALLBACK`. No inventar lectura ni SHA.

## Escritura y exportación

Nunca escribir al remoto ni a `main`. Solo `LOCAL_WRITE` en checkout local autorizado y escribible; si no existe, `ARTIFACT_EXPORT` ZIP con árbol relativo exacto, archivos completos y `manifest.json` (schema en `marketplace/skills/contract.md` del repositorio). No tratar entrega ZIP como escritura local. Comprobar hash base antes de reemplazo; si difiere, detener y preparar diff para conciliación. No borrar archivos ni ejecutar comandos destructivos sin advertencia y revisión.

## Hallazgos y evidencias

Rutas/IDs deben existir o quedar `NO_VERIFICABLE`. Registrar descubrimientos de auditoría en propuestas de los tres artefactos canónicos `EE-AUD-Criteria_Audited_Definition.md`, `EE-AUD-Log_Progress_Register.md`, `EE-AUD-Rules_Register.md`, según finalidad; no añadir reglas emergentes duplicadas ni alterar criterios normativos sin gobernanza. `PROPUESTO_LOCAL`, `EXPORTADO` y `PUBLICADO_VERIFICADO` son diferentes.

## Gobernanza

EE-DOC-001..003 por encima de normas especializadas; EE-DOC-005 para workflow, EE-DOC-006 para estructura, EE-DOC-010 para QG de merge, EE-DOC-015 para ecosistema, EE-DOC-013 para IA. ADR/RFC subordinados según jerarquía real. Human-in-the-loop. `ee-skill-maintainer` solo manual.
