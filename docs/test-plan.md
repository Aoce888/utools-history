# 自动化测试计划

## 可重复检查

使用 Node.js 22.18+，`npm ci` 后执行：

1. `npm run check`：adapter 协议、首次同意、暂停、排除、合并、锁屏/空闲/长间隔、故障状态、SQLite 重开、日期/搜索/分页/统计、保留期、删除、损坏/未来 schema、原子保存失败及 CSV 注入测试；同时执行 Vue TS 检查和构建。
2. `npx playwright install chromium`，`npm run test:ui`：引导、键盘、搜索、确认删除、偏好、主题、窄窗口、10 万条 fixtures 的分页与 DOM 有界性。可用 `PW_CHANNEL=msedge` 运行已安装 Edge。
3. Windows 交互桌面运行 `npm run test:windows`：生产 preload 加载本地 WASM，真实 Win32 → SQLite、暂停和重开。无交互前台时明确跳过，不将跳过记为通过。
4. `npm run benchmark`：临时生成 10 万条 fixtures，测 5 类关键词、两页检索、统计、落盘与文件体积；结果写入 `docs/performance-results.json`。它不是宿主端到端性能。

生产构建应包含 index.html、plugin.json、logo、preload、采集/service/storage 模块、WASM 及许可；manifest 不包含 development 地址。测试数据只存在于 `tests/` 或临时目录，不写进用户历史。界面截图明确标为 TEST FIXTURE。

## 无法自动化的验收

统一见 [待人工验证清单](manual-verification.md)，不再按里程碑逐项等待确认。填写实际 Windows/uTools 版本和证据后才能宣布宿主验收通过。
