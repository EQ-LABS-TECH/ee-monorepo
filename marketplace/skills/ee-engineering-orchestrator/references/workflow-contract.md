# Contrato de las ocho etapas

Este procedimiento es **operativo**, subordinado a los EE-DOC vigentes, no un estándar normativo nuevo. Un cambio de tipo puede excluir etapas con razón documentada; la ausencia de skill instalada nunca justifica `NO_APLICA`.

| Paso | Capacidad / skill esperada       | Insumo indispensable                    | Resultado mínimo verificable                                          | Bloqueo                                               |
| ---- | -------------------------------- | --------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| 01   | `ee-change-governance`           | Solicitud, norma vigente, alcance       | Clasificación, riesgo, mecanismos/autoridad y criterios de aceptación | Decisión gobernada sin autorización                   |
| 02   | `ee-engineering-auditor` inicial | Contexto y fuentes comprobadas          | Estado previo, riesgos, hallazgos identificados y fuentes             | No se puede evaluar premisa esencial                  |
| 03   | `ee-architecture-designer`       | Resultado 01/02, arquitectura existente | Ubicación, dependencias, alternativas, decisión y ADR/RFC si procede  | Frontera/contrato crítico no resuelto                 |
| 04   | `ee-documentation-engineer`      | Decisión y documentación SSOT           | Especificación alineada o `NO_APLICA` motivado                        | Norma obligatoria ausente/no aprobada                 |
| 05   | `ee-implementation-engineer`     | Contratos y criterios                   | Diff, pruebas, compatibilidad, impacto de Changeset                   | Breaking change no gobernado                          |
| 06   | `ee-validation-engineer`         | Diff y matrices de gates aplicables     | Estado real de cada gate, evidencia, entorno y remediación            | Gate obligatorio FAIL sin mecanismo válido            |
| 07   | `ee-engineering-auditor` final   | Diff, docs y evidencias                 | Hallazgos reconciliados y destino AUDIT verificable                   | Inconsistencia severa abierta o trazabilidad faltante |
| 08   | `ee-pr-reviewer`                 | Base/head PR, resultados 01–07          | Revisión independiente y recomendación fundada                        | Falta evidencia exigida para declarar listo           |

## Matriz simplificada de aplicabilidad

- **Feature/refactor con impacto:** evaluar 01–08. Pasos 03 y 04 pueden ser `NO_APLICA` únicamente con justificación y fuentes.
- **Bug fix local:** 01, 02, 05, 06, 07, 08; evaluar 03 y 04 según impactos.
- **Auditoría sin cambios:** 01 (clasificación de alcance), 02 y 07 (registro); 03–06 y 08 solo si procede. La auditoría final no presupone ejecución de código.
- **Revisión de PR ya existente:** evaluar 01 y 02; recuperar resultados reales de 03–07 o señalarlos pendientes; 08 como objetivo principal. No volver a implementar sin solicitud.
- **Cambio normativo:** 01–04 son centrales y respetan EE-DOC-005; 05 si hay implementación y 06 si hay validación aplicable; 07/08 según alcance.

## Cambios de ruta

1. Problema detectado en validación → corregir etapa 05 y repetir 06; renovar 07 y 08 si cambia el diff.
2. Contradicción normativa → volver a 01 y 03 antes de autorizar cambios en 04/05.
3. Hallazgo nuevo del auditor final → documentar trazabilidad y volver al paso mínimo impactado.
4. No confundir resultado documental `CONFORME` con PASS de CI o EE-VAL.
