const fs = require('node:fs')
const path = require('node:path')
const { createSpike } = require(path.join(__dirname, 'collector', 'controller.cjs'))
window.historySpike = createSpike()
window.addEventListener('beforeunload', () => window.historySpike.stop())
if (window.utools) window.utools.onPluginOut(() => window.historySpike.stop())

window.services = {
  readText: async (file) => {
    return await fs.promises.readFile(file, { encoding: 'utf-8' })
  }
}
