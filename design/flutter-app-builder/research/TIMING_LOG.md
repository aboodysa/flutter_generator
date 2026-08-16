# TIMING LOG — repeated generator activities (measure → optimize → track)

Purpose: every repeated activity is timed, recorded, and optimized. This is the tracking log
(AGENTS rule 11 — kept under the project). Run `bash design/flutter-app-builder/research/measure_times.sh`
after each slice; append a row here. Machine: macbook-air-m4-1 (heavily shared — timings vary with
load; record the date + rough load so trends are honest).

## Baselines (2026-08-16, under shared load ~load-avg 40+)

| Activity | Baseline | Notes / target |
|---|---|---|
| `npm run typecheck:builder` | ~34–63s | ts-node cold start dominates; cache improves. **Target <20s** via incremental tsc (`tsc -b`/`incremental:true`) |
| `index.ts` generate (1 app) | ~16–32s | ts-node transpile startup + I/O. **Target <10s** |
| `validate.ts` (full, incl. determinism double-generate) | ~80s | Runs generate TWICE (determinism diff) + all gates. **Biggest repeated cost** — see optimization below |
| `flutter pub get` | ~23s | One-time per app; acceptable |
| `flutter analyze` | ~68s | Frontend_server cold. **Target <40s** with daemon reuse |
| `flutter test` (tasks, 19-26 tests) | >300s under load | Dominated by flutter_tools compile + machine contention. **Target: run tests ONCE per slice (goldens+verify in one pass)** |
| `flutter build web` | ~170–260s | dart2js. Runs only on expose; acceptable |

## Optimization plan (ranked by ROI)

1. **validate.ts double-generate → single-generate + in-memory determinism**
   `validate.ts` runs `index.ts` to tmp1 and tmp2 then diffs. That's 2 full generations (~2×32s)
   per validate. Keep determinism but generate ONCE and hash-compare against a committed
   `.generator-hash.json` baseline — or at minimum generate once and diff the plan.json (which is
   derived from the same code path). **Saves ~30–60s per validate across the 11-sample sweep.**
2. **tsc incremental** — `incremental: true` + `tsBuildInfoFile` so repeat typechecks skip
   unchanged files. **Saves ~15–30s per slice.**
3. **Sample sweep parallelism** — the 11-sample validate loop is sequential; run generation in
   parallel (CPU-bound ts-node, safe) and validation serially (they write to distinct dirs).
   **Saves ~50% of the sweep wall-time.**
4. **flutter analyze/test once per slice** — don't run both `--update-goldens` AND plain `flutter
   test` as separate passes when nothing visual changed; gate goldens to slices that touch UI.
5. **free_ram.sh after every batch** — kill orphaned testers + frontend_server before the next
   slice; machine showed 4 orphans after MF4's runs.

## Optimization log
| Date | Change | Effect |
|---|---|---|
| (pending) | validate single-generate + incremental tsc | measure after landing |

## How to record
After each slice: run `bash research/measure_times.sh` (or time the activities you actually ran),
append a row under "Optimization log" with the before/after. Keep the table honest about load.
