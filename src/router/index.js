// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CochesView from '../views/CochesView.vue'
import MecanicosView from '../views/MecanicosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/coches',
      name: 'coches',
      component: CochesView,
    },
    {
      path: '/mecanicos',
      name: 'mecanicos',
      component: MecanicosView,
    },
    // La ruta /about fue eliminada.
  ],
})

export default router
