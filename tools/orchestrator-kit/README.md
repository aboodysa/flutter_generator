# orchestrator-kit — portable, project-agnostic objective-driven orchestration

A small, shell-only kit for running **objective-driven autonomous agent loops** with
**configurable progress reporting** and **fresh-context discipline**. Copy it into any project
whose work happens through agent lanes (Claude Code, remote opencode over tmux, …) and drive
slices to `[COMPLETE]` without babysitting the loop or bloating session context.

Extracted and generalized from `flutter_generator`'s live `tools/orchestrator/` (2026-08-18).
The framework core is project-agnostic; adapters are per-project/user/machine.

## What you get

```
orchestrator-kit/
  README.md                  this file
  config.example.env         copy to config.env and edit — all ORCH_* settings live here
  core/                      GENERIC — drop-in portable, do not edit for a project
    init.sh                  shared bootstrap: sets ORCH_KIT_DIR, sources config.env
    report.sh                reporting library (L0–L3, 6 tags, auto-escalate/recover)
    poll.sh                  tmux-pane poller (--until <sha> / --idle / --timeout)
    run_loop.sh              the objective loop: guard → dispatch → poll → verify → COMPLETE
    objective.md.template    objective-file contract (copy + fill per slice)
  adapters/                  PROJECT-AGNOSTIC but owner/machine-specific — edit for your infra
    tgsend.sh                Telegram text/doc/photo (token file + chat id from config.env)
    dispatch_kill_fresh.sh   remote tmux channel: kill stale session → fresh → launch opencode
  examples/                  REFERENCE adapters from the flutter_generator repo (do not keep)
```

## Install (3 steps)

```bash
# 1. Copy the kit into the target project (one project = one kit copy)
cp -R <path>/orchestrator-kit <your-project>/tools/orchestrator
# 2. Create + edit config (uncomment/override what your project needs)
cp <your-project>/tools/orchestrator/config.example.env <your-project>/tools/orchestrator/config.env
# 3. Write the first objective (see core/objective.md.template)
cp <your-project>/tools/orchestrator/core/objective.md.template <your-project>/objectives/my-slice.md
```

Only `tmux` and `git` are required by the core; `curl` for `tgsend.sh`.

## Run

```bash
tools/orchestrator/run_loop.sh --objective objectives/my-slice.md \
  [--level L2] [--lane <tmux-session>] [--from <SHA>] [--until-commit <SHA>] \
  [--max-rounds N] [--timeout <mins>] [--repo <dir>]
```

Each round: guard (already satisfied?) → dispatch the `prompt:` into `--lane` (skipped if none) →
`poll.sh --idle` → run `check_cmd:` in the repo → `[VERIFY]`; on failure auto-escalate to L3 +
backoff + retry; on `--until-commit` (or first passing `check_cmd`) → `[COMPLETE]`. The only stops
are `[BLOCKED]` (approval gate / missing lane / max-rounds) — no "should I continue?" prompts.

## Progress levels & tags

`ORCH_PROGRESS_LEVEL` (env or `config.env`, default L2) is read fresh each call:

| Level | Reports |
|---|---|
| L0 | completion + blockers only (batch/cron) |
| L1 | L0 + major milestones, retries |
| L2 | L1 + decisions, findings, verification results (default) |
| L3 | L2 + detailed execution/tool activity (debugging) |

Any failure path **auto-jumps to L3** and returns to the configured level after recovery. Every
emitted line starts with one of `[PROGRESS] [DECISION] [VERIFY] [RECOVERY] [BLOCKED] [COMPLETE]`
so a transcript is greppable by category. Reporting is a **pure observer** — flipping the level
changes output, never behavior.

## Portability contract

- `core/` must stay generic: no project paths, no machine paths, no owner constants. Its only
  inputs are CLI flags, the objective file, `config.env`, and the git/tmux environment.
- Anything project-, user- or machine-specific goes in an **adapter** (see `adapters/` and
  `examples/`) and reads `ORCH_*` from `config.env` rather than hardcoding.
- One logical slice per objective; keep objective files small; artifacts (reports, briefs) are
  the durable state — sessions are disposable (`/clear` at slice boundaries).

## Verify the kit works

```bash
bash -n tools/orchestrator/run_loop.sh tools/orchestrator/poll.sh   # no syntax errors
tools/orchestrator/run_loop.sh --help                                # usage prints
source tools/orchestrator/core/report.sh; report 0 "[TEST]" "hello" # prints at any level
# L0 vs L3: run the same objective with --level L0 and --level L3 — same outcome, different output.
```

## Objective-file format (`core/objective.md.template`)

Plain `key: value` lines (shell-greppable, no YAML/JSON). Only `check_cmd` is required; CLI flags
override fields. See the template for the full contract (`goal`, `acceptance`, `check_cmd`,
`artifacts`, `lane`, `from`, `until_commit`, `level`, `max_rounds`, `timeout_mins`, `prompt`).
