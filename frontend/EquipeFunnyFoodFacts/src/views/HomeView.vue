<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_URL } from '../config'

const router = useRouter()
const recherche = ref('')
const erreurCategories = ref('')

const categories = ref([
  { code: 'DAIRY', nom: 'Produits laitiers', nombre: null },
  { code: 'BAKERY', nom: 'Boulangerie', nombre: null },
  { code: 'SNACKS', nom: 'Collations', nombre: null },
  { code: 'BEVERAGES', nom: 'Boissons', nombre: null },
  { code: 'GENERAL_GROCERY', nom: 'Épicerie générale', nombre: null },
  { code: 'FROZEN', nom: 'Surgelés', nombre: null },
  { code: 'PRODUCE', nom: 'Fruits et légumes', nombre: null },
  { code: 'BREAKFAST', nom: 'Petit-déjeuner', nombre: null },
])

async function chargerCategories() {
  try {
    const reponse = await fetch(
      `${API_URL.replace(/\/$/, '')}/produits/categories`,
    )

    if (!reponse.ok) {
      throw new Error('Chargement des catégories impossible')
    }

    const donnees = await reponse.json()

    // Associer chaque compteur à la bonne catégorie.
    for (const categorie of categories.value) {
      const resultat = donnees.find(
        (element) => element.code === categorie.code,
      )

      categorie.nombre = resultat ? Number(resultat.nombre) : 0
    }
  } catch (erreur) {
    console.error(erreur)
    erreurCategories.value = 'Les compteurs sont temporairement indisponibles.'
  }
}

function soumettreRecherche() {
  const texte = recherche.value.trim()

  if (!texte) return

  router.push({
    path: '/resultat',
    query: { q: texte },
  })
}

onMounted(chargerCategories)
</script>

<template>
  <main>
    <section class="hero">
      <div class="container">
        <h1>Comprenez mieux <span>ce que vous mangez.</span></h1>

        <form class="search" @submit.prevent="soumettreRecherche">
          <label for="recherche-accueil" class="visually-hidden">
            Rechercher un produit
          </label>

          <input id="recherche-accueil" v-model="recherche" type="search" placeholder="Rechercher un produit…"
            required />

          <button type="submit">Rechercher</button>
        </form>
      </div>
    </section>

    <section class="explorer container" aria-labelledby="titre-explorer">
      <div class="entete-explorer">
        <h2 id="titre-explorer">Explorer</h2>

      </div>

      <p v-if="erreurCategories" role="status">
        {{ erreurCategories }}
      </p>

      <div class="row g-3">
        <div v-for="categorie in categories" :key="categorie.code" class="col-12 col-sm-6 col-lg-3">
          <RouterLink class="carte-categorie" :to="{
            name: 'categorie',
            params: { code: categorie.code },
            query: { nom: categorie.nom },
          }">
            <span v-if="categorie.nombre !== null" class="nombre-produits">
              {{ categorie.nombre }} produits
            </span>

            <h3>{{ categorie.nom }}</h3>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="contribution container" aria-labelledby="titre-contribution">
      <div>
        <h2 id="titre-contribution">Une base construite ensemble</h2>
        <p>
          Open Food Facts est un projet collaboratif animé par des bénévoles.
          Chacun peut aider à enrichir les informations sur les produits alimentaires.
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
  padding: 48px 0;
  background: linear-gradient(125deg, #fff0e2, #fff9f5);
}

h1 {
  max-width: 750px;
  margin: 0 0 24px;
  font-size: clamp(36px, 4vw, 56px);
  line-height: 1.1;
}

h1 span {
  color: #f58220;
}

.search {
  display: flex;
  max-width: 650px;
  padding: 6px;
  border: 1px solid #e8c9b7;
  border-radius: 12px;
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

.search button {
  padding: 14px 20px;
  border: 0;
  border-radius: 8px;
  background: #532509;
  color: white;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.explorer {
  padding-top: 48px;
  padding-bottom: 48px;
}

.entete-explorer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.entete-explorer h2 {
  margin: 0;
}

.carte-categorie {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 110px;
  height: 100%;
  padding: 20px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: #fff9f5;
  text-align: center;
}

.carte-categorie h3 {
  margin: 0;
  color: #532509;
  font-size: 18px;
}

.contribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 28px;
  border-top: 1px solid #edd9cc;
}

.contribution h2 {
  font-size: 24px;
}

.contribution p {
  max-width: 650px;
  margin: 0;
  color: #67594f;
  line-height: 1.6;
}

a {
  color: #713613;
  font-weight: bold;
}

.contribution>a {
  flex-shrink: 0;
  padding: 14px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

input:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 3px solid #713613;
  outline-offset: 3px;
}

@media (max-width: 700px) {
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
}

.carte-categorie {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 110px;
  height: 100%;
  padding: 20px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: #fff9f5;
  text-align: center;
}
.carte-categorie {
  text-decoration: none;
}

.carte-categorie:hover {
  background: #fff0e2;
  border-color: #713613;
  text-decoration: none;
}

.nombre-produits {
  color: #713613;
  font-size: 14px;
}
</style>