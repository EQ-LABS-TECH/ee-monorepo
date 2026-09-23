# ESLint Configuration

Shared ESLint configurations for the Engineering Ecosystem.

---

## Purpose

This package provides the centralized ESLint configurations used across the Engineering Ecosystem monorepo.

The configurations establish common linting standards while allowing workspaces to consume the appropriate preset for their runtime and language.

---

## Configurations

### Base

```text
@eq-labs/config-eslint/base.mjs
```

Provides the common ESLint configuration for JavaScript-based projects.

The base configuration includes:

- ESLint recommended rules.
- ECMAScript module support.
- Common JavaScript linting rules.
- Repository-wide generated-output exclusions.

The base configuration does not contain TypeScript-specific rules.

---

### TypeScript

```text
@eq-labs/config-eslint/typescript.mjs
```

Provides the TypeScript ESLint configuration.

It extends the base configuration and adds:

- TypeScript ESLint recommended rules.
- TypeScript source file matching.
- TypeScript-specific linting rules.
- Consistent type-only imports.

Note: This configuration does not enable project parsing (parserOptions.projectService). The configured rules are syntactic and do not require TypeScript semantics. If type-aware linting is required in the future, this decision will be reviewed.

---

### Notable Rules

| Rule                   | Level | Justification                                                                                                                                                                                                      |
| :--------------------- | :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-console`           | warn  | Deliberate standard to discourage unintentional console usage in application code. Workspaces where console is a legitimate runtime API (e.g., CLI tools, scripts, infrastructure) may document a local exception. |
| `no-debugger`          | error | Prevents accidental debugger statements in production code.                                                                                                                                                        |
| `no-duplicate-imports` | error | Enforces clean import statements.                                                                                                                                                                                  |
| `no-unused-vars`       | error | Prevents unused variables; `^_` pattern is ignored for intentional placeholders.                                                                                                                                   |

---

## Usage

A JavaScript workspace can consume the base configuration:

```js
import base from "@eq-labs/config-eslint/base";

export default base;
```

A TypeScript workspace can consume the TypeScript configuration:

```js
import typescript from "@eq-labs/config-eslint/typescript";

export default typescript;
```

The consuming workspace may add local rules when required by its specific runtime or application context.

Repository-wide rules must remain centralized in this package.

---

## Configuration Principles

The shared ESLint configurations follow these principles:

1. Common linting rules are defined once.
2. TypeScript-specific rules are isolated from the base configuration.
3. Specialized configurations extend the base configuration instead of duplicating it.
4. Generated artifacts are excluded from linting.
5. Workspace-specific rules remain in the consuming workspace.
6. ESLint configuration must not contain application or business logic.

---

## Flat Config

The Engineering Ecosystem uses ESLint Flat Config.

The repository does not use legacy configuration files such as:

```text
.eslintrc
.eslintrc.js
.eslintrc.json
```

Shared configurations are implemented as ECMAScript modules.

---

## Dependencies

The package uses ESLint 9 and the modern `typescript-eslint` configuration model.

The consuming workspace is responsible for providing the ESLint runtime.

---

## Changes

Changes to shared ESLint configuration can affect multiple workspaces.

Changes should therefore be reviewed according to the Engineering Ecosystem governance process before implementation.

---

## License

Engineering Ecosystem (EE-LABS) is licensed under the Apache License 2.0.

See the repository `LICENSE` file for the complete license text.
