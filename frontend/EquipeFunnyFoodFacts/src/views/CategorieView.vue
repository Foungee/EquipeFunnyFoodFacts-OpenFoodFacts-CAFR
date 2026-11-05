<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { API_URL } from '../config'

const route = useRoute()
const produits = ref([])
const chargement = ref(false)
const erreur = ref('')

async function chargerProduits() {
  chargement.value = true
  erreur.value = ''
  produits.value = []

  const code = String(route.params.code)

  try {
    const parametres = new URLSearchParams({ categorie: code })

    const reponse = await fetch(
      `${API_URL.replace(/\/$/, '')}/produits/categorie?${parametres}`,
      { signal: AbortSignal.timeout(20000) },
    )

    if (!reponse.ok) {
      throw new Error('Chargement impossible')
    }

    const donnees = await reponse.json()

    if (!Array.isArray(donnees)) {
      throw new Error('Réponse du serveur invalide')
    }

    // Ignorer la réponse si on a changé de catégorie entre-temps.
    if (code !== String(route.params.code)) return

    produits.value = donnees.filter((produit) => produit && produit.id != null)
  } catch (e) {
    if (code !== String(route.params.code)) return

    console.error(e)
    erreur.value = 'Impossible de charger les produits. Réessayez.'
  } finally {
    if (code === String(route.params.code)) {
      chargement.value = false
    }
  }
}

// Charger au démarrage et si la catégorie dans l'adresse change.
watch(() => route.params.code, chargerProduits, { immediate: true })
</script>

<template>
  <main class="container py-5">
    <RouterLink to="/">Retour à l’accueil</RouterLink>

    <h1>{{ route.query.nom || 'Produits de la catégorie' }}</h1>

    <p v-if="chargement" role="status">Chargement des produits…</p>

    <div v-else-if="erreur" role="alert">
      <p>{{ erreur }}</p>
      <button type="button" @click="chargerProduits">Réessayer</button>
    </div>

    <p v-else-if="!produits.length">Aucun produit dans cette catégorie.</p>

    <div v-else>
      <p>{{ produits.length }} produits affichés</p>

      <div class="row g-4">
        <article
          v-for="produit in produits"
          :key="produit.id"
          class="col-12 col-sm-6 col-lg-4"
        >
          <div class="carte-produit">
            <img
              v-if="produit.image"
              :src="produit.image"
              :alt="produit.nom || 'Produit'"
              loading="lazy"
              @error="produit.image = ''"
            />

            <div v-else class="image-absente">Image non disponible</div>

            <p v-if="produit.marque">{{ produit.marque }}</p>
            <h2>{{ produit.nom || 'Nom non renseigné' }}</h2>

            <RouterLink :to="`/produit/${produit.id}`">
              Voir la fiche 
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
h1 {
  margin: 24px 0;
  color: #532509;
}

.carte-produit {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  border: 1px solid #dabca9;
  border-radius: 12px;
  background: white;
}

.carte-produit img,
.image-absente {
  width: 100%;
  height: 180px;
  margin-bottom: 16px;
  padding: 12px;
  background: #fff0e2;
  object-fit: contain;
}

.image-absente {
  display: flex;
  align-items: center;
  justify-content: center;
}

.carte-produit h2 {
  font-size: 20px;
  overflow-wrap: anywhere;
}

.carte-produit a {
  margin-top: auto;
}

a {
  color: #713613;
  font-weight: bold;
}

a:focus-visible,
button:focus-visible {
  outline: 3px solid #713613;
  outline-offset: 3px;
}
</style>