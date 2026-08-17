# S-P5/D2 — State placement: Loading/Error/Empty as a named, plan-recorded, state-model-conditional structural slot

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — no `builder/src` edits, no commits.
> Repo: `/root/fg-p5` (working tree HEAD `5987e51`; the brief assumed `fd120d7`, the clone HEAD).

## 1. Status

Research-only. Two scratch generations were run into `/tmp/opencode/spike_p5d2/` to ground
claims in generated output; the repository tree was not modified (`git status` clean).

## 2. Hypothesis

> "Formalizing the already-existing Loading/Error/Empty insertion point in `screen.ts` as a
> named, plan-recorded structural slot that is **state-model-conditional** (each screen renders
> exactly the triad members its own state model declares), plus composing an empty state with a
> 'New \<Entity\>' CTA and a retry/pull-to-refresh — improves the generated apps, stays
> deterministic, and lets a validator catch placement drift."

Tested as written, including whether the current insertion point is even correct today.

## 3. Ground truth

### 3.1 What exists today in the generator source

- `builder/src/generators/screen.ts:671-672` — the ad hoc insertion point, emitted into the body
  of every `_list_screen`/`_detail_screen`/`_wizard_screen`, unconditionally:

  ```dart
  if (state.status == ${statusEnum}.loading) return const LoadingState();
  if (state.status == ${statusEnum}.failure) return ErrorState(message: state.errorMessage);
  ```

  Referenced from `builder/src/generators/screen.ts:619` for the empty variant:
  `EmptyState(message: 'No results for "$_query"')` — emitted **only** for the search-filter
  branch (`filtered.isEmpty && query.isNotEmpty`), never for a simply-empty collection.

- `builder/src/generators/components.ts` — the three atoms exist in the component registry with
  semantic examples: `LoadingState` (`components.ts:60,212`), `ErrorState`
  (`components.ts:72,81`, example literally `ErrorState(message: state.errorMessage)`),
  `EmptyState` (`components.ts:84,93`). `components.ts:171-172` notes ErrorState strings route
  through `AppStrings` when locale-aware.

- `builder/src/generators/project.ts:127,135,192,223,233` — `theme: ThemeData(colorSchemeSeed:
  Colors.teal)` is hardcoded; `buildTheme()` is NOT wired anywhere. Generated
  `apps/tasks/output/app/lib/main.dart:28` shows the same. **D1 (buildTheme wiring) is
  unimplemented**, confirming SPIKE_PLAN §P5's "both unimplemented". D1 is a stated prerequisite
  for D2.

### 3.2 What the state model per archetype actually declares

- `builder/src/generators/state.ts` — `DEFAULT_STATUSES = ["initial","loading","success","failure"]`;
  builtin fields per state: `status` (the flow-status enum), `collectionField(entity)` when the
  state is collection-backed (`List<Entity>`), `errorMessage` (String?).
- **Wizard** state models name the flow-status field **`wizardStatus`**, not `status`
  (commit `0385e5d`, "B1: wizard flow-status namespaced as `wizardStatus`", per
  `CODE_CATALOGUE.md`). This is the crux of the counterexample below.
- State statuses are IR-declared: `apps/rasheed/input/rasheed.ir.json` declares
  `['initial','loading','refreshing','success','failure']` (an extra `refreshing`), proving the
  enum is a *declared* input, not a constant.
- No IR anywhere declares `"empty"` as a status value (grep of `apps/*/input/*.ir.json`,
  `builder/samples/*.ir.json` = 0 hits). **"Empty" is never a state-model member** — it is always
  a derived `items.isEmpty` list-content condition at the widget layer.

### 3.3 What generated output actually does

Grounding generations (scratch, `/tmp/opencode/spike_p5d2/`):
- `npx ts-node --transpile-only builder/src/index.ts builder/samples/wizard.ir.json \
  /tmp/opencode/spike_p5d2/wizard_out` → "Generated 31 file(s)".
- `npx ts-node --transpile-only builder/src/index.ts builder/samples/todo.riverpod.ir.json \
  /tmp/opencode/spike_p5d2/riverpod_out` → "Generated 43 file(s)".

Committed app ground truth (`apps/tasks/output/app/`):
- `lib/features/tasks/presentation/screens/task_list_screen.dart:44-45` — loading/failure checks;
  `:71` — search-only `EmptyState`; no empty-state for a plain-empty list, no retry, no
  `RefreshIndicator`, no "New Task" CTA anywhere in the screen.
- `lib/main.dart:28` — hardcoded `ThemeData(colorSchemeSeed: Colors.teal)`.
- `plan.json` — `patterns` keys = `["search","scroll","actions"]`; **no `states` key exists**.

**Counterexample — the wizard (both samples):**
- Scratch `signup_wizard_screen.dart:21-22` emits
  `if (state.status == SignupWizardStatus.loading) return const LoadingState();` and the failure
  variant, but `signup_wizard.dart` state declares `final SignupWizardStatus wizardStatus;` and
  **no `status` getter at all** → `flutter analyze` **compile error**
  ("getter 'status' isn't defined for type 'SignupWizardState'"). Generated wizard output does
  not compile today.
- Shipped `apps/work_auth/.../work_auth_wizard_screen.dart:21-22` emits the same checks against
  `WorkAuthWizardStatus.loading/failure`, but that state's `status` field is the *entity* enum
  `WorkAuthStatus?` (a wizard step's collected field), **not** `WorkAuthWizardStatus`. The `==`
  comparison is against an unrelated enum type — it compiles but is **always false** (dead
  branches; analyzer `unrelated_type_equality_checks` warning). The wizard never shows
  LoadingState/ErrorState even when it would be the semantically correct thing (load is a no-op
  for wizards; loading/failure are unreachable by design).

So the "already-existing insertion point" is broken for the wizard archetype. This also
contradicts CODE_CATALOGUE's claim that `0385e5d` "typecheck clean, validation PASSED, work_auth
22/22" — the shipped wizard output contains an unrelated-type comparison (and a hard getter error
for `wizard.ir.json`).

No failure-taxonomy types from DESIGN.md §17 (e.g. `SerializationFailure`) appear anywhere in
any generated app (`grep` over `apps/*/output/app/lib` = 0 hits). The taxonomy is a design-doc
concept; the runtime error content that exists today is the cubit's `errorMessage` string
(`catch (e) { errorMessage: e.toString() }`).

## 4. Questions

Per SPIKE_PROTOCOL §6, all answered with repository/generated-output evidence (no CDP/goldens run
— no Flutter SDK on this box; excluded in §10).

1. Is the triad universally applicable, or state-model-conditional? Does a counterexample exist?
2. Is a shared `statePlacementFor` + plan-recorded slot + validator worth it vs today's inline
   checks (which S-CTX already partly guards)?
3. Does the empty-state "New \<Entity\>" CTA reuse `crudFormTargets` (P4 precedent)? Where does
   it navigate?
4. Is Retry `OutlinedButton` → `load()` + `RefreshIndicator` deterministic, dependency-free, and
   SM-agnostic (bloc + riverpod)?
5. Does the existing Failure taxonomy (DESIGN_OPTS §17) provide deterministic runtime error copy,
   never IR?
6. Can a `[states]` gate flag a missing member without becoming a false heuristic (applicable
   contract per state model, not a blind all-three-on-every-screen rule)?

## 5. Evidence

- **Repository source:** `screen.ts:619,671-672` (placement), `components.ts:60-93,212` (atoms),
  `state.ts` (`DEFAULT_STATUSES`, builtin state fields, `wizardStatus` naming), `composition.ts`
  (`shellFor`/`searchFor`/`scrollFor`/`actionsFor`, P4 `crudFormTargets`), `plan.ts`/`gen_context.ts`
  (pattern payloads keyed by screen name), `project.ts:127+` (D1 absent), `validate.ts` (no
  `[states]` gate; existing gates include `[search]`,`[scroll]`,`[shell]`,`[actions]`).
- **Generated app:** `apps/tasks/output/app/` (`task_list_screen.dart:44-45,71`,
  `lib/main.dart:28`, `plan.json` patterns). Work_auth wizard counterexample
  (`work_auth_wizard_screen.dart:21-22`, state `WorkAuthStatus?` vs `WorkAuthWizardStatus`).
- **Scratch generations:** `wizard.ir.json` → `signup_wizard_screen.dart:21-22` + state without a
  `status` getter (compile error); `todo.riverpod.ir.json` → 43 files, proving the placement is
  SM-agnostic (the `checks` snippet is injected into both bloc and riverpod bodies).
- **No runtime/CDP/golden evidence:** no Flutter SDK on this box (`command -v flutter dart`
  empty); wizard compile defect argued statically from generated source.

## 6. Semantic contract

The decision can be derived **deterministically from IR + composition context** — no IR/schema
change needed:

- **loading** member for screen `s` ⇔ the state model for `s` declares a flow-status field whose
  enum contains a `loading` value. Today: all list/detail states → yes; **wizard** states →
  flow-status field is `wizardStatus`, loading/failure are unreachable (load() no-op) → **no**.
- **error** member ⇔ flow-status enum contains `failure` **and** the state declares an
  `errorMessage` field (all states do). Wizard → **no** (unreachable, fixes the compile bug).
- **empty** member ⇔ the state has a backing collection (`collectionField`) — i.e. this is a
  **list-content condition on `items.isEmpty`, never a status member** (confirms §3.2). Applies
  to list screens only; detail/wizard states have no collection.
- **emptyCta** ("New \<Entity\>") ⇔ `empty` **and** `crudFormTargets(ir).get(s.entity)` has
  `create` capability. Navigation = exactly the FAB path already computed in `screen.ts`
  (`${formPath}/new`, preserving the `?<fk>=<id>` forwarding for child list screens).
- **retry / refresh** ⇔ `error` (retry `OutlinedButton`) and list screens (RefreshIndicator as
  the scroll parent). Binds the already-existing cubit `load()` / riverpod `.load()`.

This is precisely "each screen renders exactly the triad members its own state model declares",
with the correction the hypothesis already allows for: **a state with no such member renders
nothing** (via `statePlacementFor(s, ir)` returning `null`/omitted).

## 7. Determinism analysis

- **Inputs:** IR screen kind + `state` model (IR-declared `statuses`, generated builtin fields) +
  entity/repo capabilities. No variable external input.
- **Selector home:** `composition.ts` — a new `statePlacementFor(s, ir)` alongside
  `shellFor/searchFor/scrollFor/actionsFor`; payload serialized into `GenerationPlan` and
  `GenContext` under a new `patterns.states` map keyed by screen name, exactly mirroring the
  `search`/`scroll`/`actions` precedent (S-CTX §2 field-by-field derivation map).
- **`GenContext`:** add a `states` Map (String → StatePlacementSpec) — same mechanical pattern as
  the existing `search`/`scroll`/`actions` maps.
- **Emitter:** `screen.ts` renders the checks block **from the payload**, replacing the hardcoded
  `:671-672` literals; a `null` spec (wizard) emits nothing.
- **Determinism gate:** `[plan-determinism]`-style check — `plan.json.patterns.states` must
  re-derive byte-identically from `composition.ts`.

## 8. Ownership analysis

- **Owner stays `screen.ts`** for emission loss; **composition.ts owns the decision**
  (single-owner posture per S-CTX: shellFor/searchFor/scrollFor/actionsFor). No generator fork;
  `screen.ts`'s existing function is *extended* to read the payload.
- Plan-recorded in `plan.json` `patterns.states` (decision-as-data); gate re-derives.
- No architectural conflict with S-CTX's existing `[search]`/`[scroll]`/`[actions]` slices — the
  slot is orthogonal (wrapping, not content).

## 9. Failure modes (each has a deterministic outcome)

| Condition | Outcome |
|---|---|
| No applicable state member (wizard: no reachable loading/failure, no collection) | Omit the branch(es) / whole spec — **fixes today's compile error** |
| Unknown/unreachable status value | Omit (never emit) — no heuristic fallback |
| Missing `items`/collection (detail/wizard) | `empty` = false; no `EmptyState` |
| Non-CRUD entity (no create capability) | `emptyCta` = false — no CTA (gate error instead: a CTA with no target is a spec bug) |
| No repo `load()` (e.g. none strategy) | retry/refresh omitted |

## 10. Architecture impact

Classification **A (pure presentation)** + light **B (interaction/state)**: LoadingState/ErrorState/
EmptyState are presentation; retry/refresh bind the *already-existing* cubit/riverpod `load()`.
The placement is a build-time composition decision and must not read runtime state content
(`state.status` is consumed only inside the emitted check, not by the selector) — S-P5/D2's core
"do not confuse runtime state content with build-time composition" is upheld by construction.

Dimensions tested: N/A — no Flutter SDK on this small box. Exclusions: no CDP interaction, no
goldens, no 320/390/768/1280 sweep, no light/dark. All are planned for the implementation slice
(§14 test matrix); the compile-correctness claim is argued statically from generated Dart.

## 11. Cost/complexity

- Generator: S (remove 2 hardcoded literals; add ~40-line selector + payload plumbing).
- IR/schema change: **none** (contrary to the hypothesis's materialization — confirmed §6).
- Runtime: S (material widgets already emitted; `RefreshIndicator`, `OutlinedButton` are stock).
- Testing: M — byte-identical proof for screens with unchanged placement, gates on all apps +
  the wizard samples (which currently **fail to compile** — the fix is a correctness fix, not a
  feature), new negative controls.
- Goldens/CDP: M (one empty-state, one error/retry, one wizard).
- Determinism risk: Low (selector is pure IR→spec).
- **Benefit worth the cost: yes** — it converts a latent compile-breaking bug into a deterministic
  contract and adds retry/empty-CTA that real apps need.

## 12. Findings

1. The triad is **not universal** — it is state-model-conditional, and today's code violates it
   for the wizard archetype: `wizard.ir.json` output has a hard getter error, `work_auth` wizard
   output has always-false (unrelated-type) branches. This is a **live generated-code defect**.
2. "Empty" is **never a status** — it is an `items.isEmpty` list-content sibling; the fixation on
   "Loading/Error/Empty triad" conflates two mechanisms. The slot should be "loading/error from
   status; empty from collection".
3. The insertion point is genuinely ad hoc (hardcoded literal, not in `plan.json`, no validator
   gate). S-CTX guards `plan.json` determinism but has no `[states]`-style placement gate.
4. D1 (`buildTheme` wiring) is **unimplemented** (project.ts hardcodes teal), confirming the
   prerequisite gap; D2 placement is orthogonal but blocks per SPIKE_PLAN §P5 sequencing.
5. P4's `crudFormTargets` cleanly answers the CTA: reuse it, navigate like the FAB
   (`${formPath}/new` with FK forwarding), no new heuristic.
6. Retry/refresh are deterministic (bind existing `load()`), dependency-free, SM-agnostic — the
   `checks` snippet already injects into both bloc and riverpod bodies.
7. The Failure taxonomy (DESIGN_OPTS §17) does **not exist as generated runtime code** — nothing
   in `apps/*/output` references it. The deterministic source that exists is the cubit's runtime
   `errorMessage` (never IR). Binding error copy to the taxonomy would require new generator work
   (a failure mapper), which is out of scope for placement.

## 13. Decision

**MODIFY.** The proposal is worth implementing but needs corrections that the evidence forces:

1. **State-model-conditional, not triad-universal**, with the selector keying off the state
   model's declared flow-status field (`status` vs wizard's `wizardStatus`) + enum members +
   collection presence. This turns a **latent generated-code compile bug** into a contract.
2. **Empty is separate from status** (list-content sibling), so "each screen renders exactly the
   members its own state model declares" is implemented as loading/error (status-derived) + empty
   (collection-derived) + emptyCta (crudFormTargets create) + retry/refresh (list/error), each a
   boolean in a `StatePlacementSpec` — and each independently conditional.
3. Keep the single-owner posture: `composition.ts` `statePlacementFor` → `plan.json` →
   `screen.ts` renders → `[states]` gate re-derives. No IR/schema change.
4. **D1 must land first** (SPIKE_PLAN §P5 prerequisite), as a separate slice; D2's placement
   doesn't depend on theme tokens but sequencing does.

## 14. Recommended implementation

### 14.1 Final semantic contract

```
statePlacementFor(s, ir) → StatePlacementSpec | null
  flowEnum    = the state model's flow-status field's enum type (wizard → "wizardStatus")
  loading     = flowEnum has "loading"
  error       = flowEnum has "failure" AND state declares errorMessage
  empty       = state has a backing collection (list archetype, items.isEmpty sibling check)
  emptyCta    = empty AND crudFormTargets(ir).get(s.entity) has create
  retry       = error AND repo has load()   → OutlinedButton → context.read<XCubit>().load()
  refresh     = list archetype AND has load() → RefreshIndicator wrapping the list scroll parent
  spec is null (emits nothing) when !loading && !error && !empty   // wizard
```

### 14.2 Slices

- **Slice 1 (D1 prerequisite):** wire `buildTheme()` in `project.ts` (replace hardcoded
  `ThemeData(colorSchemeSeed: Colors.teal)`) — separate spike/slice, TBD by its own decision.
- **Slice 2 (placement):** `composition.ts` `statePlacementFor` + `StatePlacementSpec` +
  `GenerationPlan.patterns.states` + `GenContext.states` + `index.ts` wiring; `screen.ts`
  replaces the `:671-672` literals with payload-driven emission (null spec → omit);
  **wizard emits no loading/failure** (fixes compile error in both wizard samples).
- **Slice 3 (composition):** O6.2 empty-state CTA "New \<Entity\>" (`crudFormTargets`-gated,
  FAB nav path) for the plain-empty collection case; O6.3 retry `OutlinedButton` +
  `RefreshIndicator`.
- **Slice 4 (gate):** `[states]` in `validate.ts` — re-derive `statePlacementFor` per screen,
  diff against `plan.json.patterns.states`, and scan emitted screens for the presence/absence of
  each member's marker (**applicable contract per state model** — §9 table). Negative controls:
  wizard with a loading branch → FAIL; detail screen requiring empty → FAIL (no collection);
  non-CRUD entity forcing a CTA → FAIL.

### 14.3 Test matrix

- `npm run typecheck:builder` (after each slice).
- Regenerate all apps + samples (`tasks`, `rasheed`, `work_auth`, `hr_service`, `ledgerly`,
  `todo`, `promo`, `inventory`, **`wizard`**) then `flutter analyze` — **wizard + reimbursement
  currently must fail pre-fix and pass post-fix** (stash-based before/after).
- Byte-identical proof for screens whose placement is unchanged (detail screens, search-only
  lists).
- `[[plan-determinism]]` on `patterns.states`; `[states]` negative controls.
- Goldens (390×844): loading/error-with-retry, empty-with-CTA, empty-without-CTA (non-CRUD),
  wizard. CDP probe across 320/390/768/1280 (pull-to-refresh + retry taps, a11y semantics).
- Soil verification: `npm run validate:gen` + `npm run pipeline` on the Mac (this box is
  1vcpu/1gb — no Flutter builds).

## 15. Rejected alternatives

- **ADOPT as written (triad on every screen):** rejected — reproduces the wizard compile bug and
  the "blind all-three" validator trap (Q6/C4-C8-C11).
- **Wizard gets loading/failure too (make `wizardStatus` reachable):** rejected — is a behavior
  change (wizard flow statuses are progress, not load phases); placement must follow the state
  model, not force it.
- **Validator only (no plan-recorded slot):** rejected — leaves the placement ad hoc; the slot is
  the deterministic record the gate re-derives against.
- **IR-driven empty-style flag (new schema field):** rejected — violates protocol §14
  (no schema field to make a prototype convenient); derivable from existing IR (collection +
  create).
- **Error copy from the Failure taxonomy now:** rejected for this slice — the taxonomy doesn't
  exist as generated runtime code (§12.7); binding it is a separate generator task. Placement
  keeps the deterministic `state.errorMessage` (runtime, never IR).

## 16. Open questions

- Does the owner want retry/refresh on **detail** screens too, or lists only? (Deterministic
  either way via `has load()`; recommend lists-first, detail retry in a follow-up.)
- Empty-state CTA on **child** list screens with a FK filter — confirm the existing FAB
  `?<fk>=` forwarding is the desired nav (it is what the FAB already does; likely yes).
- Whether `[states]` gate severity is error (matches `[search]`/`[scroll]`/`[actions]`) or
  warning — match existing gates, error.
- D1 buildTheme design (tokens/theme shape) — owned by its own spike, prerequisite only.

## 17. Follow-up

- Report decision **MODIFY** + evidence to the orchestrator (Zen model) on Telegram.
- Capture a brief for the implementer: Slice 2 (placement) after D1 lands; the wizard fix is the
  highest-value, previously-unnoticed correctness gain.
- When implementing on a Flutter-capable box: run goldens + CDP sweep per §14.3, and add a
  regression test that `wizard.ir.json` + `reimbursement.ir.json` output compiles under
  `flutter analyze`.
- This report is saved under `design/flutter-app-builder/research/` (research archive; brief
  allowed it here once synced).