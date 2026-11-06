const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync('dist/plugin.json', 'utf8'));
for (const file of ['index.html', manifest.main, manifest.logo, manifest.preload, 'collector/controller.cjs', 'collector/foreground.ps1']) {
  assert.ok(file && fs.statSync(path.join('dist', file)).size > 0, `Missing artifact: ${file}`);
}
console.log('Plugin artifacts verified');
