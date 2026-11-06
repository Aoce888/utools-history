<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AppStats } from '../domain/bridge'
import { duration } from '../domain/format'
const props = defineProps<{ stats: AppStats[] }>()
const total = computed(() => props.stats.reduce((n, item) => n + item.durationMs, 0))
const page = ref(0), pageSize = 3
const pages = computed(() => Math.max(1, Math.ceil(props.stats.length / pageSize)))
const visible = computed(() => props.stats.slice(page.value * pageSize, (page.value + 1) * pageSize))
watch(pages, value => { page.value = Math.min(page.value, value - 1) })
</script>
<template><section class="stats-view" aria-label="应用统计"><p class="stats-summary">已观察 <b>{{ duration(total) }}</b> · {{ stats.length }} 个应用</p><p v-if="!stats.length" class="scope-note">暂无可统计的活动。</p><div v-for="item in visible" :key="item.appId" class="stat-row"><b>{{ item.appName }}</b><span>{{ duration(item.durationMs) }}</span></div><div v-if="pages > 1" class="pagination" aria-label="统计分页"><button class="button" :disabled="page === 0" @click="page--">上一页</button><span>{{ page + 1 }}/{{ pages }}</span><button class="button" :disabled="page + 1 >= pages" @click="page++">下一页</button></div><p class="scope-note">按所选日期计算，仅统计已观察片段，不代表精确工时。</p></section></template>
