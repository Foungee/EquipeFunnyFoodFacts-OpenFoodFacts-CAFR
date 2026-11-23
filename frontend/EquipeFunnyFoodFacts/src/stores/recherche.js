import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { MAX_COMPARAISON } from '../config'
import {
  appelerApi, compter, convertirProduit, creerFiltres,
  filtrerProduits, listerMarques, trierProduits,
} from '../utils/produits'

const LIMITE_PRODUITS = 500

export const useRechercheStore = defineStore('recherche', () => {
  const requete = ref('')
  const produits = ref([])
  const chargement = ref(false)
  const erreur = ref('')
  const tri = ref('pertinence')
  const filtres = ref(creerFiltres())
  const selection = ref([])

  async function charger(texte = requete.value) {
    if (texte !== requete.value) filtres.value.marques = []
    requete.value = texte
    chargement.value = true
    erreur.value = ''
    produits.value = []
    selection.value = []

    try {
      const parametres = new URLSearchParams({ limit: String(LIMITE_PRODUITS) })
      if (texte) parametres.set('recherche', texte)

      const donnees = await appelerApi(`/produits?${parametres}`)
      if (!Array.isArray(donnees)) throw new Error('Réponse du serveur invalide.')

      const liste = donnees.filter((p) => p && p.id != null).map(convertirProduit)
      produits.value = [...new Map(liste.map((p) => [p.id, p])).values()] // retire les doublons
    } catch (e) {
      console.error('Recherche des produits :', e)
      erreur.value = navigator.onLine
        ? 'Impossible de charger les produits pour le moment. Réessayez.'
        : 'Vous semblez hors ligne. Vérifiez votre connexion Internet.'
    } finally {
      chargement.value = false
    }
  }

  /* Résultats et compteurs */
  const resultats = computed(() => trierProduits(filtrerProduits(produits.value, filtres.value), tri.value))
  const marques = computed(() => listerMarques(produits.value))
  const comptes = computed(() => ({
    nutri: compter(produits.value, (p) => p.nutriScore),
    nova: compter(produits.value, (p) => p.nova),
    categories: compter(produits.value, (p) => p.categorieCode),
  }))
  const allergenesDisponibles = computed(() => produits.value.some((p) => p.allergenes?.length))

  /* Filtres */
  const nbFiltres = computed(() => {
    const f = filtres.value
    return (f.nutriScore ? 1 : 0) + (f.nova ? 1 : 0) +
      f.allergenes.length + f.categories.length + f.marques.length
  })

  function basculer(cle, valeur) {
    const liste = filtres.value[cle]
    filtres.value[cle] = liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]
  }

  function choisirNutriScore(score) {
    filtres.value.nutriScore = filtres.value.nutriScore === score ? '' : score
  }

  function choisirNova(niveau) {
    filtres.value.nova = filtres.value.nova === niveau ? 0 : niveau
  }

  function effacerFiltres() {
    filtres.value = creerFiltres()
  }

  /* Sélection pour la comparaison */
  const selectionPleine = computed(() => selection.value.length >= MAX_COMPARAISON)

  function basculerSelection(id) {
    if (selection.value.includes(id)) {
      selection.value = selection.value.filter((s) => s !== id)
    } else if (!selectionPleine.value) {
      selection.value = [...selection.value, id]
    }
  }

  return {
    requete, produits, chargement, erreur, tri, filtres, selection,
    resultats, marques, comptes, allergenesDisponibles, nbFiltres, selectionPleine,
    charger, basculer, choisirNutriScore, choisirNova, effacerFiltres, basculerSelection,
  }
})