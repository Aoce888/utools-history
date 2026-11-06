import { computed, ref } from 'vue'
import type { ActivityRecord, AppStats, AppSummary, DeleteQuery, Reply, ServiceStatus, Settings } from '../domain/bridge'
import { dateRange } from '../domain/format'

export function useHistory() {
  const bridge = window.historyBridge
  const settings = ref<Settings>({ consent: false, paused: false, retentionDays: 30, idleSeconds: 300, excludedApps: [] })
  const status = ref<ServiceStatus>({ state: 'unavailable', message: '', revision: 0, count: 0 })
  const records = ref<ActivityRecord[]>([]), apps = ref<AppSummary[]>([]), stats = ref<AppStats[]>([])
  const error = ref(''), loading = ref(false), busy = ref(false), ready = ref(false), nextCursor = ref<string>()
  const matchTotal = ref<number>()
  const queryFailed = ref(false), frequent = ref(false)
  const q = ref(''), preset = ref('all'), startDate = ref(''), endDate = ref(''), appId = ref('')
  const range = computed(() => dateRange(preset.value, startDate.value, endDate.value))
  let request = 0, alive = true
  async function unwrap<T>(promise: Promise<Reply<T>> | undefined): Promise<T> {
    if (!promise) throw Error('请在 Windows uTools 中加载插件。浏览器预览不提供历史数据。')
    const reply = await promise
    if (!reply.ok) throw Error(reply.error.message)
    return reply.value
  }
  async function search(more = false) {
    const token = ++request
    loading.value = true
    queryFailed.value = false
    try {
      const page = await unwrap(bridge?.search({ ...range.value, frequent: frequent.value, q: q.value.trim(), appId: appId.value || undefined, cursor: more ? nextCursor.value : undefined, limit: 80 }))
      if (token !== request || !alive) return
      records.value = more ? [...records.value, ...page.items] : page.items
      matchTotal.value = Number.isSafeInteger(page.total) && page.total! >= 0 ? page.total : undefined
      nextCursor.value = page.nextCursor
      error.value = ''
    } catch (e) { if (token === request && alive) { queryFailed.value = true; error.value = (e as Error).message; if (!more) { records.value = []; nextCursor.value = undefined; matchTotal.value = undefined } } }
    finally { if (token === request && alive) loading.value = false }
  }
  async function refreshStatus() { status.value = await unwrap(bridge?.status()) }
  async function refreshStats() {
    try { const r = range.value; stats.value = await unwrap(bridge?.stats({ from: r.from ?? 0, to: r.to ?? Date.now() + 1 })) }
    catch (e) { error.value = (e as Error).message }
  }
  async function initialize() {
    loading.value = true
    try {
      await refreshStatus(); settings.value = await unwrap(bridge?.getSettings()); apps.value = await unwrap(bridge?.apps()); ready.value = true
      error.value = ''
      await search()
    } catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }
  async function mutate(action: () => Promise<unknown>) {
    if (busy.value) return
    busy.value = true; error.value = ''
    try { await action(); settings.value = await unwrap(bridge?.getSettings()); await refreshStatus(); apps.value = await unwrap(bridge?.apps()); await search(); await refreshStats() }
    catch (e) { error.value = (e as Error).message }
    finally { busy.value = false }
  }
  const updateSettings = (patch: Partial<Settings>) => mutate(() => unwrap(bridge?.updateSettings(patch)))
  const toggle = () => mutate(() => unwrap(status.value.state === 'recording' ? bridge?.pause() : bridge?.start()))
  const remove = (scope: DeleteQuery) => mutate(() => unwrap(bridge?.deleteRecords(scope)))
  async function exportData(format: 'csv' | 'json') {
    try {
      const text = await unwrap(bridge?.exportRecords({ format, ...range.value }))
      const url = URL.createObjectURL(new Blob([text], { type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = `utools-history-${new Date().toISOString().slice(0, 10)}.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { queryFailed.value = true; error.value = (e as Error).message }
  }
  return { frequent, settings, status, records, apps, stats, error, loading, busy, ready, nextCursor, matchTotal, queryFailed, q, preset, startDate, endDate, appId, range, search, refreshStatus, refreshStats, initialize, updateSettings, toggle, remove, exportData, dispose() { alive = false; request++ } }
}
