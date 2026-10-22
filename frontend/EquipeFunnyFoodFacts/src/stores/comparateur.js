import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useComparateurStore = defineStore('comparateur', () => {
  const produits = ref([])

  const estPlein = computed(() => produits.value.length >= 2)

  function estDansComparateur(id) {
    return produits.value.some((p) => p.id === id)
  }

  function ajouter(produit) {
    if (estDansComparateur(produit.id)) return

    if (estPlein.value) {
      produits.value.shift()
    }
    produits.value.push(produit)
  }

  function retirer(id) {
    produits.value = produits.value.filter((p) => p.id !== id)
  }

  function vider() {
    produits.value = []
  }

  return { produits, estPlein, estDansComparateur, ajouter, retirer, vider }
})