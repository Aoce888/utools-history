const fs = require('node:fs');
const path = require('node:path');
const { openRepository } = require('../storage/repository.cjs');
const { createCollector } = require('../collector/adapter.cjs');
const { createHistoryService } = require('./history.cjs');
async function bootstrap(host) {
  if (process.platform !== 'win32') throw Error('当前版本仅支持 Windows');
  const root = host.getPath('userData');
  if (!path.isAbsolute(root)) throw Error('Invalid user data path');
  const directory = path.join(root, 'HostXit', 'utools-history');
  fs.mkdirSync(directory, { recursive: true });
  const lock = path.join(directory, 'writer.lock');
  function acquire() { const fd = fs.openSync(lock, 'wx'); try { fs.writeFileSync(fd, String(process.pid)); } finally { fs.closeSync(fd); } }
  try { acquire(); } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = Number(fs.readFileSync(lock, 'utf8'));
    if (!Number.isInteger(owner) || owner <= 0) throw Error('数据库锁无效，请在退出 uTools 后检查 writer.lock');
    let alive = true;
    try { process.kill(owner, 0); } catch (e) { if (e.code === 'ESRCH') alive = false; }
    if (alive) throw Error('另一个插件实例正在使用数据库，请先退出该实例');
    fs.unlinkSync(lock); acquire();
  }
  let service;
  try {
    const init = require('../vendor/sql-wasm.cjs');
    const SQL = await init({ wasmBinary: fs.readFileSync(path.join(__dirname, '../vendor/sql-wasm.wasm')) });
    const repository = await openRepository({ file: path.join(directory, 'history.sqlite'), SQL });
    service = createHistoryService({ repository, collector: createCollector() });
    service.initialize();
    const timer = setInterval(() => service.tick(), 1000);
    let closed = false;
    return { service, directory, close() { if (closed) return; closed = true; clearInterval(timer); try { service.close(); } finally { fs.unlinkSync(lock); } } };
  } catch (error) { try { service?.close(); } finally { fs.unlinkSync(lock); } throw error; }
}
module.exports = { bootstrap };
