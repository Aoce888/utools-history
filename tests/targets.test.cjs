const { test } = require('node:test');
const assert = require('node:assert/strict');
const { executablePath, createTargets } = require('../public/service/targets.cjs');
test('only recorded existing local executable targets can be reopened without arguments', async () => {
  for (const value of ['https://example.com', '\\\\server\\a.exe', 'C:\\a.cmd', 'C:\\a.exe" -bad', undefined]) assert.equal(executablePath(value), undefined);
  let opened;
  const api = createTargets({ shellOpenPath: async value => { opened = value; }, getFileIcon: () => 'data:image/png;base64,AA==' }, { target: id => id === 1 ? 'C:\\Apps\\test.exe' : undefined }, { existsSync: () => true, statSync: () => ({ isFile: () => true }) });
  assert.equal((await api.appInfo(1)).canOpen, true); await api.reopen(1); assert.equal(opened, 'C:\\Apps\\test.exe');
  await assert.rejects(api.reopen(2)); assert.equal((await api.appInfo(2)).canOpen, false);
});
