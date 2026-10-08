# EE-IMP-013-P03 — Provider SPI and Contracts

Este documento registra la evidencia técnica de implementación de la fase **P03** de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.3**, **EE-ADR-005** y **EE-DOC-005**.

---

## METADATOS

| Campo                      | Valor                                                                          |
| :------------------------- | :----------------------------------------------------------------------------- |
| **ID**                     | EE-IMP-013-P03                                                                 |
| **Documento**              | Provider SPI and Contracts                                                     |
| **Código corto**           | EE-IMP-013-P03                                                                 |
| **Fase**                   | Fase 3 — Core Components                                                       |
| **Fase de implementación** | P03 — Provider SPI and contracts (Implementación de EE-DOC-013)                |
| **Tipo**                   | Documento Técnico de Implementación                                            |
| **Clasificación**          | Implementación                                                                 |
| **Nivel**                  | Técnico                                                                        |
| **Normativo**              | No                                                                             |
| **Versión**                | v1.1.0                                                                         |
| **Estado**                 | Completado                                                                     |
| **Propietario**            | Equipo de Arquitectura                                                         |
| **Documento padre**        | EE-DOC-013 — AI Ecosystem (Aprobado)                                           |
| **Dependencias**           | EE-DOC-006; EE-DOC-013; EE-ADR-005; EE-IMP-013-P01; EE-IMP-013-P02; EE-DOC-010 |
| **Aprobado por**           | Equipo de Arquitectura                                                         |
| **Audiencia**              | Arquitectura, Desarrollo                                                       |
| **Fecha de creación**      | 2026-10-03                                                                     |
| **Última revisión**        | 2026-10-03                                                                     |
| **Próxima revisión**       | EE-IMP-013-P04                                                                 |

---

## 01. Objetivo

1. Materializar en **`packages/foundation`** el **ABI mínimo versionado** del Provider SPI (SSOT de tipos): Inference, Generation, Error, catalog port, política de timeout/retry/backoff y degraded mode (EE-DOC-013 §04.5; EE-ADR-005 §04.2 punto 5).
2. Exportar el contrato desde `@eq-labs/foundation` para consumo por **Intelligence** y **connectors** (runtime → solo Foundation).
3. Documentar la **adapter boundary**: implementación del SPI en `connectors/official/*`; **sin** adapters ACTIVE de vendor en esta fase (skeleton/boundary only).
4. Verificar que `connectors/*/package.json` **no** declaran runtime deps a `@eq-labs/intelligence`, `registry` ni `knowledge`.
5. `lint` / `typecheck` / `build` de **foundation** (e intelligence si reexporta tipos) OK.

**Prohibido en P03:** Router funcional, wiring en `apps/*` (P04), SDKs de vendor dentro de Intelligence, catálogo silencioso paralelo.

---

## 02. Alcance

### 02.1. Incluye

| Artefacto                                | Acción                         |
| :--------------------------------------- | :----------------------------- |
| `packages/foundation/src/contracts/**`   | Tipos + constantes SPI v1      |
| `packages/foundation/src/index.ts`       | Re-export público de contracts |
| README foundation (sección AI contracts) | Puntero a EE-DOC-013 / ADR-005 |
| Criterio imports connectors              | Evidencia Select-String        |
| Gates foundation                         | lint / typecheck / build       |

### 02.2. No incluye

| Ítem                                          | Fase                          |
| :-------------------------------------------- | :---------------------------- |
| Specialization / Provider Router implementado | **P04**                       |
| Inyección en composition root (`apps/*`)      | **P04**                       |
| Connector vendor real (OpenAI, etc.) ACTIVE   | Posterior + T-CON             |
| Local Inference Runtime ubicación física      | **ADR posterior**             |
| Enforcement automático de imports en validate | Tipo B / EE-DOC-010 (PENDING) |

---

## 03. Prerrequisitos

| Prerrequisito                  | Estado              |
| :----------------------------- | :------------------ |
| EE-IMP-013-P02 Completado      | ✅                  |
| EE-ADR-005 Aprobado            | ✅                  |
| `@eq-labs/foundation` scaffold | ✅                  |
| D-01 WAIVED (braces)           | ✅ hasta 2026-10-10 |

---

## 04. ABI mínimo versionado (contrato operacional)

**SPI version:** `1.0.0` (constante `AI_SPI_VERSION`).

### 04.1. Principios

| #   | Norma                                                                            |
| :-- | :------------------------------------------------------------------------------- |
| 1   | Único SSOT de tipos = **Foundation** (`src/contracts`).                          |
| 2   | Connectors **implementan** el SPI; Intelligence **usa** el SPI; **no** al revés. |
| 3   | Vendor-agnostic: ningún tipo nombra un proveedor concreto.                       |
| 4   | Fallos de provider → `AIError` controlado (AI-10); **no** inventar éxito.        |
| 5   | Degraded mode = resultado explícito (`DEGRADED` / política), no silencio.        |

### 04.2. Timeouts, retries, backoff (defaults)

| Parámetro    | Default                                                  | Notas                                                    |
| :----------- | :------------------------------------------------------- | :------------------------------------------------------- |
| `timeoutMs`  | `30_000`                                                 | Por request; el adapter debe respetar o fallar `TIMEOUT` |
| `maxRetries` | `2`                                                      | Solo si `retryable === true`                             |
| Backoff      | Exponencial: `200ms * 2^attempt` (+ jitter opcional)     | No bloquea el event loop de forma indefinida             |
| Degraded     | Código `DEGRADED` o política documentada en Router (P04) | Fail closed respecto a QG / merge                        |

### 04.3. Compatibilidad

- Request debe enviar `spiVersion`.
- Provider declara `readonly spiVersion`.
- Incompatibilidad mayor → `INVALID_REQUEST` o rechazo en composition root (P04); **no** coerción silenciosa.

---

## 05. Estructura física (Foundation)

```text
packages/foundation/
  src/
    index.ts                 # re-exports
    contracts/
      index.ts
      version.ts
      error.ts
      inference.ts
      generation.ts
      provider.ts            # AIProvider SPI
      catalog.ts             # CatalogPort
  package.json
  tsconfig.json
```

---

## 06. Contenido de archivos (aplicar en monorepo)

### 06.1. `src/contracts/version.ts`

```typescript
/** AI Provider SPI contract version (EE-DOC-013 / EE-ADR-005 / EE-IMP-013-P03). */
export const AI_SPI_VERSION = '1.0.0' as const;
export type AISpiVersion = typeof AI_SPI_VERSION;
```

### 06.2. `src/contracts/error.ts`

```typescript
export type AIErrorCode =
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'DEGRADED'
  | 'NOT_APPLICABLE'
  | 'INTERNAL';

export interface AIError {
  code: AIErrorCode;
  message: string;
  /** If true, caller may retry under default backoff policy. */
  retryable: boolean;
  providerId?: string;
  requestId?: string;
  cause?: unknown;
}

export function isAIError(value: unknown): value is AIError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'retryable' in value
  );
}
```

### 06.3. `src/contracts/inference.ts`

```typescript
import type { AISpiVersion } from './version.js';
import { AI_SPI_VERSION } from './version.js';

export interface InferenceRequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export interface InferenceRequest {
  spiVersion: AISpiVersion;
  requestId: string;
  /** Logical model id (provider-specific mapping is adapter concern). */
  model?: string;
  input: unknown;
  options?: InferenceRequestOptions;
}

export interface InferenceResponseMeta {
  latencyMs?: number;
  model?: string;
  providerId?: string;
}

export interface InferenceResponse {
  spiVersion: AISpiVersion;
  requestId: string;
  output: unknown;
  meta?: InferenceResponseMeta;
}

export function createInferenceRequest(
  partial: Omit<InferenceRequest, 'spiVersion'> & { spiVersion?: AISpiVersion },
): InferenceRequest {
  return {
    spiVersion: partial.spiVersion ?? AI_SPI_VERSION,
    requestId: partial.requestId,
    model: partial.model,
    input: partial.input,
    options: partial.options,
  };
}
```

### 06.4. `src/contracts/generation.ts`

```typescript
import type { AISpiVersion } from './version.js';
import { AI_SPI_VERSION } from './version.js';

export interface GenerationRequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GenerationRequest {
  spiVersion: AISpiVersion;
  requestId: string;
  model?: string;
  /** Prompt or structured generation input (opaque at SPI layer). */
  input: unknown;
  options?: GenerationRequestOptions;
}

export interface GenerationResponseMeta {
  latencyMs?: number;
  model?: string;
  providerId?: string;
}

export interface GenerationResponse {
  spiVersion: AISpiVersion;
  requestId: string;
  output: unknown;
  meta?: GenerationResponseMeta;
}

export function createGenerationRequest(
  partial: Omit<GenerationRequest, 'spiVersion'> & { spiVersion?: AISpiVersion },
): GenerationRequest {
  return {
    spiVersion: partial.spiVersion ?? AI_SPI_VERSION,
    requestId: partial.requestId,
    model: partial.model,
    input: partial.input,
    options: partial.options,
  };
}
```

### 06.5. `src/contracts/provider.ts`

```typescript
import type { AISpiVersion } from './version.js';
import type { InferenceRequest, InferenceResponse } from './inference.js';
import type { GenerationRequest, GenerationResponse } from './generation.js';
import type { AIError } from './error.js';

/**
 * Provider SPI — implemented by connectors/official/* (remote)
 * or Local Inference Runtime (ADR posterior).
 * Intelligence consumes this interface; it does not implement vendor SDKs.
 */
export interface AIProvider {
  readonly id: string;
  readonly spiVersion: AISpiVersion;
  infer(request: InferenceRequest): Promise<InferenceResponse | AIError>;
  generate?(request: GenerationRequest): Promise<GenerationResponse | AIError>;
}
```

### 06.6. `src/contracts/catalog.ts`

```typescript
/**
 * Catalog port — types in Foundation; implementation in Registry;
 * injection at apps/* composition root (P04). Intelligence must not
 * import @eq-labs/registry.
 */
export interface SpecializationMeta {
  id: string;
  capabilities?: string[];
  status?: 'active' | 'deprecated' | 'disabled';
  /** Opaque routing hints; Router interprets policy. */
  routingHints?: Record<string, unknown>;
}

export interface CatalogPort {
  getSpecialization(id: string): Promise<SpecializationMeta | null>;
  listSpecializations(): Promise<SpecializationMeta[]>;
}
```

### 06.7. `src/contracts/index.ts`

```typescript
export { AI_SPI_VERSION } from './version.js';
export type { AISpiVersion } from './version.js';

export type { AIErrorCode, AIError } from './error.js';
export { isAIError } from './error.js';

export type {
  InferenceRequest,
  InferenceRequestOptions,
  InferenceResponse,
  InferenceResponseMeta,
} from './inference.js';
export { createInferenceRequest } from './inference.js';

export type {
  GenerationRequest,
  GenerationRequestOptions,
  GenerationResponse,
  GenerationResponseMeta,
} from './generation.js';
export { createGenerationRequest } from './generation.js';

export type { AIProvider } from './provider.js';

export type { SpecializationMeta, CatalogPort } from './catalog.js';
```

### 06.8. `src/index.ts`

```typescript
/**
 * @eq-labs/foundation — foundational contracts and ports.
 * AI Provider SPI SSOT: ./contracts (EE-DOC-013, EE-ADR-005, EE-IMP-013-P03).
 */
export * from './contracts/index.js';
```

### 06.9. Defaults documentados (no runtime obligatorio aún)

| Constante lógica          | Valor |
| :------------------------ | :---- |
| `DEFAULT_TIMEOUT_MS`      | 30000 |
| `DEFAULT_MAX_RETRIES`     | 2     |
| `DEFAULT_BACKOFF_BASE_MS` | 200   |

Pueden vivir como `export const` en `version.ts` o `provider.ts` si se desea consumo compartido:

```typescript
export const AI_SPI_DEFAULTS = {
  timeoutMs: 30_000,
  maxRetries: 2,
  backoffBaseMs: 200,
} as const;
```

---

## 07. Adapter boundary (norma P03)

```text
Foundation contracts (SPI)
        ▲
        │ implements
connectors/official/<provider>   (remote adapter; T-CON)
        │
        └── NO import de Intelligence / Registry / Knowledge
```

- **P03 no exige** un connector de provider de modelo real ACTIVE.
- Cualquier adapter futuro: `dependencies` runtime → solo `@eq-labs/foundation` (+ config en devDependencies).

---

## 08. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# 1. Crear árbol contracts
New-Item -ItemType Directory -Force -Path packages\foundation\src\contracts | Out-Null

# 2. Escribir archivos §06 (UTF-8 sin BOM)

# 3. Quitar residuo JS si existe
Remove-Item -Force packages\foundation\src\index.js -ErrorAction SilentlyContinue
Get-ChildItem packages\foundation\src\contracts -Filter *.js -ErrorAction SilentlyContinue | Remove-Item -Force

# 4. Gates foundation
pnpm --filter @eq-labs/foundation run lint
pnpm --filter @eq-labs/foundation run typecheck
pnpm --filter @eq-labs/foundation run build

# 5. Criterio connectors: sin intelligence/registry/knowledge en runtime deps
Get-ChildItem connectors\official -Directory | ForEach-Object {
  $pkg = Join-Path $_.FullName "package.json"
  if (Test-Path $pkg) {
    Write-Host "=== $($_.Name) ==="
    Select-String -Path $pkg -Pattern "@eq-labs/intelligence|@eq-labs/registry|@eq-labs/knowledge"
  }
}
# Debe: sin coincidencias (o solo comentarios; idealmente cero)

# 6. validate global (puede FAIL por D-01 braces)
pnpm run validate
```

---

## 09. Criterios de aceptación (EE-DOC-013 §12.2 — P03)

| Criterio                                                | Evidencia                        | Estado |
| :------------------------------------------------------ | :------------------------------- | :----- |
| Contract + SPI + tipos en Foundation                    | `src/contracts/*` + export index | ✅     |
| ABI mínimo versionado (`AI_SPI_VERSION`)                | `version.ts` + `AI_SPI_DEFAULTS` | ✅     |
| Error / Inference / Generation / Provider / CatalogPort | Archivos §06                     | ✅     |
| Timeouts / retries / backoff documentados               | §04.2 + `AI_SPI_DEFAULTS`        | ✅     |
| connectors sin intelligence/registry/knowledge          | Select-String → OK x6            | ✅     |
| foundation lint/typecheck/build OK                      | 2026-10-04                       | ✅     |
| Sin Router / wiring apps                                | Alcance §02.2                    | ✅     |

---

## 10. Validaciones ejecutadas

| Comando                                           | Resultado      | Detalle                                                                                     |
| :------------------------------------------------ | :------------- | :------------------------------------------------------------------------------------------ |
| Materialización `src/contracts`                   | ✅             | version, error, inference, generation, provider, catalog, index + `src/index.ts`            |
| `pnpm --filter @eq-labs/foundation run lint`      | ✅             | eslint exit 0                                                                               |
| `pnpm --filter @eq-labs/foundation run typecheck` | ✅             | tsc --noEmit exit 0                                                                         |
| `pnpm --filter @eq-labs/foundation run build`     | ✅             | tsc emit exit 0                                                                             |
| Criterio deps connectors                          | ✅             | a2a, docker, github, kubernetes, mcp, notebooklm → OK (sin intelligence/registry/knowledge) |
| `pnpm run validate`                               | ⚠️ FAIL = D-01 | Solo QG-SEC-001 braces vía plop; resto de checks de estructura OK                           |

### 10.1. Resultado de la fase

**Estado: Completado.**

ABI SPI **v1.0.0** materializado en Foundation. Criterios EE-DOC-013 §12.2 (P03) y EE-ADR-005 (ABI → P03) satisfechos. El FAIL de `validate` es **únicamente** D-01 (WAIVED) y no invalida el alcance P03.

### 10.2. Descubrimientos

| ID   | Tipo | Hallazgo                       | Decisión                                 |
| :--- | :--- | :----------------------------- | :--------------------------------------- |
| D-01 | B    | braces vía plop (arrastre P01) | **WAIVED** hasta 2026-10-10 (sin cambio) |

---

## 11. Trazabilidad

| Elemento                      | Referencia                                      |
| :---------------------------- | :---------------------------------------------- |
| **Documento normativo padre** | EE-DOC-013                                      |
| **ADR**                       | EE-ADR-005                                      |
| **Fase**                      | P03 — Provider SPI and contracts                |
| **Predecesor**                | EE-IMP-013-P02                                  |
| **Siguiente**                 | EE-IMP-013-P04 — Routing and composition wiring |
| **Capas**                     | EE-DOC-006 §13.2                                |

### 11.1. Conformidad

Conforme a EE-DOC-013 §04.5 / §12 y EE-ADR-005 (ABI → P03). No declara adapters vendor ACTIVE ni enforcement de imports en CI.

---

## 12. Referencias

| Código             | Documento                              |
| :----------------- | :------------------------------------- |
| **EE-DOC-013**     | AI Ecosystem                           |
| **EE-ADR-005**     | AI Provider SPI and Connector Adapters |
| **EE-DOC-006**     | Repository Structure                   |
| **EE-IMP-013-P02** | Baseline Package                       |
| **EE-DOC-002**     | §18.3                                  |

---

## 13. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                                                          | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :----------------------------------------------------------------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-03 | Equipo de Arquitectura | —                      | Apertura P03 | ABI SPI v1.0.0 en Foundation; adapter boundary; criterios connectors                             | En Implementación |
| **v1.1.0** | 2026-10-04 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P03   | Contracts materializados; foundation gates OK; connectors OK; D-01 WAIVED; estado **Completado** | **Completado**    |

---

## FIN DEL DOCUMENTO
