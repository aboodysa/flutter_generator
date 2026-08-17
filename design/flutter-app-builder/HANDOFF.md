# HANDOFF — S-CTX COMPLETE, next: P3 scroll (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**S-CTX — COMPLETE** (contract + `[plan-determinism]` gate). **P2 — CLOSED.** **SPIKE M4 — FULLY
CLOSED (M4a applied).** Next per the frozen order (`SPIKE_PLAN.md`): **P3** scroll behavior.

## S-CTX — plan-determinism contract + gate, COMPLETE

Resolves grills C1 ("'ctx' undefined / determinism tautology") + C15 ("LLM-authored plan recurses
nondeterminism") — the roadmap's standing guard before P3/P4/P5-D2 (each cites plan.json in its
acceptance).

- **`research/DETERMINISM_CONTRACT.md`** — field-by-field derivation map of `GenContext` +
  `GenerationPlan` (`scoring`, `patterns.shell`, `patterns.search`, `entry.*`) with each pure
  selector cited (file:line), + the **transitivity invariant** (every helper in the closure must be
  pure — no wall clock/FS-content/network/env/randomness/mutable state/LLM).
- **`[plan-determinism]` gate in `validate.ts`** — reuses the existing `[determinism]` regeneration
  (one fresh generate), diffs the regenerated `plan.json` against the on-disk one
  (JSON.stringify compare — stable, key-stable output). Catches hand-edits, stale plans, and any
  purity leak in a plan-field helper. Additive (new field in `ValidationResult` + printout), zero
  generator changes, zero IR/schema changes.
- **Negative controls proven**: hand-edit `patterns.shell` → `[plan-determinism] FAIL (1)`;
  delete `plan.json` → `FAIL (1)` (not vacuous).
- **Verification**: typecheck clean; `[plan-determinism] PASS` on all 4 apps + all 5 samples
  (9 IRs), `[determinism]`/`[strategy-fidelity]`/`[verdict]` all still PASS.
- **Decision brief delivered** to owner first (MD + PDF with mermaid pipeline/sequence diagrams,
  shaded areas of interest — `research/SCTX_DECISION.{md,pdf}`, committed `5a67f5f`).
everywhere including the rasheed probe (was FAIL). Next per the frozen order: S-CTX → P3 → P4 →
P5/D2.

## M4a — corrected `scoreStateStrategy` selector, APPLIED

Implements `SPIKE_PLAN.md`'s M4a (the actionable half of SPIKE M4's MODIFY decision), per the
owner's directive **"no hardcoded magic numbers"**. Before, `scoreStateStrategy` fired
`sealed-events` when `statuses.length + extraFields.length >= SEALED_EVENTS_THRESHOLD (8)` (plus a
synthetic `["initial","loading","success","failure"]` status list when none declared) — while
`generators/state.ts` only ever emits `state_enum_status.v1` / `state_notifier.v1` (no sealed
template exists). rasheed's `AllExpenses` (5+6=11) selected sealed → `[strategy-fidelity]` FAIL.

Fix (`scoring.ts` only, plus the `arch.ts` call site): `scoreStateStrategy(s, ir)` now selects
`sealed-events` **purely from declared IR semantics** — a `stateMachines` entry whose state
vocabulary covers the state's declared `statuses` AND which declares a non-empty `events` +
`transitions` surface (the DESIGN §5.2 "transition surface"). No threshold constant, no synthetic
list. Every other state resolves to `enum-status`. Since no repo IR declares such a matching
machine, sealed fires nowhere today — honest with the generator, and M4b (the sealed template
family) stays deferred exactly as the spike ruled.

Verification (all green):
- `npm run typecheck:builder` — clean.
- `[strategy-fidelity] PASS` on all 4 apps (tasks/ledgerly/hr_service/work_auth) + all samples
  (todo/inventory/expense.semantic/promo/rasheed). rasheed probe refresh:
  `apps/rasheed/output/qa/validate_probe1.log` now `PASS` (was `FAIL (1)`).
- Determinism **byte-identical** across the 8-IR sweep (only `plan.json` strategy string changed on
  rasheed's `AllExpenses` entry: `sealed-events` → `enum-status`; determinism gate diffs `lib/`
  only, so unaffected).
- **Negative control still fires**: a hand-edited `plan.json` claiming `sealed-events` against an
  emitted `enum-status` template → `[strategy-fidelity] FAIL (1)` — the gate is not weakened.
- `apps/rasheed/output/qa/m4_evidence.ts` updated to the fixed signature: sealed fires in **0/25
  states across all 15 IRs**; matching-machine count 0 everywhere.

## P2 — per-list search, CLOSED

Three commits close the P2 brief (`research/P2_IMPLEMENTATION_BRIEF.md`) in full:

- `99da57b` — `searchFor`/`searchTargets` selector (`composition.ts`), `entity.primaryDisplayField`
  IR semantic (schema + `types.ts`), `screen.ts` SearchBar/filter/no-results template, `plan.json`
  `patterns.search`, new `[search]` validate gate. Also fixed a real `scroll_test.dart` fragility
  the slice surfaced (switched to `tester.scrollUntilVisible`).
- `dafe4b1` — declared `primaryDisplayField` on all 4 samples (tasks/hr_service/work_auth/ledgerly),
  regenerated real search UI + goldens. `validate.ts` 22/22 gates PASS on all 4 (`[search]` +
  `[shell]` + determinism all PASS), `flutter analyze` clean, `flutter test` green
  (36/36 hr_service, 22/22 work_auth, 83/83 ledgerly, tasks clean aside from a pre-existing
  unrelated harness issue).
- `f48e5a6` — CDP walk (ledgerly + tasks): filter-as-you-type, case-insensitive contains,
  no-results EmptyState, clear — all confirmed live on both a shelled (ledgerly) and unshelled
  (tasks) app, proving search and P1's shell compose independently. Findings under
  `apps/{ledgerly,tasks}/output/qa/p2-search/`.

Gate evidence: `[search]` PASS, `[shell]` still PASS, `[determinism]` still PASS, across all 4 real
apps — the acceptance invariant (contract §3.3) holds.

## SPIKE M4 — sealed-class state codegen, COMPLETE (decision MODIFY)

`research/SPIKE_M4_REPORT.md` (commit `b5eb50c`, remote opencode/tracematrix `germany3`) closes the
`LEFTOVER_NOTES.md` M4 item that had been root-caused but left OPEN. Investigated per
`SPIKE_PROTOCOL.md`'s research-not-implementation discipline: no `builder/src` edits from the spike
itself, decision recorded before any implementation.

**Finding — `SPIKE_PLAN.md`'s prior ground truth for M4 was wrong.** It claimed "today no sample
crosses the sealed-events threshold"; the spike's probe proves `builder/samples/rasheed.ir.json`'s
`AllExpenses` state does (11 ≥ `SEALED_EVENTS_THRESHOLD=8`), and that the already-shipped
`[strategy-fidelity]` validate gate already catches the resulting plan/emit mismatch
(`apps/rasheed/output/qa/validate_probe1.log`: `[strategy-fidelity] FAIL (1)`). The real defect is
that `scoreStateStrategy` (`builder/src/scoring.ts`) measures `statuses + extraFields` count
instead of DESIGN §5.2's stated `stateMachines[]` transition/guard surface — every IR in the repo
declares zero `stateMachines`, so the correct metric would fire sealed nowhere today.

**Decision: MODIFY.**
- **M4a (next step, not yet implemented)** — fix `scoreStateStrategy` to measure the
  `stateMachines` surface instead of field count. `scoring.ts`-only (+ `arch.ts` call-site passing
  `ir` through). No IR/schema change. Estimate S (1 slice). Unblocks `npm run build:rasheed` +
  validate, which currently FAILs.
- **M4b (deferred)** — implement the `sealed-events` template family in `generators/state.ts` +
  consumer branches (`screen.ts`, `crud_form.ts`, `generators/test.ts`). Not scheduled: no sample
  would exercise it under the corrected selector, and the cost is a permanent second
  template-family sync burden with no verifiable current benefit. Revisit only when a real IR
  declares a genuine `stateMachines` transition vocabulary.

Full decision, evidence, and rejected alternatives (ADOPT / REJECT-outright / raise-the-threshold /
implement-behind-current-metric) in `SPIKE_M4_REPORT.md` §13-§15. `SPIKE_PLAN.md` updated to match
(§0 grounding, M4 section, ownership matrix, sequencing diagram, not-scheduled register).

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (global shell) | ✅ shipped, committed `4e91e50` |
| P2 (per-list search) | ✅ **CLOSED** — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **FULLY CLOSED** — decision MODIFY (`b5eb50c`), **M4a applied** (`scoring.ts`, no threshold); **M4b deferred** until a real event-rich IR |
| **S-CTX** (plan determinism) | ✅ **COMPLETE this round** — `DETERMINISM_CONTRACT.md` + `[plan-determinism]` gate; decision brief `SCTX_DECISION.{md,pdf}` committed `5a67f5f` |
| P3 scroll, P4 actions, P5/D2 placement | **Next** — sequential, per `SPIKE_PLAN.md` §1 |
| S-HERMETIC, S-DEEPLINK | Backlog / owner call, see `SPIKE_PLAN.md` |
| Ledgerly-MVP, LEFTOVER_NOTES queue (pre-P1/P2 items) | ✅ complete (prior round, see `context_history.md`) |
| SwiftUI target S1+S2 | PARKED/DEFERRED (prior round) |

## Verification commands
```bash
npx tsc -p builder/tsconfig.json --noEmit
npx ts-node builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter analyze && flutter test
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real, full `apps/<app>/{input,output}`
convention) + `builder/samples/*.ir.json` (smaller probes, incl. `rasheed.ir.json` for the M4
probe).

## Next steps (not started, for whoever picks this up)

1. **P3 → P4 → P5/D2** — sequential interface-pattern chain, per `SPIKE_PLAN.md` §1 (P3 scroll
   first: contract rule `scroll.enabled = screen.kind ∈ {list, detail}`).
2. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
3. **M4b (sealed template family)** — deferred by design; reopen only when a real IR declares a
   genuine `stateMachines` transition vocabulary (new sample or owner request).
4. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.
