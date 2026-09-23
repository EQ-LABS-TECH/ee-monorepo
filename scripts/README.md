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

These commands provide stable repository-level interfaces:

| Command     | Implementation       | Responsibility          |
| ----------- | -------------------- | ----------------------- |
| `bootstrap` | `pnpm install`       | Environment setup       |
| `format`    | `prettier --write .` | Code formatting         |
| `validate`  | Multiple checks      | Full validation suite   |
| `doctor`    | System checks        | Environment diagnostics |
| `generate`  | `plop`               | Code generation         |
| `release`   | Changesets + pnpm    | Release management      |

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
