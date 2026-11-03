# Transacción AUDIT sin falsos cierres

`docs/validation/audit/` en `main` contiene las fuentes: `EE-AUDIT-Criteria_Audited_Definition.md`, `EE-AUDIT-Log_Progress_Register.md`, `EE-AUDIT-Rules_Emerging.md`. Leer su contenido actual y esquema antes de proponer cambios.

## Fases

1. **Collect** — listar todos los descubrimientos (incluidos «sin hallazgos», lagunas de evidencia y validaciones no ejecutadas), objetivo, SHA o snapshot y veredicto pendiente.
2. **Deduplicate** — contrastar el log y el inventario de reglas existentes; no asignar nuevos IDs `AR-YYYY-NNN` sin inspeccionar el correlativo vigente.
3. **Classify** — asignar a cada hallazgo uno o más destinos compatibles; `REPORT_ONLY` se usa solo cuando no corresponde ningún registro:
   - `EXISTING` — coincide con una entrada `AR-*`, `PC-*`, `PN-*` o `PA-*`; reutilizar el ID y referenciarlo desde el reporte y el Log. Puede coexistir con `BACKLOG` si la acción pendiente tiene seguimiento propio.
   - `NEW_RULE_CANDIDATE` — propone una regla emergente sin equivalente; preparar una sola entrada candidata en **Rules**, sin tratarla como norma aprobada. Puede coexistir con `BACKLOG` si requiere una acción de implementación distinta.
   - `BACKLOG` — representa trabajo pendiente; reutilizar la entrada de backlog equivalente o proponer una sola nueva si no existe.
   - `REPORT_ONLY` — hallazgo específico que no constituye regla ni acción de backlog; conservar detalle en el reporte y dejar en el Log solo resumen y ruta. No combinar con otros destinos.
4. **Map** — registrar en el **Log** el progreso de la auditoría, los destinos asignados y la ruta del reporte. Actualizar **Rules** solo para `NEW_RULE_CANDIDATE` o `BACKLOG`; nunca copiar allí el detalle completo del reporte. **Criteria** se consulta siempre, pero modificarlo exige el mecanismo de gobernanza, no cada auditoría.
5. **Prepare** — guardar el informe detallado en `docs/validation/audit/reports/` como `EE-AUDIT-<scope-kebab-case>-<YYYYMMDDHHmmss>.md` (timestamp UTC). Generar también diffs o Markdown completos compatibles con el esquema vigente de AUDIT, preservando filas e históricos. Si para código no existe entrada adecuada, proponer una sección/extensión o reporte vinculado, sin inventar que la norma ya lo autoriza.
6. **Validate** — comprobar que cada hallazgo tiene al menos un destino, que `REPORT_ONLY` no se combina con registros, que los IDs existentes se reutilizan, que no se crean duplicados, que los enlaces al reporte funcionan, y que el formato está correcto y no contiene secretos. No marcar `auditado` sin C1–C8 y log completos.
7. **Publish** — sin autorización o permisos de escritura: entregar patch para PR con `PENDIENTE DE PUBLICACIÓN`. Con autorización: rama desde `main`, propuesta de cambios, PR y espera de Squash and Merge. El PR abierto no es equivalente a publicado.
8. **Confirm** — si se hace merge, verificar el commit final y las entradas efectivamente en `main` antes de usar `PUBLICADO`. Sin confirmación, estado `PR ABIERTO`.

## Atomicidad lógica

- El informe y su vínculo AUDIT son una unidad lógica: no cerrar como auditoría registrada cuando solo existe salida de chat o archivos propuestos.
- Los reportes detallados son archivos individuales en `docs/validation/audit/reports/`; los tres registros canónicos permanecen en la raíz de `docs/validation/audit/`.
- Si la publicación falla o el SHA de `main` cambió, no sobrescribir por fuerza; refrescar, reconciliar y volver a validar.
- No modificar una versión histórica registrada del documento para sustituirla por versión reciente sin ejecutar auditoría nueva.
- Nunca convertir `SKIPPED`, `WAIVED` o `DEGRADED` a `PASS` ni usar C1–C8 de documentos para certificar código.

## Estado visible

Todo reporte termina indicando: `BASE {SHA o SNAPSHOT}`, `AUDIT LOG {ruta / cambio propuesto / enlace}`, `RULES {nueva / reutilizada / no aplica}`, `PUBLICACIÓN {PENDIENTE DE PUBLICACIÓN | PR ABIERTO | PUBLICADO}`, `VALIDACIÓN {ejecutada/no ejecutada}`.
