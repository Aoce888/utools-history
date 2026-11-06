const fs = require('node:fs')
const path = require('node:path')
const { createSpike } = require(path.join(__dirname, 'collector', 'controller.cjs'))
const { bootstrap } = require(path.join(__dirname, 'service', 'bootstrap.cjs'))
window.historySpike = createSpike()
let runtime, initialization, shuttingDown = false
function ready() {
  if (shuttingDown) return Promise.reject(Error('插件正在退出'))
  if (!initialization) initialization = bootstrap(window.utools).then(value => {
    if (shuttingDown) { value.close(); throw Error('插件已退出') }
    runtime = value
    return value
  }).catch(error => { initialization = undefined; throw error })
  return initialization
}
window.historyBridge = {}
let targets
for (const method of ['appInfo', 'reopen']) {
  window.historyBridge[method] = async id => {
    try { const { service } = await ready(); targets ||= require(path.join(__dirname, 'service/targets.cjs')).createTargets(window.utools, service); return { ok: true, value: await targets[method](id) } }
    catch (error) { return { ok: false, error: { code: 'APP_TARGET_ERROR', message: error.message } } }
  }
}
for (const method of ['status', 'start', 'pause', 'getSettings', 'updateSettings', 'search', 'stats', 'apps', 'deleteRecords', 'exportRecords']) {
  window.historyBridge[method] = async params => {
    try {
      const { service, directory } = await ready()
      const value = service[method](params)
      return { ok: true, value: method === 'status' ? { ...value, directory } : value }
    } catch (error) { return { ok: false, error: { code: 'HISTORY_ERROR', message: error.message || '本地服务不可用' } } }
  }
}
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  window.historySpike.stop()
  runtime?.close()
}
window.addEventListener('beforeunload', shutdown)
if (window.utools) {
  window.utools.onPluginOut(isKill => {
    if (isKill) shutdown()
    else window.historySpike.stop()
  })
  window.utools.onPluginReady(() => { ready().catch(() => {}) })
}

window.services = {
  readText: async (file) => {
    return await fs.promises.readFile(file, { encoding: 'utf-8' })
  }
}
