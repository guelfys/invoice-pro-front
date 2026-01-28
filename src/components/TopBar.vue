<template>
  <header class="topbar">
    <div class="brand">
      <img v-if="logoSrc" :src="logoSrc" class="logo" alt="InvoicerPRO" />
      <div class="brandText">
        <span class="invoice">Invoice</span><span class="r">r</span><span class="pro">PRO</span>
        <span class="ver">3.0</span>
      </div>
    </div>

    <!-- Toggle Demo / Producción -->
    <div v-if="MULTI_ENV_ENABLED" class="envToggle" role="group" aria-label="Ambiente">
      <button
        class="envBtn"
        :class="{ active: env === 'demo' }"
        @click="setEnv('demo')"
        title="Ejecuta el modo DEMO (homologación)"
      >
        Demo
      </button>

      <button
        class="envBtn"
        :class="{ active: env === 'prod' }"
        @click="setEnv('prod')"
        title="Ejecuta el modo PRODUCCIÓN"
      >
        Producción
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRuntimeEnv } from '@/composables/useRuntimeEnv'
import { MULTI_ENV_ENABLED, DEFAULT_ENV } from '@/config/runtimeEnv'

defineProps<{ logoSrc?: string }>()

const { env, setEnv } = useRuntimeEnv()

onMounted(() => {
  if (!MULTI_ENV_ENABLED) setEnv(DEFAULT_ENV)
})
</script>

<style scoped>
.topbar{height:48px;background:var(--surface);border-bottom:1px solid var(--border-2);display:flex;align-items:center;justify-content:space-between;padding:0 12px}
.brand{display:flex;align-items:center;gap:10px}
.logo{height:24px;width:auto}
.brandText{font-size:13px;letter-spacing:-0.2px;display:flex;align-items:baseline}
.invoice{font-weight:500}.r{letter-spacing:1px;font-weight:500}.pro{font-weight:700;margin-left:2px}.ver{font-weight:500;margin-left:6px}

/* toggle */
.envToggle{
  display:flex;
  gap:6px;
  padding:4px;
  border:1px solid var(--border-2);
  border-radius:12px;
  background:#fff;
}
.envBtn{
  height:30px;
  padding:0 12px;
  border-radius:10px;
  border:1px solid transparent;
  background:transparent;
  cursor:pointer;
  font-weight:800;
  color:var(--muted);
}
.envBtn:hover{filter:brightness(.98)}
.envBtn.active{
  background:var(--blue);
  color:#fff;
  border-color:var(--blue);
}
</style>
