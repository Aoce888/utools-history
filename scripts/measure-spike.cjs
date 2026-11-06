// Only aggregate metrics are persisted. Window titles never enter this report.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const started = Date.now();
const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.resolve('public/collector/foreground.ps1'), '-DurationSeconds', '10'], { windowsHide: true });
let buffer = '', diagnostics = '', count = 0, firstDelay, previous, gaps = [], statuses = {}, apps = new Set();
child.stdout.setEncoding('utf8');
child.stdout.on('data', chunk => {
  buffer += chunk;
  let end;
  while ((end = buffer.indexOf('\n')) >= 0) {
    const item = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
    count++; firstDelay ??= Date.now() - started;
    if (previous) gaps.push(item.timestamp - previous);
    previous = item.timestamp; statuses[item.status] = (statuses[item.status] || 0) + 1; apps.add(item.appName);
  }
});
child.stderr.on('data', chunk => { diagnostics += chunk; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => {
  const report = { measuredAt: new Date().toISOString(), os: `${os.type()} ${os.release()}`, node: process.version, exitCode: code, sampleCount: count, distinctApplications: apps.size, statuses, firstSampleStartupMs: firstDelay, sampleGapMs: gaps, elapsedMs: Date.now() - started, limitations: ['No controlled window-switch ground truth: loss and detection latency unmeasured.', 'CPU and memory require separate process measurement.', 'No uTools lifecycle, Windows 10, lock or sleep validation.'] };
  try { report.helperResources = JSON.parse(diagnostics.trim()); report.limitations.splice(1, 1); } catch { /* Keep measurement limitation when helper fails. */ }
  fs.writeFileSync('docs/spike-measurement.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report)); if (code || !count) process.exitCode = 1;
});
