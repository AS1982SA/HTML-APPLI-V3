<template>
  <main class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-4xl space-y-8 mx-auto mt-8">
    <h1 class="text-3xl font-bold text-center">Calculateur Métabolisme & Répartition des Macros</h1>

    <!-- Formulaire principal -->
    <form class="grid gap-4 sm:grid-cols-3" @input="calcAll" @change="calcAll" @submit.prevent>
      <!-- Sexe -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">Sexe</label>
        <select v-model="sex" class="p-2 rounded-lg border bg-white">
          <option value="male">Homme</option>
          <option value="female">Femme</option>
        </select>
      </div>
      <!-- Poids -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">Poids (kg)</label>
        <input v-model.number="weight" type="number" min="1" class="p-2 rounded-lg border" />
      </div>
      <!-- Taille -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">Taille (cm)</label>
        <input v-model.number="height" type="number" min="50" class="p-2 rounded-lg border" />
      </div>
      <!-- Âge -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">Âge (années)</label>
        <input v-model.number="age" type="number" min="1" class="p-2 rounded-lg border" />
      </div>
      <!-- PAL -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">NAP / PAL</label>
        <select v-model.number="pal" class="p-2 rounded-lg border bg-white">
          <option :value="1.2">Sédentaire (1.0 – 1.39) → 1.20</option>
          <option :value="1.5">Peu actif (1.4 – 1.59) → 1.50</option>
          <option :value="1.75">Actif (1.6 – 1.89) → 1.75</option>
          <option :value="2.2">Très actif (1.9 – 2.5) → 2.20</option>
        </select>
      </div>
      <!-- Objectif -->
      <div class="flex flex-col">
        <label class="font-semibold mb-1">Objectif</label>
        <select v-model="goal" class="p-2 rounded-lg border bg-white">
          <option value="maintenance">Maintien du poids</option>
          <option value="lean_bulk">Prise de masse sèche</option>
          <option value="bulk">Prise de masse classique</option>
          <option value="cut">Perte de masse grasse</option>
          <option value="endurance">Performance endurance</option>
          <option value="strength">Force / puissance</option>
        </select>
      </div>
    </form>

    <!-- Résultats énergétiques -->
    <section class="bg-gray-100 rounded-xl p-6 shadow-inner space-y-2">
      <h2 class="text-2xl font-semibold mb-2">Énergie</h2>
      <p class="text-lg">⦿ <strong>RMR</strong> : <span class="font-mono">{{ Math.round(rmr) }}</span> kcal/jour</p>
      <p class="text-lg">⦿ <strong>TDEE</strong> : <span class="font-mono">{{ Math.round(tdee) }}</span> kcal/jour</p>
      <p class="text-lg">⦿ <strong>Apport cible</strong> : <span class="font-mono">{{ Math.round(targetKcal) }}</span> kcal/jour (<span>{{ Math.round(delta * 100) }}</span>%)</p>
    </section>

    <!-- Résultats macros -->
    <section class="bg-gray-100 rounded-xl p-6 shadow-inner space-y-4">
      <h2 class="text-2xl font-semibold mb-4">Répartition des macronutriments</h2>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <p class="text-5xl font-mono">{{ Math.round(protG) }}</p>
          <p class="font-semibold">g Protéines</p>
        </div>
        <div>
          <p class="text-5xl font-mono">{{ Math.round(carbG) }}</p>
          <p class="font-semibold">g Glucides</p>
        </div>
        <div>
          <p class="text-5xl font-mono">{{ Math.round(fatG) }}</p>
          <p class="font-semibold">g Lipides</p>
        </div>
      </div>
    </section>

    <!-- Explications brèves -->
    <details class="bg-white rounded-lg shadow p-4">
      <summary class="cursor-pointer font-semibold">Méthodologie & formules</summary>
      <p class="mt-2 text-sm">RMR : Pavlidou 2023. TDEE = RMR × PAL. Surplus/déficit selon l'objectif : +10 % bulk, +5 % lean bulk, –20 % cut, 0 % maintien, +0 % endurance/strength (ajuster).</p>
      <p class="text-sm">Protein/Lipid coefficients basées sur ISSN 2017–22 & ACSM 2016.</p>
    </details>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';

const sex = ref('male');
const weight = ref(70);
const height = ref(175);
const age = ref(30);
const pal = ref(1.2);
const goal = ref('maintenance');

const GOAL_PARAMS = {
  maintenance: { delta: 0, prot: 1.4, fat: 0.9 },
  lean_bulk:   { delta: 0.05, prot: 2.0, fat: 0.9 },
  bulk:        { delta: 0.10, prot: 1.8, fat: 0.8 },
  cut:         { delta: -0.20, prot: 2.4, fat: 0.9 },
  endurance:   { delta: 0, prot: 1.4, fat: 0.8 },
  strength:    { delta: 0, prot: 1.8, fat: 0.9 }
};

const rmr = computed(() => {
  const W = weight.value;
  const Hm = height.value / 100;
  const A = age.value;
  return sex.value === 'male'
    ? 9.65 * W + 573 * Hm - 5.08 * A + 260
    : 7.38 * W + 607 * Hm - 2.31 * A + 43;
});

const tdee = computed(() => rmr.value * pal.value);
const delta = computed(() => GOAL_PARAMS[goal.value].delta);
const targetKcal = computed(() => tdee.value * (1 + delta.value));
const protCoef = computed(() => GOAL_PARAMS[goal.value].prot);
const fatCoef = computed(() => GOAL_PARAMS[goal.value].fat);
const protG = computed(() => protCoef.value * weight.value);
const protKcal = computed(() => protG.value * 4);
const fatG = computed(() => fatCoef.value * weight.value);
const fatKcal = computed(() => fatG.value * 9);
const carbKcal = computed(() => Math.max(targetKcal.value - (protKcal.value + fatKcal.value), 0));
const carbG = computed(() => carbKcal.value / 4);

function calcAll() {
  // La logique est réactive, mais cette fonction est utile pour @input/@change
}
</script>

<style scoped>
body {
  background: #f8fafc;
}
</style>
