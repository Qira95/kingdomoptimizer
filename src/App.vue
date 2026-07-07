<template>
  <div id="app">
    <header class="appHeader">
      <div class="brand">
        <h1>KingdomOptimizer</h1>
        <span class="tagline">Travian Kingdoms build planner</span>
      </div>
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
      <span class="spacer"></span>
      <button
        type="button"
        class="themeToggle"
        :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        aria-label="Toggle color theme"
        @click="toggleTheme">
        {{ theme === 'dark' ? '☀️' : '🌙' }}
      </button>
    </header>
    <ServerBar />
    <OptimizerView v-if="settings.view === 'optimizer'" />
    <CalculatorView v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSettingsStore } from './stores/settings';
import ServerBar from './components/ServerBar.vue';
import OptimizerView from './components/optimizer/OptimizerView.vue';
import CalculatorView from './components/calculator/CalculatorView.vue';

const settings = useSettingsStore();

// deep-link support: /#optimizer or /#calculator selects the view on load
const hashView = window.location.hash.slice(1);
if (hashView === 'optimizer' || hashView === 'calculator') {
  settings.view = hashView;
}

// Theme toggle: overrides the OS preference and persists in localStorage.
const THEME_KEY = 'kingdomoptimizer:theme';

function currentTheme() {
  const saved = document.documentElement.getAttribute('data-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const theme = ref(currentTheme());

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme.value);
  try {
    localStorage.setItem(THEME_KEY, theme.value);
  } catch (e) {
    // ignore storage failures (private mode, etc.)
  }
}
</script>
