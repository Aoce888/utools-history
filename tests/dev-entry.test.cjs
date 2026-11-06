const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('uTools development entry matches the dedicated strict Vite port', async () => {
  const { default: config } = await import('../vite.config.mjs');
  const manifest = JSON.parse(fs.readFileSync('public/plugin.json', 'utf8'));
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 5197);
  assert.equal(config.server.strictPort, true);
  assert.equal(manifest.development.main, `http://${config.server.host}:${config.server.port}`);
});
