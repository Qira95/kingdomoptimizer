<template>
  <div class="tribeSelector">
    <template v-for="t in tribes" :key="t">
      <input type="radio" :id="t" :value="t" v-model="settings.tribe">
      <label :for="t">{{ t.charAt(0).toUpperCase() + t.slice(1) }}</label>
    </template>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../../stores/settings';

const settings = useSettingsStore();
const tribes = ['roman', 'teuton', 'gaul'];
</script>
