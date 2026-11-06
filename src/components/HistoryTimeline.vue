<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ActivityRecord } from '../domain/bridge'
import { dayLabel, timeLabel } from '../domain/format'
import HighlightedText from './HighlightedText.vue'
import ApplicationBadge from './ApplicationBadge.vue'
const props = defineProps<{ records: ActivityRecord[]; query: string; loading: boolean; more: boolean; enabled: boolean; filtered: boolean; failed: boolean; frequent?: boolean }>()
const emit = defineEmits<{ detail: [record: ActivityRecord]; reopen: [record: ActivityRecord]; more: []; clear: [] }>()
const viewport = ref<HTMLElement>(), scrollTop = ref(0), height = ref(400), selected = ref(0)
const rowHeight = 56
let advanceAfterLoad = false
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / rowHeight) - 4))
const end = computed(() => Math.min(props.records.length, Math.ceil((scrollTop.value + height.value) / rowHeight) + 4))
const visible = computed(() => props.records.slice(start.value, end.value))
const selectedId = computed(() => props.records[selected.value] && selected.value >= start.value && selected.value < end.value ? `history-result-${props.records[selected.value].id}` : undefined)
let observer: ResizeObserver
onMounted(() => { observer = new ResizeObserver(entries => { height.value = entries[0].contentRect.height }); if (viewport.value) observer.observe(viewport.value) })
onUnmounted(() => observer?.disconnect())
watch(() => props.records, (items, previous) => {
  const id = previous[selected.value]?.id
  if (advanceAfterLoad && items.length > previous.length) { selected.value = previous.length; advanceAfterLoad = false; nextTick(() => { if (viewport.value) viewport.value.scrollTop = Math.max(0, (selected.value + 1) * rowHeight - height.value) }) }
  else { const index = items.findIndex(item => item.id === id); selected.value = index >= 0 ? index : Math.min(selected.value, Math.max(0, items.length - 1)) }
})
function reset() { advanceAfterLoad = false; selected.value = 0; scrollTop.value = 0; if (viewport.value) viewport.value.scrollTop = 0 }
function move(delta: number) {
  if (delta > 0 && selected.value === props.records.length - 1 && props.more && !props.loading) { advanceAfterLoad = true; emit('more'); return }
  selected.value = Math.max(0, Math.min(props.records.length - 1, selected.value + delta))
  const top = selected.value * rowHeight
  if (viewport.value) {
    if (top < viewport.value.scrollTop) viewport.value.scrollTop = top
    else if (top + rowHeight > viewport.value.scrollTop + height.value) viewport.value.scrollTop = top + rowHeight - height.value
  }
}
function openSelected() { const item = props.records[selected.value]; if (item && !props.loading) emit('reopen', item) }
function viewDetails(index: number) { selected.value = index; const item = props.records[index]; if (item && !props.loading) emit('detail', item) }
function enterResult(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.target === viewport.value || (event.target as HTMLElement).closest('.event-row')) {
    event.preventDefault(); event.stopPropagation(); openSelected()
  }
}
defineExpose({ move, openSelected, reset, selectedId })
</script>
<template>
  <div class="timeline-scroll" ref="viewport" tabindex="0" role="region" aria-label="历史时间线" @scroll="scrollTop = ($event.target as HTMLElement).scrollTop" @keydown.down.prevent.stop="move(1)" @keydown.up.prevent.stop="move(-1)" @keydown.enter="enterResult">
    <div v-if="!records.length" class="empty-state"><h3>{{ failed ? '读取历史失败' : loading ? '正在检索…' : enabled ? '未找到历史记录' : '尚未开始记录' }}</h3><p v-if="!loading">{{ failed ? '请根据错误提示重试，不代表本地历史为空。' : enabled ? filtered ? '当前条件没有匹配，试试全部历史。' : '开始记录并切换应用后，历史会出现在这里。' : '确认隐私说明后即可启用。' }}</p><button v-if="filtered && !loading && !failed" class="button subtle" @click="emit('clear')">清除筛选</button></div>
    <div id="history-results" :style="{ height: `${records.length * rowHeight}px`, position: 'relative' }" role="listbox" aria-label="历史搜索结果">
      <div v-for="(item, i) in visible" :key="item.id" :id="`history-result-${item.id}`" role="option" :aria-selected="selected === start + i" :tabindex="selected === start + i ? 0 : -1" class="event-row" :class="{ selected: selected === start + i }" :style="{ top: `${(start + i) * rowHeight}px`, height: `${rowHeight}px` }" @click="viewDetails(start + i)" :aria-label="`${item.appName} ${item.windowTitle} 查看详情`">
        <ApplicationBadge :id="item.id" :name="item.appName" @reopen="emit('reopen', item)" />
        <div v-if="frequent" class="event-copy"><b>{{ item.appName }}</b><span>常用软件 · 点击或 Enter 再次打开</span></div><div v-else class="event-copy"><b><HighlightedText :text="item.windowTitle || '无可读取标题'" :query="query" /></b><span><HighlightedText :text="item.appName" :query="query" /></span></div>
        <button v-if="!frequent" class="reopen-button" :aria-label="`查看 ${item.appName} 的记录详情`" @keydown.enter.stop.prevent="viewDetails(start + i)" @click.stop="viewDetails(start + i)">查看</button>
        <div v-if="!frequent" class="event-time"><b>{{ timeLabel(item.startedAt) }}</b><span>{{ dayLabel(item.startedAt) }}</span></div>
      </div>
    </div>
    <div v-if="more" class="load-more"><button class="button subtle" :disabled="loading" @click="emit('more')">{{ loading ? '正在加载…' : '加载更多记录' }}</button></div>
  </div>
</template>
