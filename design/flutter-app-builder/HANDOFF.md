# HANDOFF — main capability loop COMPLETE (round: 2026-08-16 → 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status: main capability loop declared COMPLETE

Every item the owner asked to close this round is closed, verified, and committed. This round
had three threads: (1) a SwiftUI target spike, deliberately parked; (2) completing the
Ledgerly-MVP sample to full slice coverage including the final acceptance gap (LM6); (3) working
down the `LEFTOVER_NOTES.md` queue. All three are done.

## What shipped this round

**SwiftUI target — S1 (schema/platform knob) + S2 (module skeleton) — PARKED/DEFERRED**
`ca0eb39`. Landed and verified (typecheck clean, byte-identical regen across 10 IRs, 20 gates
incl. new `[platform]`/`[swiftpkg]`/`[swiftarch]`/`[swiftdeterminism]`), then explicitly parked
per owner directive so the main capability loop could continue. Not touched further this round —
still parked, no regressions introduced by anything below (SwiftUI-target IRs weren't in the
backward-compat sweep because no sample currently opts into it; the Flutter path is unaffected by
construction, since every SwiftUI addition was additive-only per S1/S2's own hard constraints).

**Ledgerly-MVP extended to full slice coverage** `9f70dcb` + `1b297af`:
L2 (8 seed policy rules across ExpenseClaim/MealBudget/Approval), MF3 (attachment/OCR stub),
MF4 (ExpenseClaimSplit), MF6 (offline outbox), L3 (audit log + CSV export), plus the L4
login-screen localization gap (G-L4-2). `apps/ledgerly/input/ledgerly.ir.json` now exercises
L1-L5, MF1-MF6, C1-C2 — see `LEDGERLY_MVP.md` for the full slice map. Along the way, 5 real
generator bugs the multi-feature combination surfaced (LM2-LM5, oracle-tag resolution /
symbol registration / dormant Session import / multi-Waive-button test ambiguity) were found and
fixed, each with its own regression test.

**LEFTOVER_NOTES.md queue worked down**: D1, G2a, G2b, L1a, M2 (arch-linter vacuous layer
detection + the real violation it surfaced), M3 (cross-feature symbol-table collisions) all
closed `e6608f5`/`9d3b948`/`90cfd41`/`77e4ed1`. M4 (sealed-class state codegen: `scoring.ts` can
select "sealed-events" but `state.ts` never implements that branch) was root-caused but
deliberately left **OPEN** — it's a real, correctly-scoped-out generator gap, documented with its
root cause and recommendation in `LEFTOVER_NOTES.md`, not attempted this round since it's its own
slice.

**LM6 — the final Ledgerly-MVP acceptance gap — CLOSED** `9415190` + `2b6a24f`:
ledgerly's own `Approval` entity was read-only (`ApprovalRepository` had only `listApprovals`);
"approve/reject workflow" was only proven via reimbursement's wizard, not ledgerly's own list.
Fixed generally, not as an Approval-special-case:
- Added `ApprovalRepository.updateApproval` (+ `UpdateApproval` use case) to the IR.
- New shared `operations.ts` helper, `quickDecisionTargets(ir)` — identifies any entity whose
  repo has `update` but not `create` (i.e. an update-only "review queue" shape) and derives its
  quick-decision button set from the entity's own status-shaped enum values, using the existing
  `AppChip.toneForStatus` vocabulary (danger-toned value → close icon, otherwise check icon) —
  no hardcoded "approved"/"rejected" strings anywhere.
- `screen.ts` consumes it to render list-row quick-decision `IconButton`s; `test.ts` consumes the
  *same* helper to generate a matching regression test (`quick_decision_test.dart`) — one source
  of truth for both, per this generator's established pattern.
- **Root-caused a second, real bug this surfaced**: `entity.ts` only auto-upgraded a Cubit's
  Equatable `props` to full-field equality for `crudFormTargets` (create+update) entities.
  Update-only entities stayed identity-only (`props => [id]`), so Bloc's `Cubit.emit()` silently
  no-op'd on "same id, different decision" — the button looked wired but nothing visibly
  happened. Fixed by extending the same auto-upgrade to `quickDecisionTargets` entities.
- Backward-compat verified byte-identical for hr_service/tasks/work_auth (stash+regen+diff both
  ways); real `apps/ledgerly/output/app` regenerated; `validate.ts` 20/20, `flutter analyze`
  clean (only the pre-existing unrelated `split_test.dart` info-lint), `flutter test` 83/83,
  goldens refreshed.
- `LEDGERLY_MVP.md` Proof-of-MVP checklist and the LM6 leftover-note entry both updated to reflect
  reality; capture(stub)/LM7 line re-confirmed accurate as-is (by design, no UI entry point).

**CDP acceptance re-run** against the regenerated app — `apps/ledgerly/output/qa/cdp-acceptance/
LM6-approve-reject-rerun.md`: signed in as manager Khalid Aziz, navigated to `/approval`,
approved one row and rejected another live in the browser — both flipped color/status/available-
actions correctly, sibling row untouched. Budget-remaining and CSV export re-checked as
non-regression controls (both still correct, unchanged from the prior run). Screenshots were
visually confirmed in-session but couldn't be persisted as files this round — the browser
automation's `save_to_disk` didn't yield a locally-resolvable path on this machine; the notes
file documents exactly what was observed at each step as the substitute record.

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| Ledgerly-MVP (L1-L5, MF1-MF6, C1-C2 on the ledgerly sample) | ✅ complete, all Proof-of-MVP checklist items `[x]` except the CDP line (`[~]`, only because capture(stub) has no entry point by design) |
| LEFTOVER_NOTES queue | ✅ all closeable items closed; M4 correctly left OPEN (own slice) |
| SwiftUI target S1+S2 | ✅ landed, PARKED/DEFERRED per owner directive |
| M4 sealed-class codegen | OPEN — root cause documented (`state.ts` never implements the "sealed-events" branch `scoring.ts` can select), recommendation in `LEFTOVER_NOTES.md`, not attempted (own slice) |

## Verification commands
```bash
npx tsc -p builder/tsconfig.json --noEmit
npx ts-node builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter analyze && flutter test
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real, full `apps/<app>/{input,output}`
convention) + `builder/samples/*.ir.json` (smaller probes).

## Next steps (not started, for whoever picks this up)
1. M4 sealed-class state codegen — its own slice, see `LEFTOVER_NOTES.md` for root cause.
2. SwiftUI target S3+ (CRUD/rules) — currently parked; resume only per owner directive.
3. Anything from `ROADMAP.md`'s P9+ backlog (backend-gen, real auth adapters, payments) — none
   of it was in scope this round.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + briefs in `~/temp/opencode/flutter-app-builder/`.
