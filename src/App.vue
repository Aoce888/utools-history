<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import Hello from './Hello/index.vue'
import ReadText from './ReadText/index.vue'

const route = ref('')
const enterAction = ref({})

onMounted(() => {
  window.utools.onPluginEnter((action) => {
    route.value = action.code
    enterAction.value = action
  })
  window.utools.onPluginOut((isKill) => {
    route.value = ''
  })
})
</script>

<template>
  <template v-if="route === 'hello'">
    <Hello :enterAction="enterAction"></Hello>
  </template>
  <template v-if="route === 'read-text'">
    <ReadText :enterAction="enterAction"></ReadText>
  </template>
</template>
