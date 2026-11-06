<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})


const filePath = ref('')
const fileContent = ref('')
const error = ref('')

const handleOpenDialog = () => {
  const files = window.utools.showOpenDialog({
    title: '选择文档',
    filters: [
      { name: '文本文件', extensions: ['txt', 'md'] }
    ],
    properties: ['openFile']
  })
  if (!files) return
  const _filePath = files[0]
  filePath.value = _filePath

  window.services.readText(_filePath).then((content) => {
    fileContent.value = content
  }).catch((err) => {
    error.value = err.message
    fileContent.value = ''
  })
}

watch(() => props.enterAction, (enterAction) => {
  if (enterAction.type === "files") {
    const _filePath = enterAction.payload[0].path;
    filePath.value = _filePath

    window.services.readText(_filePath).then((content) => {
      fileContent.value = content
    }).catch((err) => {
      error.value = err.message
      fileContent.value = ''
    })
  }
}, {
  immediate: true
})

</script>

<template>
  <div class="read-body">
    <button class="read-button" @click="handleOpenDialog">选择文件</button>
    <div class="read-file">{{ filePath }}</div>
    <template v-if="!!fileContent">
      <pre>
        {{ fileContent }}
      </pre>
    </template>
    <template v-if="!!error">
      <div class="read-error">
        {{ error }}
      </div>
    </template>
  </div>
</template>

<style>
.read-body {
  padding: 20px;
  box-sizing: border-box;
}

.read-button {
  border: none;
  background: rgb(88, 164, 246);
  border-radius: 4px;
  padding: 10px 20px;
  color: #fff;
  line-height: 1;
  cursor: pointer;
  transition: opacity .2s;
}

.read-button:disabled {
  filter: grayscale(1);
  cursor: not-allowed;
}

.read-button:not(:disabled):active {
  opacity: 0.6;
}

.read-file {
  width: 100%;
  margin-top: 20px;
  font-weight: bold;
}

.read-error {
  color: red;
}

.read-body > pre {
  background-color: #fff;
  width: 100%;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 11px;
  margin-top: 20px;
  margin-bottom: 0;
  white-space: break-spaces;
}

@media (prefers-color-scheme: dark) {
  .read-body > pre {
    background-color: #424242;
  }
}
</style>
