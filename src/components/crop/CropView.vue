<template>
  <div class="crop page">
    <div class="settingsBar">
      <label>
        Crop field level
        <select v-model.number="settings.crop.fieldLevel">
          <option v-for="n in MAX_FIELD_LEVEL" :value="n" :key="n">{{ n }}</option>
        </select>
      </label>
      <label>
        <input type="checkbox" v-model="settings.crop.millBakery">
        Grain Mill + Bakery (+{{ MILL_BAKERY_PERCENT }}%)
      </label>
      <span class="settingsNote">
        These apply to every candidate equally — they change the crop/hour
        figures, not the ranking.
      </span>
    </div>

    <div class="panel cropPanel">
      <h2 class="sectionTitle">Cropper comparison — {{ server.name }}</h2>
      <p class="cropIntro">
        Only a capital can raise crop fields past the normal cap, so the best
        feeder is a cropper. A 15-cropper makes the most raw crop, but oases
        (up to +150%) can flip that — enter each candidate and the best crop
        producer is highlighted.
      </p>

      <table class="cropTable">
        <thead>
          <tr>
            <th class="markCol"></th>
            <th class="nameCol">Name / coordinates</th>
            <th>Crop fields</th>
            <th>Max oasis bonus</th>
            <th class="crop">Crop / hour</th>
            <th class="actionCol"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" :class="{ best: row.isBest }">
            <td class="markCol bestMark" :title="row.isBest ? 'Best crop production' : ''">
              {{ row.isBest ? '★' : '' }}
            </td>
            <td class="nameCol">
              <input
                type="text"
                :value="row.label"
                placeholder="e.g. (12|-34)"
                @change="servers.setCropperLabel(row.id, $event.target.value)">
            </td>
            <td>
              <select
                :value="row.fields"
                @change="servers.setCropperFields(row.id, Number($event.target.value))">
                <option v-for="f in CROPPER_TYPES" :value="f" :key="f">{{ f }}-cropper</option>
              </select>
            </td>
            <td>
              <select
                :value="row.oasis"
                @change="servers.setCropperOasis(row.id, Number($event.target.value))">
                <option v-for="o in OASIS_STEPS" :value="o" :key="o">+{{ o }}%</option>
              </select>
            </td>
            <td class="crop-cell cropValue">{{ row.production.toLocaleString() }}</td>
            <td class="actionCol">
              <span class="deleteLink clickable" @click="servers.deleteCropper(row.id)">delete</span>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td class="cropEmpty" colspan="6">No croppers yet — add one to compare.</td>
          </tr>
        </tbody>
      </table>

      <button class="btn-primary" @click="servers.addCropper()">Add cropper</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../../stores/settings';
import { useServersStore } from '../../stores/servers';
import {
  CROPPER_TYPES,
  OASIS_STEPS,
  MAX_FIELD_LEVEL,
  MILL_BAKERY_PERCENT,
  cropProduction,
} from '../../services/crop';

const settings = useSettingsStore();
const servers = useServersStore();
const server = computed(() => servers.activeServer);

const rows = computed(() => {
  const list = server.value.cropCandidates ?? [];
  const withProduction = list.map((c) => ({
    ...c,
    production: cropProduction({
      fields: c.fields,
      fieldLevel: settings.crop.fieldLevel,
      oasisPercent: c.oasis,
      millBakery: settings.crop.millBakery,
    }),
  }));
  const max = withProduction.reduce((m, r) => Math.max(m, r.production), 0);
  return withProduction.map((r) => ({ ...r, isBest: max > 0 && r.production === max }));
});
</script>
