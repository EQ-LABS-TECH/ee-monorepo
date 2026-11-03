# Auditoría de ingeniería — ejecución por dominio

Aplicar `audit-modes.md` primero y evaluar solo controles pertinentes a los artefactos inspeccionados.

1. Fijar `main` SHA y obtener datos efectivos de GitHub, o usar respaldo acotado de `source-resolution.md`.
2. Comprobar documentos AUDIT (tres archivos) y las normas pertinentes sin confundir resumen de skill con norma vigente.
3. Revisar archivos, workspaces, paquetes, contratos y dependencias existentes antes de proponer módulos o APIs.
4. Código: tipos, comportamiento, seguridad, APIs, errores, observabilidad y regresiones. Distinguir defecto real de preferencia.
5. Arquitectura: frontera EE-LABS vs Product Ecosystem/Business Application; dependencias permitidas, ausencia de ciclos y ADR/RFC vigentes.
6. Calidad: evidencia de lint, typecheck, Vitest, Playwright, build, validación de docs, seguridad y CI en el SHA objetivo; gates no ejecutados se reportan como tales.
7. Compatibilidad/impacto: consumidores, cambios semánticos, documentación, Changesets cuando sean pertinentes.
8. Emitir hallazgos según `evidence-and-traceability.md`, trazados y deduplicados en `audit-transaction.md`.

## No extrapolar del respaldo

`Paquetes_Archivos_Monorepo.md` representa inventario fuera de `docs/` y **solo cuando no hay GitHub**. No contiene código completo verificable ni documentos de `docs/`; no lo exigir cuando GitHub funciona. Para `docs/` usar GitHub o los `.md` individualmente facilitados. Ninguna fuente parcial demuestra ausencia universal.

## Reporte técnico

Contexto/fuentes; ámbito; hallazgos por severidad; relación norma→implementación; impacto y consumidores; evidencias; gates ejecutados y no ejecutados; estado AUDIT; acciones priorizadas. Los resultados de código no equivalen a «auditado» C1–C8.
