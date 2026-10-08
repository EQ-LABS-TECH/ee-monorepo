# EE-TEC-002 — Consolidated Technical Documentation of EE-DOC-007 (GitHub Governance)

Este documento sigue el estándar **EE-DOC-002 — Document Design Template** y registra el estado **as-built** de la implementación de **EE-DOC-007 — GitHub Governance**.

---

## METADATOS

| Campo                 | Valor                                              |
| :-------------------- | :------------------------------------------------- |
| **ID**                | EE-TEC-002                                         |
| **Documento**         | Consolidated Technical Documentation of EE-DOC-007 |
| **Código corto**      | EE-TEC-002                                         |
| **Tipo**              | Documento Técnico                                  |
| **Clasificación**     | Implementación                                     |
| **Nivel**             | Técnico                                            |
| **Normativo**         | No                                                 |
| **Versión**           | v1.0.0                                             |
| **Estado**            | Congelado (as-built post Validación Final)         |
| **Propietario**       | Equipo de Arquitectura                             |
| **Documento padre**   | EE-DOC-007 — GitHub Governance                     |
| **Dependencias**      | EE-DOC-007, EE-IMP-007-P01 … P08, EE-ADR-003       |
| **Aprobado por**      | Equipo de Arquitectura                             |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, IA               |
| **Fecha de creación** | 2026-09-23                                         |
| **Última revisión**   | 2026-09-23                                         |
| **Próxima revisión**  | 2026-12-23                                         |

---

## 01. Propósito

Proporcionar una visión unificada, trazable y verificable de:

- la gobernanza GitHub implementada para `EQ-LABS-TECH/ee-monorepo`;
- la correspondencia entre EE-DOC-007, unidades IMP y configuración física;
- el resultado de la **Validación Final** (EE-IMP-007-P08).

---

## 02. Resumen ejecutivo

| Ítem             | Valor                                               |
| :--------------- | :-------------------------------------------------- |
| Norma            | EE-DOC-007 v1.0.0 (Aprobado → listo para Congelado) |
| Implementación   | P01–P08 **Completados**                             |
| Validación Final | **Conforme** (2026-09-23)                           |
| Repo             | `https://github.com/EQ-LABS-TECH/ee-monorepo`       |
| Visibility       | Public (temporal)                                   |
| Branch model     | Main Only                                           |
| Runtime          | Node.js **24 LTS** (EE-ADR-003)                     |
| Required check   | `Validate`                                          |

---

## 03. Mapa de artefactos físicos

### 03.1. Organización

| Recurso    | Configuración                                             |
| :--------- | :-------------------------------------------------------- |
| Org        | `EQ-LABS-TECH`                                            |
| Teams      | architecture, repository-admin, maintainers, contributors |
| Repo roles | Maintain / Admin / Write / Triage según team              |

### 03.2. Repositorio `.github/`

| Path                             | Propósito                    |
| :------------------------------- | :--------------------------- |
| `.github/CODEOWNERS`             | Ownership por área (teams)   |
| `.github/workflows/ci.yml`       | CI plataforma (job Validate) |
| `.github/ISSUE_TEMPLATE/`        | Plantillas (evolución)       |
| `.github/PULL_REQUEST_TEMPLATE/` | Plantillas (evolución)       |

### 03.3. Ruleset

| Campo              | Valor                       |
| :----------------- | :-------------------------- |
| Name / id          | `Protect main` / `23861402` |
| Required check     | `Validate`                  |
| PR + 1 approval    | Sí                          |
| Squash/rebase only | Sí                          |

### 03.4. Security

| Feature                              | ON   |
| :----------------------------------- | :--- |
| Secret Protection + Push protection  | Sí   |
| Dependabot alerts + security updates | Sí   |
| Dependency graph                     | Sí   |
| Actions default permissions          | Read |

---

## 04. Cadena de trazabilidad

```text
EE-DOC-007 (norma)
    → EE-IMP-007-P01 … P08 (evidencia por unidad)
    → Estado físico GitHub
    → EE-TEC-002 (este documento)
    → Validación Final CONFORME
    → Cierre Documental EE-DOC-007
```

Detalle por unidad: **EE-IMP-007-P08 §02–§04**.

---

## 05. Fronteras respetadas

| Frontera                                                     | Cumplimiento                          |
| :----------------------------------------------------------- | :------------------------------------ |
| EE-DOC-005 no redefinido                                     | Sí                                    |
| EE-DOC-006 no modificado por 007                             | Sí                                    |
| EE-DOC-010 no inventado                                      | Sí (mapeo provisional CI documentado) |
| EE-DOC-011 (automation producto) fuera de Actions plataforma | Sí                                    |

---

## 06. Excepciones de bootstrap vigentes

| ID        | Descripción                    | Cierre previsto                      |
| :-------- | :----------------------------- | :----------------------------------- |
| W-P03-001 | Bypass ruleset single-operator | 2º maintainer                        |
| D-P03-001 | Repo Public temporal           | Plan GitHub con Private + protection |
| W-P06-002 | Sin catálogo EE-DOC-010        | Publicar EE-DOC-010                  |

---

## 07. Referencias

| Código               | Documento                  |
| :------------------- | :------------------------- |
| EE-DOC-007           | GitHub Governance          |
| EE-IMP-007-P01 … P08 | Unidades de implementación |
| EE-ADR-003           | Node.js Baseline 24 LTS    |
| EE-DOC-001           | Master Documentation Index |

---

## 08. Historial de Cambios

| Versión    | Fecha      | Autor                                   | Cambio                             | Estado    |
| :--------- | :--------- | :-------------------------------------- | :--------------------------------- | :-------- |
| **v1.0.0** | 2026-09-23 | Arquitectura / AI Engineering Assistant | As-built post Validación Final P08 | Congelado |

---

## FIN DEL DOCUMENTO
