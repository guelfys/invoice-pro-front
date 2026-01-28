import { computed, ref } from 'vue'

export type RuntimeEnv = 'demo' | 'prod'

const KEY = 'invoicerpro_env'

// singleton (global) reactivo
const env = ref<RuntimeEnv>((localStorage.getItem(KEY) as RuntimeEnv) || 'demo')

export function useRuntimeEnv() {
  const setEnv = (v: RuntimeEnv) => {
    env.value = v
    localStorage.setItem(KEY, v)
  }

  return {
    env,
    setEnv,
    isDemo: computed(() => env.value === 'demo'),
    isProd: computed(() => env.value === 'prod'),
  }
}
