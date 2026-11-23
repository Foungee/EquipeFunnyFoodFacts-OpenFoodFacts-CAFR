<script setup>
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { MAX_COMPARAISON } from '../config'
import { useRechercheStore } from '../stores/recherche'
import { ALLERGENES, CATEGORIES, nomCategorie } from '../utils/produits'

const store = useRechercheStore()
const {
  filtres, comptes, marques, allergenesDisponibles, nbFiltres,
  resultats, produits, chargement, erreur, requete, selection, selectionPleine,
} = storeToRefs(store)

const filtresOuverts = ref(false)
const imagesCassees = reactive({})
const titre = computed(() => {
  if (chargement.value) return 'Recherche en cours…'
  const n = resultats.value.length
  const pour = requete.value ? ` pour « ${requete.value} »` : ''
  return `${n.toLocaleString('fr-CA')} ${n > 1 ? 'produits trouvés' : 'produit trouvé'}${pour}`
})
</script>

<template>
  <div class="recherche" :class="{ 'avec-barre': selection.length }">
    <button type="button" class="bouton-filtres"
      :aria-expanded="filtresOuverts"
      aria-controls="colonne-filtres"
      @click="filtresOuverts = !filtresOuverts"
    >
      Filtres
      <span v-if="nbFiltres" class="compteur">{{ nbFiltres }}</span>
      <span aria-hidden="true">{{ filtresOuverts ? '▴' : '▾' }}</span>
    </button>

    <div class="row g-4">
      <!-- Filtres -->
      <aside id="colonne-filtres" class="col-12 col-lg-3 colonne-filtres"
        :class="{ ouvert: filtresOuverts }"
        aria-label="Filtres"
      >
        <div class="filtres">
          <div class="filtres-header">
            <h2>Filtres</h2>
            <button type="button" :disabled="!nbFiltres" @click="store.effacerFiltres">Tout effacer</button>
          </div>

          <h3>Nutri-Score</h3>
          <div class="nutri-buttons">
            <button
              v-for="score in ['A', 'B', 'C', 'D', 'E']"
              :key="score"
              type="button"
              :class="['nutri', { selected: filtres.nutriScore === score }]"
              :disabled="!comptes.nutri[score] && filtres.nutriScore !== score"
              @click="store.choisirNutriScore(score)"
            >
              {{ score }}
            </button>
          </div>

          <h3 class="sous-filtre">Groupe NOVA</h3>
          <div class="nutri-buttons">
            <button
              v-for="niveau in [1, 2, 3, 4]"
              :key="niveau"
              type="button"
              :class="['nutri', { selected: filtres.nova === niveau }]"
              :disabled="!comptes.nova[niveau] && filtres.nova !== niveau"
              @click="store.choisirNova(niveau)"
            >
              {{ niveau }}
            </button>
          </div>
        </div>

        <div v-if="allergenesDisponibles" class="filtres">
          <h3>Exclure les allergènes</h3>
          <div class="chips">
            <button v-for="allergene in ALLERGENES" :key="allergene.nom"
              type="button"
              :class="{ active: filtres.allergenes.includes(allergene.nom) }"
              @click="store.basculer('allergenes', allergene.nom)"
            >
              {{ allergene.nom }}
              <span v-if="filtres.allergenes.includes(allergene.nom)">×</span>
            </button>
          </div>
        </div>

        <div class="filtres">
          <h3>Catégories</h3>
          <div class="chips">
            <button v-for="categorie in CATEGORIES" :key="categorie.code"
              type="button"
              :class="{ active: filtres.categories.includes(categorie.code) }"
              :disabled="!comptes.categories[categorie.code] && !filtres.categories.includes(categorie.code)"
              @click="store.basculer('categories', categorie.code)"
            >
              {{ categorie.nom }}
              <span class="nb">{{ comptes.categories[categorie.code] ?? 0 }}</span>
            </button>
          </div>
        </div>

        <div v-if="marques.length >= 2" class="filtres">
          <h3>Marques</h3>
          <div class="chips">
            <button v-for="marque in marques" :key="marque.cle"
              type="button"
              :class="{ active: filtres.marques.includes(marque.cle) }"
              @click="store.basculer('marques', marque.cle)"
            >
              {{ marque.nom }}
              <span class="nb">{{ marque.n }}</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Résultats -->
      <section class="col-12 col-lg-9" aria-labelledby="titre-resultats">
        <div class="resultats-header">
          <h2 id="titre-resultats">{{ titre }}</h2>

          <label class="tri">
            Trier par
            <select v-model="store.tri">
              <option value="pertinence">Pertinence</option>
              <option value="nutriscore">Nutri-Score (A à E)</option>
              <option value="nom">Nom (A–Z)</option>
              <option value="marque">Marque</option>
            </select>
          </label>
        </div>

        <p class="visually-hidden" role="status" aria-live="polite">{{ erreur ? '' : titre }}</p>

        <ul v-if="resultats.length" class="liste">
          <li v-for="produit in resultats" :key="produit.id" :class="['ligne', { cochee: selection.includes(produit.id) }]" >
            <input type="checkbox" class="case"
              :checked="selection.includes(produit.id)"
              :disabled="selectionPleine && !selection.includes(produit.id)"
              :aria-label="`Sélectionner ${produit.nom} pour la comparaison`"
              @change="store.basculerSelection(produit.id)"
            />

            <div :class="['vignette', { sans: !produit.image || imagesCassees[produit.id] }]">
              <img
                v-if="produit.image && !imagesCassees[produit.id]"
                :src="produit.image"
                :alt="produit.nom"
                loading="lazy"
                @error="imagesCassees[produit.id] = true"
              />
              <span v-else>Aucune image</span>
            </div>

            <div class="infos">
              <p v-if="produit.marque" class="marque">{{ produit.marque }}</p>
              <h3>{{ produit.nom }}</h3>
              <p v-if="produit.details" class="details">{{ produit.details }}</p>
              <span v-if="nomCategorie(produit.categorieCode)" class="etiquette">
                {{ nomCategorie(produit.categorieCode) }}
              </span>
            </div>

            <div class="indicateurs">
              <div class="indic">
                <span :class="['score', 'nutri-' + (produit.nutriScore || 'inconnu')]">
                  {{ produit.nutriScore || '?' }}
                </span>
                <small>Nutri-Score</small>
              </div>
              <div class="indic">
                <span class="nova">{{ produit.nova || '–' }}</span>
                <small>NOVA</small>
              </div>
              <router-link :to="`/produit/${produit.id}`" class="voir" :aria-label="`Voir la fiche de ${produit.nom}`" >
                Voir
              </router-link>
            </div>
          </li>
        </ul>

        <div v-else-if="chargement" class="vide">Chargement des produits…</div>

        <div v-else-if="erreur" class="vide" role="alert">
          <p>{{ erreur }}</p>
          <button type="button" class="btn-secondaire" @click="store.charger()">Réessayer</button>
        </div>

        <div v-else-if="!produits.length" class="vide">
          <p>
            <strong v-if="requete">Aucun résultat pour « {{ requete }} ».</strong>
            <strong v-else>Aucun produit disponible pour le moment.</strong>
          </p>
          <p v-if="requete" class="conseil">Vérifiez l’orthographe ou essayez un mot plus court.</p>
        </div>

        <div v-else class="vide">
          <p><strong>Aucun produit ne correspond à vos filtres.</strong></p>
          <button type="button" class="btn-secondaire" @click="store.effacerFiltres">Effacer les filtres</button>
        </div>
      </section>
    </div>

    <!-- Barre de comparaison -->
    <div v-if="selection.length" class="barre-comparaison" role="status">
      <div class="barre-infos">
        <span>
          {{ selection.length }}
          {{ selection.length > 1 ? 'produits sélectionnés' : 'produit sélectionné' }}
        </span>
        <small v-if="selectionPleine">Maximum de {{ MAX_COMPARAISON }} produits atteint</small>
        <small v-else>Sélectionnez {{ MAX_COMPARAISON }} produits pour comparer</small>
      </div>

      <div class="barre-actions">
        <router-link
          v-if="selectionPleine"
          :to="{ name: 'comparer', query: { codes: selection.join(',') } }"
          class="comparer"
        >
          Comparer côte à côte →
        </router-link>
        <span v-else class="comparer desactive" aria-disabled="true">Comparer côte à côte →</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recherche.avec-barre {
  padding-bottom: 90px;
}

/* ---------- Filtres ---------- */
.bouton-filtres {
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 11px 16px;
  border: 1px solid var(--bordure-forte);
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
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

@media (max-width: 991px) {
  .bouton-filtres { display: inline-flex; }
  .colonne-filtres { display: none; }
  .colonne-filtres.ouvert { display: block; }
}

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
  align-items: center;
  justify-content: space-between;
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
  color: var(--texte-doux);
  font-size: 15px;
}

.filtres h3.sous-filtre {
  margin-top: 18px;
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
  border-color: var(--brun);
  background: var(--brun);
  color: white;
}

.nutri:disabled,
.chips button:disabled {
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
}

.chips button.active {
  border-color: var(--brun);
  background: var(--brun);
  color: white;
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

/* ---------- En-tête des résultats ---------- */
.resultats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.resultats-header h2 {
  margin: 0;
  font-size: 26px;
  overflow-wrap: anywhere;
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

/* ---------- Liste des produits ---------- */
.liste {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--bordure);
  border-radius: 24px;
  background: white;
  list-style: none;
}

.ligne {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--bordure);
}

.ligne:last-child { border-bottom: 0; }
.ligne:hover { background: #fffaf6; }

.ligne.cochee {
  background: var(--creme);
  box-shadow: inset 4px 0 0 var(--orange);
}

.case {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  accent-color: var(--brun);
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

.vignette.sans {
  border-style: dashed;
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
  font-size: 11px;
  text-transform: uppercase;
}

.infos h3 {
  margin: 0 0 2px;
  font-size: 20px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.details {
  margin: 0;
  color: var(--texte-doux);
  font-size: 14px;
}

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

/* ---------- Nutri-Score, NOVA, bouton Voir ---------- */
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

.score { color: white; }
.score.nutri-A { background: var(--nutri-A); }
.score.nutri-B { background: var(--nutri-B); }
.score.nutri-C { background: var(--nutri-C); }
.score.nutri-D { background: var(--nutri-D); }
.score.nutri-E { background: var(--nutri-E); }

.score.nutri-inconnu {
  background: #e8ddd3;
  color: var(--texte-doux);
}

.nova {
  border: 1px solid var(--bordure-forte);
  background: white;
  color: var(--brun);
}

.voir {
  padding: 11px 18px;
  border: 1px solid var(--bordure-forte);
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font-weight: bold;
  text-decoration: none;
}

.voir:hover { background: var(--creme); }

/* --Messages (vide, erreur, chargement)--- */
.vide {
  padding: 30px;
  border: 1px dashed var(--bordure-forte);
  border-radius: 18px;
  background: var(--creme-clair);
  color: var(--texte-doux);
}

.vide p { margin: 0; }
.vide strong { color: var(--brun); }
.vide .conseil { margin-top: 8px; line-height: 1.5; }

.btn-secondaire {
  margin-top: 16px;
  padding: 11px 18px;
  border: 1px solid var(--bordure-forte);
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.btn-secondaire:hover { background: var(--creme); }

/* --- Barre de comparaison-- */
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

/* ---------- Accessibilité ---------- */
button:focus-visible,
select:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 3px solid var(--brun-clair);
  outline-offset: 2px;
}

.barre-comparaison :focus-visible {
  outline-color: white;
}

/* ---------- Mobile ---------- */
@media (max-width: 780px) {
  .resultats-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .resultats-header h2 { font-size: 22px; }

  .ligne { flex-wrap: wrap; }
  .infos { flex-basis: calc(100% - 180px); }

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

  .barre-actions { justify-content: space-between; }
}
</style>