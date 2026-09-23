# @eq-labs/connector-docker

Official Docker connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This connector provides the official integration boundary between the
Engineering Ecosystem and Docker.

It is intended to become the controlled integration point for Docker
containers, images, registries, runtime operations, and other supported
Docker resources.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official connector workspace and
its TypeScript configuration.

No Docker API integration or runtime control is implemented at this stage.

## Configuration

The package uses the shared Node.js TypeScript configuration:

`@eq-labs/config-typescript/node`

## Development

### Typecheck

```bash
pnpm typecheck
```

### Build

```bash
pnpm build
```
