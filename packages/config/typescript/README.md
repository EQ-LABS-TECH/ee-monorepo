# TypeScript Configuration

Shared TypeScript configurations for the Engineering Ecosystem.

---

## Purpose

This package provides the centralized TypeScript compiler configurations used across the Engineering Ecosystem monorepo.

The configurations establish the common TypeScript standards for packages and applications while allowing environment-specific specialization.

---

## Configurations

### Base

```text
@eq-labs/config-typescript/base.json
```

Provides the common TypeScript configuration for the Engineering Ecosystem.

It defines:

- ECMAScript target
- Module behavior
- Module resolution
- Strict type checking
- Module isolation
- JSON module resolution
- Consistent file casing

The base configuration is environment-agnostic.

---

### Node.js

```text
@eq-labs/config-typescript/node.json
```

Extends the base configuration and provides Node.js-specific module resolution.

Node.js workspaces should extend this configuration when their runtime is Node.js.

---

### React

```text
@eq-labs/config-typescript/react.json
```

Extends the base configuration and provides React-specific JSX support.
It establishes:

- "jsx": "react-jsx"

React workspaces should extend this configuration when they use React and require the modern JSX transform.

---

## Usage

A workspace can extend the shared configuration from its own `tsconfig.json`.

Example for Node.js:

```json
{
  "extends": "@eq-labs/config-typescript/node.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

Example for React.js:

```json
{
  "extends": "@eq-labs/config-typescript/react.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

Workspace-specific compiler options may be added when required by the workspace.

Shared compiler standards must remain centralized in this package.

---

## Configuration Principles

The shared configurations follow these principles:

1. Common compiler rules are defined once.
2. Runtime-specific behavior is defined by specialized configurations.
3. Workspace-specific settings remain in the consuming workspace.
4. Build output configuration is not defined globally.
5. The shared configuration must not contain application or business logic.

---

## Node.js Version

Node.js-specific configurations are aligned with the Node.js LTS version established by the repository `.nvmrc`.

The current repository standard is Node.js 24 LTS.

---

## Package Scope

This configuration belongs to the Engineering Ecosystem repository:

```text
EQ-LABS-TECH
└── ee-monorepo
    └── packages/
        └── config/
            └── typescript/
```

---

## Changes

Changes to shared TypeScript configuration can affect multiple workspaces.

Changes to the shared configuration should therefore be reviewed before implementation according to the Engineering Ecosystem governance process.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
