const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { createCollector } = require('../public/collector/adapter.cjs');
test('adapter uses fixed argv, validates protocol and drops data after stop', () => {
  const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  let killed = 0, errors = 0, samples = [], options;
  child.kill = () => { killed++; };
  const collector = createCollector({ platform: 'win32', spawnProcess: (...args) => { options = args; return child; } });
  collector.start(item => samples.push(item), () => errors++);
  assert.equal(options[0], 'powershell.exe'); assert.equal(options[2].windowsHide, true); assert.ok(!options[1].includes('-ExecutionPolicy'));
  const sample = JSON.stringify({ timestamp: 100, processId: 1, idleMs: 0, appName: '应用', windowTitle: '窗口', status: 'ok' }) + '\n';
  const bytes = Buffer.from(sample); child.stdout.write(bytes.subarray(0, bytes.length - 4)); child.stdout.write(bytes.subarray(bytes.length - 4));
  assert.equal(samples[0].windowTitle, '窗口'); child.stdout.write('{"timestamp":-1}\n');
  assert.equal(errors, 1); assert.equal(killed, 1); child.stdout.write(sample); child.emit('exit', 1);
  assert.equal(samples.length, 1); assert.equal(errors, 1);
});
