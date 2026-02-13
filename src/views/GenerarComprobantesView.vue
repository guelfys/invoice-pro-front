<template>
  <div class="page">
    <TopBar :logoSrc="icons.union" />

    <!-- MODAL Selección CUIT -->
    <div v-if="showCuitModal" class="modalOverlay">
      <div class="modalShell" role="dialog" aria-modal="true">
        <div class="modalHeader">
          <div class="modalHeaderText">
            <div class="modalTitleRow">
              <div class="modalTitle">Seleccionar CUIT/CUIL</div>
              <span class="envBadge" :class="env === 'demo' ? 'demo' : 'prod'">
                {{ env === 'demo' ? 'DEMO' : 'PRODUCCIÓN' }}
              </span>
            </div>
            <div class="modalSubtitle">Elegí el CUIT/CUIL con el que se va a facturar en esta ejecución.</div>
          </div>

          <button class="modalClose" type="button" aria-label="Cerrar" @click="goBack">
            <svg class="modalCloseIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="modalBody">
          <div class="field">
            <div class="fieldHeader">
              <div class="fieldLabel">CUIT/CUIL</div>
            </div>
            <div class="selectField">
              <select class="selectControl" v-model.number="selectedCuit">
                <option v-if="!cuitsList.length" :value="0" disabled>Selecciona un CUIT/CUIL</option>
                <option v-for="u in cuitsList" :key="u.cuit" :value="u.cuit">
                  {{ u.cuit }}{{ u.razon_social ? ' - ' + u.razon_social : '' }}
                </option>
              </select>
              <div class="selectTrailing" aria-hidden="true">
                <svg class="caretDown" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="field">
            <div class="fieldHeader">
              <div class="fieldLabelRow">
                <div class="fieldLabel">Factura A</div>
                <div class="req">*</div>
              </div>
            </div>
            <div class="fileUpload">
              <div class="fileContainer">
                <div class="fileLeft">
                  <input ref="inputAEl" class="fileInput" type="file" accept=".xlsx" @change="onPickFile('A', $event)" />
                  <button class="fileBtn" type="button" @click="triggerPick('A')">Seleccionar archivo</button>

                  <div class="fileNameWrap">
                    <div class="fileName" :class="{ placeholder: !fileA }">
                      {{ fileA ? fileA.name : 'Ningún archivo seleccionado' }}
                    </div>
                    <img v-if="fileA" class="checkIcon" :src="icons.checkCircle" alt="" />
                  </div>
                </div>

                <button v-if="fileA" class="trashBtn" type="button" aria-label="Quitar archivo" @click="clearPickedUI('A')">
                  <img class="trashIcon" :src="icons.trash" alt="" />
                </button>
              </div>
            </div>
          </div>

          <div class="field">
            <div class="fieldHeader">
              <div class="fieldLabelRow">
                <div class="fieldLabel">Factura B</div>
                <div class="req">*</div>
              </div>
            </div>
            <div class="fileUpload">
              <div class="fileContainer">
                <div class="fileLeft">
                  <input ref="inputBEl" class="fileInput" type="file" accept=".xlsx" @change="onPickFile('B', $event)" />
                  <button class="fileBtn" type="button" @click="triggerPick('B')">Seleccionar archivo</button>

                  <div class="fileNameWrap">
                    <div class="fileName" :class="{ placeholder: !fileB }">
                      {{ fileB ? fileB.name : 'Ningún archivo seleccionado' }}
                    </div>
                    <img v-if="fileB" class="checkIcon" :src="icons.checkCircle" alt="" />
                  </div>
                </div>

                <button v-if="fileB" class="trashBtn" type="button" aria-label="Quitar archivo" @click="clearPickedUI('B')">
                  <img class="trashIcon" :src="icons.trash" alt="" />
                </button>
              </div>
            </div>
          </div>

          <div class="field">
            <div class="fieldHeader">
              <div class="fieldLabelRow">
                <div class="fieldLabel">Factura C</div>
                <div class="req">*</div>
              </div>
            </div>
            <div class="fileUpload">
              <div class="fileContainer">
                <div class="fileLeft">
                  <input ref="inputCEl" class="fileInput" type="file" accept=".xlsx" @change="onPickFile('C', $event)" />
                  <button class="fileBtn" type="button" @click="triggerPick('C')">Seleccionar archivo</button>

                  <div class="fileNameWrap">
                    <div class="fileName" :class="{ placeholder: !fileC }">
                      {{ fileC ? fileC.name : 'Ningún archivo seleccionado' }}
                    </div>
                    <img v-if="fileC" class="checkIcon" :src="icons.checkCircle" alt="" />
                  </div>
                </div>

                <button v-if="fileC" class="trashBtn" type="button" aria-label="Quitar archivo" @click="clearPickedUI('C')">
                  <img class="trashIcon" :src="icons.trash" alt="" />
                </button>
              </div>
            </div>
          </div>

          <label class="checkboxRow">
            <input class="checkbox" type="checkbox" v-model="clearOtherFacturacion" />
            <span class="checkboxText">Limpiar Facturacion.xlsx de los otros tipos antes de guardar.</span>
          </label>

          <p v-if="modalError" class="modalError">{{ modalError }}</p>
        </div>

        <div class="modalActions">
          <button class="btnTertiary" type="button" @click="goBack">Cancelar</button>
          <button class="btnPrimary" type="button" :disabled="!selectedCuit || busy || confirming" @click="confirmCuitAndStart">
            {{ startBtnText }}
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

          <span class="envPill" :class="env === 'demo' ? 'demo' : 'prod'">
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
const icons = {
  union: new URL('@/assets/icons/Union.svg', import.meta.url).href,
  checkCircle: new URL('@/assets/icons/CheckCircle.svg', import.meta.url).href,
  trash: new URL('@/assets/icons/Trash.svg', import.meta.url).href,
}

const { env } = useRuntimeEnv()

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
// Upload Facturacion.xlsx (A/B/C)
const confirming = ref(false)
const fileA = ref<File | null>(null)
const fileB = ref<File | null>(null)
const fileC = ref<File | null>(null)
const clearOtherFacturacion = ref(true)

const hasAnyFile = computed(() => !!(fileA.value || fileB.value || fileC.value))
const startBtnText = computed(() => {
  if (confirming.value) return 'Preparando...'
  return hasAnyFile.value ? 'Subir e iniciar' : 'Iniciar'
})


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


const inputAEl = ref<HTMLInputElement | null>(null)
const inputBEl = ref<HTMLInputElement | null>(null)
const inputCEl = ref<HTMLInputElement | null>(null)

function isXlsx(file: File){
  return file.name.toLowerCase().endsWith('.xlsx')
}

function onPickFile(tipo: 'A'|'B'|'C', ev: Event){
  const input = ev.target as HTMLInputElement
  const f = input.files?.[0] || null
  if (!f) return

  if (!isXlsx(f)) {
    modalError.value = 'Por ahora solo se admite .xlsx (Facturacion.xlsx).'
    input.value = ''
    return
  }

  modalError.value = ''
  if (tipo === 'A') fileA.value = f
  if (tipo === 'B') fileB.value = f
  if (tipo === 'C') fileC.value = f
}

function clearPicked(tipo: 'A'|'B'|'C'){
  if (tipo === 'A') fileA.value = null
  if (tipo === 'B') fileB.value = null
  if (tipo === 'C') fileC.value = null
}

function triggerPick(tipo: 'A'|'B'|'C'){
  const el = tipo === 'A' ? inputAEl.value : (tipo === 'B' ? inputBEl.value : inputCEl.value)
  el?.click()
}

function clearPickedUI(tipo: 'A'|'B'|'C'){
  clearPicked(tipo)
  const el = tipo === 'A' ? inputAEl.value : (tipo === 'B' ? inputBEl.value : inputCEl.value)
  if (el) el.value = ''
}

async function uploadFacturacion(cuit: number){
  if (!hasAnyFile.value) return

  const fd = new FormData()
  fd.append('cuit', String(cuit))
  fd.append('clear_others', String(clearOtherFacturacion.value))
  if (fileA.value) fd.append('fileA', fileA.value)
  if (fileB.value) fd.append('fileB', fileB.value)
  if (fileC.value) fd.append('fileC', fileC.value)

  await http.post('/api/generar/facturacion/upload', fd)
}


async function confirmCuitAndStart(){
  if (!selectedCuit.value) {
    modalError.value = 'Seleccioná un CUIT para iniciar.'
    return
  }

  modalError.value = ''
  confirming.value = true

  try{
    // 1) Subir archivos
    await uploadFacturacion(selectedCuit.value)

    // 2) Ejecutar job
    chosenCuit.value = selectedCuit.value
    showCuitModal.value = false
    await startJob(chosenCuit.value)
  }catch(e:any){
    const msg = e?.response?.data?.detail || e?.message || 'Error al iniciar.'
    modalError.value = String(msg)
  }finally{
    confirming.value = false
  }
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

    // JSON del cuerpo (muy largo)
    if (trimmed.includes('CUERPO DE SOLICITUD SEGÚN JSON')) { inReqJson = true; continue }
    if (inReqJson) {
      if (trimmed.includes('-----------------------------------------------------')) inReqJson = false
      continue
    }

    // tabla pandas (muy larga)
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
      environment: env.value, // 'demo' | 'prod'
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
.modalShell{
  width:min(560px, calc(100% - 32px));
  background:#fcfcfc;
  border-radius:16px;
  box-shadow:0 10px 25px rgba(0,0,0,.08);
}
.modalHeader{
  width:100%;
  display:flex;
  align-items:flex-start;
  justify-content:center;
  padding:24px 24px 0;
  box-sizing:border-box;
  gap:16px;
}
.modalHeaderText{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.modalTitleRow{width:100%;display:flex;align-items:center;gap:12px}
.modalTitle{flex:1;margin:0;font-size:24px;line-height:32px;font-weight:600;color:#242628}
.modalSubtitle{margin:0;font-size:16px;line-height:24px;color:#686e75}
.modalClose{
  height:40px;width:40px;
  border-radius:8px;
  border:none;
  background:transparent;
  color:#242628;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:4px;
  cursor:pointer;
}
.modalClose:hover{background:#f4f5f5}
.modalCloseIcon{width:24px;height:24px}

.modalBody{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  padding:24px;
  box-sizing:border-box;
  gap:16px;
  font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.field{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.fieldHeader{width:100%;display:flex;align-items:center}
.fieldLabel{font-size:14px;line-height:22px;font-weight:600;color:#242628}
.fieldLabelRow{display:flex;align-items:center;gap:4px}
.req{font-size:14px;line-height:22px;font-weight:600;color:#f80004}

.selectField{
  width:100%;
  height:40px;
  border-radius:8px;
  background:#f4f5f5;
  border:1px solid #ced1d3;
  display:flex;
  align-items:center;
  padding:4px 8px 4px 12px;
  box-sizing:border-box;
  gap:8px;
}
.selectControl{
  flex:1;
  height:32px;
  border:none;
  outline:none;
  background:transparent;
  font-size:14px;
  line-height:24px;
  color:#242628;
  text-align:left;
  appearance:none;
}
.selectTrailing{height:32px;width:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:4px;box-sizing:border-box;color:#686e75}
.caretDown{width:20px;height:20px}

.fileUpload{width:100%}
.fileContainer{
  width:100%;
  border-radius:8px;
  background:#f4f5f5;
  border:1px dashed #ced1d3;
  overflow:hidden;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px;
  box-sizing:border-box;
  gap:20px;
}
.fileLeft{display:flex;align-items:center;gap:16px;min-width:0;flex:1}
.fileInput{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.fileBtn{
  border-radius:8px;
  background:#fcfcfc;
  border:1px solid #0034c2;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:8px 16px;
  cursor:pointer;
  font-size:16px;
  line-height:24px;
  font-weight:600;
  color:#0034c2;
  white-space:nowrap;
}
.fileBtn:active{transform:translateY(1px)}
.fileNameWrap{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
.fileName{font-size:16px;line-height:24px;color:#242628;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}
.fileName.placeholder{color:#686e75}
.checkIcon{width:24px;height:24px;flex:0 0 auto}
.iconBtn{
  height:40px;width:40px;
  border-radius:8px;
  border:none;
  background:transparent;
  color:#686e75;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:4px;
  cursor:pointer;
}
.iconBtn:hover{background:#fcfcfc}

.trashBtn{
  width:20px;
  height:20px;
  padding:0;
  border:none;
  background:transparent;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}

.trashIcon{
  width:20px;
  height:20px;
  display:block;
}

.checkboxRow{display:flex;align-items:center;gap:8px}
.checkbox{height:18px;width:18px;border-radius:4px}
.checkboxText{font-size:16px;line-height:24px;color:#000}

.modalActions{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  padding:0 24px 24px;
  box-sizing:border-box;
  gap:8px;
}
.btnTertiary{
  border-radius:8px;
  background:#fcfcfc;
  border:1px solid #ced1d3;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:12px 24px;
  cursor:pointer;
  font-size:16px;
  line-height:24px;
  font-weight:600;
  color:#242628;
}
.btnPrimary{
  border-radius:8px;
  background:#0034c2;
  border:none;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:12px 24px;
  cursor:pointer;
  font-size:16px;
  line-height:24px;
  font-weight:600;
  color:#fcfcfc;
}
.btnPrimary:disabled{opacity:.6;cursor:not-allowed}

.modalError{width:100%;color:#b42318;font-weight:600;font-size:12px;line-height:18px}

.envBadge{
  display:inline-flex;
  font-weight:900;
  font-size:12px;
  padding:4px 8px;
  border-radius:999px;
  border:1px solid #ced1d3;
  background:#fff;
  white-space:nowrap;
}
.envBadge.demo{color:var(--blue)}
.envBadge.prod{color:#0f7a2f}
</style>
