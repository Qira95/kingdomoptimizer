<template>
  <div class="tribeSelector">
    <template v-for="r in roles" :key="r.id">
      <input type="radio" :id="'role-' + r.id" :value="r.id" v-model="servers.activeServer.role">
      <label :for="'role-' + r.id">{{ r.label }}</label>
    </template>
  </div>
</template>

<script setup>
import { useServersStore } from '../../stores/servers';

const servers = useServersStore();
const roles = [
  { id: 'king', label: 'King / Duke' },
  { id: 'governor', label: 'Governor' },
];
</script>
