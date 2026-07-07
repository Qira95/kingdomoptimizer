<template>
  <div class="villageCp panel">
    <div class="cpSummary">
      <div class="cpTotal">
        <span class="cpValue">{{ totalCp }}</span>
        <span class="cpUnit">culture points / day</span>
      </div>
      <div class="cpBreakdown">
        <span>Buildings: <strong>{{ buildingCp }}</strong></span>
        <span>Fields (18): <strong>{{ fieldTotalCp }}</strong></span>
        <span v-if="cityCp > 0">
          {{ village.isCapital ? 'Capital city' : 'City' }} bonus: <strong>{{ cityCp }}</strong>
        </span>
        <span v-if="speed !== 1" class="cpSpeed">at {{ speed }}x speed</span>
      </div>
      <div class="cpInputs">
        <label class="cpInput">
          Avg. field level
          <input
            type="number"
            min="0"
            :max="fieldMaxLevel"
            :value="village.fieldLevel || 0"
            @input="servers.setFieldLevel(village.id, Number($event.target.value))">
        </label>
        <label class="cpInput">
          Target CP / day
          <input
            type="number"
            min="0"
            step="10"
            :value="village.targetCp || 0"
            @input="servers.setTargetCp(village.id, Number($event.target.value))">
        </label>
      </div>
    </div>

    <p v-if="target > 0" class="cpTargetNote" :class="{ reached: totalCp >= target }">
      <template v-if="totalCp >= target">
        ✓ Target of {{ target }} CP/day reached — recommendations are hidden.
      </template>
      <template v-else>
        {{ totalCp }} / {{ target }} CP/day — recommendations stop once the target is met.
      </template>
    </p>

    <button type="button" class="cpRefToggle clickable" @click="showRef = !showRef">
      {{ showRef ? '▾ Hide' : '▸ Show' }} how much CP resource fields give
    </button>

    <div v-if="showRef" class="cpRef">
      <p class="cpRefNote">
        Each of the 18 resource fields produces the same CP per day for its level
        (shown here at base 1x speed). Fields aren't part of the build-order
        recommendations — you build them for the economy anyway — but they're a
        big share of a village's culture points.
      </p>
      <table>
        <thead>
          <tr>
            <th>Field level</th>
            <th>CP / field</th>
            <th>CP / 18 fields</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in fieldCpReference" :key="row.level">
            <td>{{ row.level }}</td>
            <td>{{ row.perField }}</td>
            <td>{{ row.allFields }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useServersStore } from '../../stores/servers';
import {
  villageBuildingCp,
  villageFieldCp,
  villageCityCp,
  villageTotalCp,
  fieldCpReference,
  FIELD_MAX_LEVEL,
} from '../../services/cp';

const servers = useServersStore();
const village = computed(() => servers.activeVillage);
const speed = computed(() => servers.activeServer.speed);

const showRef = ref(false);
const fieldMaxLevel = FIELD_MAX_LEVEL;

// The game scales culture-point production by server speed (cp * speed), so
// every figure shown here is in the server's real per-day terms.
const buildingCp = computed(() => villageBuildingCp(village.value) * speed.value);
const fieldTotalCp = computed(() => villageFieldCp(village.value) * speed.value);
const cityCp = computed(() => villageCityCp(village.value) * speed.value);
const totalCp = computed(() => villageTotalCp(village.value) * speed.value);
const target = computed(() => village.value.targetCp || 0);
</script>
