// Per-level building stats with game-speed / Main Building / fealty /
// prestige modifiers. Formulas ported 1:1 from the official interactive
// calculator bundle (tk-kb.kingdoms.com/main.js).
import { byGid } from './gameData';

const WONDER_GID = 40;
const MAIN_BUILDING_GID = 15;

// Main Building level -> construction time multiplier; level 0 means "no
// Main Building" and the game applies a 5x penalty.
const mbMultiplier = { 0: 5 };
for (const l of byGid.get(MAIN_BUILDING_GID).levels) {
  mbMultiplier[l.level] = l.effects.buildingTime;
}

const STORAGE_SPEED = { 1: 1, 2: 1.25, 3: 1.5, 5: 2, 10: 4 };

const STORAGE_EFFECTS = [
  'storageWarehouse', 'storageGranary', 'storageCranny', 'storageCrannyGaul',
  'woundedCapacity', 'woundedCapacityPlus',
];
const PARTY_EFFECTS = ['smallPartyTime', 'largePartyTime', 'partyTime'];
const PRODUCTION_EFFECTS = ['production1', 'production2', 'production3', 'production4', 'traps'];

function roundStep(t) {
  if (t < 600) return 5;
  if (t < 1800) return 30;
  if (t < 7200) return 60;
  return 300;
}

function fealtyTimeFactor(fealty, prestigeGte11) {
  let pct = 0;
  if (fealty >= 11) {
    if (fealty === 11) pct = 1;
    else if (fealty === 12) pct = 1.5;
    else pct = fealty - 11;
    if (fealty > 20) pct = 9;
    if (prestigeGte11) pct += 1;
  }
  return 1 - pct / 100;
}

function fealtyCostFactor(fealty, prestigeGte12) {
  return 1 - (fealty < 12 ? 0 : 0.5 * (fealty - 11 + (prestigeGte12 ? 1 : 0))) / 100;
}

export function levelStats(building, level, { speed, mainBuilding, fealty, prestige }) {
  const d = building.levels[level - 1];
  const isWonder = building.gid === WONDER_GID;

  const mult = mbMultiplier[building.gid === MAIN_BUILDING_GID ? level - 1 : mainBuilding];
  const base = (d.time * mult) / speed;
  const step = roundStep(base);
  const timeFactor = isWonder ? 1 : fealtyTimeFactor(fealty, prestige >= 11);
  const costFactor = isWonder ? 1 : fealtyCostFactor(fealty, prestige >= 12);

  const effects = {};
  for (const [key, value] of Object.entries(d.effects)) {
    if (STORAGE_EFFECTS.includes(key)) effects[key] = Math.round(value * (STORAGE_SPEED[speed] ?? 1));
    else if (PARTY_EFFECTS.includes(key)) effects[key] = Math.round(value / speed);
    else if (PRODUCTION_EFFECTS.includes(key)) effects[key] = value * speed;
    else effects[key] = value;
  }

  return {
    level,
    wood: Math.round(costFactor * d.wood),
    clay: Math.round(costFactor * d.clay),
    iron: Math.round(costFactor * d.iron),
    crop: Math.round(costFactor * d.crop),
    time: Math.round(base / step) * step * timeFactor,
    pop: d.pop,
    cp: d.cp * speed,
    effects,
  };
}

export function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
