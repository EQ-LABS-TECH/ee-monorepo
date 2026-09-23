# @eq-labs/connector-a2a

Official A2A connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This package establishes the official connector boundary for the Agent2Agent
(A2A) protocol within the EQ-LABS Engineering Ecosystem.

The connector is intended to provide the governed integration layer required
for communication and interoperability between autonomous agents and
agent-based services.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official A2A connector workspace,
its TypeScript configuration, and its package entry point.

No A2A protocol implementation, agent discovery mechanism, message transport,
authentication mechanism, task lifecycle, or external agent integration is
implemented at this stage.

## Architecture

The connector belongs to the official connector layer:

`connectors/official/a2a`

It is intentionally separated from the internal integration package:

`@eq-labs/integration`

The connector represents the external A2A protocol boundary, while the
internal integration package provides reusable integration abstractions for
the Engineering Ecosystem.

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
