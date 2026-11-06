<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'
defineProps<{ busy: boolean }>()
defineEmits<{ start: []; settings: [] }>()
</script>
<template>
  <section class="onboarding" aria-labelledby="privacy-heading">
    <h2 id="privacy-heading"><AppIcon name="shield" :size="20" /> 开始前，请了解记录范围</h2>
    <ul class="privacy-summary">
      <li>记录应用名、窗口标题和时间，仅保存在本机，默认保留 30 天。</li>
      <li>不截屏、不录按键、不读剪贴板；标题可能含敏感信息，可在设置中排除应用。</li>
      <li>仅在插件进程运行时记录；可随时暂停、删除，不安装自启动。</li>
    </ul>
    <div class="onboarding-actions">
      <button class="button primary" :disabled="busy" @click="$emit('start')">{{ busy ? '正在启用…' : '同意并开始记录' }}<AppIcon name="chevron" :size="16" /></button>
      <button class="button subtle" @click="$emit('settings')">设置排除应用</button>
    </div>
  </section>
</template>
