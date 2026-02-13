<template>
  <div class="page">
    <TopBar :logoSrc="icons.union" />
    <main class="main">
      <section class="container">
        <div class="logoBlock">
          <img :src="icons.unionLarge" class="logoLarge" alt="InvoicerPRO" />
          <div class="logoText">
            <span class="invoice">Invoice</span><span class="r">r</span><span class="pro">PRO</span>
            <span class="ver">3.0</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="header">
          <h1>Bienvenido usuario</h1>
          <p>Con InvoicerPRO vas a poder automatizar la facturación electrónica de forma simple y segura.</p>
        </div>

        <InfoBanner title="¿Es tu primera vez usando la aplicación?" :iconSrc="icons.info">
          <span>Antes de comenzar, es necesario que tengas configurados los siguientes requisitos que se 
            encuentran detallados en el siguiente archivo: Manual Autorización ARCA y completes los datos requeridos en la pantalla de </span>
          <a href="#" @click.prevent="goConfig">Configuración</a>
          <span>.</span>
          <div style="height:8px"></div>
          <span>Ante cualquier duda sobre el uso de la aplicación, consultá el Manual de usuario.</span>
        </InfoBanner>

        <div class="cards">
          <button type="button" class="buttoncard" @click="goGenerar" aria-label="Generar comprobantes">
            <img class="cardIcon" :src="icons.fileArrowUp" alt="" aria-hidden="true" />
            <div class="cardContent">
              <div class="cardTitle">Generar comprobantes</div>
              <div class="cardDesc">Generá comprobantes electrónicos desde el archivo Excel.</div>
            </div>
          </button>

          <button type="button" class="buttoncard" @click="goConfig" aria-label="Configuración">
            <img class="cardIcon" :src="icons.gear" alt="" aria-hidden="true" />
            <div class="cardContent">
              <div class="cardTitle">Configuración</div>
              <div class="cardDesc">Administrá la configuración necesaria para la emisión de comprobantes.</div>
            </div>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import InfoBanner from '@/components/InfoBanner.vue'

const router = useRouter()

const icons = {
  union: new URL('@/assets/icons/Union.svg', import.meta.url).href,
  unionLarge: new URL('@/assets/icons/Union.svg', import.meta.url).href,
  info: new URL('@/assets/icons/Info.svg', import.meta.url).href,
  fileArrowUp: new URL('@/assets/icons/FileArrowUp.svg', import.meta.url).href,
  gear: new URL('@/assets/icons/Gear.svg', import.meta.url).href,
}

function goGenerar(){ router.push('/generar') }
function goConfig(){ router.push('/config') }

function openManual(which: 'afip' | 'user'){
  alert(which === 'afip' ? 'Abrir Manual AFIP' : 'Abrir Manual de usuario')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 48px 16px;
}
.container {
  width: min(var(--container-max), 100%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.logoBlock {
  display: flex;
  align-items: center;
  gap: 18px;
}
.logoLarge {
  width: 64px;
  height: 64px;
}
.logoText {
  font-size: 30px;
  letter-spacing: -0.6px;
  display: flex;
  align-items: baseline;
  gap: 0px;
}
.invoice { font-weight: 500; }
.r { letter-spacing: 2.6px; font-weight: 500; }
.pro { font-weight: 700; margin-left: 2px; }
.ver { font-weight: 500; margin-left: 10px; }

.divider {
  width: 162px;
  height: 4px;
  background: var(--blue);
  border-radius: 2px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: -1px;
  line-height: 40px;
}
.header p {
  margin: 8px 0 0 0;
  font-size: 16px;
  line-height: 24px;
  color: var(--muted);
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
@media (max-width: 980px) {
  .cards { grid-template-columns: 1fr; }
}

.buttoncard {
  width: 100%;
  height: 256px;
  border-radius: 12px;
  background-color: #ffffff;
  border: 1px solid var(--border);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  gap: 16px;
  text-align: center;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  cursor: pointer;

  box-shadow: 0px 2px 4px rgba(0,0,0,0.05), 0px 4px 8px rgba(36,38,40,0.08);
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background-color 120ms ease;
}

.buttoncard:hover {
  background-color: #00258a;
  border-color: rgba(0, 52, 194, 0.95);
  transform: translateY(-1px);
  box-shadow: 0px 6px 14px rgba(0,0,0,0.10), 0px 10px 24px rgba(36,38,40,0.12);
}

.buttoncard:active {
  transform: translateY(0px);
}

.buttoncard:focus-visible {
  outline: 3px solid rgba(0, 52, 194, 0.28);
  outline-offset: 2px;
}

.buttoncard:hover:focus-visible {
  outline-color: rgba(255,255,255,0.35);
}

.cardIcon {
  width: 64px;
  height: 64px;
  filter: none;
  transition: filter 120ms ease;
}

.buttoncard:hover .cardIcon {
  filter: brightness(0) invert(1);
}

.cardContent {
  width: min(269px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cardTitle {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: #111111;
  transition: color 120ms ease;
}

.cardDesc {
  font-size: 16px;
  line-height: 24px;
  color: var(--muted);
  transition: color 120ms ease;
}

.buttoncard:hover .cardTitle {
  color: #fcfcfc;
}

.buttoncard:hover .cardDesc {
  color: #ced1d3;
}
</style>
