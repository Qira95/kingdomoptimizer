<template>
  <div class="calculator">
    <SettingsBar />
    <div class="container calculatorBody">
      <BuildingPicker :selected-gid="selectedGid" @select="selectedGid = $event" />
      <LevelTable :building="selectedBuilding" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { byGid } from '../../services/gameData';
import SettingsBar from './SettingsBar.vue';
import BuildingPicker from './BuildingPicker.vue';
import LevelTable from './LevelTable.vue';

const selectedGid = ref(15);
const selectedBuilding = computed(() => byGid.get(selectedGid.value));
</script>
