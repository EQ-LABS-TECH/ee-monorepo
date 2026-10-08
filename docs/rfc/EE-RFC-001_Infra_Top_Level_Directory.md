# EE-RFC-001 — Incorporation of `infra/` into the Top-Level Repository Tree and Index Synchronization

Este documento es una **Request for Comments (RFC)** conforme a **EE-DOC-005 — Development Workflow** (clasificación **Tipo D — Cambio Significativo / Transversal**). No sustituye a los documentos normativos; propone el cambio gobernado necesario para autorizarlos.

---

## METADATOS

| Campo                               | Valor                                                                                                                |
| :---------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **ID**                              | EE-RFC-001                                                                                                           |
| **Title**                           | Incorporation of `infra/` into the Top-Level Repository Tree and Index Synchronization                               |
| **Código corto**                    | EE-RFC-001                                                                                                           |
| **Tipo**                            | Request for Comments (Cambio gobernado)                                                                              |
| **Clasificación EE-DOC-005**        | **D — Cambio Significativo / Transversal**                                                                           |
| **Estado**                          | Aprobado / Implementado (documentación)                                                                              |
| **Versión**                         | v1.2.0                                                                                                               |
| **Propietario**                     | Equipo de Arquitectura                                                                                               |
| **Solicitante**                     | EE-DOC-009 — Infrastructure (elaboración)                                                                            |
| **Documentos normativos afectados** | **EE-DOC-006** y **EE-DOC-001** — **único paquete de sincronización normativa** (no cambios secuenciales informales) |
| **Documento de dominio**            | EE-DOC-009 — Infrastructure v0.3.0                                                                                   |
| **ADR asociado**                    | No requerido para la ubicación (ver §06)                                                                             |
| **Fecha de creación**               | 2026-09-25                                                                                                           |
| **Última revisión**                 | 2026-09-25                                                                                                           |
| **Audiencia**                       | Arquitectura, Desarrollo, DevOps                                                                                     |
| **Responsable de decisión**         | Equipo de Arquitectura (revisión y aprobación)                                                                       |

---

## 01. Resumen ejecutivo

Se propone un **único cambio gobernado** (un solo RFC, un solo paquete de aprobación) que, de forma **inseparable**:

1. Amplía el árbol de primer nivel de **EE-DOC-006** con el directorio canónico **`infra/`**, registrando el **nivel estructural autorizado** (existencia y categoría), incluido el subárbol inicial de primer ciclo `containers/` y `orchestration/` como _estructura mínima autorizada_ — **sin** trasladar a 006 la semántica de infraestructura (que permanece en EE-DOC-009).
2. Sincroniza **EE-DOC-001** en el **mismo** acto normativo, de modo que el artefacto de **EE-DOC-009** deje de figurar como `docker/`, `k8s/` y pase a **`infra/`**.

La modificación de EE-DOC-001 **no** es una consecuencia posterior informal: es **parte del mismo cambio gobernado** que la de EE-DOC-006. Hasta que **ambas** superficies estén **aprobadas y sincronizadas**, no existe autorización para materializar `infra/` en el monorepo.

---

## 02. Motivación

### 02.1. Descubrimiento

Durante la elaboración de **EE-DOC-009 — Infrastructure** se adoptó la **Opción B**: la infraestructura de **producto/plataforma** debe vivir bajo una raíz de primer nivel **`infra/`**, separada de:

- el entorno local de desarrollo (**EE-DOC-008**, p.ej. `.devcontainer/`);
- los adaptadores de integración (**EE-DOC-006**: `connectors/official/docker`, `connectors/official/kubernetes`).

### 02.2. Conflicto normativo actual

| Fuente                       | Estado                                                                                                                                                             |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EE-DOC-006 (Congelado)       | **§05 (Estructura de Directorios)** define el árbol de primer nivel **sin** `infra/`; el documento delega el _contenido semántico_ de infraestructura a EE-DOC-009 |
| EE-DOC-001 (SSOT del índice) | Declara artefactos de EE-DOC-009 como `docker/`, `k8s/` y prevalece ante discrepancias hasta sincronización aprobada                                               |
| EE-DOC-009 v0.3.0            | Fija `infra/` como canónico; exige RFC coordinado 006+001 antes de materializar                                                                                    |

El problema **no** es el naming (`docker/` vs `infra/`). El problema es la **autoridad** para introducir un **nuevo directorio de primer nivel** y la **prevalencia del índice** (EE-DOC-001) hasta sincronización aprobada.

Crear `infra/`, `docker/` o `k8s/` en el repositorio **ahora** respecto del árbol congelado de EE-DOC-006 constituiría una **desviación silenciosa** respecto de la especificación normativa vigente. Ello está en conflicto con la **Regla de no desviación unilateral** de **EE-DOC-005 §04** (_ningún descubrimiento… podrá resolverse mediante una desviación silenciosa respecto de la especificación normativa vigente; toda desviación conocida deberá gestionarse mediante el mecanismo de cambio gobernado_) y con el principio **Governance First** (EE-DOC-005), que exige gestionar excepciones o desviaciones por los mecanismos de gobernanza del ecosistema. El mecanismo aplicable a un cambio transversal de esta naturaleza es el **RFC (Tipo D)**.

### 02.3. Interpretación del cambio

Este RFC **no** significa:

> “Meter el dominio semántico de infraestructura dentro de Repository Structure.”

Significa:

> “**Completar la frontera física** necesaria para que Repository Structure represente el dominio que **ya delegó** a Infrastructure (EE-DOC-009).”

### 02.4. Límite de autoridad 006 vs 009

| Documento      | Qué autoriza / norma este RFC                                                                                                                                                                                                  |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-006** | **Existencia** del directorio de primer nivel `infra/`, su **categoría** en el mapa de primer nivel, y el **subárbol estructural mínimo** de primer ciclo (`containers/`, `orchestration/`) como paths autorizados en el árbol |
| **EE-DOC-009** | **Significado**, principios, reglas de contenerización/orquestación, fronteras con 008/conectores, y especialización del contenido bajo `infra/`                                                                               |
| **EE-DOC-001** | **Registro SSOT** del artefacto asociado a EE-DOC-009 en el índice                                                                                                                                                             |

006 **no** absorbe la semántica de Infrastructure. 009 **no** puede autorizar por sí sola un top-level ausente del árbol congelado de 006.

---

## 03. Propuesta

### 03.1. Superficie A — EE-DOC-006 (nivel estructural)

**Alcance de 006 en este RFC:** registrar únicamente el **nivel estructural autorizado**.

Incorporar en el árbol de primer nivel de **§05**:

```text
ee-monorepo/
├── packages/
├── apps/
├── connectors/
├── scripts/
├── docs/
├── assets/
├── data/
├── examples/
├── marketplace/
├── infra/                    # NUEVO — frontera física (dominio EE-DOC-009)
│   ├── containers/           # path estructural autorizado (semántica → 009)
│   └── orchestration/        # path estructural autorizado (semántica → 009)
└── …
```

| Elemento en 006            | Qué fija 006                                                               | Qué **no** fija 006 (pertenece a 009 / IMP) |
| :------------------------- | :------------------------------------------------------------------------- | :------------------------------------------ |
| **`infra/`**               | Existencia y categoría de primer nivel (p.ej. Plataforma / Infrastructure) | Reglas de IaC, secretos, entornos, vendors  |
| **`infra/containers/`**    | Path estructural mínimo autorizado                                         | Dockerfiles, Compose, políticas de imagen   |
| **`infra/orchestration/`** | Path estructural mínimo autorizado                                         | Manifiestos K8s/Helm/Kustomize, overlays    |

**Fuera del alcance de este RFC en 006:**

- Cualquier detalle de archivos bajo `infra/**` más allá del subárbol mínimo mostrado.
- Estructura interna adicional (p.ej. `configs/`, `scripts/` bajo `infra/`) → **especialización técnica** de **EE-IMP-009-P01** (y U-04 de EE-DOC-009), sin reabrir 006 mientras no se añadan **nuevos** directorios de **primer nivel**.

### 03.2. Superficie B — EE-DOC-001 (índice SSOT) — mismo paquete

La actualización de EE-DOC-001 es **obligatoria y concurrente** con la de EE-DOC-006. No se aprueba ni se publica una sin la otra.

| Antes (vigente hasta sincronización)    | Después (tras aprobación de este RFC)                                                       |
| :-------------------------------------- | :------------------------------------------------------------------------------------------ |
| Artefacto EE-DOC-009: `docker/`, `k8s/` | Artefacto EE-DOC-009: **`infra/`** (`containers/`, `orchestration/` como paths del dominio) |

Actualizar la matriz/roadmap y notas derivadas que citen esos artefactos, de modo que **001 y 006 no discrepen** en ningún momento publicado como vigente.

### 03.3. Lo que este RFC **no** cambia

| Ítem                                | Tratamiento                                                                            |
| :---------------------------------- | :------------------------------------------------------------------------------------- |
| `connectors/official/docker`        | Permanecen como **adaptadores de integración**                                         |
| `connectors/official/kubernetes`    | Idem                                                                                   |
| EE-DOC-008 / `.devcontainer/`       | Sin cambio; frontera local vs producto intacta                                         |
| EE-DOC-007 / CODEOWNERS / equipos   | **Sin cambio normativo** en este RFC                                                   |
| Orquestador o cloud obligatorio     | **Fuera de alcance**; requiere **ADR** futuro si se congela baseline (EE-DOC-009 O-03) |
| Materialización en git del monorepo | **Prohibida** hasta aprobación + sincronización documental 006 **y** 001               |

---

## 04. Alternativas consideradas

Las alternativas se numeran **A–E** para trazabilidad con el debate previo (donde **B** era la opción seleccionada).

| ID    | Alternativa                                         | Dictamen                   | Motivo                                                                                                                              |
| :---- | :-------------------------------------------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **A** | Raíces de primer nivel `docker/` + `k8s/`           | **Rechazada**              | Paths atados a tecnologías concretas; dos anclas; **menos alineada a Vendor Agnostic** (EE-DOC-003) que una sola raíz por capacidad |
| **B** | `infra/` + RFC coordinado **006 + 001**             | **Propuesta seleccionada** | Una raíz por capacidad; Vendor Agnostic; frontera limpia con conectores; cambio mínimo en 006; SSOT de 001 en el mismo paquete      |
| **C** | IaC bajo `connectors/official/…`                    | **Rechazada**              | Confunde integración (adaptadores) con definición de plataforma                                                                     |
| **D** | IaC bajo `scripts/` o `packages/foundation/…`       | **Rechazada**              | Viola la separación de responsabilidades del árbol de 006                                                                           |
| **E** | Actualizar solo 006 y “luego” 001 de forma informal | **Rechazada**              | Viola el carácter SSOT de 001; deja discrepancia vigente; **no** es un único cambio gobernado                                       |

---

## 05. Impacto

| Ámbito                      | Impacto de **este RFC**                                                                                                                                                                        |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EE-DOC-006**              | Cambio **mínimo** de árbol (§05) y categoría; sin rediseño del resto del monorepo                                                                                                              |
| **EE-DOC-001**              | Sincronización del artefacto de EE-DOC-009 (**mismo paquete** que 006)                                                                                                                         |
| **EE-DOC-009**              | Ya alineado (v0.3.0 §08); semántica de infra no se mueve a 006                                                                                                                                 |
| **Monorepo físico**         | **Ninguno** hasta post-aprobación y sincronización; luego **EE-IMP-009-P01**                                                                                                                   |
| **EE-DOC-007 / CODEOWNERS** | **Sin modificación por este RFC.** El ownership de `infra/` (p.ej. architecture + maintainers) es **impacto posterior de la materialización** en EE-IMP-009, no consecuencia normativa del RFC |
| **CI (job Validate)**       | Sin cambio obligatorio por este RFC                                                                                                                                                            |
| **Desarrolladores**         | Nueva convención documentada tras scaffold IMP (`infra/README.md`)                                                                                                                             |

---

## 06. ADR

| Pregunta                                | Respuesta                                                                                             |
| :-------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| ¿Se requiere ADR para adoptar `infra/`? | **No.** Es decisión de **estructura de repositorio / frontera documental**, no congelación de vendor. |
| ¿Cuándo sí ADR?                         | Si Arquitectura declara un orquestador o cloud como **baseline obligatorio** del ecosistema.          |

---

## 07. Criterios de aceptación del RFC

El RFC se considera **aplicado en el plano documental** cuando se cumplen **todos** los siguientes checks:

| #   | Check medible                                                                                                                                                            |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **EE-DOC-006 §05** incluye **`infra/`** en el árbol de primer nivel y en la categorización asociada                                                                      |
| 2   | **EE-DOC-006 §05** registra el subárbol estructural mínimo `infra/containers/` e `infra/orchestration/` como paths autorizados (sin semántica de producto en 006)        |
| 3   | **EE-DOC-001**: el artefacto de **EE-DOC-009** **no** declara `docker/` ni `k8s/` como top-level del monorepo; declara **`infra/`** (y, si aplica, sus paths de dominio) |
| 4   | Historial/versión de **001** y **006** actualizados; **sin discrepancia SSOT** entre índice y árbol                                                                      |
| 5   | Este RFC en estado **Aprobado**; tras aplicar los diffs, puede marcarse **Implementado** (documentación)                                                                 |

La materialización física en git **no** es criterio de este RFC. Corresponde a **EE-IMP-009-P01**, **solo después** de los checks 1–5.

---

## 08. Plan de aplicación (post-aprobación)

| Orden | Acción                                                                                        | Responsable            |
| :---: | :-------------------------------------------------------------------------------------------- | :--------------------- |
|   1   | Aprobar EE-RFC-001                                                                            | Equipo de Arquitectura |
|   2   | Parche normativo **EE-DOC-006** (`infra/` en §05 + categoría)                                 | Arquitectura           |
|   3   | Parche normativo **EE-DOC-001** (artefacto 009) — **mismo paquete / misma ola** que el paso 2 | Arquitectura           |
|   4   | Verificar sincronización 001 ↔ 006 ↔ 009 §08                                                | Arquitectura           |
|   5   | Continuar ciclo EE-DOC-009 (revisión / Aprobado)                                              | Arquitectura           |
|   6   | EE-IMP-009-P01 — scaffold físico `infra/` (incluye ownership/CODEOWNERS si aplica)            | Implementación         |

Los pasos **2 y 3** no se publican como vigentes de forma independiente.

---

## 09. Riesgos y mitigaciones

| Riesgo                                         | Mitigación                                               |
| :--------------------------------------------- | :------------------------------------------------------- |
| Drift: crear `infra/` antes de sincronizar 001 | U-03 / G-02 en EE-DOC-009; criterios §07                 |
| Confusión connectors vs infra                  | §02.4 / §03.3; README en scaffold IMP                    |
| Scope creep (terraform, multi-cloud en el RFC) | Fuera de alcance; solo frontera estructural              |
| 006 absorbe semántica de 009                   | §02.4 y tabla §03.1: 006 = estructura; 009 = significado |
| Reinterpretar el RFC como rediseño de 006      | §02.3: completar frontera delegada                       |

---

## 10. Referencias

| Código                | Rol                                                                 |
| :-------------------- | :------------------------------------------------------------------ |
| **EE-DOC-005**        | Tipo D; **§04 Regla de no desviación unilateral**; Governance First |
| **EE-DOC-006**        | §05 árbol de primer nivel; delegación de infra a 009                |
| **EE-DOC-001**        | SSOT del índice; prevalencia hasta sincronización                   |
| **EE-DOC-009** v0.3.0 | Opción B; §08 autoridad; G-01…G-04                                  |
| **EE-DOC-003**        | Vendor Agnostic                                                     |
| **EE-DOC-004**        | Infrastructure Layer                                                |
| **EE-DOC-008**        | Frontera Dev Container                                              |

---

## 11. Resolución

| Campo                                     | Valor                                                    |
| :---------------------------------------- | :------------------------------------------------------- |
| **Estado**                                | **Aprobado** / **Implementado (documentación)**          |
| **Responsable de decisión**               | **Equipo de Arquitectura**                               |
| **Decisión**                              | **Aceptado** — Opción B; paquete 006 v1.4.0 + 001 v2.5.0 |
| **Fecha de resolución**                   | 2026-09-25                                               |
| **Condiciones de materialización física** | EE-DOC-009 Aprobado + EE-IMP-009-P01                     |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                                   | Motivo                                                                                                                                                                | Estado                                      |
| :--------- | :--------- | :-------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| **v1.0.0** | 2026-09-25 | AI Engineering Assistant / Arquitectura | Propuesta inicial RFC coordinado `infra/`                                                                                                                             | Propuesto                                   |
| **v1.1.0** | 2026-09-25 | AI Engineering Assistant / Arquitectura | Revision pass: límite 006 vs 009; paquete único 001+006; cita EE-DOC-005 §04; alternativas A–E; CODEOWNERS como impacto IMP; checks medibles; responsable de decisión | Propuesto                                   |
| **v1.1.1** | 2026-09-25 | AI Engineering Assistant                | Document title in English (naming convention)                                                                                                                         | Propuesto                                   |
| **v1.2.0** | 2026-09-25 | Equipo de Arquitectura                  | Aprobado; aplicado en EE-DOC-006 v1.4.0 y EE-DOC-001 v2.5.0                                                                                                           | **Aprobado / Implementado (documentación)** |

---

## FIN DEL DOCUMENTO
