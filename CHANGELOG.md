# Changelog

No official versions have been released.

## [Unreleased]

### Fixed
- Remove legacy independent theme preferences from the bridge and database settings; migrate old theme keys away. Appearance is solely a CSS mapping of the host-recommended prefers-color-scheme state.
- Restore a fixed 60px shortcut rail with history/search/statistics and bottom recording/settings controls; show query-specific counts and distinguish query failures from empty results.
- Follow uTools' recommended prefers-color-scheme mechanism automatically with neutral light/dark surfaces; remove the independent theme selector and ignore legacy UI theme overrides.
- Return the total matching the current search filters independently of pagination, rather than presenting the global database count as a filtered result count. Load saved history even when recording has not been enabled; this does not start capture.
- Rework the UI as a compact desktop tool: always-visible search and recording controls, 56px result rows, one-line filters, and a secondary menu for settings/statistics/export. Replace the welcome page with inline consent and remove the sidebar and decorative headings.
- Support keyboard-only page continuation, retain selection across live refresh, focus search on plugin re-entry, and make Esc close menus/details, return from secondary views, clear search, then hide the host window. Paginate secondary panels and long detail titles instead of adding page scrollbars.
- Compact the first-run page to essential privacy details and a visible start action; return to history and focus search after consent, including when enabled from another tab.
- Remove forced 400px minimum height and welcome-page scrolling, reduce header/sidebar spacing, and use standard system fonts/weights without negative title tracking, hover filters or backdrop blur. Add compact viewport/DPR regression coverage; real uTools DPI rendering remains pending.
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
