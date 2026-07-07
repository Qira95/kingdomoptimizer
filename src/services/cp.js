// Culture-point production for a village.
//
// In Travian Kingdoms every building level has a "culture points per day"
// output; a village's culture-point production is the sum across all its
// buildings and its 18 resource fields. Resource fields (gid 1-4) are not
// tracked individually in the village model, so we approximate their
// contribution from a single "average field level" the user provides.

import { byGid } from './gameData';

const WOODCUTTER_GID = 1; // all four resource fields share one CP schedule
export const FIELD_SLOTS = 18; // standard village layout

// Cumulative CP produced per day by a single resource field, indexed by level
// (index 0 = level 1). Identical across wood/clay/iron/crop.
const FIELD_CP_BY_LEVEL = byGid.get(WOODCUTTER_GID).levels.map((l) => l.cp);
export const FIELD_MAX_LEVEL = FIELD_CP_BY_LEVEL.length;

// CP/day for one resource field at the given level (0 = not built).
export function fieldCp(level) {
  if (!level || level < 1) return 0;
  const capped = Math.min(level, FIELD_MAX_LEVEL);
  return FIELD_CP_BY_LEVEL[capped - 1];
}

// Reference rows for the "how much CP do fields give" table.
export const fieldCpReference = FIELD_CP_BY_LEVEL.map((cp, i) => ({
  level: i + 1,
  perField: cp,
  allFields: cp * FIELD_SLOTS,
}));

// CP/day from the special buildings recorded on the village.
export function villageBuildingCp(village) {
  let total = 0;
  for (const b of village.buildings) {
    const building = byGid.get(b.gid);
    if (!building || !b.level) continue;
    const capped = Math.min(b.level, building.maxLevel);
    total += building.levels[capped - 1].cp;
  }
  return total;
}

// CP/day from the 18 resource fields, assuming the given average level.
export function villageFieldCp(village) {
  return fieldCp(village.fieldLevel || 0) * FIELD_SLOTS;
}

export function villageTotalCp(village) {
  return villageBuildingCp(village) + villageFieldCp(village);
}
