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

The architectural decision is defined by **ADR-001 — Workspace Task Orchestration Strategy**.

## Repository-level Commands

Normative contract: **EE-DOC-011 — Automation**. This README is operational
documentation derived from that contract — not an independent source of truth.

| Command            | Implementation               | Category | Responsibility                                       |
| ------------------ | ---------------------------- | -------- | ---------------------------------------------------- |
| `bootstrap`        | `scripts/commands/bootstrap` | A-ROOT   | Environment setup                                    |
| `build`            | `scripts/commands/build`     | A-ROOT   | Workspace build (QG-BUILD-001)                       |
| `dev`              | `scripts/commands/dev`       | A-ROOT   | Local development (long-running)                     |
| `test`             | `scripts/commands/test`      | A-ROOT   | Orchestrated tests (QG-TEST-001)                     |
| `lint`             | `scripts/commands/lint`      | A-ROOT   | Lint (QG-LINT-001)                                   |
| `format`           | `scripts/commands/format`    | A-ROOT   | Prettier **write** (local tool; not the format gate) |
| `typecheck`        | `scripts/commands/typecheck` | A-ROOT   | Typecheck (QG-TYPE-001)                              |
| `validate`         | `scripts/commands/validate`  | A-ROOT   | Local validation aggregator (EE-DOC-010)             |
| `doctor`           | `scripts/commands/doctor`    | A-ROOT   | Environment diagnostics (does not replace validate)  |
| `generate`         | `scripts/commands/generate`  | A-GEN    | Scaffolding (Plop)                                   |
| `e2e`              | `scripts/commands/e2e`       | A-ROOT   | End-to-end tests (Playwright)                        |
| `release`          | `scripts/commands/release`   | A-REL    | Monorepo release orchestration                       |
| `clean`            | `scripts/commands/clean`     | A-ROOT   | Clean build artifacts / caches                       |
| `changeset`        | `@changesets/cli`            | A-REL    | Declare SemVer changes (no file under `scripts/`)    |
| `version-packages` | `changeset version`          | A-REL    | Apply package versions (no file under `scripts/`)    |

### Release workflow

The canonical release command supports two explicit modes:

- `pnpm run release -- prepare`: run locally from a clean `main`/`master` checkout with merged Changesets. It creates a `release/vX.Y.Z` branch, applies Changesets versioning, synchronizes the root version, runs validation and build, and commits only identified release changes. The operator pushes the branch and opens a PR using the normal GitHub review process.
- `pnpm run release -- publish`: post-merge operation. It must run on `main`/`master`, verifies the working tree is clean, runs validation and build, checks workspace package privacy and exact-version registry state, publishes missing eligible versions, and creates the annotated release tag last.

The `.github/workflows/release.yml` workflow invokes `publish` after a push to `main` when the root package version changes. It pushes the tag only after the command succeeds.

### Release integrity and provenance

Release preparation records a normalized manifest containing the canonical release version, the source base commit, Changeset IDs, the effective release plan, and the workspace package inventory.  
Publication validates this manifest and independently reconstructs the effective Changesets plan from the recorded base commit in an isolated Git worktree.  
Reconstruction uses frozen, offline dependency installation. The CI workflow may prepare the historical dependency cache before the publication command runs.  
A reconstruction failure, source mismatch, unexpected release, registry error, or conflicting tag prevents publication.

### Publication safety

The publication command requires a clean Git working tree before starting.  
Validation executes `pnpm format` in write mode as its first step.  
Consequently, publication performs another clean-working-tree check after validation and build, before querying the npm registry or publishing any package.  
If validation or build modifies tracked files or produces untracked files, publication stops. Review and commit the changes through the normal development process; do not bypass the check.  
Only public packages explicitly included in the verified release plan may be published. Existing exact package versions are not republished.  
The current implementation requires at least one planned public package release. An all-private release plan is rejected; it does not create a tag.  
The release tag is created only after the required public versions have been verified in npm.

### Recovery and authentication

A release tag pointing to another commit is a hard error.  
If the remote tag already points to the expected commit, the recovery path verifies the planned public package versions before treating the release as complete.  
Failures must not trigger automatic repetition of Changesets versioning.  
The current GitHub workflow supplies `NODE_AUTH_TOKEN` using the `NPM_TOKEN` repository secret.  
The current publication command requires `NODE_AUTH_TOKEN` or `NPM_TOKEN` before publishing a missing package version.  
OIDC/Trusted Publishing is not yet established as a verified alternative by this implementation. It requires a separately approved
and validated authentication configuration.

### Format write vs check

- `pnpm format` runs Prettier in write mode, lists modified files, and reports processed, modified, and unchanged file counts.
- `pnpm validate` runs `pnpm format` first, then the remaining Quality Gates, including a final Prettier check.
- The format check verifies the final state; it does not replace the initial automatic formatting step.
- Release publication requires a clean working tree again after validation and build, preventing automatic formatting changes from reaching publication without review.

### Auxiliary files

The command implementations live under `scripts/commands/`; shared helpers and
regression tests are kept in `scripts/lib/` and `scripts/tests/`, respectively.

### PR Governance Inspector (PN-017)

The PR governance inspector is a read-only, advisory capability governed by
EE-DOC-005, EE-DOC-007, and RFC-003 §02.8.

Implementation:

- `scripts/commands/governance`: advisory command entry point.
- `scripts/lib/pr-governance.classification.mjs`: conservative critical-change indicators.
- `scripts/lib/pr-governance.evidence.mjs`: GitHub PR, review, permission, and team-membership evidence.
- `scripts/lib/pr-governance.approvals.mjs`: approval thresholds and reviewer-eligibility evidence.
- `scripts/lib/pr-governance.inspect.mjs`: advisory report composition.
- `scripts/tests/pr-governance.*.test.mjs`: regression and integration tests.

The inspector identifies `CRITICAL` changes through conservative path indicators.
When no critical indicators are detected, classification remains `PENDING_REVIEW`;
absence of indicators does not establish `ORDINARY`.

Explicit `EE-LABS-IMPACT: ORDINARY` declarations are collected only from current,
independent approvals associated with the observed PR HEAD. Repository permissions
are checked for ordinary-classification candidates. Team membership can be queried,
but authoritative ownership and classification are not yet integrated.

The inspector performs consistency checks on PR identity, HEAD, changed files,
and review evidence. These checks do not provide an atomic snapshot or guarantee
that approvals remain valid until merge.

The `PR Governance Advisory` job in `.github/workflows/ci.yml` runs for eligible
same-repository pull requests and observes review submission, editing, and
dismissal events. It checks out trusted implementation from `main` and uses
read-only permissions.

Reports retain `mode: ADVISORY` and `status: PENDING`. Ordinary-classification
evidence remains `UNVERIFIED`. A successful advisory job is not merge authorization.

Mandatory enforcement remains pending: approved classification authority,
trusted ownership and membership evidence, suitable credentials, current
required-check semantics, and operational validation in GitHub.

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
pnpm run release -- prepare
pnpm run release -- publish
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

ADR-001 — Estrategia de Orquestación de Tareas del Workspace.
Changes to that architectural decision require review by the Engineering Ecosystem Architecture Team.  
Significant or cross-cutting changes must comply with the Engineering Ecosystem governance and change-management process.

## Generation registry (EE-IMP-012-P05)

| Item            | Value                                             |
| --------------- | ------------------------------------------------- |
| Registry        | `scripts/plopfile.mjs`                            |
| Command         | `pnpm run generate`                               |
| Non-interactive | `pnpm run generate -- <generator> --name <value>` |

Examples:

```bash
pnpm run generate -- app-node sample-app
pnpm run generate -- connector-typescript sample-conn
```

Missing registry ⇒ exit code ≠ 0 (No False Pass). Do not commit sample trees.

## E2E orchestration

The root command `pnpm run e2e` runs the `test:e2e` task for `@eq-labs/dashboard`. The root command `pnpm run validate` includes E2E as a critical gate, and CI invokes `validate`.

The reported local validation passed `QG-TEST-E2E` with one Dashboard test. The gate is integrated, but multi-package E2E orchestration and coverage remain pending implementation and evidence.

Use the following Turbo command to inspect the Dashboard suite directly:

```bash
pnpm exec turbo run test:e2e --filter=@eq-labs/dashboard
```

The `test:e2e` task sets `cache: false` and depends on the upstream builds declared in Turbo. This evidence does not establish E2E coverage for other workspaces. Gate availability is governed by EE-DOC-010; CI composition is governed by EE-DOC-007.

The typecheck, lint, test, build, and Dashboard E2E wrappers classify a successful Turbo exit with zero executed tasks as `SKIPPED`, not `PASS`, and return a non-zero status so the root `validate` aggregator fails the critical gate. The script-test runner fails if `scripts/tests/` contains no `*.test.mjs` files.

## Windows: Vitest and %TEMP%

`@eq-labs/knowledge` uses Vitest. On Windows, Vitest workers create subdirectories under `%TEMP%`, which is frequently blocked by antivirus or restricted permissions (`EPERM`).

`scripts/commands/test` redirects `TMP`/`TEMP`/`TMPDIR` to `<root>/.tmp/vitest` before invoking Turbo, and `turbo.json` declares `globalPassThroughEnv` so Turbo propagates them to each task.

**Consequences:**

- `pnpm test` uses the repository-local temporary directory to reduce Windows worker permission failures.
- `pnpm run validate` invokes the test wrapper and therefore benefits from the same mitigation during test execution.
- Running `pnpm exec turbo run test` directly bypasses this mitigation and may encounter `EPERM` when the system temporary directory is restricted. Use `pnpm test` for the supported repository-level test entrypoint.

This mitigation does not guarantee successful execution under every Windows environment or security configuration.

## Release safety

Release preparation and publication are separate operations.

`pnpm run release -- prepare` requires a clean working tree, applies Changesets versioning, synchronizes the canonical root version, verifies the release manifest, runs validation and build, and commits the prepared changes on a dedicated release branch. It does not use `git add .` or create the final release tag.

`pnpm run release -- publish` runs after the release PR is merged. It verifies the release manifest, independently reconstructs the Changesets plan, checks applicable Quality Gates and build requirements, and reconciles npm registry and Git tag state before performing publication operations.

The annotated release tag is created only after the required public package versions have been verified in npm. The GitHub release workflow subsequently pushes the tag and verifies its remote target.

If publication fails, inspect the release manifest, working tree, npm registry versions, and local and remote tag state before retrying. Do not repeat Changesets versioning blindly or overwrite conflicting remote state.
