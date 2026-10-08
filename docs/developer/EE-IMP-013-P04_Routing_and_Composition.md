# EE-IMP-013-P04 — Routing and Composition

Este documento registra la evidencia técnica de implementación de la fase **P04** de **EE-DOC-013 — AI Ecosystem**, conforme a **EE-DOC-002 §18.3**, **EE-ADR-005** y **EE-DOC-006 §13.5**.

---

## METADATOS

| Campo                      | Valor                                                               |
| :------------------------- | :------------------------------------------------------------------ |
| **ID**                     | EE-IMP-013-P04                                                      |
| **Documento**              | Routing and Composition                                             |
| **Código corto**           | EE-IMP-013-P04                                                      |
| **Fase**                   | Fase 3 — Core Components                                            |
| **Fase de implementación** | P04 — Routing and composition wiring (Implementación de EE-DOC-013) |
| **Tipo**                   | Documento Técnico de Implementación                                 |
| **Clasificación**          | Implementación                                                      |
| **Nivel**                  | Técnico                                                             |
| **Normativo**              | No                                                                  |
| **Versión**                | v1.1.0                                                              |
| **Estado**                 | Completado                                                          |
| **Propietario**            | Equipo de Arquitectura                                              |
| **Documento padre**        | EE-DOC-013 — AI Ecosystem (Aprobado)                                |
| **Dependencias**           | EE-DOC-006; EE-DOC-013; EE-ADR-005; EE-IMP-013-P01…P03              |
| **Aprobado por**           | Equipo de Arquitectura                                              |
| **Audiencia**              | Arquitectura, Desarrollo                                            |
| **Fecha de creación**      | 2026-10-04                                                          |
| **Última revisión**        | 2026-10-04                                                          |
| **Próxima revisión**       | EE-IMP-013-P05                                                      |

---

## 01. Objetivo

1. Materializar en **`@eq-labs/intelligence`** el **Provider Router** y **Specialization Router** mínimos que consumen el SPI / CatalogPort de Foundation (sin importar Registry ni connectors).
2. Establecer el **patrón de composition root** en **`apps/*`** (único root efectivo por runtime): register provider, default provider, inyección de catalog port, validación pre-route (EE-ADR-005 §04.2 punto 6; EE-DOC-006 §13.5).
3. Añadir dependencia runtime **`@eq-labs/foundation`** en intelligence (capa permitida).
4. Demostrar degradación **AI-10 / §07.2** cuando no hay catalog port o no hay provider (error `DEGRADED` / `PROVIDER_UNAVAILABLE`, no catálogo silencioso).
5. lint / typecheck / build de **intelligence** y del **app** usado como root de evidencia.

**Prohibido en P04:** secrets/observabilidad raw (P05), adapters vendor ACTIVE obligatorios, Local Inference ubicación, enforcement validate de imports.

---

## 02. Alcance

### 02.1. Incluye

| Superficie               | Entrega                                                                                |
| :----------------------- | :------------------------------------------------------------------------------------- |
| `packages/intelligence`  | `ProviderRouter`, `SpecializationRouter`, policy mínima, dependencia Foundation        |
| `apps/cli`               | Composition root de evidencia: `src/composition/ai-root.ts` (+ export/uso documentado) |
| Noop provider in-process | Solo para wiring de prueba (no connector oficial obligatorio)                          |

### 02.2. No incluye

| Ítem                                        | Fase                  |
| :------------------------------------------ | :-------------------- |
| Observabilidad §09.3 / secrets              | **P05**               |
| Implementación real CatalogPort en Registry | Posterior / 014       |
| Connector de modelo SaaS ACTIVE             | T-CON + IMP posterior |
| Suite de tests QG-TEST completa             | Cuando ACTIVE         |

---

## 03. Prerrequisitos

| Prerrequisito                                 | Estado              |
| :-------------------------------------------- | :------------------ |
| EE-IMP-013-P03 Completado (SPI en Foundation) | ✅                  |
| Commits P02/P03 en `main`                     | ✅                  |
| D-01 WAIVED (CI Validate rojo por braces)     | ✅ hasta 2026-10-10 |

---

## 04. Diseño de routing (mínimo)

```text
CatalogPort (Foundation types; impl Registry o null)
        │
SpecializationRouter  (@eq-labs/intelligence)
        │ routing decision / specialization id
        ▼
ProviderRouter        (@eq-labs/intelligence)
        │ resolve provider by policy + registry map
        ▼
AIProvider.infer / generate   (SPI Foundation)
```

| Componente               | Responsabilidad                                                                                           |
| :----------------------- | :-------------------------------------------------------------------------------------------------------- |
| **ProviderRouter**       | `register`, `setDefault`, `resolve`, `infer`; mapa `id → AIProvider`                                      |
| **SpecializationRouter** | Consulta `CatalogPort` (si existe); delega en ProviderRouter; si catalog ausente → `DEGRADED` documentado |
| **RoutingPolicy**        | Elige `providerId` (default = primer registrado / default id)                                             |
| **Composition root**     | Único lugar que instancia providers y pasa catalog al Router                                              |

---

## 05. Estructura física

```text
packages/intelligence/
  package.json          # dependencies: @eq-labs/foundation
  src/
    index.ts
    routing/
      policy.ts
      provider-router.ts
      specialization-router.ts
      index.ts

apps/cli/
  src/
    composition/
      ai-root.ts        # composition root de evidencia
      noop-provider.ts  # AIProvider in-process (no vendor)
    index.ts            # sin cambiar contrato ee run (opcional import documentado)
```

---

## 06. Contenido de archivos

### 06.1. `packages/intelligence/package.json` — añadir dependency

En `"dependencies"` (crear el bloque si no existe):

```json
"dependencies": {
  "@eq-labs/foundation": "workspace:*"
}
```

**Prohibido:** `@eq-labs/registry`, `@eq-labs/knowledge`, `@eq-labs/connector-*`.

### 06.2. `packages/intelligence/src/routing/policy.ts`

```typescript
import type { AIError, AIProvider } from '@eq-labs/foundation';

export interface RoutingDecision {
  providerId: string;
  specializationId?: string;
}

export interface RoutingPolicy {
  selectProvider(input: {
    specializationId?: string;
    providers: readonly AIProvider[];
    defaultProviderId?: string;
  }): RoutingDecision | AIError;
}

/** Default policy: explicit defaultProviderId, else first registered provider. */
export const defaultRoutingPolicy: RoutingPolicy = {
  selectProvider({ providers, defaultProviderId, specializationId }) {
    if (providers.length === 0) {
      return {
        code: 'PROVIDER_UNAVAILABLE',
        message: 'No AI providers registered in ProviderRouter',
        retryable: false,
      };
    }
    if (defaultProviderId) {
      const found = providers.find((p) => p.id === defaultProviderId);
      if (!found) {
        return {
          code: 'PROVIDER_UNAVAILABLE',
          message: `Default provider not registered: ${defaultProviderId}`,
          retryable: false,
        };
      }
      return { providerId: found.id, specializationId };
    }
    return { providerId: providers[0].id, specializationId };
  },
};
```

### 06.3. `packages/intelligence/src/routing/provider-router.ts`

```typescript
import type { AIError, AIProvider, InferenceRequest, InferenceResponse } from '@eq-labs/foundation';
import { isAIError } from '@eq-labs/foundation';
import { defaultRoutingPolicy, type RoutingDecision, type RoutingPolicy } from './policy.js';

export class ProviderRouter {
  private readonly providers = new Map<string, AIProvider>();
  private defaultProviderId: string | undefined;
  private readonly policy: RoutingPolicy;

  constructor(policy: RoutingPolicy = defaultRoutingPolicy) {
    this.policy = policy;
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  setDefault(providerId: string): void {
    this.defaultProviderId = providerId;
  }

  list(): AIProvider[] {
    return [...this.providers.values()];
  }

  resolve(specializationId?: string): AIProvider | AIError {
    const decision = this.policy.selectProvider({
      specializationId,
      providers: this.list(),
      defaultProviderId: this.defaultProviderId,
    });
    if (isAIError(decision)) return decision;
    const provider = this.providers.get((decision as RoutingDecision).providerId);
    if (!provider) {
      return {
        code: 'PROVIDER_UNAVAILABLE',
        message: `Provider not found: ${(decision as RoutingDecision).providerId}`,
        retryable: false,
      };
    }
    return provider;
  }

  async infer(
    request: InferenceRequest,
    specializationId?: string,
  ): Promise<InferenceResponse | AIError> {
    const provider = this.resolve(specializationId);
    if (isAIError(provider)) return provider;
    return provider.infer(request);
  }
}
```

### 06.4. `packages/intelligence/src/routing/specialization-router.ts`

```typescript
import type {
  AIError,
  CatalogPort,
  InferenceRequest,
  InferenceResponse,
} from '@eq-labs/foundation';
import { isAIError } from '@eq-labs/foundation';
import type { ProviderRouter } from './provider-router.js';

/**
 * Uses CatalogPort when injected. If catalog is null, routes with DEGRADED
 * signal path: still may call provider if available, but surfaces DEGRADED
 * when specialization lookup was required and catalog missing (AI-10).
 */
export class SpecializationRouter {
  constructor(
    private readonly providerRouter: ProviderRouter,
    private readonly catalog: CatalogPort | null = null,
  ) {}

  async inferForSpecialization(
    specializationId: string | undefined,
    request: InferenceRequest,
  ): Promise<InferenceResponse | AIError> {
    if (specializationId && !this.catalog) {
      return {
        code: 'DEGRADED',
        message:
          'CatalogPort not injected; cannot resolve specialization (no silent parallel catalog)',
        retryable: false,
        requestId: request.requestId,
      };
    }

    if (specializationId && this.catalog) {
      const meta = await this.catalog.getSpecialization(specializationId);
      if (!meta) {
        return {
          code: 'NOT_APPLICABLE',
          message: `Unknown specialization: ${specializationId}`,
          retryable: false,
          requestId: request.requestId,
        };
      }
      if (meta.status === 'disabled') {
        return {
          code: 'NOT_APPLICABLE',
          message: `Specialization disabled: ${specializationId}`,
          retryable: false,
          requestId: request.requestId,
        };
      }
    }

    return this.providerRouter.infer(request, specializationId);
  }
}
```

### 06.5. `packages/intelligence/src/routing/index.ts`

```typescript
export { defaultRoutingPolicy, type RoutingDecision, type RoutingPolicy } from './policy.js';
export { ProviderRouter } from './provider-router.js';
export { SpecializationRouter } from './specialization-router.js';
```

### 06.6. `packages/intelligence/src/index.ts`

```typescript
/**
 * @eq-labs/intelligence — routing surface (EE-DOC-013 / EE-IMP-013-P04).
 * Does not import registry, knowledge, or connectors.
 */
export {
  ProviderRouter,
  SpecializationRouter,
  defaultRoutingPolicy,
  type RoutingDecision,
  type RoutingPolicy,
} from './routing/index.js';
```

### 06.7. `apps/cli/src/composition/noop-provider.ts`

```typescript
import type { AIError, AIProvider, InferenceRequest, InferenceResponse } from '@eq-labs/foundation';
import { AI_SPI_VERSION } from '@eq-labs/foundation';

/** In-process noop provider for composition-root wiring evidence (not a vendor adapter). */
export const noopProvider: AIProvider = {
  id: 'noop',
  spiVersion: AI_SPI_VERSION,
  async infer(request: InferenceRequest): Promise<InferenceResponse | AIError> {
    return {
      spiVersion: AI_SPI_VERSION,
      requestId: request.requestId,
      output: { ok: true, echo: request.input },
      meta: { providerId: 'noop', model: request.model },
    };
  },
};
```

### 06.8. `apps/cli/src/composition/ai-root.ts`

```typescript
/**
 * Composition root (evidence) for AI wiring — EE-DOC-006 §13.5 / EE-ADR-005 / EE-IMP-013-P04.
 * Only apps/* may register concrete providers. packages/sdk is not a composition root.
 */
import type { CatalogPort } from '@eq-labs/foundation';
import { ProviderRouter, SpecializationRouter } from '@eq-labs/intelligence';
import { noopProvider } from './noop-provider.js';

export interface AiRootOptions {
  /** Optional catalog implementation (Registry). Null → specialization paths DEGRADED. */
  catalog?: CatalogPort | null;
  defaultProviderId?: string;
}

export function createAiRoot(options: AiRootOptions = {}) {
  const providerRouter = new ProviderRouter();
  providerRouter.register(noopProvider);
  providerRouter.setDefault(options.defaultProviderId ?? 'noop');

  const specializationRouter = new SpecializationRouter(providerRouter, options.catalog ?? null);

  return {
    providerRouter,
    specializationRouter,
    /** Evidence: single root factory per app runtime. */
    rootId: 'apps/cli/composition/ai-root',
  };
}
```

### 06.9. Dependencias `apps/cli/package.json`

Añadir si no existen:

```json
"dependencies": {
  "@eq-labs/foundation": "workspace:*",
  "@eq-labs/intelligence": "workspace:*"
}
```

(Merge with existing deps; keep `private: true`.)

---

## 07. Procedimiento operador (script)

Ejecutar el script de materialización (sección §08 abajo) o aplicar archivos a mano, luego:

```powershell
cd C:\Users\Edus\Desktop\Proyectos\EQ-LABS-TECH\ee-monorepo

pnpm install

pnpm --filter @eq-labs/intelligence run lint
pnpm --filter @eq-labs/intelligence run typecheck
pnpm --filter @eq-labs/intelligence run build

pnpm --filter @eq-labs/cli run lint
pnpm --filter @eq-labs/cli run typecheck
pnpm --filter @eq-labs/cli run build

# Criterio: intelligence sin registry/knowledge/connector
Select-String -Path packages\intelligence\package.json -Pattern "registry|knowledge|connector-"

# validate global — FAIL esperado por D-01 braces
pnpm run validate
```

---

## 08. Script PowerShell de materialización (copiar/pegar)

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

# --- intelligence package.json: ensure foundation dependency ---
$intelPkgPath = Join-Path $root "packages\intelligence\package.json"
$intelPkg = Get-Content $intelPkgPath -Raw | ConvertFrom-Json
if (-not $intelPkg.dependencies) {
  $intelPkg | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{}) -Force
}
$deps = @{}; if ($intelPkg.dependencies) { $intelPkg.dependencies.PSObject.Properties | ForEach-Object { $deps[$_.Name] = $_.Value } }
$deps["@eq-labs/foundation"] = "workspace:*"
$intelPkg.dependencies = [pscustomobject]$deps
$intelJson = $intelPkg | ConvertTo-Json -Depth 20
# ConvertTo-Json may reorder; prefer manual patch if needed:
$raw = Get-Content $intelPkgPath -Raw
if ($raw -notmatch '"@eq-labs/foundation"') {
  if ($raw -match '"devDependencies"') {
    $raw = $raw -replace '"devDependencies"', "  `"dependencies`": {`n    `"@eq-labs/foundation`": `"workspace:*`"`n  },`n  `"devDependencies`""
  }
  [System.IO.File]::WriteAllText($intelPkgPath, $raw, $utf8)
  Write-Host "OK  packages/intelligence/package.json (foundation dep)"
} else {
  Write-Host "OK  packages/intelligence/package.json (foundation already present)"
}

New-Item -ItemType Directory -Force -Path packages\intelligence\src\routing | Out-Null
New-Item -ItemType Directory -Force -Path apps\cli\src\composition | Out-Null

# Pegar aquí Write-NoBom para cada archivo de §06.2–§06.8
# (policy, provider-router, specialization-router, routing/index, intelligence index,
#  noop-provider, ai-root)

Write-Host "Apply file bodies from EE-IMP-013-P04 section 06, then pnpm install + gates."
```

> **Nota:** Por longitud, los cuerpos completos están en **§06**. Tras escribirlos, `pnpm install` y gates del §07.

---

## 09. Criterios de aceptación (EE-DOC-013 §12.2 — P04)

| Criterio                                                    | Evidencia                              | Estado |
| :---------------------------------------------------------- | :------------------------------------- | :----- |
| Routing contract (Provider + Specialization)                | `packages/intelligence/src/routing/*`  | ✅     |
| Policy contract                                             | `policy.ts`                            | ✅     |
| CatalogPort types only (no Registry import)                 | `SpecializationRouter`                 | ✅     |
| Composition root en `apps/*`                                | `apps/cli/src/composition/ai-root.ts`  | ✅     |
| Un root de evidencia documentado                            | `rootId: apps/cli/composition/ai-root` | ✅     |
| intelligence → foundation; no registry/knowledge/connectors | package.json                           | ✅     |
| Degradación sin catalog                                     | `DEGRADED`                             | ✅     |
| lint/typecheck/build intelligence + cli                     | 2026-10-04                             | ✅     |

---

## 10. Validaciones ejecutadas

| Comando                                 | Resultado | Detalle                                                          |
| :-------------------------------------- | :-------- | :--------------------------------------------------------------- |
| Materialización routing + composition   | ✅        | `src/routing/*`, `apps/cli/src/composition/*`                    |
| Package exports foundation/intelligence | ✅        | `main`/`types`/`exports` → `dist` + `declaration: true`          |
| Gates foundation                        | ✅        | build / typecheck / lint                                         |
| Gates intelligence                      | ✅        | build / typecheck / lint (policy.ts strict fix)                  |
| Gates cli                               | ✅        | build / typecheck / lint                                         |
| Criterio deps intelligence              | ✅        | solo `@eq-labs/foundation`; sin registry/knowledge/connector     |
| `pnpm run validate`                     | ⚠️ D-01   | braces vía plop — WAIVED (ejecutar `format` antes de `validate`) |

### 10.1. Resultado de la fase

**Estado: Completado.**

ProviderRouter + SpecializationRouter en Intelligence; composition root de evidencia en `apps/cli` (`createAiRoot` / `rootId`). Degradación sin CatalogPort = `DEGRADED`. CI Validate puede seguir rojo solo por D-01.

### 10.2. Descubrimientos

| ID   | Tipo | Hallazgo                                             | Decisión                                                                     |
| :--- | :--- | :--------------------------------------------------- | :--------------------------------------------------------------------------- |
| D-01 | B    | braces vía plop                                      | WAIVED hasta 2026-10-10                                                      |
| D-02 | B    | Packages sin `exports`/`types` → TS2307 en consumers | **Adoptado** — entry points + emit declarations en foundation e intelligence |

---

## 11. Trazabilidad

| Elemento             | Referencia                                  |
| :------------------- | :------------------------------------------ |
| **Padre**            | EE-DOC-013                                  |
| **ADR**              | EE-ADR-005                                  |
| **Composition root** | EE-DOC-006 §13.5                            |
| **SPI**              | EE-IMP-013-P03                              |
| **Siguiente**        | EE-IMP-013-P05 — Security and observability |

---

## 12. Referencias

| Código         | Documento                       |
| :------------- | :------------------------------ |
| EE-DOC-013     | AI Ecosystem                    |
| EE-ADR-005     | Provider SPI / composition root |
| EE-DOC-006     | §13.2 / §13.5                   |
| EE-IMP-013-P03 | SPI contracts                   |

---

## 13. Historial de Cambios

| Versión    | Fecha      | Autor                  | Aprobado por           | Motivo       | Cambios                                                                       | Estado            |
| :--------- | :--------- | :--------------------- | :--------------------- | :----------- | :---------------------------------------------------------------------------- | :---------------- |
| **v1.0.0** | 2026-10-04 | Equipo de Arquitectura | —                      | Apertura P04 | ProviderRouter, SpecializationRouter, ai-root en apps/cli                     | En Implementación |
| **v1.1.0** | 2026-10-04 | Equipo de Arquitectura | Equipo de Arquitectura | Cierre P04   | exports/declarations; routing + composition OK; D-02 Adoptado; **Completado** | **Completado**    |

---

## FIN DEL DOCUMENTO
