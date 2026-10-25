<script setup>
import { API_URL } from '../config'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// const CHAMPS = [
//   'code',
//   'product_name',
//   'product_name_fr',
//   'brands',
//   'quantity',
//   'nutriscore_grade',
//   'nova_group',
//   'image_front_small_url',
//   'categories_tags',
//   'allergens_tags',
//   'nutriments',
// ].join(',')

const recherche = ref(String(route.query.q ?? ''))
const nutriScore = ref('')
const tri = ref('pertinence')
const selection = ref([])

const produits = ref([])
const chargement = ref(false)
const erreur = ref('')
let numeroRequete = 0
// let dernierMot = ''

// const total = ref(0)
// const page = computed(() => Math.max(1, parseInt(route.query.page, 10) || 1))
// const nbPages = computed(() => Math.max(1, Math.ceil(total.value / NB_PRODUITS)))

const allergenes = ref([
  { nom: 'Gluten', tag: 'en:gluten', active: false },
  { nom: 'Lait', tag: 'en:milk', active: false },
  { nom: 'Arachides', tag: 'en:peanuts', active: false },
  { nom: 'Oeufs', tag: 'en:eggs', active: false },
  { nom: 'Soja', tag: 'en:soybeans', active: false },
])

const categories = ref([
  { nom: 'Huiles et graisses', mots: ['huile', 'oil', 'graisse', 'fat'], active: false },
  { nom: 'Céréales', mots: ['cereal', 'céréale'], active: false },
  { nom: 'Sauces', mots: ['sauce'], active: false },
  { nom: 'Produits laitiers', mots: ['lait', 'dairie', 'laitier', 'yaourt', 'yogourt', 'yogurt', 'fromage'], active: false, },
])

const requeteActuelle = computed(() => String(route.query.q ?? '').trim())

const resultats = computed(() => {
  const texte = recherche.value.trim().toLowerCase()
  const allergenesExclus = allergenes.value.filter((a) => a.active).map((a) => a.nom)
  const categoriesActives = categories.value.filter((c) => c.active).map((c) => c.nom)

  let liste = produits.value.filter((p) => {
    const okTexte =
      !texte ||
      p.nom.toLowerCase().includes(texte) ||
      p.marque.toLowerCase().includes(texte) ||
      p.code.includes(texte)
    const okScore = !nutriScore.value || p.nutriScore === nutriScore.value
    const okAllergenes =
      !allergenesExclus.length ||
      (Array.isArray(p.allergenes) &&
        !p.allergenes.some((a) => allergenesExclus.includes(a)))
    const okCategories =
      !categoriesActives.length || categoriesActives.includes(p.categorie)
    return okTexte && okScore && okAllergenes && okCategories
  })

  if (tri.value === 'nom') {
    liste = [...liste].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  } else if (tri.value === 'marque') {
    liste = [...liste].sort((a, b) => a.marque.localeCompare(b.marque, 'fr'))
  }
  return liste
})

const lienComparer = computed(() => `/comparer?codes=${selection.value.join(',')}`)

function selectNutriScore(score) {
  nutriScore.value = nutriScore.value === score ? '' : score
}

function resetFilters() {
  nutriScore.value = ''
  recherche.value = ''
  tri.value = 'pertinence'
  allergenes.value.forEach((a) => (a.active = false))
  categories.value.forEach((c) => (c.active = false))
}

function soumettreRecherche() {
  const texte = recherche.value.trim()

  router.push({
    path: '/resultat',
    query: texte ? { q: texte } : {},
  })
}

async function chargerProduits(texte) {
  const requete = ++numeroRequete
  chargement.value = true
  erreur.value = ''
  produits.value = []

  try {
    const parametres = new URLSearchParams({
      recherche: texte,
      limit: '15',
    })

    const reponse = await fetch(
      `${API_URL.replace(/\/$/, '')}/produits?${parametres}`,
      { signal: AbortSignal.timeout(20000) },
    )

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status}`)
    }

    const donnees = await reponse.json()

    if (!Array.isArray(donnees)) {
      throw new Error('Réponse du serveur invalide.')
    }

    if (requete !== numeroRequete) return

    produits.value = donnees
      .filter((produit) => produit && produit.id != null)
      .map((produit) => ({
        code: String(produit.id),
        nom: produit.nom || 'Nom non renseigné',
        marque: produit.marque || '',
        image: produit.image || '',
        details: produit.categorie || '',
        categorie: produit.categorie || '',
        nutriScore: String(produit.nutriScore || '').toUpperCase(),
        allergenes: null,
        nova: null,
      }))
  } catch (cause) {
    if (requete !== numeroRequete) return

    console.error('Recherche des produits :', cause)
    erreur.value = 'Impossible de charger les produits. Réessayez.'
  } finally {
    if (requete === numeroRequete) {
      chargement.value = false
    }
  }
}

watch(
  requeteActuelle,
  (texte) => {
    recherche.value = texte
    selection.value = []
    chargerProduits(texte)
  },
  { immediate: true },
)

</script>

<template>
  <main class="resultats-page" :class="{ 'avec-barre': selection.length }">
    <section class="hero">
      <div class="container">
        <h1>Résultats de recherche</h1>
        <form class="search" @submit.prevent="soumettreRecherche">
          <label for="produit" class="visually-hidden">
            Nom ou code-barres du produit
          </label>
          <input id="produit" v-model="recherche" type="search" placeholder="Nom du produit ou code-barres…" />
          <button type="submit">Rechercher</button>
        </form>
      </div>
    </section>

    <div class="container py-5">
      <div class="row g-4">
        <aside class="col-12 col-lg-3" aria-label="Filtres">
          <div class="filtres">
            <div class="filtres-header">
              <h2>Filtres</h2>
              <button type="button" @click="resetFilters">Tout effacer</button>
            </div>

            <h3>Nutri-Score</h3>
            <div class="nutri-buttons" role="group" aria-label="Nutri-Score">
              <button v-for="score in ['A', 'B', 'C', 'D', 'E']" :key="score" type="button"
                :class="['nutri', { selected: nutriScore === score }]" :aria-pressed="nutriScore === score"
                @click="selectNutriScore(score)">
                {{ score }}
              </button>
            </div>
          </div>

          <div class="filtres">
            <h3>Exclure les allergènes</h3>
            <div class="chips">
              <button v-for="allergene in allergenes" :key="allergene.nom" type="button"
                :class="{ active: allergene.active }" :aria-pressed="allergene.active"
                @click="allergene.active = !allergene.active">
                {{ allergene.nom }}
                <span v-if="allergene.active" aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <div class="filtres">
            <h3>Catégories</h3>
            <div class="chips">
              <button v-for="categorie in categories" :key="categorie.nom" type="button"
                :class="{ active: categorie.active }" :aria-pressed="categorie.active"
                @click="categorie.active = !categorie.active">
                {{ categorie.nom }}
                <span v-if="categorie.active" aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        </aside>

        <section class="col-12 col-lg-9" aria-labelledby="titre-resultats">
          <div class="resultats-header">
            <h2 id="titre-resultats">
              {{ resultats.length }}
              {{ resultats.length > 1 ? 'produits trouvés' : 'produit trouvé' }}
            </h2>
            <label class="tri">
              Trier par
              <select v-model="tri">
                <option value="pertinence">Pertinence</option>
                <option value="nom">Nom (A–Z)</option>
                <option value="marque">Marque</option>
              </select>
            </label>
          </div>

          <p v-if="chargement" role="status">
            Chargement des produits…
          </p>

          <div v-if="erreur" role="alert">
            <p>{{ erreur }}</p>
            <button type="button" @click="chargerProduits(requeteActuelle)">
              Réessayer
            </button>
          </div>
          

         <ul v-if="!chargement && !erreur && resultats.length" class="liste">
            <li v-for="produit in resultats" :key="produit.code" class="ligne">
              <input v-model="selection" type="checkbox" class="case" :value="produit.code"
                :aria-label="`Sélectionner ${produit.nom} pour la comparaison`" />

              <div class="vignette">
                <img v-if="produit.image" :src="produit.image" :alt="produit.nom" />
                <span v-else>Aucune image</span>
              </div>

              <div class="infos">
                <p class="marque">{{ produit.marque }}</p>
                <h3>{{ produit.nom }}</h3>
                <p class="details">{{ produit.details }}</p>
              </div>

              <div class="indicateurs">
                <span :class="['score', 'nutri-' + produit.nutriScore]" :title="`Nutri-Score ${produit.nutriScore}`">
                  {{ produit.nutriScore }}
                </span>
                <span class="nova" :title="`Groupe NOVA ${produit.nova}`">
                  {{ produit.nova }}
                </span>
                <a :href="`/produit/${produit.code}`" class="voir">Voir</a>
              </div>
            </li>
          </ul>

          <p v-else-if="!chargement && !erreur" class="vide">
            Aucun produit ne correspond à votre recherche. Essayez un autre nom
            ou retirez un filtre.
          </p>
        </section>
      </div>
    </div>

    <div v-if="selection.length" class="barre-comparaison" role="status">
      <span>
        {{ selection.length }}
        {{ selection.length > 1 ? 'produits sélectionnés' : 'produit sélectionné' }}
      </span>
      <a :href="lienComparer" :class="['comparer', { desactive: selection.length < 2 }]"
        :aria-disabled="selection.length < 2">
        Comparer côte à côte →
      </a>
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
  padding-bottom: 80px;
}

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

.search button:focus-visible,
.nutri:focus-visible,
.chips button:focus-visible,
.filtres-header button:focus-visible,
.voir:focus-visible,
.comparer:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 2px;
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
}

.chips button.active {
  background: var(--brun);
  border-color: var(--brun);
  color: white;
}

.resultats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.resultats-header h2 {
  margin: 0;
  font-size: 24px;
}

.tri {
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
}

.ligne:last-child {
  border-bottom: 0;
}

.case {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  accent-color: var(--brun);
  cursor: pointer;
}

.vignette {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 94px;
  height: 94px;
  border: 1px dashed #dabca9;
  border-radius: 12px;
  background: var(--creme);
  color: var(--texte-doux);
  font-size: 12px;
  text-align: center;
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
  gap: 10px;
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

.score.nutri-A {
  background: #038141;
}

.score.nutri-B {
  background: #4b9f2a;
}

.score.nutri-C {
  background: #c98a00;
}

.score.nutri-D {
  background: #e6620f;
}

.score.nutri-E {
  background: #d52b1e;
}

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
}

.voir:hover {
  background: var(--creme);
}

.vide {
  padding: 30px;
  border: 1px dashed #dabca9;
  border-radius: 18px;
  background: #fff9f5;
  color: var(--texte-doux);
}

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
  padding: 16px 28px;
  background: var(--brun);
  color: white;
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
    padding: 14px 16px;
  }
}
</style>