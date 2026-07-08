// Slot-aware greedy cheapest-res-per-CP build order.
//
// Ported from the original scripts/computeBuildOrder.mjs greedy and extended to
// run per village: it starts from a village's current buildings, honours an
// availability predicate (tribe / capital / city / role / mutually-exclusive
// buildings), and respects the shared building-slot pool. A candidate whose
// construction — together with the prerequisite chain it would force — needs
// more new shared-slot building types than there are free slots is dropped
// entirely, so an unplaceable building is never pursued and never drags its
// prerequisites in ahead of anything else.
//
// Pure and dependency-free: `gameData` is passed in so both the Vite app and
// the plain-Node data pipeline can share this module. With `capacity: Infinity`
// and an empty village it reproduces the original global build order.

const PLUS = true; // Travian Plus account: +25% storage capacity
const BASE_STORAGE = 800; // village capacity with no warehouse/granary built
const NO_CP_SENTINEL = 9999999999999;

const WAREHOUSE_GID = 10;
const GRANARY_GID = 11;
const RESOURCE_FIELD_GIDS = new Set([1, 2, 3, 4]);

// Buildings that occupy their own dedicated position in the village and so do
// NOT consume one of the shared building slots: the rally point, the three
// tribe walls (+ the Natarian wall), and the city Water Ditch (a moat built
// around the village). Resource fields (gid 1-4) sit outside the village
// entirely and never appear in a village's building list.
export const DEDICATED_SLOT_GIDS = new Set([16, 31, 32, 33, 42, 43]);

// A standard village has 20 shared building slots (on top of the dedicated
// ones above). Villages may hold up to 2 rare extension slots as well.
export const BASE_BUILDING_SLOTS = 20;
export const MAX_EXTENSION_SLOTS = 2;

// Buildings a village may hold more than one copy of. Each copy sits in its own
// shared slot and generates its own culture points. The optimizer treats these
// as single-instance types (it never proposes a second copy on its own), but
// slot accounting must count every copy the village already has.
export const MULTI_INSTANCE_GIDS = new Set([10, 11, 23, 36, 46]);

// Whether a building type consumes one of the shared building slots.
export function occupiesSharedSlot(gid) {
  return !DEDICATED_SLOT_GIDS.has(gid);
}

export function computeBuildOrder(
  gameData,
  {
    builtLevels = {},
    capacity = Infinity,
    extraOccupiedSlots = 0,
    isAllowed = () => true,
    validate = false,
  } = {}
) {
  const byGid = new Map(gameData.buildings.map((b) => [b.gid, b]));

  // Optimizer domain: exclude resource fields (gid 1-4, multi-instance per
  // village) and anything gated on a Wonder of the World village.
  const domainBuildings = gameData.buildings.filter(
    (b) =>
      !RESOURCE_FIELD_GIDS.has(b.gid) &&
      !b.prerequisites.some((p) => p.type === 'WonderOfTheWorldVillage')
  );
  const domainGids = new Set(domainBuildings.map((b) => b.gid));

  const warehouseCap = [BASE_STORAGE, ...byGid.get(WAREHOUSE_GID).levels.map((l) => l.effects.storageWarehouse)];
  const granaryCap = [BASE_STORAGE, ...byGid.get(GRANARY_GID).levels.map((l) => l.effects.storageGranary)];

  // Building prerequisites per gid, as "gid:level" codes. For alternative
  // requirements (gid arrays) take the first alternative inside the domain;
  // requirements pointing entirely outside the domain are skipped.
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

  // --- flatten per-level cost/CP data ---
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

  // --- state, pre-seeded from the village's current buildings ---
  const built = [];
  const builtGids = new Set();
  for (const [gid, level] of Object.entries(builtLevels)) {
    const g = Number(gid);
    if (!domainGids.has(g) || level < 1) continue;
    builtGids.add(g);
    for (let l = 1; l <= level; l += 1) {
      built.push(`${g}:${l}`);
    }
  }
  // Shared-slot building types already placed (they don't need a fresh slot).
  // `occupied` tracks one slot per distinct type; `extraOccupiedSlots` accounts
  // for the additional slots taken by second/third copies of multi-instance
  // buildings the village already has (the greedy never builds copies itself,
  // so those slots are simply unavailable to it).
  const occupied = new Set([...builtGids].filter(occupiesSharedSlot));
  const initialBuilt = new Set(built);
  const buildOrder = [];

  function getStorageLevel(amount, cap) {
    return cap.findIndex((e) => amount < (PLUS ? e * 1.25 : e));
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

  // The build itself plus its whole prerequisite chain must be allowed and must
  // fit the shared-slot pool. Count the distinct new shared-slot building types
  // it would introduce; if that overflows the remaining slots (or any part of
  // the chain is disallowed) the candidate is infeasible and gets dropped.
  function chainFeasible(building, missing) {
    const newTypes = new Set();
    for (const bd of [building, ...missing]) {
      if (!isAllowed(bd.gid, builtGids)) {
        return false;
      }
      if (occupiesSharedSlot(bd.gid) && !occupied.has(bd.gid)) {
        newTypes.add(bd.gid);
      }
    }
    return occupied.size + extraOccupiedSlots + newTypes.size <= capacity;
  }

  function clearBuilding(building) {
    delete building.levelCostWithRequirements;
    delete building.cpGainWithRequirements;
    delete building.costPerCpGainWithRequirements;
    delete building.requirementCount;
    delete building.missing;
    delete building.requirementsAdded;
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

  function commit(building) {
    clearBuilding(building);
    updateDependencies(building);
    buildOrder.push(building);
    built.push(getCode(building));
    builtGids.add(building.gid);
    if (occupiesSharedSlot(building.gid) && !occupied.has(building.gid)) {
      occupied.add(building.gid);
    }
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
      commit(building);
    } else {
      missing.forEach((missingBuilding) => forceBuild(missingBuilding, target || newTarget));
      forceBuild(building, target || newTarget);
    }
  }

  function buildBuilding(building) {
    if (built.includes(getCode(building))) {
      return;
    }
    const missing = findMissingRequirements(building);

    // Slot/availability gate: an infeasible candidate is dropped, never
    // re-queued, so its prerequisites are never force-built for a goal that
    // can't be placed.
    if (!chainFeasible(building, missing)) {
      return;
    }

    if (missing.length === 0) {
      commit(building);
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

  // Invariant check: replay the order from the initial state; every step's
  // requirements (prerequisites, own previous level, storage capacity) must
  // already be satisfied by the time it is built.
  if (validate) {
    const replayBuilt = new Set(initialBuilt);
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

  return buildOrder;
}
