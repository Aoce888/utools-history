# 宿主主题与双栏调整

当前使用固定 60px 快捷栏与右侧工作区，历史入口清除筛选回到全部日期；搜索入口只返回历史并聚焦。当前结果数量取查询 total，分页不改变匹配总数；加载、失败与空结果分别显示，旧数据不因未启用采集而隐藏。

主题依据当前官方文档 https://www.u-tools.cn/docs/api-reference/system.html 的 isDarkColors 节：API 可判断宿主深色，界面推荐 prefers-color-scheme，并提供 matchMedia change 示例。本项目直接使用响应式 CSS 媒体查询，主题改变即重算全局变量，无需 JS 轮询、重启或虚构主题事件。历史数据库中的 theme 设置保留以兼容旧文件，但 UI 不再读取它，不提供独立切换。

所有界面共享白/灰/黑中性变量，选中、悬停、弹层和表单同源。浏览器自动化模拟主题切换及紧凑视口，不能代替真实 uTools 环境：实际宿主浅/深色切换、Windows DPI 及字体渲染仍待人工验证，不标记通过。

补充：旧数据库 theme 键已在打开时迁移删除，桥接设置不再接受 theme。只保留官方推荐 prefers-color-scheme 的 CSS 样式映射，没有并行主题状态。
