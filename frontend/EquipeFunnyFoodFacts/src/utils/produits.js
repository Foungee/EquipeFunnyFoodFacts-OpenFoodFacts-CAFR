import { API_URL } from '../config'
import { normaliser, versListe } from './texte'

export const ALLERGENES = [
  { nom: 'Gluten (blé)', mots: ['gluten', 'ble', 'wheat'] },
  { nom: 'Lait', mots: ['lait', 'milk'] },
  { nom: 'Oeufs', mots: ['oeuf', 'egg'] },
  { nom: 'Arachides', mots: ['arachide', 'peanut', 'cacahuete'] },
  { nom: 'Noix', mots: ['noix', 'nuts', 'amande', 'noisette', 'almond', 'hazelnut', 'cashew', 'pecan', 'pistach'] },
  { nom: 'Soja', mots: ['soja', 'soy'] },
  { nom: 'Poisson', mots: ['poisson', 'fish'] },
  { nom: 'Crustacés et mollusques', mots: ['crustace', 'mollusque', 'mollusc', 'shellfish', 'crustacean'] },
  { nom: 'Sésame', mots: ['sesame'] },
  { nom: 'Moutarde', mots: ['moutarde', 'mustard'] },
  { nom: 'Sulfites', mots: ['sulfite', 'sulphite'] },
]

export const CATEGORIES = [
  { code: 'ALCOHOLIC_BEVERAGES', nom: 'Boissons alcoolisées' },
  { code: 'BABY_CARE', nom: 'Soins pour bébé' },
  { code: 'BAKERY', nom: 'Boulangerie' },
  { code: 'BAKING_INGREDIENTS', nom: 'Ingrédients de cuisson' },
  { code: 'BEVERAGES', nom: 'Boissons' },
  { code: 'BREAKFAST', nom: 'Petit-déjeuner' },
  { code: 'CANNED_GOODS', nom: 'Conserves' },
  { code: 'CONDIMENTS_SAUCES', nom: 'Condiments et sauces' },
  { code: 'CONFECTIONERY', nom: 'Confiseries' },
  { code: 'DAIRY', nom: 'Produits laitiers' },
  { code: 'FROZEN', nom: 'Surgelés' },
  { code: 'GENERAL_GROCERY', nom: 'Épicerie générale' },
  { code: 'MEAT_SEAFOOD', nom: 'Viandes et fruits de mer' },
  { code: 'OILS_VINEGARS', nom: 'Huiles et vinaigres' },
  { code: 'PASTA_RICE', nom: 'Pâtes et riz' },
  { code: 'PET_FOOD', nom: 'Nourriture pour animaux' },
  { code: 'PRODUCE', nom: 'Fruits et légumes' },
  { code: 'SNACKS', nom: 'Collations' },
]

export function nomCategorie(code) {
  return CATEGORIES.find((c) => c.code === code)?.nom ?? ''
}

/* ---------- API et conversion ---------- */

export async function appelerApi(chemin) {
  const reponse = await fetch(`${API_URL.replace(/\/+$/, '')}${chemin}`)
  if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`)
  return reponse.json()
}

/** Retourne la première valeur non vide parmi les clés données. */
function lire(brut, ...cles) {
  return cles.map((cle) => brut[cle]).find((v) => v !== null && v !== undefined && v !== '')
}

function convertirNutriments(brut = {}) {
  const resultat = {}
  for (const [cle, valeur] of Object.entries(brut)) {
    if (valeur !== null && valeur !== '' && Number.isFinite(Number(valeur))) {
      resultat[cle] = Number(valeur)
    }
  }
  return resultat
}

export function convertirProduit(brut) {
  const grade = String(lire(brut, 'nutriScore', 'nutriscore', 'nutriscore_grade') ?? '').trim().toUpperCase()
  const nova = Number(lire(brut, 'nova', 'novaGroup', 'nova_group'))
  const allergenes = lire(brut, 'allergenes_tags', 'allergens_tags', 'allergenes', 'allergens')
  const marque = String(lire(brut, 'marque', 'brands') ?? '').trim()

  return {
    id: String(lire(brut, 'id', 'code')),
    nom: lire(brut, 'nom', 'product_name') ?? 'Nom non renseigné',
    marque,
    marqueCle: normaliser(marque),
    image: lire(brut, 'image', 'image_url') ?? '',
    details: lire(brut, 'details') ?? '',
    quantite: lire(brut, 'quantite', 'quantity') ?? '',
    categorieCode: String(lire(brut, 'categorie', 'taxonomy') ?? '').trim().toUpperCase(),
    nutriScore: /^[A-E]$/.test(grade) ? grade : '',
    nova: Number.isInteger(nova) && nova >= 1 && nova <= 4 ? nova : null,
    // les nutriments peuvent être dans un sous-objet ou directement sur le produit
    nutriments: convertirNutriments(brut.nutriments ?? brut.nutrition ?? brut),
    // null = information absente (différent de « aucun allergène »)
    allergenes: allergenes === undefined
      ? null
      : versListe(allergenes).map((a) => a.replace(/^[a-z]{2}:/i, '').replaceAll('-', ' ')),
    ingredients: lire(brut, 'ingredients_text_fr', 'ingredients_text', 'ingredients') ?? '',
    additifs: versListe(lire(brut, 'additives_tags', 'additifs')),
  }
}

/* ---- Filtres, tri et compteurs ----- */

export const creerFiltres = () => ({
  nutriScore: '',
  nova: 0,
  allergenes: [], 
  categories: [],
  marques: [],
})

export function compter(produits, lire) {
  const comptes = {}
  for (const produit of produits) {
    const valeur = lire(produit)
    if (valeur) comptes[valeur] = (comptes[valeur] ?? 0) + 1
  }
  return comptes
}

export function listerMarques(produits) {
  const marques = new Map()
  for (const p of produits) {
    if (!p.marqueCle) continue
    const marque = marques.get(p.marqueCle) ?? { cle: p.marqueCle, nom: p.marque, n: 0 }
    marque.n++
    marques.set(p.marqueCle, marque)
  }
  return [...marques.values()].sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom, 'fr'))
}

function contientAllergene(produit, mots) {
  return (produit.allergenes ?? []).some((a) => mots.some((mot) => normaliser(a).includes(mot)))
}

export function filtrerProduits(produits, filtres) {
  const mots = ALLERGENES.filter((a) => filtres.allergenes.includes(a.nom)).flatMap((a) => a.mots)

  return produits.filter((p) =>
    (!filtres.nutriScore || p.nutriScore === filtres.nutriScore) &&
    (!filtres.nova || p.nova === filtres.nova) &&
    (!filtres.categories.length || filtres.categories.includes(p.categorieCode)) &&
    (!filtres.marques.length || filtres.marques.includes(p.marqueCle)) &&
    !contientAllergene(p, mots),
  )
}

const rangNutri = (p) => (p.nutriScore ? 'ABCDE'.indexOf(p.nutriScore) : 5)

const COMPARATEURS = {
  nom: (a, b) => a.nom.localeCompare(b.nom, 'fr'),
  marque: (a, b) => a.marque.localeCompare(b.marque, 'fr'),
  nutriscore: (a, b) => rangNutri(a) - rangNutri(b),
}

export function trierProduits(produits, tri) {
  const comparer = COMPARATEURS[tri]
  return comparer ? [...produits].sort(comparer) : produits
}