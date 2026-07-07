<template>
  <label class="speedSelector">
    Server speed
    <select v-model.number="servers.activeServer.speed">
      <option v-for="s in speeds" :value="s" :key="s">{{ s }}x</option>
    </select>
  </label>
</template>

<script setup>
import { useServersStore } from '../../stores/servers';

const servers = useServersStore();
const speeds = [1, 2, 3, 5, 10];
</script>
