# HANDOFF — P2 CLOSED, SPIKE M4 COMPLETE (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**P2 (per-list search) — CLOSED.** **SPIKE M4 (sealed-class state codegen) — COMPLETE, decision
MODIFY.** Both per `INTERFACE_PATTERN_CONTRACT.md`/`SPIKE_PLAN.md` sequencing; `SPIKE_PLAN.md`
updated to reflect the M4 outcome (commit `908cd84`).

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
| P2 (per-list search) | ✅ **CLOSED** this round — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **COMPLETE**, decision MODIFY — `b5eb50c`; **M4a not yet implemented** (next step) |
| S-CTX, P3, P4, P5/D2, S-HERMETIC, S-DEEPLINK | Not started — see `SPIKE_PLAN.md` for scope/sequencing |
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

1. **M4a** — implement the `scoring.ts` selector fix (own slice, small — see `SPIKE_PLAN.md` M4
   section for the exact acceptance checklist). Can run locally or on a remote opencode channel;
   zero overlap with the interface-pattern spikes below, safe to do first or in parallel.
2. **S-CTX** — composition/plan determinism contract + `[plan-determinism]` validate gate (small,
   do before P3 per `SPIKE_PLAN.md`'s sequencing rule).
3. **P3 → P4 → P5/D2** — sequential interface-pattern chain, per `SPIKE_PLAN.md` §1.
4. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
5. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.
