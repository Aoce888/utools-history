<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Settings, DeleteQuery } from '../domain/bridge'
import AppIcon from '../components/AppIcon.vue'
const props = defineProps<{ settings: Settings; busy: boolean; directory?: string }>()
const emit = defineEmits<{ save: [patch: Partial<Settings>]; remove: [scope: DeleteQuery]; export: [format: 'csv' | 'json'] }>()
const retention = ref(30), idle = ref(300), excluded = ref(''), from = ref(''), to = ref(''), localError = ref('')
watch(() => props.settings, s => { retention.value = s.retentionDays; idle.value = s.idleSeconds; excluded.value = s.excludedApps.join('\n') }, { immediate: true })
function save() {
  if (!Number.isInteger(retention.value) || retention.value < 1 || retention.value > 3650 || !Number.isInteger(idle.value) || idle.value < 30 || idle.value > 3600) { localError.value = '保留期为 1–3650 天，空闲阈值为 30–3600 秒'; return }
  localError.value = ''; emit('save', { retentionDays: retention.value, idleSeconds: idle.value, excludedApps: excluded.value.split('\n').map(v => v.trim()).filter(Boolean) })
}
function removeRange() {
  if (!from.value || !to.value || from.value > to.value) { localError.value = '请选择有效的删除日期范围'; return }
  const end = new Date(to.value + 'T00:00:00'); end.setDate(end.getDate() + 1)
  emit('remove', { from: new Date(from.value + 'T00:00:00').getTime(), to: end.getTime() })
}
</script>
<template><div class="settings-view"><section class="settings-card"><h2>记录偏好</h2><p class="muted">减少打扰，把控制权留给你。</p><label class="setting-line"><span>界面主题<small>支持系统、浅色与深色</small></span><select :value="settings.theme" @change="emit('save', { theme: ($event.target as HTMLSelectElement).value as Settings['theme'] })"><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label><label class="setting-line"><span>历史保留期限<small>缩短后立即删除超期记录</small></span><span><input class="number-input" type="number" min="1" max="3650" v-model.number="retention" aria-label="历史保留天数" /> 天</span></label><label class="setting-line"><span>空闲判定阈值<small>锁屏、空闲和长采样间断将分段</small></span><span><input class="number-input" type="number" min="30" max="3600" v-model.number="idle" aria-label="空闲秒数" /> 秒</span></label><label class="block-label">排除应用 <small>每行一个进程名，如 KeePass.exe；保存后立即停止写入该应用。已有记录需单独删除。</small><textarea v-model="excluded" rows="4" placeholder="KeePass.exe&#10;1Password.exe" /></label><p v-if="localError" role="alert" class="error-text">{{ localError }}</p><button class="button primary" :disabled="busy" @click="save">保存记录偏好</button></section>
<section class="settings-card"><h2>本地数据</h2><div class="storage-note"><AppIcon name="shield" /><div>SQLite 本地保存，不连接云端<small class="storage-path">{{ directory || '数据目录将在 uTools 中显示' }}</small></div></div><p class="muted">退出 uTools 后停止采集。不启用开机启动；后台保活依赖宿主，待人工验证。暂停不会删除已保存记录。</p><div class="button-group"><button class="button" :disabled="busy" @click="emit('export', 'json')">导出当前日期 JSON</button><button class="button" :disabled="busy" @click="emit('export', 'csv')">导出当前日期 CSV</button></div><div class="danger-zone"><h3>删除历史</h3><p class="muted">永久删除前会再次确认。范围删除按记录开始时间筛选。</p><div class="date-range"><input type="date" v-model="from" aria-label="删除开始日期" /><span>至</span><input type="date" v-model="to" aria-label="删除结束日期" /><button class="button danger-text" :disabled="busy" @click="removeRange">删除范围</button></div><button class="button danger-text" :disabled="busy" @click="emit('remove', { all: true })">清空所有历史</button></div></section><p class="about">HostXit 出品 · 本地优先 · 无账号、无 AI、无云端上传</p></div></template>
