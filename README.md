# Engineering Ecosystem (EE)

Engineering Ecosystem (EE) is an open-source engineering platform designed to standardize software engineering practices, automation, governance, quality, knowledge management and AI-assisted development.

This repository contains the official implementation of the Engineering Ecosystem monorepo.

---

## Project Status

**Current baseline (as-built):** structure and toolchains through **EE-DOC-006** support phases — packages, apps, connectors, root scripts (`scripts/commands/`), shared config, infra, templates, data, assets, examples and marketplace **layouts** are present in the repository.

Implemented (repository structure track):

- Phase 0 — Initialization
- Phase 1 — Bootstrap
- Phase 2 — Shared Configuration
- Phase 3 — Workspaces
- Phase 4 — Packages
- Phase 5 — Apps
- Phase 6 — Connectors
- Phase 7 — Scripts (`scripts/commands/*`, `scripts/lib/`, `scripts/tests/`)
- Phase 8+ layouts — Assets, Data, Examples, Marketplace, Infra, Templates (layout + README; content grows by product phase)

**Documentation (`docs/`) and ecosystem validation** follow the EE-DOC series and EE-DOC-015; keep docs synchronized with `main`.

Repository Status:

- Structure baseline: **available** (see EE-DOC-006)
- Product / domain depth: **evolving** by EE-DOC-007+ and package implementation

---

## Repository Structure

The repository structure is defined by:

- **EE-DOC-006 — Repository Structure**

Canonical root commands live under `scripts/commands/<cmd>` (invoked via `package.json`). Details: EE-DOC-006 §05 / §12.

---

## Requirements

- Node.js 24 LTS

> **Official Node.js Version:** The Engineering Ecosystem uses the LTS version specified in the `.nvmrc` file. All contributors should use that version (or a compatible version within the same LTS release) to ensure a consistent development environment.

- PNPM ≥ 10.16.1
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

- **EE-ADR-001 — Workspace Task Orchestration Strategy**

---

## Quick Start

```bash
pnpm install
pnpm build
pnpm dev
```

---

## Repository Commands

Stable root commands (implementation: `scripts/commands/<cmd>`):

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
pnpm e2e
pnpm release
pnpm clean
```

Also: `pnpm changeset`, `pnpm version-packages` (Changesets CLI).

> **E2E:** `pnpm e2e` is the root entrypoint. Ecosystem-level E2E **gate** enforcement may remain PENDING until EE-DOC-010 / 015 / multi-package orchestration (ADR-002) are fully ACTIVE.

---

## Testing

The Engineering Ecosystem testing strategy is defined by:

- **EE-ADR-002 — Testing Standard**

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

The official documentation of the Engineering Ecosystem is maintained through the EE-DOC documentation series under `docs/` (when present in the working tree).

The repository implementation lifecycle is governed by:

- **EE-DOC-005 — Development Workflow**
- **EE-DOC-006 — Repository Structure**

---

## License

Engineering Ecosystem (EE) is licensed under the Apache License 2.0.

See the LICENSE file for details.
