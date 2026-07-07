<template>
  <div class="page">
    <div class="usage">
      <div class="usageCard">
        You can add multiple villages — they are stored in your browser, so they'll be here when you come back.
        You can rename the active village.
      </div>
      <div class="usageCard">
        Set current building levels to get up-to-date recommendations.
        Click the "Buildings" subtitle to sort buildings alphabetically.
      </div>
      <div class="usageCard">
        Recommendations are sorted by res/cp — the first is the cheapest.
        Sometimes it's worth building a worse res/cp building to unlock a better one; missing requirements use averages.
        Click a recommendation to build it in your active village.
      </div>
    </div>

    <div class="selectors">
      <TribeSelector />
      <RoleSelector />
      <SpeedSelector />
    </div>

    <div class="optimizerGrid">
      <VillageList />
      <div>
        <div class="villageHeader">
          <h1>{{ village.name }}</h1>
          <span v-if="village.isCapital" class="badge">Capital</span>
          <span v-if="village.isCity" class="badge">City</span>
          <div class="villageActions">
            <button
              type="button"
              class="btn-toggle"
              :class="{ active: village.isCapital }"
              @click="servers.toggleCapital(village.id)">
              {{ village.isCapital ? 'Capital ✓' : 'Set as capital' }}
            </button>
            <button
              type="button"
              class="btn-toggle"
              :class="{ active: village.isCity }"
              @click="servers.toggleCity(village.id)">
              {{ village.isCity ? 'Upgraded to city ✓' : 'Upgrade to city' }}
            </button>
          </div>
        </div>
        <VillageCp />
        <div class="container">
          <VillageBuildings />
          <RecommendationList />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useServersStore } from '../../stores/servers';
import TribeSelector from './TribeSelector.vue';
import RoleSelector from './RoleSelector.vue';
import SpeedSelector from './SpeedSelector.vue';
import VillageList from './VillageList.vue';
import VillageBuildings from './VillageBuildings.vue';
import VillageCp from './VillageCp.vue';
import RecommendationList from './RecommendationList.vue';

const servers = useServersStore();
const village = computed(() => servers.activeVillage);
</script>
