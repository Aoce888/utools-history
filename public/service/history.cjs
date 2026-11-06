function createHistoryService({ repository: repo, collector, now = Date.now }) {
  let state = 'not_started', message = '', active, lastHeartbeat = 0, revision = 0, closed = false;
  let lastPrune = now(), lastFlush = now();
  function boundary() { active = undefined; }
  function fail(error) { collector.stop(); boundary(); state = 'unavailable'; message = error instanceof Error ? '本地存储或采集异常，已停止记录。请检查磁盘和权限后重试。' : String(error); revision++; }
  function accept(sample) {
    if (closed || state !== 'recording') return;
    try {
      const settings = repo.getSettings();
      const current = now();
      const previousHeartbeat = lastHeartbeat;
      lastHeartbeat = current;
      if (Math.abs(sample.timestamp - current) > 10000) { boundary(); message = '系统时间变化，已分段'; return; }
      const app = sample.appName.toLowerCase().replace(/\.exe$/, '');
      const excluded = settings.excludedApps.some(value => value.replace(/\.exe$/, '') === app);
      const blocked = sample.status !== 'ok' && sample.status !== 'empty_title';
      if (settings.paused || !settings.consent || excluded || blocked || sample.idleMs >= settings.idleSeconds * 1000) {
        if (active && sample.idleMs >= settings.idleSeconds * 1000) repo.setEnd(active.id, Math.max(active.startedAt, Math.min(active.lastAt, sample.timestamp - sample.idleMs)));
        boundary(); message = excluded ? '当前应用已排除，不记录标题' : blocked ? '锁屏、安全桌面或窗口信息不可用，已分段' : '空闲中，暂停计时'; revision++; return;
      }
      if (previousHeartbeat && current - previousHeartbeat > 4000) boundary();
      const same = active && active.app === app && active.title === sample.windowTitle && active.pid === sample.processId && sample.timestamp >= active.lastAt && sample.timestamp - active.lastAt <= 4000;
      if (same) { repo.extend(active.id, sample.timestamp); active.lastAt = sample.timestamp; }
      else {
        const event = { appId: app, appName: sample.appName, processName: sample.appName, windowTitle: sample.windowTitle.slice(0, 4096), startedAt: sample.timestamp, endedAt: sample.timestamp };
        const id = repo.insert(event); active = { id, app, title: sample.windowTitle, pid: sample.processId, startedAt: sample.timestamp, lastAt: sample.timestamp };
      }
      message = '仅在插件进程存活期间记录；关闭 uTools 后停止'; revision++;
    } catch (error) { fail(error); }
  }
  function start() {
    if (closed) throw Error('Service closed');
    const settings = repo.getSettings();
    if (!settings.consent) { state = 'not_started'; return; }
    if (state === 'recording') return;
    repo.updateSettings({ paused: false }); boundary();
    state = 'recording'; message = '正在连接本地采集器…'; lastHeartbeat = now();
    try { collector.start(accept, fail); } catch (error) { fail(error); }
    revision++;
  }
  function pause() {
    collector.stop(); boundary(); state = 'paused'; message = '已暂停，不再写入活动'; revision++;
    try { repo.updateSettings({ paused: true }); repo.flush(); } catch (error) { fail(error); throw error; }
  }
  const api = {
    start, pause,
    initialize() { repo.prune(now()); const s = repo.getSettings(); if (s.consent && !s.paused) start(); else state = s.consent ? 'paused' : 'not_started'; },
    tick() {
      if (closed) return;
      try {
        if (state === 'recording' && now() - lastHeartbeat > 12000) fail('超过 12 秒未收到采集心跳，请重试');
        if (now() - lastFlush >= 5000) { repo.flush(); lastFlush = now(); }
        if (now() - lastPrune >= 3600000) { boundary(); repo.prune(now()); lastPrune = now(); revision++; }
      } catch (error) { fail(error); }
    },
    status() { return { state, message, revision, count: repo.count(), storageMode: 'local-sqlite' }; },
    getSettings: () => repo.getSettings(),
    updateSettings(patch) {
      require('../storage/repository.cjs').validateSettings(patch);
      const wasRecording = state === 'recording'; boundary();
      let settings;
      try { settings = repo.updateSettings(patch); repo.prune(now()); } catch (error) { fail(error); throw error; }
      if (!settings.consent) { collector.stop(); state = 'not_started'; }
      else if (settings.paused) { collector.stop(); state = 'paused'; }
      else if (!wasRecording) start();
      revision++; return settings;
    },
    search: params => repo.search(params),
    stats: params => repo.stats(params),
    apps: () => repo.apps(),
    deleteRecords(params) { boundary(); const result = repo.deleteRecords(params); revision++; return result; },
    exportRecords(params) {
      if (!['json', 'csv'].includes(params.format)) throw Error('Invalid export format');
      const result = []; let cursor;
      do { const page = repo.search({ from: params.from, to: params.to, limit: 200, cursor }); result.push(...page.items); cursor = page.nextCursor; if (result.length > 100000) throw Error('导出超过 10 万条，请缩小日期范围'); } while (cursor);
      if (params.format === 'json') return JSON.stringify(result, null, 2);
      const cell = value => '"' + String(value ?? '').replace(/^[\s]*[=+\-@]/, "'$&").replace(/"/g, '""') + '"';
      return '\uFEFF' + ['appName,windowTitle,startedAt,endedAt,durationMs', ...result.map(r => [r.appName, r.windowTitle, new Date(r.startedAt).toISOString(), new Date(r.endedAt).toISOString(), r.durationMs].map(cell).join(','))].join('\r\n');
    },
    close() { if (closed) return; collector.stop(); boundary(); repo.close(); closed = true; }
  };
  return api;
}
module.exports = { createHistoryService };
