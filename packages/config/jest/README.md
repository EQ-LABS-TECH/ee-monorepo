# Jest Configuration

Shared Jest configurations for the Engineering Ecosystem.

---

## Purpose

This package provides centralized Jest configurations for workspaces that use Jest as their test runner.

The configuration is divided into a base preset and a TypeScript-compatible preset.

---

## Configurations

### Base

```text
@eq-labs/config-jest/base
```

Provides the common Jest configuration for the Engineering Ecosystem.

It establishes:

- Node.js as the default test environment.
- Automatic mock clearing.
- Automatic mock restoration.
- Test discovery conventions.
- Coverage collection conventions (JavaScript files).
- Generated-directory exclusions.

The base preset does not assume TypeScript, React, a browser environment, or a specific transformation strategy.

Coverage: `collectCoverageFrom` is deliberately configured for JavaScript files (`.js`, `.jsx`, `.mjs`, `.cjs`). The TypeScript preset replaces this pattern with `.ts` and `.tsx`.

---

### TypeScript

```text
@eq-labs/config-jest/typescript
```

Provides the Jest configuration intended for TypeScript workspaces.

It extends the base configuration and adjusts:

- Coverage collection for `.ts` and `.tsx` (replaces JavaScript patterns).
- Test discovery for TypeScript test files.

This preset does **not** define the TypeScript transformation strategy. It does not enable Jest to execute TypeScript files directly.

The transformation mechanism remains the responsibility of the consuming workspace or of a future Engineering Ecosystem testing standard.

---

## Usage

A JavaScript workspace can consume the base configuration:

```js
import config from "@eq-labs/config-jest/base";

export default config;
```

A TypeScript workspace can consume the TypeScript configuration:

```js
import config from "@eq-labs/config-jest/typescript";

export default config;
```

A workspace may extend the shared configuration with project-specific settings when required.

---

## Test Environment Setup

The shared Jest configuration does not define a global test setup file.

Environment-specific initialization is the responsibility of the consuming workspace.

When required, a workspace may provide its own setup file and register it using Jest's `setupFilesAfterEnv` configuration.

For example:

```js
export default {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
```

The shared configuration must remain independent of workspace-specific test initialization.

---

## TypeScript Transformation

The TypeScript preset does not install or select a TypeScript transformation mechanism.

It does not impose a specific implementation such as:

- `ts-jest`;
- Babel;
- SWC;
- esbuild.

The transformation strategy will be defined separately when the Engineering Ecosystem establishes its official testing execution standard.

This separation prevents the shared configuration package from coupling Jest configuration with a particular TypeScript compiler or transformation tool.

---

## Test Discovery

The shared configuration recognizes the following conventions:

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

---

## Coverage

Coverage is collected from the `src/` directory.

Generated artifacts and TypeScript declaration files are excluded where applicable.

Coverage output is written to:

```text
coverage/
```

---

## Responsibilities

This package is responsible for shared Jest configuration.

It does not define:

- application-specific test setup;
- business logic;
- TypeScript compilation;
- application-specific mocks;
- deployment configuration;
- architectural rules.

Those responsibilities belong to the consuming workspace or the appropriate Engineering Ecosystem component.

---

## Changes

Changes to the shared Jest configuration may affect multiple workspaces.

Changes must therefore be reviewed according to the Engineering Ecosystem governance process before implementation.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
