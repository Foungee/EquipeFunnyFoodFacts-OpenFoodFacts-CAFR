import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../controllers/dbController.mjs', () => ({
  query: vi.fn(),
}))

import { getProductById } from '../services/produitsService.mjs'
import { query } from '../controllers/dbController.mjs'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getProductById', () => {
  it('appelle query avec la bonne requête et l\'id, et retourne le produit mappé', async () => {
    query.mockResolvedValue([{
      nom: 'Pomme', marque: 'Brand', prix: 2.5,
      categorie: 'fruits', nutriScore: 'b',
      calories: 52, proteines: 0.3, sodium: 1,
    }])

    const resultat = await getProductById('ext-123')

    // 1. la requête part avec le bon id
    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('FROM my_db.main.metadata'),
      ['ext-123'],
    )

    expect(resultat).toEqual({
      nom: 'Pomme', marque: 'Brand', prix: 2.5,
      categorie: 'fruits', nutriScore: 'b',
      calories: 52, proteines: 0.3, sodium: 1,
    })
  })

  it('retourne null si aucun produit ne correspond', async () => {
    query.mockResolvedValue([])
    expect(await getProductById('absent')).toBeNull()
  })

  it('propage une erreur si la base plante', async () => {
    query.mockRejectedValue(new Error('boom'))
    await expect(getProductById('x')).rejects.toThrow('boom')
  })
})