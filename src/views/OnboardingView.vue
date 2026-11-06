<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'
defineProps<{ busy: boolean }>()
defineEmits<{ start: []; settings: [] }>()
</script>
<template><section class="onboarding"><div class="onboarding-art"><AppIcon name="history" :size="48" /><span>你的工作，自有脉络</span></div><span class="eyebrow">WELCOME TO YOUR TIMELINE</span><h2>让刚才的灵感，<br>有迹可循。</h2><p>找回使用过的应用与窗口，重新连接一天的思路。<br>无需账号，所有历史只保存在这台电脑。</p><div class="privacy-list"><div><AppIcon name="shield" /><span>记录应用名、窗口标题和时间<br><small>不截屏、不录按键、不读剪贴板</small></span></div><div><AppIcon name="settings" /><span>随时暂停、排除应用与删除记录<br><small>默认保留 30 天；敏感标题也可能出现在窗口中</small></span></div></div><p class="scope-note">当前仅在插件进程运行期间采集。uTools 完全退出后停止，不安装开机启动。首次同意前不会记录活动。</p><div class="onboarding-actions"><button class="button primary" :disabled="busy" @click="$emit('start')">同意并开始记录 <AppIcon name="chevron" :size="16" /></button><button class="button subtle" @click="$emit('settings')">先查看设置</button></div></section></template>
