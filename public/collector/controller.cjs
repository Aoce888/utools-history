const { spawn } = require('node:child_process');
const path = require('node:path');
function createSpike({ spawnProcess = spawn, platform = process.platform, script = path.join(__dirname, 'foreground.ps1') } = {}) {
  let child, generation = 0;
  let state = 'not_started', message = 'Explicit start required. Samples stay in memory.', samples = [];
  function stop() {
    generation++;
    const previous = child; child = undefined; previous?.kill();
    state = 'paused'; message = 'Stopped. No background capture guarantee.';
  }
  return {
    snapshot: () => ({ state, message, samples: samples.map(item => ({ ...item })) }),
    stop,
    clear() { samples = []; },
    start() {
      if (child) return;
      if (platform !== 'win32') { state = 'unavailable'; message = 'Windows is required.'; return; }
      const current = ++generation;
      let buffer = '';
      state = 'recording'; message = '60-second experiment; 1-second polling can miss brief switches.';
      try {
        child = spawnProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', script, '-DurationSeconds', '60'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', chunk => {
          if (current !== generation) return;
          buffer += chunk;
          if (buffer.length > 65536) { stop(); state = 'unavailable'; message = 'Collector output exceeded bounds.'; return; }
          let end;
          while ((end = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1);
            if (!line) continue;
            try {
              const item = JSON.parse(line);
              if (!Number.isFinite(item.timestamp) || !Number.isInteger(item.processId) || !['appName', 'windowTitle', 'status'].every(key => typeof item[key] === 'string')) throw Error();
              samples.unshift(item); samples = samples.slice(0, 300);
            } catch { stop(); state = 'unavailable'; message = 'Invalid collector response.'; return; }
          }
        });
        child.stderr.on('data', () => { if (current === generation) message = 'Collector diagnostic received; private titles are not logged.'; });
        child.on('error', () => { if (current === generation) { child = undefined; state = 'unavailable'; message = 'Cannot start collector. Check PowerShell policy and permissions.'; } });
        child.on('exit', code => {
          if (current !== generation) return;
          child = undefined; state = code === 0 ? 'paused' : 'unavailable';
          message = code === 0 ? 'Experiment finished.' : 'Collector exited unexpectedly.';
        });
      } catch { child = undefined; state = 'unavailable'; message = 'Collector launch failed.'; }
    }
  };
}
module.exports = { createSpike };
