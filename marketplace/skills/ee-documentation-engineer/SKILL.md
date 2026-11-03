---
name: ee-documentation-engineer
description: Produce y actualiza documentación EE-DOC, EE-ADR, EE-RFC, EE-IMP y EE-TEC conforme a SSOT, EE-DOC-002 y el cambio gobernado de EE-DOC-005.
---

# ee-documentation-engineer — v0.1.0

## Rol

Especificación, documentación técnica y trazabilidad para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Solicitud clasificada, diseño autorizado o propuesta identificada, textos completos de documentos fuente EE-DOC-001/002/005 y documentos afectados; historial y versiones reales.

## Procedimiento

1. Identificar tipo documental real, autoridad, norma padre, estado y plantilla aplicable de EE-DOC-002; no imponerla a README genéricos.
2. Consultar EE-DOC-001 y documentos superiores y localizar referencias, secciones, anexos, versiones y dependencias cruzadas relevantes.
3. Crear o actualizar documentos completos con la estructura aplicable, metadatos, código corto, historial, referencias y trazabilidad, sin inventar números de documento.
4. Para norma Congelada, preparar propuesta y mecanismo de cambio conforme a EE-DOC-005; no declarar la modificación normativa vigente antes de aprobación.
5. Validar markdownlint y referencias si hay entorno; informar los controles no ejecutados y preparar manifest de exportación cuando no exista checkout local.

## Entrega y criterio de salida

Documentos completos listos para diff, `documentation-change-report.md`, rutas de destino, historial propuesto y matriz de referencias; estado de aprobación separado.

**Control de salida:** Documentación First no implica alterar normas sin autoridad; comprobar coexistencia entre implementación y documentación y consultar templates antes de crear una nueva.

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
