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

## M1 additions

App.vue now renders the experiment controls and samples. public/collector/controller.cjs owns explicit-start state, protocol validation, bounded memory and process shutdown. foreground.ps1 owns Win32 reads. preload exposes the limited historySpike interface declared in src/domain/bridge.ts; UI code does not construct shell commands. No persistent activity schema exists yet. The old text-selection undefined function has been corrected; starter example components remain available as source references.
