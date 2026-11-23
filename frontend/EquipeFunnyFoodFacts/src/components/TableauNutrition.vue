<template>
  <table class="tableau-nutrition">
    <tbody>
      <tr v-for="attribut in attributs" :key="attribut.cle">
        <th>{{ attribut.label }}</th>
        <td>{{ valeur(produit[attribut.cle], attribut.unite) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  produit: { type: Object, required: true },
})

const attributs = [
  { cle: 'calories', label: 'Calories', unite: 'kcal' },
  { cle: 'proteines', label: 'Protéines', unite: 'g' },
  { cle: 'lipides', label: 'Lipides', unite: 'g' },
  { cle: 'glucides', label: 'Glucides', unite: 'g' },
]

function valeur(v, unite) {
  return v === null || v === undefined ? 'Non disponible' : `${v} ${unite}`
}
</script>

<style scoped>
.tableau-nutrition {
  width: 100%;
  border-collapse: collapse;
}
.tableau-nutrition th,
.tableau-nutrition td {
  padding: 8px 0;
  border-bottom: 1px solid #f3e6da;
  text-align: left;
  font-size: 14px;
}
.tableau-nutrition th {
  color: #67594f;
  font-weight: normal;
}
.tableau-nutrition td {
  color: #532509;
  font-weight: bold;
  text-align: right;
}
</style>