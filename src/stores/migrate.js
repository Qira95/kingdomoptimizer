// One-time localStorage migrations, run before the stores hydrate.
//
// Two upgrades are handled, newest first:
//  1. Single-server state (kingdomoptimizer:villages + :settings) -> the
//     multi-server model (kingdomoptimizer:servers), wrapping everything in
//     "Server 1" and pulling tribe/role/speed onto that server.
//  2. The original Vue 2 vuex-persist blob (localStorage "vuex", name-based)
//     -> the gid-based single-server model, which step 1 then wraps.
// Each source key is left untouched so older builds still work if needed.

const SERVERS_KEY = 'kingdomoptimizer:servers';
const VILLAGES_KEY = 'kingdomoptimizer:villages';
const SETTINGS_KEY = 'kingdomoptimizer:settings';

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

function readJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`ignoring corrupt state for ${key}`, e);
    return null;
  }
}

// Vue 2 vuex blob -> { activeVillageId, villages } in the gid-based shape.
function villagesFromLegacyVuex() {
  const legacy = readJson('vuex');
  if (!legacy) return null;

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

  if (villages.length === 0) return null;
  return {
    activeVillageId: legacy.village?.activeVillageId ?? villages[0].id,
    villages,
    tribe: legacy.tribe,
  };
}

export function migrateLegacyState() {
  if (localStorage.getItem(SERVERS_KEY)) return;

  const villagesState = readJson(VILLAGES_KEY) ?? villagesFromLegacyVuex();
  if (!villagesState || !Array.isArray(villagesState.villages) || villagesState.villages.length === 0) {
    return;
  }

  const settings = readJson(SETTINGS_KEY) ?? {};
  const server = {
    id: 1,
    name: 'Server 1',
    speed: settings.calc?.speed ?? villagesState.speed ?? 1,
    tribe: settings.tribe ?? villagesState.tribe ?? 'roman',
    role: settings.role ?? 'king',
    activeVillageId: villagesState.activeVillageId ?? villagesState.villages[0].id,
    villages: villagesState.villages.map((v) => ({
      id: v.id,
      name: v.name,
      isCapital: Boolean(v.isCapital),
      isCity: Boolean(v.isCity),
      fieldLevel: v.fieldLevel ?? 0,
      targetCp: v.targetCp ?? 0,
      extensionSlots: v.extensionSlots ?? 0,
      buildings: v.buildings ?? [],
    })),
  };

  localStorage.setItem(SERVERS_KEY, JSON.stringify({ activeServerId: 1, servers: [server] }));

  // Drop the now per-server keys from settings so they don't linger.
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      view: settings.view ?? 'optimizer',
      calc: {
        mainBuilding: settings.calc?.mainBuilding ?? 1,
        fealty: settings.calc?.fealty ?? 0,
        prestige: settings.calc?.prestige ?? 0,
      },
    })
  );

  console.info('migrated kingdomoptimizer state into the multi-server model');
}
