<template>
  <div class="produit-page">
    <nav class="fil-ariane" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a>
      <span class="separateur">›</span>
      <a href="#">{{ produit.categorie }}</a>
      <span class="separateur">›</span>
      <span class="fil-ariane-actuel">{{ produit.nom }}</span>
    </nav>

    <div class="produit-grid">
      <div class="produit-photos">
        <div class="photo-principale">
          <img :src="produit.image" :alt="produit.descriptionImage" class="photo-produit" />
        </div>
        <div class="miniatures">
          <div class="miniature"><span>verso</span></div>
          <div class="miniature"><span>ingrédients</span></div>
          <div class="miniature"><span>nutrition</span></div>
        </div>
      </div>

      <div class="produit-info">
        <p class="marque-format">{{ produit.marque }} &middot; {{ produit.format }}</p>
        <h1 class="produit-nom">{{ produit.nom }}</h1>
        <p class="code-barre">{{ produit.codeBarre }}</p>

        <div class="actions">
          <button type="button" class="btn-principal">Ajouter au comparateur</button>
          <button type="button" class="btn-secondaire">Enregistrer</button>
          <button type="button" class="btn-secondaire">Corriger la fiche</button>
        </div>

        <div class="indicateurs">
          <div class="indicateur">
            <p class="indicateur-titre">Nutri-Score</p>
            <span class="indicateur-badge" :style="{ background: couleurScore(produit.nutriScore) }">
              {{ produit.nutriScore }}
            </span>
          </div>
          <div class="indicateur">
            <p class="indicateur-titre">Groupe NOVA</p>
            <span class="indicateur-badge" :style="{ background: couleurNova(produit.novaGroupe) }">
              {{ produit.novaGroupe }}
            </span>
          </div>
          <div class="indicateur">
            <p class="indicateur-titre">Éco-Score</p>
            <span class="indicateur-badge" :style="{ background: couleurScore(produit.ecoScore) }">
              {{ produit.ecoScore }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { produits } from '../data/produits'

const route = useRoute()

const produit = produits.find((p) => p.code === route.params.id) || produits[0]

const couleursScoreLettre = {
  A: '#038141',
  B: '#85bb2f',
  C: '#fecb02',
  D: '#ee8100',
  E: '#e63e11',
}

const couleursNova = {
  1: '#2ecc71',
  2: '#f1c40f',
  3: '#e67e22',
  4: '#e74c3c',
}

function couleurScore(lettre) {
  return couleursScoreLettre[lettre] || '#67594f'
}

function couleurNova(groupe) {
  return couleursNova[groupe] || '#67594f'
}
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

.miniatures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.miniature {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90px;
  border: 1px solid #edd9cc;
  border-radius: 14px;
  background: #fff0e2;
  color: #67594f;
  font-size: 13px;
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

.btn-principal:hover {
  background: #d96f16;
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
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
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

.indicateur-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 18px;
}
.photo-produit {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
}
</style>