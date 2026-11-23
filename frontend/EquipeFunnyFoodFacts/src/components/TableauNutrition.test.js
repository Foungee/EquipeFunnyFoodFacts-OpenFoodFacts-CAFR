import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TableauNutrition from './TableauNutrition.vue'

describe('TableauNutrition', () => {
  it('affiche les valeurs avec leur unité quand elles existent', () => {
    const wrapper = mount(TableauNutrition, {
      props: {
        produit: { calories: 250, proteines: 10, lipides: 5, glucides: 30 },
      },
    })
    expect(wrapper.text()).toContain('250 kcal')
    expect(wrapper.text()).toContain('10 g')
  })

  it('affiche "Non disponible" quand une valeur est manquante', () => {
    const wrapper = mount(TableauNutrition, {
      props: {
        produit: { calories: null, proteines: undefined, lipides: 5, glucides: 30 },
      },
    })
    expect(wrapper.text()).toContain('Non disponible')
    expect(wrapper.text()).toContain('5 g')
  })
})