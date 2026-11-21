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
      path: '/produits',
      name: 'produits',
      component: () => import('../views/ProduitsView.vue'),
    },
    {
      path: '/categorie/:code',
      name: 'categorie',
      component: () => import('../views/CategorieView.vue'),
    },
    {
      path: '/comparateur',
      name: 'comparateur',
      component: () => import('../views/ComparateurView.vue'),
    },
    {
  path: '/comparer',
  name: 'comparer',
  component: () => import('../views/ComparaisonView.vue'),
  meta: { titre: () => 'Comparer des produits' },
},
  ],
})

export default router
