<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { ActivityRecord, DeleteQuery } from './domain/bridge'
import { useHistory } from './stores/useHistory'
import { duration, dayLabel, timeLabel } from './domain/format'
import AppIcon from './components/AppIcon.vue'
import HistoryTimeline from './components/HistoryTimeline.vue'
import ModalDialog from './components/ModalDialog.vue'
import OnboardingView from './views/OnboardingView.vue'
import SettingsView from './views/SettingsView.vue'
import StatisticsView from './views/StatisticsView.vue'

const history = useHistory()
const { settings, status, records, apps, stats, error, loading, busy, ready, nextCursor, matchTotal, queryFailed, q, preset, startDate, endDate, appId, search, refreshStatus, refreshStats, initialize, updateSettings, toggle, remove, exportData, dispose } = history
const view = ref('history'), menuOpen = ref(false), detail = ref<ActivityRecord>(), confirmation = ref<DeleteQuery>(), notice = ref('')
const shortcut = ref('history')
const hasFilters = computed(() => !!q.value.trim() || preset.value !== 'all' || !!appId.value)
const resultLabel = computed(() => loading.value ? '检索中…' : queryFailed.value ? '读取失败' : matchTotal.value === undefined ? `已加载 ${records.value.length}${nextCursor.value ? '+' : ''} 条` : `${matchTotal.value} 条${hasFilters.value ? '匹配' : '记录'}`)
const searchInput = ref<HTMLInputElement>(), menu = ref<HTMLElement>(), timeline = ref<InstanceType<typeof HistoryTimeline>>()
const detailPage = ref(0)
const detailPages = computed(() => Math.max(1, Math.ceil((detail.value?.windowTitle.length || 0) / 60)))
const detailText = computed(() => detail.value?.windowTitle.slice(detailPage.value * 60, (detailPage.value + 1) * 60) || '无可读取标题')
const labels = { not_started: '未启用', recording: '记录中', paused: '已暂停', unavailable: '不可用' }
let poll: ReturnType<typeof setInterval>, debounce: ReturnType<typeof setTimeout>, polling = false

function focusSearch() { nextTick(() => searchInput.value?.focus()) }
function returnToHistory() { view.value = 'history'; shortcut.value = 'history'; menuOpen.value = false; focusSearch() }
function resetFilters() { q.value = ''; preset.value = 'all'; appId.value = ''; startDate.value = ''; endDate.value = ''; timeline.value?.reset() }
function showAllHistory() { resetFilters(); returnToHistory() }
function activateSearch() { returnToHistory(); shortcut.value = 'search' }
function openView(value: string) { menuOpen.value = false; view.value = value; shortcut.value = value }
function toggleMenu() { menuOpen.value = !menuOpen.value; if (menuOpen.value) nextTick(() => menu.value?.querySelector<HTMLButtonElement>('button')?.focus()) }
function menuKeyboard(event: KeyboardEvent) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault(); event.stopPropagation()
  const buttons = [...(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || [])]
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length
  buttons[target]?.focus()
}
function outsideMenu(event: MouseEvent) { if (!(event.target as HTMLElement).closest('.more-controls')) menuOpen.value = false }
async function startRecording() { await updateSettings({ consent: true, paused: false }); if (!error.value) returnToHistory() }
async function exportFormat(format: 'json' | 'csv') { menuOpen.value = false; await exportData(format); focusSearch() }

watch(() => settings.value.consent, consent => { if (consent) returnToHistory() })
watch(detail, () => { detailPage.value = 0 })
watch([q, preset, startDate, endDate, appId], () => {
  clearTimeout(debounce)
  if (ready.value) loading.value = true
  debounce = setTimeout(() => { timeline.value?.reset(); if (ready.value) { void search(); if (view.value === 'statistics') void refreshStats() } }, 120)
})
watch(view, async value => { if (value === 'statistics') await refreshStats(); if (value === 'history') focusSearch() })
function keyboard(event: KeyboardEvent) {
  if (event.isComposing || detail.value || confirmation.value) return
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation()
    if (menuOpen.value) { menuOpen.value = false; focusSearch() }
    else if (view.value !== 'history') returnToHistory()
    else if (q.value) { q.value = ''; focusSearch() }
    else { window.utools?.hideMainWindow(); focusSearch() }
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); activateSearch(); return }
  if (menuOpen.value || view.value !== 'history' || event.target !== searchInput.value) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); timeline.value?.move(event.key === 'ArrowDown' ? 1 : -1) }
  if (event.key === 'Enter') { event.preventDefault(); timeline.value?.openSelected() }
}
async function confirmDeletion() { if (!confirmation.value) return; await remove(confirmation.value); if (!error.value) { confirmation.value = undefined; detail.value = undefined; notice.value = '历史已删除' } }
async function copyTitle() { try { await navigator.clipboard.writeText(detail.value?.windowTitle || ''); notice.value = '标题已复制' } catch { error.value = '复制失败，请手动复制标题' } }
async function excludeApp() { if (!detail.value) return; await updateSettings({ excludedApps: [...settings.value.excludedApps, detail.value.appId] }); if (!error.value) { detail.value = undefined; notice.value = '已排除此应用；已有记录需单独删除' } }
onMounted(async () => {
  document.addEventListener('keydown', keyboard); document.addEventListener('click', outsideMenu)
  focusSearch(); await initialize(); focusSearch()
  window.utools?.onPluginEnter(() => { detail.value = undefined; confirmation.value = undefined; showAllHistory(); void refreshStatus().then(() => { void search() }).catch(() => {}) })
  poll = setInterval(async () => {
    if (polling || busy.value || !ready.value) return
    polling = true
    try { const previous = status.value.revision; await refreshStatus(); if (status.value.revision !== previous && !loading.value && records.value.length <= 80 && !detail.value && !confirmation.value) { if (view.value === 'history') await search(); if (view.value === 'statistics') await refreshStats() } }
    catch (e) { error.value = (e as Error).message }
    finally { polling = false }
  }, 3000)
})
onUnmounted(() => { clearInterval(poll); clearTimeout(debounce); document.removeEventListener('keydown', keyboard); document.removeEventListener('click', outsideMenu); dispose() })
</script>

<template>
  <div class="app-shell">
    <aside class="shortcut-sidebar" aria-label="快捷功能栏">
      <nav class="shortcut-top" aria-label="主要功能"><button class="shortcut-button" :aria-current="shortcut === 'history' ? 'page' : undefined" title="历史：查看全部记录" aria-label="历史" @click="showAllHistory"><AppIcon name="history" /><span>历史</span></button><button class="shortcut-button" :aria-current="shortcut === 'search' ? 'page' : undefined" title="搜索：聚焦搜索框（Ctrl+K）" aria-label="搜索" @click="activateSearch"><AppIcon name="search" /><span>搜索</span></button><button class="shortcut-button" :aria-current="shortcut === 'statistics' ? 'page' : undefined" title="统计：查看应用活动时长" aria-label="统计" :disabled="!ready" @click="openView('statistics')"><AppIcon name="chart" /><span>统计</span></button></nav>
      <nav class="shortcut-bottom" aria-label="记录与设置"><button class="shortcut-button" :aria-current="shortcut === 'settings' ? 'page' : undefined" title="设置：记录偏好、排除与数据管理" aria-label="设置" :disabled="!ready" @click="openView('settings')"><AppIcon name="settings" /><span>设置</span></button></nav>
    </aside>
    <main class="workspace">
    <header v-if="view === 'history'" class="tool-header">
      <div class="search-box"><AppIcon name="search" :size="19" /><input ref="searchInput" v-model="q" aria-label="搜索应用或窗口标题" placeholder="搜索应用、窗口标题…" maxlength="500" :aria-activedescendant="timeline?.selectedId" aria-controls="history-results" @focus="view !== 'history' && returnToHistory()" /><button v-if="q" class="icon-button" aria-label="清除搜索" @click="q = ''; focusSearch()"><AppIcon name="close" :size="16" /></button></div>
          <button v-if="view === 'history'" class="status-pill" :class="status.state" :title="`${status.message || '仅在插件进程存活期间记录'}；点击暂停或继续`" :disabled="busy || !ready || !settings.consent" @click="toggle"><AppIcon :name="status.state === 'recording' ? 'pause' : 'play'" :size="16" />{{ labels[status.state] }}</button>
    </header>

    <div v-if="view !== 'settings'" class="tool-toolbar">
      <template v-if="view === 'history' || view === 'statistics'"><select v-model="preset" aria-label="日期筛选"><option value="all">全部日期</option><option value="today">今天</option><option value="yesterday">昨天</option><option value="week">近 7 天</option><option value="custom">自定义日期</option></select><select v-if="view === 'history'" v-model="appId" aria-label="应用筛选"><option value="">全部应用</option><option v-for="app in apps" :key="app.appId" :value="app.appId">{{ app.appName }}</option></select></template>
      <span v-if="view === 'history'" class="record-count" :title="`本地共 ${status.count} 条记录；此处显示当前筛选的匹配数`">{{ resultLabel }}</span>

      <div v-if="view === 'history'" class="more-controls"><button class="icon-button more-trigger" aria-label="更多操作" title="导出当前日期范围" aria-haspopup="menu" :aria-expanded="menuOpen" @click="toggleMenu">•••</button><div v-if="menuOpen" ref="menu" class="tool-menu" role="menu" aria-label="更多操作" @keydown="menuKeyboard"><button role="menuitem" :disabled="!ready || !settings.consent" @click="exportFormat('json')"><AppIcon name="download" :size="16" />导出 JSON</button><button role="menuitem" :disabled="!ready || !settings.consent" @click="exportFormat('csv')"><AppIcon name="download" :size="16" />导出 CSV</button></div></div>

    </div>
    <div v-if="preset === 'custom' && view !== 'settings'" class="date-range custom-range"><input type="date" aria-label="开始日期" v-model="startDate" /><span>至</span><input type="date" aria-label="结束日期" v-model="endDate" /></div>
    <div v-if="error" class="error-banner" role="alert"><span>{{ error }}</span><button class="button subtle" @click="initialize">重试</button></div>
    <div v-if="notice" class="notice" role="status"><span>{{ notice }}</span><button class="icon-button" aria-label="关闭通知" @click="notice = ''"><AppIcon name="close" :size="14" /></button></div>

    <section v-if="view === 'history'" class="history-section" aria-label="操作历史">
      <OnboardingView v-if="ready && !settings.consent" :busy="busy" :retention-days="settings.retentionDays" @start="startRecording" @settings="openView('settings')" />
      <div class="loading-line" :class="{ visible: loading }" role="status" :aria-label="loading ? '正在检索' : '检索完成'" />
      <HistoryTimeline ref="timeline" :records="records" :query="q" :loading="loading" :more="!!nextCursor" :enabled="settings.consent" :filtered="hasFilters" :failed="queryFailed" @detail="detail = $event" @more="search(true)" @clear="resetFilters(); focusSearch()" />
    </section>
    <StatisticsView v-else-if="view === 'statistics'" :stats="stats" />
    <SettingsView v-else :settings="settings" :busy="busy" :directory="status.directory" @save="updateSettings" @remove="confirmation = $event" @export="exportData" />

    <footer class="tool-footer"><span :title="status.message || '仅在插件进程存活期间记录，不安装自启动'">本地保存 · {{ settings.retentionDays }} 天</span><span class="keyboard-hint">↑↓ 选择 · Enter 详情 · Esc 返回</span></footer>

    <ModalDialog v-if="detail" title="活动详情" @close="detail = undefined"><div class="detail-app"><span class="app-avatar">{{ detail.appName.slice(0, 1).toUpperCase() }}</span><h3>{{ detail.appName }}</h3></div><p class="detail-title">{{ detailText }}</p><div v-if="detailPages > 1" class="pagination" aria-label="标题分页"><button class="button" :disabled="detailPage === 0" @click="detailPage--">上一段</button><span>{{ detailPage + 1 }}/{{ detailPages }}</span><button class="button" :disabled="detailPage + 1 >= detailPages" @click="detailPage++">下一段</button></div><dl class="detail-meta"><div><dt>开始</dt><dd>{{ dayLabel(detail.startedAt) }} {{ timeLabel(detail.startedAt) }}</dd></div><div><dt>结束</dt><dd>{{ dayLabel(detail.endedAt) }} {{ timeLabel(detail.endedAt) }}</dd></div><div><dt>已观察时长</dt><dd>{{ duration(detail.durationMs) }}</dd></div></dl><p class="scope-note">无可信 URL / 文件路径，不能直接重新打开。</p><div class="button-group"><button class="button primary" @click="copyTitle">复制标题</button><button class="button" :disabled="busy" @click="excludeApp">排除此应用</button><button class="button danger-text" @click="confirmation = { ids: [detail.id] }">删除</button></div></ModalDialog>
    <ModalDialog v-if="confirmation" title="确认删除历史？" @close="confirmation = undefined"><p class="confirm-copy">{{ confirmation.all ? '永久删除所有本地历史。' : confirmation.ids ? '永久删除这条记录。' : '永久删除所选日期范围内的记录。' }}无法撤销，已导出文件不会被删除。</p><div class="button-group"><button class="button" :disabled="busy" @click="confirmation = undefined">取消</button><button class="button destructive" :disabled="busy" @click="confirmDeletion">{{ busy ? '删除中…' : '确认删除' }}</button></div></ModalDialog>
    </main>
  </div>
</template>
