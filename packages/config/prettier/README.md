# Prettier Configuration

Shared Prettier configuration for the Engineering Ecosystem.

---

## Purpose

This package provides the centralized Prettier configuration used across the Engineering Ecosystem monorepo.

The configuration establishes a consistent formatting standard for source code and supported repository files.

---

## Configuration

The official Prettier configuration is provided through:

```text
@eq-labs/config-prettier
```

The configuration is implemented in:

```text
index.mjs
```

---

## Usage

A workspace can consume the shared configuration from its own Prettier configuration file:

```js
import config from "@eq-labs/config-prettier";

export default config;
```

The workspace must not redefine repository-wide formatting rules locally unless there is a documented and approved reason.

---

## Formatting Standards

The shared configuration establishes:

- Line width of 100 characters.
- Two-space indentation.
- Spaces instead of tabs.
- Semicolons.
- Single quotes.
- Trailing commas where supported.
- Consistent bracket spacing.
- Parenthesized arrow-function parameters.
- LF line endings.

---

## Responsibilities

Prettier is responsible exclusively for code formatting.

It does not define:

- TypeScript compiler rules.
- ESLint rules.
- Architectural constraints.
- Naming conventions.
- Dependency rules.
- Business logic.
- Security policies.

Those responsibilities belong to their respective configuration or governance components.

---

## Repository Consistency

Prettier, `.editorconfig` and `.gitattributes` operate at different layers of the repository configuration:

| Configuration    | Responsibility                         |
| ---------------- | -------------------------------------- |
| `.editorconfig`  | Editor-independent formatting behavior |
| `.gitattributes` | Git file handling and line endings     |
| Prettier         | Source-code formatting                 |

Each layer has a distinct responsibility. Prettier defines the formatting of source code files. `.editorconfig` ensures consistent editor behavior across different IDEs. `.gitattributes` controls Git-specific file handling.

The specific values for each layer are defined in their respective files and are maintained separately.

---

## Changes

Changes to the shared Prettier configuration may affect multiple workspaces.

Changes must therefore be reviewed according to the Engineering Ecosystem governance process before implementation.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
