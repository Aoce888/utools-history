<script setup lang="ts">
import { computed } from 'vue'
import { highlight } from '../domain/format'
const props = defineProps<{ text: string; query: string }>()
const parts = computed(() => highlight(props.text, props.query.trim()))
</script>
<template><template v-for="(part, index) in parts" :key="index"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></template>
