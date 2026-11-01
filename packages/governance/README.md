# @eq-labs/governance

Governance layer of the EQ-LABS Engineering Ecosystem.

## Purpose

This package provides governance-related abstractions and capabilities
for enforcing engineering standards, policies, and controlled processes.

## Current Status

This package was created during Phase 4 — Packages.

The PN-017 domain modules include the conservative critical-change classifier
and ordinary-classification authority resolver,
approval/reviewer-eligibility evaluators, CODEOWNERS parsing and resolution,
coverage evaluation, deterministic enforcement policy evaluation, event
classification, event routing, PR Governance check-payload construction, and
composition of a decision from revalidated evidence, and trusted workflow
origin validation.
They are exported as
`@eq-labs/governance/pr-governance/classification` and
`@eq-labs/governance/pr-governance/authority`,
`@eq-labs/governance/pr-governance/approvals`, and
`@eq-labs/governance/pr-governance/codeowners`,
`@eq-labs/governance/pr-governance/ownership` and
`@eq-labs/governance/pr-governance/enforcement`,
`@eq-labs/governance/pr-governance/events`, and
`@eq-labs/governance/pr-governance/route`, and
`@eq-labs/governance/pr-governance/check`, and
`@eq-labs/governance/pr-governance/evaluation`, and
`@eq-labs/governance/pr-governance/workflow`. Classification only identifies
critical indicators; it does not establish that a change is ordinary. Ownership
evaluation consumes verified requirements and GitHub permission/membership evidence.

## Configuration

The package uses the shared Node.js TypeScript configuration:

`@eq-labs/config-typescript/node`

## Development

```bash
pnpm build
pnpm typecheck
```
