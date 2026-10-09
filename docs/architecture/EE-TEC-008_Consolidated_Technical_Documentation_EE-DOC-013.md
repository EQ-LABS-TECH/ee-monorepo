# EE-TEC-008 — Consolidated Technical Documentation (EE-DOC-013)

Este documento registra la documentación técnica consolidada (estado **as-built**) correspondiente a la implementación de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.4** y **EE-DOC-005**.

---

## METADATOS

| Campo                 | Valor                                                  |
| :-------------------- | :----------------------------------------------------- |
| **ID**                | EE-TEC-008                                             |
| **Documento**         | Consolidated Technical Documentation — AI Ecosystem    |
| **Código corto**      | EE-TEC-008                                             |
| **Tipo**              | Documento Técnico                                      |
| **Clasificación**     | Implementación                                         |
| **Nivel**             | Técnico                                                |
| **Normativo**         | No                                                     |
| **Versión**           | v1.0.1                                                 |
| **Estado**            | Aprobado                                               |
| **Propietario**       | Equipo de Arquitectura                                 |
| **Documento padre**   | EE-DOC-013 — AI Ecosystem                              |
| **Dependencias**      | EE-DOC-013; EE-IMP-013-P01…P06; EE-ADR-005; EE-DOC-006 |
| **Aprobado por**      | Equipo de Arquitectura                                 |
| **Audiencia**         | Arquitectura, Desarrollo, DevOps, IA                   |
| **Fecha de creación** | 2026-10-05                                             |
| **Última revisión**   | 2026-10-05                                             |
| **Próxima revisión**  | Al abrir nueva IMP de AI Layer                         |

---

## 01. Propósito

Unificar la evidencia as-built de **EE-IMP-013-P01 a P06**: contratos SPI, routing, composition root, observabilidad y cierre, alineados a EE-DOC-013 y EE-ADR-005.

---

## 02. Alcance

### 02.1. Cubierto

- Paquetes `@eq-labs/foundation` (contracts SPI) y `@eq-labs/intelligence` (routing + observability).
- Composition root de evidencia en `apps/cli`.
- Pipeline turbo (`typecheck` → `^build`).
- Decisiones D-01 (WAIVED), D-02 (exports), turbo dependsOn.

### 02.2. No cubierto

- Adapters de vendor ACTIVE (OpenAI, etc.).
- Local Inference Runtime (ubicación → ADR posterior).
- Implementación CatalogPort en Registry.
- Suite Vitest QG-TEST con cobertura de routers (descubrimiento futuro Tipo B).
- Enforcement automático de matriz de imports en `validate`.

---

## 03. Resumen ejecutivo as-built

| Aspecto                                                      | Estado | Evidencia                              |
| :----------------------------------------------------------- | :----- | :------------------------------------- |
| SPI en Foundation                                            | ✅     | `packages/foundation/src/contracts/**` |
| Intelligence routing                                         | ✅     | `src/routing/**`                       |
| Observability §09.3                                          | ✅     | `src/observability/**`                 |
| Composition root                                             | ✅     | `apps/cli/src/composition/**`          |
| Capas 006 (no registry/knowledge/connectors en intelligence) | ✅     | package.json                           |
| CI Validate                                                  | 🟡     | Solo D-01 braces WAIVED                |

---

## 04. Mapa de artefactos

```text
packages/foundation/
  src/contracts/     # AI_SPI_VERSION, Error, Inference, Generation, AIProvider, CatalogPort
  package.json       # exports → dist

packages/intelligence/
  src/routing/       # ProviderRouter, SpecializationRouter, policy
  src/observability/ # policy, correlation, redaction, invocation-log
  package.json       # depends on @eq-labs/foundation only (runtime)

apps/cli/
  src/composition/
    ai-root.ts       # createAiRoot + infer instrumentado
    noop-provider.ts # AIProvider in-process (no vendor)

turbo.json           # typecheck.dependsOn: ["^build"]
```

---

## 05. Decisiones técnicas adoptadas

| Decisión                         | Origen            | Resultado                                |
| :------------------------------- | :---------------- | :--------------------------------------- |
| SPI SSOT en Foundation           | ADR-005 / DOC-013 | `src/contracts`                          |
| Adapters remotos en connectors   | ADR-005           | Boundary; no ACTIVE vendor en este ciclo |
| Composition root = apps/\*       | DOC-006 §13.5     | `apps/cli` evidencia                     |
| Default sin raw logs             | DOC-013 §09.3     | `DEFAULT_OBSERVABILITY_POLICY`           |
| Package exports + declarations   | D-02              | Resolución TS en monorepo                |
| typecheck after dependency build | CI fail P04       | turbo `^build`                           |

---

## 06. RT-07 (precedencia)

Ver **EE-IMP-013-P06 §03**. Resumen:

1. Defaults versionados (código)
2. Config workspace (cuando exista)
3. Env de despliegue (composition root; secrets fuera de repo)
4. Override runtime (`AiRootOptions`)

---

## 07. Seguridad y observabilidad as-built

| Control        | Implementación                                                       |
| :------------- | :------------------------------------------------------------------- |
| SEC-03 / AI-09 | Metadata-only `InvocationLogEvent`                                   |
| Redaction      | `redactSensitive`                                                    |
| Correlation    | `createCorrelationId` en `createAiRoot.infer`                        |
| AI-11          | Sin llamadas a providers reales en intelligence; comentario en index |
| SEC-01         | Sin API keys en packages                                             |

---

## 08. Validación

| Fuente                                    | Resultado                                                                                                                                                |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EE-IMP-013-P01…P06                        | Completados                                                                                                                                              |
| Package gates foundation/intelligence/cli | PASS                                                                                                                                                     |
| QG-SEC-001 high                           | Residual **D-01** (braces vía plop; **≠** brace-expansion overrides). WAIVE formal 010 §04.6.1 **debe** verificarse en el ref; no usar fecha placeholder |

---

## 09. Alineación con EE-DOC-013

| Norma                                   | As-built                  |
| :-------------------------------------- | :------------------------ |
| SPI / tipos Foundation                  | ✅                        |
| Router en Intelligence                  | ✅                        |
| Composition root apps/\*                | ✅                        |
| No import registry/knowledge/connectors | ✅                        |
| §09.3 default no raw                    | ✅                        |
| Local Runtime ubicación                 | Diferido (ADR) — conforme |

---

## 10. Referencias

| Código             | Documento               |
| :----------------- | :---------------------- |
| EE-DOC-013         | Padre normativo         |
| EE-IMP-013-P01…P06 | Fases                   |
| EE-ADR-005         | SPI / connectors / root |
| EE-DOC-006         | Capas / §13.5           |
| EE-TEC-001…007     | Serie TEC previa        |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo                   | Cambios                                                              | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------------------- | :------------------------------------------------------------------- | :----------- |
| **v1.0.0** | 2026-10-05 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre IMP-013           | Consolidado P01–P06 as-built AI Layer                                | **Aprobado** |
| **v1.0.1** | 2026-10-06 | Equipo de Arquitectura | Equipo de Arquitectura | Corrección residual D-01 | Quita fecha placeholder 2026-10-10; aclara braces vs brace-expansion | Aprobado     |

---

## FIN DEL DOCUMENTO
