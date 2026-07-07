<template>
  <div class="recommendations panel">
    <h2 class="sectionTitle">Recommendations</h2>
    <div class="recList">
      <div
        v-for="rec in recommendations"
        :key="rec.gid + ':' + rec.level"
        class="recItem tooltip"
        @click="villages.buildBuilding(rec)">
        <span>
          <span class="recName">{{ rec.name }}</span>
          <span class="recLevel">&nbsp;{{ rec.level }}</span>
        </span>
        <span class="recCost" :class="{ reqStep: !rec.cpGain }">{{ resPerCp(rec) }}</span>
        <span class="tooltiptext">
          <span v-if="!rec.cpGain" class="res">Requirement step — grants no culture points, needed to unlock other buildings.</span>
          <template v-else>
            <span class="res">CP gain:</span> {{ rec.cpGain }}<br>
            <span class="res">Res/CP:</span> {{ Math.round(rec.costPerCpGain) }} res/cp<br>
          </template>
          <span class="res">Total cost:</span> {{ rec.levelCost }}<br>
          <span class="res">Wood:</span> {{ rec.wood }} &nbsp;
          <span class="res">Clay:</span> {{ rec.clay }}<br>
          <span class="res">Iron:</span> {{ rec.iron }} &nbsp;
          <span class="res">Crop:</span> {{ rec.crop }}
        </span>
      </div>
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

// A level that grants no culture points has no meaningful res/cp; the pipeline
// stores a large sentinel so it sorts last. Show it as "no CP" instead.
function resPerCp(rec) {
  if (!rec.cpGain) return 'req. step';
  return `${Math.round(rec.costPerCpGain)} res/cp`;
}
</script>
