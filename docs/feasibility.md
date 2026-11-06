# Windows collector feasibility — M1

## Decision

**Go for a bounded prototype; No-Go for production continuous recording.** The experiment uses a hidden, non-elevated PowerShell child process calling GetForegroundWindow, GetWindowThreadProcessId and GetWindowTextW. It runs only after explicit start, samples every second, and exits after 60 seconds. The UI exit hook and unload handler stop the child; even if the host crashes, the child is bounded by its own deadline. No startup tasks, services, execution-policy bypass or administrator privileges are installed.

The selected interim mode is **plugin-session experiment only**. Background persistence is intentionally disabled. Event hooks should be evaluated before a production collector: polling is simple to reproduce but misses sub-second transitions. No native Node ABI dependency is introduced; Windows PowerShell policy may still prevent running the script. Packaging includes the script and CommonJS controller alongside preload and must be verified in the real host.

## Measured evidence

Run `node scripts/measure-spike.cjs` on Windows to produce [aggregate measurement](spike-measurement.json). The actual run captured real foreground samples on Windows build 22631 with successful status. The report includes startup-to-first-sample time, inter-sample gaps, helper CPU seconds and working-set metrics. Startup delay is **not window-switch detection latency**. CPU includes PowerShell startup and compilation; the short experiment is not a long-running overhead benchmark. Raw titles and process names are not persisted in the report.

No controlled window-switch ground truth was available, so event loss and detection latency remain unmeasured. No claims are made about Office, browser, Explorer, minimized windows, lock, sleep or Windows 10 compatibility based on this run alone.

## Failure handling

Null foreground handles yield `no_foreground`; inaccessible or vanished processes yield `process_unavailable`; empty titles yield `empty_title`. Process name falls back to Unknown application. System processes receive the same handling; the prototype does not elevate privileges. Invalid protocol output, launch errors and nonzero exit make capture unavailable. Samples are limited to 300 in memory and can be cleared. Neither intervals nor timestamps represent active-duration records.

## Host acceptance blocker

uTools processes exist, but the computer-use native pipe and browser access host were unavailable in this session. Therefore developer-tool loading, HMR, packaged loading, UI exit behavior, restart and sleep/wake have **not been observed**. Use [test plan](test-plan.md) to complete this matrix. M0 host acceptance and M1 full acceptance remain pending; do not mark continuous collection feasible until evidence exists.

## Sources

- [Microsoft GetForegroundWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow)
- [uTools plugin manifest](https://www.u-tools.cn/docs/development/plugin-json.html)

The documentation describes APIs and packaging contracts; it is not evidence that this plugin has passed host acceptance.
