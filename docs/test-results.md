# 本次自动化结果 · 2026-11-06

环境：Windows 11 build 22631，Node.js 24.18.0；浏览器 UI 使用已安装 Microsoft Edge 的 headless 模式。未进行 uTools UI 自动化验收，亦未测试 Windows 10。

| 检查 | 结果 |
| --- | --- |
| 模块/领域/存储自动化测试 | 18 项通过（含退出生命周期与开发入口端口一致性回归） |
| Vue/TypeScript 检查 | 通过 |
| 生产构建和所有运行时依赖产物校验 | 通过 |
| 浏览器 UI 测试 | 本轮 8 项通过，含既有 5 项及 3 项紧凑视口/DPR 模拟；非真实 Windows DPI 验收 |
| Windows 集成 | 2 项通过：生产 preload/WASM/契约；真实 Win32→SQLite→暂停→重开 |
| 宿主后台、锁屏、休眠和长期性能 | 待人工验证 |

真实采集测试在临时目录内写入了包含标题的真实事件，随后删除临时数据；仅保存 [脱敏结果](windows-integration-results.json)。它证明基本链路可用，不证明所有窗口/权限场景或 uTools 运行时兼容。

10 万条合成记录基础测试：5 类关键词各测 20 次，整体检索 P95 约 **44.1 ms**；两页检索约 **1.3 ms**；统计约 **85.6 ms**；全库快照保存约 **38.5 ms**；SQLite 文件约 **18.2 MiB**。原始环境和结果见 [性能报告](performance-results.json)。这些是在本机 Node/WASM 中的暖查询，不是 uTools 端到端延迟，长期内存和采集开销仍待实机验证。

浅/深色 [界面截图](screenshots/) 经过视觉复查；截图使用 TEST FIXTURE 测试数据，不作为真实采集证据。CI 已配置 check、UI 和 benchmark，本地通过不等于远程 CI 已运行。

本轮生命周期修复重新执行 check 和 2 项 Windows 集成检查，均通过；界面代码未变，5 项浏览器测试结果沿用上一轮，没有宣称本轮重跑。宿主回调模拟与尚未验证的实际退出行为见 [排查记录](lifecycle-review.md)。预览 ZIP 随修复重新构建，包含修复后的 preload，不属于正式发布。

开发入口串项目修复：确认 5173 的进程来自 guanshi-analysis，将本项目 Vite 与 public/plugin.json 同步迁移到 127.0.0.1:5197。HTTP 实测 5197 返回操作历史 HTML，本项目原开发服务已自动重启到该端口；观市仍运行在 5173。check 再次通过；uTools 缓存配置的刷新/重载待人工验证。生产 manifest 无 development 地址，原预览 ZIP 不受此开发入口修改影响。

紧凑欢迎页修复后再次通过 18 项模块测试、类型检查、生产构建与产物校验、2 项真实 Windows 集成；8 项 UI 测试重新执行。旧欢迎页溢出由新增 3 项测试先复现失败，再修复通过。截图已复查，详见 rendering-review.md；uTools 真实缩放与重影核对仍待人工测试。
