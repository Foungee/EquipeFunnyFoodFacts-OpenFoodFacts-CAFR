<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultatsRecherche from '../components/ResultatsRecherche.vue'
import { useRechercheStore } from '../stores/recherche'

const route = useRoute()
const router = useRouter()
const store = useRechercheStore()

const recherche = ref('')

// L'URL (?q=...) est la source de vérité : chaque changement relance la recherche.
watch(
  () => route.query.q,
  (q) => {
    recherche.value = String(q ?? '').trim()
    store.charger(recherche.value)
  },
  { immediate: true },
)

function soumettreRecherche() {
  const texte = recherche.value.trim()

  if (texte === store.requete) store.charger()
  else router.push({ name: 'resultat', query: texte ? { q: texte } : {} })
}
</script>

<template>
  <main>
    <section class="hero">
      <div class="container">
        <h1>Résultats de recherche</h1>

        <form class="search" role="search" @submit.prevent="soumettreRecherche">
          <label for="produit" class="visually-hidden">Nom ou code-barres du produit</label>
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
      <ResultatsRecherche />
    </div>
  </main>
</template>

<style scoped>
.hero {
  padding: 42px 0;
  background: linear-gradient(125deg, var(--creme), var(--creme-clair) 72%);
}

h1 {
  margin: 0 0 16px;
  font-size: clamp(32px, 4vw, 44px);
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
  font-weight: bold;
  cursor: pointer;
}

.search:focus-within {
  outline: 3px solid var(--brun-clair);
  outline-offset: 2px;
}

@media (max-width: 780px) {
  .hero { padding: 32px 0; }
}
</style>