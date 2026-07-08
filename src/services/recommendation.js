import gameData from '../../data/gameData.json';
import { computeBuildOrder, occupiesSharedSlot } from './buildOrderCore';
import { isBuildingAllowed, buildingSlotCapacity, usedBuildingSlots } from './gameData';

const TREASURY_GID = 27;
const HIDDEN_TREASURY_GID = 45;

// Build order tailored to one village: it starts from the village's current
// buildings, respects the shared building-slot pool (so buildings that can't be
// placed — and their prerequisite chains — are never recommended), and filters
// by tribe / capital / city / role availability.
export function getRecommendations(village, tribe, role) {
  const builtLevels = {};
  for (const b of village.buildings) {
    builtLevels[b.gid] = Math.max(builtLevels[b.gid] || 0, b.level);
  }

  // The greedy models each gid as a single instance, so it only sees one slot
  // per distinct shared-slot type. Extra copies of multi-instance buildings
  // occupy real slots the greedy can't reuse — subtract those distinct types
  // from the true occupied-slot count to get the leftover copies, and hand that
  // to the greedy so it doesn't hand out slots that are already taken.
  const distinctSharedTypes = Object.keys(builtLevels).filter((gid) =>
    occupiesSharedSlot(Number(gid))
  ).length;
  const extraOccupiedSlots = usedBuildingSlots(village) - distinctSharedTypes;

  const isAllowed = (gid, builtGids) => {
    // Governors never build a Treasury; kings/dukes use it instead of the
    // (mutually exclusive) Hidden Treasury.
    if (role === 'governor' && gid === TREASURY_GID) return false;
    if (role === 'king' && gid === HIDDEN_TREASURY_GID) return false;
    return isBuildingAllowed(gid, {
      tribe,
      isCapital: village.isCapital,
      isCity: village.isCity,
      builtGids,
    });
  };

  return computeBuildOrder(gameData, {
    builtLevels,
    capacity: buildingSlotCapacity(village),
    extraOccupiedSlots,
    isAllowed,
  });
}
