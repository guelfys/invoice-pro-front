<template>
  <div class="page">
    <TopBar :logoSrc="icons.union" />

    <!-- MODAL Selección CUIT -->
    <div v-if="showCuitModal" class="modalOverlay">
      <div class="modalCard">
        <h2 class="modalTitle">Seleccionar CUIT</h2>
        <p class="modalSubtitle">
          Elegí el CUIT con el que se va a facturar en esta ejecución.
          <span v-if="MULTI_ENV_ENABLED" class="envBadge" :class="env === 'demo' ? 'demo' : 'prod'">
            {{ env === 'demo' ? 'DEMO' : 'PRODUCCIÓN' }}
          </span>
        </p>

        <label class="modalLabel">CUIT</label>
        <select class="modalSelect" v-model.number="selectedCuit">
          <option v-for="u in cuitsList" :key="u.cuit" :value="u.cuit">
            {{ u.cuit }}<span v-if="u.razon_social"> - {{ u.razon_social }}</span>
          </option>
        </select>

        <p v-if="modalError" class="modalError">{{ modalError }}</p>

        <div class="modalActions">
          <button class="secondary" @click="goBack">Cancelar</button>
          <button class="primary" :disabled="!selectedCuit || busy" @click="confirmCuitAndStart">
            Iniciar
          </button>
        </div>
      </div>
    </div>

    <main class="main">
      <section class="container">
        <div class="headerRow">
          <button class="back" @click="goBack">
            <span class="chev">‹</span> Volver
          </button>
          <h1>Generar comprobantes</h1>

          <span v-if="MULTI_ENV_ENABLED" class="envPill" :class="env === 'demo' ? 'demo' : 'prod'">
            {{ env === 'demo' ? 'DEMO' : 'PRODUCCIÓN' }}
          </span>
        </div>

        <!-- Panel progreso -->
        <div class="panel">
          <h2 class="title">{{ headerTitle }}</h2>
          <p class="subtitle">{{ headerSubtitle }}</p>

          <!-- FEED DE PRINTS (linea por linea) -->
          <p v-if="phase === 'running' && currentPrint" class="printLine">
            {{ currentPrint }}
          </p>

          <div class="progressRow">
            <div class="track">
              <div class="fill" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="pct">{{ progress }}%</div>
          </div>
        </div>

        <!-- Resultados (solo al finalizar) -->
        <div class="resultsPanel" v-if="phase === 'done'">
          <h3>Resultados del procesamiento</h3>

          <div class="resultsBox">
            <div v-if="results.length === 0" class="empty">
              No hay resultados para mostrar todavía.
            </div>

            <div v-else class="lines">
              <div v-for="(r, idx) in results" :key="idx" class="line">
                <div class="lineTop">
                  <div class="lineTitle" :class="titleClass(r)">
                    {{ r.title }}
                  </div>

                  <!-- Observaciones: autorizado igual, pero “!” con hover -->
                  <span v-if="r.status === 'success' && r.observations.length" class="infoDot">
                    !
                    <span class="tooltip">
                      <div class="ttTitle">Observaciones</div>
                      <div class="ttLine" v-for="(o, i) in r.observations" :key="i">
                        Código {{ o.code }}: {{ o.desc }}
                      </div>
                    </span>
                  </span>
                </div>

                <!-- CAE (y/o error) visible -->
                <div v-if="r.detail" class="lineDetail" :class="detailClass(r)">
                  {{ r.detail }}
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="secondary" :disabled="busy" @click="retry">
              Volver a ejecutar
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import { http } from '@/api/http'
import { useRuntimeEnv } from '@/composables/useRuntimeEnv'
import { MULTI_ENV_ENABLED, DEFAULT_ENV } from '@/config/runtimeEnv'

type Phase = 'idle' | 'running' | 'done'
type CodeDesc = { code: number; desc: string }

type ParsedResult = {
  nro: number | null
  status: 'success' | 'error'
  title: string
  detail: string
  observations: CodeDesc[]
}

type CuitItem = { cuit: number; razon_social: string }

const router = useRouter()
const icons = { union: new URL('@/assets/icons/Union.svg', import.meta.url).href }

const { env } = useRuntimeEnv()
const effectiveEnv = computed(() => (MULTI_ENV_ENABLED ? env.value : DEFAULT_ENV))

const phase = ref<Phase>('idle')
const busy = ref(false)

const jobId = ref<string>('')
const jobLog = ref<string>('')

const currentPrint = ref<string>('')      
const seenPrints = ref<number>(0)      
const percent = ref<number>(0)

const printFeed = ref<string[]>([])
const MAX_FEED_LINES = 120

let pollTimer: number | null = null

// Modal CUIT
const showCuitModal = ref(true)
const cuitsList = ref<CuitItem[]>([])
const selectedCuit = ref<number | null>(null)
const chosenCuit = ref<number | null>(null)
const modalError = ref('')

const progress = computed(() => {
  if (phase.value === 'done') return 100
  return Math.min(99, Math.max(0, Math.round(percent.value)))
})

const results = computed(() => {
  if (phase.value !== 'done') return []
  return parseResultsFromLog(jobLog.value || '')
})

const counts = computed(() => {
  let authorized = 0
  let failed = 0
  for (const r of results.value) {
    if (r.status === 'error') failed++
    else authorized++
  }
  return { authorized, failed }
})

const headerTitle = computed(() => {
  if (phase.value !== 'done') return 'Iniciando el proceso'
  if (counts.value.failed > 0) return 'Proceso finalizado con errores'
  return 'Proceso finalizado'
})

const headerSubtitle = computed(() => {
  if (phase.value === 'done') {
    const { authorized, failed } = counts.value
    return `Resumen: ${authorized} autorizados · ${failed} fallados.`
  }
  return 'Ejecutando el proceso de generación de comprobantes.'
})

function goBack(){
  router.push('/')
}

function stopPolling(){
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

function resetRun(){
  phase.value = 'idle'
  busy.value = false
  jobId.value = ''
  jobLog.value = ''
  currentPrint.value = ''
  seenPrints.value = 0
  percent.value = 0
  printFeed.value = []
}

async function loadCuitsForModal(){
  modalError.value = ''
  try{
    const { data } = await http.get('/api/config/cuits')
    cuitsList.value = (data?.cuits || []) as CuitItem[]
    if (!cuitsList.value.length) {
      modalError.value = 'No hay CUITs cargados en Config.xlsx.'
      selectedCuit.value = null
      return
    }
    if (!selectedCuit.value) {
      selectedCuit.value = cuitsList.value[0].cuit
    }
  }catch(e:any){
    modalError.value = e?.message || 'No se pudieron cargar los CUITs.'
  }
}

async function confirmCuitAndStart(){
  if (!selectedCuit.value) {
    modalError.value = 'Seleccioná un CUIT para iniciar.'
    return
  }
  chosenCuit.value = selectedCuit.value
  showCuitModal.value = false
  await startJob(chosenCuit.value)
}

function isTechnicalLine(l: string){
  return (
    l.startsWith('[JOB ') ||
    l.startsWith('INFO:') ||
    l.startsWith('Traceback') ||
    l.includes('\\site-packages\\') ||
    l.includes('uvicorn') ||
    l.includes('Started server process') ||
    l.includes('Waiting for application startup') ||
    l.includes('Application startup complete') ||
    l.startsWith('PYTHON:') ||
    l.startsWith('SCRIPT:') ||
    l.startsWith('CWD:') ||
    l.startsWith('Ejecutando:')
  )
}

function looksLikeTableHeader(line: string){
  return (line.includes('Tipo Dato') && line.includes('Fecha'))
}

function buildPrintFeed(raw: string): string[] {
  const src = raw.replace(/\r/g, '').split('\n')

  const out: string[] = []
  let inXml = false
  let inReqJson = false
  let inTable = false

  for (const line0 of src) {
    const line = line0.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) continue
    if (isTechnicalLine(trimmed)) continue

    // XML WSAA
    if (trimmed.startsWith('<?xml')) { inXml = true; continue }
    if (inXml) {
      if (trimmed.includes('</loginTicketResponse>')) inXml = false
      continue
    }

    if (trimmed.includes('CUERPO DE SOLICITUD SEGÚN JSON')) { inReqJson = true; continue }
    if (inReqJson) {
      if (trimmed.includes('-----------------------------------------------------')) inReqJson = false
      continue
    }

    if (!inTable && looksLikeTableHeader(trimmed)) { inTable = true; continue }
    if (inTable) {
      if (trimmed.includes('rows x') && trimmed.includes('columns')) inTable = false
      continue
    }

    out.push(trimmed)
  }

  return out
}

function sanitizeLine(line: string){
  const idx = line.indexOf(' - ')
  const s = idx >= 0 ? line.slice(idx + 3) : line
  return s.trim()
}

function looksLikeTable(line: string){
  return (
    line.includes('[rows x') ||
    (line.includes('Tipo Dato') && line.includes('Fecha')) ||
    /\s{3,}/.test(line) && /\d/.test(line) && line.length > 60
  )
}

function updateProgressAndPrintFromLog(raw: string){
  const feedAll = buildPrintFeed(raw)
  printFeed.value = feedAll.slice(-MAX_FEED_LINES)
  currentPrint.value = printFeed.value.length ? printFeed.value[printFeed.value.length - 1] : currentPrint.value

  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  const clean = lines
    .filter(l => !isTechnicalLine(l))
    .map(sanitizeLine)
    .filter(l => l && !looksLikeTable(l))
    .filter(l => !l.includes('CUERPO DE SOLICITUD SEGÚN JSON'))

  const printCandidates = clean.filter(l =>
    /^\[\d{2}:\d{2}:\d{2}\]/.test(l) ||
    /Inicia|Inicia el proceso|Encontró|Inicia proceso|Finalización|SUMATORIA|Autorizado|Rechazado/i.test(l)
  )

  if (printCandidates.length > seenPrints.value) {
    const diff = printCandidates.length - seenPrints.value
    percent.value = Math.min(99, percent.value + diff * 4)
    seenPrints.value = printCandidates.length
  }
}

async function startJob(cuit: number){
  resetRun()
  busy.value = true
  phase.value = 'running'
  currentPrint.value = 'Preparando la ejecución...'

  try{
    const { data } = await http.post('/jobs/generar', {
      mode: 'local',
      cuit,
      environment: effectiveEnv.value,
    })

    jobId.value = data.id

    await refreshJob()

    stopPolling()
    pollTimer = window.setInterval(refreshJob, 900)
  }catch(e:any){
    phase.value = 'done'
    jobLog.value = (jobLog.value || '') + `\nError: ${e?.message || 'No se pudo iniciar el proceso.'}`
    busy.value = false
  }
}

async function refreshJob(){
  if (!jobId.value) return

  try{
    const metaResp = await http.get(`/jobs/${jobId.value}`)
    const meta = metaResp.data || {}
    const status = String(meta.status || '').toLowerCase()
    const exitCode = meta.exit_code

    const logResp = await http.get(`/jobs/${jobId.value}/log`)
    const logData = logResp.data || {}
    jobLog.value = String(logData.log || jobLog.value || '')
    updateProgressAndPrintFromLog(jobLog.value)

    const isDone = (exitCode !== null && exitCode !== undefined) || (status !== 'running' && status !== 'queued')

    if (isDone) {
      phase.value = 'done'
      percent.value = 100
      busy.value = false
      stopPolling()
    } else {
      phase.value = 'running'
    }
  }catch{

  }
}

async function retry(){
  stopPolling()
  if (!chosenCuit.value) {
    showCuitModal.value = true
    return
  }
  await startJob(chosenCuit.value)
}

onMounted(async () => {
  await loadCuitsForModal()
  showCuitModal.value = true
})

onBeforeUnmount(() => {
  stopPolling()
})


function extractCodes(sectionText: string): CodeDesc[] {
  const out: CodeDesc[] = []
  const re = /'codigo'\s*:\s*(\d+)\s*,\s*'descripcion'\s*:\s*'([^']+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(sectionText)) !== null) {
    out.push({ code: Number(m[1]), desc: String(m[2]) })
    if (out.length >= 20) break
  }
  return out
}

function extractSection(block: string, key: 'arrayObservaciones' | 'arrayErrores') {
  const idx = block.indexOf(`'${key}'`)
  if (idx === -1) return ''
  return block.slice(idx, idx + 5000)
}

function extractNumber(block: string, key: string) {
  const re = new RegExp(`'${key}'\\s*:\\s*(\\d+)`)
  const m = re.exec(block)
  return m ? Number(m[1]) : null
}

function extractDate(block: string, key: string) {
  const re = new RegExp(`'${key}'\\s*:\\s*datetime\\.date\\((\\d{4}),\\s*(\\d{1,2}),\\s*(\\d{1,2})\\)`)
  const m = re.exec(block)
  if (!m) return ''
  const y = m[1], mo = String(m[2]).padStart(2,'0'), d = String(m[3]).padStart(2,'0')
  return `${d}/${mo}/${y}`
}

function parseBlocks(raw: string): string[] {
  const lines = raw.split(/\r?\n/)
  const blocks: string[] = []

  let capturing = false
  let buf: string[] = []
  let brace = 0

  for (const line0 of lines) {
    const line = line0.trim()
    const isStart = line.includes('Respuesta del servicio') || line.includes("'resultado'")

    if (!capturing && isStart && line.includes('{')) {
      capturing = true
      buf = [line]
      const chunk = line.slice(line.indexOf('{'))
      brace = (chunk.match(/{/g)?.length || 0) - (chunk.match(/}/g)?.length || 0)
      if (brace <= 0) {
        capturing = false
        blocks.push(buf.join('\n'))
        buf = []
      }
      continue
    }

    if (capturing) {
      buf.push(line)
      brace += (line.match(/{/g)?.length || 0) - (line.match(/}/g)?.length || 0)
      if (brace <= 0) {
        capturing = false
        blocks.push(buf.join('\n'))
        buf = []
      }
    }
  }

  return blocks
}

function parseResultsFromLog(raw: string): ParsedResult[] {
  const blocks = parseBlocks(raw)
  const out: ParsedResult[] = []

  let fallbackNro = 1

  for (const b of blocks) {
    const resM = /'resultado'\s*:\s*'([A-Z])'/i.exec(b)
    const resultado = (resM?.[1] || '').toUpperCase()

    const nro = extractNumber(b, 'numeroComprobante') ?? fallbackNro++
    const cae = extractNumber(b, 'CAE')
    const vto = extractDate(b, 'fechaVencimientoCAE')

    const obsSec = extractSection(b, 'arrayObservaciones')
    const errSec = extractSection(b, 'arrayErrores')

    const observations = extractCodes(obsSec)
    const errors = extractCodes(errSec)

    if (errors.length || resultado === 'R') {
      const detail = errors.slice(0, 3).map(e => `Código ${e.code}: ${e.desc}`).join(' · ')
      out.push({
        nro,
        status: 'error',
        title: `Comprobante ${nro} rechazado`,
        detail: detail || 'El comprobante fue rechazado por AFIP.',
        observations: [],
      })
      continue
    }

    const caeLine = cae ? `CAE ${cae}${vto ? ` (vto ${vto})` : ''}.` : 'Autorizado correctamente.'
    out.push({
      nro,
      status: 'success',
      title: `Comprobante ${nro} autorizado`,
      detail: caeLine,
      observations,
    })
  }

  out.sort((a,b) => (a.nro ?? 0) - (b.nro ?? 0))
  return out
}

function titleClass(r: ParsedResult){
  return r.status === 'error' ? 'tError' : 'tSuccess'
}

function detailClass(r: ParsedResult){
  return r.status === 'error' ? 'dError' : 'dNeutral'
}
</script>

<style scoped>
.page{min-height:100vh;display:flex;flex-direction:column}
.main{flex:1;display:flex;justify-content:center;padding:40px 16px}
.container{width:min(var(--container-max),100%);display:flex;flex-direction:column;gap:18px}

.headerRow{display:flex;align-items:center;gap:14px}
h1{margin:0;font-size:28px;letter-spacing:-0.8px;color:var(--text)}
.back{border:1px solid var(--border);background:var(--surface);border-radius:10px;padding:10px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:10px}
.chev{font-size:18px;line-height:0}

.envPill{
  margin-left:auto;
  font-weight:900;
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid var(--border);
  background:#fff;
}
.envPill.demo{color:var(--blue)}
.envPill.prod{color:#0f7a2f}

.panel{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius-lg);
  padding:26px;
}
.title{margin:0;font-size:44px;letter-spacing:-1.2px;line-height:1.05;color:var(--text)}
.subtitle{margin:10px 0 0 0;color:var(--muted);font-size:16px;line-height:24px}

.printLine{
  margin:10px 0 0 0;
  color:var(--text);
  font-size:13px;
  line-height:18px;
  white-space:pre-line;
}

.progressRow{display:flex;align-items:center;gap:14px;margin-top:18px}
.track{height:16px;flex:1;border-radius:10px;border:1px solid var(--border);background:#fff;overflow:hidden}
.fill{height:100%;background:var(--blue);width:0%}
.pct{min-width:48px;text-align:right;font-weight:700;color:var(--text)}

.resultsPanel{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:var(--radius-lg);
  padding:26px;
}
h3{margin:0;font-size:34px;letter-spacing:-1px;color:var(--text)}
.resultsBox{margin-top:16px;border:1px solid var(--border);border-radius:12px;padding:18px}
.empty{color:var(--muted)}
.lines{display:flex;flex-direction:column;gap:16px}
.lineTop{display:flex;align-items:center;gap:10px}
.lineTitle{font-weight:800}
.lineDetail{margin-top:6px;line-height:22px}

.tSuccess{color:#0f7a2f}
.tError{color:#d40000}
.dNeutral{color:var(--muted)}
.dError{color:#d40000}

.actions{display:flex;justify-content:flex-end;margin-top:14px}
.secondary{border:1px solid var(--border);background:#fff;border-radius:10px;padding:10px 14px;cursor:pointer}
.secondary:disabled{opacity:.6;cursor:not-allowed}

/* Tooltip para observaciones */
.infoDot{
  width:20px;height:20px;border-radius:999px;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--border);
  color:var(--muted);
  font-weight:900;font-size:12px;
  position:relative;
  cursor:default;
}
.tooltip{
  display:none;
  position:absolute;
  right:0;
  top:26px;
  width:420px;
  max-width:70vw;
  background:#fff;
  border:1px solid var(--border);
  border-radius:12px;
  padding:12px;
  box-shadow:0 10px 25px rgba(0,0,0,.08);
  z-index:20;
}
.infoDot:hover .tooltip{display:block}
.ttTitle{font-weight:800;color:var(--text);margin-bottom:8px}
.ttLine{color:var(--muted);font-size:13px;line-height:18px;margin-top:6px}

/* ===== MODAL ===== */
.modalOverlay{
  position:fixed; inset:0;
  background:rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center;
  z-index:9999;
}
.modalCard{
  width:min(540px, calc(100% - 32px));
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  padding:22px;
}
.modalTitle{margin:0;color:var(--text);font-size:20px}
.modalSubtitle{margin:8px 0 16px 0;color:var(--muted);font-size:14px;line-height:20px}
.modalLabel{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.modalSelect{
  width:100%;
  border:1px solid var(--border);
  background:var(--surface);
  border-radius:10px;
  padding:10px 12px;
}
.modalActions{display:flex; justify-content:flex-end; gap:10px; margin-top:16px}
.modalError{margin-top:10px;color:#b42318;font-weight:600;font-size:12px}
.primary{
  background:var(--blue); color:#fff; border:none;
  border-radius:10px; padding:10px 14px; cursor:pointer;
  font-weight:800;
}
.primary:disabled{opacity:.6; cursor:not-allowed}

.envBadge{
  display:inline-flex;
  margin-left:10px;
  font-weight:900;
  font-size:12px;
  padding:4px 8px;
  border-radius:999px;
  border:1px solid var(--border);
  background:#fff;
}
.envBadge.demo{color:var(--blue)}
.envBadge.prod{color:#0f7a2f}
</style>
