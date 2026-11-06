# Architecture

- src/main.js: Vue entry and global styles.
- src/App.vue: uTools enter/exit lifecycle and feature routing.
- src/Hello/: displays entry parameters.
- src/ReadText/: text selection and display example.
- public/preload.js: window.services.readText(path), asynchronous UTF-8 file access.
- public/plugin.json: host entry, development URL and commands.

## Data

Host actions contain code, type and payload. File entries read payload[0].path. State is currently in Vue memory; no activity database, migrations or collector exist.

## Decisions

Keep the starter intact during infrastructure work. Future UI, activity domain, persistence and platform adapters should be separate modules. Document actual record schemas and migrations when implemented. Plan.md describes requirements, not delivered behavior.

## Known issue

The file selection button calls undefined setFilePath. Track and fix separately with regression coverage. A successful build cannot detect all runtime failures.
