# EE-RFC-003 — Documentation Standards Sync

Este documento sigue el estándar **EE-DOC-002 — Document Design Template**.

---

## METADATOS

| Campo                               | Valor                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ID**                              | EE-RFC-003                                                                                                          |
| **Documento**                       | Documentation Standards Sync                                                                                        |
| **Código corto**                    | RFC-003                                                                                                             |
| **Tipo**                            | Request for Comments (Cambio gobernado)                                                                             |
| **Clasificación**                   | D — Cambio Significativo / Transversal                                                                              |
| **Nivel**                           | Estratégico                                                                                                         |
| **Normativo**                       | Sí                                                                                                                  |
| **Versión**                         | v0.5.0                                                                                                              |
| **Estado**                          | Propuesto (vehículo abierto — auditoría)                                                                            |
| **Propietario**                     | Equipo de Arquitectura                                                                                              |
| **Documento padre**                 | EE-DOC-005                                                                                                          |
| **Dependencias**                    | padre=EE-DOC-005; contenido=EE-DOC-001, EE-DOC-002, EE-DOC-005, EE-DOC-007, EE-DOC-011                              |
| **Solicitante**                     | Auditoría transversal del monorepo: documentación, gobernanza, release y automatización                             |
| **Documentos normativos afectados** | EE-DOC-001, EE-DOC-002, EE-DOC-005, EE-DOC-007, EE-DOC-011 y documentos/artefactos vinculados a hallazgos auditados |
| **Documento de dominio**            | EE-DOC-002 — Document Design Template                                                                               |
| **ADR asociado**                    | No requerido por esta propuesta: los hallazgos transversales de la oleada se gobiernan en RFC-003                   |
| **Aprobado por**                    | Pendiente — RFC Propuesto                                                                                           |
| **Audiencia**                       | Arquitectura, Desarrollo, IA, QA                                                                                    |
| **Fecha de creación**               | 2026-10-11                                                                                                          |
| **Última revisión**                 | 2026-10-24                                                                                                          |
| **Próxima revisión**                | Pendiente de cierre de la oleada de auditoría                                                                       |

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

Este RFC regulariza el paquete documental descrito en su alcance inicial y sirve como vehículo transversal para los hallazgos de la oleada de auditoría que se incorporen explícitamente, con clasificación, trazabilidad y criterios de cierre. No se limita a los cambios de EE-DOC-002/EE-DOC-001 ya redactados.

La inclusión de un hallazgo en RFC-003 no equivale a su aprobación normativa ni autoriza por sí sola a modificar documentos congelados, configuración de GitHub o código fuente. La clasificación y el mecanismo de materialización establecidos por EE-DOC-005 siguen aplicando; las modificaciones se ejecutan tras la aprobación correspondiente y con evidencia verificable. Los hallazgos Tipo A/B pueden quedar trazados aquí sin duplicar su implementación documental, mientras que los cambios transversales Tipo D requieren la decisión gobernada que corresponda.

#### Aprobación de propuestas derivadas de auditorías

La aprobación de una propuesta se registra en su fila correspondiente del historial de versiones. La aprobación no cambia el estado global del RFC, que permanece **Propuesto** durante la auditoría transversal, ni cierra el documento. Cada nueva observación de tipo RFC puede aprobarse de forma independiente y registrarse como una nueva versión del historial, manteniendo el RFC abierto para incorporar observaciones posteriores. Este mecanismo sigue el precedente de la versión **v0.1.0**, cuyo estado en el historial es **Propuesto**.

### 02.4. Límite de autoridad

| Documento o superficie                          | Rol en esta enmienda                                                     | Límite                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **EE-DOC-001**                                  | Índice maestro, registro del RFC, trazabilidad y estado de los hallazgos | Se sincroniza según el estado real y el proceso gobernado; no se declara aprobado antes de tiempo      |
| **EE-DOC-002**                                  | Plantilla y estándares documentales que originaron el RFC                | La aprobación de cambios congelados sigue el mecanismo normativo aplicable                             |
| **EE-DOC-005**                                  | Clasificación del cambio y workflow de desarrollo, PR y release          | Las modificaciones normativas se aplican después de la aprobación correspondiente                      |
| **EE-DOC-007**                                  | Gobernanza de GitHub, permisos, ramas, tags y workflows                  | La configuración real no cambia por la sola aprobación del texto; requiere tarea y evidencia operativa |
| **EE-DOC-011**                                  | Contrato de automatización y release                                     | El contrato de §08.2 no cambia hasta que la enmienda sea aprobada y sincronizada                       |
| **EE-AUDIT-Rules_Emerging / Progress Register** | Inventario y estado de los hallazgos, incluidos PN-021 y PN-030          | Los hallazgos no se cierran sin evidencia verificable                                                  |
| Scripts, tests y CI                             | Implementación del contrato aprobado                                     | No sustituyen la decisión normativa ni se modifican antes de la aprobación exigida                     |

### 02.6. Ampliación propuesta — flujo de trabajo colaborativo

Se incorpora a este RFC, que permanece abierto durante la oleada de auditoría, la formalización propuesta del flujo de colaboración entre responsable humano y asistente de ingeniería. Se autorizó preparar las enmiendas documentales en esta rama dedicada; esa autorización de preparación **no equivale por sí sola a la aprobación normativa final** ni autoriza cambios directos en `main`. Las versiones de DOC-005, DOC-007 y DOC-001 permanecen en revisión hasta completar el proceso gobernado.

La necesidad surge de hacer explícitos los límites de responsabilidad y el ciclo de integración documental/técnica: una rama por cambio coherente, separación de responsabilidades entre código y documentación, revisión mediante PR y evidencia de validación. La ampliación no modifica por sí sola la configuración de GitHub ni afirma que sus controles actuales ya soporten todo el flujo propuesto.

### 02.7. Delimitación frente a alternativas de ubicación o alcance

| Elemento                               | Rol                                             | Relación con la propuesta                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-001 / EE-DOC-002**            | Índice y estándar documental                    | Mantienen la precedencia normativa y los requisitos de versionado, historial y trazabilidad                                                                                      |
| Hallazgos **Tipo A/B** de la auditoría | Cambios de alcance documental acotado           | Se registran y siguen en el inventario/RFC cuando forman parte de la oleada; se materializan en el documento afectado conforme a EE-DOC-005, sin duplicar aquí todo su contenido |
| Hallazgos transversales **Tipo D**     | Cambios que afectan varias normas o superficies | Se incorporan explícitamente a RFC-003 con alcance, alternativas, impacto, criterios de aceptación y plan                                                                        |
| Árbol físico de **EE-DOC-006**         | Otra superficie documental                      | Sus hallazgos mantienen sus referencias y límites; solo se incorporan aquí los puntos explícitamente declarados como parte de la oleada                                          |
| Configuración real de GitHub           | Evidencia operativa                             | No cambia por este RFC; cualquier cambio real de configuración requiere tarea, revisión y validación separadas                                                                   |

### 02.8. Gobernanza e integridad del release (Ampliación propuesta)

Durante la auditoría del flujo **A-REL** se identificó una discrepancia entre el contrato de release de **EE-DOC-011 §08.2**, el comportamiento de `scripts/commands/release` y el flujo de integración de **EE-DOC-005** y **EE-DOC-007**. El script actual exige ejecutar el release desde `main` o `master`, prepara un commit y un tag local antes de publicar y posteriormente intenta hacer push con `git push --follow-tags`. Ese flujo entra en tensión con la integración mediante Pull Request, la revisión y los controles de rama protegida.

La propuesta preferida es preparar el versionado mediante un PR, publicar paquetes elegibles desde un job post-merge con permisos mínimos y crear el tag anotado al final, después de completar la publicación o confirmar que no hay paquetes elegibles. Los reintentos deben comprobar el estado remoto y completar solo las operaciones pendientes, sin sobrescribir versiones ni mover tags existentes.

Los hallazgos vinculados son **PN-021** (política de publicación npm y orden commit/tag) y **PN-030** (alineación entre CODEOWNERS, ruleset, CI y script de release). Ambos permanecen abiertos hasta que el contrato normativo, la implementación y la evidencia estén alineados.

Esta ampliación se gestiona en RFC-003 como parte de la oleada de auditoría. La inclusión aquí no aprueba automáticamente los cambios, no modifica documentos congelados ni configura GitHub. Cada materialización debe seguir el proceso gobernado aplicable; el RFC puede permanecer abierto mientras se aprueban e implementan paquetes de trabajo parciales.

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

### 03.3. Superficie C — EE-DOC-005 y EE-DOC-007 (enmienda preparada en rama; RFC general abierto)

| Documento                                   | Cambio propuesto                                                                                                                                                                                                                                                                               | Límite                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-005 — Development Workflow**       | Formalizar una rama por cambio coherente (no por archivo); commits acotados; revisión y validación antes de integrar; responsabilidades explícitas: el usuario implementa código y el asistente puede preparar documentación; documentación alineada con la implementación y la evidencia real | En esta rama se prepara v1.5.0 en revisión; la versión normativa vigente en main no cambia hasta aprobación y merge autorizados                            |
| **EE-DOC-007 — GitHub Governance**          | Aclarar la aplicación del flujo mediante GitHub: rama de trabajo acordada, PR creado por el usuario, revisión y merge autorizado; separar cambios documentales de cambios de configuración                                                                                                     | En esta rama se prepara v1.2.0 en revisión; no duplicar el workflow de 005 ni afirmar controles no verificados                                             |
| **EE-DOC-001 — Master Documentation Index** | Tras la decisión, sincronizar el registro del RFC, referencias y el historial/estado que corresponda                                                                                                                                                                                           | La sincronización del índice registra las versiones propuestas y su estado de revisión; el RFC general sigue Propuesto hasta el cierre formal de la oleada |

### 03.4. Trazabilidad de reglas emergentes de colaboración

El detalle de las reglas de colaboración detectadas durante la auditoría se mantiene en **EE-AUDIT-Rules_Emerging.md**, conforme a su función de inventario no normativo y backlog de hallazgos. La propuesta de formalización se conserva como pendiente **PN-035** hasta que se evalúe y se promueva mediante el mecanismo gobernado aplicable.

Este RFC no convierte por sí solo esas reglas en normativa aprobada. Las superficies normativas candidatas y sus límites permanecen descritos en §03.3; la decisión de incorporación se toma al resolver el pendiente y revisar los documentos afectados.

### 03.5. Límites y tratamiento de los hallazgos de auditoría

| Ítem                                                        | Tratamiento                                                                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Migraciones de código corto sin `EE` en el corpus           | Se ejecutan por documento conforme a su auditoría; RFC-003 conserva la trazabilidad de los hallazgos incluidos en la oleada             |
| Gate `validateDocumentation`                                | Sigue diferido hasta que su hallazgo sea evaluado, aprobado e implementado mediante el proceso aplicable                                |
| Historial de siete columnas en RFC/IMP/TEC existentes       | Se corrige por documento conforme a su auditoría y al mecanismo gobernado correspondiente                                               |
| Hallazgos Tipo A/B                                          | Pueden registrarse y seguirse en el inventario/RFC sin duplicar su contenido; se materializan en el documento afectado según EE-DOC-005 |
| Árbol físico de **EE-DOC-006** (`.devcontainer/`, `audit/`) | Mantiene su alcance y referencias específicas (`PN-009`/`PN-010`); su incorporación no autoriza cambios no descritos                    |
| Configuración real de GitHub                                | Se trata como evidencia operativa; requiere una tarea separada para modificar workflows, permisos, environments o rulesets              |
| Código fuente y automatización                              | No se modifican por la mera inclusión de un hallazgo en RFC-003; requieren aprobación y un cambio de implementación trazable            |

### 03.6. Superficie D — Release, automatización e integración protegida

| Superficie                                  | Cambio propuesto                                                                                              | Límite                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **EE-DOC-005 §11.3 y workflow relacionado** | Sincronizar la preparación de versiones mediante rama/PR, revisión, merge y ejecución post-merge              | El PR lo crea la persona responsable; no se integra directamente en `main`                                 |
| **EE-DOC-007**                              | Definir workflow autorizado, permisos mínimos y gobernanza de tags                                            | La configuración real de workflows, permisos y rulesets requiere una tarea operativa y evidencia separadas |
| **EE-DOC-011 §08.2**                        | Actualizar el contrato de release, incluyendo preparación, elegibilidad, orden publicación/tag y recuperación | El contrato vigente no cambia hasta la aprobación y sincronización normativas correspondientes             |
| **`scripts/commands/release`**              | Incorporar un modo `prepare` local y separar la preparación de la publicación post-merge                      | No hacer push directo a `main` ni publicar desde la preparación local                                      |
| **`scripts/lib/`**                          | Extraer lógica de release comprobable y permitir inyección/simulación de dependencias                         | Evitar una refactorización no necesaria fuera de los contratos que deban probarse                          |
| **`scripts/tests/`**                        | Probar preflight, elegibilidad, orden, fallos parciales e idempotencia                                        | Sin publicaciones, commits ni tags reales en pruebas                                                       |
| **CI post-merge**                           | Añadir un job separado con disparador explícito, permisos mínimos y recuperación                              | `contents: write` solo para el job que crea el tag; OIDC de npm cuando esté soportado y configurado        |
| **`scripts/README.md`**                     | Documentar modos, efectos, prerrequisitos, publicación condicional y recuperación                             | Debe permanecer alineado con las normas y la implementación aprobadas                                      |
| **EE-DOC-001 / registro de auditoría**      | Mantener trazabilidad de PN-021 y PN-030 y de su evidencia de cierre                                          | No cerrar hallazgos antes de verificar los criterios de aceptación                                         |

### 03.7. Modelo de release propuesto

#### A. Preparación local por PR

El modo local `prepare` debe:

1. Verificar el estado del repositorio, la rama y los prerrequisitos.
2. Calcular la versión raíz objetivo y ejecutar el versionado de Changesets para actualizar versiones y changelogs.
3. Ejecutar los gates exigidos para la preparación y comprobar que los cambios de release están identificados.
4. Crear/preparar una rama de release y un commit revisable con los cambios de versionado.
5. Finalizar sin abrir automáticamente un PR, hacer push directo a `main`, crear el tag de release ni publicar paquetes.

La persona responsable crea el PR según EE-DOC-005 §08.1 R5. El merge se realiza únicamente después de la revisión y los controles aplicables. El job post-merge no debe crear un segundo commit de versión en `main`.

#### B. Disparador post-merge

El workflow se dispara mediante `push` a `main` y solo continúa si el commit integrado modifica la versión raíz en el patrón esperado para un PR de preparación de release. Debe validar la versión objetivo, el commit de origen y la ausencia de un tag de release previo antes de cualquier operación de escritura. Los pushes ordinarios no deben iniciar una publicación accidental.

La implementación debe definir explícitamente el tratamiento del primer release, cuando no existe una versión/tag anterior para comparar, y fallar de forma segura si el evento o la versión objetivo son ambiguos. La ejecución debe serializarse para evitar dos releases concurrentes de la misma versión.

#### C. Elegibilidad npm

La elegibilidad se evalúa post-merge; no depende de que los archivos Changeset originales sigan existiendo, porque el proceso de versionado los consume durante la preparación del PR.

Un paquete es elegible si:

- pertenece a un workspace reconocido por la configuración efectiva de PNPM/Changesets;
- su manifiesto declara `private: false`;
- la versión objetivo no existe ya en el registro npm configurado;
- cumple la configuración efectiva de publicación y los requisitos de acceso del registro.

La detección debe enumerar los workspaces configurados y no recorrer indiscriminadamente todos los `package.json`, lo que podría incluir artefactos generados o dependencias instaladas.

Según el inventario observado durante esta auditoría, los **26 workspaces tienen `private: true`**. En el estado actual, el resultado esperado es preparar versión y changelogs y finalizar con un tag, sin publicar paquetes npm. No se cambiará `private: true` para forzar publicaciones.

Si no hay paquetes elegibles, el job debe registrar explícitamente que no hay publicación aplicable y continuar hacia la creación del tag solo tras completar las validaciones exigidas.

#### D. Orden de operaciones

El orden propuesto es:

1. Validar el commit integrado, la versión raíz, el estado del repositorio y el objetivo del release.
2. Ejecutar los quality gates y el build exigidos por las normas vigentes.
3. Determinar los paquetes elegibles y comprobar el estado del registro.
4. Publicar los paquetes elegibles, si existen, y verificar el resultado.
5. Crear el tag anotado `vX.Y.Z` únicamente después de completar correctamente la publicación o confirmar que no hay paquetes elegibles.
6. Registrar el resultado y la evidencia del release.

Este orden sustituye expresamente la regla de **EE-DOC-011 §08.2 #4** que crea el commit/tag antes de publicar. La sustitución no es normativa hasta que se apruebe y sincronice el documento correspondiente.

#### E. Reintentos y recuperación

El flujo debe ser idempotente y comprobar el estado remoto antes de repetir operaciones:

- Ante una publicación parcial fallida, identificar los paquetes ya publicados y los pendientes; no intentar sobrescribir versiones existentes.
- Si la publicación finaliza pero falla la creación del tag, verificar las versiones publicadas y completar la creación del tag sin repetir publicaciones innecesarias.
- Si el tag ya existe, verificar que apunta al commit y versión esperados; no moverlo ni reemplazarlo silenciosamente.
- Si el estado remoto es ambiguo o inconsistente, fallar de forma explícita y requerir resolución, sin volver a ejecutar versionado a ciegas.

Los escenarios de recuperación se probarán con dependencias simuladas.

#### F. Permisos y seguridad

El job que crea el tag requiere `contents: write`; este permiso debe limitarse a ese job y no concederse a los jobs ordinarios de validación. La publicación npm puede utilizar OIDC mediante `id-token: write` cuando el registro y la configuración de confianza lo permitan. Los permisos de publicación solo se habilitan cuando hay paquetes elegibles.

Las reglas de protección para tags `v*` deben evaluarse como una tarea de gobernanza separada. No se afirmará que están configuradas hasta verificar el estado real y registrar evidencia.

### 03.8. Pruebas y evidencia de implementación

`scripts/commands/release` ejecuta actualmente `main()` al importarse y no ofrece inyección suficiente de dependencias para simular de forma determinista Git y npm. La implementación deberá extraer a `scripts/lib/` únicamente la lógica que requiera pruebas aisladas y exponer dependencias simulables.

Las pruebas se ubicarán en `scripts/tests/*.test.mjs` y se ejecutarán mediante `pnpm test:scripts`, que ya está integrado en el flujo de validación. No se creará un runner alternativo ni se harán publicaciones, commits o tags reales desde los tests.

La evidencia de cierre debe incluir:

- preflight sin mutaciones si falla un prerrequisito;
- elegibilidad positiva y negativa, incluidos paquetes privados y versiones ya existentes en el registro;
- ausencia de publicación cuando no hay paquetes elegibles;
- orden correcto de validación, publicación y creación del tag;
- fallos simulados de Git/npm y recuperación idempotente;
- verificación de versión, tag y commit esperado;
- resultados reales de los quality gates aplicables;
- coherencia entre las normas aprobadas, `scripts/README.md`, scripts y workflow CI.

### 03.9. Delimitación del cambio de release

Esta propuesta no cambia la privacidad de los paquetes, no convierte la existencia de Changesets en evidencia de elegibilidad post-merge y no habilita bypass de las protecciones de `main`.

Tampoco cambia automáticamente la configuración real de GitHub, secrets, environments, permisos o reglas de tags. Estas acciones requieren una tarea operativa separada, revisión de seguridad y evidencia verificable.

PN-021 y PN-030 permanecen abiertos hasta satisfacer sus criterios de cierre. La inclusión de este alcance en RFC-003 no equivale a aprobación normativa ni autoriza cambios de implementación anticipados.

## 04. Alternativas consideradas

| ID  | Alternativa                                                                                    | Dictamen                           | Motivo                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A1  | Clasificar solo Tipo B (especialización 002)                                                   | Rechazada                          | Alcance transversal (001 + familia VAL/WAIVE + catálogo global)                                           |
| A2  | Revertir v1.7–v1.9 y reintroducir vía RFC desde cero                                           | Rechazada                          | Coste alto; contenido ya alineado a auditoría                                                             |
| A3  | RFC Tipo D retroactivo (esta propuesta)                                                        | **Adoptada**                       | Cumple 001 R2 / 005 sin reescribir el fondo                                                               |
| A4  | Mantener el release local actual con commit/tag en `main` y push posterior                     | Rechazada como objetivo            | Contradice el flujo de integración protegida y complica la recuperación ante fallos parciales             |
| A5  | Convertir el script solo en preflight/dry-run sin preparar la versión ni definir CI post-merge | Rechazada                          | Deja sin resolver quién prepara el commit de versión y cómo se completa el release                        |
| A6  | Preparar versión por PR; publicar condicionalmente y crear tag al final desde CI               | Preferida, pendiente de aprobación | Separa preparación revisable, publicación y finalización, con permisos mínimos y recuperación idempotente |
| A7  | Cambiar `private: true` para publicar todos los workspaces                                     | Rechazada                          | La privacidad no es un mecanismo para forzar publicación y requiere decisiones por paquete                |

---

## 05. Impacto

| Ámbito                    | Impacto                                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Documentos normativos** | El RFC conserva la regularización de EE-DOC-002/EE-DOC-001 y amplía explícitamente el seguimiento a EE-DOC-005, EE-DOC-007 y EE-DOC-011 según los hallazgos incorporados |
| **Release y versionado**  | Se propone preparar versiones por PR, publicar solo paquetes elegibles y crear el tag al final del proceso post-merge                                                    |
| **Código y tests**        | Se prevé extraer lógica comprobable a `scripts/lib/` y añadir tests de release a `scripts/tests/`; no se ha implementado ni validado todavía                             |
| **CI y seguridad**        | Se requiere un job post-merge separado, permisos mínimos y evaluación independiente de protección de tags; OIDC es preferible si está soportado y configurado            |
| **Publicación npm**       | Los 26 workspaces observados tienen `private: true`; el comportamiento actual esperado es versión/changelog/tag sin publicación npm                                      |
| **Gobernanza**            | PN-021 y PN-030 permanecen abiertos hasta alinear norma, implementación y evidencia verificable                                                                          |
| **Compatibilidad**        | Cambia el contrato operativo del release; los documentos, scripts, tests y workflow deben sincronizarse después de la aprobación correspondiente                         |
| **Estado de validación**  | Esta revisión documental no implica que se hayan ejecutado tests, gates, builds ni cambios en GitHub                                                                     |

## 06. ADR

| Pregunta                                       | Respuesta                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Se requiere ADR separado para esta propuesta? | **No**                                                                                                                                                                                                                                                                                                              |
| Justificación                                  | Por decisión explícita de gobernanza del proyecto, los hallazgos transversales derivados de esta oleada de auditoría se acumulan y coordinan en RFC-003. No se abrirá un ADR independiente para duplicar este cambio. La clasificación y el proceso de aprobación aplicables continúan rigiendo la materialización. |

## 07. Criterios de aceptación

| #   | Criterio                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EE-DOC-001 §09.2 lista este RFC en **Propuesto** (vehículo abierto) hasta cierre de oleada                                                                                  |
| 2   | EE-DOC-002 historial referencia **EE-RFC-003** / Tipo D donde aplique el paquete                                                                                            |
| 3   | AR registradas de plantilla/metadatos volcadas a **002** (v1.10.0+) o justificadas                                                                                          |
| 4   | Sin discrepancia SSOT 002 §18.6 ↔ 001 §09.4 (VAL/WAIVE)                                                                                                                    |
| 5   | Al **cerrar** la oleada: estado **Aprobado** → **Implementado (documentación)** y dejar de acumular alcance sin nueva versión del RFC                                       |
| 6   | La decisión de continuar con la enmienda colaborativa queda registrada; las versiones propuestas de 005/007/001 permanecen en revisión hasta aprobación normativa y merge   |
| 7   | No se declara modificada la configuración GitHub sin cambio y evidencia verificables                                                                                        |
| 8   | La aprobación de este RFC no modifica por sí sola código fuente ni configuración; la implementación posterior requiere un cambio separado, autorizado y validado            |
| 9   | Los hallazgos transversales derivados de la auditoría se incorporan explícitamente a RFC-003 con alcance, referencias y estado trazables                                    |
| 10  | PN-021 y PN-030 permanecen abiertos hasta que norma, implementación y evidencia satisfagan sus criterios de cierre                                                          |
| 11  | La preparación de versión se realiza mediante rama y PR; el modo local no publica paquetes, crea el tag de release ni hace push directo a `main`                            |
| 12  | El disparador post-merge procesa solo una versión objetivo válida y no inicia releases accidentales en pushes ordinarios                                                    |
| 13  | La elegibilidad npm se basa en el workspace configurado, `private: false`, la inexistencia de la versión objetivo en el registro y la configuración efectiva de publicación |
| 14  | El estado observado de los 26 workspaces con `private: true` queda registrado sin cambiar su privacidad como parte de esta propuesta                                        |
| 15  | El tag anotado se crea al final, después de publicar correctamente los paquetes elegibles o confirmar que no hay publicación aplicable                                      |
| 16  | Los reintentos verifican el estado remoto y completan operaciones pendientes sin sobrescribir versiones ni mover tags existentes                                            |
| 17  | `contents: write` se limita al job que crea el tag; OIDC se utiliza para npm cuando esté soportado y configurado                                                            |
| 18  | La protección de tags `v*` se evalúa separadamente y no se declara activa sin evidencia verificable                                                                         |
| 19  | Los tests de release se ejecutan en `pnpm test:scripts` y CI y simulan Git/npm sin publicar paquetes ni crear tags reales                                                   |
| 20  | EE-DOC-005, EE-DOC-007, EE-DOC-011, `scripts/README.md`, el script y CI se sincronizan con el contrato aprobado                                                             |
| 21  | Los gates y pruebas se registran con resultados reales; no se declara cerrada una validación no ejecutada o fallida                                                         |

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                                                                                             | Responsable                                      |
| ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
|     1 | Mantener RFC-003 Propuesto y abierto durante la oleada de auditoría                                                                                                | Arquitectura                                     |
|     2 | Revisar los hallazgos incorporados y aprobar cada paquete de trabajo conforme al proceso gobernado aplicable, sin presumir aprobación por su mera inclusión        | Equipo de Arquitectura                           |
|     3 | Sincronizar EE-DOC-001 §09.2/§14/§15 con el estado real del RFC y los hallazgos, respetando el orden de actualización establecido                                  | Arquitectura                                     |
|     4 | Ejecutar las migraciones documentales `PC-*` / `PN-*` por documento auditado y mantener sus referencias de trazabilidad                                            | Equipo de auditoría                              |
|     5 | Al cierre formal de la oleada, actualizar el estado del RFC conforme a los criterios de cierre; las nuevas enmiendas de alcance requieren nueva versión de trabajo | Arquitectura                                     |
|     6 | Preparar las enmiendas de EE-DOC-005, EE-DOC-007 y EE-DOC-011 en una rama dedicada y registrar su estado de revisión sin afirmar aprobación normativa anticipada   | Equipo de Arquitectura                           |
|     7 | Tras la aprobación correspondiente, implementar `prepare`, la elegibilidad, el workflow post-merge y la recuperación idempotente                                   | Ingeniería / responsable de CI                   |
|     8 | Extraer la lógica de release comprobable a `scripts/lib/` y añadir pruebas simuladas en `scripts/tests/`, integradas en `pnpm test:scripts`                        | Ingeniería                                       |
|     9 | Evaluar y configurar por separado permisos, OIDC, environments y reglas de tags `v*`, registrando evidencia real                                                   | Gobernanza GitHub / responsable de configuración |
|    10 | Sincronizar `scripts/README.md` con el contrato aprobado y la implementación real                                                                                  | Ingeniería / Documentación                       |
|    11 | Ejecutar y registrar quality gates, build y pruebas de release aplicables; corregir los fallos antes del cierre                                                    | Ingeniería / QA                                  |
|    12 | Cerrar PN-021 y PN-030 únicamente cuando los criterios de aceptación estén respaldados por evidencia verificable                                                   | Equipo de auditoría / Arquitectura               |

## 09. Riesgos y mitigaciones

| Riesgo                                                       | Mitigación                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Corpus aún no cumple código corto / historial 7 cols         | Plan por documento (M-01 / M-03 diferidos)                                    |
| 015 usa otro patrón de nombre de archivo                     | 002 manda `{ID}_{Nombre}_{fecha}.md`; alinear 015 en su auditoría             |
| Alineación EE-DOC-004 v1.2.0 sin RFC específico de 006 §13.2 | Diferida a la auditoría de 006 (`PN-008`); este RFC no sustituye ese vehículo |

---

## 10. Referencias

| Código                      | Rol                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **EE-DOC-001**              | R2, R7, §08.1, §09.4                                                                     |
| **EE-DOC-002**              | Estándar de forma; v1.7.0–v1.10.0+                                                       |
| **EE-DOC-005**              | Tipo D §04.2                                                                             |
| **EE-AUDIT-Rules_Emerging** | Inventario AR / backlog PC-PN-PA                                                         |
| **EE-DOC-010**              | WAIVED §04.6.1                                                                           |
| **EE-DOC-015**              | Validación; padre VAL                                                                    |
| **EE-DOC-005**              | Workflow normativo; clasificación Tipo D y ciclo de cambios gobernados                   |
| **EE-DOC-007**              | Gobernanza de GitHub; controles operativos que implementan el workflow                   |
| **EE-TEC-002**              | Evidencia consolidada de configuración GitHub; solo se modifica si cambia el estado real |
| **EE-IMP-010-P03**          | Evidencia de gates/seguridad/arquitectura, si el cambio operativo afecta su alcance      |

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

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                            | Cambios                                                                                                                                                   | Estado       |
| ---------- | ---------- | ---------------------- | ---------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **v0.1.0** | 2026-10-11 | Equipo de Arquitectura | —                      | C-01 auditoría 002                | Creación RFC Tipo D retroactivo                                                                                                                           | Propuesto    |
| **v0.2.0** | 2026-10-13 | Equipo de Arquitectura | Equipo de Arquitectura | Vehículo abierto auditoría        | Indexado en 001 §09.2; alcance oleada 002 v1.10 / 004; criterios y plan                                                                                   | **Aprobado** |
| **v0.3.0** | 2026-10-13 | Equipo de Arquitectura | Equipo de Arquitectura | Conformidad §18.5                 | §02 con roles 02.1–02.5; §03 sin «Superficie C» (03.1/03.2/03.3); §05 etiquetas del template; §06 Sí/No + Justificación; metadato Clasificación unificado | **Aprobado** |
| **v0.4.0** | 2026-10-22 | Equipo de Arquitectura | Equipo de Arquitectura | Consolidación pre-main            | Consolida workflow colaborativo, metadatos y enmiendas propuestas a DOC-001, DOC-005 y DOC-007.                                                           | **Aprobado** |
| **v0.5.0** | 2026-10-24 | Equipo de Arquitectura | —                      | Auditoría transversal de releases | Incorpora PN-021/PN-030: preparación por PR, publicación npm post-merge, tag final, recuperación idempotente, permisos mínimos y pruebas simuladas.       | **Aprobado** |

---

## FIN DEL DOCUMENTO
