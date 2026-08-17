# HANDOFF — P3 COMPLETE, next: P4 actions (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**P3 (scroll behavior) — COMPLETE** (commit `f0254f9`). **Post-submit back-button fix —
COMPLETE** (commit `ac3939d`, RCA-007). **S-CTX — COMPLETE.** **P2 — CLOSED.** **SPIKE M4 —
FULLY CLOSED (M4a applied).** Next per the frozen order (`SPIKE_PLAN.md`): **P4** (ActionSpec v1 —
`presentation: inline|overflow|primary`, ChatGPT round-2 edit #3).

## Post-submit back button fix (RCA-007, 2026-08-17)

Owner-reported: *"after create task, there is no return to home back button"* (browser back only,
absent on iPhone). Root cause: `crud_form.ts` emitted `context.go(postSubmitPath)` after submit;
`go()` replaces the whole go_router stack, so the detail screen became the sole entry
(`canPop=false` → AppBar auto-back never rendered). Fix: `postSubmitNav` — detail path →
`context.pushReplacement('/entity/:id')` (replaces the form, keeps the list beneath it → Back
button works), list path → `go()` (home has no parent). RCA-007 + CDP evidence
(`apps/tasks/output/qa/nav-back/`) committed `ac3939d`. 13/13 IRs validate, typecheck clean, no new
analyzer issues.

## P3 — per-screen on-scroll AppBar tint, COMPLETE

Implements `INTERFACE_PATTERN_CONTRACT.md` §5 + `SPIKE_PLAN.md` §P3 via the **declared contract
rule** (ChatGPT round-2 edit #2): `scroll.enabled = screen.kind ∈ { list, detail }`.

- **`composition.ts`** — `ScrollSpec {enabled:true}` + `scrollFor(screen)` (the ONE selector that
  decides; rule inline as a versioned declared rule) + `scrollTargets(ir)` (name-keyed, same shape
  as `searchTargets`). **State-management AGNOSTIC on purpose** — unlike P2 search's bloc-only
  carve-out, the tint is pure presentation, so the riverpod sample tints too (no latent `[scroll]`
  gate gap).
- **`screen.ts`** — `scrollEnabled = !!ctx?.scroll?.get(s.name)`; `NotificationListener<ScrollNotification>`
  wrapper flips a widget-local `_scrolled` on `extentBefore > 0` (contract §5 "IR state ≠ scroll/UI
  state"); AppBar `backgroundColor: _scrolled ? surfaceContainerHighest : null` (`null` at rest =
  theme default ⇒ at-rest pixels/goldens byte-identical; `surfaceContainerHighest` is a stock M3
  token, passes the `[architecture]` raw-color gate). Riverpod list/detail → `ConsumerStatefulWidget`;
  bloc list/detail → `StatefulWidget` only when `needsLocalState = scrollEnabled || searchEnabled`.
  Template tag gains `_scroll` suffix.
- **`validate.ts`** — `[scroll]` gate + exported `scrollCheck`: re-derives via the **SAME**
  `scrollTargets`, cross-checks `plan.json patterns.scroll` (missing / wrong `enabled` / stale
  path), then scans **every** screen — list/detail must render the listener, wizard/form must NOT
  (the null-set is a *checked* claim).
- **`index.ts`/`plan.ts`/`gen_context.ts`** — `scrollByPath`, `patterns.scroll` (screenPath-keyed),
  `ctx.scroll` (name-keyed); threaded through single- and multi-feature paths.

### Verification (all green)

- typecheck clean; regen+validate **13/13 IRs** PASS (`[scroll] [search] [shell]
  [plan-determinism] [determinism] [verdict]`).
- **Negative controls (both directions):** stale `patterns.scroll["/bogus"]` → `[scroll] FAIL(1)`
  + `[plan-determinism] FAIL(1)`; listener stripped from a fresh generate → `[scroll] FAIL(1)`
  (`apps/tasks/output/qa/p3-scroll/scroll_negative_harness.ts`).
- **Byte-identical proofs:** wizard screen (`signup_wizard_screen.dart`) diff EMPTY pre/post P3
  (stash-based); list/detail at-rest renders 0/329160 px diff pre/post (CDP pixel compare).
- **CDP walk** (tasks web build on tailnet, CFT headless + shared driver): wheel-scroll over a
  300px viewport flips the AppBar `(244,251,248)→(204,218,215)` on list AND detail; scroll-back
  restores byte-identically; no overflow at 320/390/768/1280. Evidence under
  `apps/tasks/output/qa/p3-scroll/`.
- tasks (bloc) + `todo.riverpod` analyze clean; tests green (riverpod golden freshly captured;
  bloc golden_test+focus_test pass).
- **Pre-existing, NOT P3:** `test/temp_all_flows_test.dart` (P1-era harness) fails the same 5
  goldens before AND after P3 — `ArgumentError: Type TaskRepository is already registered inside
  GetIt` (harness calls `setupDependencies()` per test into a shared GetIt singleton). Not a pixel
  diff, not a regression; tracked in `LEFTOVER_NOTES.md`.
- **Decision brief delivered:** `research/P3_DECISION.{md,pdf}` + mermaid
  `research/mermaid/p3_{pipeline,sequence}.{mmd,png}` (amber = `scrollFor` + `[scroll]` gate,
  blue = decision-as-data), committed `f0254f9`.

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (global shell) | ✅ shipped, committed `4e91e50` |
| P2 (per-list search) | ✅ **CLOSED** — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **FULLY CLOSED** — decision MODIFY (`b5eb50c`), M4a applied; M4b deferred |
| S-CTX (plan determinism) | ✅ **COMPLETE** — `DETERMINISM_CONTRACT.md` + `[plan-determinism]` gate (`5a67f5f`) |
| **P3 (scroll)** | ✅ **COMPLETE this round** — commit `f0254f9`; declared rule, `[scroll]` gate, SM-agnostic, CDP-verified |
| **Back-button fix** | ✅ **COMPLETE** — commit `ac3939d` (RCA-007): `pushReplacement` after submit, in-app Back restored |
| P4 actions, P5/D2 placement | **Next** — sequential, per `SPIKE_PLAN.md` §1 |
| S-HERMETIC, S-DEEPLINK | Backlog / owner call, see `SPIKE_PLAN.md` |
| Ledgerly-MVP, LEFTOVER_NOTES queue | ✅ complete (prior rounds) |
| SwiftUI target S1+S2 | PARKED/DEFERRED (prior round) |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
npx ts-node --transpile-only apps/tasks/output/qa/p3-scroll/scroll_negative_harness.ts  # P3 negative control
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real) + `builder/samples/*.ir.json`
(9 probes incl. `wizard.ir.json` / `reimbursement.ir.json` — the wizard null-set proof targets).

## Next steps (not started, for whoever picks this up)

1. **P4 → P5/D2** — sequential interface-pattern chain per `SPIKE_PLAN.md` §1. P4 = ActionSpec v1:
   `presentation: inline|overflow|primary` (ChatGPT round-2 edit #3 — `params` dropped), same
   composition-selector + plan.json + validate-gate loop as P2/P3. P5/D2 = state-model-conditional
   triad (edit #4).
2. **`[nav]` validate gate** (from RCA-007 prevention) — assert form submit handlers use
   `pushReplacement`/`pop`, never bare `go` to a detail path; matches [scroll]/[search] posture.
3. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
3. **P1 harness bug** (`temp_all_flows_test.dart` GetIt re-registration) — pre-existing, not P3;
   candidate: make `setupDependencies()` idempotent or `GetIt.reset()` per test.
4. **M4b (sealed template family)** — deferred by design; reopen only when a real IR declares a
   genuine `stateMachines` transition vocabulary.
5. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.
