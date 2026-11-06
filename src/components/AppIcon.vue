<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
  history: 'M12 8v4l3 2 M3 11a9 9 0 1 1 2.5 7 M3 4v7h7',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  chart: 'M4 20V10 M12 20V4 M20 20v-7',
  pause: 'M8 5v14 M16 5v14', play: 'M8 5l11 7-11 7V5',
  chevron: 'M9 5l7 7-7 7', close: 'M6 6l12 12 M18 6L6 18',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3 M8 12l3 3 5-6',
  trash: 'M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  window: 'M3 5h18v14H3V5 M3 9h18',
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.window" /></svg></template>
