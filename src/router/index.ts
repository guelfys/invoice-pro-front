import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import GenerarComprobantesView from '@/views/GenerarComprobantesView.vue'
import ConfiguracionView from '@/views/ConfiguracionView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/armar', name: 'armar', component: PlaceholderView, props: { title: 'Añadir comprobantes' } },
    { path: '/generar', name: 'generar', component: GenerarComprobantesView },
    { path: '/config', name: 'config', component: ConfiguracionView },
  ],
})

export default router
