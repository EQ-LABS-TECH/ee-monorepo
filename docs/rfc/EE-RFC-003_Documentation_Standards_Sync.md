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
| **Versión**                         | v0.6.0                                                                                                              |
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
| **Última revisión**                 | 2026-10-28                                                                                                          |
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

Durante la auditoría del flujo **A-REL** se identificaron discrepancias entre el contrato de release de **EE-DOC-011 §08.2**, el proceso de preparación y publicación y las garantías de integración protegida establecidas por **EE-DOC-005** y **EE-DOC-007**. Estas discrepancias motivan la necesidad de gobernar explícitamente la procedencia del release, las condiciones de publicación, la creación del tag y la recuperación ante fallos.

La propuesta preferida es preparar el versionado mediante un PR, publicar paquetes elegibles desde un proceso post-merge con permisos mínimos y crear el tag anotado al final, después de satisfacer las condiciones de elegibilidad y finalización aprobadas. Los reintentos deben comprobar el estado remoto y completar solo las operaciones pendientes, sin sobrescribir versiones ni mover tags existentes.

La integridad del release requiere garantizar que el plan autorizado corresponde a los cambios de versión revisados e integrados. Se propone exigir procedencia verificable y comprobación independiente de la correspondencia entre el plan preparado y el plan autorizado para publicación, sin confiar exclusivamente en una declaración generada durante la preparación.

La política de elegibilidad distingue entre versionar el ecosistema y distribuir paquetes npm. El flujo de publicación npm exige al menos un paquete público en el plan efectivo y verificado de release. Un plan sin paquetes públicos no habilita la finalización de ese flujo ni la creación de su tag. Los releases exclusivamente internos o de plataforma requieren un contrato independiente. La conformidad operativa queda condicionada a la sincronización del contrato aplicable y a su validación verificable.

Los hallazgos vinculados son **PN-021** (política de publicación npm y orden commit/tag), **PN-017** (aprobaciones reforzadas para cambios críticos), **PN-019** (regularización del régimen transitorio de bypass) y **PN-030** (alineación entre CODEOWNERS, rulesets, CI, permisos y automatización de release). Permanecen abiertos hasta disponer de decisiones aprobadas, configuración efectiva y evidencia verificable.

#### Gobernanza escalable de revisión y aprobación

Se propone materializar el modelo de aprobación establecido por EE-DOC-005 y EE-DOC-007, distinguiendo cambios ordinarios y críticos.

Los cambios ordinarios requieren al menos una aprobación calificada e independiente del autor y los Quality Gates aplicables. Los cambios críticos requieren al menos dos aprobaciones calificadas e independientes del autor, conforme al contrato normativo vigente.

La clasificación de criticidad deberá basarse en los criterios definidos en EE-DOC-005, sin depender exclusivamente de etiquetas o declaraciones que el autor pueda modificar unilateralmente.

CODEOWNERS mantiene la responsabilidad técnica sobre las áreas del monorepo. Su integración con los mecanismos de revisión deberá garantizar la participación de propietarios elegibles, sin introducir ownership ficticio ni conceder permisos administrativos innecesarios.

#### Alcance consultivo inicial de PN-017

La primera fase de PN-017 consiste en un inspector de evidencia de Pull Requests, integrado como job consultivo independiente de los Quality Gates obligatorios. Su ejecución no autoriza la integración, no sustituye CODEOWNERS y no certifica el cumplimiento del régimen reforzado de aprobaciones.

La clasificación automatizada identifica rutas potencialmente críticas mediante indicadores conservadores. La ausencia de indicadores no constituye una clasificación afirmativa como cambio ordinario; permanece obligatoria la evaluación de impacto por los responsables autorizados.

El cómputo automatizado de aprobaciones constituye evidencia numérica de revisiones independientes, no una certificación de elegibilidad de revisores, ownership, cumplimiento integral de rulesets ni vigencia de las condiciones al momento del merge.

Durante el despliegue inicial, el workflow utiliza la implementación confiable disponible en la rama principal. Mientras el inspector no esté integrado allí, el job puede registrar expresamente su indisponibilidad sin ejecutar la inspección. Ese resultado deberá considerarse una omisión transitoria y nunca evidencia positiva de conformidad.

Los errores al obtener o validar evidencia impedirán producir un informe de inspección válido. Un informe emitido conservará el carácter consultivo y requerirá la revisión humana y los controles nativos de GitHub correspondientes.

La transición al enforcement obligatorio requerirá una decisión gobernada, configuración efectiva, participación de revisores elegibles y evidencia operativa verificable. La aprobación de esta propuesta no implica que dicha transición se haya completado.

##### PN-017 — Requisitos pendientes para enforcement automático

La implementación experimental incluye evaluación de aprobaciones, verificación de CODEOWNERS, publicación de checks y coordinación de entregas mediante leases.

Estos componentes no constituyen por sí mismos un servicio operativo ni autorizan activar `PR Governance` como required check.

Antes de habilitar el enforcement automático deberán verificarse:

1. **Runtime confiable:** receptor de webhooks desplegado fuera del contexto ejecutable de Pull Requests no confiables.
2. **Autenticación:** validación HMAC del cuerpo original del webhook, verificación de identidad del repositorio y credenciales de GitHub App con permisos mínimos.
3. **Persistencia compartida:** almacenamiento durable con operaciones CAS atómicas, revisiones no reutilizables y reloj confiable.
4. **Concurrencia:** renovación supervisada de leases, recuperación tras expiración y protección frente a trabajadores obsoletos.
5. **Efectos externos:** prevención de publicaciones favorables tardías cuando cambien las aprobaciones, la autoridad de los revisores o el HEAD del Pull Request.
6. **Eventos organizacionales:** descubrimiento y reevaluación de PRs afectados por cambios de permisos, equipos o membresías.
7. **Validación operativa:** pruebas de integración con servicios reales, fallos de infraestructura, reintentos y revocación de autorizaciones.
8. **Activación gobernada:** aprobación normativa, configuración efectiva de GitHub y evidencia de validación.

La implementación de pruebas unitarias y de integración simulada no sustituye estos requisitos.

Hasta completar la decisión gobernada, el workflow de enforcement permanece manual y no se configura como condición obligatoria de merge.

#### Régimen transitorio de adopción

Mientras la composición del equipo no permita satisfacer todas las aprobaciones independientes exigidas para cambios críticos, cualquier excepción deberá estar formalmente autorizada, documentada, justificada y sujeta a revisión y cierre.

El régimen transitorio no constituye cumplimiento del umbral definitivo ni permite declarar ejecutados controles omitidos.

La incorporación de nuevos revisores deberá permitir completar el enforcement sin redefinir los criterios normativos, el ownership o los Quality Gates.

#### Gobernanza de bypass

Las autorizaciones de bypass deberán tener una finalidad excepcional, un alcance explícito, autoridad responsable, trazabilidad y condiciones de revisión y cierre.

Las excepciones permanentes observadas en la configuración remota deberán evaluarse individualmente antes de su modificación. El bypass no podrá sustituir el proceso ordinario de Pull Request, revisión y validación.

##### Régimen operativo transitorio (PN-019)

Hasta que exista un mecanismo de recuperación administrativa aprobado y verificable, las capacidades de bypass configuradas en GitHub se considerarán **capacidades técnicas excepcionales**, no autorizaciones generales de integración.

La existencia de permisos administrativos no exime del cumplimiento de las políticas de Pull Request, CODEOWNERS, revisiones independientes ni Quality Gates. Ningún bypass podrá utilizarse para declarar conforme un cambio que incumpla las condiciones normativas aplicables.

Toda utilización excepcional deberá contar con un registro identificable que permita verificar:

1. **Motivo y necesidad:** incidente, bloqueo técnico o riesgo que justifique la excepción.
2. **Alcance:** repositorio, rama, PR o referencia afectada y controles que serían excepcionalmente omitidos.
3. **Autoridad:** responsable que solicita y autoridad que aprueba la excepción, con independencia de funciones cuando sea viable.
4. **Alternativas:** mecanismos ordinarios de recuperación evaluados y motivo de su insuficiencia.
5. **Autorización:** decisión explícita y trazable anterior a la ejecución, salvo emergencia documentada.
6. **Ejecución:** identidad ejecutora, operación efectuada y evidencia verificable.
7. **Validación posterior:** comprobación de integridad, seguridad y Quality Gates afectados.
8. **Cierre:** resultado, medidas correctivas, revisión de causa raíz y decisión sobre la permanencia de la excepción.

La falta de personal suficiente para satisfacer temporalmente el número objetivo de revisores deberá registrarse como una limitación de capacidad de revisión. No constituirá por sí misma una autorización de bypass.

##### Recuperación y reducción de privilegios

Antes de eliminar o restringir una autorización administrativa existente deberán verificarse:

- La capacidad de recuperación ante una configuración incorrecta de rulesets.
- La existencia de una autoridad administrativa responsable y accesible.
- La posibilidad de restablecer protecciones sin recurrir a una identidad no autorizada.
- La evidencia de que el procedimiento de recuperación no introduce una vía ordinaria de evasión.
- La aprobación del cambio mediante el mecanismo de gobernanza correspondiente.

La reducción de privilegios se ejecutará únicamente después de validar estas condiciones. La ausencia de evidencia mantendrá PN-019 abierto y no permitirá declarar regularizada la configuración.

##### Criterios de cierre de PN-019

PN-019 podrá considerarse cerrado únicamente cuando:

1. El régimen de excepciones esté aprobado y documentado.
2. Las autorizaciones efectivas de bypass hayan sido inventariadas y contrastadas con la configuración remota.
3. Cada autorización permanente disponga de justificación, alcance y responsable identificables, o haya sido retirada mediante un procedimiento validado.
4. Exista evidencia verificable del mecanismo de recuperación administrativa.
5. Se haya comprobado que las excepciones no sustituyen el flujo ordinario de revisión y validación.
6. Se haya registrado la decisión final de aceptación, restricción o eliminación de cada capacidad excepcional.

Mientras estas condiciones no se satisfagan, **PN-019 permanecerá abierto**.

#### Gobernanza de tags y publicación

La protección de tags de release deberá distinguir creación autorizada, actualización y eliminación, preservando la integridad de los identificadores de versión.

La identidad de publicación deberá disponer únicamente de los permisos necesarios para ejecutar el proceso aprobado. La autenticación npm y las condiciones de finalización del release deberán verificarse antes de declarar conforme la operación.

##### Estrategia propuesta de protección de tags (PN-030 / PN-021)

Se propone proteger los tags de release mediante dos rulesets de tags independientes del ruleset de la rama principal, ambos aplicados al patrón `v*`:

1. **Creación autorizada:** restringir la creación de nuevos tags y permitirla únicamente a la identidad de publicación expresamente autorizada.
2. **Inmutabilidad:** restringir la actualización y eliminación de tags existentes, sin conceder a la identidad publicadora una excepción ordinaria a estas restricciones.

La aplicación conjunta de ambos rulesets y sus excepciones deberá verificarse con la identidad real de publicación en un entorno controlado antes de habilitar su enforcement. La configuración efectiva permanecerá pendiente de aprobación y evidencia operativa.

El alcance inicial propuesto comprende los tags cuyo nombre comience con `v`, conforme al patrón de selección admitido por GitHub Rulesets. El formato SemVer y la correspondencia entre versión, manifest y commit seguirán siendo responsabilidad del contrato de release.

La estrategia de adopción será progresiva:

1. Verificar la identidad efectiva que ejecuta la creación y el envío de tags.
2. Evaluar restricciones de actualización y eliminación para impedir modificaciones no autorizadas de tags existentes.
3. Comprobar que la creación de nuevos tags sigue siendo posible únicamente mediante el procedimiento de publicación aprobado.
4. Determinar si la restricción de creación exige una identidad de publicación dedicada o permisos específicos de bypass.
5. Validar la configuración mediante evidencia operativa antes de activar su enforcement definitivo.

Las excepciones de ambos rulesets deberán cumplir el régimen de bypass definido para PN-019. No se concederán permisos de bypass generales a cuentas personales o equipos únicamente para facilitar la publicación.

La configuración de `contents: write` en GitHub Actions no se considerará evidencia suficiente de autorización bajo el ruleset. Deberá verificarse expresamente el resultado de la operación de creación del tag.

La publicación deberá minimizar la exposición de credenciales de escritura sobre GitHub. Las operaciones de validación, reconstrucción del plan y distribución npm no deberán depender de credenciales persistentes con capacidad para modificar referencias Git.

La autorización para enviar el tag deberá obtenerse únicamente cuando se hayan satisfecho las condiciones de publicación y verificación aplicables. Su alcance deberá limitarse al repositorio y a la operación autorizada, evitando que dicha credencial permanezca disponible innecesariamente durante la ejecución de código de construcción o publicación.

La separación de credenciales no deberá alterar la procedencia verificable del release, su recuperación idempotente ni la correspondencia entre el commit publicado y el tag definitivo.

La implementación deberá incluir pruebas de contrato que verifiquen el aislamiento de credenciales, el orden de las operaciones y el rechazo de modificaciones no autorizadas de tags.

La autenticación npm deberá evaluarse de forma independiente de la autorización para modificar referencias Git. El soporte efectivo de Trusted Publishing mediante OIDC requerirá verificar y, cuando corresponda, adaptar el contrato del comando de publicación.

Hasta completar estas verificaciones, la protección de tags permanecerá pendiente de habilitación operativa y no podrá declararse cerrada bajo PN-021 o PN-030.

##### Política propuesta de elegibilidad de publicación (PN-021)

El flujo de publicación npm del Engineering Ecosystem requiere al menos un paquete público incluido en el plan efectivo y verificado de Changesets. Su aplicación operativa debe mantenerse alineada con EE-DOC-011 §08.2 y con las verificaciones de integridad y publicación correspondientes.

Un plan sin paquetes públicos no será elegible para finalizar mediante este flujo ni para generar su tag de release. Los releases exclusivamente internos o de plataforma requerirán un contrato de release separado y aprobado antes de su implementación.

Si las versiones públicas previstas ya existen en npm, la ejecución podrá considerarse un reintento o una recuperación idempotente, siempre que se verifiquen la identidad de las versiones publicadas, el plan autorizado y la correspondencia del tag con el commit esperado.

La creación y el envío del tag deberán ocurrir únicamente después de satisfacer las verificaciones de integridad y publicación. Ningún reintento podrá sobrescribir versiones npm, desplazar tags existentes o interpretar errores de consulta como ausencia de una versión.

La habilitación operativa requerirá verificar la identidad y el mecanismo de autenticación npm, así como las reglas efectivas de protección de tags. Hasta completar esas verificaciones, PN-021 permanecerá abierto.

#### Autoridad de clasificación y enforcement de PN-017

La gobernanza de Pull Requests establece mecanismos diferenciados para la clasificación del impacto, la revisión técnica, la verificación de aprobaciones y el control obligatorio previo a la integración.

La clasificación deberá respetar los criterios de criticidad definidos en EE-DOC-005, las responsabilidades de CODEOWNERS establecidas en EE-DOC-007 y los requisitos de independencia y elegibilidad de los revisores.

##### Autoridad para clasificar impacto

La confirmación explícita de un cambio `ORDINARY` corresponde al **Equipo de Arquitectura**, manteniendo la responsabilidad de revisión técnica de los equipos definidos por `CODEOWNERS`.

La clasificación deberá cumplir las siguientes reglas:

1. Los indicadores críticos prevalecen sobre cualquier declaración de impacto ordinario. Un cambio identificado como `CRITICAL` no podrá reclasificarse como `ORDINARY` mediante una declaración del revisor.
2. La ausencia de indicadores críticos no acredita automáticamente que el cambio sea ordinario. En ausencia de una clasificación autorizada, el estado será `PENDING_REVIEW`.
3. La clasificación `ORDINARY` requerirá una declaración explícita de un revisor autorizado, independiente del autor del Pull Request y asociada a una aprobación vigente respecto del HEAD evaluado.
4. La autoridad del revisor deberá acreditarse mediante evidencia confiable de permisos efectivos y membresía activa en el Equipo de Arquitectura. No podrá inferirse exclusivamente del nombre de usuario, permisos administrativos, comentarios, etiquetas o declaraciones del autor.
5. La clasificación del impacto deberá evaluarse sobre el conjunto de cambios del Pull Request, sin sustituir la responsabilidad técnica de los propietarios de cada área afectada.
6. La confirmación de una clasificación `ORDINARY` no sustituirá las aprobaciones independientes exigibles, la participación de CODEOWNERS ni los Quality Gates aplicables.

Los cambios críticos requerirán al menos **dos aprobaciones independientes y calificadas**, mientras que los cambios ordinarios requerirán al menos **una aprobación independiente y calificada**, conforme a EE-DOC-005 y EE-DOC-007.

El cumplimiento numérico del umbral no constituirá por sí solo evidencia de elegibilidad del revisor ni autorización de integración.

##### Separación de controles

La materialización de PN-017 deberá mantener dos mecanismos diferenciados:

- **PR Governance Advisory:** inspector consultivo, de solo lectura, encargado de recopilar y evaluar evidencia de clasificación, aprobaciones, permisos y consistencia del Pull Request. Sus resultados no autorizan la integración.
- **PR Governance Enforcement:** control obligatorio encargado de verificar la clasificación autorizada, la elegibilidad de los revisores y el cumplimiento del umbral de aprobaciones correspondiente antes de permitir la integración.

Ambos mecanismos deberán preservar la separación entre recopilación de evidencia y autorización de integración.

Un resultado satisfactorio del inspector consultivo no podrá utilizarse como sustituto del control obligatorio ni como acreditación de conformidad con las políticas de revisión.

El enforcement deberá complementar los controles nativos de GitHub, incluyendo CODEOWNERS, las reglas de protección de ramas y los Quality Gates existentes, sin deshabilitarlos ni sustituirlos.

##### Vigencia, consistencia y concurrencia

La evaluación obligatoria deberá utilizar evidencia confiable correspondiente al Pull Request y al HEAD objeto de integración.

El mecanismo deberá detectar y tratar los cambios que afecten a la validez de la decisión, incluyendo:

1. Nuevos commits o modificaciones del HEAD.
2. Aprobaciones nuevas, desestimadas o sustituidas.
3. Modificaciones de las declaraciones de clasificación de impacto.
4. Cambios en permisos efectivos o membresías que afecten a la elegibilidad de los revisores.
5. Modificaciones de la identidad, procedencia o destino del Pull Request que invaliden la evidencia recopilada.

Los resultados favorables anteriores no podrán conservar su efecto de autorización cuando hayan dejado de cumplirse las condiciones que los originaron.

La implementación deberá gestionar las ejecuciones concurrentes y los eventos recibidos fuera de orden, evitando que evaluaciones obsoletas prevalezcan sobre evidencia más reciente.

La asociación entre el resultado obligatorio y el commit evaluado deberá ser inequívoca.

Los estados de ejecución que GitHub considere satisfactorios no podrán interpretarse automáticamente como conformidad normativa cuando la evaluación requerida haya sido omitida, cancelada o no ejecutada.

La solución deberá verificarse operativamente mediante los mecanismos de GitHub Actions y Checks que correspondan.

##### Identidad de gobernanza y permisos

El mecanismo de enforcement deberá utilizar una **identidad de gobernanza independiente** de la automatización de publicación de releases.

Esta identidad deberá disponer únicamente de los permisos necesarios para:

1. Consultar los datos del Pull Request y sus revisiones.
2. Verificar permisos efectivos y membresías de los revisores en los equipos autorizados.
3. Publicar o actualizar los resultados del control obligatorio mediante el mecanismo de GitHub seleccionado.

La consulta de membresías deberá utilizar una fuente confiable y deberá impedir que la falta de visibilidad, los errores de autorización o las respuestas incompletas se interpreten como evidencia favorable.

Las credenciales deberán gestionarse mediante los mecanismos seguros de GitHub, sin exposición a código no confiable procedente de Pull Requests.

La identidad de publicación de releases no deberá recibir permisos adicionales para resolver las necesidades de gobernanza de revisiones.

##### Condiciones de materialización y activación

La activación del enforcement obligatorio requerirá evidencia verificable de las siguientes condiciones:

1. Implementación de la autoridad de clasificación definida en este apartado y verificación de su aplicación efectiva.
2. Configuración y validación de la identidad de gobernanza y de sus permisos mínimos.
3. Participación efectiva de revisores elegibles conforme a CODEOWNERS y a las responsabilidades establecidas en EE-DOC-007.
4. Bloqueo de integración de un Pull Request crítico que disponga de una sola aprobación calificada.
5. Aceptación del umbral de revisión crítica únicamente cuando existan al menos dos aprobaciones independientes y calificadas, sin omitir los demás controles exigibles.
6. Rechazo o invalidación de evidencia obsoleta, aprobaciones desestimadas, declaraciones modificadas y cambios del HEAD.
7. Tratamiento formal de las excepciones transitorias y del bypass administrativo conforme a PN-019, sin declarar conforme un cambio que incumpla los requisitos ordinarios.
8. Verificación del comportamiento de los checks obligatorios ante ejecuciones omitidas, fallidas, concurrentes o asociadas a commits anteriores.
9. Validación de ausencia de regresiones en los Quality Gates, el workflow de Pull Requests y los procesos de release existentes.

Hasta que se verifiquen estas condiciones y se materialice el control obligatorio en GitHub, el inspector conservará su carácter consultivo y PN-017 permanecerá abierto.

#### Matriz de materialización y brechas de GitHub Governance (PN-030)

La conformidad de GitHub Governance deberá evaluarse mediante la correspondencia entre las políticas normativas, la configuración efectiva de GitHub, la implementación versionada y la evidencia de ejecución. La presencia de un archivo de configuración o una prueba local satisfactoria no equivale por sí sola a enforcement operativo.

| Superficie              | Estado observado                                                                                              | Brecha o condición de cierre                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CODEOWNERS              | Configurado con equipos responsables por área                                                                 | Verificar participación efectiva de revisores elegibles en PR reales.                                                                                                                 |
| Protección de `main`    | Ruleset activo con PR obligatorio, una aprobación, CODEOWNERS y `Validate` requerido                          | Mantener los controles nativos y resolver el refuerzo de aprobaciones críticas mediante PN-017.                                                                                       |
| Aprobaciones críticas   | Dos aprobaciones requeridas normativamente; una exigida por el ruleset                                        | Demostrar enforcement efectivo del umbral crítico sin depender exclusivamente de evidencia consultiva.                                                                                |
| Inspector de gobernanza | Implementación consultiva y pruebas locales disponibles; sin ejecución operativa confirmada en GitHub Actions | Verificar su ejecución efectiva una vez integrado en `main`, distinguir inspección ejecutada de omisión transitoria y evaluar posteriormente el enforcement de aprobaciones críticas. |
| Bypass administrativo   | Autorización permanente asociada al rol administrativo                                                        | Aplicar el régimen de excepciones y recuperación definido para PN-019.                                                                                                                |
| CI                      | Job `Validate` requerido; job consultivo propuesto en la rama de trabajo                                      | Verificar ejecución remota y mantener diferenciados los controles obligatorios de los informativos.                                                                                   |
| Publicación npm         | Workflow post-merge y contrato de release implementados                                                       | Verificar identidad de publicación, credenciales y operación real sin exposición de secretos.                                                                                         |
| Tags de release         | No se identificó un ruleset de tags en la configuración consultada                                            | Aprobar y verificar protección de creación, actualización y eliminación, compatible con la identidad autorizada.                                                                      |

##### Requisitos de evidencia

La evaluación de PN-030 deberá conservar, como mínimo:

1. Identificación de la configuración efectiva y de las referencias de los controles aplicables.
2. Correspondencia entre rutas protegidas por CODEOWNERS y responsabilidades de revisión.
3. Resultado de las pruebas locales y de las ejecuciones remotas de CI relevantes.
4. Evidencia de aprobación independiente y aplicación de los umbrales exigibles.
5. Inventario de excepciones y autorizaciones de bypass, con sus decisiones de regularización.
6. Verificación de la identidad de publicación y de las restricciones efectivas sobre tags.
7. Registro de brechas pendientes, responsables y condiciones de resolución.

La matriz constituye un estado de evaluación y no modifica automáticamente el ruleset, los permisos, los workflows ni las políticas normativas vigentes.

**PN-030 permanecerá abierto** mientras existan brechas de enforcement o falte evidencia operativa para los controles requeridos.

#### Criterios de materialización

La implementación deberá demostrar, mediante pruebas y evidencia operativa:

1. Bloqueo de integración sin las aprobaciones y Quality Gates exigibles.
2. Participación efectiva de CODEOWNERS conforme a las responsabilidades aprobadas.
3. Aplicación del control reforzado de aprobación para cambios críticos.
4. Excepciones transitorias y bypass autorizados, trazables y sujetos a cierre.
5. Protección efectiva de los tags frente a operaciones no autorizadas.
6. Compatibilidad entre la identidad de publicación, los permisos GitHub y la autenticación npm.
7. Ausencia de regresiones en los procesos de CI y release existentes.

Esta ampliación se gestiona en RFC-003 como parte de la oleada de auditoría. La mera inclusión de una propuesta no constituye su aprobación normativa, que se acredita mediante la entrada correspondiente del historial de cambios. La aprobación individual no modifica automáticamente documentos congelados ni autoriza cambios operativos en GitHub. Cada materialización deberá seguir el proceso gobernado aplicable.

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

| Superficie                                  | Cambio propuesto                                                                                                            | Límite                                                                                                                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-005 §11.3 y workflow relacionado** | Sincronizar la preparación de versiones mediante rama/PR, revisión, merge y ejecución post-merge                            | El PR lo crea la persona responsable; no se integra directamente en `main`                                                                                                                                        |
| **EE-DOC-007**                              | Definir workflow autorizado, permisos mínimos y gobernanza de tags                                                          | La configuración real de workflows, permisos y rulesets requiere una tarea operativa y evidencia separadas                                                                                                        |
| **EE-DOC-011 §08.2**                        | Reconciliar el contrato de preparación, procedencia verificable, elegibilidad, publicación, creación del tag y recuperación | Sincronizar la política de elegibilidad definida en §02.8 y las garantías de procedencia con el contrato normativo vigente; verificar su trazabilidad y materialización conforme al mecanismo gobernado aplicable |
| **`scripts/commands/release`**              | Incorporar un modo `prepare` local y separar la preparación de la publicación post-merge                                    | No hacer push directo a `main` ni publicar desde la preparación local                                                                                                                                             |
| **`scripts/lib/`**                          | Extraer lógica de release comprobable y permitir inyección/simulación de dependencias                                       | Evitar una refactorización no necesaria fuera de los contratos que deban probarse                                                                                                                                 |
| **`scripts/tests/`**                        | Probar preflight, elegibilidad, orden, fallos parciales e idempotencia                                                      | Sin publicaciones, commits ni tags reales en pruebas                                                                                                                                                              |
| **CI post-merge**                           | Añadir un job separado con disparador explícito, permisos mínimos y recuperación                                            | `contents: write` solo para el job que crea el tag; OIDC de npm cuando esté soportado y configurado                                                                                                               |
| **`scripts/README.md`**                     | Documentar modos, efectos, prerrequisitos, publicación condicional y recuperación                                           | Debe permanecer alineado con las normas y la implementación aprobadas                                                                                                                                             |
| **EE-DOC-001 / registro de auditoría**      | Mantener trazabilidad de PN-021 y PN-030 y de su evidencia de cierre                                                        | No cerrar hallazgos antes de verificar los criterios de aceptación                                                                                                                                                |

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

Según el inventario observado durante esta auditoría, los **26 workspaces tenían `private: true`**. Esta condición evidencia la necesidad de distinguir el versionado del ecosistema de la distribución de paquetes npm. No se propone cambiar la privacidad de los workspaces para forzar publicaciones.

Para el flujo de publicación npm se establece como criterio de elegibilidad la presencia de al menos un paquete público en el plan efectivo y verificado de release. Los planes sin paquetes públicos no habilitan la finalización de ese flujo ni la creación de su tag. Los releases exclusivamente internos o de plataforma requieren un contrato independiente. La aplicación de esta decisión deberá reflejarse de manera coherente en el contrato normativo, la automatización y las condiciones de recuperación.

#### D. Orden de operaciones

El orden propuesto es:

1. Validar el commit integrado, la versión raíz, el estado del repositorio y el objetivo del release.
2. Ejecutar los quality gates y el build exigidos por las normas vigentes.
3. Determinar los paquetes elegibles y comprobar el estado del registro.
4. Publicar los paquetes elegibles, si existen, y verificar el resultado.
5. Crear el tag anotado `vX.Y.Z` únicamente después de satisfacer las condiciones de finalización del release aprobadas, incluida la política aplicable cuando no existan paquetes públicos elegibles.
6. Registrar el resultado y la evidencia del release.

El modelo propuesto requiere reconciliar expresamente las normas de **EE-DOC-011 §08.2** con las garantías de procedencia, elegibilidad, orden de publicación y creación del tag. Ningún cambio de contrato se considera normativo hasta completar su aprobación y sincronización documental.

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

### 03.8. Condiciones de aceptación y evidencia requerida

La aprobación del cambio de release requiere demostrar que las garantías propuestas son exigibles, verificables y compatibles con el modelo de integración protegida del ecosistema.

La evaluación de conformidad deberá contemplar la procedencia del plan de release, la comprobación independiente de su integridad, la elegibilidad de publicación, el orden de finalización, los reintentos seguros y el tratamiento de estados inconsistentes.

La política de elegibilidad definida en §02.8 deberá reflejarse coherentemente en el contrato normativo, el comportamiento implementado y las condiciones de creación del tag. No se considerará satisfecho este requisito mientras existan contradicciones o falte evidencia verificable de su aplicación.

Los resultados técnicos y operativos deberán registrarse en sus artefactos de evidencia correspondientes. La aprobación del RFC no implica que las verificaciones hayan sido ejecutadas ni que las configuraciones operativas estén habilitadas.

### 03.9. Delimitación del cambio de release

Esta propuesta no cambia la privacidad de los paquetes, no convierte la existencia de Changesets en evidencia de elegibilidad post-merge y no habilita bypass de las protecciones de `main`.

Tampoco cambia automáticamente la configuración real de GitHub, secrets, environments, permisos o reglas de tags. Estas acciones requieren una tarea operativa separada, revisión de seguridad y evidencia verificable.

PN-021 y PN-030 permanecen abiertos hasta satisfacer sus criterios de cierre. La inclusión de este alcance en RFC-003 no equivale a aprobación normativa ni autoriza cambios de implementación anticipados.

## 04. Alternativas consideradas

| ID  | Alternativa                                                                                                         | Dictamen                                                                    | Motivo                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Clasificar solo Tipo B (especialización 002)                                                                        | Rechazada                                                                   | Alcance transversal (001 + familia VAL/WAIVE + catálogo global)                                                                                |
| A2  | Revertir v1.7–v1.9 y reintroducir vía RFC desde cero                                                                | Rechazada                                                                   | Coste alto; contenido ya alineado a auditoría                                                                                                  |
| A3  | RFC Tipo D retroactivo (esta propuesta)                                                                             | **Adoptada**                                                                | Cumple 001 R2 / 005 sin reescribir el fondo                                                                                                    |
| A4  | Mantener el release local actual con commit/tag en `main` y push posterior                                          | Rechazada como objetivo                                                     | Contradice el flujo de integración protegida y complica la recuperación ante fallos parciales                                                  |
| A5  | Convertir el script solo en preflight/dry-run sin preparar la versión ni definir CI post-merge                      | Rechazada                                                                   | Deja sin resolver quién prepara el commit de versión y cómo se completa el release                                                             |
| A6  | Preparar versión por PR; publicar condicionalmente y crear tag al final desde CI                                    | Preferida, pendiente de aprobación                                          | Separa preparación revisable, publicación y finalización, con permisos mínimos y recuperación idempotente                                      |
| A7  | Cambiar `private: true` para publicar todos los workspaces                                                          | Rechazada                                                                   | La privacidad no es un mecanismo para forzar publicación y requiere decisiones por paquete                                                     |
| A8  | Confiar únicamente en el plan declarado durante la preparación del release                                          | Rechazada como objetivo                                                     | No proporciona una garantía independiente de correspondencia entre la preparación revisada y la publicación autorizada                         |
| A9  | Exigir procedencia verificable y comprobación independiente del plan antes de publicar                              | Preferida, pendiente de aprobación                                          | Refuerza la integridad del release sin depender exclusivamente de la declaración generada durante su preparación                               |
| A10 | Permitir releases del ecosistema sin paquetes npm públicos frente a exigir al menos una release pública planificada | Criterio seleccionado: exigir al menos un paquete público para el flujo npm | La política de §02.8 distingue la publicación npm de los releases exclusivamente internos; su trazabilidad y materialización deben verificarse |

---

## 05. Impacto

| Ámbito                            | Impacto                                                                                                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Documentos normativos**         | El RFC conserva la regularización de EE-DOC-002/EE-DOC-001 y amplía explícitamente el seguimiento a EE-DOC-005, EE-DOC-007 y EE-DOC-011 según los hallazgos incorporados                                                                                                      |
| **Release y versionado**          | Se exige preservar la procedencia verificable y la integridad independiente del plan de release, manteniendo preparación revisable por PR, publicación post-merge, tag final y recuperación segura; la política de elegibilidad debe sincronizarse y validarse operativamente |
| **Implementación y verificación** | La materialización del contrato requiere implementación y evidencia independientes, sujetas a revisión de conformidad; su existencia no implica aprobación normativa                                                                                                          |
| **CI y seguridad**                | Se requiere un job post-merge separado, permisos mínimos y evaluación independiente de protección de tags; OIDC es preferible si está soportado y configurado                                                                                                                 |
| **Publicación npm**               | La separación entre versionado del ecosistema y distribución npm exige resolver explícitamente la política de releases sin paquetes públicos elegibles                                                                                                                        |
| **Gobernanza**                    | PN-021 y PN-030 permanecen abiertos hasta alinear norma, implementación y evidencia verificable                                                                                                                                                                               |
| **Compatibilidad**                | Cambia el contrato operativo del release; los documentos, scripts, tests y workflow deben sincronizarse después de la aprobación correspondiente                                                                                                                              |
| **Estado de validación**          | Esta revisión documental no implica que se hayan ejecutado tests, gates, builds ni cambios en GitHub                                                                                                                                                                          |

## 06. ADR

| Pregunta                                       | Respuesta                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Se requiere ADR separado para esta propuesta? | **No**                                                                                                                                                                                                                                                                                                              |
| Justificación                                  | Por decisión explícita de gobernanza del proyecto, los hallazgos transversales derivados de esta oleada de auditoría se acumulan y coordinan en RFC-003. No se abrirá un ADR independiente para duplicar este cambio. La clasificación y el proceso de aprobación aplicables continúan rigiendo la materialización. |

## 07. Criterios de aceptación

| #   | Criterio                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | EE-DOC-001 §09.2 lista este RFC en **Propuesto** (vehículo abierto) hasta cierre de oleada                                                                                                                                                     |
| 2   | EE-DOC-002 historial referencia **EE-RFC-003** / Tipo D donde aplique el paquete                                                                                                                                                               |
| 3   | AR registradas de plantilla/metadatos volcadas a **002** (v1.10.0+) o justificadas                                                                                                                                                             |
| 4   | Sin discrepancia SSOT 002 §18.6 ↔ 001 §09.4 (VAL/WAIVE)                                                                                                                                                                                       |
| 5   | Al **cerrar** la oleada: estado **Aprobado** → **Implementado (documentación)** y dejar de acumular alcance sin nueva versión del RFC                                                                                                          |
| 6   | La decisión de continuar con la enmienda colaborativa queda registrada; las versiones propuestas de 005/007/001 permanecen en revisión hasta aprobación normativa y merge                                                                      |
| 7   | No se declara modificada la configuración GitHub sin cambio y evidencia verificables                                                                                                                                                           |
| 8   | La aprobación de este RFC no modifica por sí sola código fuente ni configuración; la implementación posterior requiere un cambio separado, autorizado y validado                                                                               |
| 9   | Los hallazgos transversales derivados de la auditoría se incorporan explícitamente a RFC-003 con alcance, referencias y estado trazables                                                                                                       |
| 10  | PN-021 y PN-030 permanecen abiertos hasta que norma, implementación y evidencia satisfagan sus criterios de cierre                                                                                                                             |
| 11  | La preparación de versión se realiza mediante rama y PR; el modo local no publica paquetes, crea el tag de release ni hace push directo a `main`                                                                                               |
| 12  | El disparador post-merge procesa solo una versión objetivo válida y no inicia releases accidentales en pushes ordinarios                                                                                                                       |
| 13  | La elegibilidad npm se basa en el workspace configurado, `private: false`, la inexistencia de la versión objetivo en el registro y la configuración efectiva de publicación                                                                    |
| 14  | El estado observado de los 26 workspaces con `private: true` queda registrado sin cambiar su privacidad como parte de esta propuesta                                                                                                           |
| 15  | El tag anotado se crea únicamente después de cumplir las condiciones de finalización aprobadas, incluida la política expresa para releases sin paquetes públicos elegibles                                                                     |
| 16  | Los reintentos verifican el estado remoto y completan operaciones pendientes sin sobrescribir versiones ni mover tags existentes                                                                                                               |
| 17  | `contents: write` se limita al job que crea el tag; OIDC se utiliza para npm cuando esté soportado y configurado                                                                                                                               |
| 18  | La protección de tags `v*` se evalúa separadamente y no se declara activa sin evidencia verificable                                                                                                                                            |
| 19  | Los tests de release se ejecutan en `pnpm test:scripts` y CI y simulan Git/npm sin publicar paquetes ni crear tags reales                                                                                                                      |
| 20  | EE-DOC-005, EE-DOC-007, EE-DOC-011, `scripts/README.md`, el script y CI se sincronizan con el contrato aprobado                                                                                                                                |
| 21  | Los gates y pruebas se registran con resultados reales; no se declara cerrada una validación no ejecutada o fallida                                                                                                                            |
| 22  | El contrato aprobado exige procedencia verificable del release y comprobación independiente de la integridad del plan autorizado antes de publicar                                                                                             |
| 23  | La política de elegibilidad que exige al menos un paquete público planificado está reflejada sin contradicciones en el contrato normativo, la implementación y las condiciones de creación del tag, con evidencia verificable de su aplicación |
| 24  | La evidencia de conformidad se mantiene en los artefactos técnicos y de validación correspondientes, sin convertir este RFC en inventario de implementación                                                                                    |

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                                                                                                                                                                                                | Responsable                                      |
| ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
|     1 | Mantener RFC-003 Propuesto y abierto durante la oleada de auditoría                                                                                                                                                                                                   | Arquitectura                                     |
|     2 | Revisar los hallazgos incorporados y aprobar cada paquete de trabajo conforme al proceso gobernado aplicable, sin presumir aprobación por su mera inclusión                                                                                                           | Equipo de Arquitectura                           |
|     3 | Sincronizar EE-DOC-001 §09.2/§14/§15 con el estado real del RFC y los hallazgos, respetando el orden de actualización establecido                                                                                                                                     | Arquitectura                                     |
|     4 | Ejecutar las migraciones documentales `PC-*` / `PN-*` por documento auditado y mantener sus referencias de trazabilidad                                                                                                                                               | Equipo de auditoría                              |
|     5 | Al cierre formal de la oleada, actualizar el estado del RFC conforme a los criterios de cierre; las nuevas enmiendas de alcance requieren nueva versión de trabajo                                                                                                    | Arquitectura                                     |
|     6 | Preparar las enmiendas de EE-DOC-005, EE-DOC-007 y EE-DOC-011 en una rama dedicada y registrar su estado de revisión sin afirmar aprobación normativa anticipada                                                                                                      | Equipo de Arquitectura                           |
|     7 | Verificar la trazabilidad de las decisiones sobre procedencia, integridad independiente del plan y elegibilidad de publicación; sincronizar los contratos afectados y registrar evidencia de su implementación y validación conforme al mecanismo gobernado aplicable | Equipo de Arquitectura                           |
|     8 | Revisar la conformidad de la implementación existente con las decisiones aprobadas y determinar las adecuaciones necesarias sin considerar la existencia del código como aprobación normativa                                                                         | Arquitectura / Ingeniería                        |
|     9 | Evaluar y configurar por separado permisos, OIDC, environments y reglas de tags `v*`, registrando evidencia real                                                                                                                                                      | Gobernanza GitHub / responsable de configuración |
|    10 | Sincronizar `scripts/README.md` con el contrato aprobado y la implementación real                                                                                                                                                                                     | Ingeniería / Documentación                       |
|    11 | Ejecutar y registrar quality gates, build y pruebas de release aplicables; corregir los fallos antes del cierre                                                                                                                                                       | Ingeniería / QA                                  |
|    12 | Cerrar PN-021 y PN-030 únicamente cuando los criterios de aceptación estén respaldados por evidencia verificable                                                                                                                                                      | Equipo de auditoría / Arquitectura               |

## 09. Riesgos y mitigaciones

| Riesgo                                                            | Mitigación                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Corpus aún no cumple código corto / historial 7 cols              | Plan por documento (M-01 / M-03 diferidos)                                                                                                     |
| 015 usa otro patrón de nombre de archivo                          | 002 manda `{ID}_{Nombre}_{fecha}.md`; alinear 015 en su auditoría                                                                              |
| Alineación EE-DOC-004 v1.2.0 sin RFC específico de 006 §13.2      | Diferida a la auditoría de 006 (`PN-008`); este RFC no sustituye ese vehículo                                                                  |
| Procedencia del release insuficientemente garantizada             | Exigir garantías verificables e independientes del plan declarado antes de autorizar la publicación                                            |
| Interpretaciones divergentes sobre releases sin paquetes públicos | Aplicar de manera consistente la política de elegibilidad definida en §02.8, sincronizar los contratos afectados y verificar su implementación |
| Implementación anterior a la aprobación normativa completa        | Evaluar la conformidad del comportamiento existente y corregir cualquier discrepancia mediante el proceso gobernado                            |
| Cierre prematuro de PN-021 y PN-030                               | Exigir coherencia entre decisión aprobada, contratos, implementación y evidencia de verificación                                               |

---

## 10. Referencias

| Código                      | Rol                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **EE-DOC-001**              | R2, R7, §08.1, §09.4                                                                     |
| **EE-DOC-002**              | Estándar de forma; v1.7.0–v1.10.0+                                                       |
| **EE-DOC-005**              | Workflow normativo; clasificación Tipo D §04.2 y ciclo de cambios gobernados             |
| **EE-DOC-007**              | Gobernanza de GitHub; controles operativos que implementan el workflow                   |
| **EE-DOC-010**              | WAIVED §04.6.1                                                                           |
| **EE-DOC-015**              | Validación; padre VAL                                                                    |
| **EE-TEC-002**              | Evidencia consolidada de configuración GitHub; solo se modifica si cambia el estado real |
| **EE-IMP-010-P03**          | Evidencia de gates/seguridad/arquitectura, si el cambio operativo afecta su alcance      |
| **EE-AUDIT-Rules_Emerging** | Inventario AR / backlog PC-PN-PA                                                         |

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

| Versión    | Fecha      | Autor                    | Aprobado por             | Motivo                            | Cambios                                                                                                                                                                           | Estado       |
| ---------- | ---------- | ------------------------ | ------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **v0.1.0** | 2026-10-11 | Equipo de Arquitectura   | —                        | C-01 auditoría 002                | Creación RFC Tipo D retroactivo                                                                                                                                                   | Propuesto    |
| **v0.2.0** | 2026-10-13 | Equipo de Arquitectura   | Equipo de Arquitectura   | Vehículo abierto auditoría        | Indexado en 001 §09.2; alcance oleada 002 v1.10 / 004; criterios y plan                                                                                                           | **Aprobado** |
| **v0.3.0** | 2026-10-13 | Equipo de Arquitectura   | Equipo de Arquitectura   | Conformidad §18.5                 | §02 con roles 02.1–02.5; §03 sin «Superficie C» (03.1/03.2/03.3); §05 etiquetas del template; §06 Sí/No + Justificación; metadato Clasificación unificado                         | **Aprobado** |
| **v0.4.0** | 2026-10-22 | Equipo de Arquitectura   | Equipo de Arquitectura   | Consolidación pre-main            | Consolida workflow colaborativo, metadatos y enmiendas propuestas a DOC-001, DOC-005 y DOC-007.                                                                                   | **Aprobado** |
| **v0.5.0** | 2026-10-24 | Equipo de Arquitectura   | Equipo de Arquitectura   | Auditoría transversal de releases | Incorpora PN-021/PN-030: preparación por PR, publicación npm post-merge, tag final, recuperación idempotente, permisos mínimos y pruebas simuladas.                               | **Aprobado** |
| **v0.6.0** | 2026-10-28 | Responsable del proyecto | Responsable del proyecto | Gobernanza escalable de GitHub    | Amplía §02.8 con PN-017/PN-019/PN-030: revisión independiente, CODEOWNERS, aprobaciones críticas, régimen transitorio, bypass, protección de tags y criterios de materialización. | **Aprobado** |

---

## FIN DEL DOCUMENTO
