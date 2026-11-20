[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/agusher21/gta6-trophy-guide-01-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/agusher21/gta6-trophy-guide-01-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Trophy Ledger — GTA VI Trophy Guide & Tracker

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze, 28 of them hidden. Every trophy shows its official name, description and grade as PlayStation publishes them, plus a guide written in the author's own words that cites its source. The tracker saves progress in the browser (localStorage), exports it to a file and imports it back, filters by kind (story, missable, collectibles, activities, online), and has a spoiler setting that hides story trophy names and descriptions until they are earned. A roadmap section walks the order to the platinum, stage by stage, with the counts taken from the official descriptions.

## Run

Serve `app/` with any static HTTP server and open `app/index.html` in a desktop browser. No build step, no network requests at run time.

```sh
cd app
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser.

## Build the entry dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`.

## Layout

- `app/index.html`, `app/app.js`, `app/style.css` — the guide and tracker
- `app/data/trophies.json` — the 55 official trophies with guides and sources
- `screenshots/` — three renders of the running app
- `main.ts` — entry program that builds the dossier
- `vendor/makefun-frontend.ts` — make.fun's dossier library, unchanged from the kit
