// One-time migration of the old Vue 2 app's vuex-persist state
// (localStorage key "vuex") into the new per-store keys.
// The old key is left untouched so the old app still works if needed.

const NAME_TO_GID = {
  academy: 22, bakery: 9, barracks: 19, brewery: 35, brickyard: 6,
  citywall: 31, cranny: 23, earthwall: 32, embassy: 18, grainmill: 8,
  granary: 11, greatbarracks: 29, greatstable: 30, horsedrinkingthrough: 41,
  ironfoundry: 7, mainbuilding: 15, marketplace: 17, palace: 26,
  palisade: 33, rallypoint: 16, residence: 25, sawmill: 5, smithy: 13,
  stable: 20, stonemason: 34, tournamentsquare: 14, townhall: 24,
  tradeoffice: 28, trapper: 36, treasury: 27, warehouse: 10,
  waterditch: 42, workshop: 21,
};

export function migrateLegacyState() {
  if (localStorage.getItem('kingdomoptimizer:villages')) return;
  const legacyRaw = localStorage.getItem('vuex');
  if (!legacyRaw) return;

  let legacy;
  try {
    legacy = JSON.parse(legacyRaw);
  } catch (e) {
    console.warn('legacy vuex state is not valid JSON, skipping migration', e);
    return;
  }

  const villages = (legacy.village?.villages ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    isCapital: Boolean(v.isCapital),
    isCity: false,
    buildings: (v.buildings ?? []).flatMap((b) => {
      const gid = NAME_TO_GID[b.name];
      if (!gid) {
        console.warn(`migration: unknown building name "${b.name}" dropped`);
        return [];
      }
      return [{ id: b.id, gid, level: b.level }];
    }),
  }));

  if (villages.length > 0) {
    localStorage.setItem('kingdomoptimizer:villages', JSON.stringify({
      activeVillageId: legacy.village?.activeVillageId ?? villages[0].id,
      villages,
    }));
  }
  if (legacy.tribe) {
    localStorage.setItem('kingdomoptimizer:settings', JSON.stringify({ tribe: legacy.tribe }));
  }
  console.info('migrated legacy kingdomoptimizer state from localStorage["vuex"]');
}
