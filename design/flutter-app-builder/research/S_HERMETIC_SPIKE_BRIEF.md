# S-HERMETIC — Spike brief (remote opencode agent)

**From:** Orchestrator (zen) — **To:** remote opencode agent (tracematrix, germany3) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding — read it FIRST).
**Spike plan:** `design/flutter-app-builder/research/SPIKE_PLAN.md` §S-HERMETIC (line ~380).
**Working copy:** your clone is at `/root/fg-p5` on this host — `git fetch && git checkout master && git pull` (or fetch+reset) to sync BEFORE starting.

## What this is

A RESEARCH SPIKE (read-only; NO commits during research; implement-last). You investigate, gather
evidence, and produce a §17 decision report with exactly ONE decision
(`ADOPT`/`MODIFY`/`REJECT`/`DEFER`/`SPLIT`/`ESCALATE`). You do NOT write generator code.

## Context (grounded, from SPIKE_PLAN §S-HERMETIC + real source)

C12 resolved-origin: generator-output determinism (string-for-string) is ALREADY proven and NOT the
gap. The real gap is one layer up: `builder/src/generators/project.ts` emits pubspec caret ranges
(`^8.1.6` etc., ~`:9-10,28-29,51-58`), and there is NO committed `pubspec.lock` per generated app —
so two byte-identical generator runs can still produce differently-behaving BUILT apps on different
days (`flutter pub get` resolves different transitive versions).

## Decisions you must close (with evidence, owner call flagged as a decision-log item)

1. **Pin strategy** — pick ONE: (a) exact pins in generated `pubspec.yaml` (drop `^`), or
   (b) keep caret ranges + commit `pubspec.lock` per `apps/<app>/output/app` and treat lockfile
   drift as a detectable reviewable diff. Compare against: the current caret values in project.ts,
   how many of the ~9 apps have an existing (untracked) lockfile, and the cost each option imposes
   on the generated-app dev loop (pinning = frozen transitive deps until the generator bumps them).
   Recommend concretely, with reasoning, and rank the dependency that most needs pinning (the 
   flutter SDK constraint vs packages like `flutter_riverpod`/`go_router`/`intl`/`http`).
2. **Toolchain pin** — from this repo's ground truth (`design/flutter-app-builder/research/
   SWIFTUI_GROUND_TRUTH.md` captured Swift tooling versions; do the Flutter equivalent): document
   the exact Flutter + Dart SDK versions the repo/CI verification targets. Look for any existing
   `flutter --version`-style records (e.g. in HANDOFF, BENCHMARK, roadmap docs). If none exists,
   say so and spec what a pinned-CI doc must contain (this repo runs Flutter on the Mac, git-repo
   has no pinned CI yet).
3. **Timestamp-absence regression** — CONFIRM (already-true per plan) that no generated file
   embeds a build timestamp (`DateTime.now()`, ISO date literals in headers). Grep the generated
   outputs under `apps/*/output/app/` (the committed ones) and `builder/samples` outputs. Spec the
   cheap `validate.ts` regression check the later implementation slice would add (grep strategy,
   which files to scan, what a header timestamp would look like).

## Evidence you must collect

- The exact caret ranges currently emitted (quote project.ts lines).
- Whether `apps/<app>/output/app/pubspec.lock` exists/untracked for the 4 committed apps
  (tasks, ledgerly, hr_service, work_auth) + samples.
- A `flutter pub get` dry comparison argument (you may NOT run Flutter on this 1GB box — argue
  statically from lockfile presence + pubspec semantics, and from the repo's own docs).
- Grep results for timestamps (command + output).
- Anything in `validate.ts` that already guards timestamp absence (it doesn't today — confirm).

## Constraints (SPIKE_PROTOCOL non-negotiables)

- READ-ONLY. No commits, no edits, no `flutter`, no `npm run`/builds on this 1GB box (heavy runs
  reserved for the Mac). Investigate + prove + decide + write the report — nothing else.
- One hypothesis isolated per claim. Cite real file:line. Prefer IR semantics over naming heuristics.
- Failure modes mandatory: for every decision, state what would falsify it.
- Do NOT do S-DEEPLINK. Do NOT do any visual-lane (S1-S7) work. This is S-HERMETIC ONLY.

## Deliverable (§17 report)

Write `design/flutter-app-builder/research/SPIKE_S_HERMETIC_REPORT.md` in YOUR clone with the
SYMMETRIC structure of the other spike reports in that folder (read `SPIKE_P5_D2_REPORT.md` for
format): objective, evidence, §12.x decision per question (CLOSED with the decision verb used),
rejected alternatives, open questions, implementation-slice spec (what the future implementer does,
verification commands), risks. Then in your chau summary state ONLY: the decision verb + the 2-3
top evidence lines + the recommended first implementation slice (~5 lines total). I (orchestrator)
will fetch your clone's new file back to the Mac for review.