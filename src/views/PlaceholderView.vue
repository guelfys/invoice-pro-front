<template>
  <div class="page">
    <TopBar :logoSrc="icons.union" />
    <main class="wrap">
      <div class="box">
        <h1>{{ title }}</h1>
        <p>En proceso.</p>
        <router-link to="/" class="back">← Volver</router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import TopBar from '@/components/TopBar.vue'
defineProps<{ title: string }>()
const icons = { union: new URL('@/assets/icons/Union.svg', import.meta.url).href }
</script>

<style scoped>
.page{min-height:100vh;display:flex;flex-direction:column}
.wrap{flex:1;display:flex;justify-content:center;padding:40px 16px}
.box{width:min(var(--container-max),100%);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px}
h1{margin:0 0 8px 0}
.back{display:inline-block;margin-top:16px}
</style>
