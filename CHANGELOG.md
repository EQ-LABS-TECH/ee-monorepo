# Changelog

All notable changes to this repository will be documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning (SemVer).

---

## [Unreleased]

### Added

- Changes following the `1.0.0` release.

### Changed

- Updated `@changesets/cli` from `2.27.0` to `3.0.2`.
- Removed `tmp` transitive dependency (resolves Dependabot alerts #4, #7).
- Aligned `semver` to `7.8.5` and `yaml` to `2.9.0` to match Changesets requirements.
- Formatted `pnpm-lock.yaml` with Prettier.
- Retained `rimraf` as a prospective dependency for future root-level cleanup operations. It is not currently used by any script.

---

## [1.0.0] - YYYY-MM-DD

### Added

- Initial Engineering Ecosystem repository bootstrap.
- Repository structure.
- PNPM workspace.
- Turborepo configuration.
- Repository configuration files.
- Initial documentation.

### Documentation

- Engineering Ecosystem documentation baseline established.
- EE-DOC-006 implemented and frozen.

---

## Release Policy

Each released version represents a validated and frozen state of the repository at the time of release.

All repository changes must follow the official Engineering Ecosystem implementation lifecycle:

Document → Approval → Implementation → Configuration → Validation → Technical Documentation → Freeze

Only validated changes are eligible for inclusion in a released version.
