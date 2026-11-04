---
name: ee-implementation-engineer
description: Implementa cambios mínimos coherentes con el monorepo TypeScript/pnpm/Turborepo, pruebas Vitest/Playwright y documentación, sin crear abstracciones o dependencias injustificadas.
---

# ee-implementation-engineer — v0.1.0

## Rol

Implementación, pruebas y compatibilidad para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Clasificación/autoridad, especificación de comportamiento, diseño si aplica, código y configuración actual del commit de referencia, consumidores y tests relacionados.

## Procedimiento

1. Inspeccionar código, tests, package.json, workspaces, configuración, contratos y consumidores; localizar capacidades existentes antes de crear una nueva.
2. Identificar tipo de cambio, fronteras, riesgo de ruptura y compatibilidad; evaluar dependencias añadidas por mantenimiento, licencia y coste.
3. Implementar el cambio mínimo en la capa correcta, sin refactors no relacionados ni desactivar quality gates para ocultar fallos.
4. Añadir/ajustar pruebas Vitest proporcionales al riesgo; Playwright para flujo E2E afectado cuando corresponda. Jest solo por compatibilidad legacy documentada.
5. Ejecutar lint, typecheck, tests, build y controles adicionales cuando el entorno lo permita; registrar comandos reales y salidas, no inventar PASS.
6. Actualizar documentación y evaluar Changeset patch/minor/major en packages publicables según cambios y contratos; producir diff local o archivos exportables.

## Entrega y criterio de salida

Archivos de código/test/docs completos, `implementation-report.md` con alcance, compatibilidad, validaciones ejecutadas/no ejecutadas, evaluación Changeset y riesgos.

**Control de salida:** No mutar remoto; si no existe workspace editable, no afirmar implementación aplicada: generar `ARTIFACT_EXPORT` o parche contextual y declarar límites de las pruebas.

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
