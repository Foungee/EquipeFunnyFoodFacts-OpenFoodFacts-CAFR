<script setup>
import { API_URL } from '../config'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const NOM_SITE = 'Open Food Facts QC'

const LIMITE_INITIALE = 15
const PAS = 15
const LIMITE_MAX = 90
const DELAI_MAX = 20000
const PAUSES_REESSAI = [2000]
const MAX_COMPARAISON = 4

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


const recherche = ref(String(route.query.q ?? ''))
const nutriScore = ref('')
const tri = ref('pertinence')
const selection = ref([])
const filtresOuverts = ref(false)

const produits = ref([])
const nbRecus = ref(0)
const limite = ref(LIMITE_INITIALE)
const chargement = ref(false)
const chargementPlus = ref(false)
const erreur = ref('')
const erreurPlus = ref('')
let numeroRequete = 0

const allergenes = ref([
  { nom: 'Gluten', mots: ['gluten'], active: false },
  { nom: 'Lait', mots: ['lait', 'milk'], active: false },
  { nom: 'Arachides', mots: ['arachide', 'peanut'], active: false },
  { nom: 'Oeufs', mots: ['oeuf', 'egg'], active: false },
  { nom: 'Soja', mots: ['soja', 'soy'], active: false },
])

const categories = ref([
  { nom: 'Huiles et graisses', mots: ['huile', 'oil', 'graisse', 'fat'], active: false },
  { nom: 'Céréales', mots: ['cereal'], active: false },
  { nom: 'Sauces', mots: ['sauce'], active: false },
  {
    nom: 'Produits laitiers',
    mots: ['lait', 'dairie', 'laitier', 'yaourt', 'yogourt', 'yogurt', 'fromage'],
    active: false,
  },
])


const requeteActuelle = computed(() => String(route.query.q ?? '').trim())

function normaliser(texte) {
  return String(texte)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function versListe(valeur) {
  if (Array.isArray(valeur)) return valeur.map((v) => normaliser(v))
  if (typeof valeur === 'string') {
    return valeur
      .split(/[,;|]/)
      .map((v) => normaliser(v.trim()))
      .filter(Boolean)
  }
  return []
}


function convertir(p) {
  const grade = String(p.nutriScore ?? p.nutriscore ?? '').toUpperCase()
  const nova = Number(p.nova)
  const categorie = typeof p.categorie === 'string' ? p.categorie : ''
  return {
    code: String(p.id),
    nom: typeof p.nom === 'string' && p.nom.trim() ? p.nom : 'Nom non renseigné',
    marque: typeof p.marque === 'string' ? p.marque : '',
    image: typeof p.image === 'string' ? p.image : '',
    details: typeof p.details === 'string' ? p.details : categorie,
    categories: versListe(p.categories ?? categorie),
    allergenes: versListe(p.allergenes),
    nutriScore: grade.length === 1 && 'ABCDE'.includes(grade) ? grade : '',
    nova: nova > 0 ? nova : null,
  }
}


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

async function chargerDepuisApi(texte, nombre) {
  const parametres = new URLSearchParams({ limit: String(nombre) })
  if (texte) parametres.set('recherche', texte)

  const reponse = await fetch(
    `${API_URL.replace(/\/$/, '')}/produits?${parametres}`,
    { signal: AbortSignal.timeout(DELAI_MAX) },
  )
  if (!reponse.ok) throw new Error(`Erreur HTTP ${reponse.status}`)

  const donnees = await reponse.json()
  if (!Array.isArray(donnees)) throw new Error('Réponse du serveur invalide.')

  const dejaVus = new Set()
  const liste = donnees
    .filter((p) => p && p.id != null)
    .map(convertir)
    .filter((p) => {
      if (dejaVus.has(p.code)) return false
      dejaVus.add(p.code)
      return true
    })
  return { liste, nbRecus: donnees.length }
}

async function chargerAvecReessais(texte, nombre, id) {
  for (let essai = 0; ; essai++) {
    try {
      return await chargerDepuisApi(texte, nombre)
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


async function charger(plus = false) {
  const texte = requeteActuelle.value
  const id = ++numeroRequete
  erreur.value = ''
  erreurPlus.value = ''

  if (!plus) {
    limite.value = LIMITE_INITIALE
    produits.value = []
    nbRecus.value = 0
  }

  const cle = `bd:${texte.toLowerCase()}:${limite.value}`
  const enMemoire = lireCache(cle)
  if (enMemoire) {
    produits.value = enMemoire.liste
    nbRecus.value = enMemoire.nbRecus
    chargement.value = false
    chargementPlus.value = false
    return
  }

  if (plus) chargementPlus.value = true
  else chargement.value = true

  try {
    const reponse = await chargerAvecReessais(texte, limite.value, id)
    if (id !== numeroRequete) return
    produits.value = reponse.liste
    nbRecus.value = reponse.nbRecus
    if (reponse.liste.length) ecrireCache(cle, reponse)
  } catch (e) {
    if (id !== numeroRequete) return
    console.error('Recherche des produits :', e)
    if (plus) {
      limite.value = Math.max(LIMITE_INITIALE, limite.value - PAS)
      erreurPlus.value = messageErreur(e)
    } else {
      erreur.value = messageErreur(e)
    }
  } finally {
    if (id === numeroRequete) {
      chargement.value = false
      chargementPlus.value = false
    }
  }
}

const aPlus = computed(() => nbRecus.value >= limite.value && limite.value < LIMITE_MAX)
const limiteMaxAtteinte = computed(
  () => nbRecus.value >= limite.value && limite.value >= LIMITE_MAX,
)

function voirPlus() {
  limite.value = Math.min(limite.value + PAS, LIMITE_MAX)
  charger(true)
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

watch(
  requeteActuelle,
  (texte) => {
    recherche.value = texte
    selection.value = []
    document.title = texte
      ? `${texte} – Résultats | ${NOM_SITE}`
      : `Résultats | ${NOM_SITE}`
    charger()
  },
  { immediate: true },
)


const nbFiltres = computed(
  () =>
    (nutriScore.value ? 1 : 0) +
    allergenes.value.filter((a) => a.active).length +
    categories.value.filter((c) => c.active).length,
)
const filtresActifs = computed(() => nbFiltres.value > 0)

const allergenesDisponibles = computed(() => produits.value.some((p) => p.allergenes.length))

function contientUnMot(textes, mots) {
  return mots.some((mot) => textes.some((t) => t.includes(mot)))
}

const resultats = computed(() => {
  const allergenesExclus = allergenes.value.filter((a) => a.active)
  const categoriesActives = categories.value.filter((c) => c.active)

  let liste = produits.value.filter((p) => {
    const okScore = !nutriScore.value || p.nutriScore === nutriScore.value
    const okAllergenes = !allergenesExclus.some((a) => contientUnMot(p.allergenes, a.mots))
    const okCategories =
      !categoriesActives.length ||
      categoriesActives.some((c) => contientUnMot(p.categories, c.mots))
    return okScore && okAllergenes && okCategories
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

const sousTitre = computed(() => {
  if (!produits.value.length) return ''
  if (filtresActifs.value) {
    return `Filtres appliqués aux ${produits.value.length} produits chargés`
  }
  if (aPlus.value || limiteMaxAtteinte.value) {
    return `Affichage des ${produits.value.length} premiers résultats`
  }
  return ''
})

const annonce = computed(() => {
  if (chargement.value) return 'Chargement des produits…'
  if (erreur.value) return ''
  const n = resultats.value.length
  return `${n} ${n > 1 ? 'produits trouvés' : 'produit trouvé'}`
})

function selectNutriScore(score) {
  nutriScore.value = nutriScore.value === score ? '' : score
}

function resetFilters() {
  nutriScore.value = ''
  allergenes.value.forEach((a) => (a.active = false))
  categories.value.forEach((c) => (c.active = false))
}

const lienComparer = computed(() => `/comparer?codes=${selection.value.join(',')}`)

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
          <input
            id="produit"
            v-model="recherche"
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
                :title="titreNutri(score)"
                @click="selectNutriScore(score)"
              >
                {{ score }}
              </button>
            </div>
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
                :key="categorie.nom"
                type="button"
                :class="{ active: categorie.active }"
                :aria-pressed="categorie.active"
                @click="categorie.active = !categorie.active"
              >
                {{ categorie.nom }}
                <span v-if="categorie.active" aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </aside>

        <section class="col-12 col-lg-9" aria-labelledby="titre-resultats">
          <div class="resultats-header">
            <div>
              <h2 id="titre-resultats">
                <template v-if="chargement">Recherche en cours…</template>
                <template v-else>
                  {{ resultats.length }}
                  {{ resultats.length > 1 ? 'produits trouvés' : 'produit trouvé' }}
                  <template v-if="requeteActuelle">pour « {{ requeteActuelle }} »</template>
                </template>
              </h2>
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

          <ul v-if="resultats.length" class="liste" :aria-busy="chargementPlus">
            <li
              v-for="produit in resultats"
              :key="produit.code"
              :class="['ligne', { cochee: selection.includes(produit.code) }]"
            >
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

          <!-- Le serveur n'a rien trouvé -->
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

          <div v-if="resultats.length && aPlus" class="plus">
            <button
              type="button"
              class="btn-secondaire"
              :disabled="chargementPlus"
              @click="voirPlus"
            >
              {{ chargementPlus ? 'Chargement…' : 'Afficher plus de résultats' }}
            </button>
          </div>

          <p v-if="erreurPlus" class="erreur-plus" role="alert">{{ erreurPlus }}</p>

          <p v-if="resultats.length && limiteMaxAtteinte" class="note">
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

/* Bandeau et recherche  */
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

/* Contour visible au clavier */
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

/* Filtres  */
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

/* Ordinateur : la colonne reste visible quand on fait défiler la liste */
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

.nutri:hover {
  background: #ffe2c9;
}

.nutri.selected {
  background: var(--brun);
  border-color: var(--brun);
  color: white;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips button {
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

.chips button:hover {
  background: #ffe2c9;
}

.chips button.active {
  background: var(--brun);
  border-color: var(--brun);
  color: white;
}

/*En-tête des résultats */
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

/*Liste de produits*/
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
  /* Nom limité à 2 lignes */
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

/*Chargement (cartes grises) */
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

.erreur-plus {
  margin: 16px 0 0;
  padding: 12px 16px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: #fff0e2;
  color: var(--brun);
  text-align: center;
}

.note {
  margin: 20px 0 0;
  color: var(--texte-doux);
  font-size: 14px;
  text-align: center;
}

/* Barre de comparaison*/
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

/* Petits écrans*/
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