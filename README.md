# Engineering Ecosystem (EE)

Engineering Ecosystem (EE) is an open-source engineering platform designed to standardize software engineering practices, automation, governance, quality, knowledge management and AI-assisted development.

This repository contains the official implementation of the Engineering Ecosystem monorepo.

---

## Project Status

Current Implementation Phase:

- **Phase 7 — Scripts**

Implemented phases:

- Phase 0 — Initialization
- Phase 1 — Bootstrap
- Phase 2 — Shared Configuration
- Phase 3 — Workspaces
- Phase 4 — Packages
- Phase 5 — Apps
- Phase 6 — Connectors
- Phase 7 — Scripts

Next implementation phases:

- Phase 8 — Assets
- Phase 9 — Docs
- Phase 10 — Data
- Phase 11 — Examples
- Phase 12 — Marketplace

Repository Status:

- 🚧 Under Implementation

---

## Repository Structure

The repository structure is defined by:

- EE-DOC-006 — Repository Structure

The implementation follows the thirteen-phase repository implementation plan defined by EE-DOC-006.

---

## Requirements

- Node.js 22 LTS

> **Official Node.js Version:** The Engineering Ecosystem uses the LTS version specified in the `.nvmrc` file. All contributors should use that version (or a compatible version within the same LTS release) to ensure a consistent development environment.

- PNPM
- Git

---

## Package Manager

This repository uses **PNPM** as the official package manager.

`npm` and `Yarn` are not supported.

For this reason:

- `package-lock.json`
- `yarn.lock`

are intentionally excluded from version control.

For more information, see **EE-DOC-006 — Repository Structure**.

---

## Workspace Task Orchestration

This repository uses **Turborepo** as the official workspace task orchestrator.

Turborepo is responsible for:

- workspace task execution;
- task dependency graphs;
- task ordering;
- parallel execution;
- task caching;
- incremental execution.

PNPM remains responsible for package management and package-level operations.

The task orchestration strategy is defined by:

- ADR-001 — Estrategia de Orquestación de Tareas del Workspace

---

## Quick Start

```bash
pnpm install
pnpm build
pnpm dev
```

---

## Repository Commands

The repository exposes stable root commands for common engineering operations:

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

---

## Testing

The Engineering Ecosystem testing strategy is defined by:

- EE-ADR-002 — Testing Standard

The repository uses:

- **Vitest** for unit, integration and component testing.
- **Playwright** for end-to-end and browser testing.
- **Turborepo** for test task orchestration.
- **Jest** only for legacy or explicitly approved exceptions.

Testing is applied according to the requirements of each workspace and is not forcibly required for workspaces where no applicable test scope exists.

---

## Traceability

This repository is the reference implementation of the Engineering Ecosystem.

The implementation follows the specifications defined in the EE-DOC documentation series.

Any structural change must first be documented and approved in the corresponding EE-DOC before being implemented in this repository.

Architectural decisions are recorded through the applicable ADR or RFC mechanism defined by the Engineering Ecosystem governance.

---

## Documentation

The official documentation of the Engineering Ecosystem is maintained through the EE-DOC documentation series.

The implementation of this repository follows the specifications defined in those documents.

The repository implementation lifecycle is governed by:

- EE-DOC-005 — Development Workflow
- EE-DOC-006 — Repository Structure

---

## License

Engineering Ecosystem (EE) is licensed under the Apache License 2.0.

See the LICENSE file for details.

---
