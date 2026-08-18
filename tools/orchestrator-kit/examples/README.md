# examples/ — reference adapters (NOT core)

The scripts here are **project/user-specific adapters copied out of the live
`flutter_generator` repo** (`tools/orchestrator/`). They show the adapter pattern: take a
`core/`-sourced script, do one concrete project task, read machine/user settings from
`config.env`, and stay silent unless something meaningful happened. They are the model to copy,
not code to keep in the kit.

| File | What it does | What's project-specific |
|---|---|---|
| `genapp.sh` | approve → generate → validate triple for a generated Flutter app | hardcodes `builder/src/{approve,index,validate}.ts` via `npx ts-node` — replace with your project's own build/verify command chain |
| `capture_golden.sh` | writes a one-off Flutter golden-test harness and runs `--update-goldens` | assumes a generated app's package name, `Session.instance.signIn(...)`, `ReplicaApp` router, `buildTheme()` — i.e. this repo's generator output shape |
| `pdf_build.sh` | Chrome-headless HTML→PDF + ImageMagick contact sheet | machine paths, now read from `ORCH_CFT_CHROME` / `ORCH_CAPTION_FONT` in `config.env` (the recommended parameterization) |

## How to write a new adapter

1. `source` `core/init.sh` (so it picks up `config.env`).
2. Read anything machine/user-specific from `ORCH_*` env vars with `: "${VAR:=default}"`.
3. Do exactly one task; print one line per meaningful result; exit non-zero on failure.
4. If the task's verbosity should react to the progress level, `source core/report.sh` too and
   emit the standard tags (`[PROGRESS]`/`[DECISION]`/`[VERIFY]`/`[RECOVERY]`/`[BLOCKED]`/`[COMPLETE]`).
