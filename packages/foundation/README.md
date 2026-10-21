# @eq-labs/foundation

Foundational package of the EQ-LABS Engineering Ecosystem.

## Purpose

This package provides the foundational layer for shared building blocks and
contracts required by other packages in the ecosystem.

## Current Status

This package was created during Phase 4 — Packages.
The package includes foundational contracts and ports:

- AI Provider SPI (from EE-DOC-013, EE-ADR-005)
- Catalog port
- Knowledge Port (from EE-DOC-014)

## Configuration

The package uses the shared Node.js TypeScript configuration:

`@eq-labs/config-typescript/node`

## Development

```bash
pnpm build
pnpm typecheck
```
