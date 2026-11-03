# Pruebas de aceptación del catálogo (escenarios manuales)

| Caso | Entrada                                  | Resultado exigido                                                                                                                                                              |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01  | GitHub conectado, SHA verificable        | `GITHUB_PINNED`, mismas referencias por ejecución, sin escrituras remotas                                                                                                      |
| A02  | GitHub caído, inventario local           | Solo archivos fuera de `docs/`; documentación queda NO_VERIFICABLE sin `.md`                                                                                                   |
| A03  | Checkout local escribible autorizado     | `LOCAL_WRITE`, hashes de base, diff y evidencias                                                                                                                               |
| A04  | Sin checkout local                       | ZIP `ARTIFACT_EXPORT` completo, rutas relativas exactas y manifest                                                                                                             |
| A05  | Hash base del archivo difiere            | No reemplazar; reportar CONFLICTO y propuesta de reconciliación                                                                                                                |
| A06  | Hallazgo sin norma/verificación          | NO_VERIFICABLE, no conformidad inventada; propuesta AUDIT                                                                                                                      |
| A07  | Gate no ejecutado                        | NO_EJECUTADO, nunca PASS                                                                                                                                                       |
| A08  | Etapa omitida por inaplicabilidad        | NO_APLICA con razón; mantenedor nunca auto-invocado                                                                                                                            |
| A09  | Skill invocada no disponible             | BLOQUEADA o ejecución equivalente documentada, no marcar skill como ejecutada                                                                                                  |
| A10  | Solicitud de escribir a remoto           | Rechazar en el contexto del workflow; exportar/local y seguir proceso humano externo                                                                                           |
| A11  | Auditoría con reporte persistente        | Archivo `EE-AUDIT-<scope-kebab-case>-<YYYYMMDDHHmmss>.md` en `docs/validation/audit/reports/`; Log lo referencia y Rules solo registra regla/backlog pertinente                |
| A12  | Reporte con hallazgos repetidos y nuevos | Reutilizar IDs equivalentes y vincular backlog aplicable; no duplicar Rules; proponer solo reglas/backlog realmente nuevos; dejar el resto como `REPORT_ONLY` en reporte y Log |

Ejecución de escenarios con conector, archivos reales y casos de conflicto es **pendiente**, aunque la integridad estructural del paquete sea validada.
