# EE-RFC-004 — PR Governance Review Reconciliation

Este documento sigue el estándar **EE-DOC-002 — Document Design Template**.

---

## METADATOS

| Campo                               | Valor                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**                              | EE-RFC-004                                                                                                                             |
| **Documento**                       | PR Governance Review Reconciliation                                                                                                    |
| **Código corto**                    | RFC-004                                                                                                                                |
| **Tipo**                            | Request for Comments (Cambio gobernado)                                                                                                |
| **Clasificación**                   | D — Cambio Significativo / Transversal                                                                                                 |
| **Nivel**                           | Estratégico                                                                                                                            |
| **Normativo**                       | Sí                                                                                                                                     |
| **Versión**                         | v0.2.0                                                                                                                                 |
| **Estado**                          | Aprobado                                                                                                                               |
| **Propietario**                     | Equipo de Arquitectura                                                                                                                 |
| **Documento padre**                 | EE-DOC-007                                                                                                                             |
| **Dependencias**                    | contenido=EE-DOC-005, EE-DOC-007, EE-DOC-010, EE-RFC-003                                                                               |
| **Solicitante**                     | Revisión operativa de Governance Verification en el PR #50                                                                             |
| **Documentos normativos afectados** | EE-DOC-001, EE-DOC-007; relación histórica con EE-RFC-003 §02.8.7                                                                      |
| **Documento de dominio**            | No aplica                                                                                                                              |
| **ADR asociado**                    | No requerido; el cambio coordina el contrato transversal dentro de la arquitectura Actions-only ya aprobada en EE-DOC-007 y EE-RFC-003 |
| **Aprobado por**                    | Equipo de Arquitectura                                                                                                                 |
| **Audiencia**                       | Arquitectura, Desarrollo, Maintainers, QA                                                                                              |
| **Fecha de creación**               | 2026-11-06                                                                                                                             |
| **Última revisión**                 | 2026-11-07                                                                                                                             |
| **Próxima revisión**                | 2026-12-07                                                                                                                             |

> v0.1.0 fue aprobado el 2026-11-06. Esta revisión v0.2.0, aprobada el 2026-11-07, actualiza el contrato de reconciliación para publicar el progreso cualificado después de cada evento de review. No modifica EE-RFC-003 retroactivamente.

---

## 01. Resumen ejecutivo

Este RFC sustituye prospectivamente el requisito de EE-RFC-003 §02.8.7 que vuelve a ejecutar `Validate` ante cada evento de revisión. `Validate` se ejecuta cuando cambia el HEAD del Pull Request; Governance reutiliza el resultado `success` vigente de `Validate` para ese mismo HEAD. Cada evento actual de review inicia una reevaluación confiable para actualizar el conteo de aprobaciones cualificadas.

La decisión aprobada separa la decisión de gobernanza, el check `PR Governance` y el resultado operativo del workflow. Actualiza el check después de cada evento de review, conserva `BLOCKED` mientras falten aprobaciones cualificadas y evita repetir CI para el mismo HEAD. La huella vigente deduplica publicaciones con evidencia idéntica.

---

## 02. Motivación

### 02.1. Descubrimiento

En el PR #50, el primer evento de review despachó Governance en `main` aunque la evidencia solo alcanzaba una de dos aprobaciones requeridas. La verificación publicó `BLOCKED` y terminó el workflow con fallo operativo. En ejecuciones posteriores, el relay conservó el check anterior ante una aprobación parcial, por lo que la interfaz siguió mostrando `0/2` aunque la evidencia de review hubiera cambiado.

### 02.2. Conflicto normativo actual

| Fuente                                             | Estado                                                                                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EE-RFC-003 §02.8.7                                 | Indica que un evento de review provoca una nueva ejecución de `Validate`.                                                                                                 |
| EE-DOC-007 §07.10.1                                | Exige que `PR Governance` utilice `Validate` satisfactorio del mismo HEAD y que los eventos de review inicien reconciliación confiable.                                   |
| `.github/workflows/governance.yml` y relay vigente | El relay procesa eventos de review, consulta `Validate` y despacha a `main`; no comprueba si un `BLOCKED` vigente sigue siendo inevitable por aprobaciones insuficientes. |

EE-RFC-003 está cerrado. Esta decisión resuelve la contradicción prospectivamente sin modificarlo retroactivamente.

### 02.3. Interpretación del cambio

Un evento de revisión actualiza evidencia de gobernanza; no cambia el código ni requiere repetir CI para el mismo HEAD. Cada evento distinto de review solicitado, editado o dismiss inicia una reevaluación confiable en `main`. La publicación debe mostrar el conteo vigente de aprobaciones cualificadas (por ejemplo, `0/2`, `1/2` y `2/2`) y conservar `BLOCKED` mientras los requisitos no se cumplan.

El relay no determina cualificación ni modifica checks; solo solicita la reevaluación. La verificación de `main` conserva la autoridad sobre identidad, elegibilidad, CODEOWNERS e independencia, y publica el nuevo check `PR Governance`. Si llegan reviews concurrentes, la evaluación refleja la evidencia vigente al momento de publicar; no deberá publicar un conteo histórico inferior después de una decisión basada en evidencia más reciente.

### 02.4. Límite de autoridad

| Documento          | Qué autoriza / norma este RFC                                                           |
| ------------------ | --------------------------------------------------------------------------------------- |
| EE-DOC-005         | Workflow de Pull Request, revisiones y aprobación independiente.                        |
| EE-DOC-007         | Contrato de `PR Governance`, identidad confiable, eventos, publicación e invalidación.  |
| EE-DOC-010         | Contrato del check `Validate` como agregación de Quality Gates; no decide aprobaciones. |
| EE-RFC-003 §02.8.7 | Requisito histórico sustituido prospectivamente por esta decisión aprobada.             |

### 02.5. Delimitación frente a alternativas de ubicación o alcance

| Elemento                           | Rol                                   | Relación con la decisión aprobada                                                                        |
| ---------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| EE-DOC-007                         | Fuente normativa de GitHub Governance | Contiene el contrato materializado en §07.10.1.                                                          |
| EE-IMP-007-P08                     | Evidencia de implementación           | Registrará el comportamiento as-built y las regresiones después de implementarlo.                        |
| `.github/workflows/governance.yml` | Orquestación física                   | Mantiene la evaluación privilegiada en `main`; su implementación se sincroniza con el contrato aprobado. |

---

## 03. Propuesta

### 03.1. Superficie A — EE-RFC-003 §02.8.7

| Sección afectada                                      | Cambio                                                                                                                                                                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requisito de nueva ejecución de `Validate` por review | Sustituir prospectivamente por `Validate` ante cambios de HEAD; cada evento de review inicia reconciliación de Governance y reutiliza `Validate` satisfactorio vigente para el mismo HEAD. EE-RFC-003 permanecerá intacto como registro histórico. |

### 03.2. Superficie B — Contrato de decisión, check y workflow

| Condición                                                                                             | Acción del relay / Governance                                                                                       | Check `PR Governance`                                     | Workflow                                    |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| No existe check vigente                                                                               | Despachar reconciliación confiable. Main publica la decisión actual, incluido `BLOCKED` si faltan aprobaciones.     | Según decisión evaluada.                                  | `success` si la operación técnica concluye. |
| Llega un evento distinto de review, aunque las aprobaciones sigan debajo del mínimo                   | Despachar a `main`; la cantidad no equivale a cualificación.                                                        | Reevaluar y publicar el conteo cualificado vigente.       | `success` si la operación técnica concluye. |
| Existe `PASS` y se revoca o edita una aprobación que podría invalidarlo                               | Reconciliar inmediatamente.                                                                                         | Invalidar el `PASS` si deja de cumplir la política.       | `success` si no hay error técnico.          |
| Cambia HEAD o evidencia relevante, y no se demuestra que un `BLOCKED` continúa necesariamente vigente | No aplicar deduplicación obsoleta; reconciliar con la evidencia actual y exigir `Validate` exitoso del HEAD actual. | Según nueva evaluación; nunca heredar el `PASS` anterior. | Según resultado operativo.                  |
| Error de GitHub, evidencia indeterminada o fallo técnico                                              | `ERROR`; detener la publicación favorable.                                                                          | Nunca publicar `PASS`.                                    | `failure`.                                  |

El relay no declara aprobaciones cualificadas por conteo ni omite la evaluación debido a un conteo bruto insuficiente. Cada evento actualiza la evidencia en `main`; la huella deduplica únicamente una publicación cuyo resultado y evidencia ya sean idénticos.

### 03.3. Superficie C — EE-DOC-007 e implementación derivada

| Ítem                | Cambio                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| EE-DOC-007 §07.10.1 | Precisar los estados `PASS`, `BLOCKED` y `ERROR`, el mapeo a check/workflow y la reevaluación después de cada evento de review. |
| EE-IMP-007-P08      | Documentar el as-built, el comportamiento en concurrencia, evidencias de CI y limitaciones verificadas.                         |
| Workflow y código   | Ajustar relay, evaluación y publicación después de integrar el contrato normativo aprobado.                                     |

### 03.4. Lo que este RFC **no** cambia

| Ítem                      | Tratamiento                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Umbral dinámico           | ORDINARY requiere al menos una aprobación calificada; CRITICAL requiere al menos dos, sujeto a requisitos de ownership más estrictos.   |
| CODEOWNERS y elegibilidad | La decisión final permanece en `main`; el relay no emite `PASS` ni certifica cualificación.                                             |
| Reglas de `Validate`      | El check sigue siendo obligatorio y debe corresponder al HEAD exacto. Reviews no reinician CI si ese HEAD no cambió.                    |
| Arquitectura Actions-only | Se conserva el relay sin secretos y la evaluación confiable en `main`; no se incorpora coordinador externo ni almacenamiento CAS.       |
| RFC-003                   | No se edita retroactivamente. Su cláusula anterior permanece como historial, reemplazada solo por aprobación e integración de este RFC. |

### 03.5. Efectos técnicos de la materialización

| Efecto                                                | Acción                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Progreso de approvals parciales                       | Cada evento distinto de review solicita evaluación confiable y actualiza el check con el conteo cualificado vigente. La deduplicación por huella evita publicar otra vez cuando la evidencia final es idéntica; `Validate` no se repite si el HEAD no cambió.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Decisión de política reportada como fallo de workflow | Publicar `BLOCKED` en el check con conclusión `failure`, y terminar el workflow con `success` si la operación fue técnicamente correcta.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Evidencia sustituida durante concurrencia             | Revalidar HEAD y evidencia vigente antes de publicar; una ejecución que detecte evidencia sustituida no publicará `PASS`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Identidad del dispatch y deduplicación                | El título corto identifica PR y run de review; el SHA se conserva en `head_sha`. Solo se suprime el mismo evento o un título histórico con PR/SHA/review exactos. Un dispatch activo distinto no se reutiliza sin prueba de que cubra el evento actual; en caso contrario se solicita otra evaluación serializada.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Idempotencia de checks publicados                     | Revaluar todas las fuentes en cada reconciliación; suprimir una publicación solo si el último check de la App coincide en HEAD, conclusión y huella de evidencia vigente. La huella incluye versiones de esquema y política y viaja como `external_id` opaco. Incrementar la versión de esquema al cambiar la representación de evidencia; incrementar la versión de política al cambiar clasificación, umbrales, elegibilidad o resultados. Checks antiguos sin huella y errores operativos nunca se deduplican. Si una evaluación previa al inicio del check falla, publicar un nuevo check `failure`; si esa publicación falla, reportar el error operativo y dejar el required check bloqueado cuando siga en curso. |
| Límite de atomicidad                                  | Documentar que Actions y Checks API no ofrecen transacción atómica sobre reviews, permisos y publicación del check; no afirmar atomicidad en el instante del merge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

## 04. Alternativas consideradas

| ID    | Alternativa                                                                                                                                    | Dictamen         | Motivo                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| **A** | Relay conserva `BLOCKED` vigente ante approvals parciales y espera hasta el umbral.                                                            | Rechazada        | Deja visible un conteo antiguo y no refleja el progreso de reviews.                  |
| **B** | Cada evento de review solicita evaluación en `main`; `BLOCKED` publica `failure` y el workflow termina `success` si la operación fue correcta. | **Seleccionada** | Actualiza el progreso cualificado sin repetir CI ni confundir política con error.    |
| **C** | Reejecutar `Validate` por cada evento de review.                                                                                               | Rechazada        | Repite CI sin cambios de código y mantiene la contradicción que origina el problema. |
| **D** | Añadir servicio externo con almacenamiento transaccional.                                                                                      | Diferida         | No es necesario para el cambio mínimo Actions-only y aumenta la infraestructura.     |

---

## 05. Impacto

| Ámbito                    | Impacto                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Documentos normativos** | EE-DOC-001 registra este RFC aprobado; EE-DOC-007 contiene el contrato materializado. EE-RFC-003 no se modifica.                            |
| **Monorepo físico**       | La implementación se ajusta conforme a los criterios aprobados en este RFC.                                                                 |
| **CI / Quality Gates**    | `Validate` continúa ejecutándose ante cambios de HEAD; reviews no reinician CI. Governance consume el resultado vigente del mismo HEAD.     |
| **Otros**                 | Aumenta reevaluaciones de Governance al cambiar reviews, sin repetir CI; mantiene clasificación y elegibilidad en el verificador de `main`. |

---

## 06. ADR

| Pregunta                             | Respuesta                                                                                                                                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Se requiere ADR además de este RFC? | **No**                                                                                                                                                                                                               |
| Justificación                        | El alcance es un cambio Tipo D del contrato transversal de gobernanza y reconciliación, dentro de la arquitectura Actions-only ya aprobada. No cambia límites de sistema, top-levels ni componentes arquitectónicos. |

---

## 07. Criterios de aceptación

| #   | Check medible                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El RFC es aprobado por Arquitectura y EE-DOC-001 lo registra como aprobado antes de iniciar la implementación.                                                                                                                                                                                      |
| 2   | EE-DOC-007 define sin ambigüedad decisión, check, estado interno del relay y resultado operativo del workflow.                                                                                                                                                                                      |
| 3   | `Validate` ejecuta por cambio de HEAD y Governance solo acepta su `success` para el mismo HEAD vigente.                                                                                                                                                                                             |
| 4   | La secuencia secuencial `BLOCKED 0/2 → aprobación cualificada 1/2 → segunda aprobación cualificada 2/2` actualiza `PR Governance` tras cada evento; `BLOCKED` conserva conclusión `failure` con workflow `success`, y el resultado final refleja `2/2`. `Validate` no se repite para el mismo HEAD. |
| 5   | Cada reevaluación en `main` verifica desde la API cualificación, CODEOWNERS, independencia y vigencia; reviews concurrentes solo publican evidencia vigente y pueden converger directamente al conteo final.                                                                                        |
| 6   | `PASS → dismissed` provoca reconciliación y ningún resultado favorable sobrevive si ya no cumple la política.                                                                                                                                                                                       |
| 7   | Cambios de HEAD/evidencia, fallos HTTP y carreras entre eventos tienen regresiones; evidencia desconocida nunca produce `PASS` ni suprime una reevaluación necesaria.                                                                                                                               |
| 8   | `BLOCKED` es check `failure` con workflow `success`; `ERROR` impide `PASS` y hace fallar el workflow.                                                                                                                                                                                               |
| 9   | Se revalida la evidencia antes de publicar; la documentación conserva explícitamente el límite de falta de atomicidad frente a cambios posteriores a la última consulta.                                                                                                                            |
| 10  | El relay acepta estados transitorios documentados, valida campos según el evento y no deduplica otra review por un dispatch activo cuyo evento/HEAD no puede demostrar. Los diagnósticos exponen fase y código específicos.                                                                         |
| 11  | Cada reconciliación vuelve a leer la evidencia completa. Solo conserva el último `PASS` o `BLOCKED` cuando HEAD, resultado y huella versionada coinciden; sin huella, con cambios de evidencia o con errores, no deduplica y publica o falla de forma segura.                                       |
| 12  | Una consulta fallida antes de iniciar un check no deja vigente un `PASS` anterior: la ejecución intenta publicar `PR Governance = failure`. La implementación mantiene una sola evaluación completa posterior al inicio del check, con verificación interna de consistencia de las fuentes.         |
| 13  | Los cambios de formato de evidencia incrementan `EVIDENCE_SCHEMA_VERSION`; los cambios en clasificación, aprobaciones, elegibilidad o resultados incrementan `GOVERNANCE_POLICY_VERSION`. Las regresiones demuestran que los checks con una versión anterior no se deduplican.                      |

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                                | Responsable                                 |
| :---: | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
|   1   | Revisar y aprobar EE-RFC-004 mediante Pull Request gobernado.                                         | Equipo de Arquitectura                      |
|   2   | Actualizar EE-DOC-007 §07.10.1 y registrar la versión normativa conforme al mecanismo aprobado.       | Arquitectura                                |
|   3   | Implementar relay, evaluación y publicación; agregar regresiones unitarias e integración de workflow. | Maintainers + Architecture según CODEOWNERS |
|   4   | Validar los escenarios definidos, revisar evidencia y actualizar EE-IMP-007-P08.                      | Maintainers + Architecture                  |
|   5   | Sincronizar EE-DOC-001 con el estado final y cerrar el RFC solo después de evidencia conforme.        | Equipo de Arquitectura                      |

---

## 09. Riesgos y mitigaciones

| Riesgo                                                       | Mitigación                                                                                                                                     |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Relay trata un conteo bruto como elegibilidad                | Usarlo solo como cota inferior; `main` conserva la evaluación definitiva de identidad, permisos, membresía y CODEOWNERS.                       |
| Se conserva un `BLOCKED` obsoleto                            | Exigir HEAD y evidencia vigente; si hay duda sobre mínimo o frescura, despachar reconciliación.                                                |
| Un run concurrente publica `PASS` tras ser sustituido        | Serializar reconciliación, reconsultar evidencia inmediatamente antes de publicar y no publicar cuando cambie el snapshot esperado.            |
| Checks API no ofrece atomicidad con reviews                  | Documentar la ventana residual y cubrir revocaciones mediante eventos y reconciliación periódica.                                              |
| Cambio documental se interpreta como evidencia de despliegue | La aprobación normativa no acredita por sí sola la integración ni la configuración efectiva; registrar aparte la evidencia de CI y plataforma. |

---

## 10. Referencias

| Código             | Rol                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **EE-DOC-001**     | SSOT del índice y registro de RFC.                                                             |
| **EE-DOC-005**     | Workflow, clasificación y umbrales de aprobación.                                              |
| **EE-DOC-007**     | Contrato vigente de GitHub Governance y PN-017.                                                |
| **EE-DOC-010**     | Semántica y evidencia del check `Validate`.                                                    |
| **EE-RFC-003**     | Fuente histórica de la cláusula de reevaluación sustituida prospectivamente por esta decisión. |
| **EE-IMP-007-P08** | Evidencia de implementación que se actualizará tras materializar el cambio.                    |

---

## 11. Resolución

| Campo                      | Valor                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Dictamen**               | Aprobado por el Equipo de Arquitectura el 2026-11-06.                                                                                      |
| **Decisión**               | v0.2.0 actualiza el contrato de v0.1.0 para reevaluar cada review y reflejar el conteo cualificado; EE-RFC-003 se conserva como historial. |
| **Condición para aplicar** | Sincronizar EE-DOC-007 y validar relay, deduplicación y actualización de conteos con regresiones.                                          |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                         | Cambios                                                                                   | Estado       |
| ---------- | ---------- | ---------------------- | ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| **v0.1.0** | 2026-11-06 | Equipo de Arquitectura | Equipo de Arquitectura | Aprobación y contrato de reconciliación PN-017 | Sustituye prospectivamente EE-RFC-003 §02.8.7 y separa decisión, check, relay y workflow. | **Aprobado** |
| **v0.2.0** | 2026-11-07 | Equipo de Arquitectura | Equipo de Arquitectura | Progreso visible de aprobaciones               | Reevaluación tras cada review; actualiza el conteo cualificado sin volver a ejecutar CI.  | **Aprobado** |
