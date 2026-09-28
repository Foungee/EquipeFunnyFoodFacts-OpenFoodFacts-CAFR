<script setup>
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main>
    <section class="hero">
      <div class="hero-content">
        <div>
          <p class="eyebrow">Des choix plus éclairés</p>
          <h1>Comprenez mieux <span>ce que vous mangez.</span></h1>
          <p class="intro">
            Recherchez un produit alimentaire et découvrez ses informations
            essentielles grâce aux données ouvertes d’Open Food Facts.
          </p>

          <form class="search" @submit.prevent>
            <label for="produit" class="visually-hidden">Nom ou code-barres du produit</label>
            <input id="produit" type="search" placeholder="Nom du produit ou code-barres…" />
            <button type="submit">Rechercher</button>
          </form>
        </div>

        <div class="illustration" aria-label="Illustration évoquant le Canada">
          <span aria-hidden="true">🍁</span>
          <h2>Des produits à découvrir, simplement.</h2>
          <p>Cherchez un aliment et accédez aux informations utiles en quelques clics.</p>
        </div>
      </div>
    </section>

    <section class="contribution">
      <div>
        <h2>Une base construite ensemble</h2>
        <p>
          Open Food Facts est un projet collaboratif animé par des bénévoles.
          Chacun peut aider à enrichir les informations sur les produits alimentaires.
        </p>
      </div>
      <a href="https://ca.openfoodfacts.org/" target="_blank" rel="noopener noreferrer">
        Découvrir Open Food Facts ↗
      </a>
    </section>
  </main>
</template>

<style scoped>
.hero {
  padding: 80px 24px;
  background: linear-gradient(125deg, #fff0e2, #fff9f5 72%);
}

.hero-content,
.contribution {
  max-width: 1160px;
  margin: 0 auto;
}

.hero-content {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  align-items: center;
  gap: 60px;
}

.eyebrow {
  display: inline-block;
  padding: 9px 14px;
  border: 1px solid #f3c7a5;
  border-radius: 30px;
  background: white;
  color: #813d13;
  font-weight: bold;
}

h1 {
  margin: 20px 0;
  font-size: clamp(38px, 5vw, 66px);
  line-height: 1.1;
}

h1 span {
  color: #f58220;
}

.intro {
  max-width: 620px;
  color: #66584e;
  font-size: 19px;
  line-height: 1.6;
}

.search {
  display: flex;
  max-width: 650px;
  margin-top: 30px;
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

.illustration {
  padding: 30px;
  border: 1px solid #edd9cc;
  border-radius: 24px;
  background: white;
}

.illustration span {
  display: block;
  padding: 25px;
  border-radius: 18px;
  background: #fff0e2;
  text-align: center;
  font-size: 95px;
}

.illustration h2 {
  margin: 20px 0 8px;
}

.illustration p,
.contribution p {
  color: #67594f;
  line-height: 1.6;
}

.contribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 24px;
}

.contribution h2 {
  margin: 0 0 6px;
}

.contribution p {
  max-width: 650px;
  margin: 0;
}

.contribution a {
  flex-shrink: 0;
  padding: 14px 18px;
  border: 1px solid #dabca9;
  border-radius: 10px;
  background: white;
  font-weight: bold;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

@media (max-width: 780px) {
  .hero {
    padding: 50px 20px;
  }

  .hero-content {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .contribution {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>


