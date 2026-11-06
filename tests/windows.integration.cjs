const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const init = require('sql.js');
const { openRepository } = require('../public/storage/repository.cjs');
const { createCollector } = require('../public/collector/adapter.cjs');
const { createHistoryService } = require('../public/service/history.cjs');
const vm = require('node:vm');
test('production preload loads bundled WASM and exposes a working consent-gated bridge', { skip: process.platform !== 'win32' }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-package-')); let unload;
  const callbacks = {};
  const host = { getPath: () => dir, onPluginReady: cb => { callbacks.ready = cb; }, onPluginOut: cb => { callbacks.out = cb; } };
  const context = { require, __dirname: path.resolve('dist'), window: { utools: host, addEventListener: (name, cb) => { if (name === 'beforeunload') unload = cb; } } };
  try {
    vm.runInNewContext(fs.readFileSync('dist/preload.js', 'utf8'), context);
    const bridge = context.window.historyBridge;
    const status = await bridge.status(); assert.equal(status.ok, true, JSON.stringify(status)); assert.equal(status.value.state, 'not_started'); assert.equal(status.value.count, 0);
    const settings = await bridge.getSettings(); assert.equal(settings.value.consent, false);
    const query = await bridge.search({ q: 'missing' }); assert.equal(query.value.items.length, 0);
    assert.equal((await bridge.updateSettings({ retentionDays: 0 })).ok, false);
  } finally { unload?.(); fs.rmSync(dir, { recursive: true, force: true }); }
});
test('real Windows collector → SQLite → query → reopen (temporary local data)', { skip: process.platform !== 'win32' }, async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-win-')); const file = path.join(dir, 'history.sqlite');
  const SQL = await init(); let repo = await openRepository({ SQL, file });
  const service = createHistoryService({ repository: repo, collector: createCollector() });
  const report = { measuredAt: new Date().toISOString(), os: os.release(), status: 'failed', sampleRecords: 0, titlePersisted: false, pauseVerified: false, reopenVerified: false };
  try {
    service.initialize(); assert.equal(repo.count(), 0);
    service.updateSettings({ consent: true });
    await new Promise(resolve => setTimeout(resolve, 4500));
    const status = service.status(); service.pause();
    assert.notEqual(status.state, 'unavailable', status.message);
    const items = service.search({ limit: 10 }).items;
    report.sampleRecords = repo.count(); report.titlePersisted = items.some(item => !!item.windowTitle);
    if (!items.length) { report.status = 'blocked-no-interactive-foreground'; t.skip('No accessible interactive foreground window; host acceptance required'); return; }
    await new Promise(resolve => setTimeout(resolve, 1200));
    assert.equal(repo.count(), report.sampleRecords); report.pauseVerified = true;
    service.close(); repo = await openRepository({ SQL, file });
    assert.equal(repo.count(), report.sampleRecords); report.reopenVerified = true; repo.close(); report.status = 'passed';
  } finally {
    try { service.close(); } catch {}
    fs.writeFileSync('docs/windows-integration-results.json', JSON.stringify(report, null, 2) + '\n');
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
