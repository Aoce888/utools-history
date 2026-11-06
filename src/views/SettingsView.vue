<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Settings, DeleteQuery } from '../domain/bridge'
const props = defineProps<{ settings: Settings; busy: boolean; directory?: string }>()
const emit = defineEmits<{ save: [patch: Partial<Settings>]; remove: [scope: DeleteQuery]; export: [format: 'csv' | 'json'] }>()
const tab = ref('preferences'), retention = ref(30), idle = ref(300), excluded = ref(''), from = ref(''), to = ref(''), localError = ref('')
watch(() => props.settings, s => { retention.value = s.retentionDays; idle.value = s.idleSeconds; excluded.value = s.excludedApps.join(', ') }, { immediate: true })
function save() {
  if (!Number.isInteger(retention.value) || retention.value < 1 || retention.value > 3650 || !Number.isInteger(idle.value) || idle.value < 30 || idle.value > 3600) { localError.value = '保留期 1–3650 天；空闲阈值 30–3600 秒'; return }
  localError.value = ''; emit('save', { retentionDays: retention.value, idleSeconds: idle.value, excludedApps: excluded.value.split(/[,，\n]/).map(v => v.trim()).filter(Boolean) })
}
function removeRange() {
  if (!from.value || !to.value || from.value > to.value) { localError.value = '请选择有效的删除日期范围'; return }
  const end = new Date(to.value + 'T00:00:00'); end.setDate(end.getDate() + 1)
  emit('remove', { from: new Date(from.value + 'T00:00:00').getTime(), to: end.getTime() })
}
</script>
<template>
  <section class="settings-view" aria-label="设置">
    <nav class="secondary-tabs" aria-label="设置分组"><button v-for="item in [{ id: 'preferences', label: '记录偏好' }, { id: 'exclusions', label: '排除应用' }, { id: 'data', label: '本地数据' }]" :key="item.id" :aria-pressed="tab === item.id" @click="tab = item.id; localError = ''">{{ item.label }}</button></nav>
    <template v-if="tab === 'preferences'"><p class="scope-note">外观自动跟随 uTools 主题。</p><label class="setting-line"><span>保留期限 <small>缩短后立即清理</small></span><span><input type="number" class="number-input" min="1" max="3650" v-model.number="retention" aria-label="历史保留天数" /> 天</span></label><label class="setting-line"><span>空闲阈值</span><span><input type="number" class="number-input" min="30" max="3600" v-model.number="idle" aria-label="空闲秒数" /> 秒</span></label><button class="button primary" :disabled="busy" @click="save">保存记录偏好</button></template>
    <template v-else-if="tab === 'exclusions'"><label class="block-label">排除进程<input v-model="excluded" aria-label="排除进程" placeholder="KeePass.exe, 1Password.exe" /></label><p class="scope-note">用逗号分隔进程名，忽略大小写。保存后立即停止写入这些应用；已有历史需单独删除。</p><button class="button primary" :disabled="busy" @click="save">保存排除应用</button></template>
    <template v-else><label class="block-label">数据目录<input readonly :value="directory || '将在 uTools 中显示'" :title="directory" /></label><p class="scope-note">仅本地保存，退出 uTools 后停止；不安装自启动。</p><div class="button-group"><button class="button" :disabled="busy" @click="emit('export', 'json')">导出 JSON</button><button class="button" :disabled="busy" @click="emit('export', 'csv')">导出 CSV</button><button class="button danger-text" :disabled="busy" @click="emit('remove', { all: true })">清空所有历史</button></div><div class="date-range"><input type="date" v-model="from" aria-label="删除开始日期" /><span>至</span><input type="date" v-model="to" aria-label="删除结束日期" /><button class="button danger-text" :disabled="busy" @click="removeRange">删除范围</button></div></template>
    <p v-if="localError" class="error-text" role="alert">{{ localError }}</p>
  </section>
</template>
