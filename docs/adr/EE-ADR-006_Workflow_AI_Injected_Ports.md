# EE-ADR-006 — Workflow-AI Interaction via Injected Ports

Este documento registra la decisión arquitectónica correspondiente para el Engineering Ecosystem conforme a los estándares **EE-DOC-002** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| **ID**                     | EE-ADR-006                                                                 |
| **Documento**              | Workflow-AI Interaction via Injected Ports                                 |
| **Código corto**           | ADR-006                                                                    |
| **Tipo**                   | Architectural Decision Record                                              |
| **Clasificación**          | Arquitectura / Decisión Arquitectónica                                     |
| **Nivel**                  | Estratégico                                                                |
| **Normativo**              | Sí                                                                         |
| **Versión**                | v1.0.0                                                                     |
| **Estado**                 | Aprobado                                                                   |
| **Propietario**            | Equipo de Arquitectura                                                     |
| **Documento padre**        | EE-DOC-004                                                                 |
| **Dependencias**           | padre=EE-DOC-004; contenido=EE-DOC-004, EE-DOC-006, EE-DOC-013, EE-DOC-014 |
| **Fase**                   | —                                                                          |
| **Fase de implementación** | —                                                                          |
| **Decisión relacionada**   | EE-ADR-005 — AI Provider SPI and Connector Adapters                        |
| **Prioridad**              | Alta                                                                       |
| **Aprobado por**           | Equipo de Arquitectura                                                     |
| **Audiencia**              | Arquitectura, Desarrollo, IA                                               |
| **Fecha de creación**      | 2026-10-18                                                                 |
| **Última revisión**        | 2026-10-18                                                                 |
| **Próxima revisión**       | —                                                                          |

---

## 01. Propósito

Fijar cómo interactúan la capa de inteligencia artificial (`intelligence`, AI Layer, capa 3) y la capa de ejecución de workflows (`execution`, Workflow Layer, capa 2) sin acoplamiento directo entre sus paquetes, resolviendo la contradicción existente entre las matrices de `EE-DOC-004 §11.1` y `EE-DOC-006 §13.2`.

---

## 02. Contexto

### 02.1. Estado de las matrices

| Documento  | Sección | Arista                                                       | Estado                      |
| ---------- | ------- | ------------------------------------------------------------ | --------------------------- |
| EE-DOC-004 | §11.1   | `AI → Workflow`                                              | ❌ prohibido                |
| EE-DOC-004 | §11.1   | `Workflow → AI`                                              | ✅ permitido                |
| EE-DOC-004 | §11.2   | Nota de coexistencia (PN-008)                                | coexisten, sin resolver     |
| EE-DOC-006 | §13.2   | `Intelligence → Execution`                                   | ✅ permitido                |
| EE-DOC-006 | §13.2   | `Knowledge → Intelligence`                                   | ✅ permitido                |
| EE-DOC-013 | §04.2   | `Intelligence` importa `Foundation, Execution, Intelligence` | cita a 006                  |
| EE-DOC-014 | §04.5   | `Knowledge → Intelligence`                                   | ❌ prohibido (política 014) |
| EE-DOC-014 | §04.5   | `Knowledge → Execution`                                      | ❌ prohibido (política 014) |

### 02.2. Causa de la contradicción

`EE-DOC-004 §06.1` establece la equivalencia `Workflow Layer ≈ execution`. Con esa equivalencia:

- **004** ordena `Workflow → AI` (Workflow arriba de AI).
- **006** ordena `Intelligence → Execution` (intelligence arriba de execution).

Son órdenes opuestos. La contradicción no es un error tipográfico; es un conflicto entre dos modelos de capas.

### 02.3. Uso actual en el código

Ningún paquete usa las aristas en conflicto:

- `packages/intelligence/src/**` no importa `@eq-labs/execution`.
- `packages/execution/src/**` no importa `@eq-labs/intelligence`.
- `packages/knowledge/src/**` no importa `@eq-labs/intelligence`.

Verificado 2026-10-18.

---

## 03. Problema Arquitectónico

1. **Ambigüedad operativa.** Un desarrollador o una IA que lea ambas matrices no puede decidir con confianza si `intelligence` puede importar `execution`.
2. **Nota de coexistencia insuficiente.** La nota de PN-008 (`004 §11.2`) dice "prevalecer según la pregunta", pero la pregunta "¿puede `intelligence` importar `execution`?" es simultáneamente lógica y física.
3. **Riesgo de divergencia futura.** Si se permite la arista en 006 y luego se usa, corregirla es caro. Si se elimina y luego se necesita, corregirla con ADR es barato.

---

## 04. Decisión

**Ningún paquete de `packages/intelligence` importa `packages/execution`, ni viceversa.**

Toda interacción entre la AI Layer y la Workflow Layer se realiza por **puertos tipados en `@eq-labs/foundation`**, inyectados desde el **composition root** (`apps/*`, `EE-DOC-006 §13.5`).

Esta decisión se alinea con el patrón ya establecido en `EE-ADR-005` (providers) y `EE-DOC-014 §04.5` (Knowledge).

### 04.1. Cambios concretos

| Documento      | Sección | Cambio                                                                              |
| -------------- | ------- | ----------------------------------------------------------------------------------- |
| **EE-DOC-006** | §13.2   | `Intelligence` → `Foundation, Intelligence`. `Knowledge` → `Foundation, Knowledge`. |
| **EE-DOC-006** | §13.2   | Añadir nota al pie: interacción Workflow↔AI por puertos de Foundation inyectados.  |
| **EE-DOC-013** | §04.2   | Tabla: `Intelligence` solo importa `Foundation, Intelligence`.                      |
| **EE-DOC-004** | §11.2   | Nota PN-008: resolución aplicada. Retirar remisión a RFC-003.                       |
| **EE-DOC-014** | §04.5   | Sin cambios: ya dice lo que debe.                                                   |

---

## 05. Alcance

### 05.1. Incluye

- Alineación de las matrices físicas de 006 con la matriz lógica de 004.
- Alineación de la matriz de 013 con 006 y 004.
- Actualización de la nota de coexistencia en 004.
- Registro de la decisión como ADR Tipo C.

### 05.2. No incluye

- Rediseño de las capas de 004.
- Rediseño de la arquitectura de 013 o 014.
- Modificación de `EE-DOC-014 §04.5` (ya correcto).
- Modificación del código de los paquetes (no hay imports a corregir).
- Introducción del `ExecutionPort` o de cualquier puerto nuevo (eso sería otra decisión).

---

## 06. Justificación Arquitectónica

### 06.1. Reversible en un solo sentido

- **Quitar** una arista no usada cuesta cero.
- **Añadirla** después, con un caso real y un ADR específico, es barato.
- **Quitarla** cuando ya hay código que la usa es caro.

### 06.2. Resuelve las dos direcciones

Con la decisión, ni `Execution → Intelligence` (que 004 permite pero 006 no) ni `Intelligence → Execution` (que 006 permite pero 004 no) existen como imports. La contradicción desaparece.

#### 06.2.1. Arista `Knowledge → Execution`

La eliminación de `Knowledge → Execution` de `006 §13.2` extiende la decisión al grafo completo:

- `Knowledge` no importa `Execution` (ni viceversa).
- `004 §11.1` prohíbe `Knowledge → Workflow`.
- `014 §04.5` ya lo prohibía en su política efectiva.

La contradicción residual queda resuelta.

### 06.3. Coherente con el código

Ningún paquete usa las aristas en conflicto. La decisión no rompe código.

### 06.4. Coherente con 014

`EE-DOC-014 §04.5` ya prohíbe `Knowledge → Execution` y `Knowledge → Intelligence`. 014 queda alineado con 006 y 004 sin cambios.

### 06.5. Coherente con ADR-005

`EE-ADR-005` ya estableció que los providers se inyectan desde el composition root. Este ADR extiende el mismo patrón a la interacción Workflow↔AI.

---

## 07. Mecanismo de interacción

### 07.1. Patrón

```text
Workflow necesita IA
        │
        ▼
[puerto en Foundation] ← inyectado por apps/*
        │
        ▼
intelligence (implementa el puerto)
```

```text
AI necesita lanzar un workflow
        │
        ▼
[puerto en Foundation] ← inyectado por apps/*
        │
        ▼
execution (implementa el puerto)
```

### 07.2. Puertos previstos (a definir en IMP futuro)

- `AIInferencePort` o equivalente: ya cubierto por `AIProvider` de ADR-005.
- `WorkflowTriggerPort` o equivalente: a definir cuando exista un caso de uso real.

No se introduce ningún puerto nuevo en este ADR. El ADR fija la regla de no import directo; los puertos concretos se materializan cuando haya necesidad real.

---

## 08. Alternativas consideradas

| ID  | Alternativa                                                | Dictamen               | Motivo                                                                                                                                         |
| --- | ---------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Permitir AI → Workflow en 004                              | Rechazada              | Relaja una prohibición sin que ningún paquete la necesite. Cascada innecesaria.                                                                |
| B   | Prohibir Intelligence → Execution en 006 y alinear 013/004 | Propuesta seleccionada | Reversible, sin coste, coherente con código y con 014.                                                                                         |
| C   | Dejar la nota de coexistencia como está                    | Rechazada              | No resuelve el caso. Un desarrollador o IA sigue sin poder decidir.                                                                            |
| D   | RFC Tipo D específico                                      | Rechazada              | El cambio es Tipo C (decisión arquitectónica), no Tipo D (transversal documental). RFC-003 no aplica porque es "Documentation Standards Sync". |

---

## 09. Impacto

| Ámbito                | Impacto                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Documentos normativos | 004, 006, 013 (3 documentos)                                                                                   |
| Monorepo físico       | Ninguno (no hay imports a corregir)                                                                            |
| CI / Quality Gates    | Ninguno (no hay gate de capas implementado)                                                                    |
| Código                | Ninguno                                                                                                        |
| Versionado            | 004, 006, 013, 014 están abiertos sin commit: se consolida en sus versiones de trabajo actuales (AR-2026-017). |

---

## 10. Consecuencias

### 10.1. Positivas

- Elimina la ambigüedad entre 004 y 006.
- Alinea 013 con 006 y 004.
- Confirma el patrón de puertos inyectados de ADR-005 y 014.
- Sin coste de código.
- Reversible si en el futuro hay necesidad real.

### 10.2. Negativas / Riesgos

- Si en el futuro un workflow necesita IA o un agente necesita lanzar un workflow, se requiere definir un puerto concreto en Foundation y un ADR específico.
- _Mitigación:_ el coste de añadir el puerto es bajo. La decisión de no tenerlo hoy evita el acoplamiento prematuro.

---

## 11. Referencias

| Código         | Documento                              | Descripción                                  |
| -------------- | -------------------------------------- | -------------------------------------------- |
| **EE-DOC-002** | Document Design Template               | Plantilla ADR (§18.2)                        |
| **EE-DOC-004** | Engineering Architecture               | Matriz lógica §11.1, nota coexistencia §11.2 |
| **EE-DOC-005** | Development Workflow                   | Clasificación Tipo C                         |
| **EE-DOC-006** | Repository Structure                   | Matriz física §13.2, composition root §13.5  |
| **EE-DOC-013** | AI Ecosystem                           | Matriz de imports §04.2                      |
| **EE-DOC-014** | Knowledge Management                   | Política efectiva §04.5                      |
| **EE-ADR-005** | AI Provider SPI and Connector Adapters | Patrón de puertos inyectados                 |

---

## 12. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                    | Cambios                                                                                              | Estado    |
| ---------- | ---------- | ---------------------- | ---------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| **v0.1.0** | 2026-10-18 | Equipo de Arquitectura | —                      | Creación inicial          | Resolución de contradicción 004 ↔ 006 sobre aristas Intelligence-Execution y Knowledge-Intelligence | Propuesto |
| **v1.0.0** | 2026-10-18 | Equipo de Arquitectura | Equipo de Arquitectura | Aprobación arquitectónica | ADR aprobado; habilita implementación de los cambios en 004, 006 y 013                               | Aprobado  |

---

## FIN DEL DOCUMENTO
