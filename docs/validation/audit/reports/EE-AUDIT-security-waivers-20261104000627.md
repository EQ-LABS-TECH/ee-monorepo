# EE-AUDIT-security-waivers — Fase 1: Seguridad y vencimientos

## Metadatos

| Campo                  | Valor                                              |
| :--------------------- | :------------------------------------------------- |
| Repositorio            | EQ-LABS-TECH/ee-monorepo                           |
| Modo                   | security                                           |
| Ref y commit base      | main — 8166f80d4c4d8d5878cac66e60cce6c844939e4b    |
| Fecha de auditoría UTC | 2026-11-04 00:06:27                                |
| Procedencia            | GITHUB_PINNED; checkout local coincidente y limpio |
| Persistencia           | LOCAL_WRITE                                        |
| Publicación            | PENDIENTE DE PUBLICACIÓN                           |

## 1. Alcance y conclusión

Revisión de los waivers de QG-SEC-001 para braces y sprintf-js: justificación, alcance, autoridad, fechas de vigencia, evidencia de resolución y decisión de renovación. Se revisaron los registros AUDIT y la norma EE-DOC-010 §04.6.1. No se modificaron los documentos fuente de los waivers.

Ambos waivers vigentes en la última emisión constan como RESOLVED. Sus advisories fueron retirados por GitHub Advisory Database. La decisión es no renovar. La retirada de un advisory no significa que las versiones instaladas hayan sido corregidas: ambas dependencias siguen presentes en el árbol de desarrollo.

## 2. Evidencia de waivers y decisión

| Paquete / advisory                     | Estado documentado                                                       | Justificación y alcance verificados                                                                                                                                                                                                                  | Decisión                                                                                            |
| :------------------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| braces 3.0.3 / GHSA-vfj7-8cjw-p6xm     | RESOLVED; effective_from 2026-10-16; expires_at y resolved_at 2026-10-23 | La ruta observada es tooling de desarrollo vía plop → liftoff → findup-sync → micromatch → braces. El waiver limita el alcance a esa cadena. GitHub Advisory Database retiró el advisory el 2026-10-23 por considerarlo no prácticamente explotable. | Retirada; no renovar. El paquete permanece en dependencias de desarrollo y no se declara corregido. |
| sprintf-js 1.0.3 / GHSA-hp3w-g68c-fv3c | RESOLVED; effective_from 2026-10-16; expires_at y resolved_at 2026-10-23 | La ruta observada es packages/config/jest → Jest → @jest/transform → babel-plugin-istanbul → @istanbuljs/load-nyc-config → js-yaml → argparse → sprintf-js. GitHub Advisory Database retiró el advisory el 2026-10-22.                               | Retirada; no renovar. El paquete permanece en dependencias de desarrollo y no se declara corregido. |

Los registros iniciales del 2026-10-07 expiraban el 2026-10-14; se conservan como evidencia histórica. Los waivers posteriores fueron autorizados por Architecture según sus campos de autoridad e historial. Cada vigencia fue de siete días, dentro del máximo de EE-DOC-010 §04.6.1. La renovación no es automática: requiere evidencia de necesidad y aceptación del riesgo; en estos casos, la resolución documentada elimina la necesidad de renovar por esos advisories.

## 3. Verificación del gate

Se ejecutó pnpm audit --audit-level high desde el checkout fijado. Resultado: exit 0. La salida informó seis incidencias low/moderate (una low y cinco moderate), y ninguna high o critical. Esto es consistente con EE-DOC-010 §05.6, que define el umbral de bloqueo en high/critical.

La salida completa de pnpm audit identificó advisories distintos para deepmerge, glob y minimatch. No corresponden a los dos waivers de este alcance y no se consideran aceptados por ellos. Su evaluación individual queda fuera de AUD-01.

## 4. Hallazgo y trazabilidad AUDIT

- AUD-01: resuelto para los dos advisories revisados; no requieren renovación.
- PA-013: su criterio de cierre (“waiver vigente o advisory resuelto”) se satisface. Se registra como cumplido con evidencia de los waivers RESOLVED y la ejecución de QG-SEC-001.
- El registro histórico “Validación del checkout — 2026-10-17” se conserva sin reescritura; describe el estado observado en esa fecha.
- No se propone una regla emergente nueva.

## 5. Límites y estado de validación

La evidencia demuestra retirada de los advisories, estado RESOLVED en los waivers y presencia actual de las dependencias en cadenas de desarrollo. No demuestra una corrección o eliminación de los paquetes ni evalúa los advisories nuevos detectados por la auditoría completa. No se ejecutaron otros tests o quality gates en esta fase.

BASE 8166f80d4c4d8d5878cac66e60cce6c844939e4b
AUDIT LOG: referencia propuesta en la sección “Auditorías técnicas y artefactos”.
RULES: PA-013 reutilizado; no se creó una regla nueva.
PUBLICACIÓN: PENDIENTE DE PUBLICACIÓN.
VALIDACIÓN: pnpm audit --audit-level high ejecutado; exit 0.
