import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRecommendStore } from './recommend'

describe('Recommandations', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('ne choisit aucune catégorie sans historique', () => {
    const store = useRecommendStore()

    expect(store.categoriePreferee).toBeNull()
  })

  it('augmente le compteur de la catégorie consultée', () => {
  const store = useRecommendStore()
  store.compteurs.DAIRY = 2

  store.enregistrerCategorie('DAIRY')

  expect(store.compteurs.DAIRY).toBe(3)
})

it('choisit la catégorie la plus consultée', () => {
  const store = useRecommendStore()
  store.compteurs = { DAIRY: 2, SNACKS: 5, BAKERY: 1 }

  expect(store.categoriePreferee).toBe('SNACKS')
})

it('sauvegarde le compteur dans localStorage', () => {
  const store = useRecommendStore()

  store.enregistrerCategorie('DAIRY')

  const sauvegarde = JSON.parse(localStorage.getItem('eff-categories'))
  expect(sauvegarde).toEqual({ DAIRY: 1 })
})

it('récupère les compteurs déjà sauvegardés', () => {
  localStorage.setItem('eff-categories', JSON.stringify({ BAKERY: 3 }))

  const store = useRecommendStore()

  expect(store.compteurs).toEqual({ BAKERY: 3 })
})
})