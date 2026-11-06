const { performance } = require('node:perf_hooks');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const init = require('sql.js');
const { openRepository } = require('../public/storage/repository.cjs');
(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'utools-bench-'));
  const file = path.join(directory, 'history.sqlite');
  const repo = await openRepository({ file, SQL: await init() });
  const base = new Date(2026, 0, 1).getTime();
  try {
    const started = performance.now();
    repo.db.run('BEGIN');
    for (let i = 0; i < 100000; i++) repo.insert({ appId: `app-${i % 20}`, appName: `Application ${i % 20}`, processName: `process-${i % 20}`, windowTitle: `Synthetic performance fixture 项目文档 ${i} ${i % 7 === 0 ? 'needle' : 'ordinary'}`, startedAt: base + i * 60000, endedAt: base + i * 60000 + 50000 });
    repo.db.run('COMMIT');
    const insertMs = performance.now() - started;
    const timings = [], byQuery = {};
    for (const q of ['needle', '项目文档', '99999', 'no-match', 'Application 12']) {
      const values = [];
      for (let i = 0; i < 20; i++) { const start = performance.now(); repo.search({ q, limit: 80 }); values.push(performance.now() - start); }
      values.sort((a, b) => a - b); byQuery[q] = { p95Ms: values[Math.ceil(values.length * .95) - 1] }; timings.push(...values);
    }
    const pageStart = performance.now(); const page = repo.search({ limit: 80 }); repo.search({ limit: 80, cursor: page.nextCursor }); const twoPagesMs = performance.now() - pageStart;
    const statsStart = performance.now(); repo.stats({ from: base, to: base + 100000 * 60000 }); const statsMs = performance.now() - statsStart;
    const flushStart = performance.now(); repo.flush(); const flushMs = performance.now() - flushStart;
    timings.sort((a, b) => a - b); const p95Ms = timings[Math.ceil(timings.length * .95) - 1];
    const report = { measuredAt: new Date().toISOString(), environment: { os: `${os.type()} ${os.release()}`, node: process.version, cpu: os.cpus()[0].model }, data: '100000 synthetic fixtures; never loaded by product UI', count: repo.count(), insertMs, queryP95Ms: p95Ms, byQuery, twoPagesMs, statsMs, snapshotFlushMs: flushMs, databaseBytes: fs.statSync(file).size, nodeRssBytes: process.memoryUsage().rss, searchTargetMs: 150, searchTargetMet: p95Ms < 150, limitations: 'Warmed local WASM queries, not uTools renderer/collector end-to-end latency or long-term overhead.' };
    fs.writeFileSync('docs/performance-results.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
  } finally { repo.close(); fs.rmSync(directory, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
