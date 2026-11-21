<script setup>
import { computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useComparateurStore } from '../stores/comparateur'
import { garderDifferences, lignesInformations, lignesNutrition } from '../utils/comparaison'

const props = defineProps({ produits: { type: Array, required: true } })
defineEmits(['retirer'])

const { seulementDifferences } = storeToRefs(useComparateurStore())
const imagesCassees = reactive({})

const DESCRIPTIONS_NUTRI = {
  A: 'meilleure qualité nutritionnelle',
  B: 'bonne qualité nutritionnelle',
  C: 'qualité nutritionnelle intermédiaire',
  D: 'qualité nutritionnelle plus faible',
  E: 'qualité nutritionnelle plus faible',
}

const tableaux = computed(() => {
  const liste = [
    { titre: 'Informations générales', lignes: lignesInformations(props.produits) },
    {
      titre: 'Valeurs nutritionnelles',
      lignes: lignesNutrition(props.produits),
      note: 'Comparaison pour 100 g, selon les données disponibles. Une valeur plus faible ou plus élevée '
        + 'n’est pas automatiquement meilleure : cela dépend du nutriment, du produit et de vos besoins. '
        + 'Les valeurs absentes ne sont pas estimées.',
    },
  ]
  return liste.map((t) => ({
    ...t,
    lignes: seulementDifferences.value ? garderDifferences(t.lignes) : t.lignes,
  }))
})
</script>

<template>
  <div>
    <!-- Cartes produits -->
    <section class="produits" aria-label="Produits comparés">
      <article v-for="produit in produits" :key="produit.id" class="carte-produit">
        <div class="image-produit">
          <img
            v-if="produit.image && !imagesCassees[produit.id]"
            :src="produit.image"
            :alt="produit.nom"
            @error="imagesCassees[produit.id] = true"
          />
          <span v-else class="image-absente">Image non disponible</span>
        </div>

        <p v-if="produit.marque" class="marque">{{ produit.marque }}</p>
        <h2>{{ produit.nom }}</h2>
        <p v-if="produit.quantite" class="quantite">{{ produit.quantite }}</p>

        <div class="badges">
          <span
            v-if="produit.nutriScore"
            :class="['badge-nutri', `nutri-${produit.nutriScore}`]"
            :title="`Nutri-Score ${produit.nutriScore} : ${DESCRIPTIONS_NUTRI[produit.nutriScore]}`"
          >
            Nutri-Score {{ produit.nutriScore }}
          </span>
          <span v-else class="badge-neutre">Nutri-Score non renseigné</span>

          <span v-if="produit.nova" class="badge-nova">NOVA {{ produit.nova }}</span>
          <span v-else class="badge-neutre">NOVA non renseigné</span>
        </div>

        <router-link class="lien-fiche" :to="`/produit/${produit.id}`">Voir la fiche du produit →</router-link>

        <button class="retirer" type="button" @click="$emit('retirer', produit.id)">
          Retirer de la comparaison
        </button>
      </article>
    </section>

    <!-- Tableaux : informations et nutriments -->
    <section v-for="tableau in tableaux" :key="tableau.titre" class="bloc-comparaison">
      <h2>{{ tableau.titre }}</h2>

      <p v-if="!tableau.lignes.length" class="vide-tableau">Aucune donnée à afficher.</p>

      <div v-else class="tableau-defilant">
        <table>
          <thead>
            <tr>
              <th scope="col">Caractéristique</th>
              <th v-for="produit in produits" :key="produit.id" scope="col">{{ produit.nom }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ligne in tableau.lignes" :key="ligne.nom">
              <th scope="row">
                {{ ligne.nom }}
                <small v-if="ligne.indication" class="indication">{{ ligne.indication }}</small>
              </th>
              <td
                v-for="(cellule, i) in ligne.cellules"
                :key="produits[i].id"
                :class="{ extremum: cellule.extremum }"
              >
                <template v-if="cellule.texte">
                  {{ cellule.texte }}
                  <span v-if="cellule.extremum" class="repere">Valeur extrême</span>
                </template>
                <span v-else class="non-renseigne">Non renseigné</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="tableau.note" class="note">{{ tableau.note }}</p>
    </section>

    <!-- Allergènes -->
    <section class="bloc-comparaison">
      <h2>Allergènes</h2>
      <div class="cartes-infos">
        <article v-for="produit in produits" :key="produit.id" class="carte-info">
          <h3>{{ produit.nom }}</h3>
          <p v-if="produit.allergenes === null" class="non-renseigne">
            Information sur les allergènes non renseignée.
          </p>
          <p v-else-if="produit.allergenes.length" class="liste-allergenes">
            {{ produit.allergenes.join(', ') }}
          </p>
          <p v-else class="non-renseigne">Aucun allergène indiqué dans les données reçues.</p>
        </article>
      </div>
      <p class="note">
        Une information absente ne signifie pas que le produit est sans allergène.
        Vérifiez toujours l’emballage, particulièrement en cas d’allergie.
      </p>
    </section>

    <!-- Ingrédients et additifs -->
    <section class="bloc-comparaison">
      <h2>Ingrédients et additifs</h2>
      <div class="cartes-infos">
        <article v-for="produit in produits" :key="produit.id" class="carte-info">
          <h3>{{ produit.nom }}</h3>

          <h4>Ingrédients</h4>
          <p>{{ produit.ingredients || 'Liste des ingrédients non renseignée.' }}</p>

          <h4>Additifs déclarés</h4>
          <p v-if="produit.additifs.length">{{ produit.additifs.join(', ') }}</p>
          <p v-else class="non-renseigne">Aucun additif indiqué dans les données reçues.</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* --Cartes produits-- */
.produits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.carte-produit {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px;
  border: 1px solid var(--bordure);
  border-radius: 24px;
  background: white;
}

.image-produit {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  height: 180px;
  margin-bottom: 16px;
  border: 1px solid var(--bordure);
  border-radius: 14px;
  background: white;
}

.image-produit img {
  width: 100%;
  height: 100%;
  padding: 10px;
  object-fit: contain;
}

.image-absente {
  color: var(--texte-doux);
  font-size: 13px;
}

.marque {
  margin: 0 0 2px;
  color: var(--texte-doux);
  font-size: 11px;
  text-transform: uppercase;
}

.carte-produit h2 {
  margin: 0 0 4px;
  font-size: 20px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.quantite {
  margin: 0;
  color: var(--texte-doux);
  font-size: 14px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.badge-nutri,
.badge-nova,
.badge-neutre {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: bold;
}

.badge-nutri { color: white; }
.badge-nutri.nutri-A { background: var(--nutri-A); }
.badge-nutri.nutri-B { background: var(--nutri-B); }
.badge-nutri.nutri-C { background: var(--nutri-C); }
.badge-nutri.nutri-D { background: var(--nutri-D); }
.badge-nutri.nutri-E { background: var(--nutri-E); }

.badge-nova {
  border: 1px solid var(--bordure-forte);
  background: white;
  color: var(--brun);
}

.badge-neutre {
  background: #e8ddd3;
  color: var(--texte-doux);
}

.lien-fiche {
  margin-bottom: 14px;
  color: var(--brun-clair);
  font-weight: bold;
}

.retirer {
  margin-top: auto;
  padding: 9px 14px;
  border: 1px solid var(--bordure-forte);
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.retirer:hover { background: var(--creme); }

/* ---------- Blocs de comparaison ---------- */
.bloc-comparaison {
  margin-top: 32px;
}

.bloc-comparaison h2 {
  margin: 0 0 14px;
  font-size: 24px;
}

.vide-tableau,
.non-renseigne {
  color: var(--texte-doux);
  font-style: italic;
}

.tableau-defilant {
  overflow-x: auto;
  border: 1px solid var(--bordure);
  border-radius: 18px;
  background: white;
}

table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 18px;
  border-bottom: 1px solid var(--bordure);
  text-align: left;
  vertical-align: top;
}

tbody tr:last-child th,
tbody tr:last-child td { border-bottom: 0; }

thead th {
  background: var(--creme);
  color: var(--brun);
}

tbody th {
  width: 28%;
  color: var(--brun);
}

.indication {
  display: block;
  margin-top: 2px;
  color: var(--texte-doux);
  font-size: 12px;
  font-weight: normal;
}

td.extremum {
  background: var(--creme);
  font-weight: bold;
  box-shadow: inset 4px 0 0 var(--orange);
}

.repere {
  display: block;
  margin-top: 2px;
  color: var(--brun-clair);
  font-size: 11px;
  font-weight: normal;
}

.note {
  margin: 12px 0 0;
  color: var(--texte-doux);
  font-size: 14px;
  line-height: 1.5;
}

/* ---------- Allergènes, ingrédients, additifs ---------- */
.cartes-infos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.carte-info {
  padding: 20px;
  border: 1px solid var(--bordure);
  border-radius: 18px;
  background: white;
}

.carte-info h3 {
  margin: 0 0 10px;
  font-size: 18px;
  overflow-wrap: anywhere;
}

.carte-info h4 {
  margin: 14px 0 4px;
  color: var(--texte-doux);
  font-size: 14px;
}

.carte-info p {
  margin: 0;
  line-height: 1.5;
}

.liste-allergenes {
  color: var(--brun);
  font-weight: bold;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--brun-clair);
  outline-offset: 2px;
}
</style>