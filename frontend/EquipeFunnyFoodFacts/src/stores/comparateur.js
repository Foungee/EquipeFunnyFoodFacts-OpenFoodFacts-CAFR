import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appelerApi, convertirProduit } from '../utils/produits'

async function chargerProduit(id) {
  const donnees = await appelerApi(`/produits/${encodeURIComponent(id)}`)
  const brut = Array.isArray(donnees) ? donnees[0] : (donnees?.produit ?? donnees)
  if (!brut || typeof brut !== 'object') throw new Error('Produit invalide.')
  return convertirProduit({ id, ...brut })
}

export const useComparateurStore = defineStore('comparateur', () => {
  const produits = ref([])
  const chargement = ref(false)
  const erreur = ref('')
  const seulementDifferences = ref(false)

  async function charger(codes) {
    erreur.value = ''
    produits.value = []
    if (!codes.length) return

    chargement.value = true
    try {
      produits.value = await Promise.all(codes.map(chargerProduit))
    } catch (e) {
      console.error('Chargement de la comparaison :', e)
      erreur.value = 'Impossible de charger les produits. Vérifiez votre connexion et réessayez.'
    } finally {
      chargement.value = false
    }
  }

  return { produits, chargement, erreur, seulementDifferences, charger }
})