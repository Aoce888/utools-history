const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5188', viewport: { width: 900, height: 680 }, headless: true, channel: process.env.PW_CHANNEL || undefined },
  webServer: { command: 'npm run dev -- --port 5188 --host 127.0.0.1', url: 'http://127.0.0.1:5188', reuseExistingServer: false },
});
