import gameData from '../../data/gameData.json';
import {
  occupiesSharedSlot,
  MULTI_INSTANCE_GIDS,
  BASE_BUILDING_SLOTS,
  MAX_EXTENSION_SLOTS,
} from './buildOrderCore';

export { occupiesSharedSlot, MULTI_INSTANCE_GIDS, BASE_BUILDING_SLOTS, MAX_EXTENSION_SLOTS };

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

// Shared building slots currently occupied. Single-instance types count once
// regardless of duplicate rows; multi-instance buildings (warehouse, granary,
// cranny, trapper, healing tent) count every copy, since each copy sits in its
// own slot.
export function usedBuildingSlots(village) {
  const singleTypes = new Set();
  let multiCopies = 0;
  for (const b of village.buildings) {
    if (!occupiesSharedSlot(b.gid)) continue;
    if (MULTI_INSTANCE_GIDS.has(b.gid)) {
      multiCopies += 1;
    } else {
      singleTypes.add(b.gid);
    }
  }
  return singleTypes.size + multiCopies;
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
