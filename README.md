# kingdomoptimizer

Travian Kingdoms build-order optimizer and building calculator.

- **Build-order optimizer** — computes the cheapest culture-point build order (res/CP greedy with requirement-cost factoring) and turns it into per-village recommendations. Villages are stored in your browser's localStorage.
- **Building calculator** — interactive per-building upgrade tables (costs, build time, population, culture points, building effects) with adjustable game speed, Main Building level, fealty and prestige — mirroring the official [Building Upgrade Calculator](https://support.kingdoms.com/en/articles/59-building-upgrade-calculator).

Game data (44 buildings, including resource fields and the modern buildings) is extracted from the official calculator's data bundle at `tk-kb.kingdoms.com` and committed as `data/gameData.json`.

## Setup and local use

Requires Node 22+.

```
npm ci          # install pinned dependencies
npm start       # dev server, opens the app in your browser
```

On Windows you can also double-click `kingdomoptimizer.cmd`.

Other commands:

```
npm run build       # production build to dist/
npm run preview     # serve the production build locally
npm run data        # refresh game data + recompute the build order
npm run data:extract  # only re-download/extract data/gameData.json
npm run data:order    # only recompute data/buildOrder.json
```

Run `npm run data` whenever the game gets a balance update, then commit the changed JSON files.

## Deployment

Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds the app and publishes `dist/` to GitHub Pages (enable Pages with source "GitHub Actions" in the repository settings). The Vite `base` is set to `/kingdomoptimizer/`, so the repository must keep that name (or adjust `vite.config.js`).

## Architecture

Two halves connected by committed JSON files in `data/`:

1. **Data pipeline** (`scripts/`, plain Node, zero dependencies, run manually):
   - `extractGameData.mjs` downloads the official calculator bundle, parses the embedded building data (costs, times, CP, effects, prerequisites, names), validates it, and writes `data/gameData.json`. Supports `--from-file <path>` for offline runs.
   - `computeBuildOrder.mjs` runs the shared greedy (`src/services/buildOrderCore.js`) over that data — no starting buildings, unlimited slots — and writes the global reference order to `data/buildOrder.json`. It replays the finished order to assert every step's requirements are met. (The SPA no longer reads this file; it's a reference artifact.)
2. **Vue 3 SPA** (`src/`, Vite + Pinia): the optimizer view computes a fresh build order **per village** by running the same `buildOrderCore` greedy live — seeded with the village's current buildings, filtered by village context (tribe / capital / city / mutually-exclusive buildings / account role) and constrained by the village's building-slot pool (20 shared slots + up to 2 extension slots; rally point, walls and water ditch have dedicated positions). Buildings that can't be placed — and the prerequisite chains that exist only to unlock them — are never recommended. The calculator view applies the official time/cost/effect formulas ported from the bundle.

Buildings are identified by their official numeric `gid` everywhere. Old (Vue 2 era) localStorage state is migrated automatically on first load.

## Supply-chain policy

- Exactly four direct dependencies (`vue`, `pinia`, `vite`, `@vitejs/plugin-vue`), pinned to exact versions — no `^` ranges (`.npmrc` sets `save-exact`).
- `.npmrc` sets `ignore-scripts=true`, so `npm install`/`npm ci` never execute package install scripts.
- Install with `npm ci`; review `package-lock.json` diffs when bumping versions deliberately.
- The data pipeline scripts use only Node built-ins.

## Notice

I am in no way skilled enough with JS or Vue to be able to write this alone. I am relying on the help of coding agents, if
any code is not up to par, please let me know. I appreciate your feedback.
