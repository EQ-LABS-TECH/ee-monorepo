# Engineering Ecosystem Scripts

This directory contains the automation entry points for the EQ-LABS Engineering Ecosystem repository.

## Purpose

The scripts provide stable repository-level commands for common engineering operations.

The scripts expose the repository command interface while delegating implementation to the appropriate repository tools.

## Architecture

The Engineering Ecosystem separates package management from workspace task orchestration.

### Package Management

**pnpm** is the official package manager.

pnpm is responsible for:

- dependency installation;
- workspace management;
- package resolution;
- package execution;
- package publication;
- package-related operations.

### Workspace Task Orchestration

**Turbo** is the official workspace task orchestrator.

Turbo is responsible for:

- workspace task execution;
- task dependency graphs;
- task ordering;
- parallel execution;
- task caching;
- incremental execution.

The architectural decision is defined by **ADR-001 — Estrategia de Orquestación de Tareas del Workspace**.

## Repository-level Commands

Normative contract: **EE-DOC-011 — Automation**. This README is operational
documentation derived from that contract — not an independent source of truth.

| Command            | Implementation      | Category | Responsibility                                       |
| ------------------ | ------------------- | -------- | ---------------------------------------------------- |
| `bootstrap`        | `scripts/bootstrap` | A-ROOT   | Environment setup                                    |
| `build`            | `scripts/build`     | A-ROOT   | Workspace build (QG-BUILD-001)                       |
| `dev`              | `scripts/dev`       | A-ROOT   | Local development (long-running)                     |
| `test`             | `scripts/test`      | A-ROOT   | Orchestrated tests (QG-TEST-001)                     |
| `lint`             | `scripts/lint`      | A-ROOT   | Lint (QG-LINT-001)                                   |
| `format`           | `scripts/format`    | A-ROOT   | Prettier **write** (local tool; not the format gate) |
| `typecheck`        | `scripts/typecheck` | A-ROOT   | Typecheck (QG-TYPE-001)                              |
| `validate`         | `scripts/validate`  | A-ROOT   | Local validation aggregator (EE-DOC-010)             |
| `doctor`           | `scripts/doctor`    | A-ROOT   | Environment diagnostics (does not replace validate)  |
| `generate`         | `scripts/generate`  | A-GEN    | Scaffolding (Plop)                                   |
| `release`          | `scripts/release`   | A-REL    | Monorepo release orchestration                       |
| `clean`            | `scripts/clean`     | A-ROOT   | Clean build artifacts / caches                       |
| `changeset`        | `@changesets/cli`   | A-REL    | Declare SemVer changes (no file under `scripts/`)    |
| `version-packages` | `changeset version` | A-REL    | Apply package versions (no file under `scripts/`)    |

### Format write vs check

- `pnpm run format` rewrites files (local convenience).
- The format **Quality Gate** uses check mode inside `pnpm run validate`
  (EE-DOC-010 / EE-DOC-011). CI must not rely on write-only format as a gate.

### Auxiliary files

| File                 | Role                                                        |
| -------------------- | ----------------------------------------------------------- |
| `configure-lint.mjs` | Tooling helper — **not** a root command in EE-DOC-011 §04.2 |

## Prospective Dependencies

The root `package.json` may declare dependencies that are not currently used by any script but are retained for planned implementation.

These dependencies are intentionally preserved to maintain consistency and avoid reintroducing the same tooling decisions during future phases.

### Rationale

Declaring a dependency before it is actively used allows:

- The dependency version to be centralized in the monorepo.
- The version to be aligned with peer requirements from other tools.
- The dependency to be installed and validated through the standard `pnpm install` flow.
- Future implementation phases to adopt the tool without altering the root dependency contract.

### Current Prospective Dependencies

| Dependency | Purpose                                                                    | Expected Adoption                                |
| :--------- | :------------------------------------------------------------------------- | :----------------------------------------------- |
| `rimraf`   | Cross-platform directory cleanup for future root-level `clean` operations. | When root-level cleanup scripts are implemented. |

### Rules

| Rule | Description                                                                                               |
| :--: | :-------------------------------------------------------------------------------------------------------- |
|  R1  | Prospective dependencies must be declared with exact versions.                                            |
|  R2  | Prospective dependencies must have a documented purpose and expected adoption phase.                      |
|  R3  | Prospective dependencies must not be referenced by any script until their adoption phase.                 |
|  R4  | Once adopted, the dependency must be removed from this section.                                           |
|  R5  | Prospective dependencies are subject to the same security and versioning policies as active dependencies. |

## Publication Policy

The Engineering Ecosystem currently uses public package publication.
Package publication is controlled by the package metadata and the Changesets configuration.
A package is eligible for publication only when its package metadata and repository release policy permit publication.
Private workspaces are not considered public distribution artifacts.
The release process must not infer publication intent from workspace membership alone.
The following properties must be evaluated before publication:

- package `private` status;
- package version;
- Changesets release state;
- configured package registry;
- authentication state;
- publication access policy.

The current Changesets access policy is `public`.
The release process must preserve this policy until a formal architecture or release-policy decision changes it.
Changing package visibility or registry distribution policy is a cross-cutting release-policy change and must be reviewed by the Architecture Team before implementation.

## Release Versioning Policy

The Engineering Ecosystem is versioned as a single release unit.
The root `package.json` `version` field is the canonical version of the Engineering Ecosystem.
Workspace packages maintain their own package versions for npm publication and are versioned by Changesets according to the changes included in each release.
The release process synchronizes the canonical Engineering Ecosystem version explicitly with the Changesets release plan.
The Engineering Ecosystem release tag follows the format:

```text
vX.Y.Z
```

The release tag is generated exclusively from the canonical root version.
The root version and workspace package versions therefore have different responsibilities:

| Element                     | Responsibility                                        |
| :-------------------------- | :---------------------------------------------------- |
| Root `package.json` version | Canonical Engineering Ecosystem version               |
| Workspace package version   | Individual npm package version                        |
| Changesets                  | Determines workspace package releases                 |
| `scripts/release`           | Synchronizes the EE version and creates the release   |
| Git tag                     | Identifies the complete Engineering Ecosystem release |

A workspace package does not need to have the same version as the Engineering Ecosystem release version.
Private workspaces remain excluded from public npm distribution.

## Workspace Commands

These commands use Turbo as the workspace task orchestrator:

| Command     | Implementation        | Responsibility            |
| ----------- | --------------------- | ------------------------- |
| `build`     | `turbo run build`     | Build all workspaces      |
| `test`      | `turbo run test`      | Run tests                 |
| `lint`      | `turbo run lint`      | Lint all workspaces       |
| `typecheck` | `turbo run typecheck` | Type checking             |
| `dev`       | `turbo run dev`       | Development mode          |
| `clean`     | `turbo run clean`     | Clean workspace artifacts |

Each workspace must define the corresponding task in its `package.json` when that workspace participates in the task.

## Usage

The scripts are exposed through the root package commands:

```bash
pnpm bootstrap
pnpm build
pnpm dev
pnpm test
pnpm lint
pnpm format
pnpm typecheck
pnpm validate
pnpm doctor
pnpm generate
pnpm release
pnpm clean
```

## Task Orchestration Model

The repository follows this execution model:

```text
          Root command
               ↓
        Repository script
               ↓
┌─────────────────────────────┐
│                             │
│      Workspace task?        │
│                             │
└──────────────┬──────────────┘
               │
              Yes
               │
               ▼
             Turbo
               │
               ▼
       Workspace task graph
               │
               ▼
        Workspace scripts
```

Package-management operations use pnpm directly:

```text
Root command
    ↓
Repository script
    ↓
pnpm
    ↓
Package operation
```

## Stability Contract

The names and responsibilities of the existing root scripts are stable interfaces of the Engineering Ecosystem.
Existing scripts must not be modified in an incompatible manner.
New scripts may be introduced only in a backward-compatible manner and must not change the established behavior of existing commands.
Changing the task orchestration architecture requires the appropriate governance mechanism.

## Governance

The workspace task orchestration strategy is defined by:

ADR-001 — Estrategia de Orquestación de Tareas del Workspace
Changes to that architectural decision require review by the Engineering Ecosystem Architecture Team.
Significant or cross-cutting changes must comply with the Engineering Ecosystem governance and change-management process.

## Generation registry (EE-IMP-012-P05)

| Item            | Value                                             |
| --------------- | ------------------------------------------------- |
| Registry        | `scripts/plopfile.mjs`                            |
| Command         | `pnpm run generate`                               |
| Non-interactive | `pnpm run generate -- <generator> --name <value>` |

Examples:

`powershell
pnpm run generate -- app-node --name sample-app
pnpm run generate -- connector-typescript --name sample-conn
`

Missing registry ⇒ exit code ≠ 0 (No False Pass). Do not commit sample trees.
