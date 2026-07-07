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

    <TribeSelector />

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
              @click="villages.toggleCapital(village.id)">
              {{ village.isCapital ? 'Capital ✓' : 'Set as capital' }}
            </button>
            <button
              type="button"
              class="btn-toggle"
              :class="{ active: village.isCity }"
              @click="villages.toggleCity(village.id)">
              {{ village.isCity ? 'Upgraded to city ✓' : 'Upgrade to city' }}
            </button>
          </div>
        </div>
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
import { useVillagesStore } from '../../stores/villages';
import TribeSelector from './TribeSelector.vue';
import VillageList from './VillageList.vue';
import VillageBuildings from './VillageBuildings.vue';
import RecommendationList from './RecommendationList.vue';

const villages = useVillagesStore();
const village = computed(() => villages.activeVillage);
</script>
