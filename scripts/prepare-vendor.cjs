const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve('public/vendor');
fs.mkdirSync(target, { recursive: true });
for (const [source, dest] of [['sql-wasm.js', 'sql-wasm.cjs'], ['sql-wasm.wasm', 'sql-wasm.wasm']]) {
  fs.copyFileSync(require.resolve(`sql.js/dist/${source}`), path.join(target, dest));
}
fs.copyFileSync(path.join(path.dirname(require.resolve('sql.js')), '..', 'LICENSE'), path.join(target, 'sql.js-LICENSE'));
