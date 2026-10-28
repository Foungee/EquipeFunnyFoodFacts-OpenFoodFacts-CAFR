import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/produit/:id',
      name: 'product-detail',
      component: () => import('../views/ProductDetailView.vue'),
    },

    {
      path: '/resultat',
      name: 'resultats',
      component: () => import('../views/resultatView.vue'),
    },
    {
      path: '/comparateur',
      name: 'comparateur',
      component: () => import('../views/ComparateurView.vue'),
    },

  ],
})

export default router