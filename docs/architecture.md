# 架构与数据设计

## 模块职责

| 模块 | 职责 |
| --- | --- |
| `src/App.vue` | 页面导航、快捷键、详情和删除确认 |
| `src/stores/useHistory.ts` | 异步查询、请求序号、错误与操作状态 |
| `src/components/` | 虚拟列表、弹窗焦点管理、纯文本高亮和图标 |
| `src/views/` | 引导、设置、统计 |
| `src/domain/` | 桥接契约、本地日历日期范围与格式化 |
| `public/preload.js` | 有限接口、统一 `{ok,value/error}` 返回；宿主初始化和退出 |
| `public/service/bootstrap.cjs` | 数据路径、单写者锁、WASM 初始化、定时 flush 和清理 |
| `public/service/history.cjs` | 同意、暂停、排除、事件合并、分段、保留期、统计和导出 |
| `public/collector/adapter.cjs` | 固定参数启动 PowerShell、JSONL 验证与停止 |
| `public/collector/foreground.ps1` | 真实 Win32 窗口、进程、空闲、安全桌面采样 |
| `public/storage/repository.cjs` | SQLite schema、设置校验、参数化检索、删除与原子保存 |

原 M1 `controller.cjs` 和限时运行参数保留，用于独立实验。原模板 `Hello`、`ReadText` 组件仍保留为源码参考，已不挂载到主产品页面；`src/styles/` 是当前样式入口。

当前 UI 为单列桌面工具：顶部搜索/状态、单行筛选、56px 虚拟列表；首次同意嵌入历史区。设置/统计/导出由次级菜单进入，设置分组、统计与长标题分页，因此不建立网页式长滚动容器。键盘与焦点规则见 desktop-interactions.md；本轮未改采集/存储契约。

## 记录与设置

SQLite `PRAGMA user_version=1`。`activity_events` 包含 id、app_id、app_name、process_name、window_title、started_at、ended_at，时间为 epoch ms，结束时间不得早于开始时间。所有已写记录均有结束时间（最后实际观察时间），没有跨重启悬挂的“进行中”记录。索引为 `(started_at DESC,id DESC)` 与 `(app_id,started_at DESC)`。

`app_settings(key,value_json)` 保存 consent、paused、retentionDays、idleSeconds、excludedApps、theme。默认未同意、保留 30 天、空闲阈值 300 秒。进程排除忽略大小写和 `.exe` 后缀，生效前不向 repository 传入名称与标题。应用 ID 使用进程名，不能区分同名的不同安装来源。

时间筛选采用本地日历的半开区间 `[from,to)`，范围删除按开始时间判断；统计按请求区间裁剪时段。相同时间的分页以 id 打破并列，cursor 为 `startedAt:id`。关键词通过绑定参数和 LIKE 字面转义处理；UI 使用文本节点，不执行标题 HTML。没有恢复路径或 URL 字段，所以没有自动打开能力。

## 采集状态与边界

`not_started → recording ↔ paused`，故障进入 `unavailable`，用户可重试。首次同意后才启动子进程；已同意且未暂停时，在插件再次加载时自动启动。协调器与 UI 独立，未来可替换 collector，而无需重写查询和界面。

每秒读取公开 Win32 API；同进程、同标题、间隔不超过 4 秒的样本延长现有段；切换时前一段停在最后样本，未观察间隙不补算。安全桌面/无窗口/不可读进程会结束段；空闲达到阈值后将当前段裁剪到最后输入时刻。超过 4 秒或系统时间异常分段，超过 12 秒无心跳则停止并报错。无权限时不提权，空标题显示降级文案。

无隐藏常驻安装、自启动或执行策略绕过。helper 定期检查父进程，宿主退出后自行结束；退出 UI 不主动停止生产服务，是否后台存活取决于宿主。以上系统行为需要按人工清单实测。

## ADR：WASM SQLite 与保存策略

选择 sql.js WASM 避免 uTools Electron 原生扩展 ABI/架构依赖。JS/WASM 和 MIT 许可由 postinstall/prebuild 从锁定依赖复制到 public/vendor，生产不需要 node_modules 或联网下载 WASM。

SQLite 在内存中运行，只有一个写者；**不使用 WAL**，而是每 5 秒导出 SQLite 文件，写同目录 `.tmp`、fsync 后 rename。设置、删除、保留期清理与正常退出同步落盘。打开时 quick_check，拒绝更新版本或损坏数据库，不静默重置历史。上次成功快照保留到替换成功；临时文件不作为已提交数据。崩溃可能丢失最近约 5 秒。

写者使用 `writer.lock` 的排他创建与 PID 校验，存活实例拒绝第二个写者；死亡 PID 锁可恢复。空锁/无效 PID 或 PID 复用可能需要退出所有宿主后人工处理，避免猜测并覆盖数据库。磁盘失败使采集不可用，不继续显示正常记录。

保留期每小时及偏好保存时清理；删除 VACUUM 后原子保存，但不是安全擦除。全库内存和快照会占用内存/阻塞数十毫秒，10 万条基础性能见报告；更大规模应评估 worker/独立存储服务。没有备份轮转以免“已删除数据”仍藏在备份里；需要备份时由用户导出并自行管理。
