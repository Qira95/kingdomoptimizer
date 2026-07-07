import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    tribe: 'roman',
    view: 'optimizer',
    calc: {
      speed: 1,
      mainBuilding: 1,
      fealty: 0,
      prestige: 0,
    },
  }),
});
