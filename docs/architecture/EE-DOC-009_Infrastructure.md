# EE-DOC-009 — Infrastructure

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** y se desarrolla conforme al ciclo documental definido por **EE-DOC-005 — Development Workflow**.

---

## METADATOS

| Campo                 | Valor                                                                   |
| :-------------------- | :---------------------------------------------------------------------- |
| **ID**                | EE-DOC-009                                                              |
| **Documento**         | Infrastructure                                                          |
| **Código corto**      | EE-DOC-009                                                              |
| **Tipo**              | Documento Normativo                                                     |
| **Clasificación**     | Especializado                                                           |
| **Nivel**             | Especializado                                                           |
| **Normativo**         | Sí                                                                      |
| **Versión**           | v1.1.0                                                                  |
| **Estado**            | Congelado                                                               |
| **Propietario**       | Equipo de Arquitectura                                                  |
| **Documento padre**   | EE-DOC-006 — Repository Structure                                       |
| **Dependencias**      | EE-DOC-001 … EE-DOC-008, EE-DOC-003, EE-ADR-001, EE-ADR-003, EE-RFC-001 |
| **Aprobado por**      | Equipo de Arquitectura                                                  |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, IA                                    |
| **Fecha de creación** | 2026-09-25                                                              |
| **Última revisión**   | 2026-09-26                                                              |
| **Próxima revisión**  | No aplica — Documento Congelado (cambio vía RFC)                        |

---

## 01. Propósito

Este documento define la **infraestructura base, los servicios de plataforma y la base de ejecución** del Engineering Ecosystem para el monorepo `ee-monorepo`.

Establece las reglas normativas para:

- la separación entre **entorno de desarrollo local** (EE-DOC-008) e **infraestructura de producto / plataforma**;
- los dominios de contenerización, orquestación y servicios de plataforma;
- la frontera con **conectores** de infraestructura (adaptadores) definidos en EE-DOC-006;
- la alineación con la **Infrastructure Layer** de EE-DOC-004;
- la **ubicación física canónica** de los manifiestos de infraestructura de producto (`infra/`);
- los principios de reproducibilidad, menor privilegio y **Vendor Agnostic** en la capa de ejecución.

No redefine el workflow (EE-DOC-005), la estructura congelada del monorepo (EE-DOC-006) —salvo la ampliación gobernada que este documento requiere—, la gobernanza GitHub (EE-DOC-007) ni el entorno local de desarrollo (EE-DOC-008).

---

## 02. Alcance

### 02.1. Incluye

| Área                                         | Dominio normativo                                                                                     |
| :------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| Contenerización de **producto / plataforma** | Imágenes, Dockerfiles y stacks de contenedores de cargas de trabajo del ecosistema (no Dev Container) |
| Orquestación                                 | Despliegue y ciclo de vida de servicios (p.ej. Kubernetes, Helm, Kustomize u orquestador equivalente) |
| Servicios de plataforma                      | Base de ejecución, soporte runtime, observabilidad de plataforma (conceptos)                          |
| Entornos lógicos                             | Distinción normativa development / staging (opcional) / production                                    |
| Secretos de **runtime de infraestructura**   | Principios (no el catálogo de GitHub Secrets de plataforma CI)                                        |
| Artefactos físicos                           | Árbol canónico bajo **`infra/`** (ver §08)                                                            |
| Fronteras                                    | Con EE-DOC-006, 007, 008, 010, 011 y con conectores `docker` / `kubernetes`                           |

### 02.2. No incluye

| Área                                                                | Documento / lugar responsable                                               |
| :------------------------------------------------------------------ | :-------------------------------------------------------------------------- |
| Estructura general del monorepo (árbol congelado)                   | **EE-DOC-006** (ampliación de `infra/` solo vía RFC)                        |
| Gobernanza GitHub, Rulesets, Actions de **plataforma de repo**      | **EE-DOC-007**                                                              |
| Dev Containers, `.vscode/`, bootstrap local Node/pnpm               | **EE-DOC-008**                                                              |
| Catálogo normativo de Quality Gates                                 | **EE-DOC-010**                                                              |
| Automatización de producto / CLI de negocio                         | **EE-DOC-011**                                                              |
| Código de adaptadores Docker/K8s como **conectores** de integración | `connectors/official/docker`, `connectors/official/kubernetes` (EE-DOC-006) |
| Proveedores cloud concretos como norma única                        | Prohibido por **Vendor Agnostic** (EE-DOC-003 / EE-DOC-004)                 |

---

## 03. Principios

| Principio                     | Regla                                                                                                                                                                                                                       |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vendor Agnostic**           | La norma describe **capacidades** (runtime de contenedores, orquestación, secretos de runtime). No exige un único proveedor cloud ni un único motor de orquestación. Los paths usan nombres de **capacidad**, no de vendor. |
| **Separation of Concerns**    | Desarrollo local (008) ≠ infraestructura de producto (009) ≠ conectores de integración (006).                                                                                                                               |
| **Infrastructure as Code**    | La infraestructura reproducible se expresa en artefactos versionados bajo `infra/`; no en configuración solo manual no rastreable.                                                                                          |
| **Least Privilege**           | Identidades, redes y secretos de runtime con el mínimo privilegio necesario.                                                                                                                                                |
| **Reproducibility**           | El mismo commit debe poder asociarse a manifiestos de infraestructura deterministas (cuando existan).                                                                                                                       |
| **Security by Design**        | Secretos fuera del código; no secretos en imágenes ni en manifests públicos.                                                                                                                                                |
| **No Silent Structure Drift** | Ningún directorio de infraestructura de producto podrá contradecir el árbol de EE-DOC-006 sin cambio gobernado (**RFC**).                                                                                                   |
| **Adapters at the Edge**      | El acceso a Docker/K8s _como API de integración_ pasa por conectores oficiales; la _definición_ de despliegue de plataforma vive bajo `infra/`.                                                                             |

---

## 04. Posición en la arquitectura

Conforme a **EE-DOC-004 — Engineering Architecture §07.8 (Infrastructure Layer)**:

| Responsabilidad de capa         | Traducción en EE-DOC-009                                                                    |
| :------------------------------ | :------------------------------------------------------------------------------------------ |
| Base técnica y operacional      | Contenerización y orquestación de plataforma bajo `infra/`                                  |
| Ejecución y soporte runtime     | Servicios de plataforma y entornos lógicos                                                  |
| Observabilidad de plataforma    | Principios (§06.4); detalle de métricas de producto puede vivir en governance/observability |
| Source control / CI de **repo** | **Fuera de alcance** → EE-DOC-007                                                           |

Integraciones externas de referencia (EE-DOC-004 §12.2), en el rol de **infraestructura de producto**:

| Conector lógico                          | Rol en 009                                                               |
| :--------------------------------------- | :----------------------------------------------------------------------- |
| Container Runtime (Docker u equivalente) | Runtime de contenedores de **producto/plataforma** (`infra/containers/`) |
| Orchestration (Kubernetes u equivalente) | Orquestación de cargas de trabajo (`infra/orchestration/`)               |

---

## 05. Fronteras obligatorias

### 05.1. EE-DOC-008 — Development Environment

| Concepto         | 008                                                           | 009                                                |
| :--------------- | :------------------------------------------------------------ | :------------------------------------------------- |
| Contenedor       | **Dev Container** (opcional, diferible) para el desarrollador | Contenedores de **servicios / cargas de producto** |
| Objetivo         | Paridad local de desarrollo                                   | Ejecución y despliegue de plataforma               |
| Artefacto típico | `.devcontainer/`                                              | `infra/containers/`, `infra/orchestration/`        |

**Prohibido:** tratar Dev Container como infraestructura de producción o como sustituto de orquestación de producto.

### 05.2. EE-DOC-006 — Repository Structure

- El árbol de EE-DOC-006 está **Congelado** hasta su ampliación gobernada.
- Los workspaces `connectors/official/docker` y `connectors/official/kubernetes` son **adaptadores de integración**, no el lugar canónico de manifiestos de despliegue de la plataforma.
- La ubicación canónica de manifiestos de producto es **`infra/`** (§08). El **RFC coordinado EE-RFC-001** está **aprobado e implementado en documentación** (EE-DOC-006 v1.4.0 + EE-DOC-001 v2.5.0). La materialización física en el monorepo corresponde a **EE-IMP-009-P01** tras la **Aprobación** de este documento.

### 05.3. EE-DOC-007 — GitHub Governance

- CI de **validación del monorepo** (job `Validate`) permanece bajo 007.
- Pipelines de **despliegue a infraestructura** (si existen) se diseñan sin contradecir least-privilege y secretos de 007; el _qué_ se despliega es dominio 009; el _cómo se autoriza en GitHub_ sigue 007.

### 05.4. EE-DOC-010 / EE-DOC-011

- Quality Gates de infraestructura (escaneo de imágenes, políticas de cluster, etc.) se **referencian** aquí y se **catalogan** en 010 cuando exista.
- Automatización de producto no se confunde con orquestación de plataforma (011).

---

## 06. Dominios normativos de infraestructura

### 06.1. Contenerización de producto

| Regla    | Descripción                                                                                                                                                                                                                 |
| :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C-01** | Las imágenes de producto del ecosistema deberán construirse de forma reproducible a partir del monorepo o de artefactos versionados bajo `infra/containers/`.                                                               |
| **C-02** | No se embeberán secretos en capas de imagen.                                                                                                                                                                                |
| **C-03** | La base de imagen y el runtime deberán ser compatibles con el baseline de ejecución del ecosistema cuando el servicio sea Node-based (**EE-ADR-003**: Node ≥ 24 < 25), salvo justificación documentada para otros runtimes. |
| **C-04** | Dev Container (008) **no** sustituye las imágenes de producto.                                                                                                                                                              |

### 06.2. Stack local de producto vs orquestación desplegada

Ambos perfiles pertenecen a **009** (producto/plataforma), no a 008:

| Perfil                      | Propósito                                                                                      | Ubicación normativa    | Ejemplo de artefactos (no exhaustivo)          |
| :-------------------------- | :--------------------------------------------------------------------------------------------- | :--------------------- | :--------------------------------------------- |
| **Stack local de producto** | Levantar dependencias de plataforma en máquina del desarrollador _como producto_ (no como IDE) | `infra/containers/`    | Compose u equivalente de stack de servicios    |
| **Orquestación desplegada** | Ciclo de vida en entornos development / staging / production                                   | `infra/orchestration/` | Manifiestos K8s, Helm, Kustomize u equivalente |

| Regla    | Descripción                                                                                                                                       |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **P-01** | El stack local de producto **no** reemplaza a `.devcontainer/` (008) ni a la orquestación desplegada.                                             |
| **P-02** | Los entornos lógicos de orquestación deberán poder distinguirse de forma explícita (al menos **development** y **production**; staging opcional). |

### 06.3. Orquestación

| Regla    | Descripción                                                                                                                                          |
| :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **O-01** | La orquestación de cargas de trabajo de plataforma se expresa como código bajo `infra/orchestration/`, no solo como clics en consola.                |
| **O-02** | Los entornos lógicos (al menos **development** y **production**; staging opcional) deberán poder distinguirse de forma explícita.                    |
| **O-03** | El orquestador concreto (Kubernetes u otro) es una **elección de implementación** documentada en IMP/ADR; este documento no congela un único vendor. |

### 06.4. Secretos y configuración de runtime

| Regla    | Descripción                                                                                                                         |
| :------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **S-01** | Secretos de runtime de infraestructura no se versionan en claro en el monorepo.                                                     |
| **S-02** | La inyección de secretos en runtime usa mecanismos del entorno (secret stores, variables inyectadas por la plataforma), no commits. |
| **S-03** | GitHub Secrets de **CI de plataforma** siguen EE-DOC-007; no se duplica aquí el catálogo operativo de Actions.                      |

### 06.5. Observabilidad de plataforma (mínimo)

| Regla    | Descripción                                                                                                                                                                                                                                   |
| :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **V-01** | Toda carga de trabajo de plataforma relevante deberá poder identificarse (nombre, versión/commit, entorno).                                                                                                                                   |
| **V-02** | El detalle de métricas de producto/dominio puede residir en paquetes de governance/observability; 009 exige la **capacidad** de telemetría de plataforma, no el catálogo completo de KPIs. Extensión coordinada con EE-DOC-010 cuando exista. |

---

## 07. Relación con conectores oficiales

| Workspace (EE-DOC-006)          | Rol                                                 |
| :------------------------------ | :-------------------------------------------------- |
| `@eq-labs/connector-docker`     | Adaptador de **integración** con API/runtime Docker |
| `@eq-labs/connector-kubernetes` | Adaptador de **integración** con API Kubernetes     |

Estos conectores **no** son, por sí solos, la definición de la infraestructura desplegada del ecosistema. **No** alojan el árbol canónico de manifiestos de plataforma. Pueden consumir o gobernar interacciones con la plataforma definida bajo `infra/`.

---

## 08. Artefactos físicos (ubicación canónica)

### 08.1. Problema de autoridad (no de naming)

El problema normativo **no** es primariamente elegir entre los nombres `docker/` y `infra/`. El problema es **quién tiene autoridad** para introducir un **nuevo directorio de primer nivel** en el monorepo.

| Hecho                                                                                                            | Consecuencia                                                                                          |
| :--------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| EE-DOC-006 está **Congelado** y define el árbol de primer nivel                                                  | Ningún top-level nuevo sin cambio gobernado                                                           |
| EE-DOC-006 separa `connectors/official/docker` y `…/kubernetes` como **conectores**                              | Esos paths **no** alojan IaC de plataforma                                                            |
| EE-DOC-006 delega el _contenido semántico_ de infraestructura a EE-DOC-009                                       | 009 define el dominio; 006 debe **representar** la frontera física                                    |
| EE-DOC-001 es **Single Source of Truth** del índice y prevalece ante discrepancias hasta sincronización aprobada | El artefacto hoy declarado (`docker/`, `k8s/`) **debe** actualizarse en el **mismo** cambio gobernado |

Por tanto, crear `infra/` (o `docker/` / `k8s/`) **ahora** en el repositorio sería una **desviación silenciosa** de EE-DOC-006, prohibida por EE-DOC-005.

### 08.2. Decisión arquitectónica (Opción B) — dictamen

| Campo                                    | Valor                                                                                                                                                  |
| :--------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Decisión**                             | Adoptar **`infra/`** como raíz canónica de infraestructura de **producto/plataforma**, con dominios iniciales **`containers/`** y **`orchestration/`** |
| **Fecha**                                | 2026-09-25                                                                                                                                             |
| **Clasificación del cambio estructural** | **RFC** (Type D) — afecta estructura transversal de repositorio y SSOT del índice                                                                      |
| **ADR para la ubicación**                | **No requerido** — la ubicación es decisión de estructura/repositorio, no baseline de vendor                                                           |
| **ADR posterior**                        | **Sí**, si se congela un orquestador o cloud como _baseline obligatorio_ (hoy O-03 lo mantiene abierto)                                                |

**Justificación (coherencia arquitectónica, no preferencia cosmética):**

- Paths por **capacidad** (`containers`, `orchestration`) alineados a **Vendor Agnostic** (EE-DOC-003 / EE-DOC-006).
- Un solo ancla de ownership de plataforma.
- Separación formal **Adapters at the Edge**: `infra/` = cómo se ejecuta/despliega la plataforma; `connectors/` = cómo EE-LABS **interactúa** con sistemas externos.
- El RFC a 006 **no** “mete infraestructura dentro de Repository Structure” como dominio semántico nuevo: **completa la frontera física** del dominio que 006 **ya delegó** a 009.

| Opción                                     | Dictamen |
| :----------------------------------------- | :------- |
| Crear `docker/` de primer nivel            | **No**   |
| Crear `k8s/` de primer nivel               | **No**   |
| IaC en `connectors/official/docker`        | **No**   |
| IaC en `connectors/official/kubernetes`    | **No**   |
| `infra/` como raíz canónica (conceptual)   | **Sí**   |
| Materializar `infra/` en el repo **ahora** | **No**   |
| RFC coordinado 006 + 001                   | **Sí**   |
| ADR solo por elegir `infra/`               | **No**   |

### 08.3. Árbol normativo (post-RFC)

```text
ee-monorepo/
└── infra/                              # EE-DOC-009 — Infrastructure as Code (producto / plataforma)
    ├── README.md                       # Alcance, fronteras 008 / conectores, cómo contribuir
    ├── containers/                     # Capacidad de contenerización de producto
    │   └── …                           # Dockerfiles, Compose/equivalente de stack, etc. (IMP)
    └── orchestration/                  # Capacidad de orquestación desplegada
        └── …                           # K8s/Helm/Kustomize/equivalente (IMP)
```

```text
                    EE-LABS
                       │
             ┌─────────┴─────────┐
             │                   │
       infraestructura       integración
             │                   │
          infra/              connectors/
             │                   │
      ┌──────┴──────┐       ┌────┴─────┐
      │             │       │          │
 containers/  orchestration/ Docker   Kubernetes
```

### 08.4. Reglas de ubicación

| ID       | Regla                                                                                                                                                                                                                                                |
| :------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **U-01** | La ubicación canónica de manifiestos de infraestructura de **producto/plataforma** es **`infra/`**.                                                                                                                                                  |
| **U-02** | Está **prohibido** alojar esos manifiestos en `connectors/official/docker` o `connectors/official/kubernetes`.                                                                                                                                       |
| **U-03** | El prerrequisito documental del RFC coordinado (**EE-RFC-001**) está **cumplido** (006 v1.4.0 + 001 v2.5.0). La materialización física de `infra/` en el monorepo queda autorizada **solo** vía **EE-IMP-009** tras la **Aprobación** de EE-DOC-009. |
| **U-04** | Subestructura adicional bajo `infra/` sin nuevo directorio de primer nivel es **especialización técnica** (EE-IMP-009 / Type B).                                                                                                                     |
| **U-05** | Las raíces de primer nivel **`docker/`** y **`k8s/`** quedan **rechazadas**.                                                                                                                                                                         |
| **U-06** | EE-DOC-001 v2.5.0 declara el artefacto de EE-DOC-009 como **`infra/`**. Las raíces `docker/` y `k8s/` de primer nivel permanecen **rechazadas**.                                                                                                     |

### 08.5. Cambio gobernado coordinado — estado

| Campo              | Valor                                                                                                   |
| :----------------- | :------------------------------------------------------------------------------------------------------ |
| **RFC**            | **EE-RFC-001** — Incorporation of `infra/` into the Top-Level Repository Tree and Index Synchronization |
| **Estado del RFC** | **Aprobado** e **implementado en documentación** (2026-09-25)                                           |
| **EE-DOC-006**     | **v1.4.0** — `infra/` en §04/§05                                                                        |
| **EE-DOC-001**     | **v2.5.0** — artefacto de 009 = `infra/`                                                                |

| Regla    | Descripción                                                                                          |
| :------- | :--------------------------------------------------------------------------------------------------- |
| **G-01** | Cumplido: 006 y 001 actualizados como **único paquete** bajo EE-RFC-001.                             |
| **G-02** | Cumplido en plano documental. Materialización física → **EE-IMP-009-P01** tras Aprobación de 009.    |
| **G-03** | §08 define dominio y forma; el top-level está **autorizado** por 006 v1.4.0.                         |
| **G-04** | Interpretación respetada: frontera física del dominio delegado, no rediseño de Repository Structure. |

### 08.6. Condición de arranque de EE-IMP-009

| Condición                            | Estado                                                         |
| :----------------------------------- | :------------------------------------------------------------- |
| EE-RFC-001 + 006 v1.4.0 + 001 v2.5.0 | **Cumplido**                                                   |
| EE-DOC-009                           | **Congelado** (v1.1.0)                                         |
| Materialización `infra/`             | **Cumplida** (EE-IMP-009-P01…P05; commits `afccaf3`…`e21ef3b`) |

**Orden post-aprobación (secuencia obligatoria):**

```text
EE-RFC-001 (Aprobado) + EE-DOC-006 v1.4.0 + EE-DOC-001 v2.5.0   ← cumplido
        ↓
EE-DOC-009 (Aprobado v1.0.0)   ← cumplido
        ↓
EE-IMP-009-P01 … P05 (materializar + validar infra/)   ← **cumplido**
        ↓
EE-TEC-004 → Validación Final → Congelación   ← **cumplido**
```

---

## 09. Prohibiciones

1. Usar **Dev Container** (EE-DOC-008) como entorno de **producción**.
2. Versionar **secretos** de infraestructura en el repositorio.
3. Declarar un **único cloud vendor** u orquestador como norma exclusiva del ecosistema (salvo ADR de excepción).
4. Modificar el árbol de **EE-DOC-006** o el artefacto de **EE-DOC-001** de forma silenciosa (fuera de RFC/ADR). Materializar `infra/` **antes** de la Aprobación de EE-DOC-009 e inicio formal de EE-IMP-009.
5. Confundir **conectores** `docker`/`kubernetes` con la definición de la plataforma bajo `infra/`.
6. Redefinir el job CI **Validate** de EE-DOC-007 como pipeline de despliegue sin frontera explícita.
7. Introducir Quality Gates de infra como catálogo cerrado **antes** de EE-DOC-010 (solo principios y puntos de extensión).
8. Crear directorios de primer nivel **`docker/`** o **`k8s/`** (rechazados; usar `infra/`).

---

## 10. Plan de Implementación y Fases (Normativo)

> Obligatoria: documento implementable. Ciclo por unidad según **EE-DOC-005**.

**Prerrequisito documental de materialización física:** **cumplido** (EE-RFC-001 + EE-DOC-006 v1.4.0 + EE-DOC-001). **Implementación EE-IMP-009-P01…P05:** **cumplida**. **Documentación técnica consolidada:** **EE-TEC-004 v1.1.0 Aprobado**. **Validación Final:** **conforme** (2026-09-26).

```mermaid
flowchart LR
    Done["EE-RFC-001 + 006/001"] --> Approb["EE-DOC-009 Aprobado"]
    Approb --> P01["P01 Scaffold infra/"]
    P01 --> P02["P02 containers/"]
    P02 --> P03["P03 orchestration/"]
    P03 --> P04["P04 Secretos + IaC mínimo"]
    P04 --> P05["P05 Validación y cierre"]
```

### 10.1. Catálogo de fases

| Fase    | Identificador                   | Propósito técnico                                                                    | Entregable principal |
| :------ | :------------------------------ | :----------------------------------------------------------------------------------- | :------------------- |
| **P01** | Infra Scaffold                  | Crear `infra/` conforme al RFC coordinado 006+001; README de fronteras; ownership    | EE-IMP-009-P01       |
| **P02** | Product Containers              | Baseline bajo `infra/containers/` (imágenes / stack local de producto según alcance) | EE-IMP-009-P02       |
| **P03** | Orchestration and Environments  | Baseline bajo `infra/orchestration/`; entornos lógicos mínimos                       | EE-IMP-009-P03       |
| **P04** | Runtime Secrets and IaC Minimum | Aplicar S-01…S-03; sin secretos en repo; convenciones IaC mínimas                    | EE-IMP-009-P04       |
| **P05** | Validation and Closure          | Evidencia, consolidación, entrada a Validación Final                                 | EE-IMP-009-P05       |

### 10.2. Especificaciones por unidad

Cada unidad documentará en su EE-IMP-009-PXX: propósito, artefactos físicos, restricciones y evidencia de validación. El detalle de bajo nivel **no** se duplica en este documento normativo.

Al finalizar todas las fases, se consolidará la **Documentación Técnica Consolidada (EE-TEC-004)** conforme a **EE-DOC-005** y **EE-DOC-002 §18.4**.

---

## 11. Evolución

| Cambio                                                                 | Mecanismo                                              |
| :--------------------------------------------------------------------- | :----------------------------------------------------- |
| Incorporar `infra/` al árbol de 006 **y** sincronizar artefacto en 001 | **EE-RFC-001** — **cumplido** (006 v1.4.0, 001 v2.5.0) |
| Subestructura bajo `infra/` sin nuevo top-level                        | Especialización técnica (IMP / Type B)                 |
| Baseline Node de servicios de plataforma                               | EE-ADR-003 / ADR sucesor                               |
| Orquestador o cloud como **único** camino obligatorio                  | ADR de excepción (rompe Vendor Agnostic por defecto)   |
| Quality Gates de infra obligatorios                                    | Coordinar con **EE-DOC-010**                           |

Mecanismo general: EE-DOC-005 (Aclaración, Especialización Técnica, ADR, RFC).

---

## 12. Cumplimiento

| Control            | Criterio                                                                                          |
| :----------------- | :------------------------------------------------------------------------------------------------ |
| Frontera 008 / 009 | Dev Container no usado como producción                                                            |
| Frontera 006 / 001 | `infra/` autorizado por 006 v1.4.0 + 001 v2.5.0; materialización solo vía IMP-009 post-Aprobación |
| Ubicación          | Manifiestos de producto solo bajo `infra/`; no en conectores                                      |
| Secretos           | No hay secretos de runtime en el repo                                                             |
| Vendor Agnostic    | Paths por capacidad; no vendor único impuesto                                                     |
| Trazabilidad       | IMP + TEC al cierre del ciclo de 009                                                              |

---

## 13. Referencias

| Código         | Documento                            | Descripción                                     |
| :------------- | :----------------------------------- | :---------------------------------------------- |
| **EE-DOC-001** | Master Documentation Index           | Roadmap; artefactos de 009 → `infra/` (ola RFC) |
| **EE-DOC-002** | Document Design Template             | Plantilla normativa                             |
| **EE-DOC-003** | Constitution                         | Principios (Vendor Agnostic, Security)          |
| **EE-DOC-004** | Engineering Architecture             | Infrastructure Layer §07.8                      |
| **EE-DOC-005** | Development Workflow                 | Ciclo IMP / VF / Congelación; RFC               |
| **EE-DOC-006** | Repository Structure                 | Árbol; RFC para `infra/`                        |
| **EE-DOC-007** | GitHub Governance                    | CI de plataforma de repo                        |
| **EE-DOC-008** | Development Environment              | Dev Container y entorno local (frontera)        |
| **EE-DOC-010** | Quality Gates                        | (futuro) catálogo de gates                      |
| **EE-ADR-003** | Node.js Baseline 24 LTS              | Runtime Node de servicios aplicables            |
| **EE-RFC-001** | Infra Top-Level Directory            | Incorporación de `infra/`                       |
| **EE-TEC-004** | Consolidated Technical Documentation | As-built P01–P05                                |

---

## 14. Historial de Cambios

| Versión    | Fecha      | Autor                                   | Aprobado por           | Motivo                             | Cambios                                                                          | Estado         |
| :--------- | :--------- | :-------------------------------------- | :--------------------- | :--------------------------------- | :------------------------------------------------------------------------------- | :------------- |
| **v0.1.0** | 2026-09-25 | AI Engineering Assistant                | —                      | Apertura Fase 3                    | Propósito, alcance, fronteras, dominios, plan preliminar, ubicación pendiente    | En Elaboración |
| **v0.2.0** | 2026-09-25 | AI Engineering Assistant                | —                      | Revisión arquitectónica            | Opción B `infra/`; padre 006; §06.2; U-01…U-05; P01 post-RFC                     | En Elaboración |
| **v0.3.0** | 2026-09-25 | AI Engineering Assistant / Arquitectura | —                      | Dictamen de autoridad y SSOT       | §08 RFC coordinado 006+001; G-01…G-04                                            | En Elaboración |
| **v0.4.0** | 2026-09-25 | AI Engineering Assistant / Arquitectura | —                      | Post EE-RFC-001                    | RFC aprobado e implementado en 006 v1.4.0 + 001 v2.5.0; U-03/U-06/G actualizados | En Elaboración |
| **v0.4.1** | 2026-09-25 | AI Engineering Assistant                | —                      | Observaciones menores revisión     | §10.2 enlace EE-TEC-004; §08.6 secuencia post-aprobación                         | En Elaboración |
| **v1.0.0** | 2026-09-25 | Equipo de Arquitectura                  | Equipo de Arquitectura | Revisión arquitectónica — Aprobado | Norma lista para EE-IMP-009; prerrequisitos RFC/006/001 cumplidos                | Aprobado       |
| **v1.1.0** | 2026-09-26 | Equipo de Arquitectura                  | Equipo de Arquitectura | Validación Final y Congelación     | IMP P01–P05; EE-TEC-004; §15 Cierre; corrección EE-TEC-004 (no TEC-009)          | **Congelado**  |

---

## 15. Cierre Documental

> Completado tras Validación Final (ciclo EE-DOC-005).

### 15.1. Validación Final

| Campo                         | Valor                                                                                                                                                                                          |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fecha de validación final** | 2026-09-26                                                                                                                                                                                     |
| **Evidencias utilizadas**     | EE-IMP-009-P01 v1.2.0 … P05 v1.1.0; **EE-TEC-004** v1.1.0; commits `afccaf3`, `f4ad84b`, `26a8464`, `e21ef3b`; `pnpm run validate` PASS; CODEOWNERS `infra/`; escaneo sin secretos en `infra/` |
| **Resultados de controles**   | U-01…U-06, C-01…C-04, O-01…O-03, S-01…S-03, V-01…V-02 **conformes** (EE-TEC-004 §10); quality gate monorepo **PASS**                                                                           |
| **Observaciones**             | W-P05-001 / OBS-001: fase `test` de validate con 0 tareas — no bloqueante                                                                                                                      |
| **Responsable de validación** | Equipo de Arquitectura                                                                                                                                                                         |

### 15.2. Dictamen de Cierre

**CONFORME.**

La implementación de infraestructura de producto bajo `infra/` cumple el alcance de **EE-DOC-009**, la documentación técnica consolidada **EE-TEC-004** y los prerrequisitos **EE-RFC-001** / **EE-DOC-006 v1.4.0**. No existen desviaciones silenciosas. Observación de tests 0/0 registrada y no bloqueante.

Código TEC confirmado en este cierre: **EE-TEC-004**.

### 15.3. Estado Final

| Campo                 | Valor                          |
| :-------------------- | :----------------------------- |
| **Estado documental** | **Congelado**                  |
| **Versión normativa** | v1.1.0                         |
| **Congelación**       | **Sí** — 2026-09-26            |
| **Próximo hito**      | **EE-DOC-010** — Quality Gates |

### 15.4. Condiciones para el Cierre (cumplidas)

1. ✅ Unidades P01–P05 implementadas y validadas (EE-IMP-009).
2. ✅ Documentación técnica consolidada disponible (**EE-TEC-004**).
3. ✅ Validación Final verificó conformidad y ausencia de desviaciones no documentadas.
4. ✅ Equipo de Arquitectura emitió dictamen de cierre.
5. ✅ Estado documental transita a **Congelado** según EE-DOC-005 / EE-DOC-001 R9.

---

## FIN DEL DOCUMENTO
