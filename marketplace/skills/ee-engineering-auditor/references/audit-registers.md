# Documentos AUDIT obligatorios y persistencia de descubrimientos

## Fuentes canónicas en `main`

Intentar leer íntegros sobre un mismo SHA antes de la auditoría y antes de preparar actualizaciones. Sin GitHub, obtener los tres `.md` por separado: el inventario de respaldo no contiene `docs/`. Si faltan, declararlo y no afirmar que se contrastó el registro:

1. [EE-AUD-Criteria_Audited_Definition.md](https://github.com/EQ-LABS-TECH/ee-monorepo/blob/main/docs/validation/audit/EE-AUD-Criteria_Audited_Definition.md) — criterios C1–C8, veredictos, severidades, política de trabajo; gobierna cuándo un documento puede marcarse **auditado**.
2. [EE-AUD-Log_Progress_Register.md](https://github.com/EQ-LABS-TECH/ee-monorepo/blob/main/docs/validation/audit/EE-AUD-Log_Progress_Register.md) — progreso por documento, versión auditada, estado, veredicto, hallazgos, fecha y notas. Para auditorías de código o repo, registrar en **Auditorías técnicas y artefactos** el alcance, commit base, informe, estado, hallazgos/reglas, fecha y notas. No clasificarlas como auditorías C1–C8.
3. [EE-AUD-Rules_Register.md](https://github.com/EQ-LABS-TECH/ee-monorepo/blob/main/docs/validation/audit/EE-AUD-Rules_Register.md) — índice no normativo del corpus y trazabilidad `AR-YYYY-NNN` de reglas detectadas. No crear una entrada nueva cuando ya existe equivalente: cotejar IDs y estado de incorporación.
4. [EE-AUD-Backlog_Register.md](https://github.com/EQ-LABS-TECH/ee-monorepo/blob/main/docs/validation/audit/EE-AUD-Backlog_Register.md) — trabajo pendiente y su evidencia con IDs `PC-*`, `PN-*`, `PA-*`; reutilizar las entradas existentes y conservar su estado verificable.

Fuentes relacionadas: [docs/validation/README.md](https://github.com/EQ-LABS-TECH/ee-monorepo/blob/main/docs/validation/README.md), EE-DOC-001, EE-DOC-002, EE-DOC-005, EE-DOC-006, EE-DOC-010 y EE-DOC-015 según el alcance. Los links remotos indican identidad, **no demuestran** que se haya leído el contenido vigente: se debe consultar en ejecución.

## Matriz de descubrimientos → artefactos

| Descubrimiento                                                 | Dónde registrar                                                               | Condición                                                                                                         |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Toda auditoría documental, incluidas fallidas/incompletas      | `EE-AUD-Log_Progress_Register.md`                                             | Registrar estado y evidencia sin marcar `auditado` cuando no cumple C1–C8                                         |
| Hallazgo documental concreto                                   | Reporte detallado en `docs/validation/audit/reports/` y ruta en notas del Log | Mantener severidad, evidencia, causa y acción; enlazar `AR-*` desde Rules y `PC/PN/PA-*` desde Backlog si aplican |
| Nueva regla, convención, excepción o ausencia normativa        | `EE-AUD-Rules_Register.md` y referencia en Log y reporte                      | Reutilizar `AR-*` equivalente; crear una sola propuesta nueva si no existe duplicado                              |
| Trabajo que requiere seguimiento y criterio de cierre          | `EE-AUD-Backlog_Register.md` y referencia en Log y reporte                    | Reutilizar `PC-*`, `PN-*` o `PA-*` equivalente; no duplicar tareas                                                |
| Hallazgo de código, arquitectura, seguridad, CI o dependencias | Reporte detallado en `docs/validation/audit/reports/` y referencia en Log     | No etiquetar como auditoría documental C1–C8 ni copiar el detalle completo a Rules o Backlog                      |
| Desviación de gate/validación formal                           | Documento EE-VAL/EE-WAIVE cuando aplique, además de enlace desde AUDIT        | Respetar EE-DOC-010/015; `SKIPPED` no es `PASS`                                                                   |
| Cambio transversal o normativo requerido                       | Referencia en AUDIT a ADR/RFC/Aclaración/Especialización Técnica              | Ninguna regla emergente se promueve automáticamente a norma                                                       |

## Transacción de auditoría (no se omite)

Clasificar cada hallazgo según `audit-transaction.md`: se pueden reutilizar IDs y asociar una acción de backlog cuando corresponda; `REPORT_ONLY` queda solo en el reporte y su referencia del Log. Rules no es una copia de los reportes.

1. Recuperar AUDIT log + reglas + criterios sobre el mismo ref/SHA (o declarar limitaciones).
2. Inventariar y deduplicar todos los hallazgos respecto de entradas existentes; cada uno debe tener ID local estable, alcance y evidencia.
3. Preparar las modificaciones de **Log** por cada objetivo, las de **Rules** solo cuando surjan reglas nuevas y las de **Backlog** cuando cambie una acción, su evidencia o estado. Conservar histórico, no sobrescribir conclusiones de auditorías anteriores ni alterar estados sin comprobación.
4. Contrastar criterios C1–C8; `NO CONFORME` si hay Bloqueantes/Críticos abiertos o Mayores sin plan; `CONFORME CON OBSERVACIONES` solo bajo condiciones normativas; `CONFORME` si cumple. No confundir resultado técnico con `Auditado`.
5. Al iniciar una campaña, asignar un ID secuencial de tres dígitos y fijar su fecha de inicio. Guardar el reporte general como `EE-AUD-<NNN>-<YYYY-MM-DD>-<scope-kebab-case>-<YYYYMMDDHHmmss>.md`; los reportes de fase insertan `phase-<n>` antes del alcance. Reutilizar ID y fecha de inicio en toda la campaña; el timestamp identifica la ejecución y es UTC. Enlazar cada informe desde el Log y preservar la ruta en la exportación.
6. Cuando haya permiso de escritura y solicitud explícita, crear rama desde `main`, agregar cambios AUDIT y cualquier reporte/evidencia pertinente en PR, jamás commit directo a `main`.
7. Si falta permiso de escritura, entregar **parches Markdown o diff** listos para PR, con ruta de destino y estado `PENDIENTE DE PUBLICACIÓN`. No presentar un reporte aislado como registro persistido.
8. El informe final debe mostrar: (a) hallazgos y evidencia; (b) qué filas o entradas de AUDIT se modificaron o se proponen; (c) qué reglas nuevas se registraron o por qué no hay ninguna; (d) SHA base y estado `PUBLICADO` / `PR ABIERTO` / `PENDIENTE DE PUBLICACIÓN`.

## Regla de consistencia

El log puede estar atrasado respecto de versiones actuales: NO reescribir una fila de versión auditada con la versión actual sin ejecutar su nueva auditoría. Registrar la diferencia como posible desfase y plan de reauditoría. Nunca inventar IDs AR ni resultados.

## Procedimiento operacional v0.4.0

Aplicar también `audit-transaction.md` (publicación atómica lógica, confirmación en `main`, diferenciar `PENDIENTE DE PUBLICACIÓN` / `PR ABIERTO` / `PUBLICADO`).
