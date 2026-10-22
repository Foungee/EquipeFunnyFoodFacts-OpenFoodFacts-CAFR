<template>
  <div class="comparateur-page">
    <nav class="fil-ariane" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a>
      <span class="separateur">›</span>
      <span class="fil-ariane-actuel">Comparateur</span>
    </nav>

    <h1>Comparateur de produits</h1>

    <p v-if="comparateur.produits.length === 0" class="message-vide">
      Ton comparateur est vide. Va sur une fiche produit et clique sur
      "Ajouter au comparateur" pour commencer.
    </p>

    <div v-else class="comparateur-grille">
      <div
        v-for="produit in comparateur.produits"
        :key="produit.id"
        class="carte-produit"
      >
        <img :src="produit.image" :alt="produit.nom" class="carte-image" />
        <h2>{{ produit.nom }}</h2>
        <p class="marque">{{ produit.marque }}</p>

        <table class="tableau-comparatif">
          <tbody>
            <tr>
              <th>Prix</th>
              <td>{{ produit.prix ? `${produit.prix.toFixed(2)} $` : 'Non disponible' }}</td>
            </tr>
            <tr>
              <th>Nutri-Score</th>
              <td>{{ texteNutriScore(produit.nutriScore) }}</td>
            </tr>
            <tr>
              <th>Calories</th>
              <td>{{ valeur(produit.calories, 'kcal') }}</td>
            </tr>
            <tr>
              <th>Protéines</th>
              <td>{{ valeur(produit.proteines, 'g') }}</td>
            </tr>
            <tr>
              <th>Lipides</th>
              <td>{{ valeur(produit.lipides, 'g') }}</td>
            </tr>
            <tr>
              <th>Glucides</th>
              <td>{{ valeur(produit.glucides, 'g') }}</td>
            </tr>
          </tbody>
        </table>

        <button type="button" class="btn-secondaire" @click="comparateur.retirer(produit.id)">
          Retirer du comparateur
        </button>
      </div>

      <div v-if="comparateur.produits.length < 2" class="carte-produit carte-vide">
        <p>Ajoute un deuxième produit depuis sa fiche pour le comparer ici.</p>
      </div>
    </div>

    <button
      v-if="comparateur.produits.length > 0"
      type="button"
      class="btn-secondaire bouton-vider"
      @click="comparateur.vider()"
    >
      Vider le comparateur
    </button>
  </div>
</template>

<script setup>
import { useComparateurStore } from '../stores/comparateur'

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
</script>

<style scoped>
.comparateur-page {
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

h1 {
  margin: 0 0 24px;
  font-size: clamp(28px, 3vw, 38px);
  color: #532509;
}

.message-vide {
  color: #67594f;
}

.comparateur-grille {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (min-width: 700px) {
  .comparateur-grille {
    grid-template-columns: 1fr 1fr;
  }
}

.carte-produit {
  padding: 20px;
  border: 1px solid #edd9cc;
  border-radius: 16px;
  background: white;
}

.carte-vide {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #67594f;
  background: #fff0e2;
  border-style: dashed;
}

.carte-image {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: contain;
  margin-bottom: 14px;
  padding: 10px;
  border-radius: 12px;
  background: #fff0e2;
}

.carte-produit h2 {
  margin: 0 0 4px;
  font-size: 19px;
  color: #532509;
}

.marque {
  margin: 0 0 16px;
  font-size: 13px;
  text-transform: uppercase;
  font-weight: bold;
  color: #67594f;
}

.tableau-comparatif {
  width: 100%;
  margin-bottom: 16px;
  border-collapse: collapse;
}

.tableau-comparatif th,
.tableau-comparatif td {
  padding: 8px 0;
  border-bottom: 1px solid #f3e6da;
  text-align: left;
  font-size: 14px;
}

.tableau-comparatif th {
  color: #67594f;
  font-weight: normal;
}

.tableau-comparatif td {
  color: #532509;
  font-weight: bold;
  text-align: right;
}

.btn-secondaire {
  padding: 10px 16px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: #713613;
  font-weight: bold;
  font: inherit;
  cursor: pointer;
}

.btn-secondaire:hover {
  background: #fff0e2;
}

.bouton-vider {
  display: block;
  margin: 0 auto;
}
</style>