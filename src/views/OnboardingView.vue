<script setup lang="ts">
defineProps<{ busy: boolean; retentionDays: number }>()
defineEmits<{ start: []; settings: [] }>()
</script>
<template><section class="onboarding" aria-label="隐私确认"><p>记录应用名、窗口标题和时间，仅本机保存 {{ retentionDays }} 天。不截屏、不录按键、不读剪贴板。标题可能含敏感信息，可排除应用、暂停或删除；仅在插件进程运行时记录，不安装自启动。</p><div class="onboarding-actions"><button class="button primary" :disabled="busy" @click="$emit('start')">{{ busy ? '正在启用…' : '同意并开始记录' }}</button><button class="button subtle" @click="$emit('settings')">设置排除应用</button></div></section></template>
