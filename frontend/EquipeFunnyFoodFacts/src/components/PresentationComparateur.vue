<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <aside class="presentation-comparateur" aria-labelledby="titre-comparateur">
    <div class="illustration" aria-hidden="true">
      <div class="boite boite-orange">
        <span>Céréales</span>
        <i class="bi bi-flower2"></i>
      </div>

      <i class="bi bi-arrow-left-right fleches"></i>

      <div class="boite boite-verte">
        <span>Céréales</span>
        <i class="bi bi-flower2"></i>
      </div>
    </div>

    <h2 id="titre-comparateur">Deux produits, lequel choisir ?</h2>

    <p>
      Comparez leurs informations nutritionnelles pour faire votre choix.
    </p>

    <RouterLink to="/resultat" class="lien-comparateur">
      Découvrir le comparateur
      <i class="bi bi-arrow-right" aria-hidden="true"></i>
    </RouterLink>
  </aside>
</template>

<style scoped>
.presentation-comparateur {
  max-width: 440px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #edd9cc;
  border-radius: 24px;
  background: white;
  box-shadow: 0 8px 24px #53250912;
  text-align: center;
}

.illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0 28px;
}

.boite {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100px;
  height: 140px;
  border-top: 16px solid;
  border-radius: 6px;
  background: #fff0e2;
  color: #532509;
  font-weight: bold;
  box-shadow: 4px 6px 0 #53250915;
}

.boite-orange {
  border-color: #f58220;
  transform: rotate(-8deg);
}

.boite-verte {
  border-color: #668b39;
  transform: rotate(8deg);
}

.boite i {
  color: #b67b22;
  font-size: 42px;
}

.fleches {
  color: #713613;
  font-size: 28px;
}

h2 {
  margin-bottom: 12px;
  color: #532509;
  font-size: 25px;
}

p {
  margin-bottom: 20px;
  color: #67594f;
  line-height: 1.6;
}

.lien-comparateur {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 10px;
  background: #532509;
  color: white;
  font-weight: bold;
  text-decoration: none;
}

.lien-comparateur:hover {
  background: #713613;
}

.lien-comparateur:focus-visible {
  outline: 3px solid #f58220;
  outline-offset: 4px;
}

@media (max-width: 420px) {
  .presentation-comparateur {
    padding: 20px;
  }

  .illustration {
    gap: 16px;
  }

  .boite {
    width: 80px;
    height: 120px;
  }
}
</style>