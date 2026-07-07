// Computes the cheapest culture-point build order from data/gameData.json.
// Port of the original scripts/{computeCostData,idealBuildOrder}.js greedy
// algorithm onto the extracted official game data (gid-based identity).
//
// Usage:
//   node scripts/computeBuildOrder.mjs [--pretty]
//
// Zero dependencies; requires Node >= 18.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const OUT_PATH = join(DATA_DIR, 'buildOrder.json');

const PLUS = true; // Travian Plus account: +25% storage capacity
const BASE_STORAGE = 800; // village capacity with no warehouse/granary built
const NO_CP_SENTINEL = 9999999999999;

const gameData = JSON.parse(readFileSync(join(DATA_DIR, 'gameData.json'), 'utf8'));
const byGid = new Map(gameData.buildings.map((b) => [b.gid, b]));

// Optimizer domain: exclude resource fields (gid 1-4, multi-instance per
// village) and anything gated on a Wonder of the World village.
const RESOURCE_FIELD_GIDS = new Set([1, 2, 3, 4]);
const domainBuildings = gameData.buildings.filter(
  (b) =>
    !RESOURCE_FIELD_GIDS.has(b.gid) &&
    !b.prerequisites.some((p) => p.type === 'WonderOfTheWorldVillage')
);
const domainGids = new Set(domainBuildings.map((b) => b.gid));

const WAREHOUSE_GID = 10;
const GRANARY_GID = 11;

// capacity[i] = storage available with the building at level i (index 0 = none)
const warehouseCap = [BASE_STORAGE, ...byGid.get(WAREHOUSE_GID).levels.map((l) => l.effects.storageWarehouse)];
const granaryCap = [BASE_STORAGE, ...byGid.get(GRANARY_GID).levels.map((l) => l.effects.storageGranary)];

// Building prerequisites per gid, as "gid:level" codes. For alternative
// requirements (gid arrays like Marketplace's [warehouse, great warehouse])
// take the first alternative inside the domain; requirements pointing
// entirely outside the domain (e.g. boosters needing a level-10 resource
// field) are skipped, matching the old hand-maintained requirements.json.
const requirementsByGid = {};
for (const b of domainBuildings) {
  requirementsByGid[b.gid] = [];
  for (const p of b.prerequisites) {
    if (p.type !== 'Building') continue;
    if (typeof p.level !== 'number') {
      throw new Error(`gid ${b.gid}: Building prerequisite without level: ${JSON.stringify(p)}`);
    }
    const gids = Array.isArray(p.gid) ? p.gid : [p.gid];
    const chosen = gids.find((g) => domainGids.has(g));
    if (chosen !== undefined) {
      requirementsByGid[b.gid].push(`${chosen}:${p.level}`);
    }
  }
}

// --- flatten per-level cost/CP data (old computeCostData.js semantics) ---

const costData = [];
for (const b of domainBuildings) {
  b.levels.forEach((levelDetail, index) => {
    const levelCost = levelDetail.wood + levelDetail.clay + levelDetail.iron + levelDetail.crop;
    const cpGain = index ? levelDetail.cp - b.levels[index - 1].cp : levelDetail.cp;
    const costPerCpGain = cpGain ? levelCost / cpGain : NO_CP_SENTINEL;
    costData.push({
      cpGain,
      wood: levelDetail.wood,
      clay: levelDetail.clay,
      iron: levelDetail.iron,
      crop: levelDetail.crop,
      levelCost,
      costPerCpGain,
      gid: b.gid,
      slug: b.slug,
      name: b.name,
      level: levelDetail.level,
    });
  });
}
costData.sort((a, b) => a.costPerCpGain - b.costPerCpGain);
const catalog = new Map(costData.map((e) => [`${e.gid}:${e.level}`, e]));

// --- greedy build order (old idealBuildOrder.js, ported verbatim) ---

const built = [];
const buildOrder = [];

function getStorageLevel(amount, capacity) {
  return capacity.findIndex((e) => amount < (PLUS ? e * 1.25 : e));
}

function getCode(building, offset = 0) {
  return `${building.gid}:${building.level - offset}`;
}

function uniqueBuildings(buildings) {
  const seen = new Set();
  const result = [];
  for (const building of buildings) {
    if (!seen.has(getCode(building))) {
      seen.add(getCode(building));
      result.push(building);
    }
  }
  return result;
}

function findMissingRequirements(building) {
  const required = [...requirementsByGid[building.gid]];
  if (building.level > 1) {
    required.push(getCode(building, 1));
  }
  const requiredGranary = getStorageLevel(building.crop, granaryCap);
  const requiredWarehouse = getStorageLevel(Math.max(building.wood, building.clay, building.iron), warehouseCap);
  if (requiredGranary > 0) {
    required.push(`${GRANARY_GID}:${requiredGranary}`);
  }
  if (requiredWarehouse > 0) {
    required.push(`${WAREHOUSE_GID}:${requiredWarehouse}`);
  }

  const missingCodes = required.filter((code) => !built.includes(code));
  const missingBuildings = missingCodes.reduce((acc, code) => {
    const requiredBuilding = catalog.get(code);
    if (!requiredBuilding) {
      throw new Error(`requirement ${code} not found in catalog`);
    }
    acc.push(requiredBuilding, ...findMissingRequirements(requiredBuilding));
    return acc;
  }, []);

  return uniqueBuildings(missingBuildings);
}

function updateDependencies(building) {
  for (const buildingData of costData) {
    if (!buildingData.requirementsAdded) continue;
    const depIndex = buildingData.missing.findIndex(
      (bd) => bd.gid === building.gid && bd.level === building.level
    );
    if (depIndex === -1) continue;
    buildingData.missing.splice(depIndex, 1);
    const requirementCostSum = buildingData.missing.reduce((sum, r) => sum + r.levelCost, 0);
    const requirementCPSum = buildingData.missing.reduce((sum, r) => sum + r.cpGain, 0);
    buildingData.levelCostWithRequirements = buildingData.levelCost + requirementCostSum;
    buildingData.cpGainWithRequirements = buildingData.cpGain + requirementCPSum;
    buildingData.costPerCpGainWithRequirements =
      buildingData.levelCostWithRequirements / buildingData.cpGainWithRequirements;
    buildingData.requirementCount = buildingData.missing.length;
  }
  costData.sort(
    (a, b) =>
      (a.costPerCpGainWithRequirements || a.costPerCpGain) -
      (b.costPerCpGainWithRequirements || b.costPerCpGain)
  );
}

function forceBuild(building, target) {
  if (built.includes(getCode(building))) {
    return;
  }
  let newTarget;
  if (!target) {
    newTarget = getCode(building);
  }
  const missing = findMissingRequirements(building);

  if (missing.length === 0) {
    if (target && target !== getCode(building)) {
      building.target = target;
    }
    updateDependencies(building);
    buildOrder.push(building);
    built.push(getCode(building));
  } else {
    missing.forEach((missingBuilding) => forceBuild(missingBuilding, target || newTarget));
    forceBuild(building, target || newTarget);
  }
}

function clearBuilding(building) {
  // previously re-inserted with requirement-inclusive cost; by the time it
  // resurfaced, its requirements were already built
  delete building.levelCostWithRequirements;
  delete building.cpGainWithRequirements;
  delete building.costPerCpGainWithRequirements;
  delete building.requirementCount;
  delete building.missing;
  delete building.requirementsAdded;
}

function buildBuilding(building) {
  if (built.includes(getCode(building))) {
    return;
  }
  const missing = findMissingRequirements(building);

  if (missing.length === 0) {
    clearBuilding(building);
    updateDependencies(building);
    buildOrder.push(building);
    built.push(getCode(building));
  } else {
    const requirementCostSum = missing.reduce((sum, r) => sum + r.levelCost, 0);
    const requirementCPSum = missing.reduce((sum, r) => sum + r.cpGain, 0);
    building.levelCostWithRequirements = building.levelCost + requirementCostSum;
    building.cpGainWithRequirements = building.cpGain + requirementCPSum;
    building.costPerCpGainWithRequirements =
      building.levelCostWithRequirements / building.cpGainWithRequirements;
    building.requirementCount = missing.length;
    building.missing = missing;
    building.requirementsAdded = true;

    if (
      building.costPerCpGainWithRequirements <=
      (costData[0].costPerCpGainWithRequirements || costData[0].costPerCpGain)
    ) {
      forceBuild(building);
    } else {
      costData.push(building);
      costData.sort(
        (a, b) =>
          (a.costPerCpGainWithRequirements || a.costPerCpGain) -
          (b.costPerCpGainWithRequirements || b.costPerCpGain)
      );
    }
  }
}

while (costData.length > 0) {
  buildBuilding(costData.shift());
}

// running totals
buildOrder.forEach((b, i) => {
  b.totalCp = b.cpGain + (i ? buildOrder[i - 1].totalCp : 0);
  b.totalCost = b.levelCost + (i ? buildOrder[i - 1].totalCost : 0);
});

// --- invariant check: replay the order, every step must be buildable ---

{
  const replayBuilt = new Set();
  buildOrder.forEach((b, i) => {
    const required = [...requirementsByGid[b.gid]];
    if (b.level > 1) required.push(`${b.gid}:${b.level - 1}`);
    const g = getStorageLevel(b.crop, granaryCap);
    const w = getStorageLevel(Math.max(b.wood, b.clay, b.iron), warehouseCap);
    if (g > 0) required.push(`${GRANARY_GID}:${g}`);
    if (w > 0) required.push(`${WAREHOUSE_GID}:${w}`);
    for (const code of required) {
      if (!replayBuilt.has(code)) {
        throw new Error(`invariant violated at step ${i} (${b.slug}:${b.level}): missing ${code}`);
      }
    }
    replayBuilt.add(`${b.gid}:${b.level}`);
  });
}

writeFileSync(OUT_PATH, JSON.stringify(buildOrder, null, 2) + '\n');
console.log(`wrote ${OUT_PATH}: ${buildOrder.length} steps, final total CP ${buildOrder.at(-1).totalCp}`);

if (process.argv.includes('--pretty')) {
  for (const b of buildOrder) {
    let line = `${b.slug} lvl${b.level}: +${b.cpGain}cp for ${b.levelCost} res (${b.costPerCpGain.toFixed(1)} res/cp)`;
    if (b.target) {
      const [tGid, tLvl] = b.target.split(':');
      line += ` [required for ${byGid.get(Number(tGid)).slug}:${tLvl}]`;
    }
    console.log(line);
  }
}
