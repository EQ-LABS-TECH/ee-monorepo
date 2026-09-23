# @eq-labs/connector-kubernetes

Official Kubernetes connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This connector provides the official integration boundary between the
Engineering Ecosystem and Kubernetes.

It is intended to become the controlled integration point for Kubernetes
clusters, namespaces, workloads, deployments, services, configuration
resources, and other supported Kubernetes resources.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official connector workspace and
its TypeScript configuration.

No Kubernetes API integration or cluster operation is implemented at this
stage.

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
