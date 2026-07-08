import buildOrder from '../../data/buildOrder.json';
import { isBuildingAllowed, occupiesSharedSlot, buildingSlotCapacity } from './gameData';

const TREASURY_GID = 27;
const HIDDEN_TREASURY_GID = 45;

export function getRecommendations(village, tribe, role) {
  const builtGids = new Set(village.buildings.map((b) => b.gid));
  const context = {
    tribe,
    isCapital: village.isCapital,
    isCity: village.isCity,
    builtGids,
  };

  // Shared-slot building types already placed. As we walk the ordered build
  // order we treat each recommended new type as if it were built, so the
  // projection respects the slot pool going forward: once the pool is full,
  // only upgrades of existing types (and dedicated wall/rally/ditch buildings)
  // remain feasible.
  const occupied = new Set([...builtGids].filter(occupiesSharedSlot));
  const capacity = buildingSlotCapacity(village);

  const result = [];
  for (const step of buildOrder) {
    // Governors never build a Treasury; kings/dukes use it instead of the
    // (mutually exclusive) Hidden Treasury.
    if (role === 'governor' && step.gid === TREASURY_GID) continue;
    if (role === 'king' && step.gid === HIDDEN_TREASURY_GID) continue;
    if (!isBuildingAllowed(step.gid, context)) continue;
    const alreadyBuilt = village.buildings.some(
      (done) => done.gid === step.gid && step.level <= done.level
    );
    if (alreadyBuilt) continue;

    // A shared-slot type that isn't placed yet needs a free slot; its later
    // levels are free once the type occupies one.
    if (occupiesSharedSlot(step.gid) && !occupied.has(step.gid)) {
      if (occupied.size >= capacity) continue;
      occupied.add(step.gid);
    }

    result.push(step);
  }
  return result;
}
