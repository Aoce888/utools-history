<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement>(); let previous: HTMLElement | null
onMounted(() => { previous = document.activeElement as HTMLElement; panel.value?.focus() })
onUnmounted(() => previous?.focus())
function trap(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); emit('close'); return }
  if (event.key !== 'Tab') return
  const elements = panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, textarea, a[href]')
  if (!elements?.length) { event.preventDefault(); return }
  const first = elements[0], last = elements[elements.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
</script>
<template><div class="modal-backdrop" @click.self="emit('close')"><section class="modal-panel" ref="panel" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" @keydown="trap"><header class="modal-heading"><h2>{{ title }}</h2><button class="icon-button" aria-label="关闭对话框" @click="emit('close')"><AppIcon name="close" /></button></header><slot /></section></div></template>
