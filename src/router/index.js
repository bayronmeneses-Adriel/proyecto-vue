// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CochesView from '../views/CochesView.vue'
import MecanicosView from '../views/MecanicosView.vue'
import ClientesView from '../views/ClientesView.vue'
import RepuestosView from '../views/RepuestosView.vue' // <<< REUESTOS IMPORT

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/coches', name: 'coches', component: CochesView },
    { path: '/mecanicos', name: 'mecanicos', component: MecanicosView },
    { path: '/clientes', name: 'clientes', component: ClientesView },
    { path: '/repuestos', name: 'repuestos', component: RepuestosView }, // <<< RUTA FINAL
  ],
})

export default router
