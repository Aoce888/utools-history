# Changelog

No official versions have been released.

## [Unreleased]

### Added
- SQLite/WASM repository with atomic local snapshots, schema versioning, keyset pagination and retention cleanup.
- Decoupled recording service with explicit consent, automatic sampling, merge/split rules, idle/secure-desktop handling, exclusions, heartbeat failure detection and CSV-safe export.
- M0 TypeScript checking, reproducible host test plan and build-artifact verification.
- M1 explicit-start Windows foreground collector experiment with pause, clear, bounded lifetime and in-memory UI.
- Collector failure-path tests and a reproducible aggregate measurement report; host acceptance remains pending.
- Initial Git baseline preserving existing source and product plan.
- Maintenance conventions, architecture and release documentation.
- Dependency lockfile, automated preload test and Windows CI build checks.

### Fixed
- Replaced corrupted documentation generated through a shell encoding mismatch.

Existing starter examples do not constitute a completed history MVP.
