<template>
  <div class="recommendations panel">
    <h2 class="sectionTitle">Recommendations</h2>
    <p v-if="targetReached" class="recEmpty">
      This village already produces {{ Math.round(currentCp) }} CP/day, meeting its
      target of {{ target }}. Raise the target or clear it to see more.
    </p>
    <div class="recList">
      <div
        v-for="rec in recommendations"
        :key="rec.gid + ':' + rec.level"
        class="recItem tooltip"
        @click="servers.buildBuilding(rec)">
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
import { useServersStore } from '../../stores/servers';
import { getRecommendations } from '../../services/recommendation';
import { villageTotalCp } from '../../services/cp';

const servers = useServersStore();

const speed = computed(() => servers.activeServer.speed);
const target = computed(() => servers.activeVillage.targetCp || 0);
const currentCp = computed(() => villageTotalCp(servers.activeVillage) * speed.value);
const targetReached = computed(() => target.value > 0 && currentCp.value >= target.value);

const recommendations = computed(() => {
  const server = servers.activeServer;
  const all = getRecommendations(servers.activeVillage, server.tribe, server.role);
  if (target.value <= 0) return all;
  if (targetReached.value) return [];
  // Walk the order, accumulating each step's CP gain (scaled by speed) on top
  // of what the village already produces; keep the step that crosses the
  // target, then stop.
  let running = currentCp.value;
  const result = [];
  for (const rec of all) {
    result.push(rec);
    running += (rec.cpGain || 0) * speed.value;
    if (running >= target.value) break;
  }
  return result;
});

// A level that grants no culture points has no meaningful res/cp; the pipeline
// stores a large sentinel so it sorts last. Show it as "no CP" instead.
function resPerCp(rec) {
  if (!rec.cpGain) return 'req. step';
  return `${Math.round(rec.costPerCpGain)} res/cp`;
}
</script>
