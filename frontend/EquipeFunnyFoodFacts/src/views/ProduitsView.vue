<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { API_URL } from '../config'

const produits = ref([])
const recherche = ref('')
const chargement = ref(false)
const erreur = ref('')

function normaliserProduits(liste) {
  return liste
    .filter((produit) => produit && produit.id != null)
    .map((produit) => ({
      id: String(produit.id),
      nom:
        typeof produit.nom === 'string' && produit.nom.trim()
          ? produit.nom
          : 'Nom non renseigné',
      marque: typeof produit.marque === 'string' ? produit.marque : '',
      image: typeof produit.image === 'string' ? produit.image : '',
      details: typeof produit.details === 'string' ? produit.details : '',
      categorie: typeof produit.categorie === 'string' ? produit.categorie : '',
      nutriScore: String(produit.nutriScore ?? produit.nutriscore ?? '').toUpperCase(),
      nova: produit.nova ?? null,
    }))
}

async function chargerProduits() {
  chargement.value = true
  erreur.value = ''

  const controleur = new AbortController()
  const delai = setTimeout(() => controleur.abort(), 20000)

  try {
    // Aucun paramètre limit : la page demande tous les produits disponibles.
    const reponse = await fetch(`${API_URL.replace(/\/$/, '')}/produits`, {
      signal: controleur.signal,
    })

    if (!reponse.ok) {
      throw new Error(`Erreur HTTP ${reponse.status}`)
    }

    const donnees = await reponse.json()

    // L'API doit renvoyer un tableau contenant les produits.
    if (!Array.isArray(donnees)) {
      throw new Error('Le serveur ne renvoie pas une liste de produits.')
    }

    produits.value = normaliserProduits(donnees)
  } catch (e) {
    console.error('Chargement des produits :', e)
    erreur.value = e.name === 'AbortError'
      ? 'Le serveur met trop de temps à répondre. Réessayez.'
      : 'Impossible de charger les produits. Vérifiez la connexion au serveur, puis réessayez.'
  } finally {
    clearTimeout(delai)
    chargement.value = false
  }
}

const produitsFiltres = computed(() => {
  const terme = recherche.value.trim().toLocaleLowerCase('fr')
  if (!terme) return produits.value

  return produits.value.filter((produit) =>
    [produit.nom, produit.marque, produit.categorie, produit.details]
      .some((valeur) => valeur.toLocaleLowerCase('fr').includes(terme)),
  )
})

onMounted(chargerProduits)
</script>

<template>
  <main class="page-produits">
    <section class="hero">
      <div class="container">
        <h1>Tous les produits</h1>
        <p>Parcourez les produits alimentaires disponibles dans notre base de données.</p>
        <label for="recherche-produits" class="visually-hidden">Rechercher un produit</label>
        <input
          id="recherche-produits"
          v-model="recherche"
          type="search"
          placeholder="Rechercher par nom, marque ou catégorie…"
          autocomplete="off"
        />
      </div>
    </section>

    <section class="container py-5" aria-labelledby="titre-liste-produits">
      <div class="entete-liste">
        <h2 id="titre-liste-produits">
          {{ produitsFiltres.length }}
          {{ produitsFiltres.length > 1 ? 'produits' : 'produit' }}
          {{ recherche.trim() ? 'trouvé(s)' : 'disponible(s)' }}
        </h2>
        <button type="button" class="bouton-secondaire" :disabled="chargement" @click="chargerProduits">
          {{ chargement ? 'Chargement…' : 'Actualiser' }}
        </button>
      </div>

      <p v-if="chargement" role="status">Chargement de tous les produits…</p>

      <div v-else-if="erreur" class="message" role="alert">
        <p>{{ erreur }}</p>
        <button type="button" class="bouton-principal" @click="chargerProduits">Réessayer</button>
      </div>

      <p v-else-if="!produits.length" class="message">
        Aucun produit n'est disponible pour le moment.
      </p>

      <p v-else-if="!produitsFiltres.length" class="message">
        Aucun produit ne correspond à « {{ recherche }} ».
      </p>

      <div v-else class="grille-produits">
        <article v-for="produit in produitsFiltres" :key="produit.id" class="carte-produit">
          <img
            v-if="produit.image"
            :src="produit.image"
            :alt="produit.nom"
            class="image-produit"
            loading="lazy"
            @error="produit.image = ''"
          />
          <div v-else class="image-produit image-absente">Image non disponible</div>

          <div class="contenu-carte">
            <p v-if="produit.marque" class="marque">{{ produit.marque }}</p>
            <h3>{{ produit.nom }}</h3>
            <p v-if="produit.categorie" class="detail">Catégorie : {{ produit.categorie }}</p>
            <p v-if="produit.details" class="detail">{{ produit.details }}</p>

            <div class="badges">
              <span v-if="'ABCDE'.includes(produit.nutriScore) && produit.nutriScore.length === 1" class="badge-nutri">
                Nutri-Score {{ produit.nutriScore }}
              </span>
              <span v-if="produit.nova != null && produit.nova !== ''" class="badge-nova">
                NOVA {{ produit.nova }}
              </span>
            </div>

            <RouterLink class="lien-fiche" :to="`/produit/${produit.id}`">
              Voir la fiche du produit →
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page-produits {
  --orange: #f58220;
  --brun: #532509;
  --brun-clair: #713613;
  --creme: #fff0e2;
  --bordure: #edd9cc;
  --texte-doux: #67594f;
  color: #29211d;
}

.hero {
  padding: 42px 0;
  background: linear-gradient(125deg, var(--creme), #fff9f5 72%);
}

.hero h1 {
  margin: 0 0 10px;
  font-size: clamp(32px, 4vw, 44px);
}

.hero p {
  margin-bottom: 20px;
  color: var(--texte-doux);
}

.hero input {
  width: 100%;
  max-width: 700px;
  padding: 14px 16px;
  border: 1px solid #e8c9b7;
  border-radius: 12px;
  background: white;
  font: inherit;
}

.entete-liste {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.entete-liste h2 {
  margin: 0;
  font-size: 24px;
}

.grille-produits {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 22px;
}

.carte-produit {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--bordure);
  border-radius: 20px;
  background: white;
  transition: box-shadow 0.15s, transform 0.15s;
}

.carte-produit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(83 37 9 / 9%);
}

.image-produit {
  display: flex;
  width: 100%;
  height: 190px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 14px;
  object-fit: contain;
  background: var(--creme);
}

.image-absente {
  color: var(--texte-doux);
  text-align: center;
  font-size: 14px;
}

.contenu-carte {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px;
}

.marque {
  margin: 0 0 5px;
  color: var(--texte-doux);
  font-size: 13px;
  text-transform: uppercase;
}

.contenu-carte h3 {
  margin: 0 0 10px;
  font-size: 19px;
  overflow-wrap: anywhere;
}

.detail {
  margin: 0 0 8px;
  color: var(--texte-doux);
  font-size: 14px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 8px 0 16px;
}

.badge-nutri,
.badge-nova {
  padding: 5px 8px;
  border: 1px solid var(--bordure);
  border-radius: 8px;
  color: var(--brun);
  font-size: 12px;
  font-weight: 700;
}

.lien-fiche {
  margin-top: auto;
  color: var(--brun-clair);
  font-weight: 700;
  text-decoration: none;
}

.lien-fiche:hover {
  text-decoration: underline;
}

.bouton-secondaire,
.bouton-principal {
  padding: 10px 16px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  color: var(--brun-clair);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.bouton-principal {
  border-color: var(--brun);
  background: var(--brun);
  color: white;
}

button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.message {
  padding: 24px;
  border: 1px dashed #dabca9;
  border-radius: 14px;
  background: #fff9f5;
  color: var(--texte-doux);
}

.message p {
  margin: 0 0 12px;
}

button:focus-visible,
input:focus-visible,
a:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 3px;
}
</style>
