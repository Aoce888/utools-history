const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('preload reads UTF-8 and propagates missing-file errors', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'utools-history-'));
  try {
    const context = { window: {}, require };
    vm.runInNewContext(fs.readFileSync('public/preload.js', 'utf8'), context);
    const file = path.join(dir, 'example.txt');
    fs.writeFileSync(file, '????\nhello', 'utf8');
    assert.equal(await context.window.services.readText(file), '????\nhello');
    await assert.rejects(context.window.services.readText(path.join(dir, 'missing')), { code: 'ENOENT' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
