<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ActivityRecord, DeleteQuery } from './domain/bridge'
import { useHistory } from './stores/useHistory'
import { duration, dayLabel, timeLabel } from './domain/format'
import AppIcon from './components/AppIcon.vue'
import HistoryTimeline from './components/HistoryTimeline.vue'
import ModalDialog from './components/ModalDialog.vue'
import OnboardingView from './views/OnboardingView.vue'
import SettingsView from './views/SettingsView.vue'
import StatisticsView from './views/StatisticsView.vue'
const { settings, status, records, apps, stats, error, loading, busy, ready, nextCursor, q, preset, startDate, endDate, appId, search, refreshStatus, refreshStats, initialize, updateSettings, toggle, remove, exportData, dispose } = useHistory()
const view = ref('history'), detail = ref<ActivityRecord>(), confirmation = ref<DeleteQuery>(), notice = ref('')
const searchInput = ref<HTMLInputElement>(), timeline = ref<InstanceType<typeof HistoryTimeline>>()
const labels = { not_started: '尚未开始', recording: '记录中', paused: '已暂停', unavailable: '采集不可用' }
let poll: ReturnType<typeof setInterval>, debounce: ReturnType<typeof setTimeout>, polling = false
watch(() => settings.value.theme, theme => { document.documentElement.dataset.theme = theme }, { immediate: true })
watch(() => settings.value.consent, async consent => { if (consent) { await nextTick(); searchInput.value?.focus() } })
watch([q, preset, startDate, endDate, appId], () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { timeline.value?.reset(); void search(); void refreshStats() }, 120)
})
watch(view, async value => { if (value === 'statistics') await refreshStats(); if (value === 'history') { await nextTick(); searchInput.value?.focus() } })
function keyboard(event: KeyboardEvent) {
  if (detail.value || confirmation.value) return
  const target = event.target as HTMLElement
  if (event.key === 'Escape') { if (view.value !== 'history') view.value = 'history'; else if (q.value) q.value = ''; searchInput.value?.focus(); return }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); view.value = 'history'; nextTick(() => searchInput.value?.focus()); return }
  if (view.value !== 'history' || ['TEXTAREA', 'SELECT'].includes(target.tagName) || (target.tagName === 'INPUT' && target !== searchInput.value)) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); timeline.value?.move(event.key === 'ArrowDown' ? 1 : -1) }
  if (event.key === 'Enter' && target === searchInput.value) { event.preventDefault(); timeline.value?.openSelected() }
}
async function confirmDeletion() { if (!confirmation.value) return; await remove(confirmation.value); if (!error.value) { confirmation.value = undefined; detail.value = undefined; notice.value = '历史已删除' } }
async function copyTitle() { try { await navigator.clipboard.writeText(detail.value?.windowTitle || ''); notice.value = '标题已复制' } catch { error.value = '复制失败，请手动选择标题复制' } }
async function excludeApp() { if (!detail.value) return; await updateSettings({ excludedApps: [...settings.value.excludedApps, detail.value.appId] }); if (!error.value) { detail.value = undefined; notice.value = '已排除该应用；已有记录仍保留，可单独删除' } }
onMounted(async () => {
  document.addEventListener('keydown', keyboard)
  await initialize(); await nextTick(); searchInput.value?.focus()
  if (window.utools) window.utools.onPluginEnter(() => { nextTick(() => searchInput.value?.focus()); void refreshStatus().catch(() => {}) })
  poll = setInterval(async () => {
    if (polling || busy.value || !ready.value) return
    polling = true
    try { const previous = status.value.revision; await refreshStatus(); if (status.value.revision !== previous && !loading.value && records.value.length <= 80 && !detail.value && !confirmation.value) { if (view.value === 'history') await search(); if (view.value === 'statistics') await refreshStats() } }
    catch (e) { error.value = (e as Error).message }
    finally { polling = false }
  }, 3000)
})
onUnmounted(() => { clearInterval(poll); clearTimeout(debounce); document.removeEventListener('keydown', keyboard); dispose() })
</script>
<template>
  <div class="app-shell">
    <aside class="sidebar"><div class="brand-symbol"><AppIcon name="history" :size="25" /></div><nav aria-label="主导航"><button v-for="tab in [{ id: 'history', icon: 'history', label: '历史' }, { id: 'statistics', icon: 'chart', label: '统计' }, { id: 'settings', icon: 'settings', label: '设置' }]" :key="tab.id" :class="{ active: view === tab.id }" :aria-label="tab.label" :aria-current="view === tab.id ? 'page' : undefined" @click="view = tab.id"><AppIcon :name="tab.icon" /><span>{{ tab.label }}</span></button></nav><span class="sidebar-end"><AppIcon name="shield" :size="18" /></span></aside>
    <main class="workspace"><header class="app-header"><div><span class="eyebrow">YOUR LOCAL MEMORY</span><h1>操作历史<span class="version-label">PREVIEW</span></h1><p>找回你在电脑上做过的事</p></div><button class="status-pill" :class="status.state" :disabled="busy || !ready || !settings.consent" @click="toggle"><span class="status-dot" />{{ labels[status.state] }}<AppIcon :name="status.state === 'recording' ? 'pause' : 'play'" :size="13" /></button></header>
      <div v-if="error" class="error-banner" role="alert"><span>{{ error }}</span><button class="button subtle" @click="initialize">重试</button></div>
      <div v-if="notice" class="notice" role="status">{{ notice }}<button class="icon-button" aria-label="关闭通知" @click="notice = ''"><AppIcon name="close" :size="15" /></button></div>
      <div v-if="loading && !ready" class="empty-state" role="status">正在打开本地数据库…</div>
      <OnboardingView v-else-if="ready && !settings.consent && view !== 'settings'" :busy="busy" @start="updateSettings({ consent: true, paused: false })" @settings="view = 'settings'" />
      <template v-else-if="ready">
        <template v-if="view !== 'settings'"><div class="search-box" v-if="view === 'history'"><AppIcon name="search" /><input ref="searchInput" v-model="q" aria-label="搜索应用或窗口标题" placeholder="搜索应用、窗口标题…" maxlength="500" /><kbd>Ctrl K</kbd><button v-if="q" class="icon-button" aria-label="清除搜索" @click="q = ''"><AppIcon name="close" :size="16" /></button></div><div class="filter-bar"><div class="date-chips" role="group" aria-label="日期筛选"><button v-for="tab in [{ id: 'all', label: '全部' }, { id: 'today', label: '今天' }, { id: 'yesterday', label: '昨天' }, { id: 'week', label: '近 7 天' }, { id: 'custom', label: '自定义' }]" :key="tab.id" :class="{ active: preset === tab.id }" :aria-pressed="preset === tab.id" @click="preset = tab.id">{{ tab.label }}</button></div><select v-if="view === 'history'" v-model="appId" aria-label="应用筛选"><option value="">全部应用</option><option v-for="app in apps" :key="app.appId" :value="app.appId">{{ app.appName }}</option></select></div><div v-if="preset === 'custom'" class="date-range custom-range"><input type="date" aria-label="开始日期" v-model="startDate" /><span>至</span><input type="date" aria-label="结束日期" v-model="endDate" /></div></template>
        <section v-if="view === 'history'" class="history-section"><header class="section-heading"><h2>活动时间线 <span>{{ status.count }} 条本地记录</span></h2><button class="icon-button" aria-label="刷新时间线" @click="search(); timeline?.reset()"><AppIcon name="history" :size="16" /></button></header><div class="loading-line" :class="{ visible: loading }" role="status" :aria-label="loading ? '正在检索' : '检索完成'" /><HistoryTimeline ref="timeline" :records="records" :query="q" :loading="loading" :more="!!nextCursor" @detail="detail = $event" @more="search(true)" /></section>
        <StatisticsView v-else-if="view === 'statistics'" :stats="stats" />
        <SettingsView v-else :settings="settings" :busy="busy" :directory="status.directory" @save="updateSettings" @remove="confirmation = $event" @export="exportData" />
      </template>
      <footer class="app-footer"><span><AppIcon name="shield" :size="12" /> 本地保存 · {{ settings.retentionDays }} 天保留</span><span v-if="view === 'history'" class="keyboard-hint">↑↓ 选择 <kbd>Enter</kbd> 详情 <kbd>Esc</kbd> 返回</span><span v-else>HostXit</span></footer><p class="runtime-note" :title="status.message">{{ status.message || '仅在插件进程运行期间记录，不启用系统自启动' }}</p>
    </main>
    <ModalDialog v-if="detail" title="活动详情" @close="detail = undefined"><div class="detail-app"><span class="app-avatar">{{ detail.appName.slice(0, 1).toUpperCase() }}</span><div><h3>{{ detail.appName }}</h3><p>{{ detail.processName }}</p></div></div><p class="detail-title">{{ detail.windowTitle || '无可读取标题' }}</p><dl class="detail-meta"><div><dt>开始</dt><dd>{{ dayLabel(detail.startedAt) }} {{ timeLabel(detail.startedAt) }}</dd></div><div><dt>结束</dt><dd>{{ dayLabel(detail.endedAt) }} {{ timeLabel(detail.endedAt) }}</dd></div><div><dt>已观察时长</dt><dd>{{ duration(detail.durationMs) }}</dd></div></dl><p class="scope-note">窗口标题不包含可信 URL 或文件路径，因此无法直接重新打开。</p><div class="button-group"><button class="button primary" @click="copyTitle">复制标题</button><button class="button" :disabled="busy" @click="excludeApp">排除此应用</button><button class="button danger-text" @click="confirmation = { ids: [detail.id] }"><AppIcon name="trash" :size="15" /> 删除</button></div></ModalDialog>
    <ModalDialog v-if="confirmation" title="确认删除历史？" @close="confirmation = undefined"><p class="confirm-copy">{{ confirmation.all ? '将永久删除所有本地历史。' : confirmation.ids ? '将永久删除这条记录。' : '将永久删除所选日期范围内的记录。' }}此操作无法撤销，已导出的文件不会被删除。</p><div class="button-group"><button class="button" :disabled="busy" @click="confirmation = undefined">取消</button><button class="button destructive" :disabled="busy" @click="confirmDeletion">{{ busy ? '删除中…' : '确认删除' }}</button></div></ModalDialog>
  </div>
</template>
