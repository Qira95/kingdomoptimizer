<template>
  <div class="buildingPicker">
    <div v-for="(group, category) in grouped" :key="category">
      <h3>{{ category }}</h3>
      <button
        v-for="b in group"
        :key="b.gid"
        type="button"
        :class="{ active: b.gid === selectedGid }"
        @click="$emit('select', b.gid)">
        {{ b.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { buildings } from '../../services/gameData';

defineProps({ selectedGid: { type: Number, required: true } });
defineEmits(['select']);

const grouped = {};
for (const b of buildings) {
  (grouped[b.category] ??= []).push(b);
}
</script>
