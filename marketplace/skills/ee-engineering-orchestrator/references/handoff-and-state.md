# Handoff, procedencia y estados de la ejecución

## Identificador de sesión

Generar un identificador local de ejecución únicamente para correlación, **no** como ID canónico de hallazgo, versión documental o referencia GitHub. Indicar momento y zona horaria observados si están disponibles; no inventar SHA.

## Contexto compartido

- `request`: objetivo, límites, criterios de aceptación, aprobaciones humanas.
- `source`: repo, ref/SHA comprobado o `SNAPSHOT_FALLBACK`, origen de cada archivo, alcance excluido, datos no verificables.
- `stage`: número, capacidad, estado, inputs, outputs, evidencias, impedimentos.
- `change`: paths realmente modificados, consumidores y contratos afectados, cambiosets/ADR/RFC.
- `validation`: controles aplicables, comandos realmente ejecutados, resultado original, evidencia y fecha/ref; no confundir lectura de un resultado con ejecución.
- `audit`: hallazgo → evidencia → norma → registro AUDIT existente/actualización propuesta → estado de publicación.
- `review`: diff base/head, bloqueos residuales, decisión humana pendiente.

## Reglas de estado

| Estado       | Significado                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `PENDIENTE`  | Aún no iniciado o sin skill/capacidad suficiente; explicar dependencia   |
| `EN_CURSO`   | Trabajo iniciado, evidencia incompleta                                   |
| `COMPLETADA` | Salida exigida obtenida y verificada                                     |
| `NO_APLICA`  | No corresponde a este tipo de trabajo; justificación obligatoria         |
| `BLOQUEADA`  | No puede progresar legítimamente por un hallazgo o autorización faltante |

No declarar `COMPLETADA` en función de una intención, una propuesta o una verificación no realizada. Distinguir `PROPUESTO`, `PR ABIERTO`, `PUBLICADO` para escrituras de AUDIT; nunca afirmar `PUBLICADO` sin confirmar lectura en remoto.

## Documentos AUDIT

Consultarlos en cada auditoría aplicable desde la misma revisión disponible:

- `docs/validation/audit/EE-AUD-Criteria_Audited_Definition.md`
- `docs/validation/audit/EE-AUD-Log_Progress_Register.md`
- `docs/validation/audit/EE-AUD-Rules_Emerging.md`

`Criteria` define el criterio de auditoría documental; `Log` su progreso; `Rules Emerging` inventaría reglas candidatas. No usar estos archivos para redefinir Quality Gates o crear automáticamente estados documentales nuevos. Si existe hallazgo de código, relacionarlo con el área/documento afectado y dejar propuesta concreta conforme al esquema real de registros; no insertar tablas de esquema inventado. No duplicar reglas existentes ni marcar `auditado` sin satisfacer C1–C8.

## Protocolo de finalización

Presentar estado de ocho etapas, resultados relevantes, bloqueantes, referencias a cambios/diffs y pruebas; indicar explícitamente si hubo escritura en GitHub o solo archivos locales. Indicar siguiente punto de aprobación humana. Un reporte de chat no sustituye los archivos ni su publicación por PR.
