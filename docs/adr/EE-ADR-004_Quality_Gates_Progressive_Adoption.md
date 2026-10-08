# EE-ADR-004 — Quality Gates Progressive Adoption (Mandatory ≠ Implemented ≠ Enforced)

Este documento registra la decisión arquitectónica correspondiente para el Engineering Ecosystem conforme a los estándares **EE-DOC-002** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                               |
| :------------------------- | :-------------------------------------------------- |
| **ID**                     | EE-ADR-004                                          |
| **Documento**              | Quality Gates Progressive Adoption                  |
| **Código corto**           | ADR-004                                             |
| **Fase**                   | Fase Global del Ecosistema                          |
| **Fase de implementación** | Implementación de EE-DOC-005 / EE-DOC-010           |
| **Tipo**                   | Architectural Decision Record                       |
| **Clasificación**          | Arquitectura / Decisión Arquitectónica              |
| **Nivel**                  | Arquitectónico                                      |
| **Normativo**              | Sí                                                  |
| **Versión**                | v1.1.0                                              |
| **Estado**                 | Aprobado                                            |
| **Propietario**            | Equipo de Arquitectura                              |
| **Documento padre**        | EE-DOC-005 — Development Workflow                   |
| **Dependencias**           | EE-DOC-005; EE-DOC-007; EE-DOC-010; EE-IMP-010      |
| **Decisión relacionada**   | EE-ADR-002 — Engineering Ecosystem Testing Standard |
| **Aprobado por**           | Equipo de Arquitectura                              |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps, QA                |
| **Fecha de creación**      | 2026-09-29                                          |
| **Última revisión**        | 2026-10-02                                          |
| **Próxima revisión**       | Tras cambios mayores en EE-DOC-010                  |
| **Prioridad**              | Alta                                                |

---

## 01. Propósito

Separar de forma explícita los conceptos **Mandatory**, **Implemented** y **Currently enforced** en el régimen de Quality Gates, de modo que la obligación normativa de EE-DOC-005 no se confunda con el estado de materialización de EE-DOC-010 ni con el enforcement de merge de EE-DOC-007 (**No False Pass**).

---

## 02. Contexto

EE-DOC-005 §10 declara un conjunto de **Mandatory Gates** que **bloquean el merge**.

EE-DOC-010 introduce **Availability** (`ACTIVE` | `PENDING_IMPLEMENTATION` | `DEPRECATED`) para no declarar enforcement donde aún no existe materialización verificable (**No False Pass**).

Sin una regla explícita en 005, `PENDING_IMPLEMENTATION` en 010 se interpretaba como “no bloquea merge”, lo que **contradice** el carácter obligatorio de §10.1.

Se estaban mezclando tres conceptos distintos:

```text
Mandatory   ≠   Implemented   ≠   Currently enforced
```

---

## 03. Problema Arquitectónico

1. Un gate **Mandatory** en 005 podía aparecer como `PENDING_IMPLEMENTATION` en 010 sin régimen transitorio, sugiriendo opcionalidad.
2. Declarar `ACTIVE` sin enforcement verificable viola **No False Pass**.
3. Falta de separación de responsabilidades entre 005 (obligación), 010 (severity / result), 007 (enforcement) e IMP-010 (materialización).

---

## 04. Decisión

Se adopta la **Opción B — Adopción progresiva explícita**:

1. El catálogo de **Mandatory Gates** de EE-DOC-005 §10.1 **se mantiene** (Build, Lint, Formatting, Unit & Integration, E2E, Architecture & Structure, Secret Scanning, Documentation Validation).
2. Un Mandatory Gate puede estar **PENDING_IMPLEMENTATION** en EE-DOC-010: la **obligación normativa existe**; la **implementación/enforcement** aún no.
3. `PENDING` **no** significa “opcional” ni “no obligatorio”.
4. `PENDING` **no** puede declararse **PASS**.
5. El **enforcement efectivo** del merge (EE-DOC-007) solo aplica a gates **ACTIVE** (materializados y cableados).
6. Durante la transición, el cumplimiento del workflow queda bajo **régimen transitorio gobernado** (EE-DOC-005 §10.4), no bajo omisión silenciosa.
7. La transición `PENDING → ACTIVE` requiere la cadena definida en EE-DOC-010:

```text
definition → implementation → invocation → result → evidence → CI → enforcement → document update
```

### Separación de responsabilidades

| Concepto           | Documento  | Significado                            |
| :----------------- | :--------- | :------------------------------------- |
| **Mandatory Gate** | EE-DOC-005 | Requisito normativo del workflow       |
| **Severity**       | EE-DOC-010 | Impacto del incumplimiento             |
| **Availability**   | EE-DOC-010 | Estado de implementación del mecanismo |
| **Result**         | EE-DOC-010 | Resultado de una evaluación            |
| **Enforcement**    | EE-DOC-007 | Protección efectiva del merge          |
| **Implementación** | EE-IMP-010 | Materialización y evidencia            |

---

## 05. Alcance

### 05.1. Incluye

- Régimen de adopción progresiva de Mandatory Gates.
- Interpretación normativa de `PENDING_IMPLEMENTATION`.
- Separación Mandatory / Implemented / Enforced.
- Cadena de transición PENDING → ACTIVE.
- Alineación conceptual 005 ↔ 010 ↔ 007 ↔ IMP-010.

### 05.2. No incluye

- Catálogo detallado de gates (SSOT: EE-DOC-010).
- Implementación física de cada gate (EE-IMP-010-PXX).
- Rulesets de GitHub concretos (EE-DOC-007 / IMP-007).
- Thresholds de coverage o política de tests (EE-ADR-002 / EE-DOC-010).

---

## 06. Justificación Arquitectónica

- Preserva **Quality by Default** sin simular cumplimiento.
- Evita contradicción silenciosa entre 005 y 010.
- Permite materialización incremental con evidencia.
- Mantiene **No False Pass** como principio operativo de 010.

---

## 07. Alternativas rechazadas

| Opción                                         | Motivo de rechazo                            |
| :--------------------------------------------- | :------------------------------------------- |
| **A — Declarar ACTIVE en 010 sin enforcement** | Viola **No False Pass**; simula cumplimiento |
| **Quitar obligatoriedad en 005**               | Debilita Quality by Default del workflow     |
| **“PENDING no bloquea” sin régimen**           | Contradicción silenciosa 005 ↔ 010          |

---

## 08. Consecuencias

### 08.1. Positivas

- Vocabulario único Mandatory ≠ Implemented ≠ Enforced.
- EE-DOC-005 documenta régimen transitorio (§10.4) y acota bypass (§10.3).
- EE-DOC-010 alinea Availability sin negar Mandatory.
- EE-IMP-010 materializa transiciones con evidencia.

### 08.2. Negativas / Riesgos

- Periodo en el que gates Mandatory aún no están enforced en merge.
- Requiere disciplina de sincronización documental 005/010/001.
- Riesgo de malinterpretar PENDING como opcional si no se lee este ADR.

---

## 09. Estado de la decisión

**Aprobado** — 2026-09-29 · Equipo de Arquitectura.

(Estado documental unificado a **Aprobado**; equivalía al rótulo previo “Aceptado”.)

---

## 10. Referencias

| Código         | Documento                | Descripción                                |
| :------------- | :----------------------- | :----------------------------------------- |
| **EE-DOC-002** | Document Design Template | Plantilla §18.2 ADR                        |
| **EE-DOC-005** | Development Workflow     | Mandatory Gates; §10.4 régimen transitorio |
| **EE-DOC-007** | GitHub Governance        | Enforcement de merge                       |
| **EE-DOC-010** | Quality Gates            | Availability, Severity, Result             |
| **EE-IMP-010** | Implementación QG        | Transiciones PENDING → ACTIVE              |
| **EE-ADR-002** | Testing Standard         | Suites que alimentan gates de test         |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                | Cambios                                                                                           | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :-------------------- | :------------------------------------------------------------------------------------------------ | :----------- |
| **v1.0.0** | 2026-09-29 | Equipo de Arquitectura | Equipo de Arquitectura | Decisión Opción B     | Adopción progresiva Mandatory ≠ Implemented ≠ Enforced                                            | Aprobado     |
| **v1.1.0** | 2026-10-02 | Equipo de Arquitectura | Equipo de Arquitectura | Higiene DOC-002 §18.2 | Metadatos completos; Propósito/Problema/Alcance/Justificación/Referencias; sin cambio de decisión | **Aprobado** |

---

## FIN DEL DOCUMENTO
