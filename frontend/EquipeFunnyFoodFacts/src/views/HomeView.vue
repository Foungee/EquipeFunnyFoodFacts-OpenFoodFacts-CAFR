<script setup>
import { ref } from 'vue'

 

const recherche = ref('')
const messageRecherche = ref('')

const produits = [
  {
    code: '6191509905058',
    nom: 'Huile d’olive Terra Delyssa',
    image: '/produits/huile-terra-delyssa.jpg',
    descriptionImage: 'Bouteille d’huile d’olive Terra Delyssa',
  },
  {
    code: '0064100271913',
    nom: 'Céréales All-Bran Buds',
    image: '/produits/cereales-all-bran.jpg',
    descriptionImage: 'Boîte de céréales All-Bran Buds',
  },
  {
    code: '0068400662600',
    nom: 'Mayonnaise Hellmann’s',
    image: '/produits/mayonnaise-hellmanns.jpg',
    descriptionImage: 'Pot de mayonnaise Hellmann’s',
  },
]

function soumettreRecherche() {
  if (!recherche.value.trim()) return
  messageRecherche.value = 'La page de résultats est en cours d’intégration.'
}
</script>

<template>
  <main>
    <section class="hero">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-12 col-lg-7">
            <h1>Comprenez mieux <span>ce que vous mangez.</span></h1>

            <form class="search" @submit.prevent="soumettreRecherche">
              <label for="produit" class="visually-hidden">
                Nom ou code-barres du produit
              </label>
              <input
                id="produit"
                v-model="recherche"
                type="search"
                placeholder="Nom du produit ou code-barres…"
                required
              />
              <button type="submit">Rechercher</button>
            </form>

            <p v-if="messageRecherche" class="search-status" role="status">
              {{ messageRecherche }}
            </p>
          </div>

          <div class="col-12 col-lg-5">
            <!-- <div class="illustration"> -->
              <!-- <div class="leaf-background" aria-hidden="true">
                <svg
                  class="maple-leaf"
                  viewBox="0 0 200 220"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 8 116 48 132 35 130 66 163 63 152 85 179 99
                       137 127 145 149 108 141 105 207 95 207 92 141
                       55 149 63 127 21 99 48 85 37 63 70 66 68 35 84 48Z"
                    fill="#d52b1e"
                  />
                </svg>
              </div> -->
              <!-- <h2>Des produits à découvrir, simplement.</h2>
              <p>
                Cherchez un aliment et accédez aux informations utiles en quelques clics.
              </p> -->
            <!-- </div> -->
          </div>
        </div>
      </div>
    </section>

    

    <section class="produits container py-5" aria-labelledby="titre-produits">
      <h2 id="titre-produits">Quelques produits à découvrir</h2>
     
      <div class="row g-4">
        <article
          v-for="produit in produits"
          :key="produit.code"
          class="col-12 col-md-4"
        >
          <div class="product-card">
            <img
              :src="produit.image"
              :alt="produit.descriptionImage"
              class="product-photo"
            />
            <h3>{{ produit.nom }}</h3>
            <a  :href="`/produit/${produit.code}`"> <i class="bi bi-eye-fill"></i> Voir la fiche  </a>
            
          </div>
        </article>
      </div>
    </section>
    <section class="contribution container" aria-labelledby="titre-contribution">
      <div>
        <h2 id="titre-contribution">Une base construite ensemble</h2>
        <p>
          Open Food Facts est un projet collaboratif animé par des bénévoles.
          Chacun peut aider à enrichir les informations sur les produits alimentaires.
        </p>
      </div>
      <a
        href="https://ca.openfoodfacts.org/contribute"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contribuer au projet 
      </a>
    </section>
  </main>
</template>

<style scoped>
.hero {
  padding: 42px 0;
  background: linear-gradient(125deg, #fff0e2, #fff9f5 72%);
}

h1 {
  margin: 16px 0;
  font-size: clamp(38px, 4vw, 56px);
  line-height: 1.1;
}

h1 span {
  color: #f58220;
}

.search {
  display: flex;
  max-width: 650px;
  margin-top: 18px;
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
  background: #532509;
  color: white;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.search-status {
  margin-top: 10px;
  color: #713613;
}

.illustration,
.product-card {
  border: 1px solid #edd9cc;
  border-radius: 24px;
  background: white;
}

.illustration {
  padding: 30px;
}

.leaf-background {
  padding: 14px;
  border-radius: 18px;
  background: #fff0e2;
}

.maple-leaf {
  display: block;
  width: 95px;
  height: 105px;
  margin: 0 auto;
}

.illustration h2 {
  margin: 20px 0 8px;
}

.illustration p,
.contribution p,
.section-note {
  color: #67594f;
  line-height: 1.6;
}

.contribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 28px;
  padding-bottom: 28px;
}

.contribution h2 {
  margin: 0 0 6px;
}

.contribution p {
  max-width: 650px;
  margin: 0;
}

.contribution > a {
  flex-shrink: 0;
  padding: 14px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  font-weight: bold;
}

.product-card {
  height: 100%;
  padding: 20px;
}

.product-photo {
  display: block;
  width: 100%;
  height: 190px;
  object-fit: contain;
  margin-bottom: 18px;
  padding: 12px;
  border-radius: 12px;
  background: #fff0e2;
}

.product-card h3 {
  min-height: 52px;
  font-size: 21px;
}

.product-card a,
.photo-credit a {
  color: #713613;
  font-weight: bold;
}

.photo-credit {
  margin-top: 20px;
  color: #67594f;
  font-size: 13px;
}

@media (max-width: 780px) {
  .hero {
    padding: 50px 0;
  }

  .contribution {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>