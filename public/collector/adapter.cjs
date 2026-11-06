const { spawn } = require('node:child_process');
const path = require('node:path');
function createCollector({ spawnProcess = spawn, platform = process.platform } = {}) {
  let child, generation = 0;
  return {
    stop() { generation++; const old = child; child = undefined; old?.kill(); },
    start(onSample, onFailure) {
      this.stop();
      if (platform !== 'win32') throw Error('仅支持 Windows 前台窗口采集');
      const token = generation; let buffer = '', failed = false;
      const fail = () => { if (token !== generation || failed) return; failed = true; this.stop(); onFailure('采集进程不可用，请检查 PowerShell 策略后重试'); };
      child = spawnProcess('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(__dirname, 'foreground.ps1'), '-DurationSeconds', '0', '-ParentProcessId', String(process.pid)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', chunk => {
        if (token !== generation) return;
        buffer += chunk;
        if (buffer.length > 65536) return fail();
        let index;
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index).trim(); buffer = buffer.slice(index + 1);
          if (!line) continue;
          let item;
          try {
            item = JSON.parse(line);
            if (!Number.isSafeInteger(item.timestamp) || item.timestamp < 0 || !Number.isInteger(item.processId) || !Number.isFinite(item.idleMs) || item.idleMs < 0 || !['appName', 'windowTitle', 'status'].every(k => typeof item[k] === 'string')) throw Error();
          } catch { fail(); return; }
          onSample(item);
          if (token !== generation) return;
        }
      });
      child.stderr.on('data', () => {}); // Never log raw titles or potentially private diagnostics.
      child.on('error', fail); child.on('exit', fail);
    }
  };
}
module.exports = { createCollector };
