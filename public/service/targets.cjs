const path = require('node:path').win32;
function executablePath(value) {
  if (typeof value !== 'string' || !/^[a-z]:\\/i.test(value) || /[\x00-\x1f"<>|]/.test(value) || path.extname(value).toLowerCase() !== '.exe') return undefined;
  return path.normalize(value);
}
function createTargets(host, service, fs = require('node:fs')) {
  const cache = new Map();
  function resolve(id) {
    const target = executablePath(service.target(id));
    if (!target || !fs.existsSync(target) || !fs.statSync(target).isFile()) throw Error('此记录没有可用的应用路径，请重新采集或确认应用仍已安装');
    return target;
  }
  return {
    async appInfo(id) {
      let target; try { target = resolve(id); } catch { return { canOpen: false }; }
      if (!cache.has(target)) {
        try { const icon = host.getFileIconAsync ? await host.getFileIconAsync(target) : host.getFileIcon(target); if (typeof icon === 'string' && /^data:image\/(png|jpeg|x-icon|vnd.microsoft.icon);base64,/i.test(icon)) cache.set(target, icon); }
        catch {} if (cache.size > 200) cache.delete(cache.keys().next().value);
      }
      return { canOpen: true, icon: cache.get(target) };
    },
    async reopen(id) { const result = await host.shellOpenPath(resolve(id)); if (result) throw Error(String(result)); }
  };
}
module.exports = { executablePath, createTargets };
