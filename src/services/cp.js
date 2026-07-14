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

// Flat culture-point bonus (at 1x speed) a village earns from city status.
export const CITY_CP = 200;
export const CAPITAL_CITY_CP = 500;

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

// CP/day bonus for city status; only cities earn it, and a capital city earns
// the larger amount.
export function villageCityCp(village) {
  if (!village.isCity) return 0;
  return village.isCapital ? CAPITAL_CITY_CP : CITY_CP;
}

// Fealty is a kingdom-wide building that, from level 7 upward, grants the
// capital a base of extra culture points per day: a flat 24 CP per level above 6
// (24 at L7 … 336 at L20). Only the capital benefits.
export const FEALTY_CP_MIN_LEVEL = 7;
export const FEALTY_CP_PER_LEVEL = 24;

export function villageFealtyCp(village, fealty) {
  if (!village.isCapital) return 0;
  const level = fealty || 0;
  if (level < FEALTY_CP_MIN_LEVEL) return 0;
  return FEALTY_CP_PER_LEVEL * (level - (FEALTY_CP_MIN_LEVEL - 1));
}

// A high enough player prestige adds more capital CP on top of the fealty base.
// The game exposes this only as a bonus at the player's current fealty level (no
// full schedule to derive), so it's a manual per-server figure the player reads
// off the game and enters. Capital-only, like the fealty base it adds to.
export function villagePrestigeCp(village, prestigeCp) {
  if (!village.isCapital) return 0;
  return Math.max(0, prestigeCp || 0);
}

export function villageTotalCp(village, { fealty = 0, prestigeCp = 0 } = {}) {
  return (
    villageBuildingCp(village) +
    villageFieldCp(village) +
    villageCityCp(village) +
    villageFealtyCp(village, fealty) +
    villagePrestigeCp(village, prestigeCp)
  );
}
