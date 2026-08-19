# Lessons learned — benchmark round + kids_quiz build round (2026-08-19)

**Date:** 2026-08-19 · **Scope:** real-apps benchmark, search/keyboard bug fixes, kids_quiz app build
(wizard + gamification + ar/en/fr), L4.1 French-locale generator slice, tailnet exposure + CDP probe.
Report map: `apps/BENCHMARK_APPS_REPORT.md`, `apps/kids_quiz/input/KIDS_QUIZ_DESIGN_BRIEF.md`,
`apps/kids_quiz/input/brief.md`, `research/KIDS_QUIZ_IMPL_BRIEF_CLAUDE.md`.

## 1. Benchmark-before-build pays off — the report became the build skeleton
- The benchmark picked **work_auth** as the reference (only app with a real wizard). The kids_quiz IR
  mirrored it directly (`QuizRun` walked by both a List screen and a Wizard screen). No design re-litigation:
  the wizard shape was proven before the IR was written.
- Before the benchmark, `rasheed`/`nosql` was the untested corner. Two latent bugs surfaced only because
  kids_quiz exercised new code paths: the nosql hive-adapter broken import (never reached by any of the 6
  apps) and `fieldRole()`'s chip-only-for-status/priority/decision assumption (never hit a plain enum).
  Rule: **a new app should deliberately re-drive every declared-but-under-exercised generator path.**

## 2. Flutter web deep-links do NOT route on fresh-tab boot
- Opening `/kids_quiz/quiz-run/wizard` (or `#/quiz-run/wizard`) in a new CDP tab boots **home** — go_router
  appends its `initialLocation` (`#/question`) on startup and ignores the URL. Drive routes in the RUNNING
  app with `window.location.hash = '#/route'` (Runtime.evaluate), then re-settle — that routed correctly
  every time.
- Corollary finding: **wizard/screens are route-only. Unless the IR/sections home wires an entry point, a
  quiz nested behind a route is unreachable from the UI.** kids_quiz home = keemart sections archetype
  (floating "Add to cart" FAB is decorative). A user on the phone can't start the quiz from home today —
  real v1.1 UX gap, documented, not a generator defect.

## 3. DropdownButton for plain enum fields is real, and the AX view is hostile to it (finding #3 confirmed live)
- `q1Answer` (enum `CorrectOption`) renders as **DropdownButton**, not the choice chips the owner asked for.
  In AX: the trigger is a `button` named `Q1 Answer`, and the open menu exposes `menuitem:a/b/c/d` — raw enum
  VALUE keys, not the human labels (Earth/Mars/…). Picking via `menuitem:b` works but is opaque to a11y users.
- The generated a11y test only checks step 1, so step 2+ dropdown chips were invisible to tests. Fix per the
  implementer's recommendation: broaden `fieldRole` chip eligibility (IR-level `role:"choice"` hint or
  value-shape heuristic) → ChoiceChip everywhere, one fix for gaps #1–#3.

## 4. CDP probe mechanics (recurring, worth pinning)
- `ax()` returns a `list[dict]`, not a DataFrame — write rows manually, don't call `.to_csv`.
- `/json/new?<url>` requires **PUT** (405 on GET); `/json/close/<id>` on an already-closed tab is 404 —
  wrap both in try/except.
- After dropdown pick + Next, the AX tree can come back **empty** (semantics re-render during the step
  transition). Retry loop (poll until `ax()` non-empty, up to ~6s) before deciding the route is dead.
- Flutter web: verify routes with GET, not HEAD (404 on HEAD for flutter web-server) — old lesson, still true.

## 5. Orchestrator verification beat the implementer's self-report (both aligned, but check anyway)
- Claude reported "0 errors / 52/52 / 37/37" — the orchestrator re-ran `typecheck`, `validate.ts` (37/37),
  `flutter analyze` (0 errors) and `flutter test` (52/52) independently, plus an independent double-regen
  determinism check (`diff -r` empty). Cheap, and it's what makes "trust but verify" real. No drift found —
  but the discipline is what would've caught it.

## 6. `flutter create --platforms web` after regen is the documented web/ gap (G5) — still true
- Regeneration drops `web/`. Recreating it + `flutter build web --base-href=/kids_quiz/` worked unchanged.
  Serve `build/web` on a loopback port with an SPA fallback (the node one-liner), mount additively with
  `tailscale serve --set-path=/kids_quiz` (never clobbering existing `/`, `/api`, `/tasks`, `/keemart`,
  `/hr_service`), verify with GET 200, and re-check `tailscale serve status` shows the new mount.

## 7. L4.1 French-locale slice stayed additive and invisible to existing apps
- `locale: "enArFr"` added as a closed enum value; `_fr` AppStrings map; third `Locale('fr')`. All existing
  apps kept byte-identical outputs (determinism gate + benchmark regen diff were the guard). The rule that
  paid off: **never touch the existing enum branches — only extend.**

## 8. Claude-lane discipline repeated
- The usage dialog re-appeared mid-task (85% used) after a long session; `Escape` exits it and returns the
  lane to its local `❯` prompt with the task state intact — verify via `git log` (commit SHAs are the only
  hard signal), not the pane.
- Always `send-keys` the dispatch, then press **`Enter`** to actually submit it (plain `send-keys` leaves the
  message sitting un-submitted in the input box, looking like it ran).