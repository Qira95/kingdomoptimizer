<template>
  <div class="buildings panel">
    <h2 class="sectionTitle clickable" @click="servers.sortBuildings()">Buildings</h2>
    <div class="buildingRow" v-for="(building, i) in village.buildings" :key="building.id">
      <span class="idx">{{ i + 1 }}.</span>
      <select
        :value="building.gid"
        @change="servers.setBuilding(building.id, Number($event.target.value), building.level)">
        <option v-for="ab in availableBuildings" :value="ab.gid" :key="ab.gid">{{ ab.name }}</option>
      </select>
      <select
        :value="building.level"
        @change="servers.setBuilding(building.id, building.gid, Number($event.target.value))">
        <option v-for="n in maxLevel(building.gid)" :value="n" :key="n">{{ n }}</option>
      </select>
      <span class="deleteLink clickable" @click="servers.deleteBuilding(building.id)">delete</span>
    </div>
    <button class="btn-primary" @click="servers.addBuilding()">Add new building</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useServersStore } from '../../stores/servers';
import { villageBuildings, byGid, isBuildingAllowed } from '../../services/gameData';

const servers = useServersStore();
const village = computed(() => servers.activeVillage);

const availableBuildings = computed(() => {
  const builtGids = new Set(village.value.buildings.map((b) => b.gid));
  const context = {
    tribe: servers.activeServer.tribe,
    isCapital: village.value.isCapital,
    isCity: village.value.isCity,
    builtGids,
  };
  // keep already-selected buildings in the list so existing rows stay valid
  return villageBuildings.filter((b) => builtGids.has(b.gid) || isBuildingAllowed(b.gid, context));
});

function maxLevel(gid) {
  return byGid.get(gid).maxLevel;
}
</script>
