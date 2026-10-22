# EE-RFC-003 — Documentation Standards Sync

Este documento sigue el estándar **EE-DOC-002 — Document Design Template**.

---

## METADATOS

| Campo                               | Valor                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| **ID**                              | EE-RFC-003                                                                                     |
| **Title**                           | Documentation Standards Sync and Collaborative Workflow Governance (audit vehicle Tipo D)     |
| **Código corto**                    | RFC-003                                                                                        |
| **Tipo**                            | Request for Comments (Cambio gobernado)                                                        |
| **Clasificación**                   | **D — Cambio Significativo / Transversal**                                                     |
| **Estado**                          | Propuesto (vehículo abierto — auditoría documental)                                            |
| **Versión**                         | v0.4.0                                                                                         |
| **Propietario**                     | Equipo de Arquitectura                                                                         |
| **Solicitante**                     | Auditoría documental EE-DOC-002 / EE-DOC-001                                                   |
| **Documentos normativos afectados** | EE-DOC-001, EE-DOC-002 (principal); corpus y forma en 004…015, ADR/RFC/IMP/TEC según hallazgos |
| **Documento de dominio**            | EE-DOC-002 — Document Design Template                                                          |
| **ADR asociado**                    | No requerido (cambio de estándar documental y catálogo de metadatos, no decisión de runtime)   |
| **Fecha de creación**               | 2026-10-11                                                                                     |
| **Última revisión**                 | 2026-10-22                                                                                     |
| **Audiencia**                       | Arquitectura, Desarrollo, IA, QA                                                               |
| **Responsable de decisión**         | Equipo de Arquitectura                                                                         |

> **Régimen:** este RFC permanece en estado **Propuesto** de forma deliberada mientras dure la **auditoría documental** del monorepo. Está indexado en **EE-DOC-001 §09.2**. Acumula y ratifica cambios Tipo D de estándares (plantillas, catálogo, metadatos, VAL/WAIVE, reglas AR volcadas a 002, etc.). **No** se interpreta como Aprobado ni como alcance cerrado hasta el cierre formal de la oleada de auditoría.

---

## 01. Resumen ejecutivo

Regularizar el cambio gobernado de las ediciones **EE-DOC-002 v1.7.0 / v1.8.0 / v1.9.0** y el sync **EE-DOC-001 v2.27.0**, emitidas como minor de auditoría sin RFC/ADR previo. Clasificación: **Tipo D**. Este RFC no reabre el fondo técnico ya redactado; **registra y aprueba** el paquete documental.

---

## 02. Motivación

### 02.1. Descubrimiento

Durante la auditoría documental del monorepo (re-auditoría de EE-DOC-001 v2.29.1) se confirmó que las ediciones **EE-DOC-002 v1.7.0–v1.10.0** y el sync de **EE-DOC-001 v2.27.0–v2.29.x** se emitieron como _minor_/Tipo A **sin RFC/ADR previo**, y que **EE-RFC-003** —vehículo de su regularización— debía quedar catalogado en el índice.

### 02.2. Conflicto normativo actual

| Fuente                     | Estado                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-001 R2**          | Exige el mecanismo de cambio gobernado para modificar documentos congelados; las ediciones citadas no lo registraron |
| **EE-DOC-002 §13.2 / §15** | Una versión congelada no se modifica directamente: requiere mecanismo de cambio gobernado y nueva versión            |
| **EE-DOC-001 §09.2**       | No contenía fila para **EE-RFC-003**, el vehículo de la propia regularización                                        |
| **EE-DOC-005 §04.2**       | **A/B** → actualizar el documento (sin RFC/ADR); **C** → ADR; **D** → RFC                                            |

### 02.3. Interpretación del cambio

Este RFC **regulariza y aprueba** un paquete ya redactado: **no** reabre el fondo técnico de 002 v1.7.0–v1.10.0, **no** crea top-levels y **no** absorbe hallazgos de otros documentos.

### 02.4. Límite de autoridad

| Documento      | Qué autoriza / norma este RFC                                                |
| -------------- | ---------------------------------------------------------------------------- |
| **EE-DOC-002** | Ratifica las ediciones v1.7.0–v1.10.0 (§05.1, §16/§18.6, §13–§14, §03.1/§21) |
| **EE-DOC-001** | Registra EE-RFC-003 en §09.2, §14 y §15 (§03.2)                              |
| **EE-DOC-005** | Vehículo del cambio: **Tipo D** (§04.2)                                      |

### 02.6. Ampliación propuesta — flujo de trabajo colaborativo

Se propone incorporar a este RFC, que permanece abierto durante la oleada de auditoría, la formalización del flujo de colaboración entre responsable humano y asistente de ingeniería. La ampliación se registra como **propuesta pendiente de decisión**, no como norma aprobada ni como autorización para alterar documentos congelados al margen del proceso gobernado.

La necesidad surge de hacer explícitos los límites de responsabilidad y el ciclo de integración documental/técnica: una rama por cambio coherente, separación de responsabilidades entre código y documentación, revisión mediante PR y evidencia de validación. La ampliación no modifica por sí sola la configuración de GitHub ni afirma que sus controles actuales ya soporten todo el flujo propuesto.

### 02.7. Delimitación frente a alternativas de ubicación o alcance

| Elemento                               | Rol                   | Relación con la propuesta                                                 |
| -------------------------------------- | --------------------- | ------------------------------------------------------------------------- |
| **EE-DOC-001 §08.1 / §09.4 / R7**      | Ya materializados     | Este RFC los **ratifica**; no los reproduce                               |
| Hallazgos **Tipo A/B** de la auditoría | No requieren vehículo | Se aplican en EE-DOC-001 + su Historial de Cambios; **no** se listan aquí |
| Árbol físico de **EE-DOC-006**         | Otro documento        | Fuera de alcance (`PN-009`/`PN-010`), salvo referencia de límites arquitectónicos |
| Configuración real de GitHub            | Evidencia operativa   | No cambia por este RFC; cambios de configuración requieren tarea y validación separadas |

---

## 03. Propuesta

### 03.1. Superficie A — EE-DOC-002

| Sección afectada | Cambio                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| §05.1            | Catálogo cerrado Tipo / Clasificación / Nivel                                                                                         |
| §06              | Prohibición `x.0`                                                                                                                     |
| §13–§14          | Puntero SSOT estados → 001 §08 / §08.1                                                                                                |
| §16 / §18.6      | VAL/WAIVE; archivo `{ID}_{Nombre}_{fecha}.md`; campos WAIVED 010 §04.6.1                                                              |
| §18.4            | Tipo = Documentación Técnica Consolidada                                                                                              |
| §03.1 / §21      | Precedencia sin sola recencia; R2 = RFC y/o ADR                                                                                       |
| v1.9.0           | Cierre de menores de auditoría                                                                                                        |
| v1.10.0          | Volcado de reglas AR (numeración, plantillas §18, historial ≤ 230, versionado pre-`main`, prefijo `EE-`, Dependencias vs Referencias) |

### 03.2. Superficie B — EE-DOC-001

| Ítem              | Cambio ratificado                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| §08.1             | Estados operativos Completado / Implementado / WAIVED                                                                                  |
| §09.4             | Familias `EE-VAL-_ / EE-WAIVE-_`                                                                                                       |
| R7                | Dependencias de contenido vs orden de implementación                                                                                   |
| §09.2 / §14 / §15 | Alta de **EE-RFC-003** en la matriz de RFCs (`Propuesto` → `Implementado (documentación)` al cierre), en Referencias y en el historial |

### 03.3. Superficie C — EE-DOC-005 y EE-DOC-007 (propuesta pendiente de aprobación)

| Documento | Cambio propuesto | Límite |
| --- | --- | --- |
| **EE-DOC-005 — Development Workflow** | Formalizar una rama por cambio coherente (no por archivo); commits acotados; revisión y validación antes de integrar; responsabilidades explícitas: el usuario implementa código y el asistente puede preparar documentación; documentación alineada con la implementación y la evidencia real | No se editará el documento congelado hasta que la propuesta sea aceptada según el proceso gobernado |
| **EE-DOC-007 — GitHub Governance** | Aclarar la aplicación del flujo mediante GitHub: rama de trabajo acordada, PR creado por el usuario, revisión y merge autorizado; separar cambios documentales de cambios de configuración | No duplicar el workflow normativo de 005 ni afirmar controles no verificados |
| **EE-DOC-001 — Master Documentation Index** | Tras la decisión, sincronizar el registro del RFC, referencias y el historial/estado que corresponda | La sincronización se realizará como parte del paquete gobernado, no anticipando una aprobación |

### 03.4. Reglas de colaboración propuestas

1. **Una rama por cambio coherente**, definida por alcance y objetivo, no una rama por archivo.
2. **Responsabilidades separadas:** el usuario realiza manualmente los cambios de código; el asistente puede inspeccionar el repositorio y preparar cambios documentales autorizados.
3. **Ramas remotas:** el asistente puede crear y publicar una rama dedicada para el cambio acordado, sin crear un PR en nombre del usuario.
4. **Pull request:** el usuario crea el PR. No se integra directamente en `main`.
5. **Integración:** solo después de revisión, resolución de observaciones y merge autorizado según la gobernanza aplicable.
6. **Evidencia:** no declarar lint, typecheck, tests, build, E2E o security gates como aprobados si no se ejecutaron; registrar límites y fallos observados.
7. **Coherencia documental:** actualizar la documentación afectada cuando el cambio aprobado altere arquitectura, APIs, comportamiento, configuración, workflows o governance.
8. **Documentos congelados:** no editar directamente sus versiones vigentes en `main`; cualquier modificación normativa debe tramitarse en la rama del cambio y respetar aprobación, versionado e historial exigidos por el estándar.
9. **Configuración GitHub:** los cambios de reglas, branch protection o checks deben separarse de una edición exclusivamente documental y acompañarse de evidencia verificable.
10. **Sin cambios de código por parte del asistente:** esta propuesta no concede autorización para modificar código fuente.

### 03.5. Fuera de este RFC (explícito) **no** cambia

| Ítem                                                        | Tratamiento                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Migración de código corto sin `EE` en el corpus             | Por documento en su auditoría (§21 R4)                                               |
| Gate `validateDocumentation`                                | Diferido (automatización)                                                            |
| Historial de 7 columnas en RFC/IMP/TEC ya emitidos          | Por documento en su auditoría                                                        |
| Hallazgos **Tipo A/B** de la auditoría                      | Se aplican en el documento afectado + su Historial de Cambios; **no** se listan aquí |
| Árbol físico de **EE-DOC-006** (`.devcontainer/`, `audit/`) | Fuera de alcance (`PN-009`/`PN-010`): auditoría de 006                               |

---

## 04. Alternativas consideradas

| ID  | Alternativa                                          | Dictamen     | Motivo                                                          |
| --- | ---------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| A1  | Clasificar solo Tipo B (especialización 002)         | Rechazada    | Alcance transversal (001 + familia VAL/WAIVE + catálogo global) |
| A2  | Revertir v1.7–v1.9 y reintroducir vía RFC desde cero | Rechazada    | Coste alto; contenido ya alineado a auditoría                   |
| A3  | RFC Tipo D retroactivo (esta propuesta)              | **Adoptada** | Cumple 001 R2 / 005 sin reescribir el fondo                     |

---

## 05. Impacto

| Ámbito                    | Impacto                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Documentos normativos** | Ratifica **EE-DOC-002 v1.10.0** y el sync de **EE-DOC-001 v2.29.x**; registra **EE-RFC-003** en §09.2 y §14 |
| **Monorepo físico**       | Ningún cambio estructural ni de código fuente; la propuesta afecta documentación normativa y flujo de trabajo |
| **CI / Quality Gates**    | Ningún cambio de configuración implícito; la propuesta exige registrar solo validaciones realmente ejecutadas |
| **Otros**                 | El RFC permanece Propuesto; la ampliación de workflow requiere decisión y no altera por sí sola controles GitHub |

---

## 06. ADR

| Pregunta                             | Respuesta                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| ¿Se requiere ADR además de este RFC? | **No**                                                                                                                         |
| Justificación                        | No fija decisión de runtime ni altera el árbol de primer nivel: es un cambio de estándar documental y de catálogo de metadatos |

---

## 07. Criterios de aceptación

| #   | Criterio                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EE-DOC-001 §09.2 lista este RFC en **Propuesto** (vehículo abierto) hasta cierre de oleada                                            |
| 2   | EE-DOC-002 historial referencia **EE-RFC-003** / Tipo D donde aplique el paquete                                                      |
| 3   | AR registradas de plantilla/metadatos volcadas a **002** (v1.10.0+) o justificadas                                                    |
| 4   | Sin discrepancia SSOT 002 §18.6 ↔ 001 §09.4 (VAL/WAIVE)                                                                              |
| 5   | Al **cerrar** la oleada: estado **Aprobado** → **Implementado (documentación)** y dejar de acumular alcance sin nueva versión del RFC |
| 6   | La propuesta de flujo colaborativo tiene una decisión explícita; los cambios de 005/007/001 se aplican solo tras aprobación |
| 7   | No se declara modificada la configuración GitHub sin cambio y evidencia verificables |
| 8   | No se modifica código fuente como parte de este RFC |

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                                  | Responsable      |
| :---: | ------------------------------------------------------------------------------------------------------- | ---------------- |
|   1   | Mantener el RFC **Propuesto** y abierto durante la oleada de auditoría (DOC-004…015, ADR, IMP, TEC)     | Arquitectura     |
|   2   | Parche normativo de los documentos afectados (registro del RFC en **EE-DOC-001 §09.2/§14**)             | Arquitectura     |
|   3   | Sincronización de **EE-DOC-001 §15** (historial) — última del paquete                                   | Arquitectura     |
|   4   | Migraciones de corpus (`PC-*` / `PN-*`) por documento auditado                                          | Equipo auditoría |
|   5   | Al cierre de oleada: **Aprobado** → **Implementado (documentación)**; enmiendas = nueva versión del RFC | Arquitectura     |
|   6   | Decidir formalmente la ampliación de workflow colaborativo; mantener 005/007/001 sin cambios hasta aprobación | Equipo de Arquitectura |
|   7   | Tras aprobación, actualizar 005 y 007; sincronizar 001 al final del paquete y validar referencias/diff | Arquitectura |
|   8   | Verificar configuración GitHub por separado; modificar TEC/IMP solo si cambia la configuración real o su evidencia | Arquitectura / responsable de configuración |

---

## 09. Riesgos y mitigaciones

| Riesgo                                                       | Mitigación                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Corpus aún no cumple código corto / historial 7 cols         | Plan por documento (M-01 / M-03 diferidos)                                    |
| 015 usa otro patrón de nombre de archivo                     | 002 manda `{ID}_{Nombre}_{fecha}.md`; alinear 015 en su auditoría             |
| Alineación EE-DOC-004 v1.2.0 sin RFC específico de 006 §13.2 | Diferida a la auditoría de 006 (`PN-008`); este RFC no sustituye ese vehículo |

---

## 10. Referencias

| Código                      | Rol                                |
| --------------------------- | ---------------------------------- |
| **EE-DOC-001**              | R2, R7, §08.1, §09.4               |
| **EE-DOC-002**              | Estándar de forma; v1.7.0–v1.10.0+ |
| **EE-DOC-005**              | Tipo D §04.2                       |
| **EE-AUDIT-Rules_Emerging** | Inventario AR / backlog PC-PN-PA   |
| **EE-DOC-010**              | WAIVED §04.6.1                     |
| **EE-DOC-015**              | Validación; padre VAL              |
| **EE-DOC-005**              | Workflow normativo; clasificación Tipo D y ciclo de cambios gobernados |
| **EE-DOC-007**              | Gobernanza de GitHub; controles operativos que implementan el workflow |
| **EE-TEC-002**              | Evidencia consolidada de configuración GitHub; solo se modifica si cambia el estado real |
| **EE-IMP-010-P03**          | Evidencia de gates/seguridad/arquitectura, si el cambio operativo afecta su alcance |

---

## 11. Resolución

| Campo                                    | Valor                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Estado**                               | **Propuesto** (vehículo abierto — auditoría documental)                                                   |
| **Responsable de decisión**              | Equipo de Arquitectura                                                                                    |
| **Condición de materialización parcial** | Merges documentales por oleada **sin** exigir cierre del RFC                                              |
| **Condición de cierre**                  | Fin de oleada de auditoría acordado + estado **Aprobado** + **Implementado (documentación)** en 001 §09.2 |

> **Alcance adicional (auditoría EE-DOC-006, 2026-10-18):** coexistencia de la matriz de **paquetes físicos** (EE-DOC-006 §13.2, incl. filas Apps/Shared) con la matriz **lógica** de capas (EE-DOC-004 §11). No se modifica 004 desde 006; cualquier unificación de precedencia o contradicción real se resuelve en este RFC (Tipo D) o ADR. Backlog **PN-008 / PN-028**.

> **PN-008 — estado 2026-10-18:** la **nota de mapeo aprobada** quedó materializada en **EE-DOC-004 §11.2** y **EE-DOC-006 §13** (coexistencia matriz lógica vs física; precedencia por tipo de pregunta; conflicto → RFC/ADR). Este RFC **permanece abierto** hasta el fin de la oleada de auditoría; este ítem no cierra el RFC completo.

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por | Motivo                     | Cambios                                                                                                                                                   | Estado    |
| ---------- | ---------- | ---------------------- | ------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| **v0.1.0** | 2026-10-11 | Equipo de Arquitectura | —            | C-01 auditoría 002         | Creación RFC Tipo D retroactivo                                                                                                                           | Propuesto |
| **v0.2.0** | 2026-10-13 | Equipo de Arquitectura | —            | Vehículo abierto auditoría | Indexado en 001 §09.2; alcance oleada 002 v1.10 / 004; criterios y plan                                                                                   | Propuesto |
| **v0.3.0** | 2026-10-13 | Equipo de Arquitectura | —            | Conformidad §18.5          | §02 con roles 02.1–02.5; §03 sin «Superficie C» (03.1/03.2/03.3); §05 etiquetas del template; §06 Sí/No + Justificación; metadato Clasificación unificado | Propuesto |
| **v0.4.0** | 2026-10-22 | Equipo de Arquitectura | — | Ampliación propuesta de workflow | Incorpora alcance propuesto para colaboración, ramas/PR, responsabilidades, validación y potencial impacto en DOC-005/DOC-007; mantiene RFC abierto y sin declarar aprobación | Propuesto |

---

## FIN DEL DOCUMENTO
