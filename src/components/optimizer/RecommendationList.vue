<template>
  <div class="recommendations">
    <h2>Recommendations</h2>
    <div
      v-for="rec in recommendations"
      :key="rec.gid + ':' + rec.level"
      class="tooltip"
      style="margin: 0 35%;"
      @click="villages.buildBuilding(rec)">
      <span>{{ rec.name }}&nbsp;{{ rec.level }}</span>
      <span class="tooltiptext">
        cpGain: {{ rec.cpGain }} <br>
        totalCost: {{ rec.levelCost }} <br>
        Res/cp: {{ Math.round(rec.costPerCpGain) }} <br>
        wood: {{ rec.wood }}
        clay: {{ rec.clay }}
        iron: {{ rec.iron }}
        crop: {{ rec.crop }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useVillagesStore } from '../../stores/villages';
import { useSettingsStore } from '../../stores/settings';
import { getRecommendations } from '../../services/recommendation';

const villages = useVillagesStore();
const settings = useSettingsStore();

const recommendations = computed(() =>
  getRecommendations(villages.activeVillage, settings.tribe)
);
</script>
