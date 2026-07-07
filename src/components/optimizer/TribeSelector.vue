<template>
  <div class="tribeSelector">
    <template v-for="t in tribes" :key="t">
      <input type="radio" :id="t" :value="t" v-model="servers.activeServer.tribe">
      <label :for="t">{{ t.charAt(0).toUpperCase() + t.slice(1) }}</label>
    </template>
  </div>
</template>

<script setup>
import { useServersStore } from '../../stores/servers';

const servers = useServersStore();
const tribes = ['roman', 'teuton', 'gaul'];
</script>
