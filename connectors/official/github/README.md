# @eq-labs/connector-github

Official GitHub connector for the EQ-LABS Engineering Ecosystem.

## Purpose

This connector provides the official integration boundary between the
Engineering Ecosystem and GitHub.

It is intended to become the controlled integration point for GitHub
repositories, organizations, issues, pull requests, commits, branches, and
other supported GitHub resources.

## Current Status

This connector was created during Phase 6 — Connectors.

The current implementation establishes the official connector workspace and
its TypeScript configuration.

No GitHub API integration or authentication mechanism is implemented at this
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
