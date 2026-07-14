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
        <span class="recCost" :class="{ reqStep: isReqStep(rec) }">{{ costLabel(rec) }}</span>
        <span class="tooltiptext">
          <span v-if="rec.target" class="res">Required for {{ targetLabel(rec) }}.<br></span>
          <template v-if="rec.cpGain">
            <span class="res">CP gain:</span> {{ rec.cpGain }}<br>
            <span class="res">Res/CP:</span> {{ Math.round(rec.costPerCpGain) }} res/cp<br>
          </template>
          <span v-else-if="!rec.target" class="res">Grants no culture points.<br></span>
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
import { byGid } from '../../services/gameData';
import { villageTotalCp } from '../../services/cp';

const servers = useServersStore();

const speed = computed(() => servers.activeServer.speed);
const target = computed(() => servers.activeVillage.targetCp || 0);
const currentCp = computed(
  () =>
    villageTotalCp(servers.activeVillage, {
      fealty: servers.activeServer.fealty ?? 0,
      prestigeCp: servers.activeServer.prestigeCp ?? 0,
    }) * speed.value
);
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

// A step is a "requirement step" when it was force-built to satisfy another
// building's prerequisites — the pipeline stamps those with `target`
// ("gid:level"). That is independent of CP: a requirement step may still grant
// CP. We only show the compact REQ badge for requirement steps that yield no
// CP (there is nothing else worth displaying); everything else shows res/CP.
function isReqStep(rec) {
  return !rec.cpGain && Boolean(rec.target);
}

// Compact right-hand label: res/CP for CP-granting steps, a REQ badge for no-CP
// requirement steps, and a neutral "no CP" for the few levels that grant
// nothing and aren't required by anything either.
function costLabel(rec) {
  if (rec.cpGain) return `${Math.round(rec.costPerCpGain)} res/cp`;
  return rec.target ? 'req. step' : 'no CP';
}

// Resolve a `target` ("gid:level") into "Building Name level" for the tooltip.
function targetLabel(rec) {
  const [gid, level] = rec.target.split(':');
  const building = byGid.get(Number(gid));
  return `${building ? building.name : `#${gid}`} ${level}`;
}
</script>
