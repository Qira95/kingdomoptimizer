<template>
  <div class="villages panel">
    <h2 class="sectionTitle clickable" @click="villages.sortVillages()">Villages</h2>
    <div
      class="villageItem"
      :class="{ active: village.id === villages.activeVillageId }"
      v-for="village in villages.villages"
      :key="village.id">
      <span class="villageName clickable" @click="villages.setActiveVillage(village.id)">
        <input
          v-if="village.id === villages.activeVillageId"
          type="text"
          :value="village.name"
          @change="villages.renameVillage(village.id, $event.target.value)">
        <span v-else>{{ village.name }}</span>
      </span>
      <span class="deleteLink clickable" @click="villages.deleteVillage(village.id)">delete</span>
    </div>
    <button class="btn-primary" @click="villages.addVillage()">Add new village</button>
  </div>
</template>

<script setup>
import { useVillagesStore } from '../../stores/villages';

const villages = useVillagesStore();
</script>
