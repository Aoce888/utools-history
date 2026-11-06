<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import type { ActivityRecord } from '../domain/bridge'
import { dayLabel, timeLabel, duration } from '../domain/format'
import AppIcon from './AppIcon.vue'
import HighlightedText from './HighlightedText.vue'
const props = defineProps<{ records: ActivityRecord[]; query: string; loading: boolean; more: boolean }>()
const emit = defineEmits<{ detail: [record: ActivityRecord]; more: [] }>()
const viewport = ref<HTMLElement>(), scrollTop = ref(0), height = ref(400), selected = ref(0)
const rowHeight = 82
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / rowHeight) - 4))
const end = computed(() => Math.min(props.records.length, Math.ceil((scrollTop.value + height.value) / rowHeight) + 4))
const visible = computed(() => props.records.slice(start.value, end.value))
let observer: ResizeObserver
onMounted(() => { observer = new ResizeObserver(entries => { height.value = entries[0].contentRect.height }); if (viewport.value) observer.observe(viewport.value) })
onUnmounted(() => observer?.disconnect())
watch(() => props.records, () => { selected.value = Math.min(selected.value, Math.max(0, props.records.length - 1)) })
function reset() { selected.value = 0; scrollTop.value = 0; if (viewport.value) viewport.value.scrollTop = 0 }
function move(delta: number) {
  selected.value = Math.max(0, Math.min(props.records.length - 1, selected.value + delta))
  const top = selected.value * rowHeight
  if (viewport.value) {
    if (top < viewport.value.scrollTop) viewport.value.scrollTop = top
    else if (top + rowHeight > viewport.value.scrollTop + height.value) viewport.value.scrollTop = top + rowHeight - height.value
  }
}
function openSelected() { const item = props.records[selected.value]; if (item) emit('detail', item) }
defineExpose({ move, openSelected, reset })
</script>
<template>
  <div class="timeline-scroll" ref="viewport" tabindex="0" role="region" aria-label="历史时间线" @scroll="scrollTop = ($event.target as HTMLElement).scrollTop" @keydown.down.prevent.stop="move(1)" @keydown.up.prevent.stop="move(-1)" @keydown.enter.prevent.stop="openSelected">
    <div v-if="!records.length && !loading" class="empty-state"><AppIcon name="history" :size="38" /><h3>这一页，还没有足迹</h3><p>切换应用后返回，或试试其他关键词与日期。</p></div>
    <div :style="{ height: `${records.length * rowHeight}px`, position: 'relative' }" role="list">
      <button v-for="(item, i) in visible" :key="item.id" role="listitem" class="event-row" :class="{ selected: selected === start + i }" :style="{ top: `${(start + i) * rowHeight}px`, height: `${rowHeight}px` }" @click="selected = start + i; emit('detail', item)" :aria-label="`${item.appName} ${item.windowTitle} 查看详情`">
        <div class="event-time"><b>{{ timeLabel(item.startedAt) }}</b><span>{{ dayLabel(item.startedAt) }}</span></div>
        <span class="app-avatar" :style="{ '--app-hue': String([...item.appId].reduce((n, c) => n + c.charCodeAt(0), 0) % 360) }">{{ item.appName.slice(0, 1).toUpperCase() }}</span>
        <div class="event-copy"><b><HighlightedText :text="item.windowTitle || '无可读取标题'" :query="query" /></b><span><HighlightedText :text="item.appName" :query="query" /></span></div>
        <span class="event-duration">{{ duration(item.durationMs) }}</span><AppIcon name="chevron" :size="15" />
      </button>
    </div>
    <div v-if="more" class="load-more"><button class="button subtle" :disabled="loading" @click="emit('more')">{{ loading ? '正在加载…' : '加载更多记录' }}</button></div>
  </div>
</template>
