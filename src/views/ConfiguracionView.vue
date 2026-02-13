<template>
  <div class="page">
    <header class="top">
      <button class="btn btn--tertiary" @click="goBack" type="button">
        <span class="btnIcon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M14.5 6.5L9 12l5.5 5.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="btnLabel">Volver</span>
      </button>

      <h1>Configuración</h1>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <section class="card">
        <div class="cardHeader">
          <div class="cardHeaderLeft">
            <h2>Gestión de CUIT/CUIL</h2>
            <p class="muted">
              Consultá la información fiscal de los CUIT/CUIL cargados o agregá uno nuevo.
            </p>
          </div>

          <div class="cardHeaderActions">
            <button class="btn btn--primary" @click="openModal" type="button">
              <span class="btnLabel">Añadir CUIT/CUIL</span>
            </button>

            <button
              class="btn btn--secondary"
              @click="refreshArca"
              type="button"
              :disabled="loading || !selectedCuit"
            >
              <span class="btnLabel">Actualizar datos (ARCA)</span>
            </button>
          </div>
        </div>

        <div class="block">
          <div class="fgSelect" ref="cuitRoot" :class="{ 'is-open': cuitOpen, 'is-disabled': loading || !cuitsSelectOptions.length }">
            <div class="fgHeader">
              <div class="fgLabel">
                <div class="fgLabelText">CUIT/CUIL</div>
                <div class="fgReq">*</div>
              </div>
            </div>

            <button
              class="fgField"
              type="button"
              :disabled="loading || !cuitsSelectOptions.length"
              @click="toggleCuit"
              @keydown="onCuitKeydown"
              ref="cuitTrigger"
            >
              <div class="fgLeading">
                <div class="fgContent">
                  <div class="fgText" :class="{ 'is-placeholder': !selectedCuitLabel }">
                    {{ selectedCuitLabel || 'Selecciona un CUIT/CUIL' }}
                  </div>
                </div>
              </div>

              <div class="fgTrailing">
                <div class="fgTrailingIcon" :class="{ 'is-rot': cuitOpen }">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" stroke="#686E75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>

            <div v-if="cuitOpen" class="fgDropdown" role="listbox" aria-label="CUIT/CUIL">
              <button
                v-for="(opt, i) in cuitsSelectOptions"
                :key="opt.value"
                type="button"
                class="fgItem"
                :class="{ 'is-selected': selectedCuit === opt.value, 'is-active': i === cuitActiveIndex }"
                @mouseenter="cuitActiveIndex = i"
                @click="selectCuit(opt.value)"
              >
                <span class="fgCheck" :class="{ 'is-on': selectedCuit === opt.value }" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="fgOption">{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="muted">Cargando…</div>
        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

        <div v-if="detail && selectedCuit" class="detailGrid">
          <div class="kv">
            <div class="k">Entorno</div>
            <div class="v">{{ detail.environment === 'produccion' ? 'PRODUCCIÓN' : 'DEMO' }}</div>
          </div>

          <div class="kv">
            <div class="k">Razón social</div>
            <div class="v">{{ detail.razon_social || '—' }}</div>
          </div>

          <div class="kv">
            <div class="k">Domicilio comercial</div>
            <div class="v">{{ detail.domicilio_comercial || '—' }}</div>
          </div>

          <div class="kv">
            <div class="k">Condición IVA</div>
            <div class="v">{{ detail.condicion_iva || '—' }}</div>
          </div>

          <div class="kv">
            <div class="k">Punto de venta</div>
            <div class="v">
              <span v-if="!pvOptions.length">—</span>

              <div v-else class="inlineField">
                <div class="fgSelect" ref="pvRoot" :class="{ 'is-open': pvOpen }">
                  <div class="fgHeader">
                    <div class="fgLabel">
                      <div class="fgLabelText">Punto de venta</div>
                      <div class="fgReq">*</div>
                    </div>
                  </div>

                  <button
                    class="fgField"
                    type="button"
                    @click="togglePv"
                    @keydown="onPvKeydown"
                    ref="pvTrigger"
                  >
                    <div class="fgLeading">
                      <div class="fgContent">
                        <div class="fgText" :class="{ 'is-placeholder': !selectedPvLabel }">
                          {{ selectedPvLabel || 'Selecciona un punto de venta' }}
                        </div>
                      </div>
                    </div>

                    <div class="fgTrailing">
                      <div class="fgTrailingIcon" :class="{ 'is-rot': pvOpen }">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke="#686E75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </button>

                  <div v-if="pvOpen" class="fgDropdown" role="listbox" aria-label="Punto de venta">
                    <button
                      v-for="(opt, i) in pvOptions"
                      :key="opt.value"
                      type="button"
                      class="fgItem"
                      :class="{ 'is-selected': selectedPuntoVenta === opt.value, 'is-active': i === pvActiveIndex }"
                      @mouseenter="pvActiveIndex = i"
                      @click="selectPv(opt.value)"
                    >
                      <span class="fgCheck" :class="{ 'is-on': selectedPuntoVenta === opt.value }" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <span class="fgOption">{{ opt.label }}</span>
                    </button>
                  </div>
                </div>

                <div class="hintSmall">Se guarda 1 solo PV en Config.xlsx</div>
              </div>
            </div>
          </div>

          <div class="kv">
            <div class="k">Actividad</div>
            <div class="v">
              <span v-if="!actOptions.length">—</span>

              <div v-else class="inlineField">
                <div class="fgSelect" ref="actRoot" :class="{ 'is-open': actOpen }">
                  <div class="fgHeader">
                    <div class="fgLabel">
                      <div class="fgLabelText">Actividad</div>
                      <div class="fgReq">*</div>
                    </div>
                  </div>

                  <button
                    class="fgField"
                    type="button"
                    @click="toggleAct"
                    @keydown="onActKeydown"
                    ref="actTrigger"
                  >
                    <div class="fgLeading">
                      <div class="fgContent">
                        <div class="fgText" :class="{ 'is-placeholder': !selectedActLabel }">
                          {{ selectedActLabel || 'Selecciona una actividad' }}
                        </div>
                      </div>
                    </div>

                    <div class="fgTrailing">
                      <div class="fgTrailingIcon" :class="{ 'is-rot': actOpen }">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke="#686E75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </button>

                  <div v-if="actOpen" class="fgDropdown" role="listbox" aria-label="Actividad">
                    <button
                      v-for="(opt, i) in actOptions"
                      :key="opt.value"
                      type="button"
                      class="fgItem"
                      :class="{ 'is-selected': selectedActividad === opt.value, 'is-active': i === actActiveIndex }"
                      @mouseenter="actActiveIndex = i"
                      @click="selectAct(opt.value)"
                    >
                      <span class="fgCheck" :class="{ 'is-on': selectedActividad === opt.value }" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <span class="fgOption">{{ opt.label }}</span>
                    </button>
                  </div>
                </div>

                <div class="hintSmall">Se guarda 1 sola actividad en Config.xlsx</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="syncMsg" class="muted" style="margin-top: 10px;">
          {{ syncMsg }}
        </div>
        <div v-if="syncErr" class="error" style="margin-top: 10px;">
          {{ syncErr }}
        </div>
      </section>
    </main>

    <div v-if="showModal" class="overlay" @mousedown.self="closeModal">
      <div class="modal ipModal">
        <!-- Header como Figma -->
        <div class="ipModalHeader">
          <div class="ipModalHeaderText">
            <div class="ipModalTitle">Añade un nuevo CUIT/CUIL</div>
            <div class="ipModalSubtitle">
              Ingresá un CUIT/CUIL para validarlo y agregarlo a la plataforma.
            </div>
          </div>

          <!-- X cerrar -->
          <button class="ipModalClose" type="button" @click="closeModal" :disabled="busy" aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="ipModalBody">
          <div class="formRow ipField">
            <label class="ipLabel">CUIT/CUIL *</label>
            <input class="ipInput" v-model="mCuit" placeholder="Ingresa un CUIT/CUIL" />
          </div>

          <!-- Certificado -->
          <div class="formRow ipField">
            <label class="ipLabel">Certificado *</label>

            <div class="ipUpload">
              <label class="ipUploadBtn">
                Seleccionar archivo
                <input class="ipFileInput" type="file" @change="onCert" :disabled="busy" />
              </label>

              <div class="ipUploadName" :class="{ empty: !mCert }">
                {{ mCert ? mCert.name : "Ningún archivo seleccionado" }}
              </div>

              <img v-if="mCert" class="ipCheck" :src="CheckCircleIcon" alt="" />
            </div>

            <div class="ipHint">
              <img class="ipInfo" :src="InfoIcon" alt="" />
              <span>
                Debe contener <code>-----BEGIN CERTIFICATE-----</code>.
                Se guardará como:
                <b>{{ mEnv === 'prod' ? 'MiCertificado.pem' : 'MiCertificado.cert' }}</b>
              </span>
            </div>
          </div>

          <!-- Key privada -->
          <div class="formRow ipField">
            <label class="ipLabel">Key privada *</label>

            <div class="ipUpload">
              <label class="ipUploadBtn">
                Seleccionar archivo
                <input class="ipFileInput" type="file" @change="onKey" :disabled="busy" />
              </label>

              <div class="ipUploadName" :class="{ empty: !mKey }">
                {{ mKey ? mKey.name : "Ningún archivo seleccionado" }}
              </div>

              <img v-if="mKey" class="ipCheck" :src="CheckCircleIcon" alt="" />
            </div>

            <div class="ipHint">
              <img class="ipInfo" :src="InfoIcon" alt="" />
              <span>
                Debe contener <code>-----BEGIN PRIVATE KEY-----</code> (o RSA PRIVATE KEY).
                Se guardará como:
                <b>{{ mEnv === 'prod' ? 'MiClavePrivada.key + MiclavePrivada.key' : 'MiClavePrivada.key' }}</b>
              </span>
            </div>
          </div>

          <div v-if="mError" class="error">{{ mError }}</div>
        </div>

        <!-- Footer botones -->
        <div class="actions ipModalFooter">
          <button class="btn btn--secondary" @click="closeModal" :disabled="busy" type="button">
            Cancelar
          </button>
          <button class="btn btn--primary" @click="submit" :disabled="busy" type="button">
            {{ busy ? 'Creando…' : 'Añadir CUIT/CUIL' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/http'
import { MULTI_ENV_ENABLED, DEFAULT_ENV } from '@/config/runtimeEnv'
import CheckCircleIcon from "@/assets/icons/CheckCircle.svg"
import InfoIcon from "@/assets/icons/info.svg"

type CuitItem = { cuit: number; razon_social: string }
type Opt = { value: number; label: string }

type Detail = {
  cuit: string
  environment: 'demo' | 'produccion'
  razon_social?: string
  domicilio_comercial?: string
  condicion_iva?: string
  puntos_venta?: any[]
  actividades?: any[]
  actividades_detalle?: any[]
}

const router = useRouter()

const cuits = ref<CuitItem[]>([])
const selectedCuit = ref<number | null>(null)
const detail = ref<Detail | null>(null)

const loading = ref(false)
const errorMsg = ref('')

const showModal = ref(false)
const busy = ref(false)

const mCuit = ref('')
const mEnv = ref<'demo' | 'prod'>(DEFAULT_ENV)

const mCert = ref<File | null>(null)
const mKey = ref<File | null>(null)
const mError = ref('')

const pvOptions = ref<Opt[]>([])
const actOptions = ref<Opt[]>([])
const selectedPuntoVenta = ref<number | null>(null)
const selectedActividad = ref<number | null>(0)

const syncMsg = ref('')
const syncErr = ref('')

const cuitsSelectOptions = computed<Opt[]>(() =>
  (cuits.value || []).map(c => ({
    value: c.cuit,
    label: c.razon_social ? `${c.cuit} - ${c.razon_social}` : String(c.cuit),
  }))
)

const selectedCuitLabel = computed(() => {
  const opt = cuitsSelectOptions.value.find(o => o.value === selectedCuit.value)
  return opt?.label || ''
})

const selectedPvLabel = computed(() => {
  const opt = pvOptions.value.find(o => o.value === selectedPuntoVenta.value)
  return opt?.label || ''
})

const selectedActLabel = computed(() => {
  const opt = actOptions.value.find(o => o.value === selectedActividad.value)
  return opt?.label || ''
})

const cuitOpen = ref(false)
const cuitActiveIndex = ref(-1)
const pvOpen = ref(false)
const pvActiveIndex = ref(-1)
const actOpen = ref(false)
const actActiveIndex = ref(-1)

const cuitRoot = ref<HTMLElement | null>(null)
const pvRoot = ref<HTMLElement | null>(null)
const actRoot = ref<HTMLElement | null>(null)

const cuitTrigger = ref<HTMLElement | null>(null)
const pvTrigger = ref<HTMLElement | null>(null)
const actTrigger = ref<HTMLElement | null>(null)

function closeAll() {
  cuitOpen.value = false
  pvOpen.value = false
  actOpen.value = false
  cuitActiveIndex.value = -1
  pvActiveIndex.value = -1
  actActiveIndex.value = -1
}

function onDocMouseDown(ev: MouseEvent) {
  const t = ev.target as Node
  const inCuit = cuitRoot.value?.contains(t) ?? false
  const inPv = pvRoot.value?.contains(t) ?? false
  const inAct = actRoot.value?.contains(t) ?? false
  if (!inCuit && !inPv && !inAct) closeAll()
}

onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))

function goBack() {
  router.push('/')
}

function toInt(v: any): number | null {
  if (v === null || v === undefined) return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

function buildPvOptions(arr: any[]): Opt[] {
  if (!Array.isArray(arr)) return []
  if (arr.length && typeof arr[0] === 'object' && arr[0] !== null) {
    return arr
      .map((x: any) => {
        const v = toInt(x.pto_vta ?? x.punto_venta ?? x.nro ?? x.numero)
        if (v === null) return null
        const estado = x.estado ? ` (${x.estado})` : ''
        return { value: v, label: `PV ${v}${estado}` }
      })
      .filter(Boolean) as Opt[]
  }
  return arr
    .map((x: any) => {
      const v = toInt(x)
      if (v === null) return null
      return { value: v, label: `PV ${v}` }
    })
    .filter(Boolean) as Opt[]
}

function buildActOptions(det: any[] | null | undefined, arr: any[] | null | undefined): Opt[] {
  const opts: Opt[] = []
  opts.push({ value: 0, label: '0 - (Sin informar)' })

  const addUnique = (value: number, label: string) => {
    if (!opts.some(o => o.value === value)) opts.push({ value, label })
  }

  if (Array.isArray(det) && det.length) {
    for (const a of det) {
      const v = toInt((a as any).id ?? (a as any).idActividad ?? (a as any).codigo ?? (a as any).numero_actividad ?? (a as any).value)
      if (v === null || v === 0) continue
      const desc = String((a as any).descripcion ?? (a as any).descripcionActividad ?? '').trim()
      addUnique(v, desc ? `${v} - ${desc}` : String(v))
    }
    return opts
  }

  const safeArr = Array.isArray(arr) ? arr : []
  if (safeArr.length && typeof safeArr[0] === 'object' && safeArr[0] !== null) {
    for (const x of safeArr) {
      const v = toInt((x as any).codigo ?? (x as any).id ?? (x as any).idActividad ?? (x as any).numero_actividad)
      if (v === null || v === 0) continue
      const desc = String((x as any).descripcion ?? (x as any).descripcionActividad ?? '').trim()
      addUnique(v, desc ? `${v} - ${desc}` : String(v))
    }
    return opts
  }

  for (const x of safeArr) {
    const v = toInt(x)
    if (v === null || v === 0) continue
    addUnique(v, String(v))
  }

  return opts
}

function openModal() {
  showModal.value = true
  busy.value = false
  mError.value = ''
  mCuit.value = ''
  mEnv.value = DEFAULT_ENV
  mCert.value = null
  mKey.value = null
}

function closeModal() {
  showModal.value = false
}

function onCert(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0] || null
  mCert.value = f
}

function onKey(ev: Event) {
  const f = (ev.target as HTMLInputElement).files?.[0] || null
  mKey.value = f
}

async function submit() {
  mError.value = ''
  const cuit = (mCuit.value || '').replace(/\D/g, '')
  if (cuit.length !== 11) {
    mError.value = 'CUIT/CUIL inválido (11 dígitos).'
    return
  }
  if (!mCert.value) {
    mError.value = 'Falta el certificado.'
    return
  }
  if (!mKey.value) {
    mError.value = 'Falta la key privada.'
    return
  }

  busy.value = true
  try {
    const fd = new FormData()
    fd.append('cuit', cuit)
    const envToSend = MULTI_ENV_ENABLED ? mEnv.value : 'prod'
    fd.append('environment', envToSend)
    fd.append('cert', mCert.value)
    fd.append('key', mKey.value)

    await http.post('/api/config/cuits', fd, { headers: { 'Content-Type': 'multipart/form-data' } })

    showModal.value = false
    await loadCuits()
    selectedCuit.value = Number(cuit)
    await loadDetail()
  } catch (e: any) {
    mError.value = e?.response?.data?.detail || e?.message || 'No se pudo crear el CUIT.'
  } finally {
    busy.value = false
  }
}

async function loadCuits() {
  errorMsg.value = ''
  loading.value = true
  try {
    const { data } = await http.get('/api/config/cuits')
    cuits.value = (data?.cuits || []) as CuitItem[]
    if (cuits.value.length && !selectedCuit.value) {
      selectedCuit.value = cuits.value[0].cuit
      await loadDetail()
    }
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudieron cargar los CUITs.'
  } finally {
    loading.value = false
  }
}

async function loadDetail() {
  if (!selectedCuit.value) return
  errorMsg.value = ''
  loading.value = true
  syncMsg.value = ''
  syncErr.value = ''
  try {
    const { data } = await http.get(`/api/config/cuits/${selectedCuit.value}`)
    detail.value = data as Detail

    pvOptions.value = buildPvOptions(detail.value?.puntos_venta || [])
    actOptions.value = buildActOptions((detail.value as any)?.actividades_detalle, detail.value?.actividades || [])

    if (pvOptions.value.length) selectedPuntoVenta.value ??= pvOptions.value[0].value
    if (actOptions.value.length) {
      if (selectedActividad.value === null) selectedActividad.value = 0
      if (!actOptions.value.some(o => o.value === selectedActividad.value)) selectedActividad.value = 0
    }

    await syncExcel()
  } catch (e: any) {
    detail.value = null
    pvOptions.value = []
    actOptions.value = []
    selectedPuntoVenta.value = null
    selectedActividad.value = null
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudo cargar el detalle del CUIT.'
  } finally {
    loading.value = false
  }
}

async function syncExcel() {
  if (!selectedCuit.value) return
  syncMsg.value = ''
  syncErr.value = ''
  try {
    await http.post(`/api/config/cuits/${selectedCuit.value}/sync-excel`, {
      punto_venta: selectedPuntoVenta.value,
      numero_actividad: selectedActividad.value,
      force_pv_actividad: true,
    })
    syncMsg.value = 'Configuración guardada en Config.xlsx (FacturaA/B/C).'
  } catch (e: any) {
    syncErr.value = e?.response?.data?.detail || e?.message || 'No se pudo sincronizar Config.xlsx.'
  }
}

async function refreshArca() {
  if (!selectedCuit.value) return
  errorMsg.value = ''
  loading.value = true
  try {
    await http.post(`/api/config/cuits/${selectedCuit.value}/arca/refresh`)
    await loadDetail()
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudo actualizar desde ARCA.'
  } finally {
    loading.value = false
  }
}

function toggleCuit() {
  if (loading.value || !cuitsSelectOptions.value.length) return
  pvOpen.value = false
  actOpen.value = false
  cuitOpen.value = !cuitOpen.value
  if (cuitOpen.value) {
    const idx = cuitsSelectOptions.value.findIndex(o => o.value === selectedCuit.value)
    cuitActiveIndex.value = idx >= 0 ? idx : 0
  } else {
    cuitActiveIndex.value = -1
  }
}

async function selectCuit(v: number) {
  selectedCuit.value = v
  cuitOpen.value = false
  cuitActiveIndex.value = -1
  await nextTick()
  cuitTrigger.value?.focus()
  await loadDetail()
}

function onCuitKeydown(e: KeyboardEvent) {
  if (loading.value || !cuitsSelectOptions.value.length) return

  if (!cuitOpen.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleCuit()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      cuitOpen.value = true
      cuitActiveIndex.value = 0
      return
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    cuitOpen.value = false
    cuitActiveIndex.value = -1
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cuitActiveIndex.value = Math.min(cuitActiveIndex.value + 1, cuitsSelectOptions.value.length - 1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    cuitActiveIndex.value = Math.max(cuitActiveIndex.value - 1, 0)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const opt = cuitsSelectOptions.value[cuitActiveIndex.value]
    if (opt) void selectCuit(opt.value)
  }
}

function togglePv() {
  if (!pvOptions.value.length) return
  cuitOpen.value = false
  actOpen.value = false
  pvOpen.value = !pvOpen.value
  if (pvOpen.value) {
    const idx = pvOptions.value.findIndex(o => o.value === selectedPuntoVenta.value)
    pvActiveIndex.value = idx >= 0 ? idx : 0
  } else {
    pvActiveIndex.value = -1
  }
}

async function selectPv(v: number) {
  selectedPuntoVenta.value = v
  pvOpen.value = false
  pvActiveIndex.value = -1
  await nextTick()
  pvTrigger.value?.focus()
  await syncExcel()
}

function onPvKeydown(e: KeyboardEvent) {
  if (!pvOptions.value.length) return

  if (!pvOpen.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      togglePv()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      pvOpen.value = true
      pvActiveIndex.value = 0
      return
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    pvOpen.value = false
    pvActiveIndex.value = -1
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    pvActiveIndex.value = Math.min(pvActiveIndex.value + 1, pvOptions.value.length - 1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    pvActiveIndex.value = Math.max(pvActiveIndex.value - 1, 0)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const opt = pvOptions.value[pvActiveIndex.value]
    if (opt) void selectPv(opt.value)
  }
}

function toggleAct() {
  if (!actOptions.value.length) return
  cuitOpen.value = false
  pvOpen.value = false
  actOpen.value = !actOpen.value
  if (actOpen.value) {
    const idx = actOptions.value.findIndex(o => o.value === selectedActividad.value)
    actActiveIndex.value = idx >= 0 ? idx : 0
  } else {
    actActiveIndex.value = -1
  }
}

async function selectAct(v: number) {
  selectedActividad.value = v
  actOpen.value = false
  actActiveIndex.value = -1
  await nextTick()
  actTrigger.value?.focus()
  await syncExcel()
}

function onActKeydown(e: KeyboardEvent) {
  if (!actOptions.value.length) return

  if (!actOpen.value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleAct()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      actOpen.value = true
      actActiveIndex.value = 0
      return
    }
    return
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    actOpen.value = false
    actActiveIndex.value = -1
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    actActiveIndex.value = Math.min(actActiveIndex.value + 1, actOptions.value.length - 1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    actActiveIndex.value = Math.max(actActiveIndex.value - 1, 0)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const opt = actOptions.value[actActiveIndex.value]
    if (opt) void selectAct(opt.value)
  }
}

onMounted(loadCuits)
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.spacer {
  flex: 1;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 18px;
  background: #fff;
}

.cardHeader {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.cardHeaderLeft {
  flex: 1;
  min-width: 0;
}

.cardHeaderActions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

@media (max-width: 820px) {
  .cardHeader {
    flex-direction: column;
  }
  .cardHeaderActions {
    width: 100%;
    justify-content: flex-start;
  }
}

.muted {
  color: #666;
  margin: 6px 0 0;
}

.block {
  margin-top: 14px;
}

.error {
  color: #b00020;
  margin-top: 10px;
}

.detailGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 820px) {
  .detailGrid {
    grid-template-columns: 1fr;
  }
}

.kv {
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 12px;
}

.k {
  font-size: 12px;
  color: #666;
}

.v {
  margin-top: 6px;
  font-size: 14px;
}

.inlineField {
  margin-top: 6px;
}

.hintSmall {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  width: min(640px, 100%);
  background: #fff;
  border-radius: 18px;
  padding: 18px;
}

.formRow {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
}

code {
  background: #f6f6f6;
  padding: 2px 6px;
  border-radius: 6px;
}

.btn {
  position: relative;
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  gap: 8px;
  font-size: 16px;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  line-height: 24px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btnIcon {
  height: 24px;
  width: 24px;
  display: grid;
  place-items: center;
}

.btn--tertiary {
  background-color: #fcfcfc;
  border: 1px solid #ced1d3;
  color: #242628;
  box-shadow: none;
}

.btn--tertiary:hover:not(:disabled) {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 8px rgba(36, 38, 40, 0.08);
  background-color: #f4f5f5;
  border: 1px solid #ced1d3;
}

.btn--tertiary:active:not(:disabled) {
  box-shadow: none;
  background-color: #e8eaeb;
  border: 1px solid #ced1d3;
}

.btn--primary {
  background-color: #0034c2;
  color: #fcfcfc;
  border: 1px solid transparent;
}

.btn--secondary {
  background-color: #fcfcfc;
  border: 1px solid #0034c2;
  color: #0034c2;
}

.fgSelect {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  font-size: 14px;
  color: #242628;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.fgHeader {
  align-self: stretch;
  display: flex;
  align-items: center;
}

.fgLabel {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fgLabelText {
  line-height: 22px;
  font-weight: 600;
}

.fgReq {
  line-height: 22px;
  font-weight: 600;
  color: #e00004;
}

.fgField {
  align-self: stretch;
  height: 40px;
  border-radius: 8px;
  background-color: #f4f5f5;
  border: 1px solid #ced1d3;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 4px 8px 4px 12px;
  gap: 8px;
  font-size: 16px;
  color: #686e75;
  cursor: pointer;
}

.fgSelect:not(.is-open):not(.is-disabled) .fgField:hover {
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 8px rgba(36, 38, 40, 0.08);
  background-color: #f4f5f5;
  border: 1px solid #686e75;
}

.fgSelect.is-open .fgField {
  box-shadow: none;
  background-color: #fcfcfc;
  border: 1px solid #0034c2;
}

.fgSelect.is-disabled .fgField {
  opacity: 0.6;
  cursor: not-allowed;
}

.fgLeading {
  flex: 1;
  display: flex;
  align-items: center;
}

.fgContent {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fgText {
  flex: 1;
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #242628;
}

.fgText.is-placeholder {
  color: #686e75;
}

.fgTrailing {
  display: flex;
  align-items: center;
}

.fgTrailingIcon {
  height: 32px;
  width: 32px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
  transition: transform 120ms ease;
}

.fgTrailingIcon.is-rot {
  transform: rotate(180deg);
}

.fgDropdown {
  align-self: stretch;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.04), 0px 2px 4px rgba(36, 38, 40, 0.05);
  border-radius: 12px;
  background-color: #fcfcfc;
  border: 1px solid #ced1d3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px;
  gap: 8px;
  font-size: 16px;
  color: #686e75;
  z-index: 50;
  margin-top: 8px;
}

.fgItem {
  align-self: stretch;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #686e75;
}

.fgItem:hover {
  background: #f4f5f5;
}

.fgItem.is-selected {
  background-color: #0034c2;
  color: #fff;
}

.fgItem.is-selected:hover {
  background-color: #0034c2;
}

.fgCheck {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  color: currentColor;
  opacity: 0;
}

.fgCheck.is-on {
  opacity: 1;
}

.fgOption {
  line-height: 24px;
  color: inherit;
}

input,
.modal select {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

.ipModal{
  width: min(640px, 100%);
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
}

.ipModalHeader{
  display:flex;
  align-items:flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 0;
}

.ipModalHeaderText{
  display:flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ipModalTitle{
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: #242628;
}

.ipModalSubtitle{
  font-size: 16px;
  line-height: 24px;
  color: #686e75;
}

.ipModalClose{
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display:grid;
  place-items:center;
  border: 1px solid transparent;
  background: transparent;
  color: #686e75;
  cursor: pointer;
}

.ipModalClose:hover:not(:disabled){
  background: #f4f5f5;
  border-color: #ced1d3;
  box-shadow: 0px 2px 4px rgba(0,0,0,0.05), 0px 4px 8px rgba(36,38,40,0.08);
}

.ipModalClose:active:not(:disabled){
  background: #e8eaeb;
  box-shadow: none;
}

.ipModalBody{
  padding: 24px;
  display:flex;
  flex-direction: column;
  gap: 16px;
}

.ipField{ gap: 6px; }

.ipLabel{
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #242628;
}

.ipInput, .ipSelect{
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background: #f4f5f5;
  border: 1px solid #ced1d3;
  padding: 8px 12px;
  box-sizing: border-box;
  font-size: 14px;
  line-height: 24px;
  color: #242628;
  outline: none;
}

.ipInput:focus, .ipSelect:focus{
  background: #fcfcfc;
  border-color: #0034c2;
}

.ipUpload{
  width: 100%;
  display:flex;
  align-items:center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: #f4f5f5;
  border: 1px dashed #ced1d3;
  box-sizing: border-box;
}

.ipUploadBtn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 8px 16px;
  border-radius: 8px;
  background: #fcfcfc;
  border: 1px solid #0034c2;
  color: #0034c2;
  font-weight: 600;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.ipUploadBtn:hover{
  box-shadow: 0px 2px 4px rgba(0,0,0,0.05), 0px 4px 8px rgba(36,38,40,0.08);
}

.ipUploadBtn:active{
  background: #e8eaeb;
  box-shadow: none;
}

.ipFileInput{ display:none; }

.ipUploadName{
  flex: 1;
  min-width: 0;
  overflow:hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 24px;
  color: #242628;
}

.ipUploadName.empty{ color:#686e75; }

.ipCheck{
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.ipHint{
  margin-top: 8px;
  display:flex;
  align-items:flex-start;
  gap: 8px;
  color: #686e75;
  font-size: 14px;
  line-height: 20px;
}

.ipInfo{
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.ipModalFooter{
  padding: 0 24px 24px;
}

</style>