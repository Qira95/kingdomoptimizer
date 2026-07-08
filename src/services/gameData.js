import gameData from '../../data/gameData.json';

export const buildings = gameData.buildings;
export const effectLabels = gameData.effectLabels;
export const byGid = new Map(buildings.map((b) => [b.gid, b]));

export const TRIBE_IDS = { roman: 1, teuton: 2, gaul: 3 };

const RESOURCE_FIELD_GIDS = new Set([1, 2, 3, 4]);

// Buildings a normal village can construct (excludes resource fields, which
// are multi-instance, and Wonder-of-the-World-village-only buildings).
export const villageBuildings = buildings.filter(
  (b) =>
    !RESOURCE_FIELD_GIDS.has(b.gid) &&
    !b.prerequisites.some((p) => p.type === 'WonderOfTheWorldVillage')
);

// Buildings that occupy their own dedicated position in the village and so do
// NOT consume one of the shared building slots: the rally point, the three
// tribe walls (+ the Natarian wall), and the city Water Ditch (a moat built
// around the village). Resource fields (gid 1-4) sit outside the village
// entirely and never appear in a village's building list.
const DEDICATED_SLOT_GIDS = new Set([16, 31, 32, 33, 42, 43]);

// A standard village has 20 shared building slots (on top of the dedicated
// ones above). Villages may hold up to 2 rare extension slots as well.
export const BASE_BUILDING_SLOTS = 20;
export const MAX_EXTENSION_SLOTS = 2;

// Whether a building type consumes one of the shared building slots.
export function occupiesSharedSlot(gid) {
  return !DEDICATED_SLOT_GIDS.has(gid);
}

// Distinct shared-slot building types currently placed in the village.
export function usedBuildingSlots(village) {
  const gids = new Set();
  for (const b of village.buildings) {
    if (occupiesSharedSlot(b.gid)) gids.add(b.gid);
  }
  return gids.size;
}

// Total shared building slots available, including any extension slots.
export function buildingSlotCapacity(village) {
  const extra = Math.max(0, Math.min(village.extensionSlots || 0, MAX_EXTENSION_SLOTS));
  return BASE_BUILDING_SLOTS + extra;
}

// Data-driven availability check, replacing the old hand-maintained
// tribe/capital limitation tables. Building-level prerequisites are
// intentionally not checked here — the optimizer's build order already
// sequences those.
export function isBuildingAllowed(gid, { tribe, isCapital, isCity, builtGids }) {
  const building = byGid.get(gid);
  for (const p of building.prerequisites) {
    switch (p.type) {
      case 'Tribe':
        if (!p.vid.includes(TRIBE_IDS[tribe])) return false;
        break;
      case 'Capital':
        if (!isCapital) return false;
        break;
      case 'City':
        if (!isCity) return false;
        break;
      case 'NotBuilding':
        if (builtGids.has(p.gid)) return false;
        break;
      case 'WonderOfTheWorldVillage':
        return false;
      default:
        break;
    }
  }
  return true;
}
