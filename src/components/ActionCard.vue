<template>
  <button class="card" @click="$emit('click')" type="button">
    <img v-if="iconSrc" :src="iconSrc" class="icon" :alt="title" />
    <div class="title">{{ title }}</div>
    <div class="desc">{{ description }}</div>
  </button>
</template>

<script setup lang="ts">
defineEmits<{ (e:'click'): void }>()
defineProps<{ title: string; description: string; iconSrc?: string }>()
</script>

<style scoped>
.card{height:256px;width:100%;border-radius:var(--radius-md);background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px;cursor:pointer;box-shadow:var(--shadow-sm)}
.card:hover{transform:translateY(-1px)}
.icon{width:64px;height:64px}
.title{font-size:24px;font-weight:600;line-height:32px;text-align:center}
.desc{font-size:16px;line-height:24px;color:var(--muted);text-align:center;max-width:320px}
</style>
