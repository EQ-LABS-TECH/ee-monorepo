# @eq-labs/connector-notebooklm

Official NotebookLM connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This connector provides the official integration boundary between the
Engineering Ecosystem and NotebookLM.

It is intended to become the controlled integration point for NotebookLM
knowledge sources, synchronization processes, document references, and other
supported knowledge workflows.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official connector workspace and
its TypeScript configuration.

No NotebookLM synchronization or external integration is implemented at this
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
