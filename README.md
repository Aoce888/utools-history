# utools-history

A planned Windows 10/11 uTools plugin for finding previously used applications and windows.

Status: unreleased M0/M1 prototype. Explicitly start a 60-second Windows foreground-window experiment, inspect real in-memory samples, pause or clear them. Persistent history, search and statistics are not implemented. Host acceptance remains pending; see [feasibility evidence](docs/feasibility.md) and [product plan](Plan.md).

## Screenshots

No real product screenshots yet. Add redacted screenshots under docs/screenshots when the history UI is implemented; do not present mockups as working functionality.

## Installation and development

Requires Node.js 22.12+, npm, Windows and uTools developer tools.

```sh
npm ci
npm run dev
```

Import public/plugin.json in uTools developer tools with Vite running. A regular browser lacks the uTools and preload APIs.

Enter `操作历史` in uTools. The dev server requires port 5173 and fails if it is occupied, preventing accidental connection to another Vite project. For a standalone 10-second collector measurement run `node scripts/measure-spike.cjs`; only aggregate metrics are saved.

```sh
npm run check
npm run build
```

Load dist/plugin.json in uTools developer tools to verify and package the build. No official installable release exists yet.

## Architecture

Vue 3 renders the UI; Vite builds it; uTools provides lifecycle and commands; preload exposes Node file access. See [architecture](docs/architecture.md).

## Contributing and releases

See [contributing](CONTRIBUTING.md), [changelog](CHANGELOG.md) and [release procedure](docs/releasing.md). No open-source license has been selected; do not assume a license grant.
