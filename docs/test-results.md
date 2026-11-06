# 本次自动化结果 · 2026-11-06

环境：Windows 11 build 22631，Node.js 24.18.0；浏览器 UI 使用已安装 Microsoft Edge 的 headless 模式。未进行 uTools UI 自动化验收，亦未测试 Windows 10。

| 检查 | 结果 |
| --- | --- |
| 模块/领域/存储自动化测试 | 15 项通过 |
| Vue/TypeScript 检查 | 通过 |
| 生产构建和所有运行时依赖产物校验 | 通过 |
| 浏览器 UI 测试 | 5 项通过，含 10 万条测试数据、分页、有界 DOM、键盘、主题、日期与应用筛选 |
| Windows 集成 | 2 项通过：生产 preload/WASM/契约；真实 Win32→SQLite→暂停→重开 |
| 宿主后台、锁屏、休眠和长期性能 | 待人工验证 |

真实采集测试在临时目录内写入了包含标题的真实事件，随后删除临时数据；仅保存 [脱敏结果](windows-integration-results.json)。它证明基本链路可用，不证明所有窗口/权限场景或 uTools 运行时兼容。

10 万条合成记录基础测试：5 类关键词各测 20 次，整体检索 P95 约 **44.1 ms**；两页检索约 **1.3 ms**；统计约 **85.6 ms**；全库快照保存约 **38.5 ms**；SQLite 文件约 **18.2 MiB**。原始环境和结果见 [性能报告](performance-results.json)。这些是在本机 Node/WASM 中的暖查询，不是 uTools 端到端延迟，长期内存和采集开销仍待实机验证。

浅/深色 [界面截图](screenshots/) 经过视觉复查；截图使用 TEST FIXTURE 测试数据，不作为真实采集证据。CI 已配置 check、UI 和 benchmark，本地通过不等于远程 CI 已运行。
