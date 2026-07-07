import { defineStore } from 'pinia';
import { byGid } from '../services/gameData';

const MAIN_BUILDING_GID = 15;

function newVillage(id, name) {
  return {
    id,
    name,
    isCapital: false,
    isCity: false,
    buildings: [{ id: 1, gid: MAIN_BUILDING_GID, level: 1 }],
  };
}

export const useVillagesStore = defineStore('villages', {
  state: () => ({
    activeVillageId: 1,
    villages: [{ ...newVillage(1, 'Demo village'), isCapital: true }],
  }),
  getters: {
    activeVillage(state) {
      return state.villages.find((v) => v.id === state.activeVillageId) ?? state.villages[0];
    },
  },
  actions: {
    addVillage() {
      const id = Date.now();
      this.villages.push(newVillage(id, 'New village'));
      this.activeVillageId = id;
    },
    setActiveVillage(villageId) {
      this.activeVillageId = villageId;
    },
    renameVillage(villageId, name) {
      const village = this.villages.find((v) => v.id === villageId);
      if (village) village.name = name;
    },
    deleteVillage(villageId) {
      const index = this.villages.findIndex((v) => v.id === villageId);
      if (index === -1) return;
      this.villages.splice(index, 1);
      if (villageId === this.activeVillageId) {
        this.activeVillageId = this.villages[0]?.id ?? 0;
      }
    },
    sortVillages() {
      this.villages.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
    },
    markVillageAsCapital(villageId) {
      const oldCapital = this.villages.find((v) => v.isCapital);
      if (oldCapital) oldCapital.isCapital = false;
      const newCapital = this.villages.find((v) => v.id === villageId);
      if (newCapital) newCapital.isCapital = true;
    },
    toggleCity(villageId) {
      const village = this.villages.find((v) => v.id === villageId);
      if (village) village.isCity = !village.isCity;
    },
    addBuilding() {
      this.activeVillage.buildings.push({ id: Date.now(), gid: MAIN_BUILDING_GID, level: 1 });
    },
    setBuilding(buildingId, gid, level) {
      const building = this.activeVillage.buildings.find((b) => b.id === buildingId);
      if (!building) return;
      building.gid = gid;
      building.level = Math.min(level, byGid.get(gid).maxLevel);
    },
    buildBuilding({ gid, level }) {
      const existing = this.activeVillage.buildings.find((b) => b.gid === gid && b.level < level);
      if (existing) {
        existing.level = level;
      } else {
        this.activeVillage.buildings.push({ id: Date.now(), gid, level });
      }
    },
    deleteBuilding(buildingId) {
      const buildings = this.activeVillage.buildings;
      const index = buildings.findIndex((b) => b.id === buildingId);
      if (index > -1) buildings.splice(index, 1);
    },
    sortBuildings() {
      this.activeVillage.buildings.sort((a, b) =>
        byGid.get(a.gid).slug > byGid.get(b.gid).slug ? 1 : -1
      );
    },
  },
});
