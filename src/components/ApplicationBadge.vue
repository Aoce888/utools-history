<script setup lang="ts">
import { ref, watch } from 'vue'
const props = withDefaults(defineProps<{ id: number; name: string; actionOnly?: boolean }>(), { actionOnly: false })
const emit = defineEmits<{ reopen: [] }>()
const icon = ref(''), canOpen = ref(false)
watch(() => props.id, async id => {
  icon.value = ''; canOpen.value = false
  const reply = await window.historyBridge?.appInfo?.(id)
  if (id !== props.id || !reply?.ok) return
  icon.value = reply.value.icon || ''; canOpen.value = reply.value.canOpen
}, { immediate: true })
</script>
<template><span class="application-badge"><template v-if="!actionOnly"><img v-if="icon" :src="icon" alt="" width="28" height="28" @error="icon = ''" /><span v-else class="app-avatar" aria-hidden="true">{{ name.slice(0,1).toUpperCase() }}</span></template><button v-if="actionOnly && canOpen" class="reopen-button" :aria-label="`再次打开应用 ${name}`" title="再次打开应用，不恢复原文件或网页" @click.stop="emit('reopen')">打开应用</button></span></template>
