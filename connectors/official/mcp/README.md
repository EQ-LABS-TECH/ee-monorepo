# @eq-labs/connector-mcp

Official MCP connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This package establishes the official connector boundary for the Model
Context Protocol (MCP) within the EQ-LABS Engineering Ecosystem.

The connector is intended to provide the governed integration layer for MCP
servers and MCP-based context providers used by the Engineering Ecosystem.

The MCP connector may subsequently provide integrations for ecosystem
resources such as filesystem, Git, database, Obsidian, and NotebookLM
context services.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official MCP connector workspace,
its TypeScript configuration, and its package entry point.

No MCP server implementation, transport implementation, tool registration,
resource registration, authentication mechanism, or external service
integration is implemented at this stage.

## Architecture

The connector belongs to the official connector layer:

`connectors/official/mcp`

It is intentionally separated from the internal integration package:

`@eq-labs/integration`

The connector represents the external protocol boundary, while the internal
integration package provides reusable integration abstractions for the
Engineering Ecosystem.

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
