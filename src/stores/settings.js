import { defineStore } from 'pinia';

// Tribe, role, game speed, fealty and prestige are per-server and live on the
// servers store. What remains here is the active view plus the calculator's
// exploratory Main Building knob (speed/fealty/prestige are read from the
// active server).
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    view: 'optimizer',
    calc: {
      mainBuilding: 1,
    },
    // Crop-comparison knobs applied to every cropper candidate equally, so
    // they change the crop/hour figures shown but never the ranking order.
    crop: {
      fieldLevel: 20,
      millBakery: false,
    },
  }),
});
