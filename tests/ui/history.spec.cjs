const { test, expect } = require('@playwright/test');
// Browser-only fixtures injected by tests. The production app never generates history.
async function installBridge(page, { consent = true, count = 240, longTitle = false, statCount = 1 } = {}) {
  await page.addInitScript(({ consent, count, longTitle, statCount }) => {
    let settings = { consent, paused: false, retentionDays: 30, idleSeconds: 300, excludedApps: [], theme: 'system' };
    let state = consent ? 'recording' : 'not_started', revision = 0;
    let records = Array.from({ length: count }, (_, i) => ({ id: count - i, appId: i % 2 ? 'notepad' : 'chrome', appName: i % 2 ? 'Notepad' : 'Chrome', processName: i % 2 ? 'notepad' : 'chrome', windowTitle: `TEST FIXTURE 文档 ${i}`, startedAt: Date.now() - i * 60000, endedAt: Date.now() - i * 60000 + 10000, durationMs: 10000 }));
    if (longTitle && records[0]) records[0].windowTitle = '长标题测试'.repeat(200);
    window.__host = { hidden: 0, enter: undefined };
    window.utools = { hideMainWindow: () => { window.__host.hidden++; return true; }, onPluginEnter: cb => { window.__host.enter = cb; } };
    const ok = value => Promise.resolve({ ok: true, value });
    window.historyBridge = {
      status: () => ok({ state, revision, count: settings.consent ? records.length : 0, message: 'TEST BRIDGE — no real capture', directory: 'TEST-ONLY' }),
      getSettings: () => ok({ ...settings }),
      updateSettings: patch => { settings = { ...settings, ...patch }; if (settings.consent) state = settings.paused ? 'paused' : 'recording'; revision++; return ok({ ...settings }); },
      start: () => { state = 'recording'; settings.paused = false; return ok(); },
      pause: () => { state = 'paused'; settings.paused = true; return ok(); },
      search: query => {
        const items = records.filter(r => (!query.q || `${r.appName} ${r.windowTitle}`.toLowerCase().includes(query.q.toLowerCase())) && (!query.appId || r.appId === query.appId) && (query.from === undefined || r.startedAt >= query.from) && (query.to === undefined || r.startedAt < query.to));
        const start = Number(query.cursor || 0), end = start + query.limit;
        return ok({ items: items.slice(start, end), nextCursor: end < items.length ? String(end) : undefined });
      },
      apps: () => ok([{ appId: 'chrome', appName: 'Chrome' }, { appId: 'notepad', appName: 'Notepad' }]),
      stats: () => ok(Array.from({ length: statCount }, (_, i) => ({ appId: `app-${i}`, appName: `Test App ${i}`, durationMs: 600000 }))),
      deleteRecords: query => { const previous = records.length; records = records.filter(r => !query.all && !query.ids?.includes(r.id) && !(query.from <= r.startedAt && r.startedAt < query.to)); revision++; return ok(previous - records.length); },
      exportRecords: () => ok('[]'),
    };
  }, { consent, count, longTitle, statCount });
}

test('keyboard-only search, page continuation, menu, Esc and plugin re-entry', async ({ page }) => {
  await installBridge(page); await page.goto('/');
  const search = page.getByRole('textbox', { name: '搜索应用或窗口标题' });
  await expect(search).toBeFocused();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  for (let i = 0; i < 80; i++) await search.press('ArrowDown');
  await expect(page.locator('[aria-selected=true]')).toHaveAttribute('id', 'history-result-160');
  const selected = page.locator('#history-result-160');
  await expect(selected).toBeInViewport(); await search.press('Enter');
  await expect(page.getByRole('dialog', { name: '活动详情' })).toContainText('TEST FIXTURE 文档 80');
  await page.getByRole('dialog').press('Escape'); await expect(search).toBeFocused();
  await search.fill('不存在'); await expect(page.getByText('未找到历史记录')).toBeVisible();
  await search.press('Escape'); await expect(search).toHaveValue('');
  expect(await page.evaluate(() => window.__host.hidden)).toBe(0);
  await search.press('Escape'); expect(await page.evaluate(() => window.__host.hidden)).toBe(1);
  await page.getByRole('button', { name: '更多操作', exact: true }).focus();
  await page.keyboard.press('Enter'); await expect(page.getByRole('menuitem', { name: '设置', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: '应用统计' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(search).toBeFocused();
  await openSecondary(page, '设置');
  await page.evaluate(() => window.__host.enter({ code: 'history' }));
  await expect(search).toBeFocused(); await expect(page.getByRole('region', { name: '历史时间线' })).toBeVisible();
});

test('secondary panels and long details need no scrolling in a small tool window', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 360 });
  await installBridge(page, { longTitle: true, statCount: 20 }); await page.goto('/');
  const noOverflow = async selector => {
    const result = await page.locator(selector).evaluate(el => ({ vertical: el.scrollHeight > el.clientHeight + 1, horizontal: el.scrollWidth > el.clientWidth + 1 }));
    expect(result).toEqual({ vertical: false, horizontal: false });
  };
  await openSecondary(page, '设置');
  for (const name of ['记录偏好', '排除应用', '本地数据']) { await page.getByRole('button', { name, exact: true }).click(); await noOverflow('.settings-view'); }
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: '导出 JSON', exact: true }).click(); expect((await download).suggestedFilename()).toMatch(/\.json$/);
  await openSecondary(page, '统计'); await noOverflow('.stats-view');
  await page.getByRole('button', { name: '下一页', exact: true }).click(); await expect(page.locator('.stat-row').first()).toContainText('Test App 3');
  await page.keyboard.press('Escape'); await page.getByRole('textbox', { name: '搜索应用或窗口标题' }).press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible(); await noOverflow('.modal-panel');
  await expect(page.getByRole('button', { name: '下一段' })).toBeVisible();
  await page.getByRole('button', { name: '下一段' }).click(); await noOverflow('.modal-panel');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

async function openSecondary(page, name) {
  await page.getByRole('button', { name: '更多操作', exact: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
test('first-run consent, autofocus, search, keyboard detail and delete confirmation', async ({ page }) => {
  await installBridge(page, { consent: false, count: 0 }); await page.goto('/');
  await expect(page.getByRole('button', { name: '同意并开始记录' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '搜索应用或窗口标题' })).toBeFocused();
  await page.getByRole('button', { name: '同意并开始记录' }).click();
  await expect(page.getByRole('textbox', { name: '搜索应用或窗口标题' })).toBeVisible();
  await expect(page.getByText('未找到历史记录')).toBeVisible();
});
test('search, navigation, virtualization, details, pause, settings and deletion', async ({ page }) => {
  await installBridge(page); await page.goto('/');
  const search = page.getByRole('textbox', { name: '搜索应用或窗口标题' });
  await expect(search).toBeFocused();
  await expect(page.locator('.event-row')).not.toHaveCount(80);
  await search.fill('文档 12');
  await expect(page.locator('.event-copy b').first()).toContainText('文档 12');
  await search.press('ArrowDown'); await search.press('Enter');
  await expect(page.getByRole('dialog', { name: '活动详情' })).toBeVisible();
  await expect(page.getByRole('button', { name: '重新打开' })).toHaveCount(0);
  await page.getByRole('button', { name: '删除', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '确认删除历史？' })).toBeVisible();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.getByRole('dialog', { name: '活动详情' }).press('Escape');
  await page.getByRole('button', { name: '记录中', exact: true }).click();
  await expect(page.getByRole('button', { name: '已暂停', exact: true })).toBeVisible();
  await openSecondary(page, '设置');
  await page.getByLabel('界面主题').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: '本地数据', exact: true }).click();
  await page.getByRole('button', { name: '清空所有历史' }).click(); await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /返回历史/ }).click();
  await expect(page.getByText('未找到历史记录')).toBeVisible();
});
test('responsive light/dark views remain within viewport', async ({ page }) => {
  await installBridge(page); await page.goto('/');
  await expect(page.locator('.event-row').first()).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/history-light-test-fixtures.png' });
  await openSecondary(page, '设置'); await page.getByLabel('界面主题').selectOption('dark');
  await page.getByRole('button', { name: /返回历史/ }).click();
  await page.screenshot({ path: 'docs/screenshots/history-dark-test-fixtures.png' });
  await page.setViewportSize({ width: 600, height: 544 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('without host bridge, show honest error and no fabricated history', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('alert')).toContainText('请在 Windows uTools 中加载插件');
  await expect(page.locator('.event-row')).toHaveCount(0);
});
test('100k fixture dataset paginates with bounded DOM, date and app filters', async ({ page }) => {
  await installBridge(page, { count: 100000 }); await page.goto('/');
  await expect(page.locator('.event-row').first()).toBeVisible();
  expect(await page.locator('.event-row').count()).toBeLessThan(20);
  const region = page.getByRole('region', { name: '历史时间线' });
  await region.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await page.getByRole('button', { name: '加载更多记录' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('option', { name: 'Chrome TEST FIXTURE 文档 80 查看详情', exact: true })).toBeAttached();
  expect(await page.locator('.event-row').count()).toBeLessThan(20);
  await page.getByRole('combobox', { name: '应用筛选' }).selectOption('notepad');
  await expect(page.locator('.event-copy > span').first()).toHaveText('Notepad');
  await page.getByRole('combobox', { name: '日期筛选' }).selectOption('yesterday');
  await expect(page.locator('.event-row').first()).toBeVisible();
  await page.getByRole('combobox', { name: '日期筛选' }).selectOption('custom');
  await page.getByLabel('开始日期', { exact: true }).fill('2000-01-01');
  await page.getByLabel('结束日期', { exact: true }).fill('2000-01-02');
  await expect(page.getByText('未找到历史记录')).toBeVisible();
});

for (const scale of [1, 1.25, 1.5]) {
  test(`compact onboarding and timeline fit at emulated DPR ${scale}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 600, height: 400 }, deviceScaleFactor: scale });
    const page = await context.newPage();
    try {
      await installBridge(page, { consent: false }); await page.goto('/');
      await expect(page.locator('.onboarding')).toBeVisible();
      for (const size of [{ width: 800, height: 544 }, { width: 600, height: 400 }, { width: 480, height: 360 }]) {
        await page.setViewportSize(size);
        const geometry = await page.locator('.onboarding').evaluate(element => {
          const button = element.querySelector('button'); const rect = button.getBoundingClientRect();
          return { scroll: element.scrollHeight > element.clientHeight + 1, buttonTop: rect.top, buttonBottom: rect.bottom, screenHeight: innerHeight, pageOverflow: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth };
        });
        expect(geometry.scroll, `onboarding should not scroll at ${size.width}x${size.height}`).toBe(false);
        expect(geometry.pageOverflow).toBe(false);
        expect(geometry.buttonTop).toBeGreaterThan(0); expect(geometry.buttonBottom).toBeLessThanOrEqual(geometry.screenHeight);
      }
      await page.screenshot({ path: `docs/screenshots/onboarding-compact-dpr-${scale}-test.png` });
      await page.getByRole('button', { name: /开始记录/ }).click();
      const search = page.getByRole('textbox', { name: '搜索应用或窗口标题' });
      await expect(search).toBeFocused(); await expect(page.getByRole('region', { name: '历史时间线' })).toBeVisible();
      const region = await page.getByRole('region', { name: '历史时间线' }).boundingBox(); expect(region.height).toBeGreaterThanOrEqual(70);
      await search.fill('文档 12'); await expect(page.locator('.event-copy b').first()).toContainText('文档 12');
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  });
}
