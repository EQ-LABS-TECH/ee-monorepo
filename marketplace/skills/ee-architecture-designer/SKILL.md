---
name: ee-architecture-designer
description: Diseña alternativas y decisiones arquitectónicas EE-LABS respetando capas, dependencias, contratos y documentación normativa; propone ADR/RFC cuando corresponde.
---

# ee-architecture-designer — v0.1.0

## Rol

Diseño, impacto y decisiones arquitectónicas para `EQ-LABS-TECH/ee-monorepo`. Esta skill guía al agente anfitrión, no ejecuta procesos autónomos ni sustituye herramientas deterministas.

## Entradas mínimas

Clasificación previa, objetivos/no objetivos, normas EE-DOC-004/005/006/013 y ADR/RFC existentes, dependencias/consumidores verificados.

## Procedimiento

1. Inspeccionar la arquitectura existente y localizar el dueño correcto de la responsabilidad dentro de foundation/shared/execution/intelligence/knowledge/governance/integration/registry/sdk/apps/connectors.
2. Construir mapa de dependencias reales; distinguir código implementado, blueprint y documentación. Revisar APIs públicas y compatibilidad.
3. Definir problema, restricciones, al menos alternativa mínima y alternativa viable si hay elección real, tradeoffs, riesgos y pruebas de aceptación.
4. Comprobar límites entre plataforma EE-LABS, Product Ecosystem y Business Application; evitar lógica de producto en plataforma y nuevos packages innecesarios.
5. Identificar si requiere ADR/RFC conforme a EE-DOC-005, preparar borrador sin aprobarlo y proponer plan de migración y rollback cuando aplique.

## Entrega y criterio de salida

`architecture-decision.md`: contexto, alternativas, decisión propuesta, impactos en capas/APIs/consumidores, compatibilidad, ADR/RFC si corresponde, evidencia y aprobaciones pendientes.

**Control de salida:** No crear un nuevo directorio top-level ni paquete por defecto; verificar el layout frente a EE-DOC-006 y los ADR/RFC antes de decidir.

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
