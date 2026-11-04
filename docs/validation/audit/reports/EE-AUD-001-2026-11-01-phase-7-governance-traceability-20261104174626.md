# EE-AUD-001-2026-11-01-phase-7-governance-traceability — Fase 7: Gobierno y trazabilidad documental

## Metadatos

| Campo                  | Valor                                              |
| :--------------------- | :------------------------------------------------- |
| Repositorio            | EQ-LABS-TECH/ee-monorepo                           |
| ID de auditoría        | EE-AUD-001                                         |
| Fecha de inicio        | 2026-11-01                                         |
| Fase                   | 7                                                  |
| Modo                   | repository / governance                            |
| Ref y commit base      | main — 03a1b34661a094e15338fa249bbd7ad45efc5971    |
| Fecha de auditoría UTC | 2026-11-04 17:46:26                                |
| Procedencia            | GITHUB_PINNED; checkout local coincidente y limpio |
| Persistencia           | LOCAL_WRITE                                        |
| Publicación            | PENDIENTE DE PUBLICACIÓN                           |

## 1. Alcance y conclusión

Se revisaron AUD-08, AUD-39, AUD-40, AUD-41 y AUD-42 contra RFC-003, EE-DOC-002, EE-DOC-005, EE-DOC-007, EE-DOC-013, EE-DOC-014, EE-TEC-002, los registros AUDIT, la implementación PN-017 y los rulesets remotos. La revisión remota fue de solo lectura. No se cambió configuración de GitHub.

RFC-003 permanece **Propuesto y abierto** intencionalmente mientras dura la auditoría; sus cambios se aprueban individualmente. El bypass permanente del rol Repository admin está activo y continúa siendo una excepción de bootstrap sin cierre verificado. El ruleset nativo exige una aprobación y CODEOWNERS, mientras que el Required Check `PR Governance` aplica el umbral dinámico de una aprobación para `ORDINARY` y dos para `CRITICAL`. EE-ADR-006 corresponde a Referencias, no a Dependencias, conforme a AR-2026-020.

Los cambios documentales de esta rama son `LOCAL_WRITE`. No se declara la fase publicada ni se cierra la excepción administrativa.

## 2. Hallazgos y evidencia

| ID     | Evidencia                                                                                                                                                                      | Resultado                                                                                                                                                                                                                                                                                                                | Acción / estado                                                                                                                                                                |
| :----- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUD-08 | EE-DOC-001 §09.2; RFC-003 §02.3 y §12                                                                                                                                          | El estado global Propuesto y abierto es deliberado. Las filas de historial registran aprobaciones individuales por versión.                                                                                                                                                                                              | Sin cambio de estado. Se conserva abierto hasta el cierre de auditoría; PN-005/PN-013 no se cierran por avance de implementación.                                              |
| AUD-39 | Ruleset remoto activo `Protect main`; rulesets activos de creación e inmutabilidad de tags `v*`; EE-DOC-007 §§07.18, 13.22–13.24; EE-TEC-002 §06, W-P03-001                    | `Protect main` permite bypass `always` al rol Repository admin. El ruleset de creación permite a la App de release crear tags `v*`; actualización y eliminación están bloqueadas sin bypass. La excepción single-operator está registrada, pero su cierre con segundo maintainer o excepción fechada no está verificado. | PN-019 y PN-030 continúan abiertos. Se sincronizaron localmente los estados de configuración en EE-DOC-007; no se cambió el ruleset ni se verificó el uso efectivo del bypass. |
| AUD-40 | Ruleset remoto `Protect main`; required checks `Validate` y `PR Governance`; EE-DOC-005 §08.3 R3; EE-DOC-007 §07.10.1; `packages/governance/src/pr-governance/enforcement.mjs` | El ruleset nativo requiere una aprobación y revisión CODEOWNERS. El check requerido `PR Governance` implementa el umbral por clasificación: `ORDINARY` = 1; `CRITICAL` = 2 aprobaciones calificadas distintas. El valor nativo no reduce el umbral funcional.                                                            | Umbral efectivo verificado; PN-017 marcado completo en el registro. EE-DOC-005 se sincronizó localmente para explicitar el contrato.                                           |
| AUD-41 | EE-DOC-013 metadata y §§15–16; EE-ADR-006; EE-DOC-002 §05; AR-2026-020                                                                                                         | EE-ADR-006 afecta la frontera reflejada en §04.2 y consta en el historial, pero no estaba en Referencias. No es requisito adicional para validez o aplicación que justifique Dependencias.                                                                                                                               | EE-ADR-006 añadido a Referencias de EE-DOC-013; no se añadió a Dependencias. Cambio local, pendiente de publicación.                                                           |
| AUD-42 | EE-DOC-014 metadata y §§04.5, 12–13; EE-ADR-006; EE-DOC-002 §05; AR-2026-020                                                                                                   | EE-DOC-014 cita ADR-006 en §04.5 e historial, pero no en Referencias ni Dependencias. Corresponde a Referencias.                                                                                                                                                                                                         | EE-ADR-006 añadido a Referencias de EE-DOC-014; no se añadió a Dependencias. Cambio local, pendiente de publicación.                                                           |

## 3. Cambios documentales preparados

- EE-DOC-005 §08.3 R3 aclara que `PR Governance` aplica las dos aprobaciones exigidas para `CRITICAL` aunque el mínimo nativo del ruleset sea uno.
- EE-DOC-007 §§07.18, 09.21, 12.19, 13.22–13.24 y el estado de implementación describen el estado as-built de rulesets, checks y bypass; mantienen pendiente el cierre de W-P03-001.
- EE-DOC-013 §15 y EE-DOC-014 §12 incluyen EE-ADR-006 en Referencias. Sus campos Dependencias permanecen sin cambios.
- Los cuatro documentos congelados recibieron una nueva fila de historial y cambios únicamente en `Versión` y `Última revisión` de sus metadatos, además de las modificaciones aprobadas al cuerpo.

## 4. Límites

La configuración remota demuestra capacidad de bypass, no que un actor la haya usado. La consulta de la API de Branch Protection legacy respondió HTTP 403; el as-built confirmado corresponde a la API de Rulesets. La auditoría no evaluó registros de uso de bypass, aprobación de excepciones, secretos de organización ni ejecución real de publicación. No se modificó EE-DOC-001. No se ejecutaron tests ni quality gates.

## 5. Trazabilidad AUDIT

- PN-017: marcado cumplido según el check requerido y la política dinámica verificados.
- PN-019: permanece abierto hasta verificar el cierre del bypass single-operator o una excepción fechada.
- PN-030: permanece abierto; el bypass administrativo y otros controles de release exceden el cierre de esta revisión.
- PN-035: parcial; las referencias están agregadas localmente conforme a AR-2026-020, publicación pendiente.
- No se creó una regla emergente nueva. AUD-08 conserva el estado global de RFC-003 abierto hasta el fin de la auditoría.

BASE 03a1b34661a094e15338fa249bbd7ad45efc5971
AUDIT LOG: docs/validation/audit/EE-AUD-Log_Progress_Register.md — entrada local agregada.
RULES: PN-017, PN-019, PN-030 y PN-035 reutilizados; no se creó regla nueva.
PUBLICACIÓN: PENDIENTE DE PUBLICACIÓN.
VALIDACIÓN: revisión estática y `git diff --check`; tests y quality gates no ejecutados.
