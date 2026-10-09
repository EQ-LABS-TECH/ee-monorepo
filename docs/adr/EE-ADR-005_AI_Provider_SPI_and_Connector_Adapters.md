# EE-ADR-005 — AI Provider SPI and Connector Adapters

Este documento registra la decisión arquitectónica correspondiente para el Engineering Ecosystem conforme a los estándares **EE-DOC-002** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                                              |
| :------------------------- | :--------------------------------------------------------------------------------- |
| **ID**                     | EE-ADR-005                                                                         |
| **Documento**              | AI Provider SPI and Connector Adapters                                             |
| **Código corto**           | ADR-005                                                                            |
| **Fase**                   | Fase Global del Ecosistema                                                         |
| **Fase de implementación** | Fase 3 — Implementación de EE-DOC-013 (AI Ecosystem)                               |
| **Tipo**                   | Architectural Decision Record                                                      |
| **Clasificación**          | Arquitectura / Decisión Arquitectónica                                             |
| **Nivel**                  | Arquitectónico                                                                     |
| **Normativo**              | Sí                                                                                 |
| **Versión**                | v1.3.1                                                                             |
| **Estado**                 | **Aprobado**                                                                       |
| **Propietario**            | Equipo de Arquitectura                                                             |
| **Documento padre**        | EE-DOC-004 — Engineering Architecture                                              |
| **Dependencias**           | EE-DOC-003; EE-DOC-004; EE-DOC-006; EE-DOC-009; EE-DOC-010; EE-DOC-012; EE-DOC-013 |
| **Decisión relacionada**   | EE-ADR-001 — Workspace Task Orchestration Strategy; EE-ADR-003 — Node.js Baseline  |
| **Aprobado por**           | Equipo de Arquitectura                                                             |
| **Audiencia**              | Arquitectura, Desarrollo, DevOps                                                   |
| **Fecha de creación**      | 2026-10-02                                                                         |
| **Última revisión**        | 2026-10-03                                                                         |
| **Próxima revisión**       | 2026-10-17                                                                         |
| **Prioridad**              | Alta                                                                               |

---

## 01. Propósito

Fijar de forma **única e ineludible** la ubicación del **Provider SPI**, de los **adapters de vendor remoto**, del **composition root** y de la relación del **Local Inference Runtime** con el SPI; eliminar la ambigüedad entre `packages/intelligence` y `connectors/official/*`; y **extender de forma gobernada** la matriz de imports de **EE-DOC-006 §13.2** para Connectors y composition root.

---

## 02. Contexto

EE-DOC-004 ubica **AI Providers** en la AI Layer y exige **Adapter Pattern** / integraciones externas vía adaptadores.

EE-DOC-013 elimina la ambigüedad entre adapters en Intelligence y en `connectors/official/*`.

EE-DOC-006 limita los imports de Intelligence a Foundation, Execution e Intelligence (§13.2). Si el SPI vive solo en Intelligence, un connector implicaría `connectors → intelligence` y el composition root quedaría indefinido.

La matriz histórica de §13.2 solo cubría categorías `packages/*` y no regulaba connectors ni el rol de composition root.

---

## 03. Problema Arquitectónico

1. Doble ubicación de provider adapter sin regla de dependencia.
2. Grafo de imports indefinido si el SPI está solo en Intelligence.
3. Composition root no nombrado ni unicidad por runtime.
4. Local Inference Runtime confudible con un vendor SaaS.
5. Formulaciones con "o" (SPI en Intelligence o Foundation).
6. Frase ambigua del tipo "Import de un connector | Solo Foundation".
7. Matriz EE-DOC-006 §13.2 sin fila Connectors ni permiso de wiring.
8. Conflicto entre "SDK liviano / public" y cableado de connectors `private`.

---

## 04. Decisión

| Pieza                                                   | Ubicación canónica                                                                                                                                                                 |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider SPI + tipos Inference / Generation / Error** | **`packages/foundation` (`contracts`)** — **sin alternativa**. Subdominio lógico `contracts` hasta anidado físico en 006                                                           |
| **Uso del SPI (Router, orquestación)**                  | `packages/intelligence`                                                                                                                                                            |
| **Vendor / protocol adapter**                           | **`connectors/official/<name>`**                                                                                                                                                   |
| **Local Inference Runtime**                             | Implementa el **mismo SPI**; ubicación física → **ADR posterior**; no es un vendor SaaS más                                                                                        |
| **Composition root**                                    | **`apps/*`** únicamente. **Un único composition root efectivo por runtime ejecutable**. **`packages/sdk` no es composition root** (ver §04.1). Norma de repo: **EE-DOC-006 §13.5** |
| **Dependencia de runtime/contrato de un connector**     | **Únicamente hacia Foundation** (tipos/contratos). **Nunca** hacia Intelligence, Registry, Knowledge, Execution, Governance, Integration ni SDK                                    |
| **Dependencia de tooling de un connector**              | **`packages/config/*` como `devDependency`** (TypeScript, ESLint, etc.) — no forma parte del grafo de runtime del SPI                                                              |

```text
Foundation (contracts: SPI, Inference, Generation, Error)
        ▲
        │ importa tipos
        │
Intelligence (Router)          connectors/official/<provider>
        ▲                              │
        │                              │ implementa SPI
        └──── composition root ────────┘
              (apps/*;
               un root efectivo / runtime)
```

### 04.1. Composition root: exclusión de `packages/sdk`

| Candidato                                      | ¿Composition root? | Motivo                                                                                                                                                             |
| :--------------------------------------------- | :----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`apps/*`**                                   |       **Sí**       | Runtime ejecutable; puede conocer implementaciones privadas (EE-DOC-006 §13.5)                                                                                     |
| **`scripts/bootstrap` / `pnpm run bootstrap`** |       **No**       | Setup de entorno local (EE-DOC-011); **no** es composition root de providers                                                                                       |
| **`packages/sdk`**                             |       **No**       | **R-SDK-3**: SDKs livianos, sin lógica de negocio; exposición pública; connectors son `private`. Cablear vendor en SDK contradice release y separación de concerns |

Si en el futuro un SDK publicado debiera actuar como host de providers, se requerirá **ADR** específico (no esta decisión).

### 04.2. Reglas derivadas

1. Intelligence **no** importa connectors ni SDKs de vendor.
2. Connectors **dependen en runtime/contrato únicamente hacia** Foundation; **tooling** vía Config (`devDependency`) está permitido.
3. Nuevo vendor remoto = **Tipo B** + **T-CON** (EE-DOC-012), sin RFC si no cambia el árbol de primer nivel de 006.
4. El composition root es el único lugar que conoce implementaciones concretas de connectors de provider.
5. **ABI operacional** (payloads, Error, timeouts/retries/backoff, versionado SPI, degraded mode, compatibilidad) → **EE-IMP-013-P03** (criterio de aceptación obligatorio antes de adapters ACTIVE).
6. **Patrón de wiring** (register, default provider, catalog port, swap, validación pre-route, evidencia de un solo root por runtime) → **EE-IMP-013-P03/P04**.
7. Enforcement automático de imports prohibidos en `scripts/validate` → **Tipo B** (EE-IMP-013 / alineación EE-DOC-010); hasta entonces, revisión + criterios IMP.

### 04.3. Extensión explícita de EE-DOC-006 §13.2 (Tipo C)

| Sujeto                                             | Puede depender de                                                      |
| :------------------------------------------------- | :--------------------------------------------------------------------- |
| **Connectors (runtime/contrato)**                  | **Solo Foundation**                                                    |
| **Connectors (tooling)**                           | **Config** (`devDependency`)                                           |
| **Composition root** (`apps/*` — EE-DOC-006 §13.5) | Connectors (solo wiring) + capas ya autorizadas para esa app           |
| **Intelligence**                                   | Foundation, Execution, Intelligence — **no** Connectors                |
| **SDK**                                            | Capas de packages según 006; **no** Connectors para wiring de provider |

Materializado en **EE-DOC-006** (vigente) (R-CONN; composition root sin SDK).

---

## 05. Alcance

### 05.1. Incluye

- Ubicación SPI y tipos; adapters remotos; dirección de dependencia de connectors (runtime vs tooling).
- Composition root (`apps/*`; unicidad por runtime; exclusión de SDK; EE-DOC-006 §13.5).
- Extensión EE-DOC-006 §13.2.
- Alineación EE-DOC-013 (reglas PR-07…PR-09).

### 05.2. No incluye

- Lista de vendors baseline.
- ABI/payloads numéricos (**EE-IMP-013-P03**).
- Ubicación física del Local Inference Runtime (**ADR posterior**).
- Implementación del patrón de wiring (IMP).
- Enforcement automático de imports en `validate` (Tipo B en IMP).

---

## 06. Justificación Arquitectónica

- Evita ciclos y violaciones de EE-DOC-006 §13.2.
- Grafo: Foundation ← Intelligence y Foundation ← connectors; cableado solo en composition root de aplicación.
- Límite de confianza de APIs externas fuera del core.
- Vendor Agnostic (003) y Adapter Pattern / R3 (004).
- Cierra divergencia silenciosa entre 013/ADR y la matriz 006.
- Preserva SDK como capa de exposición pública sin dependencias `private` de connectors.

---

## 07. Alternativas rechazadas

| Alternativa                           | Motivo de rechazo                                    |
| :------------------------------------ | :--------------------------------------------------- |
| SPI solo en Intelligence              | Forzaría `connectors → intelligence`                 |
| Adapters dentro de Intelligence       | Mezcla trust boundary con enrutamiento               |
| Solo connectors sin SPI en Foundation | Rompe AI Layer de 004                                |
| `packages/ai/` top-level              | Viola EE-DOC-006                                     |
| SPI "en Intelligence o Foundation"    | Doble SSOT                                           |
| Dejar §13.2 sin Connectors            | Divergencia silenciosa 006 ↔ 013                    |
| SDK como composition root             | Contradice **R-SDK-3** y release (public vs private) |

---

## 08. Consecuencias

### 08.1. Positivas

- Grafo determinista; 006/013/ADR alineados; camino T-CON; ABI/wiring acotados a IMP; SDK sin acoplamiento a connectors.

### 08.2. Negativas / Riesgos

- Disciplina en composition root por app; Local Inference abierto hasta ADR posterior; cambio de tipos Foundation impacta connectors e Intelligence; hasta enforcement en validate, control de imports es revisión + criterios IMP.

---

## 09. Estado de la decisión

**Aprobado** — decisión **Tipo C** (EE-DOC-005).

**EE-DOC-006** incorpora la extensión §13.2 (Connectors + composition root sin SDK como wiring host).

**EE-DOC-013** especializa la aplicación en el AI Ecosystem y **no redefine** esta decisión (SSOT de la decisión = este ADR).

Implementación: **EE-IMP-013-P03** (SPI/ABI/adapters) y **P04** (routing/wiring + un root por runtime).

---

## 10. Referencias

| Código             | Documento                | Descripción                                  |
| :----------------- | :----------------------- | :------------------------------------------- |
| **EE-DOC-002**     | Document Design Template | Plantilla §18.2 ADR                          |
| **EE-DOC-003**     | Constitution             | Vendor Agnostic                              |
| **EE-DOC-004**     | Engineering Architecture | AI Layer; Adapter Pattern                    |
| **EE-DOC-005**     | Development Workflow     | Cambio gobernado Tipo C                      |
| **EE-DOC-006**     | Repository Structure     | §13.2 Connectors + composition root          |
| **EE-DOC-009**     | Infrastructure           | Secretos / credenciales provider             |
| **EE-DOC-010**     | Quality Gates            | No False Pass; enforcement futuro de capas   |
| **EE-DOC-012**     | Templates                | T-CON                                        |
| **EE-DOC-013**     | AI Ecosystem             | Especialización; no co-SSOT de esta decisión |
| **EE-IMP-013-P03** | (futuro)                 | ABI + adapters + evidencia imports           |
| **EE-IMP-013-P04** | (futuro)                 | Routing + wiring + un root/runtime           |

---

## 11. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo               | Cambios                                                                                                             | Estado       |
| :--------- | :--------- | :--------------------- | :--------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------ | :----------- |
| **v1.0.0** | 2026-10-02 | Equipo de Arquitectura | —                      | Cierre B2            | SPI vs connectors (borrador)                                                                                        | Propuesto    |
| **v1.0.1** | 2026-10-02 | Equipo de Arquitectura | —                      | Revisión AI          | SPI en Foundation; composition root; Local Runtime                                                                  | Propuesto    |
| **v1.1.0** | 2026-10-02 | Equipo de Arquitectura | —                      | N1 + §18.2           | Plantilla completa; sin "o"; PR-08/09                                                                               | Propuesto    |
| **v1.2.0** | 2026-10-03 | Equipo de Arquitectura | —                      | Sync 006/013         | Dependencia hacia Foundation; un root/runtime; extensión §13.2; ABI→P03                                             | Propuesto    |
| **v1.3.0** | 2026-10-03 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre revisión      | Config como tooling; SDK **excluido** de composition root; prohibiciones alineadas a 006; ADR = SSOT de la decisión | **Aprobado** |
| **v1.3.1** | 2026-10-03 | Equipo de Arquitectura | Equipo de Arquitectura | Alineación 006 §13.5 | Composition root = `apps/*` solo; R-SDK-3; desambiguación bootstrap                                                 | **Aprobado** |

---

## FIN DEL DOCUMENTO
