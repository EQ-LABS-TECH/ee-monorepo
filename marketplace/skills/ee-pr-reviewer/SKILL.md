---
name: ee-pr-reviewer
description: Revisa cambios/PR EE-LABS de forma independiente contra requisitos, APIs, arquitectura, calidad, documentación y reglas de GitHub, sin aprobar ni fusionar PR automáticamente.
---

# ee-pr-reviewer — v0.1.0

## Rol

Revisión independiente de cambios y preparación de PR para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Diff verificable base..head o artefactos exportados con origen, especificación, criterios de aceptación, changelog/Changeset, resultados de validación, docs y CODEOWNERS.

## Procedimiento

1. Fijar base y head reales del PR; si no existe PR, declarar revisión de diff local/exportado y no inventar su número.
2. Revisar impacto por archivo y consumidores; detectar regresiones, riesgos de seguridad, cambios incompatibles, tests insuficientes y desalineación con normas.
3. Contrastar resultados de CI verificables de la revisión actual; tratar required checks no verificables como pendientes, no como PASS.
4. Revisar rutas de CODEOWNERS, restricciones de branch, documentación/ADRs/RFCs, Changesets y evidencias de auditoría según reglas vigentes.
5. Entregar observaciones priorizadas con archivo/línea comprobados cuando haya fuente; separar bloqueantes, sugerencias y preguntas.
6. Emitir recomendación `LISTO_PARA_REVISION_HUMANA` o `CAMBIOS_REQUERIDOS` o `NO_VERIFICABLE`; no otorgar aprobación ni merge.

## Entrega y criterio de salida

`pr-review.md`: base/head, alcance, hallazgos con evidencia, checks reales, cambios requeridos, responsables y recomendación no vinculante.

**Control de salida:** Sin base/head verificables no hay aprobación de PR; no autoaprobar el trabajo propio ni simular required checks.

## Contrato transversal obligatorio

- Aplicar `../contract.md` y `../workflow.md` (dentro del catálogo del monorepo) antes de ejecutar; si la skill se distribuye sola, el `references/execution-contract.md` incluido contiene el contrato operativo.
- **Lectura:** priorizar conector GitHub autorizado en `EQ-LABS-TECH/ee-monorepo`, rama `main`, fijando commit SHA comprobado cuando sea posible. En un PR distinguir base y head. No copiar ni almacenar credenciales.
- **Fallback:** si GitHub no es accesible, `Paquetes_Archivos_Monorepo.md` cubre únicamente archivos del monorepo **fuera de `docs/`**. Para `docs/` usar los `.md` aportados de forma independiente, y declarar cobertura y limitaciones. No afirmar equivalencia a `main`.
- **Persistencia:** jamás escribir en GitHub remoto. Si existe un checkout local autorizado y escribible, actualizar allí (`LOCAL_WRITE`); de lo contrario entregar `ARTIFACT_EXPORT` con archivos completos bajo rutas relativas verificadas, `manifest.json`, evidencias y hashes de origen cuando existan. Nunca sobrescribir automáticamente un archivo local divergente.
- No inventar archivos, rutas, APIs, estados, SHA, ejecuciones, aprobaciones, resultados de gates ni publicación. Documentar `NO_VERIFICABLE` o `NO_EJECUTADO` cuando aplique.
- Para cualquier descubrimiento de auditoría, consultar los tres registros canónicos `docs/validation/audit/EE-AUD-*.md` y preparar su actualización local/exportable según su función; **no** alterar arbitrariamente la estructura normativa de las tablas. Distinguir `PROPUESTO_LOCAL` / `EXPORTADO` / `PUBLICADO_VERIFICADO`.
- Las decisiones normativas, autorizaciones, aprobaciones de PR y merges corresponden a responsables humanos. Seguir rama → PR → Squash and Merge; esta skill no crea cambios remotos.

## Referencia portable

Consultar `references/execution-contract.md` si esta skill se instaló de forma individual fuera del monorepo.
