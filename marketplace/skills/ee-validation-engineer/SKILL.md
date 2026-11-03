---
name: ee-validation-engineer
description: Coordina validaciones verificables de EE-LABS sin falsos PASS, respeta EE-DOC-010 y EE-DOC-015 y prepara evidencias con origen, entorno y resultado real.
---

# ee-validation-engineer — v0.1.0

## Rol

Quality Gates y validación del ecosistema para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Cambio implementado o exportado, commit/checkout de referencia, criterios de aceptación, catálogo vigente de EE-DOC-010, marco EE-DOC-015 y resultados reales de comandos/CI.

## Procedimiento

1. Distinguir gates de cambio/merge EE-DOC-010 de validación de ecosistema EE-DOC-015; no combinar sus taxonomías ni resultados.
2. Inventariar lint, typecheck, test, build, format check, seguridad, arquitectura, documentación y E2E aplicables y su Availability/Severity normativas.
3. Ejecutar solamente controles disponibles con permisos apropiados; registrar fecha, entorno, comando literal, exit code, output, modo caché cuando conste, base/SHA y artefactos.
4. Cuando no pueda ejecutar, consultar evidencia CI verificable de la revisión correspondiente o indicar NO_EJECUTADO; no tratar evidencia antigua como ejecución nueva.
5. Registrar waivers únicamente si están vigentes y verificados; preservar estados originales PASS/FAIL/SKIPPED/DEGRADED conforme a normas; reportar falta de datos.
6. Entregar matriz de validación y riesgos residuales, sin aprobar PR ni dictamen final de conformidad más allá de la evidencia.

## Entrega y criterio de salida

`validation-report.md`: matriz de checks y dominios, resultados reales, evidencias y enlaces verificables, waivers vigentes, riesgos, condiciones de re-ejecución.

**Control de salida:** Nunca equiparar no ejecutado con PASS; no reetiquetar SKIPPED; no confundir aceptación de merge con dictamen EE-VAL.

## Contrato transversal obligatorio

- Aplicar `../contract.md` y `../workflow.md` (dentro del catálogo del monorepo) antes de ejecutar; si la skill se distribuye sola, el `references/execution-contract.md` incluido contiene el contrato operativo.
- **Lectura:** priorizar conector GitHub autorizado en `EQ-LABS-TECH/ee-monorepo`, rama `main`, fijando commit SHA comprobado cuando sea posible. En un PR distinguir base y head. No copiar ni almacenar credenciales.
- **Fallback:** si GitHub no es accesible, `Paquetes_Archivos_Monorepo.md` cubre únicamente archivos del monorepo **fuera de `docs/`**. Para `docs/` usar los `.md` aportados de forma independiente, y declarar cobertura y limitaciones. No afirmar equivalencia a `main`.
- **Persistencia:** jamás escribir en GitHub remoto. Si existe un checkout local autorizado y escribible, actualizar allí (`LOCAL_WRITE`); de lo contrario entregar `ARTIFACT_EXPORT` con archivos completos bajo rutas relativas verificadas, `manifest.json`, evidencias y hashes de origen cuando existan. Nunca sobrescribir automáticamente un archivo local divergente.
- No inventar archivos, rutas, APIs, estados, SHA, ejecuciones, aprobaciones, resultados de gates ni publicación. Documentar `NO_VERIFICABLE` o `NO_EJECUTADO` cuando aplique.
- Para cualquier descubrimiento de auditoría, consultar los tres registros canónicos `docs/validation/audit/EE-AUDIT-*.md` y preparar su actualización local/exportable según su función; **no** alterar arbitrariamente la estructura normativa de las tablas. Distinguir `PROPUESTO_LOCAL` / `EXPORTADO` / `PUBLICADO_VERIFICADO`.
- Las decisiones normativas, autorizaciones, aprobaciones de PR y merges corresponden a responsables humanos. Seguir rama → PR → Squash and Merge; esta skill no crea cambios remotos.

## Referencia portable

Consultar `references/execution-contract.md` si esta skill se instaló de forma individual fuera del monorepo.
