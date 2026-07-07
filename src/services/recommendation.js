import buildOrder from '../../data/buildOrder.json';
import { isBuildingAllowed } from './gameData';

export function getRecommendations(village, tribe) {
  const builtGids = new Set(village.buildings.map((b) => b.gid));
  const context = {
    tribe,
    isCapital: village.isCapital,
    isCity: village.isCity,
    builtGids,
  };
  return buildOrder.filter((step) => {
    if (!isBuildingAllowed(step.gid, context)) return false;
    const alreadyBuilt = village.buildings.some(
      (done) => done.gid === step.gid && step.level <= done.level
    );
    return !alreadyBuilt;
  });
}
