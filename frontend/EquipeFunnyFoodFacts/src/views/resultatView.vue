<script setup>
import { API_URL } from '../config'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const NOM_SITE = 'Open Food Facts QC'

// Nombre de produits demandés au serveur en UNE seule fois.
const LIMITES_SERVEUR = [500, 100, 50]

  // Affichage à l'écran : 30 produits au départ, puis 20 de plus à chaque clic
const AFFICHAGE_INITIAL = 50
const PAS_AFFICHAGE = 50

const DELAI_MAX = 20000
const PAUSES_REESSAI = [2000]

const MAX_COMPARAISON = 2

const NB_MARQUES = 8

const LIBELLES_NUTRI = {
  A: 'très bonne',
  B: 'bonne',
  C: 'moyenne',
  D: 'médiocre',
  E: 'mauvaise',
}
const LIBELLES_NOVA = {
  1: 'aliment non transformé ou peu transformé',
  2: 'ingrédient culinaire',
  3: 'aliment transformé',
  4: 'aliment ultra-transformé',
}

function titreNutri(score) {
  return score
    ? `Nutri-Score ${score} : qualité nutritionnelle ${LIBELLES_NUTRI[score]}`
    : 'Nutri-Score non disponible'
}

function titreNova(nova) {
  if (!nova) return 'Groupe NOVA non disponible'
  const libelle = LIBELLES_NOVA[nova]
  return libelle ? `Groupe NOVA ${nova} : ${libelle}` : `Groupe NOVA ${nova}`
}

/* ------------------------------------------------------------------
   ÉTAT DE LA PAGE
------------------------------------------------------------------ */
const recherche = ref(String(route.query.q ?? ''))
const tri = ref('pertinence')
const selection = ref([])
const filtresOuverts = ref(false)

const produits = ref([])
const plafond = ref(0)
const nbAffiches = ref(AFFICHAGE_INITIAL)
const chargement = ref(false)
const erreur = ref('')
let numeroRequete = 0
let indexLimite = 0
const nutriScore = ref('')
const novaChoisi = ref(0)
const marquesChoisies = ref([])

const allergenes = ref([
  { nom: 'Gluten (blé)', mots: ['gluten', 'ble', 'wheat'], active: false },
  { nom: 'Lait', mots: ['lait', 'milk'], active: false },
  { nom: 'Oeufs', mots: ['oeuf', 'egg'], active: false },
  { nom: 'Arachides', mots: ['arachide', 'peanut', 'cacahuete'], active: false },
  { nom: 'Noix', mots: ['noix', 'en:nuts', 'tree-nut', 'tree nut', 'amande', 'noisette', 'almond', 'hazelnut', 'cashew', 'pecan', 'pistach'], active: false, },
  { nom: 'Soja', mots: ['soja', 'soy'], active: false },
  { nom: 'Poisson', mots: ['poisson', 'en:fish'], active: false },
  { nom: 'Crustacés et mollusques', mots: ['crustace', 'mollusque', 'mollusc', 'shellfish', 'crustacean'],
    active: false,
  },
  { nom: 'Sésame', mots: ['sesame'], active: false },
  { nom: 'Moutarde', mots: ['moutarde', 'mustard'], active: false },
  { nom: 'Sulfites', mots: ['sulfite', 'sulphite'], active: false },
])

const categories = ref([
  { code: 'ALCOHOLIC_BEVERAGES', nom: 'Boissons alcoolisées', active: false },
  { code: 'BABY_CARE', nom: 'Soins pour bébé', active: false },
  { code: 'BAKERY', nom: 'Boulangerie', active: false },
  { code: 'BAKING_INGREDIENTS', nom: 'Ingrédients de cuisson', active: false },
  { code: 'BEVERAGES', nom: 'Boissons', active: false },
  { code: 'BREAKFAST', nom: 'Petit-déjeuner', active: false },
  { code: 'CANNED_GOODS', nom: 'Conserves', active: false },
  { code: 'CONDIMENTS_SAUCES', nom: 'Condiments et sauces', active: false },
  { code: 'CONFECTIONERY', nom: 'Confiseries', active: false },
  { code: 'DAIRY', nom: 'Produits laitiers', active: false },
  { code: 'FROZEN', nom: 'Surgelés', active: false },
  { code: 'GENERAL_GROCERY', nom: 'Épicerie générale', active: false },
  { code: 'MEAT_SEAFOOD', nom: 'Viandes et fruits de mer', active: false },
  { code: 'OILS_VINEGARS', nom: 'Huiles et vinaigres', active: false },
  { code: 'PASTA_RICE', nom: 'Pâtes et riz', active: false },
  { code: 'PET_FOOD', nom: 'Nourriture pour animaux', active: false },
  { code: 'PRODUCE', nom: 'Fruits et légumes', active: false },
  { code: 'SNACKS', nom: 'Collations', active: false },
])

// Le mot recherché, tel qu'il est dans l'adresse (?q=...)
const requeteActuelle = computed(() => String(route.query.q ?? '').trim())

/* ------------------------------------------------------------------
   RÉCUPÉRER LES PRODUITS DANS LA BASE DE DONNÉES
------------------------------------------------------------------ */
function normaliser(texte) {
  return String(texte)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function versListe(valeur) {
  if (Array.isArray(valeur)) return valeur.map((v) => normaliser(v))
  if (typeof valeur === 'string') {
    return valeur
      .split(/[,;|]/)
      .map((v) => normaliser(v))
      .filter(Boolean)
  }
  return []
}

function nomCategorie(code) {
  const trouvee = categories.value.find((c) => normaliser(c.code) === normaliser(code))
  return trouvee ? trouvee.nom : ''
}

// Transforme un produit reçu du serveur en un produit simple pour notre page.
// Champs du serveur utilisés : id, nom, marque, image, categorie, nutriScore, nova, allergenes
function convertir(p) {
  const code = [p.categorie, p.taxonomy].find((v) => typeof v === 'string') ?? ''
  const grade = String(p.nutriScore ?? p.nutriscore ?? p.nutriscore_grade ?? '')
    .trim()
    .toUpperCase()
  const nova = Number(p.nova ?? p.novaGroup ?? p.nova_group)
  const marque = typeof p.marque === 'string' ? p.marque.trim() : ''
  return {
    code: String(p.id),
    nom: typeof p.nom === 'string' && p.nom.trim() ? p.nom : 'Nom non renseigné',
    marque,
    marqueCle: normaliser(marque),
    image: typeof p.image === 'string' ? p.image : '',
    details: typeof p.details === 'string' ? p.details : '',
    categorieCode: normaliser(code),
    categorieNom: nomCategorie(code),
    allergenes: versListe(p.allergenes ?? p.allergens),
    nutriScore: grade.length === 1 && 'ABCDE'.includes(grade) ? grade : '',
    nova: Number.isInteger(nova) && nova > 0 ? nova : null,
  }
}

// Mémoire des recherches. On garde chaque résultat 10 minutes dans le navigateur (sessionStorage).
const DUREE_CACHE = 10 * 60 * 1000

function lireCache(cle) {
  try {
    const brut = sessionStorage.getItem(cle)
    if (!brut) return null
    const { date, valeur } = JSON.parse(brut)
    return Date.now() - date > DUREE_CACHE ? null : valeur
  } catch {
    return null
  }
}

function ecrireCache(cle, valeur) {
  try {
    sessionStorage.setItem(cle, JSON.stringify({ date: Date.now(), valeur }))
  } catch {
    return null
  }
}

// Demande les produits au serveur : GET /produits?recherche=yogourt&limit=500
async function appelerServeur(texte, nombre) {
  const parametres = new URLSearchParams({ limit: String(nombre) })
  if (texte) parametres.set('recherche', texte)

  const reponse = await fetch(
    `${API_URL.replace(/\/$/, '')}/produits?${parametres}`,
    { signal: AbortSignal.timeout(DELAI_MAX) },
  )
  if (!reponse.ok) {
    const e = new Error(`Erreur HTTP ${reponse.status}`)
    e.status = reponse.status
    throw e
  }

  const donnees = await reponse.json()
  if (!Array.isArray(donnees)) throw new Error('Réponse du serveur invalide.')

  const dejaVus = new Set() // évite les doublons
  const liste = donnees
    .filter((p) => p && p.id != null)
    .map(convertir)
    .filter((p) => {
      if (dejaVus.has(p.code)) return false
      dejaVus.add(p.code)
      return true
    })

  return { liste, plafond: donnees.length >= nombre ? nombre : 0 }
}

// Essaie la limite la plus haute ; si le serveur la refuse (erreur 400, 413 ou 422),
// on passe à la limite suivante, et on s'en souvient pour les recherches suivantes.
async function chargerDepuisApi(texte) {
  for (;;) {
    try {
      return await appelerServeur(texte, LIMITES_SERVEUR[indexLimite])
    } catch (e) {
      const limiteRefusee = [400, 413, 422].includes(e.status)
      if (!limiteRefusee || indexLimite >= LIMITES_SERVEUR.length - 1) throw e
      console.warn(`Limite ${LIMITES_SERVEUR[indexLimite]} refusée par le serveur, essai avec moins.`)
      indexLimite += 1
    }
  }
}

// Appelle le serveur, et réessaie une fois s'il échoue.
async function chargerAvecReessais(texte, id) {
  for (let essai = 0; ; essai++) {
    try {
      return await chargerDepuisApi(texte)
    } catch (e) {
      console.warn(`Essai ${essai + 1} échoué :`, e)
      if (essai >= PAUSES_REESSAI.length) throw e
      await new Promise((fin) => setTimeout(fin, PAUSES_REESSAI[essai]))
      if (id !== numeroRequete) throw e
    }
  }
}

function messageErreur(e) {
  if (!navigator.onLine) {
    return 'Vous semblez hors ligne. Vérifiez votre connexion Internet, puis réessayez.'
  }
  if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
    return 'Le serveur met trop de temps à répondre. Réessayez dans un instant.'
  }
  return 'Impossible de charger les produits pour le moment. Réessayez.'
}

async function charger() {
  const texte = requeteActuelle.value
  const id = ++numeroRequete
  erreur.value = ''
  produits.value = []
  plafond.value = 0
  nbAffiches.value = AFFICHAGE_INITIAL

  const cle = `bd4:${texte.toLowerCase()}`
  const enMemoire = lireCache(cle)
  if (enMemoire) {
    produits.value = enMemoire.liste
    plafond.value = enMemoire.plafond
    chargement.value = false
    return
  }

  chargement.value = true
  try {
    const reponse = await chargerAvecReessais(texte, id)
    if (id !== numeroRequete) return
    produits.value = reponse.liste
    plafond.value = reponse.plafond
    if (reponse.liste.length) ecrireCache(cle, reponse)
  } catch (e) {
    if (id !== numeroRequete) return
    console.error('Recherche des produits :', e)
    erreur.value = messageErreur(e)
  } finally {
    if (id === numeroRequete) chargement.value = false
  }
}

function soumettreRecherche() {
  const texte = recherche.value.trim()
  if (texte === requeteActuelle.value) {
    charger()
  } else {
    router.push({ path: '/resultat', query: texte ? { q: texte } : {} })
  }
}

const titreInitial = document.title
onBeforeUnmount(() => {
  document.title = titreInitial
})

// Dès que ?q=... change, on relance la recherche
watch(
  requeteActuelle,
  (texte) => {
    recherche.value = texte
    selection.value = []
    marquesChoisies.value = []
    document.title = texte
      ? `${texte} – Résultats | ${NOM_SITE}`
      : `Résultats | ${NOM_SITE}`
    charger()
  },
  { immediate: true },
)

// Compte les produits chargés selon une valeur : { 'a': 3, 'b': 1 }
function compter(lire) {
  const compte = {}
  for (const p of produits.value) {
    const valeur = lire(p)
    if (valeur) compte[valeur] = (compte[valeur] ?? 0) + 1
  }
  return compte
}

const compteNutri = computed(() => compter((p) => p.nutriScore))
const compteNova = computed(() => compter((p) => p.nova))
const compteCategories = computed(() => compter((p) => p.categorieCode))

function nbCategorie(categorie) {
  return compteCategories.value[normaliser(categorie.code)] ?? 0
}

// Le serveur a-t-il envoyé ces informations pour au moins un produit ?
const nutriDisponible = computed(() => Object.keys(compteNutri.value).length > 0)
const novaDisponible = computed(() => Object.keys(compteNova.value).length > 0)
const allergenesDisponibles = computed(() => produits.value.some((p) => p.allergenes.length))

const marques = computed(() => {
  const groupes = new Map()
  for (const p of produits.value) {
    if (!p.marqueCle) continue
    const groupe = groupes.get(p.marqueCle) ?? { cle: p.marqueCle, nom: p.marque, n: 0 }
    groupe.n += 1
    groupes.set(p.marqueCle, groupe)
  }
  const triees = [...groupes.values()].sort(
    (a, b) => b.n - a.n || a.nom.localeCompare(b.nom, 'fr'),
  )
  const visibles = triees.slice(0, NB_MARQUES)
  for (const cle of marquesChoisies.value) {
    const groupe = groupes.get(cle)
    if (groupe && !visibles.includes(groupe)) visibles.push(groupe)
  }
  return { liste: visibles, total: groupes.size }
})

const nbFiltres = computed(
  () =>
    (nutriScore.value ? 1 : 0) +
    (novaChoisi.value ? 1 : 0) +
    allergenes.value.filter((a) => a.active).length +
    categories.value.filter((c) => c.active).length +
    marquesChoisies.value.length,
)
const filtresActifs = computed(() => nbFiltres.value > 0)

function contientUnMot(textes, mots) {
  return mots.some((mot) => textes.some((t) => t.includes(mot)))
}

const resultats = computed(() => {
  const allergenesExclus = allergenes.value.filter((a) => a.active)
  const codesActifs = categories.value.filter((c) => c.active).map((c) => normaliser(c.code))

  let liste = produits.value.filter((p) => {
    const okNutri = !nutriScore.value || p.nutriScore === nutriScore.value
    const okNova = !novaChoisi.value || p.nova === novaChoisi.value
    const okAllergenes = !allergenesExclus.some((a) => contientUnMot(p.allergenes, a.mots))
    const okCategories = !codesActifs.length || codesActifs.includes(p.categorieCode)
    const okMarques = !marquesChoisies.value.length || marquesChoisies.value.includes(p.marqueCle)
    return okNutri && okNova && okAllergenes && okCategories && okMarques
  })

  if (tri.value === 'nom') {
    liste = [...liste].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  } else if (tri.value === 'marque') {
    liste = [...liste].sort((a, b) => a.marque.localeCompare(b.marque, 'fr'))
  } else if (tri.value === 'nutriscore') {
    const rang = (p) => (p.nutriScore ? 'ABCDE'.indexOf(p.nutriScore) : 9)
    liste = [...liste].sort((a, b) => rang(a) - rang(b))
  }
  return liste
})

const total = computed(() => produits.value.length)

// On montre 30 produits, puis 20 de plus à chaque clic (instantané : tout est déjà chargé)
const visibles = computed(() => resultats.value.slice(0, nbAffiches.value))
const restants = computed(() => Math.max(0, resultats.value.length - nbAffiches.value))
const prochainPaquet = computed(() => Math.min(PAS_AFFICHAGE, restants.value))

function afficherPlus() {
  nbAffiches.value += PAS_AFFICHAGE
}


const signatureFiltres = computed(() =>
  [  nutriScore.value, novaChoisi.value, tri.value, marquesChoisies.value.join('|'), categories.value.filter((c) => c.active).map((c) => c.code).join('|'),
    allergenes.value.filter((a) => a.active).map((a) => a.nom).join('|'),
  ].join('#'),
)
watch(signatureFiltres, () => {
  nbAffiches.value = AFFICHAGE_INITIAL
})

const titre = computed(() => {
  if (chargement.value) return 'Recherche en cours…'
  const n = filtresActifs.value ? resultats.value.length : total.value
  const debut = plafond.value && !filtresActifs.value ? 'Plus de ' : ''
  const nombre = (plafond.value && !filtresActifs.value ? plafond.value : n).toLocaleString('fr-CA')
  const mot = n > 1 || debut ? 'produits trouvés' : 'produit trouvé'
  const pour = requeteActuelle.value ? ` pour « ${requeteActuelle.value} »` : ''
  return `${debut}${nombre} ${mot}${pour}`
})

// Ligne sous le titre
const sousTitre = computed(() => {
  if (!produits.value.length) return ''
  const sur = plafond.value ? `plus de ${plafond.value}` : String(total.value)
  if (filtresActifs.value) {
    return plafond.value
      ? `Filtres appliqués aux ${total.value} premiers produits`
      : `Filtres appliqués aux ${total.value} produits trouvés`
  }
  if (restants.value > 0) {
    return `Affichage de ${visibles.value.length} sur ${sur}`
  }
  return ''
})

const annonce = computed(() => (erreur.value ? '' : titre.value))

function selectNutriScore(score) {
  nutriScore.value = nutriScore.value === score ? '' : score
}

function selectNova(niveau) {
  novaChoisi.value = novaChoisi.value === niveau ? 0 : niveau
}

function basculerMarque(cle) {
  marquesChoisies.value = marquesChoisies.value.includes(cle)
    ? marquesChoisies.value.filter((m) => m !== cle)
    : [...marquesChoisies.value, cle]
}

function resetFilters() {
  nutriScore.value = ''
  novaChoisi.value = 0
  marquesChoisies.value = []
  allergenes.value.forEach((a) => (a.active = false))
  categories.value.forEach((c) => (c.active = false))
}

/* ---COMPARAISON------- */
const lienComparer = computed(() => `/comparer?codes=${selection.value.join(',')}`)

// Case grisée quand le maximum est atteint
function selectionBloquee(code) {
  return selection.value.length >= MAX_COMPARAISON && !selection.value.includes(code)
}

function viderSelection() {
  selection.value = []
}
</script>

<template>
  <main class="resultats-page" :class="{ 'avec-barre': selection.length }">
    <section class="hero">
      <div class="container">
        <h1>Résultats de recherche</h1>
        <form class="search" role="search" @submit.prevent="soumettreRecherche">
          <label for="produit" class="visually-hidden">
            Nom ou code-barres du produit
          </label>
          <input id="produit" v-model="recherche"
            type="search"
            placeholder="Nom du produit ou code-barres…"
            autocomplete="off"
          />
          <button type="submit">Rechercher</button>
        </form>
      </div>
    </section>

    <div class="container py-5">
      <button
        type="button"
        class="bouton-filtres"
        :aria-expanded="filtresOuverts"
        aria-controls="colonne-filtres"
        @click="filtresOuverts = !filtresOuverts"
      >
        Filtres
        <span v-if="nbFiltres" class="compteur">{{ nbFiltres }}</span>
        <span aria-hidden="true">{{ filtresOuverts ? '▴' : '▾' }}</span>
      </button>

      <div class="row g-4">
        <aside
          id="colonne-filtres"
          class="col-12 col-lg-3 colonne-filtres"
          :class="{ ouvert: filtresOuverts }"
          aria-label="Filtres"
        >
          <div class="filtres">
            <div class="filtres-header">
              <h2>Filtres</h2>
              <button type="button" :disabled="!filtresActifs" @click="resetFilters">
                Tout effacer
              </button>
            </div>

            <h3>Nutri-Score</h3>
            <div class="nutri-buttons" role="group" aria-label="Nutri-Score">
              <button
                v-for="score in ['A', 'B', 'C', 'D', 'E']"
                :key="score"
                type="button"
                :class="['nutri', { selected: nutriScore === score }]"
                :aria-pressed="nutriScore === score"
                :disabled="!compteNutri[score] && nutriScore !== score"
                :title="
                  compteNutri[score] || nutriScore === score
                    ? titreNutri(score)
                    : 'Aucun produit avec ce Nutri-Score dans les résultats chargés'
                "
                @click="selectNutriScore(score)"
              >
                {{ score }}
              </button>
            </div>

            <h3 class="sous-filtre">Groupe NOVA</h3>
            <div class="nutri-buttons" role="group" aria-label="Groupe NOVA">
              <button
                v-for="niveau in [1, 2, 3, 4]"
                :key="niveau"
                type="button"
                :class="['nutri', { selected: novaChoisi === niveau }]"
                :aria-pressed="novaChoisi === niveau"
                :disabled="!compteNova[niveau] && novaChoisi !== niveau"
                :title="
                  compteNova[niveau] || novaChoisi === niveau
                    ? titreNova(niveau)
                    : 'Aucun produit avec ce groupe NOVA dans les résultats chargés'
                "
                @click="selectNova(niveau)"
              >
                {{ niveau }}
              </button>
            </div>

            <p v-if="produits.length && !nutriDisponible && !novaDisponible" class="aide">
              Le Nutri-Score et le groupe NOVA ne sont pas encore renseignés pour ces produits.
            </p>
          </div>

          <div v-if="allergenesDisponibles" class="filtres">
            <h3>Exclure les allergènes</h3>
            <div class="chips">
              <button
                v-for="allergene in allergenes"
                :key="allergene.nom"
                type="button"
                :class="{ active: allergene.active }"
                :aria-pressed="allergene.active"
                @click="allergene.active = !allergene.active"
              >
                {{ allergene.nom }}
                <span v-if="allergene.active" aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <div class="filtres">
            <h3>Catégories</h3>
            <div class="chips">
              <button
                v-for="categorie in categories"
                :key="categorie.code"
                type="button"
                :class="{ active: categorie.active }"
                :aria-pressed="categorie.active"
                :disabled="!categorie.active && nbCategorie(categorie) === 0"
                :title="
                  nbCategorie(categorie) === 0 && !categorie.active
                    ? 'Aucun produit de cette catégorie dans les résultats chargés'
                    : ''
                "
                @click="categorie.active = !categorie.active"
              >
                {{ categorie.nom }}
                <span class="nb">{{ nbCategorie(categorie) }}</span>
              </button>
            </div>
          </div>

          <div v-if="marques.total >= 2" class="filtres">
            <h3>Marques</h3>
            <div class="chips">
              <button
                v-for="marque in marques.liste"
                :key="marque.cle"
                type="button"
                :class="{ active: marquesChoisies.includes(marque.cle) }"
                :aria-pressed="marquesChoisies.includes(marque.cle)"
                @click="basculerMarque(marque.cle)"
              >
                {{ marque.nom }}
                <span class="nb">{{ marque.n }}</span>
              </button>
            </div>
          </div>
        </aside>

        <section class="col-12 col-lg-9" aria-labelledby="titre-resultats">
          <div class="resultats-header">
            <div>
              <h2 id="titre-resultats">{{ titre }}</h2>
              <p v-if="sousTitre" class="sous">{{ sousTitre }}</p>
            </div>
            <label class="tri">
              Trier par
              <select v-model="tri">
                <option value="pertinence">Pertinence</option>
                <option value="nutriscore">Nutri-Score (A à E)</option>
                <option value="nom">Nom (A–Z)</option>
                <option value="marque">Marque</option>
              </select>
            </label>
          </div>

          <p class="visually-hidden" role="status" aria-live="polite">{{ annonce }}</p>
          <ul v-if="resultats.length" class="liste">
            <li  v-for="produit in visibles" :key="produit.code"   :class="['ligne', { cochee: selection.includes(produit.code) }]" >
              <input
                v-model="selection"
                type="checkbox"
                class="case"
                :value="produit.code"
                :disabled="selectionBloquee(produit.code)"
                :aria-label="`Sélectionner ${produit.nom} pour la comparaison`"
              />

              <div :class="['vignette', { sans: !produit.image }]">
                <img
                  v-if="produit.image"
                  :src="produit.image"
                  :alt="produit.nom"
                  loading="lazy"
                  @error="produit.image = ''"
                />
                <span v-else>Aucune image</span>
              </div>

              <div class="infos">
                <p v-if="produit.marque" class="marque">{{ produit.marque }}</p>
                <h3>{{ produit.nom }}</h3>
                <p v-if="produit.details" class="details">{{ produit.details }}</p>
                <span v-if="produit.categorieNom" class="etiquette">
                  {{ produit.categorieNom }}
                </span>
              </div>

              <div class="indicateurs">
                <div class="indic">
                  <span
                    :class="['score', 'nutri-' + (produit.nutriScore || 'inconnu')]"
                    role="img"
                    :aria-label="titreNutri(produit.nutriScore)"
                    :title="titreNutri(produit.nutriScore)"
                  >
                    {{ produit.nutriScore || '?' }}
                  </span>
                  <small>Nutri-Score</small>
                </div>
                <div class="indic">
                  <span
                    class="nova"
                    role="img"
                    :aria-label="titreNova(produit.nova)"
                    :title="titreNova(produit.nova)"
                  >
                    {{ produit.nova || '–' }}
                  </span>
                  <small>NOVA</small>
                </div>
                <router-link
                  :to="`/produit/${produit.code}`"
                  class="voir"
                  :aria-label="`Voir la fiche de ${produit.nom}`"
                >
                  Voir
                </router-link>
              </div>
            </li>
          </ul>

          <ul v-else-if="chargement" class="liste" aria-hidden="true">
            <li v-for="n in 6" :key="n" class="ligne squelette">
              <span class="bloc petit"></span>
              <span class="bloc image"></span>
              <div class="infos">
                <span class="bloc l1"></span>
                <span class="bloc l2"></span>
                <span class="bloc l3"></span>
              </div>
              <div class="indicateurs">
                <span class="bloc pastille"></span>
                <span class="bloc pastille"></span>
              </div>
            </li>
          </ul>

          <div v-else-if="erreur" class="vide" role="alert">
            <p>{{ erreur }}</p>
            <button type="button" class="btn-secondaire" @click="charger()">Réessayer</button>
          </div>

          <div v-else-if="!produits.length" class="vide">
            <p>
              <strong v-if="requeteActuelle">Aucun résultat pour « {{ requeteActuelle }} ».</strong>
              <strong v-else>Aucun produit disponible pour le moment.</strong>
            </p>
            <p v-if="requeteActuelle" class="conseil">
              Vérifiez l’orthographe, essayez un mot plus court ou plus général
              (par exemple « yogourt » plutôt que « yogourt grec nature »).
            </p>
          </div>

          <div v-else class="vide">
            <p><strong>Aucun produit ne correspond à vos filtres.</strong></p>
            <button type="button" class="btn-secondaire" @click="resetFilters">
              Effacer les filtres
            </button>
          </div>

          <div v-if="restants" class="plus">
            <button type="button" class="btn-secondaire" @click="afficherPlus">
              Afficher {{ prochainPaquet }}
              {{ prochainPaquet > 1 ? 'produits' : 'produit' }} de plus
            </button>
            <p class="restants">{{ restants }} {{ restants > 1 ? 'restants' : 'restant' }}</p>
          </div>

          <p v-if="resultats.length && !restants && plafond" class="note">
            Seuls les {{ plafond }} premiers résultats sont chargés.
            Précisez votre recherche pour obtenir des résultats plus pertinents.
          </p>
        </section>
      </div>
    </div>

    <div v-if="selection.length" class="barre-comparaison" role="status">
      <div class="barre-infos">
        <span>
          {{ selection.length }}
          {{ selection.length > 1 ? 'produits sélectionnés' : 'produit sélectionné' }}
        </span>
        <small v-if="selection.length < 2">Sélectionnez au moins 2 produits pour comparer</small>
        <small v-else-if="selection.length >= MAX_COMPARAISON">
          Maximum de {{ MAX_COMPARAISON }} produits atteint
        </small>
      </div>
      <div class="barre-actions">
        <button type="button" class="vider" @click="viderSelection">Tout désélectionner</button>
        <router-link
          :to="lienComparer"
          :class="['comparer', { desactive: selection.length < 2 }]"
          :aria-disabled="selection.length < 2"
        >
          Comparer côte à côte →
        </router-link>
      </div>
    </div>
  </main>
</template>

<style scoped>
.resultats-page {
  --orange: #f58220;
  --brun: #532509;
  --brun-clair: #713613;
  --creme: #fff0e2;
  --bordure: #edd9cc;
  --texte-doux: #67594f;
}

.resultats-page.avec-barre {
  padding-bottom: 90px;
}

/* ---------- Bandeau et recherche ---------- */
.hero {
  padding: 42px 0;
  background: linear-gradient(125deg, #fff0e2, #fff9f5 72%);
}

h1 {
  margin: 0 0 16px;
  font-size: clamp(32px, 4vw, 44px);
  line-height: 1.1;
}

.search {
  display: flex;
  max-width: 650px;
  padding: 6px;
  border: 1px solid #e8c9b7;
  border-radius: 14px;
  background: white;
}

.search input {
  flex: 1;
  min-width: 0;
  padding: 14px;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
}

.search button {
  padding: 14px 20px;
  border: 0;
  border-radius: 10px;
  background: var(--brun);
  color: white;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

/* Contour visible au clavier, partout */
.search button:focus-visible,
.search:focus-within,
.nutri:focus-visible,
.chips button:focus-visible,
.filtres-header button:focus-visible,
.bouton-filtres:focus-visible,
.voir:focus-visible,
.btn-secondaire:focus-visible,
.comparer:focus-visible,
.vider:focus-visible,
.case:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 2px;
}

/* ---------- Filtres ---------- */
.bouton-filtres {
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 11px 16px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.compteur {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--brun);
  color: white;
  font-size: 12px;
}

/* Téléphone et tablette */
@media (max-width: 991px) {
  .bouton-filtres {
    display: inline-flex;
  }

  .colonne-filtres {
    display: none;
  }

  .colonne-filtres.ouvert {
    display: block;
  }
}

/* Ordinateur */
@media (min-width: 992px) {
  .colonne-filtres {
    position: sticky;
    top: 20px;
    align-self: flex-start;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
}

.filtres {
  margin-bottom: 16px;
  padding: 22px;
  border: 1px solid var(--bordure);
  border-radius: 24px;
  background: white;
}

.filtres-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filtres-header h2 {
  margin: 0;
  font-size: 21px;
}

.filtres-header button {
  border: 0;
  background: transparent;
  color: var(--brun-clair);
  font-weight: bold;
  cursor: pointer;
}

.filtres-header button:disabled {
  opacity: 0.35;
  cursor: default;
}

.filtres h3 {
  margin: 0 0 10px;
  font-size: 15px;
  color: var(--texte-doux);
}

.filtres h3.sous-filtre {
  margin-top: 18px;
}

.aide {
  margin: 14px 0 0;
  color: var(--texte-doux);
  font-size: 13px;
  line-height: 1.5;
}

.nutri-buttons {
  display: flex;
  gap: 6px;
}

.nutri {
  width: 42px;
  height: 40px;
  border: 1px solid var(--bordure);
  border-radius: 10px;
  background: var(--creme);
  color: var(--brun);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s;
}

.nutri:hover:not(:disabled) {
  background: #ffe2c9;
}

.nutri.selected {
  background: var(--brun);
  border-color: var(--brun);
  color: white;
}

/* Aucun produit avec cette valeur dans les résultats chargés */
.nutri:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--bordure);
  border-radius: 999px;
  background: var(--creme);
  color: var(--brun);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.chips button:hover:not(:disabled) {
  background: #ffe2c9;
}

.chips button.active {
  background: var(--brun);
  border-color: var(--brun);
  color: white;
}

.chips button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chips .nb {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(83, 37, 9, 0.1);
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.chips button.active .nb {
  background: rgba(255, 255, 255, 0.25);
}

.resultats-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.resultats-header h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.sous {
  margin: 4px 0 0;
  color: var(--texte-doux);
  font-size: 14px;
}

.tri {
  flex-shrink: 0;
  color: var(--texte-doux);
  font-size: 14px;
}

.tri select {
  margin-left: 6px;
  padding: 8px 10px;
  border: 1px solid #e8c9b7;
  border-radius: 10px;
  background: white;
  font: inherit;
}

/*  Liste de produits */
.liste {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--bordure);
  border-radius: 24px;
  background: white;
  overflow: hidden;
}

.ligne {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bordure);
  transition: background 0.15s;
}

.ligne:last-child {
  border-bottom: 0;
}

.ligne:hover {
  background: #fffaf6;
}

/* Produit coché : fond crème et trait orange à gauche */
.ligne.cochee {
  background: var(--creme);
  box-shadow: inset 4px 0 0 var(--orange);
}

.case {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  accent-color: var(--brun);
  cursor: pointer;
}

.case:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.vignette {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 94px;
  height: 94px;
  border: 1px solid var(--bordure);
  border-radius: 12px;
  background: white;
  color: var(--texte-doux);
  font-size: 12px;
  text-align: center;
}

/* Sans image : fond crème et cadre en pointillés */
.vignette.sans {
  border: 1px dashed #dabca9;
  background: var(--creme);
}

.vignette img {
  width: 100%;
  height: 100%;
  padding: 6px;
  object-fit: contain;
}

.infos {
  flex: 1;
  min-width: 0;
}

.marque {
  margin: 0 0 2px;
  color: var(--texte-doux);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.infos h3 {
  margin: 0 0 2px;
  font-size: 20px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.details {
  margin: 0;
  color: var(--texte-doux);
  font-size: 14px;
}

/* Étiquette de catégorie, sous le nom */
.etiquette {
  display: inline-block;
  max-width: 100%;
  margin-top: 6px;
  padding: 3px 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--creme);
  color: var(--brun-clair);
  font-size: 12px;
  font-weight: bold;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicateurs {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 14px;
}

.indic {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.indic small {
  color: var(--texte-doux);
  font-size: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.score,
.nova {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
}

.score {
  color: white;
}

.score.nutri-A { background: #038141; }
.score.nutri-B { background: #4b9f2a; }
.score.nutri-C { background: #c98a00; }
.score.nutri-D { background: #e6620f; }
.score.nutri-E { background: #d52b1e; }
.score.nutri-inconnu { background: #e8ddd3; color: var(--texte-doux); }

.nova {
  border: 1px solid #dabca9;
  background: white;
  color: var(--brun);
}

.voir {
  padding: 11px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font-weight: bold;
  text-decoration: none;
  transition: background 0.15s;
}

.voir:hover {
  background: var(--creme);
}

.squelette .bloc {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, #f6e9dd 25%, #fff3e8 50%, #f6e9dd 75%);
  background-size: 200% 100%;
  animation: briller 1.3s ease-in-out infinite;
}

.squelette .petit { width: 20px; height: 20px; flex-shrink: 0; }
.squelette .image { width: 94px; height: 94px; flex-shrink: 0; border-radius: 12px; }
.squelette .pastille { width: 42px; height: 42px; border-radius: 10px; }
.squelette .l1 { width: 90px; height: 10px; margin-bottom: 10px; }
.squelette .l2 { width: 60%; height: 18px; margin-bottom: 10px; }
.squelette .l3 { width: 40%; height: 12px; }

@keyframes briller {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .squelette .bloc { animation: none; }
}

/* Messages */
.vide {
  padding: 30px;
  border: 1px dashed #dabca9;
  border-radius: 18px;
  background: #fff9f5;
  color: var(--texte-doux);
}

.vide p {
  margin: 0;
}

.vide strong {
  color: var(--brun);
}

.vide .conseil {
  margin-top: 8px;
  line-height: 1.5;
}

.btn-secondaire {
  margin-top: 16px;
  padding: 11px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font: inherit;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondaire:hover:not(:disabled) {
  background: var(--creme);
}

.btn-secondaire:disabled {
  opacity: 0.6;
  cursor: wait;
}

.plus {
  margin-top: 8px;
  text-align: center;
}

.restants {
  margin: 8px 0 0;
  color: var(--texte-doux);
  font-size: 13px;
}

.note {
  margin: 20px 0 0;
  color: var(--texte-doux);
  font-size: 14px;
  text-align: center;
}

/* ---------- Barre de comparaison ---------- */
.barre-comparaison {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  background: var(--brun);
  color: white;
  box-shadow: 0 -6px 20px rgba(83, 37, 9, 0.18);
}

.barre-infos {
  display: flex;
  flex-direction: column;
}

.barre-infos small {
  opacity: 0.8;
  font-size: 12px;
}

.barre-actions {
  display: flex;
  align-items: center;
  gap: 18px;
}

.vider {
  border: 0;
  background: transparent;
  color: white;
  font: inherit;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
}

.comparer {
  padding: 14px 20px;
  border-radius: 10px;
  background: var(--orange);
  color: white;
  font-weight: bold;
  text-decoration: none;
}

.comparer.desactive {
  opacity: 0.5;
  pointer-events: none;
}

@media (max-width: 780px) {
  .hero {
    padding: 32px 0;
  }

  .resultats-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .resultats-header h2 {
    font-size: 22px;
  }

  .ligne {
    flex-wrap: wrap;
  }

  .infos {
    flex-basis: calc(100% - 180px);
  }

  .indicateurs {
    width: 100%;
    justify-content: flex-end;
  }

  .barre-comparaison {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 16px;
  }

  .barre-actions {
    justify-content: space-between;
  }
}
</style>