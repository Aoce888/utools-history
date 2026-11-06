# utools-history

A planned Windows 10/11 uTools plugin for finding previously used applications and windows.

Status: unreleased starter project. Only greeting and text-reading examples currently exist. Activity capture, search, statistics and privacy controls are planned, not implemented. See [product plan](Plan.md).

## Screenshots

No real product screenshots yet. Add redacted screenshots under docs/screenshots when the history UI is implemented; do not present mockups as working functionality.

## Installation and development

Requires Node.js 22.12+, npm, Windows and uTools developer tools.

```sh
npm ci
npm run dev
```

Import public/plugin.json in uTools developer tools with Vite running. A regular browser lacks the uTools and preload APIs.

```sh
npm run check
npm run build
```

Load dist/plugin.json in uTools developer tools to verify and package the build. No official installable release exists yet.

## Architecture

Vue 3 renders the UI; Vite builds it; uTools provides lifecycle and commands; preload exposes Node file access. See [architecture](docs/architecture.md).

## Contributing and releases

See [contributing](CONTRIBUTING.md), [changelog](CHANGELOG.md) and [release procedure](docs/releasing.md). No open-source license has been selected; do not assume a license grant.
