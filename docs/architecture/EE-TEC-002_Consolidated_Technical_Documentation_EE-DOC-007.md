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

El siguiente resumen corresponde al cierre original de las unidades P01–P08 y a su Validación Final. Los resultados registrados no constituyen evidencia de validación de la automatización de release incorporada posteriormente.

Las configuraciones remotas aquí documentadas conservan su valor como evidencia del cierre original. Su vigencia requiere verificación operativa independiente. La evolución relacionada con PN-030 y PN-021 se documenta en §06.1.

| Ítem             | Valor                                         |
| :--------------- | :-------------------------------------------- |
| Norma            | EE-DOC-007 — GitHub Governance                |
| Implementación   | P01–P08 **Completados**                       |
| Validación Final | **Conforme**                                  |
| Repo             | `https://github.com/EQ-LABS-TECH/ee-monorepo` |
| Visibility       | Public (temporal)                             |
| Branch model     | Main Only                                     |
| Runtime          | Node.js **24 LTS** (EE-ADR-003)               |
| Required check   | `Validate`                                    |

---

## 03. Mapa de artefactos físicos

### 03.1. Organización

| Recurso    | Configuración                                             |
| :--------- | :-------------------------------------------------------- |
| Org        | `EQ-LABS-TECH`                                            |
| Teams      | architecture, repository-admin, maintainers, contributors |
| Repo roles | Maintain / Admin / Write / Triage según team              |

### 03.2. Repositorio `.github/`

| Path                             | Propósito                                                    |
| :------------------------------- | :----------------------------------------------------------- |
| `.github/CODEOWNERS`             | Ownership por área (teams)                                   |
| `.github/workflows/ci.yml`       | CI plataforma (job Validate)                                 |
| `.github/ISSUE_TEMPLATE/`        | Plantillas (evolución)                                       |
| `.github/PULL_REQUEST_TEMPLATE/` | Plantillas (evolución)                                       |
| `.github/workflows/release.yml`  | Publicación post-merge; evolución asociada a PN-030 y PN-021 |

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

| Frontera                                                                                                                   | Cumplimiento                          |
| :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| EE-DOC-005 no redefinido                                                                                                   | Sí                                    |
| EE-DOC-006 no modificado por 007                                                                                           | Sí                                    |
| EE-DOC-010 no inventado                                                                                                    | Sí (mapeo provisional CI documentado) |
| EE-DOC-011 define la automatización de ingeniería A-REL; EE-DOC-007 gobierna los workflows, permisos y controles de GitHub | Sí — responsabilidades diferenciadas  |

---

## 06. Excepciones y evolución arquitectónica posterior

La siguiente tabla conserva las excepciones identificadas durante el bootstrap. Su inclusión no implica que continúen vigentes. La ausencia del catálogo EE-DOC-010 constituye una observación histórica y no representa el estado actual de ese documento.

| ID        | Descripción                    | Cierre previsto                      |
| :-------- | :----------------------------- | :----------------------------------- |
| W-P03-001 | Bypass ruleset single-operator | 2º maintainer                        |
| D-P03-001 | Repo Public temporal           | Plan GitHub con Private + protection |
| W-P06-002 | Sin catálogo EE-DOC-010        | Publicar EE-DOC-010                  |

### 06.1. Evolución as-built posterior — PN-030: Release Automation

La evolución asociada a **PN-030**, en coordinación con **PN-021**, incorpora un flujo especializado de finalización de releases, separado de la validación ordinaria de Pull Requests. Este flujo consume el contrato de automatización de EE-DOC-011 y aplica controles de plataforma de EE-DOC-007.

**Artefactos físicos inspeccionados:**

| Artefacto                       | Estado as-built                                                                                                  |
| :------------------------------ | :--------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`      | Validación de Pull Requests y push a `main`; `contents: read`; Gitleaks, lint, typecheck, build, test y validate |
| `.github/workflows/release.yml` | Publicación post-merge mediante `push` a `main`, condicionada a una transición de versión raíz                   |
| `.github/CODEOWNERS`            | Ownership de `.github/` asignado a `architecture` y `repository-admin`                                           |

**Permisos y autenticación:**

El workflow `release.yml` declara `contents: write` para el job completo `publish`, no exclusivamente para el paso que sube el tag. La publicación npm utiliza `NODE_AUTH_TOKEN`, suministrado mediante `secrets.NPM_TOKEN`.

El workflow no declara `id-token: write`; por tanto, el estado versionado no acredita una implementación de Trusted Publishing mediante OIDC.

**Secuencia implementada:**

1. Detectar la transición de versión raíz.
2. Verificar el contrato del manifiesto de release.
3. Preparar las dependencias históricas para reconstrucción del plan.
4. Invocar `pnpm run release -- publish`.
5. Subir el tag mediante `git push origin`.
6. Verificar que el tag remoto corresponde al commit esperado.

El workflow aplica control de concurrencia sobre `release-${{ github.ref }}` con `cancel-in-progress: false`.

Estos elementos se encuentran respaldados por la configuración versionada. No acreditan por sí mismos la disponibilidad efectiva de credenciales, las autorizaciones de escritura, la protección remota de tags ni una publicación npm exitosa.

| Superficie                   | Responsabilidad as-built                                                          |
| :--------------------------- | :-------------------------------------------------------------------------------- |
| GitHub Actions de validación | Ejecutar controles aplicables a la integración de cambios                         |
| GitHub Actions de release    | Detectar una transición de versión integrada e iniciar la finalización autorizada |
| Control de concurrencia      | Evitar ejecuciones simultáneas incompatibles sobre el flujo de release            |
| Permisos GitHub              | Restringir las capacidades de escritura a las operaciones autorizadas             |
| Credenciales de publicación  | Suministrar autenticación al registro npm mediante configuración protegida        |
| Trazabilidad de ejecución    | Asociar la automatización con el evento y commit que originaron el release        |

La ejecución `post-merge` utiliza como referencia el estado integrado en la rama principal. Antes de permitir efectos remotos, requiere que se satisfagan las comprobaciones de procedencia y elegibilidad proporcionadas por la automatización de ingeniería.

La arquitectura separa el control de integración de la finalización privilegiada del release, manteniendo las responsabilidades de GitHub Governance diferenciadas del contrato A-REL.

Esta evolución no modifica retrospectivamente el dictamen de la Validación Final original ni constituye evidencia suficiente para cerrar PN-021 o PN-030.

---

## 07. Referencias

| Código                  | Documento                                          |
| :---------------------- | :------------------------------------------------- |
| EE-DOC-001              | Master Documentation Index                         |
| EE-DOC-007              | GitHub Governance                                  |
| EE-DOC-011              | Automation — contrato A-REL                        |
| EE-IMP-007-P01 … P08    | Unidades de implementación GitHub Governance       |
| EE-IMP-011-P04          | Generators and Release                             |
| EE-TEC-006              | Consolidated Technical Documentation of EE-DOC-011 |
| EE-ADR-003              | Node.js Baseline 24 LTS                            |
| EE-AUDIT-Rules_Emerging | Backlog canónico de auditoría — PN-021 y PN-030    |

---

## 08. Historial de Cambios

| Versión    | Fecha      | Autor                                   | Cambio                             | Estado    |
| :--------- | :--------- | :-------------------------------------- | :--------------------------------- | :-------- |
| **v1.0.0** | 2026-09-23 | Arquitectura / AI Engineering Assistant | As-built post Validación Final P08 | Congelado |

---

## FIN DEL DOCUMENTO
