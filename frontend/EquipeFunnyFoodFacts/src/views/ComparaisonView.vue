<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ComparaisonProduits from '../components/ComparaisonProduits.vue'
import { lireCodes } from '../utils/comparaison'
import { useComparateurStore } from '../stores/comparateur'

const route = useRoute()
const router = useRouter()
const store = useComparateurStore()

/* ---------- Produits comparés------ */
const codes = computed(() => lireCodes(route.query.codes))
watch(codes, (liste) => store.charger(liste), { immediate: true })

function retirerProduit(id) {
  const restants = codes.value.filter((code) => code !== id)
  router.replace({ name: 'comparer', query: restants.length ? { codes: restants.join(',') } : {} })
}

function retourRecherche() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'resultat' })
}

</script>

<template>
  <main>
    <header class="hero">
      <div class="container">
        <button class="retour" type="button" @click="retourRecherche">← Retour aux résultats</button>
        <h1>Comparer les produits</h1>
        <p class="intro">
          Examinez les informations et les valeurs nutritionnelles côte à côte
          pour mieux comprendre leurs différences.
        </p>
      </div>
    </header>

    <div class="container contenu">
      <div v-if="store.chargement" class="etat" role="status">
        <span class="spinner" aria-hidden="true"></span>
        <p>Chargement des produits…</p>
      </div>

      <div v-else-if="store.erreur" class="etat" role="alert">
        <h2>La comparaison n’a pas pu être chargée</h2>
        <p>{{ store.erreur }}</p>
        <button class="bouton principal" type="button" @click="store.charger(codes)">Réessayer</button>
      </div>

      <div v-else-if="!store.produits.length" class="etat">
        <h2>Aucun produit à comparer</h2>
        <p>Sélectionnez deux produits dans les résultats de recherche.</p>
        <button class="bouton principal" type="button" @click="retourRecherche">Choisir des produits</button>
      </div>

      <template v-else>
        <div class="barre-outils">
          <label class="option">
            <input v-model="store.seulementDifferences" type="checkbox" :disabled="store.produits.length < 2" />
            Afficher seulement les différences
          </label>
        </div>

        <section v-if="store.produits.length < 2" class="avis">
          <strong>Ajoutez un deuxième produit</strong>
          <p>Retournez aux résultats pour choisir un autre produit à comparer.</p>
          <button class="bouton principal" type="button" @click="retourRecherche">Choisir un produit</button>
        </section>

        <ComparaisonProduits :produits="store.produits" @retirer="retirerProduit" />

        <div class="bas-page">
          <button class="bouton secondaire" type="button" @click="retourRecherche">← Retour aux résultats</button>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.hero {
  padding: 36px 0 42px;
  background: linear-gradient(125deg, var(--creme), var(--creme-clair) 72%);
}

.retour {
  margin-bottom: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--brun-clair);
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.retour:hover { text-decoration: underline; }

h1 {
  margin: 0 0 10px;
  font-size: clamp(32px, 4vw, 44px);
}

.intro {
  max-width: 620px;
  margin: 0;
  color: var(--texte-doux);
  line-height: 1.6;
}

.contenu {
  padding-top: 32px;
  padding-bottom: 48px;
}

.etat {
  padding: 40px 30px;
  border: 1px dashed var(--bordure-forte);
  border-radius: 18px;
  background: var(--creme-clair);
  color: var(--texte-doux);
  text-align: center;
}

.etat h2 {
  margin: 0 0 8px;
  color: var(--brun);
  font-size: 22px;
}

.etat p { margin: 0 0 16px; }

.spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  margin-bottom: 10px;
  border: 3px solid var(--bordure);
  border-top-color: var(--brun);
  border-radius: 50%;
  animation: tourner 0.8s linear infinite;
}

@keyframes tourner {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 3s; }
}

.barre-outils {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--brun);
  font-weight: bold;
  cursor: pointer;
}

.option input {
  width: 18px;
  height: 18px;
  accent-color: var(--brun);
}

/* ---------- Boutons ---------- */
.bouton {
  padding: 11px 18px;
  border: 1px solid var(--bordure-forte);
  border-radius: 10px;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.bouton.principal {
  border-color: var(--brun);
  background: var(--brun);
  color: white;
}

.bouton.secondaire {
  background: white;
  color: var(--brun-clair);
}

.bouton.secondaire:hover { background: var(--creme); }

.avis {
  margin-bottom: 24px;
  padding: 20px 24px;
  border: 1px solid var(--bordure-forte);
  border-left: 4px solid var(--orange);
  border-radius: 14px;
  background: var(--creme);
}

.avis p { margin: 4px 0 14px; color: var(--texte-doux); }

.bas-page {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--bordure);
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid var(--brun-clair);
  outline-offset: 2px;
}
</style>