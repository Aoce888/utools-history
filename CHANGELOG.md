# Changelog

No official versions have been released.

## [Unreleased]

### Fixed
- Move the uTools development entry and Vite server together to dedicated loopback port 5197, avoiding the Guanshi project already using 5173. Keep strict-port behavior and verify manifest/server consistency automatically.
- Handle uTools `onPluginOut(true)` explicitly: stop capture, save the last snapshot and release the writer lock once. Hiding to background keeps the production service alive; shutdown during initialization closes a late runtime instead of exposing it.

### Added
- Automated UI coverage, real Windows collector/storage integration tests and 100k-record benchmark reports.
- Production builds bundle SQLite WASM and remove development URLs; consolidated manual acceptance checklist and developer preview instructions.
- Searchable virtualized timeline, date/app filters, keyboard navigation, activity details and application statistics.
- First-run consent, recording controls, exclusions, retention preferences, confirmed deletion and JSON/CSV export.
- System/light/dark themes and responsive Vue interface; browser UI tests use explicitly labeled test fixtures.
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
