const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync('dist/plugin.json', 'utf8'));
assert.equal(manifest.development, undefined, 'Production manifest must not point to dev server');
for (const file of ['index.html', manifest.main, manifest.logo, manifest.preload, 'collector/controller.cjs', 'collector/adapter.cjs', 'collector/foreground.ps1', 'service/bootstrap.cjs', 'service/history.cjs', 'vendor/sql-wasm.cjs', 'vendor/sql-wasm.wasm', 'vendor/sql.js-LICENSE', 'storage/repository.cjs']) {
  assert.ok(file && fs.statSync(path.join('dist', file)).size > 0, `Missing artifact: ${file}`);
}
console.log('Plugin artifacts verified');
