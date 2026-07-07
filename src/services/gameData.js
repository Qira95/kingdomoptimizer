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
