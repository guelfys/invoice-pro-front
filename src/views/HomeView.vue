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
          <span>Antes de comenzar, es necesario que tengas configurados los siguientes requisitos que se encuentran detallados en el siguiente archivo: </span>
          <a href="#" @click.prevent="openManual('afip')">Manual de Autorizaciones AFIP</a>
          <span> y completes los datos requeridos en la pantalla de </span>
          <a href="#" @click.prevent="goConfig">Configuración</a>
          <span>.</span>
          <div style="height:8px"></div>
          <span>Ante cualquier duda sobre el uso de la aplicación, consultá el </span>
          <a href="#" @click.prevent="openManual('user')">Manual de usuario</a>
        </InfoBanner>

        <div class="cards">
          <!--
          <ActionCard
            title="Añadir comprobantes"
            description="Sumá facturas, notas de crédito o débito al archivo Excel."
            :iconSrc="icons.filePlus"
            @click="goArmar"
          />
          -->
          <ActionCard
            title="Generar comprobantes"
            description="Generá comprobantes electrónicos desde el archivo Excel."
            :iconSrc="icons.fileArrowUp"
            @click="goGenerar"
          />
          <ActionCard
            title="Configuración"
            description="Administrá la configuración necesaria para la emisión de comprobantes."
            :iconSrc="icons.gear"
            @click="goConfig"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import InfoBanner from '@/components/InfoBanner.vue'
import ActionCard from '@/components/ActionCard.vue'

const router = useRouter()

const icons = {
  union: new URL('@/assets/icons/Union.svg', import.meta.url).href,
  unionLarge: new URL('@/assets/icons/Union.svg', import.meta.url).href,
  info: new URL('@/assets/icons/Info.svg', import.meta.url).href,
  filePlus: new URL('@/assets/icons/FilePlus.svg', import.meta.url).href,
  fileArrowUp: new URL('@/assets/icons/FileArrowUp.svg', import.meta.url).href,
  gear: new URL('@/assets/icons/Gear.svg', import.meta.url).href,
}

function goArmar(){ router.push('/armar') }
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
.invoice {
  font-weight: 500;
}
.r {
  letter-spacing: 2.6px;
  font-weight: 500;
}
.pro {
  font-weight: 700;
  margin-left: 2px;
}
.ver {
  font-weight: 500;
  margin-left: 10px;
}

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
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
@media (max-width: 980px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
