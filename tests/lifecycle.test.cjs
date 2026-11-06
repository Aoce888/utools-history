const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function fixture({ deferred = false } = {}) {
  const handlers = {}; let closes = 0, starts = 0, resolve;
  const runtime = { directory: 'test-only', close() { closes++; }, service: { status: () => ({ state: 'not_started' }) } };
  const pending = new Promise(done => { resolve = done; });
  const bootstrap = () => { starts++; return deferred ? pending : Promise.resolve(runtime); };
  const host = { onPluginReady: cb => { handlers.ready = cb; }, onPluginOut: cb => { handlers.out = cb; } };
  const window = { utools: host, addEventListener: (name, cb) => { handlers[name] = cb; } };
  const context = {
    window, __dirname: path.resolve('public'),
    require(name) {
      if (name.endsWith('bootstrap.cjs')) return { bootstrap };
      if (name.endsWith('controller.cjs')) return { createSpike: () => ({ stop() {} }) };
      return require(name);
    }
  };
  vm.runInNewContext(fs.readFileSync('public/preload.js', 'utf8'), context);
  return { handlers, bridge: window.historyBridge, counts: () => ({ closes, starts }), resolve: () => resolve(runtime) };
}
test('hiding preserves runtime, host kill closes it once and rejects later bridge calls', async () => {
  const f = fixture(); assert.equal((await f.bridge.status()).ok, true);
  f.handlers.out(false); assert.equal(f.counts().closes, 0);
  assert.equal((await f.bridge.status()).ok, true);
  f.handlers.out(true); assert.equal(f.counts().closes, 1);
  f.handlers.beforeunload(); assert.equal(f.counts().closes, 1);
  assert.equal((await f.bridge.status()).ok, false); assert.equal(f.counts().starts, 1);
});
test('host kill while initialization is pending closes late runtime without exposing it', async () => {
  const f = fixture({ deferred: true }); const result = f.bridge.status();
  f.handlers.out(true); f.resolve();
  assert.equal((await result).ok, false); assert.equal(f.counts().closes, 1);
  f.handlers.beforeunload(); assert.equal(f.counts().closes, 1);
});
