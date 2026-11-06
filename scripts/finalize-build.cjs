const fs = require('node:fs');
const file = 'dist/plugin.json';
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
delete manifest.development;
fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
