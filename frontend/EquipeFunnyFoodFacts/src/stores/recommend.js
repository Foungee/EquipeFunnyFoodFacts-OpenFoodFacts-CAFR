import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const CLE = 'eff-categories'
function lireLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) ?? {}
  } catch {
    return {}
  }
}

/**
 * STORE DE RECOMMENDATION : MÉMORIE DANS LE LOCALSTORAGE DU NAVIGATEUR
 * 
 */
export const useRecommendStore = defineStore('recommend', () => {
  const compteurs = ref(lireLocalStorage())

  const categoriePreferee = computed(() => {
    // TRANSFORME L'OBJET { DAIRY: 3, SNACKS: 1 } EN TABLEAU DE PAIRES [['DAIRY', 3], ['SNACKS', 1]]
    const input = Object.entries(compteurs.value)

    if (input.length === 0) {
      return null
    }

    // TRIE DU PLUS GRAND COMPTEUR AU PLUS PETIT
    // (COURANT[1] ET SUIVANT[1] SONT LES COMPTEURS DES DEUX PAIRES COMPARÉES)
    input.sort((courant, suivant) => suivant[1] - courant[1])

    return input[0][0]
  })

  /**
   * PERMET D'INCRÉMENTER LE COMPTEUR D'UNE CATÉGORIE
   * @param {*} categorie 
   * @returns 
   */
  function enregistrerCategorie(categorie) {
    if (categorie == null) {
      return
    }

    if (isNaN(compteurs.value[categorie])) {
      compteurs.value[categorie] = 0
    }
    compteurs.value[categorie]++

    localStorage.setItem(CLE, JSON.stringify(compteurs.value))
  }

  return { compteurs, categoriePreferee, enregistrerCategorie }
})
