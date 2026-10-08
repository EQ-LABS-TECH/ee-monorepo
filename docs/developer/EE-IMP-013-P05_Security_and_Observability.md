# EE-IMP-013-P05 — Security and Observability

Este documento registra la evidencia técnica de implementación de la fase **P05** de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.3**, **EE-DOC-013 §09** y **AI-04 / AI-09 / AI-11**.

---

## METADATOS

| Campo                      | Valor                                                           |
| :------------------------- | :-------------------------------------------------------------- |
| **ID**                     | EE-IMP-013-P05                                                  |
| **Documento**              | Security and Observability                                      |
| **Código corto**           | EE-IMP-013-P05                                                  |
| **Fase**                   | Fase 3 — Core Components                                        |
| **Fase de implementación** | P05 — Security and observability (Implementación de EE-DOC-013) |
| **Tipo**                   | Documento Técnico de Implementación                             |
| **Clasificación**          | Implementación                                                  |
| **Nivel**                  | Técnico                                                         |
| **Normativo**              | No                                                              |
| **Versión**                | v1.1.0                                                          |
| **Estado**                 | Completado                                                      |
| **Propietario**            | Equipo de Arquitectura                                          |
| **Documento padre**        | EE-DOC-013 — AI Ecosystem (Aprobado)                            |
| **Dependencias**           | EE-DOC-009; EE-DOC-010; EE-DOC-013; EE-IMP-013-P01…P04          |
| **Aprobado por**           | Equipo de Arquitectura                                          |
| **Audiencia**              | Arquitectura, Desarrollo, Seguridad                             |
| **Fecha de creación**      | 2026-10-04                                                      |
| **Última revisión**        | 2026-10-04                                                      |
| **Próxima revisión**       | EE-IMP-013-P06                                                  |

---

## 01. Objetivo

1. Materializar en **`@eq-labs/intelligence`** el camino de **observabilidad por defecto** (§09.3): metadata + correlation IDs + provider/policy ids + latency/error codes — **sin** raw prompt/response.
2. Implementar **redacción** y filtros básicos de contenido sensible en el camino de logs.
3. Exponer política explícita de **opt-in** a raw (default **false**); prohibir persistencia raw salvo opt-in + policy.
4. Documentar y reforzar **AI-11**: suites de Intelligence en CI **sin** llamadas a providers reales ni secretos de modelo.
5. Alinear **SEC-01…SEC-05** con evidencia verificable (código + checklist); **sin** declarar enforcement de observabilidad en CI si no existe gate (No False Pass).

---

## 02. Alcance

### 02.1. Incluye

| Entrega                                         | Ubicación                                                 |
| :---------------------------------------------- | :-------------------------------------------------------- |
| Correlation ID                                  | `packages/intelligence/src/observability/`                |
| Redaction helpers                               | idem                                                      |
| Invocation log record (metadata only)           | idem                                                      |
| Observability policy (raw opt-in default false) | idem                                                      |
| Integración opcional en routing                 | `ProviderRouter.infer` emite metadata vía sink inyectable |
| README / comentarios AI-11                      | intelligence README §Observability                        |

### 02.2. No incluye

| Ítem                                        | Nota                               |
| :------------------------------------------ | :--------------------------------- |
| Backend de telemetría (OTLP, Datadog, etc.) | Solo contrato de evento en proceso |
| Gate CI de “no raw en logs”                 | Declarativo hasta Type B + QG      |
| Almacenamiento de datasets / learning       | Diferido §09.2                     |
| Rotación de secretos providers              | EE-DOC-009 / GitHub Secrets        |
| Cierre documental 013 / TEC                 | **P06**                            |

---

## 03. Prerrequisitos

| Prerrequisito             | Estado              |
| :------------------------ | :------------------ |
| EE-IMP-013-P04 Completado | ✅                  |
| SPI + Router en repo      | ✅                  |
| D-01 braces WAIVED        | ✅ hasta 2026-10-10 |

---

## 04. Modelo de observabilidad (norma operativa)

```text
Invocation (requestId / correlationId)
        │
        ▼
ObservabilityPolicy.allowRawPromptResponse === false  (DEFAULT)
        │
        ├── emit: metadata only
        │     correlationId, requestId, providerId, specializationId?,
        │     latencyMs, errorCode?, spiVersion
        │
        └── NEVER emit: prompt text, response body, secrets, PII, IP de diseño
```

| Nivel       | Condición                                                                                                     |
| :---------- | :------------------------------------------------------------------------------------------------------------ |
| **Default** | Siempre metadata; raw prohibido                                                                               |
| **Raw**     | Solo si `allowRawPromptResponse === true` **y** caller documenta policy versionada (fuera de este mínimo P05) |

---

## 05. Estructura física

```text
packages/intelligence/src/
  observability/
    policy.ts
    correlation.ts
    redaction.ts
    invocation-log.ts
    index.ts
  routing/          # existente P04
  index.ts          # re-export observability
```

---

## 06. Contenido de archivos

### 06.1. `observability/policy.ts`

```typescript
/**
 * Observability policy — EE-DOC-013 §09.3 / AI-09.
 * Default: no raw prompt/response persistence or logging.
 */
export interface ObservabilityPolicy {
  /** Default false. Raw bodies only with explicit opt-in + versioned policy. */
  allowRawPromptResponse: boolean;
  /** Include latencyMs in metadata events. */
  includeLatency: boolean;
}

export const DEFAULT_OBSERVABILITY_POLICY: ObservabilityPolicy = {
  allowRawPromptResponse: false,
  includeLatency: true,
};
```

### 06.2. `observability/correlation.ts`

```typescript
import { randomUUID } from 'node:crypto';

/** Correlation id for cross-service traces (AI-09). */
export function createCorrelationId(): string {
  return randomUUID();
}
```

### 06.3. `observability/redaction.ts`

```typescript
const SECRET_PATTERNS: RegExp[] = [
  /\b(sk-[a-zA-Z0-9]{10,})\b/g,
  /\b(api[_-]?key\s*[:=]\s*\S+)/gi,
  /\b(bearer\s+[a-zA-Z0-9._\-]+)/gi,
  /\b(password\s*[:=]\s*\S+)/gi,
  /\b(ghp_[a-zA-Z0-9]{20,})\b/g,
  /\b(github_pat_[a-zA-Z0-9_]{20,})\b/g,
];

const REDACTED = '[REDACTED]';

/**
 * Redact common secret-like substrings. Not a guarantee of absence of secrets
 * (AI-04); defense-in-depth for log paths.
 */
export function redactSensitive(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

/** True if text looks like it may contain credential material. */
export function looksSensitive(text: string): boolean {
  return SECRET_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}
```

### 06.4. `observability/invocation-log.ts`

```typescript
import type { ObservabilityPolicy } from './policy.js';
import { DEFAULT_OBSERVABILITY_POLICY } from './policy.js';
import { redactSensitive } from './redaction.js';

/** Metadata-only invocation event (SEC-03 / §09.3). */
export interface InvocationLogEvent {
  correlationId: string;
  requestId: string;
  providerId?: string;
  specializationId?: string;
  spiVersion?: string;
  latencyMs?: number;
  errorCode?: string;
  /** Never populated unless policy.allowRawPromptResponse === true. */
  rawPrompt?: string;
  rawResponse?: string;
}

export type InvocationLogSink = (event: InvocationLogEvent) => void;

const noopSink: InvocationLogSink = () => {
  /* default: no external sink; callers may inject */
};

export function createInvocationLogger(
  policy: ObservabilityPolicy = DEFAULT_OBSERVABILITY_POLICY,
  sink: InvocationLogSink = noopSink,
) {
  return {
    policy,
    emit(event: InvocationLogEvent): void {
      const safe: InvocationLogEvent = {
        correlationId: event.correlationId,
        requestId: event.requestId,
        providerId: event.providerId,
        specializationId: event.specializationId,
        spiVersion: event.spiVersion,
        latencyMs: policy.includeLatency ? event.latencyMs : undefined,
        errorCode: event.errorCode,
      };

      if (policy.allowRawPromptResponse) {
        if (event.rawPrompt !== undefined) {
          safe.rawPrompt = redactSensitive(event.rawPrompt);
        }
        if (event.rawResponse !== undefined) {
          safe.rawResponse = redactSensitive(event.rawResponse);
        }
      }
      // else: raw fields intentionally omitted (default path)

      sink(safe);
    },
  };
}
```

### 06.5. `observability/index.ts`

```typescript
export { DEFAULT_OBSERVABILITY_POLICY, type ObservabilityPolicy } from './policy.js';
export { createCorrelationId } from './correlation.js';
export { redactSensitive, looksSensitive } from './redaction.js';
export {
  createInvocationLogger,
  type InvocationLogEvent,
  type InvocationLogSink,
} from './invocation-log.js';
```

### 06.6. Actualizar `packages/intelligence/src/index.ts`

```typescript
/**
 * @eq-labs/intelligence — routing + observability (EE-DOC-013).
 * Does not import registry, knowledge, or connectors.
 * AI-11: tests must not call real providers or require model secrets in CI.
 */
export {
  ProviderRouter,
  SpecializationRouter,
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from './routing/index.js';

export {
  DEFAULT_OBSERVABILITY_POLICY,
  createCorrelationId,
  createInvocationLogger,
  redactSensitive,
  looksSensitive,
  type ObservabilityPolicy,
  type InvocationLogEvent,
  type InvocationLogSink,
} from './observability/index.js';
```

### 06.7. Integración mínima en `ProviderRouter.infer` (opcional recomendada)

Añadir parámetros opcionales al final de `infer` **o** envolver en composition root. Preferencia P05: **no romper firma** de P04; el composition root puede instrumentar:

```typescript
// apps/cli/src/composition/ai-root.ts — ejemplo de uso
import {
  createCorrelationId,
  createInvocationLogger,
  DEFAULT_OBSERVABILITY_POLICY,
} from '@eq-labs/intelligence';

const logger = createInvocationLogger(DEFAULT_OBSERVABILITY_POLICY, (e) => {
  // metadata only; never log e.raw* unless policy allows
  console.info('[ai-invocation]', JSON.stringify(e));
});
```

**P05 acepta** export del módulo observability sin cambiar la firma pública de `ProviderRouter` (menor riesgo). Instrumentación en root = evidencia de composition (006 §13.5).

---

## 07. AI-11 y SEC checklist

| ID         | Control                                      | Evidencia P05                                                                             |
| :--------- | :------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **AI-11**  | CI sin providers reales / secretos de modelo | Comentario en index + README; no hay código que lea `OPENAI_API_KEY` etc. en intelligence |
| **SEC-01** | Secretos en GitHub Secrets / 009             | No secrets en `packages/intelligence`                                                     |
| **SEC-02** | Minimización prompts                         | Policy default sin raw; redaction helpers                                                 |
| **SEC-03** | §09.3                                        | `InvocationLogEvent` metadata-only                                                        |
| **SEC-04** | Secret scanning                              | Sin cambio; no introducir secrets                                                         |
| **SEC-05** | Versiones / audit                            | D-01 WAIVED conocido                                                                      |

---

## 08. Procedimiento operador

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

# Crear archivos §06 (script abajo)
# Luego:
pnpm --filter @eq-labs/intelligence run build
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run lint

pnpm run format
pnpm run validate
# FAIL solo D-01 = OK
```

---

## 09. Script PowerShell (copiar/pegar)

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo
$utf8 = New-Object System.Text.UTF8Encoding $false
$root = (Resolve-Path .).Path
function Write-NoBom([string]$RelPath, [string]$Content) {
  $full = Join-Path $root $RelPath
  $parent = Split-Path $full -Parent
  if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($full, $Content.TrimStart() + "`n", $utf8)
  Write-Host "OK  $RelPath"
}

New-Item -ItemType Directory -Force -Path packages\intelligence\src\observability | Out-Null

Write-NoBom "packages\intelligence\src\observability\policy.ts" @'
/**
 * Observability policy — EE-DOC-013 §09.3 / AI-09.
 * Default: no raw prompt/response persistence or logging.
 */
export interface ObservabilityPolicy {
  /** Default false. Raw bodies only with explicit opt-in + versioned policy. */
  allowRawPromptResponse: boolean;
  /** Include latencyMs in metadata events. */
  includeLatency: boolean;
}

export const DEFAULT_OBSERVABILITY_POLICY: ObservabilityPolicy = {
  allowRawPromptResponse: false,
  includeLatency: true,
};
'@

Write-NoBom "packages\intelligence\src\observability\correlation.ts" @'
import { randomUUID } from "node:crypto";

/** Correlation id for cross-service traces (AI-09). */
export function createCorrelationId(): string {
  return randomUUID();
}
'@

Write-NoBom "packages\intelligence\src\observability\redaction.ts" @'
const SECRET_PATTERNS: RegExp[] = [
  /\b(sk-[a-zA-Z0-9]{10,})\b/g,
  /\b(api[_-]?key\s*[:=]\s*\S+)/gi,
  /\b(bearer\s+[a-zA-Z0-9._\-]+)/gi,
  /\b(password\s*[:=]\s*\S+)/gi,
  /\b(ghp_[a-zA-Z0-9]{20,})\b/g,
  /\b(github_pat_[a-zA-Z0-9_]{20,})\b/g,
];

const REDACTED = "[REDACTED]";

/**
 * Redact common secret-like substrings. Not a guarantee of absence of secrets
 * (AI-04); defense-in-depth for log paths.
 */
export function redactSensitive(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

/** True if text looks like it may contain credential material. */
export function looksSensitive(text: string): boolean {
  return SECRET_PATTERNS.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}
'@

Write-NoBom "packages\intelligence\src\observability\invocation-log.ts" @'
import type { ObservabilityPolicy } from "./policy.js";
import { DEFAULT_OBSERVABILITY_POLICY } from "./policy.js";
import { redactSensitive } from "./redaction.js";

/** Metadata-only invocation event (SEC-03 / §09.3). */
export interface InvocationLogEvent {
  correlationId: string;
  requestId: string;
  providerId?: string;
  specializationId?: string;
  spiVersion?: string;
  latencyMs?: number;
  errorCode?: string;
  /** Never populated unless policy.allowRawPromptResponse === true. */
  rawPrompt?: string;
  rawResponse?: string;
}

export type InvocationLogSink = (event: InvocationLogEvent) => void;

const noopSink: InvocationLogSink = () => {
  /* default: no external sink; callers may inject */
};

export function createInvocationLogger(
  policy: ObservabilityPolicy = DEFAULT_OBSERVABILITY_POLICY,
  sink: InvocationLogSink = noopSink,
) {
  return {
    policy,
    emit(event: InvocationLogEvent): void {
      const safe: InvocationLogEvent = {
        correlationId: event.correlationId,
        requestId: event.requestId,
        providerId: event.providerId,
        specializationId: event.specializationId,
        spiVersion: event.spiVersion,
        latencyMs: policy.includeLatency ? event.latencyMs : undefined,
        errorCode: event.errorCode,
      };

      if (policy.allowRawPromptResponse) {
        if (event.rawPrompt !== undefined) {
          safe.rawPrompt = redactSensitive(event.rawPrompt);
        }
        if (event.rawResponse !== undefined) {
          safe.rawResponse = redactSensitive(event.rawResponse);
        }
      }

      sink(safe);
    },
  };
}
'@

Write-NoBom "packages\intelligence\src\observability\index.ts" @'
export {
  DEFAULT_OBSERVABILITY_POLICY,
  type ObservabilityPolicy,
} from "./policy.js";
export { createCorrelationId } from "./correlation.js";
export { redactSensitive, looksSensitive } from "./redaction.js";
export {
  createInvocationLogger,
  type InvocationLogEvent,
  type InvocationLogSink,
} from "./invocation-log.js";
'@

Write-NoBom "packages\intelligence\src\index.ts" @'
/**
 * @eq-labs/intelligence — routing + observability (EE-DOC-013).
 * Does not import registry, knowledge, or connectors.
 * AI-11: tests must not call real providers or require model secrets in CI.
 */
export {
  ProviderRouter,
  SpecializationRouter,
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from "./routing/index.js";

export {
  DEFAULT_OBSERVABILITY_POLICY,
  createCorrelationId,
  createInvocationLogger,
  redactSensitive,
  looksSensitive,
  type ObservabilityPolicy,
  type InvocationLogEvent,
  type InvocationLogSink,
} from "./observability/index.js";
'@

# @types/node may already exist via cli; intelligence needs node types for crypto
$intelPkg = Get-Content packages\intelligence\package.json -Raw
if ($intelPkg -notmatch '"@types/node"') {
  Write-Host "Add @types/node to intelligence devDependencies if tsc fails on node:crypto"
}

pnpm --filter @eq-labs/intelligence run build
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run lint
```

Si falla `node:crypto` / types:

```powershell
pnpm --filter @eq-labs/intelligence add -D @types/node@22.18.6
# exact version preferred (EE-DOC-006 §11)
pnpm install
pnpm --filter @eq-labs/intelligence run build
```

---

## 10. Criterios de aceptación (EE-DOC-013 §12.2 — P05)

| Criterio                        | Evidencia                             | Estado |
| :------------------------------ | :------------------------------------ | :----- |
| SEC + default sin raw           | `allowRawPromptResponse === false`    | ✅     |
| Redaction / filters             | `redactSensitive` / logger            | ✅     |
| Correlation IDs                 | `createCorrelationId` + ai-root.infer | ✅     |
| AI-11 documentado               | index.ts                              | ✅     |
| No persistencia raw por defecto | Logger omite raw\*                    | ✅     |
| No False Pass                   | Sin QG observability ACTIVE en CI     | ✅     |
| intelligence + cli gates        | 2026-10-05                            | ✅     |

---

## 11. Validaciones ejecutadas

| Comando                           | Resultado | Detalle                                         |
| :-------------------------------- | :-------- | :---------------------------------------------- |
| Materialización observability     | ✅        | policy, correlation, redaction, invocation-log  |
| `dist` exports observability      | ✅        | `createCorrelationId` en `dist/index.d.ts`      |
| Gates intelligence                | ✅        | build / typecheck / lint                        |
| Gates cli + composition `infer`   | ✅        | ai-root instrumentado; build / typecheck / lint |
| `@types/node` + `types: ["node"]` | ✅        | node:crypto                                     |
| `pnpm run validate`               | ⚠️ D-01   | solo braces — WAIVED                            |

### 11.1. Resultado de la fase

**Estado: Completado.**

SEC-03 / §09.3 materializado (default sin raw). AI-11 documentado. Composition root emite metadata con correlation id. No False Pass: no se declara QG de observabilidad ACTIVE en CI.

### 11.2. Descubrimientos

| ID   | Tipo | Hallazgo        | Decisión                |
| :--- | :--- | :-------------- | :---------------------- |
| D-01 | B    | braces vía plop | WAIVED hasta 2026-10-10 |

---

## 12. Trazabilidad

| Elemento             | Referencia                                           |
| :------------------- | :--------------------------------------------------- |
| **Padre**            | EE-DOC-013 §09 / §12 P05                             |
| **Predecesor**       | EE-IMP-013-P04                                       |
| **Siguiente**        | EE-IMP-013-P06 — Validation and Closure + EE-TEC-008 |
| **Secretos runtime** | EE-DOC-009                                           |

---

## 13. Referencias

| Código         | Documento                       |
| :------------- | :------------------------------ |
| EE-DOC-013     | §09.1–09.3, AI-04, AI-09, AI-11 |
| EE-DOC-009     | Infra secrets                   |
| EE-DOC-010     | No False Pass / QG              |
| EE-IMP-013-P04 | Routing                         |

---

## 14. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                             | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :------------------------------------------------------------------ | :---------------- |
| **v1.0.0** | 2026-10-04 | Equipo de Arquitectura | —                      | Apertura P05 | Observability module; redaction; correlation; policy default no-raw | En Implementación |
| **v1.1.0** | 2026-10-05 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P05   | Module + ai-root.infer; @types/node; D-01 WAIVED; **Completado**    | **Completado**    |

---

## FIN DEL DOCUMENTO
