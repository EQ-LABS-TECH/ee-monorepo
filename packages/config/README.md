# @eq-labs/config

Shared configuration package for the Engineering Ecosystem.

This package provides the centralized configuration used by the Engineering Ecosystem workspaces.

---

## Purpose

`@eq-labs/config` is the single source of truth for shared development configurations across the monorepo.

The package centralizes configuration for:

- TypeScript
- ESLint
- Prettier
- Vite
- Jest
- Vitest
- Playwright

Workspace-specific configuration must extend or consume the shared configuration provided by this package whenever applicable.

---

## Structure

```text
packages/config/
├── package.json
├── README.md
│
├── typescript/
├── eslint/
├── prettier/
├── vite/
├── jest/
├── vitest/
└── playwright/
```

---

## Public Configuration Paths

Configurations are exposed through independent packages:

```text
@eq-labs/config
@eq-labs/config-typescript
@eq-labs/config-eslint
@eq-labs/config-prettier
@eq-labs/config-vite
@eq-labs/config-jest
@eq-labs/config-vitest
@eq-labs/config-playwright
```

Consumers must use these public package paths instead of referencing internal filesystem paths.

---

## Testing Configuration

The Engineering Ecosystem separates testing responsibilities by purpose:

| Tool           | Responsibility                            |
| :------------- | :---------------------------------------- |
| **Vitest**     | Unit, integration and component testing   |
| **Playwright** | End-to-end and browser testing            |
| **Jest**       | Legacy and explicitly approved exceptions |

The authoritative architectural decision is defined by:

`EE-ADR-002 — Testing Standard`

---

## Source of Truth

`packages/config/` is the centralized source of truth for shared configuration.

Configuration duplication across individual workspaces should be avoided.

A workspace may define local configuration only when the requirement is specific to that workspace and cannot reasonably be provided by the shared configuration.

---

## Package Scope

This package belongs to the Engineering Ecosystem repository:

```text
EQ-LABS-TECH
└── ee-monorepo
    └── packages/
        └── config/
```

The package namespace is:

```text
@eq-labs/config
```

This package is not part of the EUM product repository.

---

## Architecture

The package contains configuration definitions only.

It must not contain:

- Business logic
- Domain logic
- Application logic
- Infrastructure services
- Product-specific configuration
- Environment-specific secrets

---

## Changes

Changes to shared configuration can affect multiple workspaces.

Changes therefore require review according to the Engineering Ecosystem governance process.

In particular, changes to shared testing configuration must remain aligned with:

`EE-ADR-002 — Testing Standard`

---

## Development

Install repository dependencies from the monorepo root:

```bash
pnpm install
```

Validation and other repository-wide commands must be executed according to the root workspace configuration.
