---
name: ee-skill-maintainer
description: Mantiene manualmente el catálogo de skills de EE-LABS: SKILL.md, referencias, pruebas de coherencia, distribución y versionado; nunca es invocada automáticamente por el orquestador.
---

# ee-skill-maintainer — v0.1.0

## Rol

Mantenimiento manual del catálogo de skills para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Solicitud explícita del usuario, nombre de skill, código fuente actual en `marketplace/skills/`, normas de EE-DOC-006/012/013, contratos compartidos y solicitudes de cambio.

## Procedimiento

1. Confirmar invocación manual explícita; rechazar encadenamiento tácito desde el workflow ordinario.
2. Inspeccionar skills existentes, contratos compartidos y límites; evitar duplicar contenido normativo en cada skill.
3. Actualizar la skill mínima afectada, su SKILL.md, referencias y ejemplos de uso; conservar compatibilidad de nombre/ruta salvo migración aprobada.
4. Validar YAML frontmatter, rutas relativas, enlaces locales, nombres únicos, manifiesto de exportación y ausencia de credenciales.
5. Realizar pruebas de escritorio: GitHub disponible, fallback fuera de docs, no acceso local, conflicto de hash y bloqueo por skill ausente.
6. Empaquetar ZIP instalable y ZIP repo-ready desde la misma fuente y registrar lista de archivos, versión y SHA256; proponer cambios al catálogo.
7. Entregar diffs y release notes locales/exportables, sin instalar ni publicar remotamente de manera implícita.

## Entrega y criterio de salida

Skill revisada, tests de contrato, artefactos ZIP, `skill-maintenance-report.md` y cambios documentales de catálogo listos para revisión.

**Control de salida:** Prohibido activar/sustituir otras skills sin acción del usuario; nunca se ejecuta como etapa 09 del orquestador.

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
