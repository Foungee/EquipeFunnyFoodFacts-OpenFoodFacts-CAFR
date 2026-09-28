<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="site-header">
    <div class="header-content">
      <RouterLink to="/" class="brand" aria-label="Open Food Facts — accueil">
        <img src="/off-logo-horizontal-light.svg" alt="Open Food Facts" class="brand-logo" />
      </RouterLink>

      <nav aria-label="Navigation principale">
        <RouterLink to="/">Accueil</RouterLink>
        <RouterLink to="/about">À propos</RouterLink>
      </nav>

      <span class="region">🇨🇦 Québec, Canada · FR</span>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.site-header {
  background: #f3eae5;
  border-bottom: 1px solid #e5d5cb;
}

.header-content {
  max-width: 1160px;
  margin: 0 auto;
  padding: 17px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}


.brand {
  display: inline-flex;
  align-items: center;
}

.brand-logo {
  display: block;
  width: 220px;
  max-width: 100%;
  height: auto;
}

.brand strong {
  padding: 4px 6px;
  border-radius: 4px;
  background: #f58220;
  color: white;
}

nav {
  display: flex;
  gap: 24px;
}

nav a:hover {
  text-decoration: underline;
}

.region {
  padding: 10px 15px;
  border-radius: 30px;
  background: #fff0e2;
  color: #713613;
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
}

@media (max-width: 700px) {
  .header-content {
    flex-wrap: wrap;
  }


  .region {
    font-size: 12px;
  }
}
</style>