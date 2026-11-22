<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { API_URL } from '../config'
import { useRecommendStore } from '../stores/recommend'

const recommandation = useRecommendStore()
const produits = ref([])
const chargement = ref(false)
const erreur = ref('')

async function chargerProduits() {
  const categorie = recommandation.categoriePreferee

  if (!categorie) return

  chargement.value = true
  erreur.value = ''

  try {
    const parametres = new URLSearchParams({ categorie })

    const reponse = await fetch(
      `${API_URL.replace(/\/$/, '')}/produits/categorie?${parametres}`,
      { signal: AbortSignal.timeout(20000) },
    )

    if (!reponse.ok) {
      throw new Error('Chargement des recommandations impossible')
    }

    const donnees = await reponse.json()

    if (!Array.isArray(donnees)) {
      throw new Error('Réponse du serveur invalide')
    }

    produits.value = donnees
      .filter((produit) => produit && produit.id != null)
      .slice(0, 4)
  } catch {
    erreur.value = 'Les recommandations sont temporairement indisponibles.'
  } finally {
    chargement.value = false
  }
}

onMounted(chargerProduits)
</script>

<template>
  <section
    v-if="recommandation.categoriePreferee"
    class="recommandations container"
    aria-labelledby="titre-recommandations"
  >
    <h2 id="titre-recommandations">À découvrir pour vous</h2>
    <p>Des produits de votre catégorie la plus consultée.</p>

    <p v-if="chargement" role="status">
      Chargement des recommandations…
    </p>

    <div v-else-if="erreur" role="status">
      <p>{{ erreur }}</p>
      <button type="button" @click="chargerProduits">Réessayer</button>
    </div>

    <p v-else-if="!produits.length">
      Aucun produit disponible dans cette catégorie.
    </p>

    <div v-else class="row g-4">
      <article
        v-for="produit in produits"
        :key="produit.id"
        class="col-12 col-sm-6 col-lg-3"
      >
        <div class="carte-recommandation">
          <img
            v-if="produit.image"
            :src="produit.image"
            :alt="produit.nom || 'Produit'"
            loading="lazy"
            @error="produit.image = ''"
          />

          <div v-else class="image-absente">Image non disponible</div>

          <p v-if="produit.marque" class="marque">{{ produit.marque }}</p>
          <h3>{{ produit.nom || 'Nom non renseigné' }}</h3>

          <RouterLink :to="`/produit/${produit.id}`">
            Voir la fiche 
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.recommandations {
  padding-top: 40px;
  padding-bottom: 24px;
}

.carte-recommandation {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: white;
}

img,
.image-absente {
  width: 100%;
  height: 170px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff0e2;
  object-fit: contain;
}

.image-absente {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.marque {
  margin-bottom: 6px;
  color: #67594f;
  font-size: 13px;
}

h3 {
  margin-bottom: 16px;
  font-size: 19px;
  overflow-wrap: anywhere;
}

a {
  margin-top: auto;
  color: #713613;
  font-weight: bold;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid #713613;
  outline-offset: 3px;
}
</style>