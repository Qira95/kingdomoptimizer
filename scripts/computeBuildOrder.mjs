// Computes the cheapest culture-point build order from data/gameData.json.
//
// Thin wrapper around src/services/buildOrderCore.js — the same slot-aware
// greedy the app runs per village. Here it runs with no starting buildings,
// unlimited slots and no availability filter, producing the global reference
// order committed to data/buildOrder.json.
//
// Usage:
//   node scripts/computeBuildOrder.mjs [--pretty]
//
// Zero dependencies; requires Node >= 18.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeBuildOrder } from '../src/services/buildOrderCore.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'data');
const OUT_PATH = join(DATA_DIR, 'buildOrder.json');

const gameData = JSON.parse(readFileSync(join(DATA_DIR, 'gameData.json'), 'utf8'));
const byGid = new Map(gameData.buildings.map((b) => [b.gid, b]));

const buildOrder = computeBuildOrder(gameData, { validate: true });

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
