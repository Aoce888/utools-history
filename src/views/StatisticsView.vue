<script setup lang="ts">
import { computed } from 'vue'
import type { AppStats } from '../domain/bridge'
import { duration } from '../domain/format'
import AppIcon from '../components/AppIcon.vue'
const props = defineProps<{ stats: AppStats[] }>()
const total = computed(() => props.stats.reduce((n, item) => n + item.durationMs, 0))
</script>
<template><section class="stats-view"><div class="stats-summary"><span class="eyebrow">YOUR TIME, AT A GLANCE</span><h2>{{ duration(total) }}</h2><p>所选日期内已观察到的应用活动 · {{ stats.length }} 个应用</p></div><div v-if="!stats.length" class="empty-state"><AppIcon name="chart" :size="36" /><h3>还没有可统计的活动</h3><p>开始记录后，应用使用情况会出现在这里。</p></div><div v-for="(item, i) in stats" :key="item.appId" class="stat-row"><span class="rank">{{ String(i + 1).padStart(2, '0') }}</span><div><header><b>{{ item.appName }}</b><span>{{ duration(item.durationMs) }}</span></header><div class="stat-track"><span :style="{ width: `${total ? item.durationMs / total * 100 : 0}%` }" /></div></div></div><p class="scope-note">统计由有效采样段计算，未观察的切换间隔不计入。每秒采样可能遗漏短活动；不代表精确工时。</p></section></template>
