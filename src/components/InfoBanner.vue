<template>
  <div class="banner">
    <img v-if="iconSrc" :src="iconSrc" class="icon" alt="Info" />
    <div class="content">
      <div class="title">{{ title }}</div>
      <div class="body"><slot /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; iconSrc?: string }>()
</script>

<style scoped>
.banner{width:100%;background:var(--info-bg);border:1px solid var(--info-border);border-radius:var(--radius-sm);display:flex;gap:16px;padding:20px;color:var(--muted)}
.icon{width:24px;height:24px}
.content{flex:1}
.title{color:var(--text);font-weight:600;margin-bottom:8px}
.body{line-height:24px}
</style>
