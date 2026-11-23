import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RecommandationsProduits from './RecommandationsProduits.vue'
import { useRecommendStore } from '../stores/recommend'

describe('Affichage des recommandations', () => {
  let pinia
  let composant

  const produits = [
    { id: '1', nom: 'Produit 1' },
    { id: '2', nom: 'Produit 2' },
    { id: '3', nom: 'Produit 3' },
    { id: '4', nom: 'Produit 4' },
    { id: '5', nom: 'Produit 5' },
  ]

  beforeEach(() => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => produits,
    }))
  })

  afterEach(() => {
    composant?.unmount()
    composant = undefined
    vi.unstubAllGlobals()
  })

  function afficherComposant() {
    composant = mount(RecommandationsProduits, {
      global: {
        plugins: [pinia],
        stubs: { RouterLink: true },
      },
    })
  }

  it('ne contacte pas le backend sans historique', () => {
    afficherComposant()

    expect(fetch).not.toHaveBeenCalled()
  })

  it('demande les produits de la catégorie préférée', () => {
    const store = useRecommendStore()
    store.compteurs = { SNACKS: 3, DAIRY: 1 }

    afficherComposant()

    const adresse = fetch.mock.calls[0][0]
    expect(adresse).toContain('categorie=SNACKS')
  })

  it('affiche au maximum quatre produits', async () => {
    const store = useRecommendStore()
    store.compteurs = { DAIRY: 1 }

    afficherComposant()
    await flushPromises()

    expect(composant.findAll('article')).toHaveLength(4)
  })

  it('affiche les deux produits si le backend en renvoie deux', async () => {
    const store = useRecommendStore()
    store.compteurs = { DAIRY: 1 }

    fetch.mockResolvedValue({
      ok: true,
      json: async () => produits.slice(0, 2),
    })

    afficherComposant()
    await flushPromises()

    expect(composant.findAll('article')).toHaveLength(2)
  })

  it('affiche un message si le backend répond avec une erreur', async () => {
    const store = useRecommendStore()
    store.compteurs = { DAIRY: 1 }

    fetch.mockResolvedValue({ ok: false })

    afficherComposant()
    await flushPromises()

    expect(composant.text()).toContain(
      'Les recommandations sont temporairement indisponibles.',
    )
  })
})