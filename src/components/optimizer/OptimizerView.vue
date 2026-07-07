<template>
  <div>
    <div class="usage">
      <div style="width: 20%;">
        You can add multiple villages, they will be stored in your browser, so whenever you come back, they will be there.<br>
        You can rename the active village.
      </div>
      <div style="width: 30%;">
        Set current building levels to get up to date recommendations.<br>
        Click the "Buildings" subtitle to sort buildings alphabetically.
      </div>
      <div style="width: 50%;">
        The recommendations are sorted based on res/cp, the first is the cheapest.<br>
        Sometimes, it's worth it to build a building with worse res/cp to be able to build a better res/cp building. When calculating res/cp on buildings with missing requirements, the app uses averages.<br>
        Click the recommendation to build it in your active village.
      </div>
    </div>
    <div>
      <TribeSelector />
    </div>
    <div class="container" style="padding: 20px">
      <div style="width: 33%">
        <VillageList />
      </div>
      <div style="width: 66%">
        <div style="text-align: left">
          <h1>
            {{ village.name }}
            <span v-if="village.isCapital">(capital)</span>
            <span v-if="village.isCity">(city)</span>
          </h1>
          <button type="button" @click="villages.markVillageAsCapital(village.id)">Set as capital</button>
          <label class="cityToggle">
            <input type="checkbox" :checked="village.isCity" @change="villages.toggleCity(village.id)">
            Upgraded to city
          </label>
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
