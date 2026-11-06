const fs = require('node:fs');
const path = require('node:path');
const DEFAULT_SETTINGS = { consent: false, paused: false, retentionDays: 30, idleSeconds: 300, excludedApps: [], theme: 'system' };
function validateSettings(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw Error('Invalid settings');
  const result = {};
  for (const [key, value] of Object.entries(patch)) {
    if (['consent', 'paused'].includes(key) && typeof value === 'boolean') result[key] = value;
    else if (key === 'theme' && ['system', 'light', 'dark'].includes(value)) result[key] = value;
    else if (key === 'retentionDays' && Number.isInteger(value) && value >= 1 && value <= 3650) result[key] = value;
    else if (key === 'idleSeconds' && Number.isInteger(value) && value >= 30 && value <= 3600) result[key] = value;
    else if (key === 'excludedApps' && Array.isArray(value) && value.length <= 200 && value.every(v => typeof v === 'string' && v.length > 0 && v.length <= 260)) result[key] = [...new Set(value.map(v => v.trim().toLowerCase()).filter(Boolean))];
    else throw Error(`Invalid setting: ${key}`);
  }
  return result;
}
function rows(db, sql, params = []) {
  const statement = db.prepare(sql);
  try { statement.bind(params); const result = []; while (statement.step()) result.push(statement.getAsObject()); return result; }
  finally { statement.free(); }
}
function filters(params = {}) {
  const conditions = [], values = [];
  for (const key of ['from', 'to']) if (params[key] !== undefined) {
    if (!Number.isSafeInteger(params[key]) || params[key] < 0) throw Error('Invalid time range');
    conditions.push(`started_at ${key === 'from' ? '>=' : '<'} ?`); values.push(params[key]);
  }
  if (params.from !== undefined && params.to !== undefined && params.from >= params.to) throw Error('Invalid time range');
  if (params.q) {
    if (typeof params.q !== 'string' || params.q.length > 500) throw Error('Invalid query');
    conditions.push("(app_name LIKE ? ESCAPE '\\' OR window_title LIKE ? ESCAPE '\\')");
    const q = `%${params.q.replace(/[\\%_]/g, '\\$&')}%`; values.push(q, q);
  }
  if (params.appId) { if (typeof params.appId !== 'string') throw Error('Invalid app'); conditions.push('app_id = ?'); values.push(params.appId); }
  return { conditions, values };
}
const record = r => ({ id: r.id, appId: r.app_id, appName: r.app_name, processName: r.process_name, windowTitle: r.window_title, startedAt: r.started_at, endedAt: r.ended_at, durationMs: r.ended_at - r.started_at });
async function openRepository({ file, SQL, io = fs }) {
  const exists = file && io.existsSync(file);
  const db = new SQL.Database(exists ? io.readFileSync(file) : undefined);
  try {
    if (rows(db, 'PRAGMA quick_check')[0].quick_check !== 'ok') throw Error('Database integrity check failed');
    const version = rows(db, 'PRAGMA user_version')[0].user_version;
    if (version > 1) throw Error('Database version is newer than this plugin');
    db.run(`CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, app_id TEXT NOT NULL, app_name TEXT NOT NULL,
      process_name TEXT NOT NULL, window_title TEXT NOT NULL, started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL CHECK(ended_at >= started_at));
      CREATE INDEX IF NOT EXISTS idx_events_started ON activity_events(started_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_events_app_time ON activity_events(app_id, started_at DESC);
      CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS event_targets (event_id INTEGER PRIMARY KEY, executable TEXT NOT NULL);
      PRAGMA user_version = 1;`);
  } catch (error) { db.close(); throw error; }
  let dirty = !exists;
  let settings = { ...DEFAULT_SETTINGS, excludedApps: [], theme: 'system' };

  for (const row of rows(db, 'SELECT * FROM app_settings')) Object.assign(settings, validateSettings({ [row.key]: JSON.parse(row.value_json) }));
  function flush() {
    if (!dirty || !file) return;
    io.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    const fd = io.openSync(tmp, 'w', 0o600);
    try { io.writeFileSync(fd, Buffer.from(db.export())); io.fsyncSync(fd); } finally { io.closeSync(fd); }
    io.renameSync(tmp, file);
    dirty = false;
  }
  const api = {
    db,
    flush,
    close() { flush(); db.close(); },
    getSettings: () => ({ ...settings, excludedApps: [...settings.excludedApps] }),
    updateSettings(patch) {
      const next = validateSettings(patch);
      db.run('BEGIN');
      try { for (const [key, value] of Object.entries(next)) db.run('INSERT OR REPLACE INTO app_settings VALUES (?, ?)', [key, JSON.stringify(value)]); db.run('COMMIT'); }
      catch (error) { db.run('ROLLBACK'); throw error; }
      settings = { ...settings, ...next }; dirty = true; flush(); return api.getSettings();
    },
    insert(event) {
      if (!Number.isSafeInteger(event.startedAt) || !Number.isSafeInteger(event.endedAt) || event.endedAt < event.startedAt || !['appId', 'appName', 'processName', 'windowTitle'].every(k => typeof event[k] === 'string')) throw Error('Invalid event');
      db.run('INSERT INTO activity_events (app_id,app_name,process_name,window_title,started_at,ended_at) VALUES (?,?,?,?,?,?)', [event.appId, event.appName, event.processName, event.windowTitle, event.startedAt, event.endedAt]);
      dirty = true; return rows(db, 'SELECT last_insert_rowid() AS id')[0].id;
    },
    setTarget(id, executable) { db.run('INSERT OR REPLACE INTO event_targets VALUES (?,?)', [id, executable]); dirty = true; },
    target(id) { if (!Number.isSafeInteger(id)) throw Error('Invalid record'); return rows(db, 'SELECT executable FROM event_targets WHERE event_id=? AND EXISTS(SELECT 1 FROM activity_events WHERE id=?)', [id,id])[0]?.executable; },
    extend(id, endedAt) {
      if (!Number.isSafeInteger(id) || !Number.isSafeInteger(endedAt)) throw Error('Invalid event');
      db.run('UPDATE activity_events SET ended_at = ? WHERE id = ? AND ended_at <= ?', [endedAt, id, endedAt]); dirty = true;
    },
    setEnd(id, endedAt) { db.run('UPDATE activity_events SET ended_at = MAX(started_at, ?) WHERE id = ?', [endedAt, id]); dirty = true; },
    search(params = {}) {
      const { conditions, values } = filters(params);
      if (params.frequent) {
        const scoped = filters({ from: params.from, to: params.to });
        const result = rows(db, `SELECT e.* FROM activity_events e JOIN (SELECT app_id, MAX(id) AS latest_id, COUNT(*) AS uses FROM activity_events ${scoped.conditions.length ? 'WHERE ' + scoped.conditions.join(' AND ') : ''} GROUP BY app_id) a ON e.id=a.latest_id ORDER BY a.uses DESC,e.started_at DESC LIMIT 80`, scoped.values);
        return { items: result.map(record), total: result.length };
      }
      const limit = params.limit ?? 80;
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw Error('Invalid page size');
      const total = rows(db, `SELECT COUNT(*) AS count FROM activity_events ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}`, values)[0].count;
      if (params.cursor) {
        const match = /^(\d+):(\d+)$/.exec(params.cursor);
        if (!match || !match.slice(1).every(v => Number.isSafeInteger(Number(v)))) throw Error('Invalid cursor');
        conditions.push('(started_at < ? OR (started_at = ? AND id < ?))'); values.push(+match[1], +match[1], +match[2]);
      }
      const result = rows(db, `SELECT * FROM activity_events ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''} ORDER BY started_at DESC, id DESC LIMIT ?`, [...values, limit + 1]);
      const items = result.slice(0, limit).map(record), last = items.at(-1);
      return { items, total, nextCursor: result.length > limit ? `${last.startedAt}:${last.id}` : undefined };
    },
    stats(params) {
      const from = params.from, to = params.to;
      if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || to <= from) throw Error('Invalid stats range');
      return rows(db, `SELECT app_id AS appId, app_name AS appName, SUM(MAX(0, MIN(ended_at, ?) - MAX(started_at, ?))) AS durationMs FROM activity_events WHERE ended_at > ? AND started_at < ? GROUP BY app_id ORDER BY durationMs DESC`, [to, from, from, to]);
    },
    apps() { return rows(db, 'SELECT app_id AS appId, MAX(app_name) AS appName FROM activity_events GROUP BY app_id ORDER BY appName'); },
    count() { return rows(db, 'SELECT COUNT(*) AS count FROM activity_events')[0].count; },
    deleteRecords(params = {}) {
      const { conditions, values } = filters(params);
      if (params.ids !== undefined) {
        if (!Array.isArray(params.ids) || !params.ids.length || params.ids.length > 200 || !params.ids.every(Number.isSafeInteger)) throw Error('Invalid IDs');
        conditions.push(`id IN (${params.ids.map(() => '?').join(',')})`); values.push(...params.ids);
      }
      if (params.all !== true && !conditions.length) throw Error('Deletion scope required');
      db.run(`DELETE FROM activity_events ${params.all === true ? '' : 'WHERE ' + conditions.join(' AND ')}`, params.all === true ? [] : values);
      const deleted = db.getRowsModified(); dirty = true;
      db.run('DELETE FROM event_targets WHERE event_id NOT IN (SELECT id FROM activity_events)');
      db.run('VACUUM'); flush(); return deleted;
    },
    prune(now = Date.now()) { return api.deleteBefore(now - settings.retentionDays * 86400000); },
    deleteBefore(cutoff) { db.run('DELETE FROM activity_events WHERE ended_at < ?', [cutoff]); const n = db.getRowsModified(); if (n) { db.run('DELETE FROM event_targets WHERE event_id NOT IN (SELECT id FROM activity_events)'); dirty = true; db.run('VACUUM'); flush(); } return n; }
  };
  flush();
  return api;
}
module.exports = { openRepository, validateSettings, DEFAULT_SETTINGS };
