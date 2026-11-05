<template>
  <div class="produit-page">
    <nav class="fil-ariane" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a>
      <span class="separateur">›</span>
      <span class="fil-ariane-actuel">{{ produit?.nom }}</span>
    </nav>

    <p v-if="chargement">Chargement du produit…</p>
    <p v-else-if="erreur">{{ erreur }}</p>

    <div v-else class="produit-grid">
      <div class="produit-photos">
        <div class="photo-principale">
          <img :src="produit.image" :alt="produit.nom" class="photo-produit" />
        </div>
      </div>

      <div class="produit-info">
        <p class="marque-format">
          {{ produit.marque }} &middot; {{ produit.categorie || 'Catégorie non précisée' }}
        </p>
        <h1 class="produit-nom">{{ produit.nom }}</h1>
        <p class="code-barre">{{ produit.prix ? `${produit.prix.toFixed(2)} $` : 'Prix non disponible' }}</p>

        <div class="actions">
          <button
            type="button"
            class="btn-principal"
            :disabled="comparateur.estDansComparateur(route.params.id)"
            @click="ajouterAuComparateur"
          >
            {{ comparateur.estDansComparateur(route.params.id) ? 'Déjà dans le comparateur' : 'Ajouter au comparateur' }}
          </button>
          <button type="button" class="btn-secondaire">Enregistrer</button>
         
        </div>

        <div class="indicateurs">
          <div class="indicateur">
            <p class="indicateur-titre">Nutri-Score</p>
            <p class="indicateur-texte">{{ texteNutriScore(produit.nutriScore) }}</p>
          </div>
        </div>

        <div class="nutrition">
          <h2>Valeurs nutritives (pour 100 g)</h2>
          <ul class="nutrition-liste">
            <li><span>Calories</span><span>{{ valeur(produit.calories, 'kcal') }}</span></li>
            <li><span>Protéines</span><span>{{ valeur(produit.proteines, 'g') }}</span></li>
            <li><span>Lipides</span><span>{{ valeur(produit.lipides, 'g') }}</span></li>
            <li><span>Glucides</span><span>{{ valeur(produit.glucides, 'g') }}</span></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComparateurStore } from '../stores/comparateur'
import { API_URL } from '../config'

const route = useRoute()
const router = useRouter()
const produit = ref(null)
const chargement = ref(true)
const erreur = ref('')
const comparateur = useComparateurStore()

function valeur(v, unite) {
  return v === null || v === undefined ? 'Non disponible' : `${v} ${unite}`
}

const textesStatut = {
  NOT_ELIGIBLE: 'Non calculable',
  FVL_NOT_AVAILABLE: 'Données incomplètes',
}

function texteNutriScore(statut) {
  if (!statut) return 'Non disponible'
  return textesStatut[statut] || statut
}

function ajouterAuComparateur() {
  comparateur.ajouter({ id: route.params.id, ...produit.value })
  router.push('/comparateur')
}

onMounted(async () => {
  try {
    const reponse = await fetch(`${API_URL.replace(/\/$/, '')}/produits/${route.params.id}`)
    if (!reponse.ok) {
      erreur.value = 'Produit introuvable.'
      return
    }
    produit.value = await reponse.json()
  } catch {
    erreur.value = 'Impossible de contacter le serveur. Vérifie que le backend est démarré.'
  } finally {
    chargement.value = false
  }
})
</script>

<style scoped>
.produit-page {
  max-width: 1160px;
  margin: 0 auto;
  padding: 32px 24px;
}

.fil-ariane {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 14px;
  color: #67594f;
}

.fil-ariane a {
  color: #67594f;
}

.fil-ariane a:hover {
  text-decoration: underline;
}

.fil-ariane-actuel {
  color: #713613;
  font-weight: bold;
}

.separateur {
  color: #cbb6a8;
}

.produit-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

@media (min-width: 900px) {
  .produit-grid {
    grid-template-columns: 5fr 7fr;
  }
}

.photo-principale {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  border: 1px solid #edd9cc;
  border-radius: 24px;
  background: #fff0e2;
  color: #67594f;
}

.marque-format {
  margin: 0 0 4px;
  text-transform: uppercase;
  font-size: 13px;
  font-weight: bold;
  color: #67594f;
}

.produit-nom {
  margin: 0 0 12px;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.15;
  color: #532509;
}

.code-barre {
  display: inline-block;
  margin: 0 0 20px;
  padding: 6px 12px;
  border: 1px solid #edd9cc;
  border-radius: 30px;
  background: white;
  color: #67594f;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 28px;
}

.btn-principal,
.btn-secondaire {
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: bold;
  font: inherit;
  cursor: pointer;
}

.btn-principal {
  border: 0;
  background: #f58220;
  color: white;
}

.btn-principal:hover:not(:disabled) {
  background: #d96f16;
}

.btn-principal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondaire {
  border: 1px solid #dabca9;
  background: white;
  color: #713613;
}

.btn-secondaire:hover {
  background: #fff0e2;
}

.indicateurs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 28px;
}

.indicateur {
  padding: 16px;
  border: 1px solid #edd9cc;
  border-radius: 16px;
  background: white;
  text-align: center;
}

.indicateur-titre {
  margin: 0 0 10px;
  font-size: 13px;
  color: #67594f;
}

.indicateur-texte {
  margin: 0;
  font-weight: bold;
  color: #532509;
}

.photo-produit {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
}

.nutrition {
  margin-bottom: 28px;
  padding: 20px;
  border: 1px solid #edd9cc;
  border-radius: 16px;
  background: white;
}

.nutrition h2 {
  margin: 0 0 14px;
  font-size: 18px;
  color: #532509;
}

.nutrition-liste {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nutrition-liste li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3e6da;
  color: #532509;
}

.nutrition-liste li:last-child {
  border-bottom: 0;
}
</style>