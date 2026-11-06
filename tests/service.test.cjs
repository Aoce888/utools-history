const { test } = require('node:test');
const assert = require('node:assert/strict');
const init = require('sql.js');
const { openRepository } = require('../public/storage/repository.cjs');
const { createHistoryService } = require('../public/service/history.cjs');
async function fixture() {
  let clock = 1000000, receive, fail, stopped = 0;
  const repo = await openRepository({ SQL: await init() });
  const collector = { start(cb, err) { receive = cb; fail = err; }, stop() { stopped++; } };
  const service = createHistoryService({ repository: repo, collector, now: () => clock });
  function sample(delta = 1000, patch = {}) { clock += delta; receive({ timestamp: clock, appName: 'Notepad', windowTitle: 'Title', processId: 1, idleMs: 0, status: 'ok', ...patch }); }
  service.initialize();
  return { repo, service, sample, fail: () => fail('crashed'), advance(ms) { clock += ms; }, stopped: () => stopped };
}
test('consent, merging, pause, exclusion and deletion are enforced before persistence', async () => {
  const f = await fixture(); assert.equal(f.service.status().state, 'not_started'); assert.equal(f.repo.count(), 0);
  f.service.start(); assert.equal(f.service.status().state, 'not_started');
  f.service.updateSettings({ consent: true }); f.sample(); f.sample(); f.sample();
  assert.equal(f.repo.count(), 1); assert.equal(f.repo.search().items[0].durationMs, 2000);
  f.sample(1000, { windowTitle: 'Second' }); assert.equal(f.repo.count(), 2);
  f.service.pause(); f.sample(); assert.equal(f.repo.count(), 2);
  f.service.updateSettings({ excludedApps: ['notepad.exe'] }); f.service.start(); f.sample(); assert.equal(f.repo.count(), 2);
  f.service.updateSettings({ excludedApps: [] }); f.sample(); assert.equal(f.repo.count(), 3);
  f.service.deleteRecords({ all: true }); f.sample(); assert.equal(f.repo.count(), 1);
  f.service.close();
});
test('sleep gaps, lock, idle and collector death never extend the previous active segment', async () => {
  const f = await fixture(); f.service.updateSettings({ consent: true, idleSeconds: 30 });
  f.sample(); f.sample(); f.sample(600000); assert.equal(f.repo.count(), 2);
  f.sample(1000, { status: 'locked_or_secure_desktop', windowTitle: 'must not persist' });
  f.sample(); assert.equal(f.repo.count(), 3);
  f.sample(1000, { idleMs: 35000 }); assert.equal(f.repo.search().items[0].durationMs, 0);
  f.fail(); assert.equal(f.service.status().state, 'unavailable');
  f.service.start(); f.advance(13000); f.service.tick(); assert.equal(f.service.status().state, 'unavailable'); f.service.close();
});
test('statistics clip time boundaries and CSV export neutralizes formulas', async () => {
  const f = await fixture(); f.service.updateSettings({ consent: true });
  f.sample(1000, { windowTitle: '=HYPERLINK("bad")' }); f.sample(1000, { windowTitle: '=HYPERLINK("bad")' });
  const csv = f.service.exportRecords({ format: 'csv' }); assert.ok(csv.includes("'=HYPERLINK"));
  assert.equal(JSON.parse(f.service.exportRecords({ format: 'json' })).length, 1);
  assert.equal(f.service.stats({ from: 1001500, to: 1003000 })[0].durationMs, 500); f.service.close();
});
test('persistence errors stop collection instead of silently losing data', async () => {
  const f = await fixture(); f.service.updateSettings({ consent: true });
  f.repo.insert = () => { throw Error('disk'); }; f.sample(); assert.equal(f.service.status().state, 'unavailable'); assert.ok(f.stopped() > 0); f.service.close();
});
