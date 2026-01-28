<template>
  <div class="page">
    <header class="top">
      <button class="back" @click="goBack">‹ Volver</button>
      <h1>Configuración</h1>
      <div class="spacer"></div>
    </header>

    <main class="main">
      <section class="card">
        <div class="row">
          <div>
            <h2>Gestión de CUIT/CUIL</h2>
            <p class="muted">
              Consultá la información fiscal de los CUIT/CUIL cargados o agregá uno nuevo.
            </p>
          </div>

          <div class="rowActions">
            <button class="primary" @click="openModal">Añadir CUIT/CUIL</button>
            <button class="secondary" @click="refreshArca" :disabled="loading || !selectedCuit">
              Actualizar datos (ARCA)
            </button>
          </div>
        </div>

        <div class="formRow">
          <label>CUIT/CUIL</label>
          <select v-model.number="selectedCuit" @change="loadDetail">
            <option v-for="c in cuits" :key="c.cuit" :value="c.cuit">
              {{ c.cuit }}{{ c.razon_social ? ` - ${c.razon_social}` : '' }}
            </option>
          </select>
        </div>

        <div v-if="loading" class="muted">Cargando…</div>
        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

        <div v-if="detail && selectedCuit" class="detailGrid">
          <div class="kv">
            <div class="k">Entorno</div>
            <!-- backend devuelve 'produccion' -->
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
            <div class="k">Puntos de venta</div>
            <div class="v">
              <span v-if="!detail.puntos_venta?.length">—</span>
              <ul v-else>
                <li v-for="pv in detail.puntos_venta" :key="pv.pto_vta">
                  PV {{ pv.pto_vta }} <span v-if="pv.estado">({{ pv.estado }})</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="kv">
            <div class="k">Actividades</div>
            <div class="v">
              <span v-if="!detail.actividades?.length">—</span>
              <ul v-else>
                <li v-for="a in detail.actividades" :key="a.codigo">
                  {{ a.codigo }} <span v-if="a.descripcion">- {{ a.descripcion }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- MODAL ALTA CUIT -->
    <div v-if="showModal" class="overlay">
      <div class="modal">
        <h3>Añadir CUIT/CUIL</h3>
        <p class="muted">
          Cargá el número y subí el certificado + key. El sistema validará los archivos y creará la estructura.
        </p>

        <div class="formRow">
          <label>CUIT/CUIL *</label>
          <input v-model="mCuit" placeholder="307xxxxxxxx" />
        </div>

        <!-- SOLO mostrar selector si está habilitado multi-ambiente -->
        <div class="formRow" v-if="MULTI_ENV_ENABLED">
          <label>Entorno *</label>
          <select v-model="mEnv">
            <option value="demo">DEMO (desarrollo)</option>
            <option value="prod">PRODUCCIÓN</option>
          </select>
        </div>

        <div class="formRow" v-else>
          <label>Entorno</label>
          <input value="PRODUCCIÓN" disabled />
        </div>

        <div class="formRow">
          <label>Certificado *</label>
          <input type="file" @change="onCert" />
          <div class="hint">
            Debe contener <code>-----BEGIN CERTIFICATE-----</code>.
            Se guardará como:
            <b>{{ mEnv === 'prod' ? 'MiCertificado.pem' : 'MiCertificado.cert' }}</b>
          </div>
        </div>

        <div class="formRow">
          <label>Key privada *</label>
          <input type="file" @change="onKey" />
          <div class="hint">
            Debe contener <code>-----BEGIN PRIVATE KEY-----</code> (o RSA PRIVATE KEY).
            Se guardará como:
            <b>{{ mEnv === 'prod' ? 'MiClavePrivada.key + MiclavePrivada.key' : 'MiClavePrivada.key' }}</b>
          </div>
        </div>

        <div v-if="mError" class="error">{{ mError }}</div>

        <div class="actions">
          <button class="secondary" @click="closeModal" :disabled="busy">Cancelar</button>
          <button class="primary" @click="submit" :disabled="busy">
            {{ busy ? 'Creando…' : 'Validar y añadir' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/http'
import { MULTI_ENV_ENABLED, DEFAULT_ENV } from '@/config/runtimeEnv'

type CuitItem = { cuit: number; razon_social: string }
type Detail = {
  cuit: string
  environment: 'demo' | 'produccion'
  razon_social?: string
  domicilio_comercial?: string
  condicion_iva?: string
  puntos_venta?: any[]
  actividades?: any[]
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

function goBack(){ router.push('/') }

async function loadCuits(){
  errorMsg.value = ''
  loading.value = true
  try{
    const { data } = await http.get('/api/config/cuits')
    cuits.value = (data?.cuits || []) as CuitItem[]
    if (cuits.value.length && !selectedCuit.value) {
      selectedCuit.value = cuits.value[0].cuit
      await loadDetail()
    }
  }catch(e:any){
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudieron cargar los CUITs.'
  }finally{
    loading.value = false
  }
}

async function loadDetail(){
  if(!selectedCuit.value) return
  errorMsg.value = ''
  loading.value = true
  try{
    const { data } = await http.get(`/api/config/cuits/${selectedCuit.value}`)
    detail.value = data as Detail
  }catch(e:any){
    detail.value = null
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudo cargar el detalle del CUIT.'
  }finally{
    loading.value = false
  }
}

function openModal(){
  showModal.value = true
  busy.value = false
  mError.value = ''
  mCuit.value = ''
  mEnv.value = DEFAULT_ENV
  mCert.value = null
  mKey.value = null
}
function closeModal(){ showModal.value = false }

function onCert(ev: Event){
  const f = (ev.target as HTMLInputElement).files?.[0] || null
  mCert.value = f
}
function onKey(ev: Event){
  const f = (ev.target as HTMLInputElement).files?.[0] || null
  mKey.value = f
}

async function submit(){
  mError.value = ''
  const cuit = (mCuit.value || '').replace(/\D/g,'')
  if(cuit.length !== 11){
    mError.value = 'CUIT/CUIL inválido (11 dígitos).'
    return
  }
  if(!mCert.value){
    mError.value = 'Falta el certificado.'
    return
  }
  if(!mKey.value){
    mError.value = 'Falta la key privada.'
    return
  }

  busy.value = true
  try{
    const fd = new FormData()
    fd.append('cuit', cuit)

    const envToSend = MULTI_ENV_ENABLED ? mEnv.value : 'prod'
    fd.append('environment', envToSend)

    fd.append('cert', mCert.value)
    fd.append('key', mKey.value)

    await http.post('/api/config/cuits', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showModal.value = false
    await loadCuits()
    selectedCuit.value = Number(cuit)
    await loadDetail()
  }catch(e:any){
    mError.value = e?.response?.data?.detail || e?.message || 'No se pudo crear el CUIT.'
  }finally{
    busy.value = false
  }
}

async function refreshArca(){
  if(!selectedCuit.value) return
  errorMsg.value = ''
  loading.value = true
  try{
    await http.post(`/api/config/cuits/${selectedCuit.value}/arca/refresh`)
    await loadDetail()
  }catch(e:any){
    errorMsg.value = e?.response?.data?.detail || e?.message || 'No se pudo actualizar desde ARCA.'
  }finally{
    loading.value = false
  }
}

onMounted(loadCuits)
</script>

<style scoped>
.page{ padding:24px; max-width:1100px; margin:0 auto; }
.top{ display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.back{ border:1px solid #ddd; background:#fff; padding:8px 12px; border-radius:10px; cursor:pointer; }
.spacer{ flex:1; }
.main{ display:flex; flex-direction:column; gap:16px; }
.card{ border:1px solid #eee; border-radius:16px; padding:18px; background:#fff; }
.row{ display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
.rowActions{ display:flex; gap:10px; flex-wrap:wrap; }
.muted{ color:#666; margin:6px 0 0; }
.formRow{ display:flex; flex-direction:column; gap:6px; margin-top:14px; }
input, select{ border:1px solid #ddd; border-radius:10px; padding:10px 12px; font-size:14px; }
.primary{ background:#111; color:#fff; border:none; padding:10px 14px; border-radius:12px; cursor:pointer; }
.secondary{ background:#fff; color:#111; border:1px solid #ddd; padding:10px 14px; border-radius:12px; cursor:pointer; }
.error{ color:#b00020; margin-top:10px; }
.detailGrid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:16px; }
.kv{ border:1px solid #f0f0f0; border-radius:12px; padding:12px; }
.k{ font-size:12px; color:#666; }
.v{ margin-top:6px; font-size:14px; }
.overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:20px; }
.modal{ width:min(640px, 100%); background:#fff; border-radius:18px; padding:18px; }
.actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
.hint{ font-size:12px; color:#666; margin-top:6px; }
code{ background:#f6f6f6; padding:2px 6px; border-radius:6px; }
</style>
