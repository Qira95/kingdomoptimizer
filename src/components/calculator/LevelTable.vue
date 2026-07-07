<template>
  <div class="levelTable">
    <h2>{{ building.name }}</h2>
    <p class="hint">Click a row to start a range, click another to total the levels in between.</p>
    <table>
      <thead>
        <tr>
          <th>Level</th>
          <th class="wood">Wood</th>
          <th class="clay">Clay</th>
          <th class="iron">Iron</th>
          <th class="crop">Crop</th>
          <th>Sum</th>
          <th>Time</th>
          <th>Pop</th>
          <th>CP</th>
          <th v-for="key in building.effects" :key="key">{{ effectLabels[key] ?? key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.level"
          :class="{ selected: inRange(row.level) }"
          @click="clickRow(row.level)">
          <td>{{ row.level }}</td>
          <td class="wood-cell">{{ row.wood }}</td>
          <td class="clay-cell">{{ row.clay }}</td>
          <td class="iron-cell">{{ row.iron }}</td>
          <td class="crop-cell">{{ row.crop }}</td>
          <td>{{ row.wood + row.clay + row.iron + row.crop }}</td>
          <td>{{ formatDuration(row.time) }}</td>
          <td>{{ row.pop }}</td>
          <td>{{ row.cp }}</td>
          <td v-for="key in building.effects" :key="key">{{ formatEffect(key, row.effects[key]) }}</td>
        </tr>
      </tbody>
      <tfoot v-if="totals">
        <tr>
          <td>{{ totals.from }}–{{ totals.to }}</td>
          <td class="wood-cell">{{ totals.wood }}</td>
          <td class="clay-cell">{{ totals.clay }}</td>
          <td class="iron-cell">{{ totals.iron }}</td>
          <td class="crop-cell">{{ totals.crop }}</td>
          <td>{{ totals.wood + totals.clay + totals.iron + totals.crop }}</td>
          <td>{{ formatDuration(totals.time) }}</td>
          <td>+{{ totals.pop }}</td>
          <td>+{{ totals.cp }}</td>
          <td :colspan="building.effects.length"></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useServersStore } from '../../stores/servers';
import { effectLabels } from '../../services/gameData';
import { levelStats, formatDuration } from '../../services/calculator';

const props = defineProps({ building: { type: Object, required: true } });
const settings = useSettingsStore();
const servers = useServersStore();

// Speed is a per-server setting; the rest of the calculator knobs are global.
const calc = computed(() => ({ ...settings.calc, speed: servers.activeServer.speed }));

const rangeStart = ref(null);
const rangeEnd = ref(null);

watch(() => props.building, () => {
  rangeStart.value = null;
  rangeEnd.value = null;
});

const rows = computed(() =>
  props.building.levels.map((l) => levelStats(props.building, l.level, calc.value))
);

function clickRow(level) {
  if (rangeStart.value === null || rangeEnd.value !== null) {
    rangeStart.value = level;
    rangeEnd.value = null;
  } else if (level === rangeStart.value) {
    rangeStart.value = null;
  } else {
    rangeEnd.value = Math.max(level, rangeStart.value);
    rangeStart.value = Math.min(level, rangeStart.value);
  }
}

function formatEffect(key, value) {
  if (value === undefined) return '–';
  if (key === 'buildingTime') return (value * 100).toFixed(1) + '%';
  return Number.isInteger(value) ? value : Math.round(value * 1000) / 1000;
}

function inRange(level) {
  if (rangeStart.value === null) return false;
  const end = rangeEnd.value ?? rangeStart.value;
  return level >= rangeStart.value && level <= end;
}

const totals = computed(() => {
  if (rangeStart.value === null) return null;
  const from = rangeStart.value;
  const to = rangeEnd.value ?? rangeStart.value;
  const selected = rows.value.filter((r) => r.level >= from && r.level <= to);
  const before = rows.value.find((r) => r.level === from - 1);
  return {
    from,
    to,
    wood: selected.reduce((s, r) => s + r.wood, 0),
    clay: selected.reduce((s, r) => s + r.clay, 0),
    iron: selected.reduce((s, r) => s + r.iron, 0),
    crop: selected.reduce((s, r) => s + r.crop, 0),
    time: selected.reduce((s, r) => s + r.time, 0),
    pop: selected.at(-1).pop - (before?.pop ?? 0),
    cp: selected.at(-1).cp - (before?.cp ?? 0),
  };
});
</script>
