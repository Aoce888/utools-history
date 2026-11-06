<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { SpikeSnapshot } from './domain/bridge'
const available = !!window.historySpike
const snapshot = ref<SpikeSnapshot>({ state: 'unavailable', message: '请通过 uTools 加载；浏览器仅可预览。', samples: [] })
const labels = { not_started: '未开始', recording: '实验采集中', paused: '已暂停', unavailable: '采集不可用' }
let timer: ReturnType<typeof setInterval>
function refresh() { if (window.historySpike) snapshot.value = window.historySpike.snapshot() }
function start() { window.historySpike?.start(); refresh() }
function stop() { window.historySpike?.stop(); refresh() }
function clear() { window.historySpike?.clear(); refresh() }
onMounted(() => { refresh(); timer = setInterval(refresh, 500) })
onUnmounted(() => { clearInterval(timer); stop() })
</script>
<template>
  <main>
    <header><h1>操作历史 <small>M1 可行性实验 · HostXit</small></h1><strong role="status">{{ labels[snapshot.state] }}</strong></header>
    <section><h2>先验证真实采集，再构建历史</h2><p>开始后读取前台应用名称、窗口标题和时间戳。每秒采样，最多运行 60 秒，短暂切换可能遗漏。样本仅保留在内存，不上传、不写入历史数据库。</p><p>不截屏、不录键盘、不读剪贴板。退出插件界面即停止，没有常驻服务或自启动。锁屏和休眠尚未验收，样本不能用于统计活跃时长。</p></section>
    <nav aria-label="实验控制"><button @click="start" :disabled="!available || snapshot.state === 'recording'">开始 60 秒实验</button><button @click="stop" :disabled="snapshot.state !== 'recording'">暂停</button><button @click="clear" :disabled="!snapshot.samples.length">清空样本</button></nav>
    <p role="status">{{ snapshot.message }}</p>
    <p v-if="!snapshot.samples.length" class="empty">暂无真实样本。开始后切换窗口，再返回查看。</p>
    <ol v-else aria-label="真实窗口样本"><li v-for="(item, index) in snapshot.samples" :key="`${item.timestamp}-${index}`"><time>{{ new Date(item.timestamp).toLocaleTimeString() }}</time><div><b>{{ item.appName }}</b><p>{{ item.windowTitle || '无可读取标题' }}</p><small>PID {{ item.processId }} · {{ item.status }}</small></div></li></ol>
  </main>
</template>