# SPIKE M4 — Sealed-class state codegen ("sealed-events" strategy)

## 1. Status

Research-only. No `builder/src` edits, no commits. Experimental artifacts (probe generation + evidence
harness) under `apps/rasheed/output/qa/`. No repository files outside that folder were created or modified.

## 2. Hypothesis

H1 — The `"sealed-events"` state-management strategy is **desirable** for the generated apps the builder
produces, and **implementable**.
H2 — The scoring decision that selects it (`scoring.ts` `SEALED_EVENTS_THRESHOLD`, `scoreStateStrategy`)
is **correct** (matches DESIGN §5.2 intent and fires only where sealed dispatch genuinely pays).

Both halves must be proven from evidence, and the spike is allowed to conclude either half is wrong.

## 3. Ground truth (verified first — file:line, not assumption)

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Does `StateStrategy` include `"sealed-events"` and when is it selected? | Yes. `StateStrategy = "none" \| "enum-status" \| "sealed-events"`. `SEALED_EVENTS_THRESHOLD = 8`. `scoreStateStrategy` computes `complexity = statuses.length + extraFields.length` (default statuses = `["initial","loading","success","failure"]`) and returns `"sealed-events"` when `complexity >= 8`. | `builder/src/scoring.ts:15`, `:51`, `:165-173` |
| 2 | Does `generators/state.ts` ever implement a sealed branch? | **No.** Always emits enum-status. Templates: `state_enum_status.v1`, `state_notifier.v1`, `state_wizard.v1`, `state_wizard_notifier.v1`. Zero sealed emit. Generator's own doc comment says "(enum-status strategy)". | `builder/src/generators/state.ts:30`, `:236`, `:238`, `:521`, `:523`; `grep "sealed"` in file → only comments, no branch |
| 3 | What strategy is written to plan.json? | `index.ts:633`: `strategy: tag === "state" ? arch.perStateStrategy.get(item.name) ?? "enum-status" : "default"`. `arch.ts:45` fills the map from `scoreStateStrategy(s)`. So plan.json records `sealed-events` whenever scoring selects it — the *declared* strategy and the *emitted* template can diverge. | `builder/src/index.ts:633`, `builder/src/arch.ts:42-45` |
| 4 | Do any current samples cross the threshold? | **Yes — `builder/samples/rasheed.ir.json`.** `AllExpenses` state: 5 statuses + 6 extraFields = 11 ≥ 8. All four `apps/*/input/*.ir.json` and every other sample stay ≤ 5 (enum-status). The SPIKE_PLAN §M4 claim "today no sample crosses that threshold" is **incorrect**. | `m4_evidence.ts` run (see §5); `builder/samples/rasheed.ir.json` `states[0]` |
| 5 | What do generated state files look like today? | `enum XStatus { initial, loading, success, failure }` + one `Equatable` state class with `status`/collection/`errorMessage`/extraFields + `copyWith` + `props`; Cubit `load()` emits `copyWith(status: …)`, CRUD methods mutate the collection field. Verified in `task_list.dart`, `follow_up_list.dart`, and rasheed's `all_expenses.dart`. | `apps/tasks/output/app/lib/features/tasks/presentation/state/task_list.dart:12-74`; probe `all_expenses.dart` |
| 6 | Does a validator catch the drift? | **Yes — it already exists and already fires.** `validate.ts` `[strategy-fidelity]` gate (`stateStrategyFidelity`, lines 90-112) compares plan `strategy` vs emitted `template=` header; `claimsSealed=true` vs `emitsSealed=false` → mismatch. A fresh rasheed generation FAILS it. | `builder/src/validate.ts:90-112`, `:912`; probe run §5 |
| 7 | What is the DESIGN-stated selector? | DESIGN §5.2: `stateComplexity` is computed from `stateMachines[]` (state count, transition count, guard presence); "a machine with many guarded transitions favors **sealed-events**". The implementation's per-state metric uses `StateModel.statuses + extraFields`, NOT `stateMachines`. Metric ≠ stated intent. | `design/flutter-app-builder/DESIGN.md:211`, `:378` |

## 4. Questions

Q1. Is `scoreStateStrategy`'s metric/threshold sane — does `sealed-events` fire only where exhaustive
dispatch pays (real transition/event vocabulary), or can it fire on data-field count alone?
Q2. What would the sealed implementation have to emit, and how deep do the consumer branches go?
Q3. Is sealed-events an *improvement* over enum-status for generated CRUD list/form states, with
user-visible or verifiable benefit, or is it complexity without payoff?
Q4. Is determinism preserved? Ownership? Failure modes? Cost?

## 5. Evidence

### 5.1 Repository evidence
- Scoring surface confirmed (`scoring.ts:15,51,165-173`); per-state strategy flows into plan.json via
  `arch.ts:45` → `index.ts:633`.
- `state.ts` template markers: `state_enum_status.v1` / `state_wizard.v1` (bloc), `state_notifier.v1` /
  `state_wizard_notifier.v1` (riverpod) — no `state_sealed_events.v1` ever emitted, though
  `STATE_MANAGEMENT.md` documents that template as the bloc family's "future" member and the
  DESIGN names it a peer strategy.
- Consumers that assume the enum-status shape:
  - `screen.ts:665-666` — `if (state.status == XStatus.loading) return const LoadingState(); if (state.status == XStatus.failure) return ErrorState(...)` (the status-check switch, also the P5/D2 insertion point).
  - `screen.ts:105,110-111,378-379,700,702` — `state.<collection>` reads for list body, detail
    lookup, and the L3 export block (`context.read<XCubit>().state.<collection>`). In a sealed shape
    the collection lives on a per-status subclass, so every one of these needs a sealed-aware branch.
  - `test.ts:649,696` — cubit/notifier seeding emits `status: XStatus.success` via `copyWith`; sealed
    would construct a success subclass instead.
  - `screen.ts:446` (wizard) uses `state.wizardStatus == XStatus.success` — wizard states are a
    distinct generator path (`generateWizardState`) and never score sealed today (c=4), but the
    wizard consumer pattern is the same shape-family.
  - `crud_form.ts` does not read `state.status` directly (only entity field roles), but the Cubit's
    `create/update/delete` methods (`state.ts:161-182`) mutate `state.<collection>` via `copyWith` —
    a sealed shape must rebuild the data-carrying subclass from the current one, changing that
    machinery.
- The `[strategy-fidelity]` gate exists (`validate.ts:90-112`) and is already the "plan-vs-output"
  guard SPIKE_PLAN M4 scope item 3 proposed adding.

### 5.2 Generated-app evidence
- `task_list.dart` / `follow_up_list.dart`: the canonical enum-status shape (4 statuses, `Equatable`,
  `copyWith`, Cubit CRUD) — compiles and passes tests in the shipped apps.
- `builder/output/rasheed_replica/lib/generated/all_expenses.dart` (pre-existing output of `npm run
  build:rasheed`): header `template=state_enum_status.v1`, 5-status enum + 9 fields — i.e. a
  sealed-scored state emitted as enum-status. No plan.json in that stale output (predates plan
  emission), which is why the mismatch was invisible there.

### 5.3 Probe (research artifact, `apps/rasheed/output/qa/`)
- Generated `builder/samples/rasheed.ir.json` → `apps/rasheed/output/qa/probe1`:
  `[scoring] AllExpenses → sealed-events`; plan.json `state:AllExpenses | strategy=sealed-events`;
  emitted header `template=state_enum_status.v1`.
- `validate.ts` on that output:
  ```
  [strategy-fidelity] FAIL (1)
  VALIDATION FAILED
  ```
  Mismatch string is `[fidelity] state:AllExpenses: plan strategy='sealed-events' but emitted template='state_enum_status.v1'` (`validate.ts:108`). Full log: `apps/rasheed/output/qa/validate_probe1.log`.
- Evidence harness `apps/rasheed/output/qa/m4_evidence.ts` (runs current `scoreStateStrategy` over all
  15 sample/app IRs and computes the DESIGN-§5.2 `stateMachines` metric in parallel):
  - Only `rasheed.ir.json/AllExpenses` fires sealed (idx=11). All others idx ≤ 5.
  - `sm-metric = 0` for every single state in every IR — **no IR in the repo declares any
    `stateMachines`** (rasheed has none either). Under the DESIGN-stated metric, nothing would fire.

### 5.4 Reference-app evidence (adverse to H1)
- `RASHEED_AUDIT_OUTPUT.md:142` — the repo's own reference app is **enum-status-dominant**:
  "only one `sealed class` exists in the entire codebase"; `SessionState` is `abstract`-with-subclasses,
  not sealed. Gap 6 (`:244`, severity high): "State idiom is single-class + enum status, not sealed
  states"; recommendation: enum-status as a first-class strategy, sealed exhaustiveness lint
  strategy-scoped (both already reflected in DESIGN.md:378).
- DESIGN.md:378's claim that "sealed-events [is] genuinely dominant in the largest bloc apps (16 sealed
  classes in one 194-file app)" is an external scan; the repo's own reference does not corroborate it.

## 6. Semantic contract

The sealed selection is supposed to be derivable deterministically from existing IR semantics. Two
candidate inputs exist:

- **Current selector**: `StateModel.statuses.length + StateModel.extraFields.length ≥ 8`. This is
  deterministic and IR-derived, but it measures *status/field surface*, not *transition surface*.
  Rasheed proves it fires with **zero declared transitions/events** — the exact opposite of DESIGN
  §5.2's rationale ("a machine with many guarded transitions favors sealed-events").
- **Design-stated selector**: `stateMachines[]` `states.length + transitions.length + guarded
  transitions` (the same surface `computeInputs` already sums at app level, `scoring.ts:60-63`). This
  is also fully IR-derived, deterministic, and matches the DESIGN's intent — and under it no current
  IR fires.

There is no naming heuristic involved; both are closed IR vocabularies. The defect is that the
implemented selector measures the wrong surface. **The semantic rule that makes sealed sensible is:**
`state has a declared event/transition vocabulary (stateMachines states+transitions+guards) whose
exhaustive matching pays`, not `state carries many fields`.

## 7. Determinism (§8)

- `scoreStateStrategy` is a pure function of `(StateModel, IR)`: no randomness, wall clock, env, I/O,
  or ordering. Deterministic. `[determinism] PASS (byte-identical)` on the probe confirms the whole
  generate path stays byte-identical.
- But determinism ≠ correctness of the *decision*: the wrong metric is deterministically wrong.
- **Key point for the gate:** because the strategy is IR-derived and the emitted `template=` header is a
  literal, the existing `[strategy-fidelity]` gate is a perfect negative control — a deliberately
  "declare sealed / emit enum" case already FAILs (proved by the probe). The gate needs no new work.

## 8. Ownership (§11)

- Per SPIKE_PLAN matrix: `generators/state.ts` is M4-primary; consumers are `screen.ts`,
  `generators/crud_form.ts` (cubit mutation machinery), `generators/test.ts`; `validate.ts` owns the
  gate (already shipped — `[strategy-fidelity]`, called `P3-C4` in code). `scoring.ts` owns the
  selector.
- Shared-generator rule: if the sealed family is ever implemented, it must extend the *same*
  `generateState` function (additive branch), never fork it — consistent with the P1/P3 app_shell
  precedent. No co-ownership conflict: nothing else in the roadmap touches `state.ts`.
- The scoring fix (if adopted) is a `scoring.ts`-only change; zero overlap with P3/P4/P5-D2.

## 9. Failure modes (§12)

- **Current, unmodified state:** a state scoring sealed (rasheed today) → plan claims
  `sealed-events`, template emits `state_enum_status.v1` → `[strategy-fidelity]` FAIL, validation
  blocked. This is already a **deterministic, loud** outcome (a blocking gate), not a silent fallback.
  It is only "latent" because rasheed is not in the default `pipeline.ts`/`validate.ts` sample set
  (`validate.ts:887` defaults to `expense.semantic.ir.json`).
- **After a corrected selector:** no IR fires sealed → enum-status everywhere → fidelity PASS.
  If a future IR *does* declare a real `stateMachines` surface and sealed is selected but the sealed
  template is still unbuilt, the fidelity gate fails loudly again — the correct hard-error behavior,
  not an invented fallback. Do NOT add a fallback that downgrades sealed→enum silently.

## 10. Architecture impact (§13)

Sealed-events is classification **B (interaction/state) crossing into C (data-flow)**: it changes the
state shape consumed by the screen template AND the Cubit's collection-mutation logic
(`create/update/delete` rebuild a data-carrying subclass). It is not presentation-only. The scoring
fix alone is a pure plan-time selection change (B at build time, no runtime impact).

## 11. Cost (§14)

| Item | Size | Notes |
|---|---|---|
| Fix `scoreStateStrategy` metric to the DESIGN §5.2 surface (or gate sealed behind a declared event vocabulary) | **S** (1 slice) | `scoring.ts` only; no IR/schema change; no generated-byte change for any current sample (nothing currently *correctly* scores sealed) |
| Implement sealed template family (`state_sealed_events.v1`) in `state.ts` | **M** | sealed base + per-status subclass + exhaustive `switch`/`when`; cubit CRUD mutation rebuild; ~150-250 new lines |
| Parallel consumer branches: `screen.ts` status switch + collection reads + export block, `test.ts` seeding, `crud_form.ts`-adjacent cubit mutation | **M-L** | the real size of the slice; every `state.<field>` reference needs a sealed-aware form |
| Two-shapes-in-sync maintenance forever | **High ongoing** | enum-status AND sealed must stay behaviorally identical; this is exactly the template-family maintenance burden GRILLING.md:284 warns about |
| Testing / goldens / CDP | Low for scoring fix; **M** for template (new goldens for a sealed sample; none of the 4 apps would exercise it) | |
| Determinism risk | None | pure function; gate already proves byte-identical |

**Is the user-visible benefit worth it?** No current sample or app would render a sealed state under a
correct selector. The sealed shape is invisible to the end user (loading/success/failure look the
same); the benefit is internal (compiler exhaustiveness) and is already moot because the screen
template handles the fixed status set exhaustively and `flutter test` is green on every enum-status
app. Implementing it now buys a second template family that nothing exercises.

## 12. Findings

1. The gap is real but narrower than the plan stated: exactly one IR crosses the threshold
   (`rasheed.ir.json/AllExpenses`), and the `[strategy-fidelity]` gate **already detects it** and fails
   validation loudly. The "missing gate" half of SPIKE_PLAN M4 scope item 3 is already shipped.
2. The scoring decision is **not correct as implemented**: the metric (`statuses + extraFields ≥ 8`)
   contradicts DESIGN §5.2's stated intent (`stateMachines` states/transitions/guards). Rasheed proves
   the threshold fires on **data-field count with zero transitions**. The DESIGN's own selector is the
   correct one and would fire nothing today.
3. H1 (desirable) fails the evidence test for generated CRUD apps: the reference app's dominant idiom
   is enum-status (only one sealed class); all four shipped apps and every sample are plain
   load/success/failure triads; no sample declares any `stateMachines`; exhaustive dispatch over
   4-5 trivial statuses yields no verifiable benefit over the enum+`copyWith` template that already
   compiles, tests green, and is deterministically generated. The benefit is internal idiom, not
   user-visible, and it costs a permanent second template family + consumer branches.
4. H1 (implementable) is TRUE in isolation — a sealed branch is standard Dart-3 code — but the cost
   (M-L + permanent sync burden) is not justified by any current or foreseeable generated surface.
5. Determinism and ownership are clean either way; failure modes are already deterministic (the gate
   blocks). The only genuinely broken thing in the repo today is the scoring metric, which produces a
   plan/emit mismatch on a first-class sample (`npm run build:rasheed` → validate fails).

## 13. Decision

**MODIFY.**

- **Change the per-state selector** (`scoring.ts` `scoreStateStrategy`) to measure the DESIGN §5.2
  transition/event surface (`stateMachines[]` states + transitions + guarded transitions) — or, at
  minimum, gate `sealed-events` behind the *presence of a declared event/transition vocabulary*
  (stateMachines or a non-empty declared event set), never behind `statuses + extraFields` field count.
  With the corrected selector, no current IR fires sealed → rasheed's plan/emit mismatch disappears →
  `[strategy-fidelity]` PASSes everywhere → the declared plan and emitted code are honest again.
- **Do NOT implement the sealed template family now.** It is real and implementable (not rejected as a
  concept), but no current sample exercises it under a correct selector and it is complexity without
  user-visible benefit for the CRUD triad states this builder generates. Keep the already-live
  `[strategy-fidelity]` gate as the standing guard: the moment a genuine event-rich IR arrives and
  selects sealed, the gate forces either the sealed implementation or a documented decision, instead
  of a silent enum fallback.
- Consequence to flag for the owner (roadmap C3 / `PHASE_PLAN.md` "ship enum-status AND sealed-events
  at parity", `TIMELINE.md:20`): under the corrected selector, C3 ("honor per-state sealed-events
  template") becomes inert until a real transition-rich sample exists. That is a roadmap consequence,
  not a bug.

## 14. Recommended implementation (MODIFY)

1. **Slice M4a — correct the selector** (`scoring.ts` only, ~S):
   - `scoreStateStrategy(s, ir)` recomputes complexity from `ir.stateMachines` surface
     (`states.length + transitions.length + guarded`), falling back to `enum-status` when the state
     has no machine (and no declared event set). Keep `SEALED_EVENTS_THRESHOLD` constant but now applied
     to the transition surface; default-status-only states can never reach it.
   - Update `scoring.ts`'s header comment and `arch.ts`'s call site (pass `ir`); no schema change
     (`stateMachines` is already an IR field, DESIGN §2/§5.2).
   - Regression gate: `[strategy-fidelity]` on all 4 apps + all samples (rasheed now PASSes); negative
     control already proven by the probe (declare sealed + emit enum still FAILs).
2. **Slice M4b (only when a real event-rich IR appears)** — implement `state_sealed_events.v1` as an
   additive branch in the *same* `generateState` (`generators/state.ts`), plus the consumer branches in
   `screen.ts` (status switch + collection reads + export block), `generators/test.ts` (seeding), and
   the cubit CRUD rebuild. Sizes as SPIKE_PLAN M4 estimated (M-L). Until then: **DEFER**, recorded here.
3. Document the decision log entry in `HANDOFF.md`/`LEFTOVER_NOTES.md`: M4 resolved by scoring
   correction + deferred template; note C3's new inertness.

## 15. Rejected alternatives

- **ADOPT (implement sealed now):** rejected. No sample/app benefits; only rasheed would fire, and its
  state has zero transitions; the reference app's idiom is enum-status; permanent dual-template
  maintenance cost. The SPIKE_PLAN's "no sample crosses" premise is factually wrong, and correcting it
  removes the only exercise path.
- **REJECT the strategy concept outright:** rejected. Sealed-events is a legitimate Bloc idiom
  (`DESIGN.md:378`, `STATE_MANAGEMENT.md`) for genuinely event-rich states, and a hard rejection would
  conflict with the roadmap's stated v3.4 strategy set without evidence of harm — there is simply no
  current demand. MODIFY (fix the selector, defer the template) preserves the strategy as a real,
  gated option.
- **Raise the threshold to e.g. 12 or 16:** rejected as it masks the mechanism. Rasheed would stop
  firing, but field-count would still be the metric, and any future list state with ≥4 extra fields
  would silently re-trigger the mismatch. The metric is the bug, not the constant.
- **Implement sealed behind the current metric and add consumer branches now:** rejected for the same
  evidence as ADOPT — it enshrines the wrong selector as a generation feature.

## 16. Open questions

- Does the owner want roadmap C3 (sealed parity) re-prioritized to "waiting for a transition-rich
  sample", or pulled forward speculatively? (Owner decision — this is where an ESCALATE would go if the
  roadmap promise were binding, but the evidence says the branch should wait.)
- Should rasheed.ir.json's `AllExpenses` state be trimmed (e.g. drop `refreshing`/some extraFields) or
  is it intentionally field-heavy? (Post-fix it no longer matters for the strategy, but it's the only
  sample that would have exercised sealed.)
- Does the `[state-strategy]`/`[fidelity]` gate need to also run against `builder/samples/*` in
  `npm run validate:gen`, or is the per-app convention (validate each app's own output) sufficient?

## 17. Follow-up

- Implement M4a (selector fix) as its own slice with the stated negative-control gate.
- Update `LEFTOVER_NOTES.md` M4 and `HANDOFF.md` (state: scoring corrected, sealed template deferred,
  gate already live). Move this report's summary into the spike ledger.
- Re-run `npm run validate:gen` + per-app validation after M4a: all 4 apps + all samples must be
  green, and `npm run build:rasheed` + validate must now PASS (was FAIL).
- Re-visit the sealed template family only when a real IR declares `stateMachines` (new sample or an
  owner request); at that point run a fresh ADOPT/MODIFY spike against the corrected selector.

---

### Evidence index (all under `apps/rasheed/output/qa/` unless noted)
- `probe1/` — generated app from `builder/samples/rasheed.ir.json` (scoring → sealed, emitted enum).
- `probe1/plan.json` — `state:AllExpenses | strategy=sealed-events`.
- `probe1/lib/features/expense/presentation/state/all_expenses.dart` — emitted `state_enum_status.v1`.
- `validate_probe1.log` — `[strategy-fidelity] FAIL (1)` / `VALIDATION FAILED`.
- `m4_evidence.ts` — reproducible per-IR strategy table (current metric vs DESIGN §5.2 metric).
- Repo sources: `builder/src/scoring.ts`, `builder/src/generators/state.ts`, `builder/src/arch.ts`,
  `builder/src/index.ts:633`, `builder/src/validate.ts:90-112`, `design/.../DESIGN.md:211,378`,
  `design/.../STATE_MANAGEMENT.md`, `design/.../RASHEED_AUDIT_OUTPUT.md:142,244`.
