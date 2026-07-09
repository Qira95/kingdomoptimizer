import { defineStore } from 'pinia';
import {
  byGid,
  occupiesSharedSlot,
  usedBuildingSlots,
  buildingSlotCapacity,
  MAX_EXTENSION_SLOTS,
} from '../services/gameData';
import { CROPPER_TYPES, OASIS_STEPS } from '../services/crop';

const MAIN_BUILDING_GID = 15;

function newVillage(id, name) {
  return {
    id,
    name,
    isCapital: false,
    isCity: false,
    // Average resource-field level, used to estimate the village's field CP
    // (the 18 fields aren't tracked individually). 0 = don't count fields.
    fieldLevel: 0,
    // Desired culture points per day; recommendations stop once the village's
    // projected production reaches it. 0 = no target (show the full list).
    targetCp: 0,
    // Rare extra building slots (0-2) on top of the standard 20-slot pool.
    extensionSlots: 0,
    buildings: [{ id: 1, gid: MAIN_BUILDING_GID, level: 1 }],
  };
}

// A cropper candidate for the crop calculator: a would-be capital identified
// by name or coordinates, its field count (7/9/15) and the max oasis crop
// bonus reachable there.
function newCropper(id) {
  return { id, label: 'New cropper', fields: 15, oasis: 0 };
}

function newServer(id, name) {
  return {
    id,
    name,
    speed: 1,
    tribe: 'roman',
    role: 'king',
    activeVillageId: 1,
    villages: [{ ...newVillage(1, 'Village 1'), isCapital: true }],
    cropCandidates: [newCropper(1)],
  };
}

// A server groups everything specific to one game world: its speed, the tribe
// and account role you play there, and its villages. Village- and building-
// level actions operate on the active server.
export const useServersStore = defineStore('servers', {
  state: () => ({
    activeServerId: 1,
    servers: [newServer(1, 'Server 1')],
  }),
  getters: {
    activeServer(state) {
      return state.servers.find((s) => s.id === state.activeServerId) ?? state.servers[0];
    },
    activeVillage() {
      const server = this.activeServer;
      return server.villages.find((v) => v.id === server.activeVillageId) ?? server.villages[0];
    },
  },
  actions: {
    // --- servers ---
    addServer() {
      const id = Date.now();
      this.servers.push(newServer(id, `Server ${this.servers.length + 1}`));
      this.activeServerId = id;
    },
    setActiveServer(serverId) {
      this.activeServerId = serverId;
    },
    renameServer(serverId, name) {
      const server = this.servers.find((s) => s.id === serverId);
      if (server) server.name = name;
    },
    deleteServer(serverId) {
      if (this.servers.length <= 1) return; // always keep one server
      const index = this.servers.findIndex((s) => s.id === serverId);
      if (index === -1) return;
      this.servers.splice(index, 1);
      if (serverId === this.activeServerId) {
        this.activeServerId = this.servers[0].id;
      }
    },
    setSpeed(speed) {
      this.activeServer.speed = speed;
    },
    setTribe(tribe) {
      this.activeServer.tribe = tribe;
    },
    setRole(role) {
      this.activeServer.role = role;
    },

    // --- villages (active server) ---
    addVillage() {
      const server = this.activeServer;
      const id = Date.now();
      server.villages.push(newVillage(id, 'New village'));
      server.activeVillageId = id;
    },
    setActiveVillage(villageId) {
      this.activeServer.activeVillageId = villageId;
    },
    renameVillage(villageId, name) {
      const village = this.activeServer.villages.find((v) => v.id === villageId);
      if (village) village.name = name;
    },
    setFieldLevel(villageId, level) {
      const village = this.activeServer.villages.find((v) => v.id === villageId);
      if (village) village.fieldLevel = Math.max(0, Math.min(level, 20));
    },
    setTargetCp(villageId, cp) {
      const village = this.activeServer.villages.find((v) => v.id === villageId);
      if (village) village.targetCp = Math.max(0, cp || 0);
    },
    setExtensionSlots(villageId, count) {
      const village = this.activeServer.villages.find((v) => v.id === villageId);
      if (village) village.extensionSlots = Math.max(0, Math.min(count || 0, MAX_EXTENSION_SLOTS));
    },
    deleteVillage(villageId) {
      const server = this.activeServer;
      const index = server.villages.findIndex((v) => v.id === villageId);
      if (index === -1) return;
      server.villages.splice(index, 1);
      if (villageId === server.activeVillageId) {
        server.activeVillageId = server.villages[0]?.id ?? 0;
      }
    },
    sortVillages() {
      this.activeServer.villages.sort((a, b) =>
        a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
      );
    },
    moveVillage(villageId, direction) {
      const villages = this.activeServer.villages;
      const index = villages.findIndex((v) => v.id === villageId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= villages.length) return;
      const [village] = villages.splice(index, 1);
      villages.splice(target, 0, village);
    },
    toggleCapital(villageId) {
      const server = this.activeServer;
      const village = server.villages.find((v) => v.id === villageId);
      if (!village) return;
      if (village.isCapital) {
        // toggling off the current capital leaves no capital
        village.isCapital = false;
        return;
      }
      // capital is exclusive: clear any existing capital first
      const oldCapital = server.villages.find((v) => v.isCapital);
      if (oldCapital) oldCapital.isCapital = false;
      village.isCapital = true;
    },
    toggleCity(villageId) {
      const village = this.activeServer.villages.find((v) => v.id === villageId);
      if (village) village.isCity = !village.isCity;
    },

    // --- buildings (active village) ---
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
      const village = this.activeVillage;
      const existing = village.buildings.find((b) => b.gid === gid && b.level < level);
      if (existing) {
        existing.level = level;
        return;
      }
      // A brand-new shared-slot building type needs a free slot in the pool.
      const isNewType = !village.buildings.some((b) => b.gid === gid);
      if (isNewType && occupiesSharedSlot(gid) && usedBuildingSlots(village) >= buildingSlotCapacity(village)) {
        return;
      }
      village.buildings.push({ id: Date.now(), gid, level });
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

    // --- cropper candidates (active server) ---
    addCropper() {
      const server = this.activeServer;
      if (!server.cropCandidates) server.cropCandidates = [];
      server.cropCandidates.push(newCropper(Date.now()));
    },
    setCropperLabel(cropperId, label) {
      const cropper = this.activeServer.cropCandidates?.find((c) => c.id === cropperId);
      if (cropper) cropper.label = label;
    },
    setCropperFields(cropperId, fields) {
      const cropper = this.activeServer.cropCandidates?.find((c) => c.id === cropperId);
      if (cropper && CROPPER_TYPES.includes(fields)) cropper.fields = fields;
    },
    setCropperOasis(cropperId, oasis) {
      const cropper = this.activeServer.cropCandidates?.find((c) => c.id === cropperId);
      if (cropper && OASIS_STEPS.includes(oasis)) cropper.oasis = oasis;
    },
    deleteCropper(cropperId) {
      const list = this.activeServer.cropCandidates;
      if (!list) return;
      const index = list.findIndex((c) => c.id === cropperId);
      if (index > -1) list.splice(index, 1);
    },
  },
});
