<template>
  <div class="villages">
    <h2 class="clickable" @click="villages.sortVillages()">Villages</h2>
    <br>
    <div class="villageItem" v-for="village in villages.villages" :key="village.id">
      <span class="clickable" @click="villages.setActiveVillage(village.id)">
        <input
          v-if="village.id === villages.activeVillageId"
          type="text"
          :value="village.name"
          @change="villages.renameVillage(village.id, $event.target.value)">
        <span v-else style="padding: 10px;">{{ village.name }}</span>
      </span>
      <span class="clickable" @click="villages.deleteVillage(village.id)">delete</span>
    </div>
    <button @click="villages.addVillage()">Add new village</button>
  </div>
</template>

<script setup>
import { useVillagesStore } from '../../stores/villages';

const villages = useVillagesStore();
</script>
