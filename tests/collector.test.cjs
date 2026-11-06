const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { PassThrough } = require('node:stream');
const { createSpike } = require('../public/collector/controller.cjs');
function fixture() {
  const child = new EventEmitter();
  child.stdout = new PassThrough(); child.stderr = new PassThrough();
  let starts = 0, kills = 0;
  child.kill = () => { kills++; };
  return { child, api: createSpike({ platform: 'win32', spawnProcess: () => { starts++; return child; } }), counts: () => [starts, kills] };
}
test('requires explicit start, deduplicates start, parses split UTF-8 JSON and stops safely', () => {
  const { child, api, counts } = fixture();
  assert.deepEqual(counts(), [0, 0]);
  api.start(); api.start(); assert.deepEqual(counts(), [1, 0]);
  const line = JSON.stringify({ timestamp: 123, processId: 5, appName: 'app', windowTitle: '\u4e2d\u6587', status: 'ok' }) + '\n';
  const bytes = Buffer.from(line); child.stdout.write(bytes.subarray(0, 60)); child.stdout.write(bytes.subarray(60));
  assert.equal(api.snapshot().samples[0].windowTitle, '\u4e2d\u6587');
  api.stop(); child.emit('exit', 1); assert.equal(api.snapshot().state, 'paused');
  child.stdout.write(line); assert.equal(api.snapshot().samples.length, 1);
  api.clear(); assert.equal(api.snapshot().samples.length, 0);
});
test('malformed responses fail closed and process failures become unavailable', () => {
  const { child, api, counts } = fixture(); api.start();
  child.stdout.write('invalid\n'); assert.equal(api.snapshot().state, 'unavailable'); assert.equal(counts()[1], 1);
  const second = fixture(); second.api.start(); second.child.emit('error', Error('denied'));
  assert.equal(second.api.snapshot().state, 'unavailable');
  const third = fixture(); third.api.start(); third.child.emit('exit', 1);
  assert.equal(third.api.snapshot().state, 'unavailable');
});
test('unsupported platforms never launch a helper', () => {
  const api = createSpike({ platform: 'linux', spawnProcess: () => { throw Error('must not launch'); } });
  api.start(); assert.equal(api.snapshot().state, 'unavailable');
});
