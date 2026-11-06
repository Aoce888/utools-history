# M0 / M1 verification

## Reproduction

Use Node.js 22.12+ and npm. Run `npm ci`, `npm run check`, then `npm run dev -- --host 127.0.0.1`. Import the absolute path to `public/plugin.json` in uTools developer tools. Enter the plugin command, edit a heading and verify reload/HMR. For packaged verification import `dist/plugin.json` after building.

`npm run check` runs unit tests, Vue/TypeScript checking, build and required-artifact validation. Build output must contain index.html, plugin.json, logo.png and preload.js. Browser preview verifies rendering only; host APIs require uTools.

## Host acceptance matrix

Record OS, uTools version, date, result and evidence for each run. Never infer success from a running uTools process.

| Scenario | Expected | Status |
| --- | --- | --- |
| Load dev entry / reload / packaged entry | Page renders without host errors | Pending host verification |
| Explicit start / pause / clear | No capture before start; stops on pause; clear removes in-memory samples | Automated controller tests + host pending |
| Minimize / switch / browser / Office / Explorer | Real app, title, timestamp or explicit fallback | Manual matrix pending |
| Close UI / restart uTools / kill plugin | Stop or accurately report lifecycle limitation | Pending |
| Lock / sleep / wake | Never claim uninterrupted capture | Pending |
| Windows 10 and Windows 11 | Repeat all host checks | Pending |

M1 is a bounded feasibility experiment, not production history. Do not use its timestamps as active-duration statistics. No startup installation or administrator permission is required.
