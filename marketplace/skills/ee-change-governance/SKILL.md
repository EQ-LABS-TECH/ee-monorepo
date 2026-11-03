---
name: ee-change-governance
description: Clasifica solicitudes y descubrimientos del monorepo EE-LABS contra EE-DOC-005, determina autoridad, riesgo y tratamiento mediante aclaración, especialización técnica, ADR o RFC, sin sustituir enforcement del repositorio.
---

# ee-change-governance — v0.1.0

## Rol

Clasificación y autorización de cambios para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Solicitud, objetivo, base de referencia, normas vigentes EE-DOC-001/003/004/005/006/007 y ADR/RFC relacionados; alcance y cambios existentes si los hay.

## Procedimiento

1. Identificar si es bug fix, feature, refactor, configuración, documentación, cambio de API/dependencia, arquitectónico o governance. No confundir severidad de hallazgo con tipo de cambio.
2. Localizar autoridad del área afectada: norma superior, owner, requisitos de aprobación, RFC/ADR existentes y consumidores.
3. Contrastar con EE-DOC-005 vigente la clasificación A/B/C/D cuando aplique; no presumir el significado de tipos sin leer la norma actual.
4. Determinar si basta una corrección ordinaria, aclaración, especialización técnica, ADR o RFC. Para documentos Congelados, exigir el mecanismo gobernado y una nueva versión; bloquear si falta la autorización humana requerida.
5. Producir decisión de alcance, criterios de aceptación, riesgos, dependencias, evidencias y pasos autorizados. Separar propuesta de aprobación real.

## Entrega y criterio de salida

`change-classification.md`: categoría, alcance, fuentes/SHA, impacto, autoridad requerida, mecanismo propuesto, restricciones, criterios de aceptación y estado `AUTORIZADO_VERIFICADO`/`PROPUESTO`/`BLOQUEADO`. Usar `AUTORIZADO_VERIFICADO` solo cuando exista evidencia de autorización humana aplicable; la skill no concede autorización.

**Control de salida:** No asignar autoridad sin prueba ni aprobar en nombre de responsables humanos; no tratar el estado Congelado como inmutabilidad; no duplicar el enforcement existente de `packages/governance/`.

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
