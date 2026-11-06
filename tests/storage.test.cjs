const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const init = require('sql.js');
const { openRepository } = require('../public/storage/repository.cjs');
const event = (start, title = '中文 hello') => ({ appId: 'notepad', appName: 'Notepad', processName: 'notepad', windowTitle: title, startedAt: start, endedAt: start + 100 });
test('SQLite survives reopening, preserves settings and supports literal search and keyset pagination', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-db-')); const file = path.join(dir, 'history.sqlite');
  const SQL = await init();
  try {
    let repo = await openRepository({ file, SQL });
    repo.insert(event(1000)); repo.insert(event(1000, '100% _title')); repo.insert(event(2000, "' OR 1=1 --"));
    repo.updateSettings({ consent: true, excludedApps: ['Secret.EXE'] }); repo.close();
    assert.equal(fs.readFileSync(file).subarray(0, 15).toString(), 'SQLite format 3');
    repo = await openRepository({ file, SQL });
    assert.equal(repo.count(), 3); assert.deepEqual(repo.getSettings().excludedApps, ['secret.exe']);
    assert.equal(repo.search({ q: '%' }).items.length, 1); assert.equal(repo.search({ q: "' OR" }).items.length, 1);
    assert.equal(repo.search({ q: '中文' }).items.length, 1);
    const page = repo.search({ limit: 2 }); assert.equal(page.items.length, 2);
    assert.equal(repo.search({ cursor: page.nextCursor, limit: 2 }).items.length, 1);
    assert.equal(repo.search({ from: 1000, to: 2000 }).items.length, 2);
    assert.equal(repo.stats({ from: 1050, to: 2050 })[0].durationMs, 150);
    assert.throws(() => repo.deleteRecords({}), /scope/);
    assert.equal(repo.deleteRecords({ ids: [page.items[0].id] }), 1);
    assert.equal(repo.deleteRecords({ all: true }), 2); repo.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('retention, invalid settings, corrupt files and future schemas fail safely', async () => {
  const SQL = await init(); const repo = await openRepository({ SQL });
  repo.insert(event(100)); repo.insert(event(10 * 86400000)); repo.updateSettings({ retentionDays: 1 });
  repo.prune(10 * 86400000 + 200); assert.equal(repo.count(), 1);
  assert.throws(() => repo.updateSettings({ retentionDays: 0 })); assert.throws(() => repo.updateSettings({ unknown: true }));
  assert.throws(() => repo.search({ cursor: 'evil' })); repo.close();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-corrupt-')); const file = path.join(dir, 'db');
  try { fs.writeFileSync(file, 'bad data'); await assert.rejects(openRepository({ SQL, file })); assert.equal(fs.readFileSync(file, 'utf8'), 'bad data'); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
