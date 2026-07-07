import buildOrder from '../../data/buildOrder.json';
import { isBuildingAllowed } from './gameData';

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
  return buildOrder.filter((step) => {
    // Governors never build a Treasury; kings/dukes use it instead of the
    // (mutually exclusive) Hidden Treasury.
    if (role === 'governor' && step.gid === TREASURY_GID) return false;
    if (role === 'king' && step.gid === HIDDEN_TREASURY_GID) return false;
    if (!isBuildingAllowed(step.gid, context)) return false;
    const alreadyBuilt = village.buildings.some(
      (done) => done.gid === step.gid && step.level <= done.level
    );
    return !alreadyBuilt;
  });
}
