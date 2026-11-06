const { test } = require('node:test');
const assert = require('node:assert/strict');
test('local calendar ranges and inclusive custom end date', async () => {
  const { dateRange } = await import('../src/domain/format.ts');
  const now = new Date(2026, 10, 6, 14);
  assert.deepEqual(dateRange('today', '', '', now), { from: new Date(2026, 10, 6).getTime(), to: new Date(2026, 10, 7).getTime() });
  assert.deepEqual(dateRange('yesterday', '', '', now), { from: new Date(2026, 10, 5).getTime(), to: new Date(2026, 10, 6).getTime() });
  assert.equal(dateRange('week', '', '', now).from, new Date(2026, 9, 31).getTime());
  assert.equal(dateRange('custom', '2026-11-06', '2026-11-06').to, new Date(2026, 10, 7).getTime());
  assert.throws(() => dateRange('custom', '2026-02-30', '2026-03-01'));
  assert.throws(() => dateRange('custom', '2026-11-07', '2026-11-06'));
});
test('literal highlight safely handles regex and HTML-like text', async () => {
  const { highlight, duration } = await import('../src/domain/format.ts');
  assert.deepEqual(highlight('<script>A.*a.*', 'a.*'), [{ text: '<script>', match: false }, { text: 'A.*', match: true }, { text: 'a.*', match: true }]);
  assert.equal(duration(3600000), '1 小时 0 分');
});
