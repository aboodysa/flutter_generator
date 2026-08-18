# Token-reduction ops tooling brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Task:** Build a small library of reusable shell/Python helpers under `tools/orchestrator/` that wrap
the orchestrator's most-repeated operations, so future loops cost far fewer tokens (no more long
inline polling/monitoring loops in the orchestrator's context).

## Why

Each round I hand-type verbose bash: 40-90 iteration polling loops reading tmux panes, remote
kill+fresh+dispatch sequences, `curl` Telegram sends, Chrome-headless PDF builds, and golden-capture
harnesses. Every one of those loops lands hundreds of status lines in the orchestrator context. These
helpers collapse each repeated task to a single one-line call that prints ONLY when something
meaningful happened (commit, failure, done).

## The helpers (one concern each, add to `tools/orchestrator/`)

1. **`poll.sh`** — collapse the tmux polling loops. Usage:
   `poll.sh --lane <name> --until <SHA>` (and/or `--idle`) `[--timeout <mins>] [--quiet]`.
   Polls `tmux capture-pane`, prints NOTHING while working; prints exactly one line when a new commit
   SHA appears, when the lane shows an idle `❯` prompt, on a visible FAIL/Error, or on timeout.
   `--quiet` even suppresses the status lines; `--report` prints the last meaningful activity line.
2. **`dispatch_kill_fresh.sh`** — the remote opencode "kill stale session, fresh session, launch,
   prime prompt" sequence for tracematrix/tracematrix001 (used every spike). One call:
   `dispatch_kill_fresh.sh --host <short> --channel <name> --workdir <path> --primed` and then
   `tmux send-keys -t <name> ...` for the actual prompt. Robust to the welcome-overlay.
3. **`tgsend.sh`** — Telegram send wrapper reading the token from `~/.mac_companion/token`:
   `tgsend.sh text "msg"` and `tgsend.sh doc <file> "caption"` / `tgsend.sh photo <file> "caption"`,
   chat hardcoded `1117739189`. Prints nothing on success.
4. **`pdf_build.sh`** — the Chrome-headless HTML→PDF used for every evidence/report PDF:
   `pdf_build.sh <in.html> <out.pdf>` using the CFT chrome path; also `--contact <dir|list> <out.png>`
   to build a side-by-side contact sheet from N pngs with a caption strip (needs working font handling;
   the current `convert -annotate` failed with "unable to read font" — find a font that exists on macOS,
   e.g. `/System/Library/Fonts/*.ttf`, and pin it).
5. **`capture_golden.sh`** — generate+run a one-off golden capture harness for a generated app:
   `capture_golden.sh --app <out/app> --pkg <rasheed_replica_X> --screen <S> --cubit <C> --route <r>`
   (writes the cap_test.dart from the two known-good templates — BlocProvider+theme vs Router+Session —
   picks template by an `--auth` flag, runs `flutter test test/cap_test.dart --update-goldens`).
6. **`genapp.sh`** — the approve→generate→validate triple used every regeneration:
   `genapp.sh <ir> <out>` prints one line per stage result. (approve.ts / index.ts / validate.ts.)

## Constraints

- Additive only: new files under `tools/orchestrator/`. No edits to existing scripts.
- Each helper is a single purpose; `set -euo pipefail` where sensible; no secrets constants beyond
  reading the Telegram token path; args validated with a tiny usage() fallback.
- Robust to being interrupted (traps optional, but prefer no background daemons).
- macOS zsh/bash only (this repo runs on the Mac).

## Verification (all mandatory)

1. Create a scratch wrappers dbg dir and run each helper with `--help`/no-args to show usage without
   side effects (esp. `tgsend.sh`/`pdf_build.sh` must not send/build when args missing).
2. Actually exercise (idempotent case):
   - `tgsend.sh text "tooling test"` → appears in Telegram.
   - `pdf_build.sh <a tiny html> <out.pdf>` → valid PDF; `--contact` of 2 known pngs → contact sheet
     with visible caption text.
   - `genapp.sh apps/tasks/input/tasks.ir.json /tmp/scan_out` → exit 0, `[verdict] PASS` line.
   - `poll.sh --lane s-hermetic --until <current HEAD> --timeout 1 --quiet` → exits within 1 min
     printing the "reached SHA" line (the lane is idle; if it can't reach, document expected behavior).
   - `dispatch_kill_fresh.sh --help` (do NOT actually kill any real session during testing — guard the
     destructive path with an explicit `--yes` flag and verify a dry run refuses without it).
3. `shellcheck` the scripts if installed (SKIP if not installed). Report which helpers were fully
   tested vs dry-run-only.
4. Commit small slices; push to origin/master.
5. Report ≤12 lines: file list, one-line behavior per helper, verification results incl. the
   --yes guard check, commit hashes.