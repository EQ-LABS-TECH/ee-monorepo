# EE-DOC-004 — Engineering Architecture

Este documento sigue el estándar **EE-DOC-002 — Document Design Template**.

---

## METADATOS

| Campo                 | Valor                                                          |
| --------------------- | -------------------------------------------------------------- |
| **ID**                | EE-DOC-004                                                     |
| **Documento**         | Engineering Architecture                                       |
| **Código corto**      | DOC-004                                                        |
| **Tipo**              | Documento Normativo                                            |
| **Clasificación**     | Fundacional                                                    |
| **Nivel**             | Estratégico                                                    |
| **Normativo**         | Sí                                                             |
| **Versión**           | v1.2.0                                                         |
| **Estado**            | Congelado                                                      |
| **Propietario**       | Equipo de Arquitectura                                         |
| **Documento padre**   | EE-DOC-003                                                     |
| **Dependencias**      | padre=EE-DOC-003; contenido=EE-DOC-001, EE-DOC-002, EE-DOC-005 |
| **Aprobado por**      | Equipo de Arquitectura                                         |
| **Audiencia**         | Arquitectura, Desarrollo, IA, Dirección                        |
| **Fecha de creación** | 2026-08-02                                                     |
| **Última revisión**   | 2026-10-18                                                     |
| **Próxima revisión**  | No aplica — Documento Congelado                                |

---

## 01. Propósito

Este documento define la arquitectura de alto nivel del Engineering Ecosystem, sus componentes, relaciones, límites y principios arquitectónicos. Establece la estructura fundamental sobre la que se construyen todos los documentos posteriores de implementación del Engineering Ecosystem (EE-DOC-006 a EE-DOC-015, según EE-DOC-001 §06/§09).

La arquitectura del Engineering Ecosystem es la base sobre la que se organizan las herramientas, procesos y estándares que permiten el desarrollo de software de forma estandarizada, automatizada y gobernada.

---

## 02. Alcance

Este documento cubre:

- Los objetivos arquitectónicos del Engineering Ecosystem.
- Los principios arquitectónicos que guían su diseño.
- La arquitectura general del ecosistema y sus componentes.
- Las capas arquitectónicas y su organización.
- Las relaciones y dependencias entre componentes.
- El flujo arquitectónico desde la solicitud hasta el resultado.
- Los límites arquitectónicos y restricciones.
- Las integraciones externas y sus principios.
- La evolución y cumplimiento arquitectónico.

Este documento **no cubre**:

- Detalles de implementación de herramientas específicas (cubiertos en documentos especializados).
- Procedimientos operativos detallados (cubiertos en documentos específicos).
- Decisiones arquitectónicas de proyectos concretos (cubiertas en sus respectivos ADRs).

---

## 03. Objetivos Arquitectónicos

| #   | Objetivo                 | Descripción                                                                            |
| --- | ------------------------ | -------------------------------------------------------------------------------------- |
| 1   | **Modularidad**          | El ecosistema está compuesto por módulos independientes con responsabilidades claras.  |
| 2   | **Escalabilidad**        | La arquitectura soporta el crecimiento en número de proyectos, equipos y herramientas. |
| 3   | **Bajo Acoplamiento**    | Los componentes se comunican a través de interfaces bien definidas.                    |
| 4   | **Alta Cohesión**        | Cada componente agrupa funcionalidades relacionadas.                                   |
| 5   | **Automatización**       | La automatización está integrada en cada capa de la arquitectura.                      |
| 6   | **Observabilidad**       | Todo el ecosistema es visible, trazable y auditable.                                   |
| 7   | **Extensibilidad**       | La arquitectura permite añadir nuevas herramientas sin modificar el núcleo.            |
| 8   | **Vendor Agnostic**      | El ecosistema no depende de un proveedor específico.                                   |
| 9   | **Seguridad por Diseño** | La seguridad está incorporada en cada capa arquitectónica.                             |
| 10  | **Consistencia**         | Todos los proyectos y equipos operan bajo los mismos estándares.                       |

---

## 04. Principios Arquitectónicos

| #   | Principio                     | Descripción                                                                                                                |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Layered Architecture**      | El ecosistema se organiza en capas con responsabilidades definidas.                                                        |
| 2   | **Modular Architecture**      | Los componentes son módulos independientes con interfaces claras.                                                          |
| 3   | **Separation of Concerns**    | Cada componente tiene una única responsabilidad.                                                                           |
| 4   | **Composition over Coupling** | Se prefiere la composición sobre el acoplamiento directo.                                                                  |
| 5   | **Event Driven**              | Preferir eventos/async cuando no haga falta acoplamiento temporal; §08.1/§09.1 pueden usar API síncrona sin contradicción. |
| 6   | **API First**                 | Las interfaces entre componentes se definen mediante APIs.                                                                 |
| 7   | **Infrastructure as Code**    | La infraestructura se define y gestiona mediante código.                                                                   |
| 8   | **Documentation First**       | La arquitectura se documenta antes de implementarse (canónico EE-DOC-003 §08).                                             |
| 9   | **Configuration over Code**   | La configuración es externa al código.                                                                                     |
| 10  | **Single Source of Truth**    | Cada decisión y configuración tiene un único lugar donde vive.                                                             |
| 11  | **Dependency Inversion**      | Las dependencias se realizan sobre abstracciones.                                                                          |

---

## 05. Arquitectura General del Ecosistema

El Engineering Ecosystem se organiza en torno a un **flujo principal de procesamiento** apoyado por **capas de soporte** que proporcionan gobernanza, conocimiento e infraestructura.

### 05.1. Vista General

La arquitectura definida en EE-DOC-004 se ubica físicamente dentro de la capa **EE-LABS (Engineering Ecosystem Labs)** (Capa 2 del Modelo Conceptual Corporativo).
EE-LABS provee los motores de procesamiento, componentes base, conectores y puertas de calidad sobre los cuales los **Product Ecosystems** (Capa 3) despliegan sus arquitecturas de producto y soportan la ejecución de las **Business Applications** (Capa 4).

El siguiente diagrama representa la arquitectura del ecosistema EE-LABS:

**Diagrama — Vista general de capas.**

```mermaid
flowchart TD
 subgraph Soporte["Capas de Soporte"]
 Governance[Governance Layer]
 Knowledge[Knowledge Layer]
 Infrastructure[Infrastructure Layer]
 end

 subgraph Procesamiento["Flujo Principal de Procesamiento"]
 Workflow[Workflow Layer]
 Context[Context Layer]
 AI[AI Layer]
 Artifact[Artifact Generation Layer]
 Validation[Validation Layer]
 end

 Workflow --> Context
 Context --> AI
 AI --> Artifact
 Artifact --> Validation

 Governance -.-> Workflow
 Governance -.-> Context
 Governance -.-> AI
 Governance -.-> Artifact
 Governance -.-> Validation

 Validation --> Knowledge
 Knowledge --> Infrastructure

 Knowledge -.-> Workflow
 Knowledge -.-> Context
 Knowledge -.-> AI
 Knowledge -.-> Artifact
 Knowledge -.-> Validation
```

### 05.2. Capas de Procesamiento

| Capa                          | Propósito                                                                    |
| :---------------------------- | :--------------------------------------------------------------------------- |
| **Workflow Layer**            | Orquesta el flujo de trabajo desde la solicitud hasta el resultado.          |
| **Context Layer**             | Gestiona el contexto de ejecución y la información del entorno.              |
| **AI Layer**                  | Provee capacidades de inteligencia artificial para asistir en el desarrollo. |
| **Artifact Generation Layer** | Genera documentación, código, diagramas y pruebas.                           |
| **Validation Layer**          | Valida la calidad, seguridad y compatibilidad de los artefactos.             |

### 05.3. Capas de Soporte

| Capa                     | Propósito                                                   | Relación con el Flujo Principal                             |
| :----------------------- | :---------------------------------------------------------- | :---------------------------------------------------------- |
| **Governance Layer**     | Define las reglas, estándares y políticas del ecosistema.   | Gobierna todas las capas de procesamiento.                  |
| **Knowledge Layer**      | Gestiona el conocimiento y la documentación del ecosistema. | Alimenta el flujo principal y es alimentada por Validation. |
| **Infrastructure Layer** | Provee la base técnica para el ecosistema.                  | Soporta todas las capas superiores.                         |

### 05.4. Relación entre Capas

**Diagrama — Relación entre capas.**

```mermaid
flowchart LR
 subgraph Gobierno["Gobierno"]
 G[Governance Layer]
 end

 subgraph Flujo["Flujo Principal"]
 W[Workflow] --> C[Context] --> A[AI] --> AR[Artifact] --> V[Validation]
 end

 subgraph Soporte["Soporte"]
 K[Knowledge Layer]
 I[Infrastructure Layer]
 end

 G -.-> W
 G -.-> C
 G -.-> A
 G -.-> AR
 G -.-> V

 V --> K
 K --> I

 K -.-> W
 K -.-> C
 K -.-> A
```

> **Nota Knowledge Layer e Infrastructure Layer:** estas no forman parte del flujo principal de procesamiento. Actúan como capas de soporte que proporcionan conocimiento e infraestructura al resto del ecosistema.

> **Nota Infrastructure Layer:** proporciona servicios transversales a todas las capas, aunque únicamente se representa la relación lógica principal para mantener la simplicidad del diagrama.

---

## 06. Capas Arquitectónicas

| Capa                          | Propósito                                                                         | Componentes Clave Lógicos                                                            |
| :---------------------------- | :-------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **Governance Layer**          | Define las reglas, estándares y políticas del ecosistema.                         | Constitution, Document Template, Policy Engine, Standards                            |
| **Workflow Layer**            | Orquesta el flujo de trabajo desde la solicitud hasta el resultado.               | User Interfaces (CLI/IDE), Workflow Router, Task Orchestrator                        |
| **Context Layer**             | Gestiona el contexto de ejecución y la información del entorno.                   | Context Engine, Cache Manager, Runtime Context                                       |
| **AI Layer**                  | Proporciona capacidades de inteligencia artificial para asistir en el desarrollo. | AI Router, AI Providers Abstraction, Local Inference Models                          |
| **Artifact Generation Layer** | Genera documentación, código, diagramas y pruebas.                                | Documentation Generator, Code Generator, Diagram Generator, Test Generator           |
| **Validation Layer**          | Valida la calidad, seguridad y compatibilidad de los artefactos.                  | Quality Gate, Security & Static Analysis, Compatibility Check, Automated Test Engine |
| **Knowledge Layer**           | Gestiona el conocimiento y la documentación del ecosistema.                       | Knowledge Base, ADR/RFC Registry, Semantic Search Engine                             |
| **Infrastructure Layer**      | Proporciona la base técnica para el ecosistema.                                   | Source Control, CI/CD, Package & Release Management, Platform Services, Monitoring   |

> **Nota:** La **Artifact Generation Layer** es una capa arquitectónica transversal situada entre la **AI Layer** y la **Validation Layer**. Su responsabilidad es transformar las respuestas del modelo de IA en artefactos concretos (código, documentación, diagramas, pruebas) que luego serán validados por la **Validation Layer** antes de integrarse en el ecosistema.

### 06.1. Mapeo capas lógicas ↔ categorías del monorepo

Vista **lógica** (EE-DOC-004) vs árbol **físico** (**EE-DOC-006**). Este documento **no** es SSOT de paths: ante conflicto de rutas o top-level, **prevalece EE-DOC-006**.

El mapeo usa **categorías** de 006 (no paths literales como contrato). Los ejemplos entre paréntesis son orientativos.

| Capa lógica (004)           | Categoría 006 (orientativa)                                              | Estado de materialización                       | Notas                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Governance Layer            | governance + documentación normativa                                     | Materializada                                   | Políticas, QG, constitución                                                                                              |
| Workflow Layer              | execution / orchestration                                                | Materializada                                   | Flujos, scheduler; puertos A2A                                                                                           |
| Context Layer               | —                                                                        | **Sin materializar** como paquete propio        | Fuera del core Intelligence (EE-DOC-013 §04.4/§04.10); el adaptador de contexto hacia el Router no es “la Context Layer” |
| AI Layer                    | intelligence + límite connectors (providers)                             | Materializada                                   | SPI/providers (EE-ADR-005)                                                                                               |
| Artifact Generation Layer   | sdk / apps (orientativo)                                                 | **Sin materializar** como capa de paquete única | Responsabilidad lógica; artefactos físicos según 006                                                                     |
| Validation Layer            | governance (quality) + scripts de validación                             | Materializada                                   | Gates                                                                                                                    |
| Knowledge Layer             | knowledge                                                                | Materializada                                   | KB; puertos NotebookLM etc.                                                                                              |
| Infrastructure Layer        | foundation + **infra** (EE-DOC-006 / EE-DOC-009 / RFC-001) + CI/platform | Materializada                                   | Foundation = contratos/base; **infra/** es dominio de infraestructura física                                             |
| Integration (categoría 006) | integration                                                              | Materializada                                   | No es capa de flujo 004; capacidad de integración transversal                                                            |
| Registry (categoría 006)    | registry                                                                 | Materializada                                   | No es capa de flujo 004; registro de componentes/especialistas                                                           |
| Límite de integración       | connectors/official (categoría connectors)                               | Materializado                                   | Adaptadores externos (R3); no confundir con Infrastructure Layer                                                         |

**Knowledge → flujo:** acceso en runtime por **puertos inyectados** a Workflow/Context/AI; no implica arista de dependencia estructural de paquete en §11.1.

---

## 07. Componentes arquitectónicos

### 07.1. Governance Layer

- **Responsabilidad:** Define y hace cumplir las reglas, estándares y políticas del Engineering Ecosystem.

- **Componentes clave:**
- **Constitution:** Documento fundamental que establece la misión, visión, valores y principios.
- **Document Template:** Estándar documental que define cómo se redactan todos los documentos.
- **Policy Engine:** Motor de evaluación y cumplimiento de políticas de ingeniería.
- **Standards:** Estándares técnicos y operativos del ecosistema.
- **Interfaces clave:**
- **Expone:** Governance API (políticas, estándares, reglas).
- **Consume:** Documentación de cambios, RFCs, ADRs.

### 07.2. Workflow Layer

- **Responsabilidad:** Orquesta el flujo de trabajo funcional desde la interacción del usuario hasta la entrega del resultado.

- **Componentes clave:**
- **IDE/CLI:** Interfaz de usuario y línea de comandos para interactuar con el ecosistema.
- **Workflow Router:** Enrutador de solicitudes hacia los flujos o pipelines correspondientes.
- **Task Orchestrator:** Orquestador del grafo de tareas y dependencias entre componentes.
- **Interfaces clave:**
- **Expone:** Workflow API.
- **Consume:** Governance Policies.

### 07.3. Context Layer

- **Responsabilidad:** Gestiona el contexto de ejecución y la información del entorno.

- **Componentes clave:**
- **Context Engine:** Consolida y prepara el contexto para la ejecución.
- **Cache:** Almacena información temporal para acelerar la ejecución.
- **Runtime Context:** Gestiona el contexto de ejecución actual (sesión, usuario, tarea).
- **Interfaces clave:**
- **Expone:** Context API.
- **Consume:** Workflow Requests.

### 07.4. AI Layer

- **Responsabilidad:** Proporciona capacidades de inteligencia artificial para asistir en el desarrollo.

- **Componentes clave:**
- **AI Router:** Enruta las solicitudes al modelo de IA adecuado.
- **AI Providers:** Proveedores de IA (múltiples e intercambiables mediante adaptadores).
- **Local Inference Models:** Modelos locales para tareas sencillas, privacidad o baja latencia.
- **Interfaces clave:**
- **Expone:** Inference API, Generation API.
- **Consume:** Contexto enriquecido, tareas del flujo de trabajo.

### 07.5. Artifact Generation Layer

- **Responsabilidad:** Genera artefactos a partir de solicitudes y contexto.

- **Componentes clave:**
- **Documentation Generator:** Genera documentación estructurada y técnica (Markdown, JSDoc, etc.).
- **Code Generator:** Genera código a partir de especificaciones.
- **Diagram Generator:** Genera diagramas y representaciones visuales (Mermaid, PlantUML, etc.).
- **Test Generator:** Genera pruebas unitarias, de integración y end-to-end.
- **Interfaces clave:**
- **Expone:** Artifact Generation API.
- **Consume:** AI Responses.

### 07.6. Validation Layer

- **Responsabilidad:** Valida la calidad, seguridad, tipos y conformidad de los artefactos y del código.

- **Componentes clave:**
- **Quality Gate:** Ejecuta las puertas de calidad automatizadas.
- **Security & Static Analysis:** Validador de seguridad estática, análisis de vulnerabilidades, secretos y tipos.
- **Compatibility Check:** Validador de compatibilidad de contratos e interfaces con el ecosistema.
- **Automated Test Engine:** Motor de ejecución y verificación de suites de pruebas (unitarias, integración, componentes y E2E).
- **Interfaces clave:**
- **Expone:** Validation API.
- **Consume:** Generated Artifacts.

### 07.7. Knowledge Layer

- **Responsabilidad:** Gestiona el conocimiento y la documentación del ecosistema.

- **Componentes clave:**
- **Knowledge Base:** Repositorio central del conocimiento del ecosistema.
- **ADR/RFC Registry:** Almacenamiento de decisiones arquitectónicas y propuestas.
- **Semantic Search Engine:** Búsqueda semántica sobre la base de conocimiento.
- **Interfaces clave:**
- **Expone:** Knowledge API.
- **Consume:** Validated Artifacts.

> **Nota — ADR/RFC Registry:** el registro operativo se materializa como índice sobre `docs/adr/`, `docs/rfc/` y git (**EE-DOC-014** §05.1), no necesariamente como componente runtime separado.

### 07.8. Infrastructure Layer

- **Responsabilidad:** Provee la base técnica, operacional, de almacenamiento, ejecución y observabilidad para el monorepo y el ecosistema.

- **Componentes clave:**
- **Source Control:** Gestión de repositorios, colaboración y control de versiones distribuido.
- **CI/CD:** Integración, pruebas automatizadas y despliegue continuo.
- **Package & Release Management:** Gestión y resolución eficiente de dependencias del monorepo y control de versionado semántico con políticas de publicación.
- **Platform Services:** Servicios base de la plataforma de ejecución y soporte en runtime.
- **Monitoring:** Monitoreo, telemetría, métricas y observabilidad del ecosistema.
- **Interfaces clave:**
- **Expone:** Infrastructure Services.
- **Consume:** servicios de plataforma/CI según despliegue (sin dependencia estructural obligatoria hacia Knowledge). **Expone:** Infrastructure Services a todas las capas. Arista Knowledge→Infrastructure permitida (§08.1 / §11.1).

---

## 08. Relaciones entre Componentes

> **Nota sobre mecanismos de interacción:** Todas las dependencias entre componentes deben materializarse mediante **APIs bien definidas**, **eventos asíncronos** o **contratos documentados**. Las dependencias directas a través de archivos o bases de datos compartidas están prohibidas.

### 08.1. Dependencias Permitidas

| Origen                  | Destino              | Tipo       | Mecanismo de Interacción      |
| ----------------------- | -------------------- | ---------- | ----------------------------- |
| **Workflow Layer**      | Context Layer        | Uso        | API síncrona                  |
| **Workflow Layer**      | AI Layer             | Uso        | API asíncrona (eventos)       |
| **Context Layer**       | AI Layer             | Uso        | API síncrona                  |
| **AI Layer**            | Artifact Generation  | Uso        | API síncrona                  |
| **Artifact Generation** | Validation Layer     | Uso        | API síncrona                  |
| **Validation Layer**    | Knowledge Layer      | Uso        | API síncrona + eventos        |
| **Knowledge Layer**     | Infrastructure Layer | Uso        | API asíncrona                 |
| **Governance Layer**    | Todas las capas      | Gobernanza | API de gobernanza + políticas |

### 08.2. Dependencias Prohibidas

| Origen                   | Destino             | Motivo                                                 |
| :----------------------- | :------------------ | :----------------------------------------------------- |
| **Infrastructure Layer** | Governance Layer    | La infraestructura no define la gobernanza.            |
| **Artifact Generation**  | AI Layer            | La generación de artefactos no debe depender de la IA. |
| **Validation Layer**     | Artifact Generation | La validación no debe depender de lo que valida.       |
| **Knowledge Layer**      | Validation Layer    | El conocimiento no debe depender de la validación.     |

### 08.3. Relaciones de Gobernanza

**Diagrama — Relaciones de gobernanza.**

```mermaid
flowchart TD
 Governance[Governance Layer] -.-> Workflow[Workflow Layer]
 Governance -.-> Context[Context Layer]
 Governance -.-> AI[AI Layer]
 Governance -.-> Artifact[Artifact Generation]
 Governance -.-> Validation[Validation Layer]
 Governance -.-> Knowledge[Knowledge Layer]
 Governance -.-> Infrastructure[Infrastructure Layer]
```

---

## 09. Flujo Arquitectónico

### 09.1. Flujo de una Solicitud

**Diagrama — Flujo de una solicitud.**

```mermaid
sequenceDiagram
 participant U as Usuario
 participant I as IDE/CLI
 participant W as Workflow Router
 participant O as Orchestrator
 participant C as Context Engine
 participant A as AI Router
 participant M as Modelo IA
 participant G as Artifact Generator
 participant V as Validation Layer
 participant K as Knowledge Layer

 U->>I: Solicitud
 I->>W: Enviar solicitud
 W->>O: Enrutar al flujo adecuado
 O->>C: Solicitar contexto
 C-->>O: Contexto enriquecido
 O->>A: Enviar tarea con contexto
 A->>M: Enrutar al modelo adecuado
 M-->>A: Respuesta generada
 A->>G: Generar artefactos
 G->>V: Validar artefactos
 V-->>G: Validación completada
 G->>I: Resultado
 I-->>U: Respuesta

 Note over G,K: Sincronización asíncrona con Knowledge
 V->>K: Sincronizar artefactos validados
```

### 09.2. Flujo de Adquisición de Conocimiento

**Diagrama — Flujo de adquisición de conocimiento.**

```mermaid
flowchart TD
 A[Código / ADR / RFC] --> B[Análisis]
 B --> C[Generación de Documentación]
 C --> D[Extracción Semántica]
 D --> E[Clasificación en Ontología]
 E --> F[Actualización del Knowledge Graph]
 F --> G[Indexación Vectorial]
 G --> H[Sincronización a Second Brain]
 H --> I[Reconstrucción de Cache]
 I --> J[Conocimiento disponible]
```

---

## 10. Límites Arquitectónicos

| Regla  | Descripción                                                                                                                                                                                                                                                                                                               |
| :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1** | La IA nunca escribe directamente al repositorio. Toda modificación pasa por Validation.                                                                                                                                                                                                                                   |
| **R2** | Ningún componente accede directamente al Knowledge Base sin pasar por la Knowledge Layer.                                                                                                                                                                                                                                 |
| **R3** | Las integraciones externas se canalizan **solo mediante adaptadores** en el **límite de integración** (`connectors/official/*` y equivalentes). La capa de dominio (Knowledge, Workflow, Infrastructure, …) **posee el puerto**; el adaptador no está restringido a Infrastructure Layer (alineado a EE-ADR-005 y §12.2). |
| **R4** | Los cambios arquitectónicos requieren aprobación del Equipo de Arquitectura.                                                                                                                                                                                                                                              |
| **R5** | Ningún componente puede depender de otro de una **capa superior**. Orden de capas (superior → inferior): **Governance** > **Workflow** > **Context** > **AI** > **Artifact Generation** > **Validation** > **Knowledge** / **Infrastructure** (soporte; no “por encima” del flujo).                                       |
| **R6** | La Governance Layer es la única que puede imponer reglas a las demás capas.                                                                                                                                                                                                                                               |
| **R7** | Los artefactos generados deben pasar por Validation antes de ser almacenados.                                                                                                                                                                                                                                             |
| **R8** | Las decisiones arquitectónicas deben registrarse como ADRs.                                                                                                                                                                                                                                                               |

---

## 11. Dependencias Arquitectónicas

### 11.1. Matriz de Dependencias

| Capa               | Governance | Workflow | Context | AI  | Artifact | Validation | Knowledge | Infrastructure |
| ------------------ | :--------: | :------: | :-----: | --- | :------: | :--------: | :-------: | :------------: |
| **Governance**     |     —      |    🔵    |   🔵    | 🔵  |    🔵    |     🔵     |    🔵     |       🔵       |
| **Workflow**       |     ❌     |    —     |   ✅    | ✅  |    ❌    |     ❌     |    ❌     |       ❌       |
| **Context**        |     ❌     |    ❌    |    —    | ✅  |    ❌    |     ❌     |    ❌     |       ❌       |
| **AI**             |     ❌     |    ❌    |   ❌    | —   |    ✅    |     ❌     |    ❌     |       ❌       |
| **Artifact**       |     ❌     |    ❌    |   ❌    | ❌  |    —     |     ✅     |    ❌     |       ❌       |
| **Validation**     |     ❌     |    ❌    |   ❌    | ❌  |    ❌    |     —      |    ✅     |       ❌       |
| **Knowledge**      |     ❌     |    ❌    |   ❌    | ❌  |    ❌    |     ❌     |     —     |       ✅       |
| **Infrastructure** |     ❌     |    ❌    |   ❌    | ❌  |    ❌    |     ❌     |    ❌     |       —        |

**Leyenda:**

- ✅ Dependencia directa permitida
- 🔵 Dependencia por gobernanza (la capa superior impone reglas)
- ❌ Dependencia prohibida

### 11.2. Interpretación de la matriz

| Regla                                                                                                  | Definición                                                                                                                                                                                                                                                                                                      |
| :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alcance de §11.1**                                                                                   | Dependencias **lógicas / arquitectónicas** entre capas de este documento. **No** es la lista de imports permitidos entre workspaces npm.                                                                                                                                                                        |
| **Matriz física**                                                                                      | Los imports entre paquetes del monorepo (`@eq-labs/…`, `apps/*`, connectors) se rigen por **EE-DOC-006 §13.2** (incl. filas **Shared** y **Apps**).                                                                                                                                                             |
| **Precedencia operativa (paths / package.json)**                                                       | Ante duda _«¿este paquete puede depender de este otro en el repo?»_ prevalece **EE-DOC-006 §13**.                                                                                                                                                                                                               |
| **Precedencia de diseño de capas**                                                                     | Ante duda _«¿cómo se relacionan las capas del sistema?»_ prevalece **EE-DOC-004 §11**.                                                                                                                                                                                                                          |
| **Conflicto real** (misma relación permitida en uno y prohibida en el otro, sin mediación por puertos) | **No** se resuelve en silencio. Cambio gobernado: **EE-RFC-003** u otro RFC/ADR Tipo D. **Resuelto (EE-ADR-006):** las aristas `Intelligence → Execution` y `Knowledge → Intelligence` fueron eliminadas de `EE-DOC-006 §13.2` para alineación con esta matriz. Ambas se materializan por **puerto inyectado**. |
| **Knowledge → Workflow/Context/AI**                                                                    | ❌ en §11.1 como dependencia estructural; uso en runtime por **puertos inyectados** (§06.1), no por dependencia de paquete de capa superior.                                                                                                                                                                    |
| **Context → AI**                                                                                       | ✅ en §11.1 y listada en §08.1.                                                                                                                                                                                                                                                                                 |
| **Artifact → Knowledge**                                                                               | ❌; la sincronización post-validación la emite **Validation → Knowledge** (✅).                                                                                                                                                                                                                                 |
| **Validation → Knowledge**                                                                             | ✅                                                                                                                                                                                                                                                                                                              |
| **Mapeo orientativo lógico → físico**                                                                  | Governance≈governance; capas de ejecución/IA/conocimiento≈execution/intelligence/knowledge; Infrastructure≈infra + connectors (límite externo en 006); apps = composition root (006 **Apps**), no una fila de §11.1. El mapeo es **orientativo**: no implica igualdad de aristas fila a fila.                   |

> **PN-008 (resuelto — EE-ADR-006):** 004 §11 y 006 §13 quedan alineados. Las aristas `Intelligence → Execution`, `Knowledge → Intelligence` y `Knowledge → Execution` fueron eliminadas de `EE-DOC-006 §13.2` para consistencia con esta matriz lógica y con la política efectiva de `EE-DOC-014 §04.5`. El código no las usaba. Si en el futuro se necesita esa relación, se hace por **puerto inyectado desde el composition root** (`apps/*`), nunca por import directo entre paquetes.

---

## 12. Integraciones

### 12.1. Principios de Integración

| Principio                                                            | Descripción                                                                                                                                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API First**                                                        | Todas las integraciones se realizan a través de APIs bien definidas.                                                                                                               |
| **Vendor Agnostic**                                                  | Las integraciones no dependen de un proveedor específico.                                                                                                                          |
| **Documentation First**                                              | Cada integración debe estar documentada antes de implementarse.                                                                                                                    |
| **Security by Design**                                               | Las integraciones incorporan seguridad desde el diseño.                                                                                                                            |
| **Observability**                                                    | Todas las integraciones son observables y trazables.                                                                                                                               |
| **Adapter Pattern**                                                  | Toda integración externa debe implementarse mediante **adaptadores** que aíslen la lógica del proveedor específico, permitiendo su reemplazo sin afectar al núcleo del ecosistema. |
| **Public Interfaces Open Licensing (política canónica: EE-DOC-003)** | Todas las abstracciones de integración externas (SDKs, OpenAPI, AsyncAPI y JSON Schemas) se publican bajo Apache-2.0 para permitir integraciones de terceros.                      |

> **Nota:** El uso de adaptadores es obligatorio para preservar el principio **Vendor Agnostic**. Esto se aplica a todas las integraciones externas (proveedores de IA, repositorios, plataformas de infraestructura, etc.).

### 12.2. Integraciones Externas

| Conector Lógico                              | Propósito Funcional                                                                           | Capa Arquitectónica Asociada     |
| :------------------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------- |
| **Source Control Service (GitHub)**          | Gestión de repositorios, colaboración, rastreo de cambios y flujos de revisión.               | Infrastructure Layer             |
| **Container Runtime Service (Docker)**       | Contenerización y aislamiento de entornos de ejecución.                                       | Infrastructure Layer             |
| **Orchestration Service (Kubernetes)**       | Despliegue y orquestación de cargas de trabajo escalables.                                    | Infrastructure Layer             |
| **Knowledge Vault (Obsidian)**               | Almacenamiento local y sincronización de notas de conocimiento.                               | Knowledge Layer                  |
| **Knowledge Synthesis Service (NotebookLM)** | Análisis y síntesis asistida de fuentes de documentación.                                     | Knowledge Layer                  |
| **Model Context Protocol (MCP)**             | Límite de integración oficial para servidores de contexto enriquecido.                        | Knowledge Layer / Infrastructure |
| **Agent2Agent Protocol (A2A)**               | Límite de integración oficial para la mensajería e interoperabilidad entre agentes autónomos. | Workflow Layer / Infrastructure  |

> **Nota — Vendor Agnostic:** los servicios listados en §12.2 (GitHub, Docker, Kubernetes, Obsidian, NotebookLM, MCP, A2A, etc.) son **implementaciones de referencia**; el contrato se define por **adaptador**. Obsidian puede no tener conector dedicado en `connectors/official/` (vía MCP u otro adaptador según implementación). La política de interfaces abiertas remite a **EE-DOC-003** (licenciamiento / IP).

---

## 13. Evolución Arquitectónica

### 13.1. Principios de Evolución

| Principio          | Descripción                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| **Compatibilidad** | Los cambios no rompen la compatibilidad con el ecosistema existente.         |
| **Modularidad**    | Los cambios se realizan en módulos específicos sin afectar al resto.         |
| **Gobernanza**     | Todo cambio arquitectónico debe ser aprobado por el Equipo de Arquitectura.  |
| **Documentación**  | Todo cambio debe estar documentado antes de implementarse.                   |
| **Validación**     | Todo cambio debe ser validado antes de ser incorporado.                      |
| **Deprecación**    | Las funcionalidades obsoletas se deprecan con aviso antes de ser eliminadas. |

### 13.2. Mecanismos de Evolución

| Mecanismo                               | Descripción                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| **Incorporación de Nuevas Capas**       | Nuevas capas pueden añadirse si no rompen la arquitectura existente.                   |
| **Incorporación de Nuevos Componentes** | Nuevos componentes pueden añadirse dentro de capas existentes.                         |
| **Reemplazo de Integraciones**          | Las integraciones externas pueden reemplazarse mediante adaptadores.                   |
| **Deprecación de Componentes**          | Los componentes obsoletos se deprecan con un aviso de 6 meses antes de su eliminación. |

### 13.3. Proceso de Deprecación

1. **Anuncio de deprecación:** Publicación de RFC indicando la fecha de fin de soporte.
2. **Período de transición:** 6 meses para migrar a la alternativa.
3. **Fin de soporte:** El componente deja de ser compatible con el ecosistema.
4. **Eliminación:** El componente se retira del ecosistema.

---

## 14. Cumplimiento Arquitectónico

### 14.1. Mecanismos de Verificación

| Mecanismo                          | Descripción                                                                                                                              | Frecuencia                | Responsable             |
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------ | :---------------------- |
| **Revisiones Arquitectónicas**     | Verificación de alineación con la arquitectura.                                                                                          | Por cambio significativo. | Equipo de Arquitectura  |
| **Auditorías**                     | Revisión periódica del cumplimiento arquitectónico.                                                                                      | Trimestral.               | Equipo de Arquitectura  |
| **Validación Automática**          | **PENDING** (EE-DOC-005 §10.4 / EE-DOC-010 §05.8): QG-ARCH actual no valida capas/ciclos completos. No declarar enforcement inexistente. | Continua (cuando exista)  | Automatización / DevOps |
| **Architecture Compliance Checks** | Análisis de top-level (QG-ARCH-001). Capas/ciclos: **PENDING** (V-ARCH-LAYERS / 015 §05.2; 010 §05.8).                                   | Por cambio (parcial hoy)  | Automatización / DevOps |

### 14.2. Consecuencias del Incumplimiento

| Nivel        | Consecuencia                                 |
| :----------- | :------------------------------------------- |
| **Leve**     | Notificación y solicitud de corrección.      |
| **Moderado** | Bloqueo de cambios hasta la corrección.      |
| **Grave**    | Rechazo del cambio o componente.             |
| **Crítico**  | Revisión del componente o proyecto completo. |

---

## 15. Referencias

| Código         | Documento                              | Descripción                                                            |
| -------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| **EE-DOC-001** | Master Documentation Index             | Índice, estados §08, matriz §09; padre estructural de 004 = 003 en §06 |
| **EE-DOC-002** | Document Design Template               | Plantilla; catálogo §05.1; código corto §16                            |
| **EE-DOC-003** | Engineering Ecosystem Constitution     | Constitución; Documentation First §08; licenciamiento                  |
| **EE-DOC-005** | Development Workflow                   | Cambio gobernado; PENDING §10.4                                        |
| **EE-DOC-006** | Repository Structure                   | Árbol físico; packages/; connectors/                                   |
| **EE-DOC-010** | Quality Gates                          | QG-ARCH; PENDING capas §05.8                                           |
| **EE-DOC-013** | AI Ecosystem                           | Mapeo intelligence / providers                                         |
| **EE-DOC-014** | Knowledge Management                   | Registry ADR/RFC vía docs+git                                          |
| **EE-DOC-015** | Engineering Ecosystem Validation       | V-ARCH-LAYERS PENDING                                                  |
| **EE-ADR-001** | Workspace Task Orchestration Strategy  | Orquestación / Turborepo                                               |
| **EE-ADR-002** | Engineering Ecosystem Testing Standard | Vitest/Playwright (padre 004)                                          |
| **EE-ADR-003** | Node.js Baseline Upgrade to 24 LTS     | Runtime (padre 004/006)                                                |
| **EE-ADR-005** | AI Provider SPI and Connector Adapters | Adaptadores en connectors/ (R3)                                        |

---

## 16. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                                          | Cambios                                                                                                                                                                    | Estado        |
| :--------- | :--------- | :--------------------- | :--------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| **v1.0.0** | 2026-08-02 | Equipo de Arquitectura | Equipo de Arquitectura | Creación inicial                                | Versión inicial de la arquitectura del Engineering Ecosystem                                                                                                               | **Congelado** |
| **v1.1.0** | 2026-09-16 | Equipo de Arquitectura | Equipo de Arquitectura | Sync lógica (regularizar: Tipo B + ADR-001/002) | Alineación con EE-ADR-001/002 e inclusión de subcomponentes lógicos (MCP, A2A, Task Orchestrator, Test Engine), depuración de acoplamiento físico y adición de EE-DOC-005. | **Congelado** |
| **v1.2.0** | 2026-10-12 | Equipo de Arquitectura | Equipo de Arquitectura | Tipo B/C (ADR-005) + regularización v1.1.0      | Auditoría: metadatos, R3 connectors, §06.1 categorías 006, matriz §11.2, PENDING QG, First, títulos Mermaid                                                                | **Congelado** |

---

## FIN DEL DOCUMENTO
