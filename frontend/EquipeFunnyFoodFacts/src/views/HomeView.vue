<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { API_URL } from '../config'

const recherche = ref('')
const messageRecherche = ref('')

const produits = ref([])
const chargement = ref(false)
const erreurProduits = ref('')
const messageCache = ref('')

const cleCache = 'accueil-motherduck-produits-v1'


function normaliserProduits(liste) {
  return liste
    .filter((produit) => produit && produit.id)
    .slice(0, 12)
    .map((produit) => ({
      id: String(produit.id),
      nom:
        typeof produit.nom === 'string' && produit.nom.trim()
          ? produit.nom
          : 'Nom non renseigné',
      marque: typeof produit.marque === 'string' ? produit.marque : '',
      image: typeof produit.image === 'string' ? produit.image : '',
    }))
}
function lireCache() {
  try {
    const sauvegarde = JSON.parse(localStorage.getItem(cleCache))

    if (
      !sauvegarde ||
      !Number.isFinite(sauvegarde.date) ||
      !Array.isArray(sauvegarde.produits)
    ) {
      return
    }

    produits.value = normaliserProduits(sauvegarde.produits)

    if (produits.value.length) {
      const date = new Date(sauvegarde.date).toLocaleString('fr-CA')
      messageCache.value = `Dernière sauvegarde : ${date}.`
    }
  } catch (erreur) {
    console.warn('Lecture de la sauvegarde impossible :', erreur)
  }
}

function sauvegarderProduits() {
  try {
    localStorage.setItem(
      cleCache,
      JSON.stringify({
        produits: produits.value,
        date: Date.now(),
      }),
    )
  } catch (erreur) {
    console.warn('Sauvegarde locale impossible :', erreur)
  }
}

async function chargerProduits() {
  if (chargement.value) return

  chargement.value = true
  erreurProduits.value = ''

  const controleur = new AbortController()
  const delai = setTimeout(() => controleur.abort(), 20000)

  try {
    const reponse = await fetch(
      `${API_URL.replace(/\/$/, '')}/produits?limit=12`,
      { signal: controleur.signal },
    )

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status}`)
    }

    const donnees = await reponse.json()

    if (!Array.isArray(donnees)) {
      throw new Error('Le serveur ne renvoie pas une liste de produits.')
    }

    produits.value = normaliserProduits(donnees)
    messageCache.value = ''
    sauvegarderProduits()
  } catch (erreur) {
    console.error('Chargement des produits :', erreur)

    erreurProduits.value = produits.value.length
      ? 'Actualisation impossible. Les derniers produits chargés restent affichés.'
      : 'Impossible de charger les produits. Réessayez.'
  } finally {
    clearTimeout(delai)
    chargement.value = false
  }
}

function soumettreRecherche() {
  if (!recherche.value.trim()) return

  messageRecherche.value = 'La page de résultats est en cours d’intégration.'
}

onMounted(() => {
  lireCache()
  chargerProduits()
})
</script>

<template>
  <main>
    <section class="hero">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-7">
            <h1>Comprenez mieux <span>ce que vous mangez.</span></h1>

            <form class="search" @submit.prevent="soumettreRecherche">
              <label for="produit" class="visually-hidden">
                Nom ou code-barres du produit
              </label>

              <input id="produit" v-model="recherche" type="search" placeholder="Nom du produit ou code-barres…"
                required />

              <button type="submit">Rechercher</button>
            </form>

            <p v-if="messageRecherche" class="search-status" role="status">
              {{ messageRecherche }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="produits container py-5" aria-labelledby="titre-produits">
      <h2 id="titre-produits">Quelques produits à découvrir</h2>

      <p v-if="chargement" role="status">
        {{
          produits.length
            ? 'Actualisation des produits…'
            : 'Chargement des produits…'
        }}
      </p>

      <div v-if="erreurProduits" class="message-erreur" role="status">
        <p>{{ erreurProduits }}</p>

        <button type="button" class="bouton-reessayer" :disabled="chargement" @click="chargerProduits">
          {{ chargement ? 'Chargement…' : 'Réessayer' }}
        </button>
      </div>

      <p v-if="messageCache" class="message-cache" role="status">
        {{ messageCache }}
      </p>

      <p v-if="!chargement && !erreurProduits && !produits.length">
        Aucun produit disponible pour le moment.
      </p>

      <div v-if="produits.length" class="row g-4">
        <article v-for="produit in produits" :key="produit.id" class="col-12 col-md-4">
          <div class="product-card">
            <img v-if="produit.image" :src="produit.image" :alt="produit.nom" class="product-photo" loading="lazy"
              @error="produit.image = ''" />

            <div v-else class="product-photo photo-absente">
              Image non disponible
            </div>

            <p v-if="produit.marque" class="product-brand">
              {{ produit.marque }}
            </p>

            <h3>{{ produit.nom }}</h3>


            <RouterLink :to="`/produit/${produit.id}`">
              <i class="bi bi-eye-fill" aria-hidden="true"></i>
              Voir la fiche
            </RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="contribution container" aria-labelledby="titre-contribution">
      <div>
        <h2 id="titre-contribution">Une base construite ensemble</h2>

        <p>
          Open Food Facts est un projet collaboratif animé par des bénévoles.
          Chacun peut aider à enrichir les informations sur les produits
          alimentaires.
        </p>
      </div>

      <a href="https://ca.openfoodfacts.org/contribute" target="_blank" rel="noopener noreferrer">
        Contribuer au projet
      </a>
    </section>
  </main>
</template>

<style scoped>
.hero {
  padding: 42px 0;
  background: linear-gradient(125deg, #fff0e2, #fff9f5 72%);
}

h1 {
  margin: 16px 0;
  font-size: clamp(38px, 4vw, 56px);
  line-height: 1.1;
}

h1 span {
  color: #f58220;
}

.search {
  display: flex;
  max-width: 650px;
  margin-top: 18px;
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
  background: transparent;
  font: inherit;
}

.search input:focus-visible {
  outline: 2px solid #713613;
  outline-offset: -2px;
  border-radius: 8px;
}

.search button {
  padding: 14px 20px;
  border: 0;
  border-radius: 10px;
  background: #532509;
  color: white;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.search-status {
  margin-top: 10px;
  color: #713613;
}

.produits h2 {
  margin-bottom: 20px;
}

.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  border: 1px solid #edd9cc;
  border-radius: 24px;
  background: white;
}

.product-photo {
  display: block;
  width: 100%;
  height: 190px;
  object-fit: contain;
  margin-bottom: 18px;
  padding: 12px;
  border-radius: 12px;
  background: #fff0e2;
}

.photo-absente {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #67594f;
  text-align: center;
}

.product-brand {
  margin: 0 0 6px;
  color: #67594f;
  font-size: 14px;
}

.product-card h3 {
  margin-bottom: 16px;
  font-size: 21px;
  overflow-wrap: anywhere;
}

.product-card a {
  margin-top: auto;
  color: #713613;
  font-weight: bold;
}

.product-card a i {
  margin-right: 5px;
}

.message-erreur {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: #fff0e2;
  color: #532509;
}

.message-erreur p {
  margin: 0 0 10px;
}

.bouton-reessayer {
  padding: 10px 16px;
  border: 0;
  border-radius: 8px;
  background: #532509;
  color: white;
  font: inherit;
  cursor: pointer;
}

.bouton-reessayer:disabled {
  opacity: 0.6;
  cursor: wait;
}

.message-cache {
  color: #67594f;
  font-size: 14px;
}

.contribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 28px;
}

.contribution h2 {
  margin: 0 0 6px;
}

.contribution p {
  max-width: 650px;
  margin: 0;
  color: #67594f;
  line-height: 1.6;
}

.contribution>a {
  flex-shrink: 0;
  padding: 14px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: #713613;
  font-weight: bold;
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid #713613;
  outline-offset: 3px;
}

@media (max-width: 780px) {
  .hero {
    padding: 50px 0;
  }

  .contribution {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 420px) {
  .search {
    flex-direction: column;
    gap: 6px;
  }

  .search button {
    width: 100%;
  }
}
</style>