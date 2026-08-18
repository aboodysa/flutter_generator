# Orchestrator framework brief — objective-driven autonomous execution + progress reporting

**From:** Orchestrator (zen) — **To:** Claude Code (Mac, same lane as the `tools/orchestrator/` tooling) — **Date:** 2026-08-18
**Extends:** `TOKEN_OPS_TOOLING_BRIEF_CLAUDE.md` (the 6 helpers under `tools/orchestrator/`). Land that work first (commit+push), then continue with THIS brief in the same lane.

## Objective

Turn the orchestrator loops into **objective-driven autonomous execution** with **configurable progress
reporting**, separating *what we do* (execution logic) from *what we say* (reporting). The helpers set up;
this makes them a framework.

## Non-negotiables (carry over)

- Agent execution is autonomous — no step-by-step human supervision. No "should I continue?" pauses.
- Preserve every existing safety/acceptance gate: determinism checks, `[visualIntent]`/`[states]`/
  `[approval]`/`[lockfile]`/`[timestamp]`, oracle requirements, evidence/regression tests. Changing
  verbosity must NEVER change behavior (reporting is a pure observer).
- Do not ask for supervision between steps unless an explicit approval gate or genuine blocker
  requires human input (then: exactly one `[BLOCKED]` message, stop, await input).

## Progress levels (configurable, single knob)

| Level | Reports | Use |
|---|---|---|
| **L0** | completion + blockers only | batch/cron |
| **L1** | L0 + major milestones, retries | short runs |
| **L2** (default) | L1 + important decisions, findings, verification results | normal |
| **L3** | L2 + detailed execution/tool activity | debugging |

- Knob: `ORCH_PROGRESS_LEVEL` env var (default `L2`); helpers read it at each call so a change takes
  effect mid-run.
- **Auto-escalation:** on any failure/debugging path, reporting automatically jumps to L3, and returns
  to the configured level after recovery. Escalation must be automatic, not manual.
- **Meaningful state changes only** — milestones, decisions, verification results, retries, recovery,
  blockers, completion. NOT routine command narration (which is what the tooling helpers were built to
  suppress).

## Standardized message tags

Emit tags as the first token of the message so any consumer can grep/split by category:

- `[PROGRESS]` — milestone reached / phase done.
- `[DECISION]` — a decision taken (config, map, verdict, direction).
- `[VERIFY]` — a verification result (test/gate/hash/diff outcome).
- `[RECOVERY]` — retry/backoff/escalation-then-recovery of a failure.
- `[BLOCKED]` — a genuine blocker or approval gate requiring human input (stops execution).
- `[COMPLETE]` — objective met (summary + artifacts).

## Design (reporting separate from execution)

Add to `tools/orchestrator/` a tiny pure reporting module so verbosity changes cannot touch behavior:

1. **`report.sh`** (or `report_lib.sh` sourced by the helpers + the run harness):
   - `report <level_needed> <TAG> <msg...>` prints iff `ORCH_PROGRESS_LEVEL >= level_needed` (and iff a
     TTY or, for pipe consumers, an explicit `--always` for L0/L1 completion/blocker lines).
   - `report_escalate <TAG> <msg...>` → sets an internal "debug mode" ON (L3) so subsequent calls print;
     `report_recover <TAG> <msg...>` turns it back to the configured level. Auto-wired: any watchdog
     sighandler in the run harness calls `report_escalate`; on clean step completion it fires
     `report_recover`.
   - Level comparisons: numeric `0<=L0<L1<L2<L3` so the same message can target multiple levels.
2. **`run_loop.sh`** — objective-driven autonomous harness:
   - Args: objective file/path `--objective <file.md>` (a brief), `--level L2`, `--lane <tmux>`,
     current expected commit `--from <SHA>`, optional `--max-rounds N` / `--timeout` / `--until-commit <SHA>`.
   - Loop per round: check objective not already satisfied (guard), dispatch to the lane, `poll.sh
     --quiet`, on new commit apply per-round checks (run `npm run typecheck:builder` + the relevant
     `jest`/validate/tests) → `[VERIFY]`; on failure → `report_escalate` + `[RECOVERY]` with backoff,
     then resume; on `--until-commit` → `[COMPLETE]`.
   - Emits the standardized tags; level-aware; auto-escalates on failures and recovers.
   - Autonomous: no prompt between steps; only `[BLOCKED]` stops it (approval gate / genuine blocker).
3. **`objective.md` template** — the minimal objective-file contract (goal / acceptance /
   artifacts / lanes / level) that any future objective brief follows, so `run_loop.sh` can be generic.

## Constraints

- Additive only, under `tools/orchestrator/`; reuse the 6 helpers; no edits to `builder/src`.
- Reporting is a pure observer: verify by diffing behavior at L0 vs L3 (same outcome, different output).
- Keep it small and shell-only (no new deps).

## Verification (all mandatory)

1. **Level gating:** with the same objective, run at L0 and L3 → outcomes identical, output radically
   different (L0 ~ 2-4 lines, L3 verbose). Prove with a diff of the outcome artifacts.
2. **Auto-escalate/recover:** force one step to fail (e.g. a gate that fails) → observe `[RECOVERY]`
   emitted at verbose level, then benign completion returns to configured level.
3. **Tags:** every emitted line begins with one of the 6 tags; grep the run transcript to show the
   tag histogram.
4. **Autonomy:** a generated test transcript contains no "should I / continue? / permission?" prompts —
   it runs to `[COMPLETE]` (or one `[BLOCKED]`) unaided.
5. `npm run typecheck:builder` + `npx jest test/s1_visual_intent.test.ts` still green (proves gates
   unaffected by verbosity).
6. Small additive commits; push to origin/master.
7. Report ≤12 lines: files added, level-model + tags, escalation mechanism, the L0-vs-L3 proof,
   the autonomy transcript finding, gates re-run results, commit hashes.