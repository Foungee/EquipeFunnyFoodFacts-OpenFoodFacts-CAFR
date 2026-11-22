import { MAX_COMPARAISON } from '../config'
import { nomCategorie } from './produits'

/** `?codes=1,1,2,3` devient ['1', '2'] */
export function lireCodes(valeur) {
  const codes = [valeur].flat().join(',').split(',').map((c) => c.trim()).filter(Boolean)
  return [...new Set(codes)].slice(0, MAX_COMPARAISON)
}

export function garderDifferences(lignes) {
  return lignes.filter((ligne) => new Set(ligne.cellules.map((c) => c.texte)).size > 1)
}

/* - Informations générales -- */

const LIBELLES_NOVA = {
  1: 'Non transformé ou peu transformé',
  2: 'Ingrédient culinaire',
  3: 'Aliment transformé',
  4: 'Aliment ultra-transformé',
}

const CHAMPS = [
  ['Marque', (p) => p.marque],
  ['Catégorie', (p) => nomCategorie(p.categorieCode)],
  ['Quantité indiquée', (p) => p.quantite],
  ['Code-barres', (p) => p.id],
  ['Nutri-Score', (p) => p.nutriScore],
  ['Groupe NOVA', (p) => (p.nova ? `${p.nova} – ${LIBELLES_NOVA[p.nova]}` : '')],
]

export function lignesInformations(produits) {
  return CHAMPS.map(([nom, lire]) => ({
    nom,
    cellules: produits.map((p) => ({ texte: String(lire(p)) })),
  }))
}

/* ---------- Valeurs nutritionnelles ---------- */
const NUTRIMENTS = [
  { nom: 'Énergie', cles: ['calories', 'energy-kcal_100g'], unite: 'kcal', sens: null },
  { nom: 'Protéines', cles: ['proteines', 'proteins_100g'], unite: 'g', sens: 'haut' },
  { nom: 'Lipides', cles: ['lipides', 'fat_100g'], unite: 'g', sens: 'bas' },
  { nom: 'Acides gras saturés', cles: ['saturated-fat_100g'], unite: 'g', sens: 'bas' },
  { nom: 'Glucides', cles: ['glucides', 'carbohydrates_100g'], unite: 'g', sens: null },
  { nom: 'Sucres', cles: ['sucres', 'sugars_100g'], unite: 'g', sens: 'bas' },
  { nom: 'Fibres', cles: ['fibres', 'fiber_100g'], unite: 'g', sens: 'haut' },
  { nom: 'Sel', cles: ['sel', 'salt_100g'], unite: 'g', sens: 'bas' },
]

const INDICATIONS = {
  bas: 'Valeur plus faible à examiner',
  haut: 'Valeur plus élevée à examiner',
}

export function formater(valeur, unite) {
  const decimales = unite === 'kcal' ? 0 : 1
  return `${valeur.toLocaleString('fr-CA', { maximumFractionDigits: decimales })} ${unite}`
}

function lireNutriment(produit, cles) {
  return cles.map((cle) => produit.nutriments[cle]).find((v) => v !== undefined) ?? null
}

export function lignesNutrition(produits) {
  return NUTRIMENTS.map(({ nom, cles, unite, sens }) => {
    const valeurs = produits.map((p) => lireNutriment(p, cles))
    const connues = valeurs.filter((v) => v !== null)
    const comparable = sens && connues.length >= 2 && new Set(connues).size > 1
    const extremum = comparable
      ? (sens === 'bas' ? Math.min(...connues) : Math.max(...connues))
      : null

    return {
      nom,
      indication: INDICATIONS[sens] ?? '',
      cellules: valeurs.map((v) => ({
        texte: v === null ? '' : formater(v, unite),
        extremum: v !== null && v === extremum,
      })),
    }
  }).filter((ligne) => ligne.cellules.some((c) => c.texte)) // masque les nutriments que l'API ne fournit pas
}