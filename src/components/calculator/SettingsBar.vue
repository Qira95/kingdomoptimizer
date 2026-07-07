<template>
  <div class="settingsBar">
    <label>
      Game speed
      <select v-model.number="servers.activeServer.speed">
        <option v-for="s in [1, 2, 3, 5, 10]" :value="s" :key="s">{{ s }}x</option>
      </select>
    </label>
    <label>
      Main Building level
      <select v-model.number="settings.calc.mainBuilding">
        <option v-for="n in 21" :value="n - 1" :key="n">{{ n - 1 }}</option>
      </select>
    </label>
    <label>
      Fealty level
      <select v-model.number="settings.calc.fealty">
        <option v-for="n in 21" :value="n - 1" :key="n">{{ n - 1 }}</option>
      </select>
    </label>
    <label>
      Prestige level
      <select v-model.number="settings.calc.prestige">
        <option v-for="n in 14" :value="n - 1" :key="n">{{ n - 1 }}</option>
      </select>
    </label>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../../stores/settings';
import { useServersStore } from '../../stores/servers';

const settings = useSettingsStore();
const servers = useServersStore();
</script>
