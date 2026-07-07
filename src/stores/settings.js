import { defineStore } from 'pinia';

// Tribe, role and game speed are per-server and live on the servers store.
// What remains here is the active view plus the calculator's exploratory
// knobs (game speed is read from the active server).
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    view: 'optimizer',
    calc: {
      mainBuilding: 1,
      fealty: 0,
      prestige: 0,
    },
  }),
});
