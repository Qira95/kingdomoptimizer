<template>
  <div class="villages panel">
    <h2 class="sectionTitle clickable" @click="servers.sortVillages()">Villages</h2>
    <div
      class="villageItem"
      :class="{ active: village.id === server.activeVillageId }"
      v-for="(village, i) in server.villages"
      :key="village.id">
      <span class="moveControls">
        <button
          type="button"
          class="moveBtn"
          title="Move up"
          :disabled="i === 0"
          @click="servers.moveVillage(village.id, -1)">▲</button>
        <button
          type="button"
          class="moveBtn"
          title="Move down"
          :disabled="i === server.villages.length - 1"
          @click="servers.moveVillage(village.id, 1)">▼</button>
      </span>
      <span class="villageName clickable" @click="servers.setActiveVillage(village.id)">
        <input
          v-if="village.id === server.activeVillageId"
          type="text"
          :value="village.name"
          @change="servers.renameVillage(village.id, $event.target.value)">
        <span v-else>{{ village.name }}</span>
      </span>
      <span class="deleteLink clickable" @click="servers.deleteVillage(village.id)">delete</span>
    </div>
    <button class="btn-primary" @click="servers.addVillage()">Add new village</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useServersStore } from '../../stores/servers';

const servers = useServersStore();
const server = computed(() => servers.activeServer);
</script>
