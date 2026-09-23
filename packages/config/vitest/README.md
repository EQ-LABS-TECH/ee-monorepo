# Vitest Configuration

Shared Vitest configurations for the Engineering Ecosystem.

---

## Purpose

This package provides centralized Vitest configurations for workspaces that use Vitest as their test runner.

The package provides a base configuration and a React-specific configuration.

---

## Configurations

### Base

```text
@eq-labs/config-vitest/base
```

Provides the common Vitest configuration for the Engineering Ecosystem.

The base configuration establishes:

- Node.js as the default test environment.
- Automatic mock clearing.
- Automatic mock restoration.
- Test discovery conventions.
- Coverage collection using V8.
- Exclusion of generated artifacts.

---

### React

```text
@eq-labs/config-vitest/react
```

Extends the base configuration and changes the test environment to `jsdom`.

This preset is intended for workspaces that test React components or other code requiring a DOM-like environment.

The preset does not install or configure React Testing Library.

---

## Usage

A workspace using the base configuration can extend it with:

```js
import base from "@eq-labs/config-vitest/base";

export default base;
```

A React workspace can use:

```js
import react from "@eq-labs/config-vitest/react";

export default react;
```

Workspaces may extend the shared configuration with project-specific settings when required.

---

## React Environment

Workspaces consuming the React preset must install `jsdom` as a development dependency.

The shared configuration package does not declare `jsdom` as a dependency or peer dependency.

This keeps environment-specific dependencies under the responsibility of the consuming workspace.

For example:

```bash
pnpm add -D jsdom
```

---

## Testing Libraries

The shared Vitest configuration does not install or configure testing libraries such as:

- `@testing-library/react`
- `@testing-library/jest-dom`

These dependencies are workspace-specific and must be declared by the workspace that uses them.

---

## Test Discovery

The configuration recognizes common test conventions:

```text
__tests__/
*.test.*
*.spec.*
```

Supported JavaScript and TypeScript extensions include:

```text
.js
.jsx
.mjs
.cjs
.ts
.tsx
```

Workspaces that extend the configuration are responsible for adding additional exclusions when required by their own repository structure.

---

## Coverage

Coverage uses the V8 provider. The shared configuration package declares `@vitest/coverage-v8` as a dependency to ensure the provider is available when workspaces use the Vitest configuration.

Coverage is collected from:

```text
src/
```

The following files and directories are excluded from coverage:

```text
__tests__/
*.test.*
*.spec.*
*.d.ts
node_modules/
dist/
build/
coverage/
.turbo/
```

Coverage reports are generated under:

```text
coverage/
```

---

## Test Environment Setup

The shared configuration does not define a global setup file.

Environment-specific initialization is the responsibility of the consuming workspace.

A workspace may extend the configuration with its own setup files when required.

---

## Responsibilities

This package is responsible for shared Vitest configuration.

It does not define:

- application-specific test setup;
- React Testing Library configuration;
- application-specific mocks;
- business logic;
- application architecture;
- deployment configuration.

Those responsibilities belong to the consuming workspace or the appropriate Engineering Ecosystem component.

---

## Changes

Changes to the shared Vitest configuration may affect multiple workspaces.

Changes must therefore be reviewed according to the Engineering Ecosystem governance process before implementation.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
