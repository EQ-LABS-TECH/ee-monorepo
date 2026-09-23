# Vite Configuration

Shared Vite configurations for the Engineering Ecosystem.

---

## Purpose

This package provides centralized Vite configurations for workspaces that use Vite as their build and development tool.

The package separates common Vite behavior from configurations specific to libraries and React projects.

---

## Configurations

### Base

```text
@eq-labs/config-vite/base
```

Provides the common Vite configuration.

It establishes:

- Source maps.
- Output directory cleanup.
- Strict development ports.
- Strict preview ports.

The base configuration does not assume a specific framework or package type.

---

### Library

```text
@eq-labs/config-vite/library
```

Extends the base configuration for packages that produce reusable libraries.

It establishes:

- Library entry point at `src/index.ts` (monorepo convention).
- ESM output.
- Source maps.

The configuration does not define dependency externalization automatically.

Note: src/index.ts is the standard Engineering Ecosystem convention for the library entry point. If a workspace requires a different structure, you must extend this configuration and override the entry point locally.

---

### React

```text
@eq-labs/config-vite/react
```

Extends the base configuration for React projects.

It enables the official Vite React plugin (`@vitejs/plugin-react`), which is provided as a dependency of `@eq-labs/config-vite`.

Project-specific settings such as ports, aliases, proxies and output directories remain the responsibility of the consuming workspace.

---

## Usage

A Vite workspace can consume the base configuration:

```js
import config from "@eq-labs/config-vite/base";

export default config;
```

A library workspace can consume the library configuration:

```js
import config from "@eq-labs/config-vite/library";

export default config;
```

A React workspace can consume the React configuration:

```js
import config from "@eq-labs/config-vite/react";

export default config;
```

A workspace may extend the shared configuration with local settings when required by its specific implementation.

---

## Configuration Principles

The shared Vite configurations follow these principles:

1. Common Vite behavior is defined once.
2. Library and React configurations remain separate.
3. Specialized configurations extend the base configuration.
4. Application-specific settings remain in the consuming workspace.
5. Business logic does not belong in Vite configuration.
6. Shared configuration changes must consider their impact across all consuming workspaces.

---

## Responsibilities

This package is responsible for shared Vite configuration.

It does not define:

- Application routing.
- Business logic.
- Environment-specific deployment configuration.
- Application-specific aliases.
- Application-specific proxies.
- Infrastructure configuration.

Those responsibilities belong to the appropriate workspace or infrastructure configuration.

---

## Changes

Changes to the shared Vite configuration may affect multiple packages and applications.

Changes must therefore be reviewed according to the Engineering Ecosystem governance process before implementation.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
