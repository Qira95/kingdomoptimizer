// Extracts Travian Kingdoms building data from the official interactive
// calculator bundle (the tool embedded in the support.kingdoms.com
// "Building Upgrade Calculator" article) into data/gameData.json.
//
// Usage:
//   node scripts/extractGameData.mjs                    # download live bundle
//   node scripts/extractGameData.mjs --from-file <path> # parse a local copy
//
// Zero dependencies; requires Node >= 18 (built-in fetch).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const BUNDLE_URL = 'https://tk-kb.kingdoms.com/main.js';
const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'gameData.json');

const KNOWN_PREREQ_TYPES = new Set([
  'Building',
  'NotBuilding',
  'Tribe',
  'Capital',
  'City',
  'UniqueInAccount',
  'WonderOfTheWorldVillage',
  'Level11CapitalOrCity',
  'Level13Capital',
]);

function fail(message) {
  console.error(`extractGameData: ${message}`);
  process.exit(1);
}

async function loadBundle() {
  const fileFlag = process.argv.indexOf('--from-file');
  if (fileFlag !== -1) {
    const path = process.argv[fileFlag + 1];
    if (!path) fail('--from-file requires a path');
    return readFileSync(path, 'utf8');
  }
  const res = await fetch(BUNDLE_URL);
  if (!res.ok) fail(`download failed: HTTP ${res.status} for ${BUNDLE_URL}`);
  return res.text();
}

// The building array is embedded as a JS object literal (unquoted keys,
// bare-decimal and exponent number notation), so it cannot be JSON.parsed.
// Locate it by anchor, bracket-match to find its end, then evaluate the
// slice in an empty vm sandbox.
function extractBuildingArray(src) {
  const anchor = src.indexOf('=[{gid:');
  if (anchor === -1) fail('anchor "=[{gid:" not found — bundle format changed');
  const start = src.indexOf('[', anchor);
  let depth = 0;
  let inStr = null;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") inStr = c;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) fail('unbalanced brackets while scanning building array');
  try {
    return vm.runInNewContext(`(${src.slice(start, end + 1)})`, Object.create(null), { timeout: 5000 });
  } catch (e) {
    fail(`building array did not evaluate: ${e.message}`);
  }
}

function extractTranslations(src) {
  const names = {};
  for (const m of src.matchAll(/building_g(\d+):\{"en-US":"([^"]+)"/g)) {
    names[Number(m[1])] = m[2];
  }
  const effectLabels = {};
  for (const m of src.matchAll(/buildingEffect_([A-Za-z0-9]+):\{"en-US":"([^"]+)"/g)) {
    effectLabels[m[1]] = m[2];
  }
  return { names, effectLabels };
}

function slugify(name) {
  return name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function validate(rawBuildings, names) {
  if (!Array.isArray(rawBuildings) || rawBuildings.length < 44) {
    fail(`expected >= 44 buildings, got ${Array.isArray(rawBuildings) ? rawBuildings.length : typeof rawBuildings}`);
  }
  for (const b of rawBuildings) {
    if (typeof b.gid !== 'number' || typeof b.maxLevel !== 'number') {
      fail(`building missing numeric gid/maxLevel: ${JSON.stringify(b).slice(0, 120)}`);
    }
    if (typeof b.category !== 'string') fail(`gid ${b.gid}: missing category`);
    if (!Array.isArray(b.prerequisites)) fail(`gid ${b.gid}: prerequisites is not an array`);
    if (typeof b.levelData !== 'object' || b.levelData === null) fail(`gid ${b.gid}: missing levelData`);
    if (!names[b.gid]) fail(`gid ${b.gid}: no en-US name found in translations`);
    for (let lvl = 1; lvl <= b.maxLevel; lvl++) {
      const d = b.levelData[lvl];
      if (!d) fail(`gid ${b.gid}: levelData missing level ${lvl}`);
      const rc = d.resourceCost;
      if (
        typeof d.buildingTime !== 'number' ||
        typeof d.population !== 'number' ||
        typeof d.culturePoints !== 'number' ||
        !rc || [rc.r1, rc.r2, rc.r3, rc.r4].some((v) => typeof v !== 'number')
      ) {
        fail(`gid ${b.gid} level ${lvl}: incomplete level data`);
      }
    }
    for (const p of b.prerequisites) {
      if (!KNOWN_PREREQ_TYPES.has(p.type)) {
        fail(`gid ${b.gid}: unknown prerequisite type "${p.type}" — new game mechanic, handle consciously`);
      }
    }
  }
  const byGid = new Map(rawBuildings.map((b) => [b.gid, b]));
  const mb = byGid.get(15);
  if (!mb || Object.values(mb.levelData).some((d) => typeof d.effects?.buildingTime !== 'number')) {
    fail('gid 15 (Main Building) missing effects.buildingTime on some level');
  }
  const wh = byGid.get(10);
  if (!wh || Object.values(wh.levelData).some((d) => typeof d.effects?.storageWarehouse !== 'number')) {
    fail('gid 10 (Warehouse) missing effects.storageWarehouse on some level');
  }
  const gr = byGid.get(11);
  if (!gr || Object.values(gr.levelData).some((d) => typeof d.effects?.storageGranary !== 'number')) {
    fail('gid 11 (Granary) missing effects.storageGranary on some level');
  }
}

function toOutput(rawBuildings, names, effectLabels) {
  const buildings = rawBuildings
    .slice()
    .sort((a, b) => a.gid - b.gid)
    .map((b) => ({
      gid: b.gid,
      slug: slugify(names[b.gid]),
      name: names[b.gid],
      category: b.category,
      maxLevel: b.maxLevel,
      cultureBase: b.cultureBase,
      effects: b.effects ?? [],
      prerequisites: b.prerequisites,
      levels: Array.from({ length: b.maxLevel }, (_, i) => {
        const d = b.levelData[i + 1];
        return {
          level: d.level,
          time: d.buildingTime,
          wood: d.resourceCost.r1,
          clay: d.resourceCost.r2,
          iron: d.resourceCost.r3,
          crop: d.resourceCost.r4,
          pop: d.population,
          cp: d.culturePoints,
          effects: d.effects ?? {},
        };
      }),
    }));
  return {
    meta: {
      source: BUNDLE_URL,
      extractedAt: new Date().toISOString(),
      buildingCount: buildings.length,
    },
    tribes: { 1: 'roman', 2: 'teuton', 3: 'gaul' },
    effectLabels,
    buildings,
  };
}

const src = await loadBundle();
const rawBuildings = extractBuildingArray(src);
const { names, effectLabels } = extractTranslations(src);
validate(rawBuildings, names);
const out = toOutput(rawBuildings, names, effectLabels);
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${OUT_PATH}: ${out.buildings.length} buildings`);
