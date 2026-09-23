# Playwright Configuration

Shared Playwright configuration for the Engineering Ecosystem.

---

## Purpose

This package provides the centralized Playwright Test configuration used by Engineering Ecosystem workspaces that implement end-to-end browser testing.

The package establishes the common execution behavior for Playwright while leaving application-specific concerns to the consuming workspace.

---

## Standard

Playwright is the Engineering Ecosystem standard for:

- End-to-End testing.
- Browser testing.
- User-flow validation.
- Application-level integration through a real browser.

Unit, integration, and component testing are handled by the Engineering Ecosystem Vitest configuration and are outside the scope of this package.

---

## Configuration

### Base

`@eq-labs/config-playwright/base`

The base configuration establishes:

- E2E test directory convention.
- E2E test file convention.
- Parallel execution.
- Console reporter.
- Trace collection after retries.
- Screenshots on failure.
- Video retention on failure.

The base configuration is environment-agnostic and does not depend on any Node.js runtime API.

The configuration does not define:

- Application-specific commands.
- Application-specific ports.
- Application-specific baseURL.
- CI-specific behavior (retries, workers, forbidOnly).
- Authentication state.
- Environment secrets.
- Browser matrix.
- Business-specific fixtures.
- Application-specific test data.

Those concerns belong to the consuming workspace or to the corresponding future Engineering Ecosystem standard.

### Usage

A workspace can consume the shared configuration:

```ts
import config from "@eq-labs/config-playwright/base";

export default config;
```

A workspace requiring an application-specific web server and CI-aware behavior can extend the shared configuration:

```ts
import { defineConfig } from "@playwright/test";
import base from "@eq-labs/config-playwright/base";

export default defineConfig({
  ...base,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:5173",
  },

  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

The consuming workspace remains responsible for its own application lifecycle and environment-specific settings.

### Test Directory Convention

The shared configuration uses:

```text
tests/
└── e2e/
    └── *.spec.ts
```

This convention applies to workspaces that adopt the shared Playwright configuration.

### Browser Matrix

The base configuration intentionally does not define a definitive browser matrix.

The Engineering Ecosystem architecture and testing standard reserve browser-matrix decisions for a later controlled definition.

Until that decision is formally established, the default Playwright browser behavior is used.

---

## Architecture

This package belongs to:

```text
packages/
└── config/
    └── playwright/
```

It is part of the centralized configuration layer of the Engineering Ecosystem.

The package contains configuration only. It must not contain:

- Business logic.
- Domain logic.
- Application logic.
- Product-specific behavior.
- Environment secrets.
- Application-specific fixtures.

---

## Responsibilities

**This package is responsible for:**

- Shared Playwright execution defaults.
- E2E test discovery conventions.
- Common failure diagnostics.

**Consuming workspaces are responsible for:**

- Application-specific Playwright configuration.
- Application startup.
- Application-specific webServer.
- CI-specific behavior (retries, workers, forbidOnly).
- Application-specific baseURL.
- Authentication.
- Fixtures.
- Test data.
- Environment configuration.
- Browser-specific extensions required by the workspace.

---

## Workspace-Specific Configuration

The consuming workspace is responsible for configuration that is specific to its application or runtime context.

This includes, but is not limited to:

| Elemento             | Responsabilidad                                        |
| :------------------- | :----------------------------------------------------- |
| **baseURL**          | Definir la URL base de la aplicación bajo prueba.      |
| **webServer**        | Iniciar la aplicación y gestionar su ciclo de vida.    |
| **forbidOnly**       | Decidir si bloquear `.only` según el entorno (ej. CI). |
| **retries**          | Definir el número de reintentos según el entorno.      |
| **workers**          | Definir el número de workers según el entorno.         |
| **projects**         | Configurar la matriz de navegadores.                   |
| **use.storageState** | Definir el estado de autenticación.                    |
| **fixtures**         | Definir fixtures específicas de la aplicación.         |
| **testDir**          | Sobrescribir el directorio E2E cuando sea necesario.   |

**Ejemplo:**

```ts
import { defineConfig } from "@playwright/test";
import base from "@eq-labs/config-playwright/base";

export default defineConfig({
  ...base,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    ...base.use,
    baseURL: "http://127.0.0.1:5173",
  },

  webServer: {
    command: "pnpm dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

> **Nota:** El preset `@eq-labs/config-playwright/base` no utiliza `process.env` ni ninguna API de Node. Las decisiones dependientes del entorno son responsabilidad del workspace consumidor.

---

## Development

Install dependencies from the monorepo root:

```bash
pnpm install
```

Build the configuration package:

```bash
pnpm --filter @eq-labs/config-playwright build
```

Lint the configuration package:

```bash
pnpm --filter @eq-labs/config-playwright lint
```

---

## Governance

Changes to this shared configuration can affect multiple Engineering Ecosystem workspaces. Changes must therefore follow the Engineering Ecosystem governance process.

The architectural testing standard is defined by:

- **EE-ADR-002** — Testing Standard

The repository structure and shared configuration rules are defined by:

- **EE-DOC-006** — Repository Structure

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
