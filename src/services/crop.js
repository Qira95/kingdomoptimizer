// Crop / cropper comparison math.
//
// Only a capital may push its crop fields past the normal cap, so a feeding
// village for attack armies is almost always a cropper — a special village
// layout with more crop fields than the usual six. In-game the options are
// 7, 9 or 15 crop fields. A 15-cropper produces the most raw crop, but the
// oases a village can annex (each +25% or +50%, up to +150% total) change the
// ranking: a 9-cropper at +75% out-produces a 15-cropper with no oasis.
//
// Whichever village becomes the capital runs its crop fields at the same
// capital max level, so per-field production cancels out of the ranking — the
// order is decided by fields x (1 + oasis). We still show real crop/hour by
// multiplying through the chosen field level and the optional Grain Mill +
// Bakery bonus.

import { byGid } from './gameData';

const CROPLAND_GID = 4;
const GRAIN_MILL_GID = 8;
const BAKERY_GID = 9;

const CROPLAND = byGid.get(CROPLAND_GID);

// Cropper layouts, by number of crop fields.
export const CROPPER_TYPES = [7, 9, 15];

// Oasis crop bonus steps, in percent (three oases, each +25% or +50%).
export const OASIS_STEPS = [0, 25, 50, 75, 100, 125, 150];

// Capital crop fields top out at the cropland's max level.
export const MAX_FIELD_LEVEL = CROPLAND.maxLevel;

function maxBoost(gid) {
  const building = byGid.get(gid);
  const last = building.levels[building.levels.length - 1];
  return last.effects.productionBoost4 || 0;
}

// Grain Mill + Bakery, both maxed, as a production fraction (0.5 = +50%).
export const MILL_BAKERY_BONUS = maxBoost(GRAIN_MILL_GID) + maxBoost(BAKERY_GID);
export const MILL_BAKERY_PERCENT = Math.round(MILL_BAKERY_BONUS * 100);

// Crop produced per field per hour at a given field level.
export function cropPerField(level) {
  const entry = CROPLAND.levels.find((l) => l.level === level);
  return entry ? entry.effects.production4 : 0;
}

// Gross crop/hour from a cropper's fields. Oasis and building bonuses stack
// additively on the raw field production, matching the in-game model.
export function cropProduction({ fields, fieldLevel, oasisPercent, millBakery }) {
  const base = fields * cropPerField(fieldLevel);
  const bonus = oasisPercent / 100 + (millBakery ? MILL_BAKERY_BONUS : 0);
  return Math.round(base * (1 + bonus));
}
