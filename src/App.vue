<template>
  <div id="app">
    <header class="appHeader">
      <h1>Kingdomoptimizer</h1>
      <nav>
        <button
          type="button"
          :class="{ active: settings.view === 'optimizer' }"
          @click="settings.view = 'optimizer'">
          Build-order optimizer
        </button>
        <button
          type="button"
          :class="{ active: settings.view === 'calculator' }"
          @click="settings.view = 'calculator'">
          Building calculator
        </button>
      </nav>
    </header>
    <OptimizerView v-if="settings.view === 'optimizer'" />
    <CalculatorView v-else />
  </div>
</template>

<script setup>
import { useSettingsStore } from './stores/settings';
import OptimizerView from './components/optimizer/OptimizerView.vue';
import CalculatorView from './components/calculator/CalculatorView.vue';

const settings = useSettingsStore();

// deep-link support: /#optimizer or /#calculator selects the view on load
const hashView = window.location.hash.slice(1);
if (hashView === 'optimizer' || hashView === 'calculator') {
  settings.view = hashView;
}
</script>
