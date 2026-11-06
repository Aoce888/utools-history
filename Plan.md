# 操作历史（uTools History）— 产品与开发计划

> 项目名：`utools-history`  
> 插件名称：**操作历史**  
> 品牌：**Host × IT / HostXit**  
> 首发平台：**Windows 10/11**  
> 技术起点：已创建的 **Vue 3 + Vite uTools 工程**  
> 阶段：MVP → Windows 实机测试 → 内测迭代  
> 文档用途：供 AI 编程助手直接按阶段实现、运行和验收。

## 1. 产品目标

### 一句话定位

**找回你在电脑上做过的事。**

用户通过 uTools 搜索“操作历史”，快速查询过去使用过的应用、窗口标题、时间段，并尽可能重新打开可恢复的网页或文件。

### 核心场景

1. “刚才打开的那个窗口叫什么？” → 查看最近活动。
2. “昨天下午在做什么？” → 按时间查看活动时间线。
3. “上午用哪个软件看过这个内容？” → 搜索标题/应用名。
4. “今天时间花在哪里？” → 按应用统计实际活跃时间。
5. “不想记录某个应用。” → 一键暂停、排除和删除记录。

### 成功标准（研发目标，不是已实现能力）

- 首次进入，**30 秒内理解用途并完成授权选择**；不需要登录。
- 打开插件，搜索框自动聚焦；输入关键字即有结果。
- 有效前台窗口切换在 **≤2 秒**内进入记录（正常运行环境、采集进程健康时）。
- 10 万条模拟历史下，普通关键词搜索 **P95 <150ms**（以目标测试机为准）。
- 本地默认保存，**不上传任何操作数据**。
- 长时间运行中 CPU、内存和数据库体积受到约束；使用实际测试报告决定上线阈值。
- 免费核心功能无需 HostXit 账号，品牌露出克制。

## 2. 版本边界

### MVP（必须交付）

- 首次使用的简洁引导 + 明确开始记录按钮。
- Windows 前台窗口活动采集：应用/进程名、窗口标题、开始时间、结束时间、持续时间。
- 对连续重复窗口做事件合并；锁屏、休眠、空闲和重启等场景正确处理或明确标记未知。
- 轻量持久化本地历史，按时间降序查看。
- 统一搜索：标题、应用名；时间筛选（今天、昨天、近 7 天、自定义日期范围）。
- 键盘操作：打开即聚焦、↑↓ 切换、Enter 查看详情、Esc 返回。
- 一键暂停/恢复、排除应用、删除单条/时间范围、清空所有记录。
- 应用活跃时间统计（仅由有效记录计算，不能把锁屏/空闲计算成使用时间）。
- 记录状态可见：记录中 / 已暂停 / 采集不可用 / 需要设置。
- 空状态、加载态、错误态、黑白主题、基本可访问性。
- 自动化单测、构建与 Windows 实机验收文档。

### MVP 允许的能力限制

- **默认不截屏**、不录音、不录键盘、不读取剪贴板、不抓取网页正文、不记录密码。
- 只靠窗口标题 **不能保证恢复网页 URL 或文件路径**。MVP 对此展示标题与应用，只有已获得可信 URL/路径的记录才显示“打开”操作。
- 不承诺每个应用的窗口标题都代表具体文件，若取不到就显示“未知标题”或应用名称。
- 浏览器 URL 精确采集、按文件路径恢复、屏幕画面回溯均进入后续版本，不能伪造。

### 后续阶段（不阻塞 MVP）

- 用户明确启用的浏览器扩展，采集可打开的 URL（独立权限和说明）。
- 自选文件夹或授权目录下的最近文件索引。
- 自然语言时间查询：“昨天下午的 PDF”。
- 可选择的屏幕快照时间轴：单独授权、敏感应用排除、本地加密及容量控制。
- 可选 HostXit 加密备份/跨设备同步（独立同意、隐私政策、数据删除能力）。

## 3. 交互设计：搜索优先、时间线辅助

### 主界面（uTools 紧凑窗口）

```text
┌──────────────────────────────────────────────────────────┐
│  ◷ 操作历史                              ● 记录中  ⚙   │
│  找回你在电脑上做过的事                               │
├──────────────────────────────────────────────────────────┤
│  🔎 搜索应用、窗口标题...                               │
│  [全部] [今天] [昨天] [近7天]   [应用筛选] [日期]       │
│                                                          │
│  今天                                                    │
│  14:32  🌐 Chrome       uTools 开发文档           12 分钟│
│  14:18  📝 Word         项目计划书                14 分钟│
│  13:46  📁 Explorer     设计素材                   6 分钟│
│                                                          │
│  ↑↓ 选择  Enter 详情  Esc 返回         本地保存 · 暂停  │
└──────────────────────────────────────────────────────────┘
```

> 以上为虚拟数据的界面草图，正式版本必须使用真实采集结果。

### 主要流程

1. 第一次打开：说明采集范围和本地存储 → 用户主动点击“开始记录” → 显示状态；拒绝时仍可查看演示说明/设置，但不会后台采集。
2. 再次打开：光标直接在搜索框；默认显示最近记录，不强制切换页面。
3. 搜索结果：按时间倒序，匹配关键词高亮；结果有时间、应用、标题和时长。
4. 单击/Enter：记录详情；若存在可信可恢复路径/URL，提供“打开”；否则提供“复制标题”。
5. 顶部状态按钮：暂停/继续，并清晰说明暂停生效。
6. 设置：排除应用、数据保留期（建议初始 30 天）、自动启动、存储信息、数据删除和导出。

### 视觉规范

- 现代轻量桌面风格；清晰层级，保留留白，不制作多余仪表盘或炫酷动画。
- 字体优先系统 UI 字体；适配高 DPI/缩放，中文长标题截断并可查看全文。
- 深色/浅色跟随系统或 uTools 主题；色彩仅用于状态与少量交互强调。
- 紧凑窗口不横向滚动；长列表虚拟化；时间、应用图标、标题可快速扫读。
- 动效控制在 120–180ms，尊重系统减少动态效果设置。

## 4. 技术架构

```text
uTools 搜索入口
   ↓
Vue 3 + Vite + TypeScript UI
   ↕（严格类型化 API）
preload.js（Node.js 桥接）
   ↕
本地服务协调器（health / start / stop / search / settings）
   ↕
Windows Activity Collector（候选：独立轻量进程）
   ↓
本机 SQLite（events, settings, schema_version）
```

### 4.1 关键技术决策：先做 P0 采集可行性实验

uTools 文档提供 `onPluginReady`、`onPluginEnter`、`onPluginOut` 等事件，并支持插件进入后台运行；但“进入后台”与“永久可靠采集”不是同一回事。**先不要默认插件可以持续监控。**

**P0 实验要求：**

1. 用 uTools 真实开发环境验证插件退出搜索面板后是否持续执行；测试“退出到后台立即结束运行”和“跟随主程序同时启动运行”的不同配置。
2. 验证 uTools 主程序重启、Windows 登录、睡眠/唤醒、系统锁屏、插件被手动结束后，各状态的实际表现。
3. Windows 活动窗口采集优先用公开 Win32 API：`GetForegroundWindow`、`GetWindowThreadProcessId`、`GetWindowTextW`；应用进程标识用可用权限查询，不使用键盘钩子。
4. 优先使用**系统窗口前台变更事件通知**（如适用的 WinEventHook）而不是持续极高频轮询；仍要有失效恢复与低频校验策略。
5. 比较纯 Node.js 能力、可验证的兼容依赖以及小型独立 Windows helper 进程的稳定性、签名和打包难度。
6. 若 uTools 生命周期无法保证持续采集，选择明确告知用户并取得同意的独立辅助进程；**不要隐蔽常驻、自启动或绕过平台权限**。
7. 如果辅助进程方案遇到市场审核、安装或更新障碍，则先降级为“插件实际运行期间的历史”，并在 UI 明示限制；不得宣传全天记录。

**P0 交付物：** `docs/feasibility.md`，含运行方式、采集字段、Windows 10/11 测试截图/日志、后台行为、故障处理、打包结论、Go/No-Go 判断。

### 4.2 数据模型（建议）

```sql
CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  process_name TEXT,
  window_title TEXT,
  started_at INTEGER NOT NULL,   -- epoch milliseconds
  ended_at INTEGER,              -- null = 进行中
  source TEXT NOT NULL DEFAULT 'foreground_window',
  is_private INTEGER NOT NULL DEFAULT 0,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX idx_events_started ON activity_events(started_at DESC);
CREATE INDEX idx_events_app_time ON activity_events(app_id, started_at DESC);
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
CREATE TABLE schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

- 表中不包含原始截图、按键、剪贴板、密码或浏览器 Cookie。
- **采集层**在排除应用生效前不能写入敏感应用数据；搜索隐藏不等于禁止采集。
- 原始事件按需合并，建议忽略闪过窗口或设最小时长（可配置），避免无意义数据爆炸。
- 每条记录同时保存开始和结束时间；锁屏、空闲、休眠发生时结束活跃段，重启后不能把整夜算成使用时间。
- 数据库操作走唯一写入通道；实现 WAL、迁移、崩溃恢复、保留期清理与备份策略。
- 数据路径必须使用 uTools 提供的适当本地数据目录或 OS 用户数据目录；不得随意写进项目源码目录。
- SQLite 方案要验证 Node/Electron 运行时和 Windows 二进制兼容性；如原生模块打包不可用，优先调整到兼容实现，而不是强行假设 `better-sqlite3` 能用。

### 4.3 模块规划

```text
utools-history/
├─ Plan.md
├─ public/
│  ├─ plugin.json
│  ├─ preload.js
│  └─ logo.png
├─ src/
│  ├─ app/              # 应用启动、状态
│  ├─ components/       # SearchBar, EventRow, Timeline, StatusPill
│  ├─ views/            # History, Detail, Statistics, Settings, Onboarding
│  ├─ stores/           # pinia 或轻量响应式状态
│  ├─ domain/           # Event, SearchQuery, Settings 等 TS 类型
│  └─ styles/           # tokens, themes, accessibility
├─ collector/           # Windows 采集器（P0 决定语言和部署形式）
├─ bridge/              # 与 preload 互通的有限接口（如适用）
├─ storage/             # SQLite schema + repository + migrations
├─ tests/               # unit + integration + fixtures
└─ docs/
   ├─ feasibility.md
   ├─ test-plan.md
   └─ release-checklist.md
```

> 根据已创建的 Vue + Vite 模板做最小改动；避免为了符合目录草图而重建整个工程。

### 4.4 preload 桥接接口（契约先行）

```ts
type ActivityRecord = {
  id: number;
  appId: string;
  appName: string;
  processName?: string;
  windowTitle?: string;
  startedAt: number;
  endedAt?: number;
};

type RecordingState = 'not_started' | 'recording' | 'paused' | 'unavailable';

interface HistoryBridge {
  getRecordingState(): Promise<RecordingState>;
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  search(params: { q: string; from?: number; to?: number; appId?: string; limit?: number; cursor?: string }): Promise<{ items: ActivityRecord[]; nextCursor?: string }>;
  getDailyStats(params: { from: number; to: number }): Promise<Array<{ appId: string; appName: string; durationMs: number }>>;
  getSettings(): Promise<Record<string, unknown>>;
  updateSettings(patch: Record<string, unknown>): Promise<void>;
  deleteRecords(params: { ids?: number[]; from?: number; to?: number; all?: boolean }): Promise<number>;
  exportRecords(params: { format: 'json' | 'csv'; from?: number; to?: number }): Promise<string>;
}
```

> 所有接口返回结构化错误；前端不得拼接 shell 命令；`open` 功能必须验证为可信路径/URL，并单独定义白名单操作。必须考虑 CSV 注入风险（危险公式前缀转义）。

## 5. AI 实施顺序（严格按里程碑）

### M0 — 检查现有工程（先执行）

- [ ] 检查 `package.json`、`vite.config.*`、`plugin.json` 和源码结构，不覆盖已有工程配置。
- [ ] 确认 Vue、Vite、TypeScript 与 uTools 运行环境的兼容性。
- [ ] 验证 `npm install`、`npm run dev`、`npm run build`（按实际脚本）。
- [ ] 验证 `dist/` 内有可用 `index.html`、`plugin.json`、`logo.png`、`preload.js`（若引用）。
- [ ] 建立 `docs/test-plan.md` 和可复现启动说明。

**验收：** uTools 开发者工具能加载一个最小页面；热更新或重载可用；构建没有报错。

### M1 — Windows 采集 Spike（最关键）

- [ ] 实现小型 Windows 前台窗口读取原型，并记录应用名、窗口标题、时间戳。
- [ ] 逐一验证最小化、窗口切换、浏览器、Office、资源管理器等场景。
- [ ] 在退出插件主界面、关闭/重启 uTools、Windows 休眠唤醒时验证采集行为。
- [ ] 对获取失败、无权限、空标题、系统进程做可解释降级。
- [ ] 出具真实测量 CPU、内存、事件丢失和记录延迟的报告。
- [ ] 形成后台运行的确定方案：插件常驻 / 明示安装 helper / 降级模式。

**验收：** 记录真实窗口事件；后台可行性有证据；没有偷偷启用额外系统权限。若无法满足，明确阻塞并提供替代方案，不假造“持续记录中”。

### M2 — 采集服务与数据层

- [ ] 根据 M1 确定采集器启动、关闭和故障恢复机制。
- [ ] 设计 SQLite 迁移与索引，记录开始/结束时间。
- [ ] 合并短时间同窗口的重复事件；处理应用切换、锁屏、空闲、休眠。
- [ ] 完成暂停、恢复、排除应用、删除范围、保留期清理。
- [ ] 通过 preload 提供稳定桥接，确保 UI 无法越权直接操作系统。

**验收：** 重启后历史仍在；暂停后不写入；排除应用不落库；崩溃恢复不会产生持续数小时的伪记录。

### M3 — 完整可用的 UI

- [ ] 主界面：搜索、时间过滤、时间线、状态按钮。
- [ ] 记录详情与应用统计；未取得可信文件路径的记录不出现虚假“重新打开”。
- [ ] 首次使用引导、设置页、删除确认、错误/空状态。
- [ ] 完整键盘导航、暗色/亮色适配、长列表虚拟化。
- [ ] 首页使用真实数据；模拟记录仅用于开发/测试模式。

**验收：** 新用户能在不看说明的情况下完成“开始记录 → 切换应用 → 搜索 → 查看详情 → 暂停 → 删除”。

### M4 — 测试与优化

- [ ] 使用 Vitest（或现有项目兼容测试框架）测试搜索过滤、事件合并、空闲分段、统计计算、数据迁移。
- [ ] 使用至少 10 万条假数据测试分页、检索延迟、虚拟滚动。
- [ ] Windows 10/11 的 DPI、双显示器、锁屏、休眠、权限不足、杀死进程、重启测试。
- [ ] 完成隐私审查：不采集敏感内容；设置变更后即时生效；本地删除可验证。
- [ ] 写 `docs/test-results.md`，包含通过/失败项、系统环境、资源占用与截图。

**验收：** 不存在 P0/P1 级阻塞缺陷；失败项记录在案；能重复复现构建与测试过程。

### M5 — 内测包

- [ ] 检查 uTools 开发者后台最新打包要求、市场审核要求和所使用的系统 API 权限。
- [ ] 生产包去除开发日志、测试数据与无用依赖。
- [ ] 将品牌、隐私说明、联系方式、版本号与更新记录补齐。
- [ ] 实机安装、卸载、升级、清理数据测试。
- [ ] 提供清楚的“是否开机运行、如何完全退出、如何删除所有记录”说明。

**验收：** 可供少量真实用户安装试用；不承诺尚未实现的全平台、截图回放、精准 URL 恢复。

## 6. 核心测试用例（必须执行）

| 编号 | 操作 | 预期结果 |
|---|---|---|
| T01 | 首次打开插件 | 未授权前不写入活动数据 |
| T02 | 点击开始记录，打开记事本 10 秒 | 出现真实应用及时间段 |
| T03 | Alt+Tab 在三个窗口间切换 | 记录顺序与时间正确，无大量重复记录 |
| T04 | 在输入框搜索窗口标题 | 结果即时过滤，空结果提示正确 |
| T05 | 选择“昨天” | 只显示对应本地日期范围的事件 |
| T06 | 暂停后继续切换应用 | 暂停期间不产生新活动记录 |
| T07 | 排除某应用并打开它 | 排除应用名称和标题均不写入历史 |
| T08 | 锁屏 5 分钟 | 这段时间不计入活跃使用时长 |
| T09 | 睡眠后唤醒 | 不出现横跨睡眠时间的虚假持续使用 |
| T10 | 关闭插件界面 | 根据 M1 实测行为采集或明确显示限制 |
| T11 | 重启 uTools/系统 | 历史仍在且运行状态与设置一致 |
| T12 | 删除单条、删除范围、清空 | 对应数据查询不到；清空后记录数为 0 |
| T13 | 输入中文、英文、特殊字符 | 搜索和显示正常，无 SQL 注入 |
| T14 | 导出 CSV | Excel 打开时不会把危险字段执行为公式 |
| T15 | 加载 10 万条模拟数据 | 滚动、分页和搜索满足性能目标或列出优化项 |
| T16 | 将浏览器标题含敏感词的应用排除 | 排除配置真实生效，不能只在 UI 隐藏 |
| T17 | Windows 125%/150% 缩放 | 字体、按钮和弹窗无明显遮挡 |
| T18 | 无法获取窗口信息 | 界面显示可解释状态，不崩溃 |

## 7. 隐私与信任要求

- 首次启动默认未记录；需要用户主动明确开启。
- 原始历史与统计全都本地处理，默认无账户、无网络上传。
- 不请求管理员权限，除非有非常明确的必要性及用户知情选择；优先避免。
- 对密码管理器、隐私浏览、系统安全窗口等敏感场景优先提供排除与最小化策略；敏感标题不可写入诊断日志。
- 用户始终可以一键暂停、关闭采集、设置排除列表、删除历史和关闭自启动。
- 删除与卸载的数据清理路径明确、可测试，避免残留不知情的后台进程。
- 如将来有 HostXit 在线服务，另行设计显式授权、传输加密、账户删除、隐私政策与服务端保留策略。

## 8. HostXit 获客设计（不干扰核心体验）

- 首发产品不要求注册账号，也不强制跳站。
- 在“关于”页展示“HostXit 出品”及官方网站链接。
- 后续仅在用户主动选择云同步/备份等功能时呈现相应服务入口。
- 不把历史记录变成广告素材，不在默认行为中上报搜索词、窗口标题或应用列表。
- 可选匿名产品统计也必须以清晰开关控制，默认关闭，且绝不上传活动历史。

## 9. 开发执行规则与交付物

给 AI 编程助手的执行要求：

1. **先检查已经生成的项目**，不要重新建仓库或替换现成 Vue + Vite 工程。
2. 按 M0 → M1 → M2 → M3 → M4 → M5 实施；每个里程碑完成后，实际运行相应构建/测试命令并报告结果。
3. **先验证 Windows 活动采集**，确认后再投入完整 UI；不能只做假的静态列表。
4. 不要猜测 uTools 后台生命周期、Windows 权限或第三方模块兼容性；验证并记录证据。
5. 遇到系统或审核限制时，提出可靠降级方案，不能伪造已实现能力。
6. 使用清晰的 TypeScript 类型、合理错误处理、必要注释和测试；避免过度设计。
7. 所有新功能先有可观察行为和验收项，再标为完成。
8. 每次里程碑交付：改动文件清单、启动命令、测试结果、未解决问题、下阶段计划。

### 首次交付目标

- 实际可运行的 uTools 插件框架；
- Windows 前台窗口采集实验及实测结论；
- 一条真实历史记录从采集到本地保存、再到 UI 显示的完整链路；
- 可暂停/可清空/可排除的最小控制；
- `docs/feasibility.md` + `docs/test-plan.md`。

## 10. 参考开发文档

- [uTools 插件应用架构](https://www.u-tools.cn/docs/development/plugin-architecture.html)
- [uTools plugin.json](https://www.u-tools.cn/docs/development/plugin-json.html)
- [uTools preload 桥接层](https://www.u-tools.cn/docs/development/preload.html)
- [uTools 插件调试](https://www.u-tools.cn/docs/developer/basic/debug-plugin.html)
- [Microsoft GetForegroundWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow)

> 本计划属于产品目标与技术实施规范，具体后台采集方案、依赖版本和实际性能数值以 Windows 实机 P0 验证结果为准。
