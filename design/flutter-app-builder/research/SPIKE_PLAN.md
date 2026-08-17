# Spike plan — after P2 (interface-pattern roadmap continuation)

> Planning-only artifact. Read-only research; no code changed to produce this. Grounded against
> `INTERFACE_PATTERN_CONTRACT.md`, `GRILL_S0_REPLY.md` (16 challenges), the shipped P1
> (`composition.ts` `shellFor`, `generators/app_shell.ts`, `validate.ts` `[shell]` gate) and the
> in-flight P2 (`composition.ts` `searchFor`/`searchTargets`, `entity.schema.json`
> `primaryDisplayField`, `screen.ts` search block — confirmed via `git diff`: `validate.ts` has
> **no** `[search]` gate yet and no sample regen/CDP evidence in this snapshot, so treat P2 as not
> fully closed; the spikes below assume it lands first).

## 0. What's actually true right now (grounding, not assumption)

- `composition.ts:111-130` `shellFor` already answers grill **C2** in full: `features.length <= 1`
  → `null` (covers N=0 and N=1 identically — no shell), `2..5` → `NavigationBar`, `>5` → hard
  `throw` (`composition.ts:113-115`), no fallback pattern exists or is planned. **C2: RESOLVED,
  no spike needed** — just cite it.
- `composition.ts:155-166` `searchFor` already answers grill **C4**: `enabled` reads
  `entity.primaryDisplayField` (`entity.schema.json` new key, `types.ts` new field), a declared
  IR semantic — not a `title`/`name`/`label` name-guess. **C4: RESOLVED** (in-flight P2).
- P2's brief (`P2_IMPLEMENTATION_BRIEF.md` "Out of scope") already declares **C5**/**C6** closed
  by scope-lock: single field, `contains`-only, in-memory, no server-query. **C5/C6: RESOLVED by
  scope exclusion** — server-query search is explicitly a *different, unscheduled* pattern
  (call it `P2b` if ever picked up), not a "future path" inside P2's architecture.
- `GenContext` (`gen_context.ts:12-21`: `pkg`, `outDir`, `ir`, `sm`, `search`) and `GenerationPlan`
  (`plan.ts:26-37`) are **entirely IR-derived** today — `sm` comes from `scoring.ts` (deterministic
  scoring over IR), `search`/`shell` come from `composition.ts` selectors that read only IR. There
  is no LLM-authored plan/ctx anywhere in this path; the LLM only touches `requirements.ts` (NL→IR)
  and `business_rule_agent.ts` (NL→RuleModel), both upstream of `plan.ts`/`composition.ts` and
  gated by `approve.ts` human attestation (`AGENTS.md` rule 5). This directly undercuts grill
  **C1**'s and **C15**'s premise that "ctx" or "the plan" might be a second, unpinned LLM output —
  it isn't, today. What's missing is a **written contract saying so** plus a **regression check**
  that would catch it if that ever stopped being true. That's spike **S-CTX** below (small; do it
  first so every later spike inherits a stated, tested invariant instead of an implicit one).
- Capabilities are **already a closed vocabulary in practice**: `operations.ts` exposes a fixed,
  enumerable set of deterministic predicates over IR — `hasExport` (`:431-433`), `hasAudit`
  (`:381-383`), `hasAuth` (`:463-465`), `hasFullCrud`/`crudOperations` (delete detection, `:39-52`),
  `hasBudget`, `hasOutbox`, `hasSplitGroups`, `hasAttachments`, `hasPolicyRules`, `hasMoneyFields`,
  `hasTenantScoping`. There is **no** free-form `capabilities: string[]` field anywhere in
  `types.ts` or the schemas (`grep` confirmed). **C16 is resolved by precedent** — P4 just has to
  make the export/delete/audit/write subset official and state the closed-vocabulary rule
  explicitly (see P4 below and the decision log).
- `DESIGN_OPTS.md §10` "Slice D2 — CTA + feedback" (`:209-212`) bundles extended FAB, confirm
  dialog, success snackbar, error-retry, and composed empty state — **none of it is implemented**
  (`grep` for `buildTheme`/`RefreshIndicator`/`FloatingActionButton.extended` in
  `components.ts`/`screen.ts`/`project.ts` returned nothing). Slice **D1** ("Theme wiring") is also
  unimplemented. This is a different "D2" than the unrelated "UIX Slice D2" (ChoiceChip tint,
  `LEFTOVER_NOTES.md` — already `WONTFIX`'d); don't confuse the two when reading old notes.
  `LoadingState`/`ErrorState`/`EmptyState` exist today only as bare widgets
  (`components.ts:212-233`), wired ad hoc inline in `screen.ts:665-666` (status-check switch) and
  `screen.ts:613` (P2's own no-results EmptyState). **This confirms C11 is real**: there is today
  no single *placement* owner — the placement logic already lives ad hoc inside `screen.ts`, and
  `DESIGN_OPTS.md` was scoped before the contract existed, so it never names a placement owner
  either. P5/D2 below fixes this.
- SPIKE M4 (complete, decision **MODIFY** — `SPIKE_M4_REPORT.md`, commit `b5eb50c`) corrected this
  entry: the claim below in the original grounding pass ("no sample crosses that threshold") was
  **wrong**. `builder/samples/rasheed.ir.json`'s `AllExpenses` state (5 statuses + 6 extraFields =
  11 ≥ `SEALED_EVENTS_THRESHOLD=8`, `scoring.ts:15,51,165-173`) already fires `sealed-events`, and
  the already-shipped `[strategy-fidelity]` gate (`validate.ts:90-112`) already catches the
  resulting plan/emit mismatch (probe: `plan.json` declares `sealed-events`, the emitted file's
  `template=state_enum_status.v1` header proves otherwise → gate FAILs —
  `apps/rasheed/output/qa/validate_probe1.log`). The real defect is upstream: `scoreStateStrategy`'s
  metric (`statuses.length + extraFields.length`) counts the wrong surface — DESIGN §5.2 defines
  sealed-events off the `stateMachines[]` transition/guard surface, which is zero in every current
  IR (`apps/rasheed/output/qa/m4_evidence.ts`, all 15 sample/app IRs). See the M4 section below for
  the resolved scope (MODIFY: fix the selector now, defer the template family).
- `project.ts:9-10,28-29,51-58` pins Flutter/Dart deps with caret ranges (`^8.1.6`, `^17.1.0`,
  `^3.0.0`, …), and no `pubspec.lock` is emitted by the compiler. Generator **output** determinism
  (string-for-string) is already the proven acceptance invariant (P1/P2's own diff harnesses) — the
  actual hermeticity gap grill **C12** points at is one level up: `flutter pub get`/`build` on two
  different days can resolve different transitive versions from the caret ranges. No generated
  header embeds a timestamp (`grep` for `Date.now()`/`toISOString` in generator headers: no hits)
  — that part of C12 is already fine.
- No deep-link or restoration code exists anywhere in `route.ts` (`grep` empty) — grill **C14** is
  fully open, zero groundwork, real spike.

## 1. Ordered spike list

Sequencing rule: **S-CTX first** (cheap, and every later spike's acceptance checklist cites its
invariant). **M4 is now spike-complete** (decision MODIFY, commit `b5eb50c`) — its resolved next
step, **M4a**, is a `scoring.ts`-only fix with zero file overlap with the interface-pattern spikes
(`composition.ts`/`screen.ts`/`route.ts`), so it can run **in parallel** with P3/P4 at any point,
doesn't block or get blocked by them. Everything else is sequential per the frozen roadmap
(contract §8) because each later spike's `screen.ts`/`app_shell.ts` edits assume the earlier ones
already landed at named insertion points (see §2 ownership matrix's Notes column).

```text
S-CTX  → P3 → P4 → P5/D2  (sequential; screen.ts/app_shell.ts insertion-point chain)
M4                          (parallel track, no overlap)
S-HERMETIC                  (independent infra; any time, recommended after P5/D2)
S-DEEPLINK                  (backlog; depends on P1 only, lowest priority — owner call)
```

---

### S-CTX — Composition/plan determinism contract + plan-vs-IR validator

**Resolves:** C1 (ctx tautology), C15 (LLM-authored-plan recursion).

**Objective:** Turn the already-true "ctx/plan is 100% IR-derived" fact (§0 above) into a written
invariant plus a check that fails if it ever stops being true.

**Scope:**
1. A short section in `INTERFACE_PATTERN_CONTRACT.md` (or a new `research/DETERMINISM_CONTRACT.md`)
   enumerating exactly what composes `GenContext` (`gen_context.ts:12-21`) and `GenerationPlan`
   (`plan.ts:26-37`) today, field by field, with each field's derivation function cited
   (`shellFor`, `searchTargets`, `scoring.ts`'s state-management selector) — i.e. the "ctx
   definition" grill C1 says is missing.
2. A `[plan-determinism]` gate in `validate.ts`: re-run `shellFor`/`searchTargets`/the sm selector
   against the IR the same way `index.ts` does, and diff the result against `plan.json`'s
   `patterns.*` block already on disk. Catches any future accidental hand-edit or non-deterministic
   source creeping into plan construction — this is the "plan-vs-IR validator" C1/C15 ask for.
3. No generator changes. No IR/schema changes.

**Non-goals:** Does not change how the plan is built, only proves + guards what already exists.

**Owner modules:** `validate.ts` (new gate only), docs.

**Acceptance:**
- [ ] New gate added, additive, passes on all 4 apps + `builder/samples/*`.
- [ ] A negative-control test (hand-edit `plan.json`'s `patterns.shell` after generation) makes the
      gate fail — proves it isn't vacuous (same discipline as the `[symbols]`/`M2` precedent).
- [ ] Doc section merged into the contract, cited by section number from here on.

**Estimate:** S (1 slice).

---

### P3 — Scroll behavior (cosmetic, presentation-only)

**Contract:** §5. **Resolves:** C7 (delineate viewport-scroll from pagination).

**Objective:** M3-Expressive on-scroll AppBar color-fill + optional shell nav-bar hide-on-scroll,
exactly as scoped in the contract — presentation only, no IR change, no persisted state.

**Scope:**
1. `composition.ts` gains a `scrollFor(screen): ScrollSpec | null` selector, same shape as
   `searchFor`/`shellFor` — deterministic, IR-derived (e.g. `screen.type === "list" || "detail"`),
   emits `plan.json` `patterns.scroll` per the `patterns.shell`/`patterns.search` precedent.
2. `screen.ts`: a `NotificationListener<ScrollNotification>`-driven AppBar tint, inserted at the
   **AppBar-construction insertion point** — a new, separate block from P2's SearchBar block
   (`screen.ts:613` area) and separate from the status-check switch (`screen.ts:665-666`, owned by
   P5/D2 below). Purely visual `AnimatedContainer`/`Color.lerp`, no new state field.
3. `generators/app_shell.ts` (P1's file): **if** nav-bar hide-on-scroll is in scope, this is a
   direct extension of `generateAppShell` (same function, additive parameter for a scroll
   controller callback) — never a fork. This is the concrete instance of the "co-owned generator"
   rule in §2 below (P3 extends P1's function, doesn't duplicate it).
4. `[scroll]` validate gate (additive): screens with `patterns.scroll` render the scroll listener;
   others don't.

**Explicit non-goals (contract §5 + grill C7):**
- No pagination / fetch-on-scroll / infinite list. That is data/state, not cosmetic, and has **no
  owner in the current roadmap** — flag it here as a real future gap (candidate name: a `P6
  pagination` spike) rather than silently letting P3 grow into it.
- No scroll-offset persistence across app restart. `StatefulShellRoute.indexedStack` (P1) already
  keeps scroll position alive for the *lifetime of the running app* when switching tabs — that's
  existing P1 behavior, not new P3 work. Process-death restoration is C14 (S-DEEPLINK)'s problem,
  not P3's.
- No `ListView` vs `GridView` vs `CustomScrollView` selection (that's grill C8, see decision log —
  explicitly out of scope, no current sample needs it).

**Owner modules:** `composition.ts` (new selector), `screen.ts` (new AppBar-tint block only),
`generators/app_shell.ts` (extend, don't fork), `validate.ts` (new gate), `plan.ts` (type only).

**Acceptance:**
- [ ] Typecheck; byte-identical proof for any screen without `patterns.scroll` (should be none
      today if the predicate is "all list/detail screens", so instead prove byte-identical for a
      screen where the selector deliberately returns `null`, e.g. wizard/form screens).
- [ ] `[scroll]` gate PASS on all 4 apps; `[shell]`/`[search]`/`[plan-determinism]` still PASS.
- [ ] CDP: scroll a long list on ledgerly/tasks, verify AppBar tint transitions, no overflow
      320/390/768/1280, findings under `apps/<app>/output/qa/p3-scroll/`.
- [ ] Goldens regenerated (cosmetic-only diffs expected).

**Estimate:** S–M (2 slices: selector+screen.ts, then app_shell.ts extension + CDP).

---

### P4 — Capability-driven actions (export/delete/audit/write action map)

**Contract:** §6. **Resolves:** C9 (action schema), C10 (build-time vs runtime), C13 (icon
allowlist, extended), C16 (closed capability vocabulary, formalized).

**Objective:** Derive a per-screen action list from existing IR capability predicates
(`operations.ts`), rendered by `screen.ts`/`crud_form.ts` from a decided payload — never
"detail screen → always show …".

**Scope:**
1. `composition.ts` gains `actionsFor(screen, entity, repo, ir): ActionSpec[]`, the fourth selector
   alongside `shellFor`/`searchFor`/`scrollFor`. Reads **only** the existing closed set:
   `hasExport`/`resolveExport` (`operations.ts:408-433`) → `Export`, `crudOperations(...).delete`
   (`:39-52`) → `Delete`, `hasAudit`/`isAudited` (`:381-387`) → `Audit`, `hasFullCrud`/
   `crudFormTargets` write surface (`:73-85`) → `Save` (extended FAB on the form, not the list —
   contract §6 explicitly says "extended FAB on form", so this touches `crud_form.ts`'s FAB, a
   **different** insertion point than P1/P2/P3's list-template blocks). **No other capability
   yields an action** — this is the explicit closed-vocabulary rule C16 asked for; adding a fifth
   action kind requires a new named predicate in `operations.ts` **and** a contract §6 update, not
   an ad hoc string.
2. **Action schema** (closes C9): each `ActionSpec` carries `{ kind, label, icon, enablement,
   confirm?: {message}, params?: [...] }`. Reuse the `quickDecisionTargets` precedent
   (`operations.ts:101-122`, the LM6 pattern) for per-row enablement — e.g. `Delete`'s enablement
   predicate can reference the same referential-integrity checks that pattern already established.
   Confirm dialogs default on for `Delete` (destructive), off for `Export`/`Audit`/`Save`.
   Overflow grouping: >2 actions on a detail screen collapse into the existing "…" `PopupMenuButton`
   pattern already implied by the contract text; ≤2 render as inline `IconButton`s.
3. **Build-time vs runtime split** (closes C10): P4 emits actions strictly from **build-time**
   capability (the IR declares export/delete/audit/write exists at all — one app, one action set,
   same for every user). **Row-level / per-user runtime authorization is explicitly out of scope**
   — the generator has no runtime auth model to gate against (this is the same gap
   `LEFTOVER_NOTES.md` A1 already flagged: `kPersonas` are static/generator-derived, no signed
   claims). Document this boundary in the brief so nobody mistakes "action rendered" for "action
   permitted"; a future auth-integration spike (dependent on the MF2-evolution roadmap item, not
   scheduled here) would add a runtime guard **around** P4's build-time action, not replace it.
4. **Icon allowlist** (extends C13's P1 precedent): reuse `composition.ts`'s
   `KNOWN_SHELL_ICONS`/stem-map pattern (`:79-88`) for a second, small fixed map (action kind →
   `Icons.*`, e.g. `Export→Icons.file_download`, `Delete→Icons.delete_outline`,
   `Audit→Icons.history`, `Save→Icons.save`/`FloatingActionButton.extended`). Glyph-absence is
   impossible by construction (finite, hand-picked set); **collision is allowed by design** — the
   allowlist doesn't promise bijection, same posture P1 already ships (`user`/`auth` prefixes
   already share `Icons.person` today with no dedupe error). State this explicitly rather than
   leaving it implicit.
5. `[actions]` validate gate (additive): for each screen, the rendered action set matches
   `actionsFor`'s decision; no action renders for an absent capability; confirm dialogs present
   for `Delete`.

**Explicit non-goals:** No runtime authorization/permission UI (C10, above). No arbitrary/custom
action kinds beyond the four named ones (C16). No undo (matches `DESIGN_OPTS.md` D2's own "v1: no
undo" scoping for the adjacent success-snackbar work).

**Owner modules:** `composition.ts` (new selector + icon map), `screen.ts` (detail-screen "…" menu
block — new insertion point, doesn't touch P2's/P3's blocks), `crud_form.ts` (extended FAB — new
generator this roadmap hasn't touched yet), `operations.ts` (no new predicates needed — all four
already exist; add only the enablement-predicate reuse), `validate.ts` (new gate), `plan.ts`
(type only).

**Acceptance:**
- [ ] Typecheck; byte-identical for screens with no applicable capability.
- [ ] `[actions]` gate PASS on all 4 apps; all prior gates still PASS.
- [ ] CDP: export/delete/audit flows exercised where each app has the capability (ledgerly has
      export+audit, per LM1; delete needs a sample with a delete-capable repo — check before
      claiming coverage), confirm dialog appears + cancels/confirms correctly, no overflow.
- [ ] Goldens regenerated for screens gaining action UI.

**Estimate:** M (3 slices: selector+schema, screen.ts detail menu, crud_form.ts FAB + CDP).

---

### P5 → merge with DESIGN_OPTS D1+D2 (structural placement, single owner)

**Contract:** §7. **Resolves:** C11 (two placement owners + runtime-error content source).

**Objective:** Per §0's grounding, D1 (`buildTheme()` wiring) and D2 (CTA/feedback + empty/error
richness) are **both unimplemented**, and today's placement logic is ad hoc inline in `screen.ts`
(`:665-666`, `:613`). This spike is the single, real owner of *where* `LoadingState`/`ErrorState`/
`EmptyState`/retry/CTA slot into list/detail/form templates — content richness (skeleton visuals,
copy) stays `DESIGN_OPTS.md`'s O6.1-O6.3 scope, placement is this spike's.

**Scope:**
1. Land `DESIGN_OPTS.md` Slice **D1** first (`buildTheme()` wired into `main.dart`, dark mode) —
   it's a prerequisite: D2's richer states need the theme tokens D1 wires in to render correctly,
   and nothing in D1 touches `composition.ts`/`screen.ts`'s pattern-selection path (no ownership
   conflict with P1-P4).
2. `composition.ts` gains a minimal `statePlacementFor(screen): StatePlacementSpec` — NOT a new
   free-form decision, just formalizing the fixed insertion point that already exists
   (`screen.ts:665-666`'s status-check switch) as a named, plan-recorded structural slot, so a
   future generator change can't silently move it without the gate catching it.
3. `screen.ts`/`components.ts` implement D2's O6.2 (composed empty state + "New <Entity>" CTA when
   `repo` has create — reuses the same `crudFormTargets` check P4 already reads, no new heuristic)
   and O6.3 (retry `OutlinedButton` bound to the cubit's existing `load()`, `RefreshIndicator`
   pull-to-refresh). **Runtime error content source** (C11's second half): error copy comes from
   the existing Failure taxonomy (`DESIGN_OPTS.md` §17 cited in O6.3) — i.e. from the
   deterministic error-mapping the repo/use-case layer already produces, never from the IR (IR
   cannot represent a runtime network failure, and this spike must not try to make it).
4. `[states]` or extend `[shell]`-style validate gate: every list/detail screen's Loading/Error/
   Empty triad renders from the same named slot; a screen missing one triad member is flagged
   (catches the exact kind of drift `screen.ts:665-666` already shows was previously ad hoc).

**Explicit non-goals:** No skeleton loader (O6.1, `DESIGN_OPTS.md` explicitly ranks it "Defer" —
leave it there). No D3 (composition breadth) or D4 (motion/a11y) — those are unrelated
`DESIGN_OPTS.md` slices with no interface-pattern-contract entanglement; don't fold them in just
because you're touching the same doc.

**Owner modules:** `composition.ts` (new minimal selector), `screen.ts`/`components.ts` (the named
placement slot — same insertion point as today's ad hoc code, now payload-driven),
`generators/project.ts` (D1's `main.dart` theme wiring — a different, non-conflicting insertion
point), `validate.ts` (new/extended gate).

**Acceptance:**
- [ ] D1 lands + verified independently first (theme renders on goldens) before D2 work starts.
- [ ] Typecheck; byte-identical proof where a screen's placement decision is unchanged.
- [ ] New gate PASS on all 4 apps; all prior gates still PASS.
- [ ] CDP: trigger an empty list (no seed data) and a forced error, verify retry/CTA/pull-to-refresh
      all work, no overflow.
- [ ] Goldens regenerated; dark-mode goldens only if D1's `themeMode` attribute is exercised by a
      sample.

**Estimate:** M–L (D1: 1 slice; D2 placement: 2-3 slices).

---

### M4 — Sealed-class state codegen — **SPIKE COMPLETE, decision MODIFY**

**Source:** `LEFTOVER_NOTES.md` M4, root-caused, deliberately left OPEN → investigated by SPIKE M4
(`design/flutter-app-builder/research/SPIKE_M4_REPORT.md`, commit `b5eb50c`, remote
opencode/tracematrix `germany3`). Not a grill item (no C-number). **Status: spike complete.
Decision: MODIFY.** The scope below (originally "implement the sealed branch") is superseded by
the spike's findings — do not implement per the old scope; follow the resolved scope instead.

**What the spike proved (corrects this doc's prior ground truth, §0):**
- The original claim "today no sample crosses that threshold" was **factually wrong**.
  `builder/samples/rasheed.ir.json`'s `AllExpenses` state does cross it (idx=11 ≥ 8) — confirmed by
  a real probe generation (`apps/rasheed/output/qa/probe1`).
- The "add a plan-vs-output drift gate" half of the old scope item 3 was **already shipped** before
  the spike ran: `[strategy-fidelity]` (`validate.ts:90-112`) already exists and already FAILs on
  the probe (`[strategy-fidelity] FAIL (1)`, `apps/rasheed/output/qa/validate_probe1.log`). No new
  gate work was needed for that half — it's done.
- The actual defect is the **scoring metric**, not a missing template: `scoreStateStrategy`
  (`scoring.ts:15,51,165-173`) measures `statuses.length + extraFields.length`, but DESIGN §5.2
  defines sealed-events off the `stateMachines[]` transition/guard surface (`DESIGN.md:211,378`).
  Every IR in the repo declares zero `stateMachines` (`m4_evidence.ts` confirms sm-metric=0 across
  all 15 sample/app IRs) — so under the DESIGN-correct metric, nothing fires sealed today, and
  rasheed's field-heavy-but-transition-free state is exactly the false positive the wrong metric
  produces.
- H1 (implementing sealed-events now is worthwhile) does not survive the evidence: the repo's own
  reference app (`RASHEED_AUDIT_OUTPUT.md:142,244`) is enum-status-dominant (one sealed class in
  the whole codebase), no sample declares a transition vocabulary, the shape is invisible to end
  users (internal exhaustiveness only), and it costs a permanent dual-template maintenance burden
  (`SPIKE_M4_REPORT.md` §11-§12).

**Resolved scope — two concrete actions (MODIFY, not ADOPT/REJECT):**

1. **M4a — correct the selector.** `scoring.ts`-only change: `scoreStateStrategy` recomputes
   complexity from the `ir.stateMachines` surface (states + transitions + guarded-transition count)
   instead of `statuses + extraFields`, falling back to `enum-status` when a state has no declared
   machine/event vocabulary. Update `arch.ts`'s call site to pass `ir` through. No schema/IR change
   (`stateMachines` already exists, DESIGN §2/§5.2). Regression: `[strategy-fidelity]` PASSes on
   all 4 apps + all samples afterward (rasheed flips FAIL→PASS); the existing probe's negative
   control (declare sealed / emit enum) still FAILs, proving the gate isn't weakened by the fix.
   **Owner module: `scoring.ts` only** — zero overlap with `state.ts`/`screen.ts`/`crud_form.ts`/
   `test.ts`, and zero overlap with P3/P4/P5-D2's `composition.ts`/`screen.ts` insertion points.
   **Estimate: S (1 slice).** This is the next actionable step.
2. **M4b — implement the sealed template family — DEFERRED, not scheduled.** Real and
   implementable (a standard Dart-3 sealed-class pattern), but not scheduled: no current sample
   would exercise it under M4a's corrected selector, and the cost (`state.ts` sealed branch +
   parallel consumer branches in `screen.ts`'s status-switch/collection-reads/export block,
   `generators/test.ts` seeding, and the cubit CRUD-mutation rebuild — `SPIKE_M4_REPORT.md` §5.1,
   §14) buys a second, permanently-synced template family with no verifiable current benefit. Pick
   this back up only when a real IR declares a genuine `stateMachines` transition surface (new
   sample or explicit owner request) — at that point run a fresh ADOPT/MODIFY spike against the
   *corrected* selector, don't resume this old plan verbatim. If/when it lands: **owner modules**
   `generators/state.ts` (primary, additive branch on the same `generateState` function — never a
   fork, per the standing merge rule in §2), `screen.ts`/`crud_form.ts`/`generators/test.ts`
   (consumer branches). No new gate needed — `[strategy-fidelity]` already covers the drift case.
   **Estimate: M-L, unscoped further until triggered.**

**Consequence flagged for the owner:** under the corrected M4a selector, roadmap item C3 ("ship
enum-status AND sealed-events at parity", `PHASE_PLAN.md`/`TIMELINE.md:20`) becomes **inert** — no
current IR fires sealed, so there's nothing for it to ship until an event-rich sample exists. This
is a roadmap consequence of the fix, not a new bug.

**Owner modules (M4a only, the active next step):** `scoring.ts` (the fix), `arch.ts` (pass `ir`
through to the call site). **No overlap with P3/P4/P5/D2** — different generator surface entirely
(state-strategy scoring, not navigation/search/scroll/actions/placement). Safe to run at any time,
in parallel with the sequential interface-pattern chain.

**Acceptance (M4a):**
- [x] Typecheck; byte-identical for every existing sample's *generated code* (nothing currently
      emits sealed regardless of what the plan claims, so the selector fix only changes `plan.json`
      declarations — rasheed's `AllExpenses` entry flips `sealed-events`→`enum-status`).
- [x] `[strategy-fidelity]` PASSes on all 4 apps + all samples, including a fresh `npm run
      build:rasheed` + validate (was FAIL, must now PASS).
- [x] Negative control still fires: a deliberately hand-edited `plan.json` claiming `sealed-events`
      against an emitted `enum-status` template still FAILs the gate (proves M4a didn't weaken it).

**Evidence:** `design/flutter-app-builder/research/SPIKE_M4_REPORT.md` (full report, decision +
rejected alternatives), `apps/rasheed/output/qa/m4_evidence.ts` (reproducible per-IR metric table),
`apps/rasheed/output/qa/probe1/` (probe generation), `apps/rasheed/output/qa/validate_probe1.log`
(gate FAIL proof). Commit `b5eb50c`.

---

### S-HERMETIC — Pin the toolchain for byte-identical builds

**Resolves:** C12 (byte-identical broken by toolchain, not the selector).

**Objective:** Generator-output determinism (the string-for-string invariant) is already proven
and not the gap. The real gap is one layer up: `project.ts` pubspec caret ranges (`^8.1.6` etc.,
`:9-10,28-29,51-58`) let `flutter pub get` resolve different transitive dependency versions on
different days, and there's no committed lockfile — so two "byte-identical" generator runs can
still produce differently-behaving **built** apps.

**Scope:**
1. Decide (owner call, flag as a decision-log item, not a default): either (a) switch generated
   `pubspec.yaml` dependencies to exact pins (drop the `^`), or (b) keep caret ranges but commit a
   `pubspec.lock` per `apps/<app>/output/app` and treat lockfile drift as a detectable, reviewable
   diff rather than an invisible one.
2. Document the exact Flutter/Dart SDK version this repo's CI/verification targets (pull from
   existing ground-truth docs — `SWIFTUI_GROUND_TRUTH.md` already captured tooling versions for
   the SwiftUI spike; reuse that discipline for the Flutter path too, it appears undocumented here).
3. Confirm (already true per §0's grep) no generated file embeds a build timestamp — add this as
   an explicit **regression test** in `validate.ts` (grep generated output for `DateTime.now()`/
   ISO-date literals in headers) so it stays true, since it's cheap and currently only "true by
   absence of code that would break it."
4. No generator logic changes — this is packaging/config only.

**Owner modules:** `generators/project.ts` (pubspec pinning strategy), `validate.ts` (new
regression-only check), CI/docs.

**Acceptance:**
- [ ] Two builds of the same app a week apart (or two `flutter pub get` runs against a pinned
      lockfile) produce identical `pub.lock` contents.
- [ ] Timestamp-absence regression check added and passes on all 4 apps.
- [ ] Decision (exact-pin vs lockfile-commit) recorded in the contract or this doc, not left silent.

**Estimate:** S (1 slice — it's a policy decision + a small doc/check, not new codegen).

---

### S-DEEPLINK — Deep links + per-destination restoration (backlog, owner call)

**Resolves:** C14 (stable feature id implies deep-link/restoration semantics but doesn't deliver
them).

**Objective:** `ShellDestination.featureId` (`composition.ts:53-60`) is already a stable,
IR-order-independent identifier — the addressing primitive C14 asks for exists. What's missing:
(a) a deep link (cold-start URL) landing on the correct shell branch, and (b) per-branch
navigation-stack restoration surviving process death (today's `StatefulShellRoute.indexedStack`
only keeps state alive for the running app's lifetime, per P1's own scope note).

**Scope:**
1. `route.ts`: map `featureId` → `StatefulShellBranch` index at router-construction time (not
   route-match time) so a URL for any screen inside a feature resolves to that feature's branch
   regardless of `features[]` reordering between generations.
2. Evaluate `go_router`'s `restorationScopeId` + Flutter's `RestorationMixin` for per-branch stack
   restoration — this is real, nontrivial platform integration work, not a generator-string change;
   scope it as its own investigation slice before committing to an implementation slice.
3. Extend the `[shell]` gate to check deep-link resolution for each declared destination.

**Owner modules:** `route.ts` (primary, new territory for this roadmap), `composition.ts` (reuse
`ShellDestination`, no change), `validate.ts` (extend `[shell]`).

**Why backlog, not scheduled:** No sample app or owner request currently exercises deep links or
process-death restoration; the effort (state-restoration platform APIs) is disproportionate to
current demand. Flag it, don't build it — owner should explicitly pull this forward if a real app
need appears (e.g. push-notification-driven deep links).

**Estimate:** L (investigation slice alone is ≥1; implementation is unscoped until the
investigation lands).

---

## 2. Generator-ownership matrix

Columns are generator/module files. A cell states what a spike does there; **bold** = the spike's
named, disjoint insertion point (the C3 answer — no two spikes may claim the same named point).
"extends" = the later spike calls into / adds a parameter to the earlier spike's own function,
never forks it (the concrete resolution rule for co-owned generators, C3).

| Spike | `composition.ts` | `plan.ts` | `screen.ts` | `route.ts` | `generators/app_shell.ts` | `generators/crud_form.ts` | `validate.ts` | `types.ts`/schemas | `operations.ts` |
|---|---|---|---|---|---|---|---|---|---|
| **P1** (done) | owns `shellFor` | owns `patterns.shell` | — | owns routing wiring (consumes payload) | owns (new file) | — | owns `[shell]` | — | — |
| **P2** (in-flight) | owns `searchFor`/`searchTargets` | owns `patterns.search` | **owns SearchBar block** | — | — | — | owns `[search]` (not yet added — gap) | owns `primaryDisplayField` | — |
| **S-CTX** | — | doc only | — | — | — | — | owns `[plan-determinism]` | — | — |
| **P3** | owns `scrollFor` | owns `patterns.scroll` | **owns AppBar-tint block** | — | extends `generateAppShell` (nav-bar hide) | — | owns `[scroll]` | — | — |
| **P4** | owns `actionsFor` + action icon map | owns `patterns.actions` | **owns detail "…" menu block** | — | — | **owns extended-FAB block** | owns `[actions]` | — | reuses existing predicates only (no new ones) |
| **P5/D2** | owns minimal `statePlacementFor` | owns `patterns.states` (optional) | **owns Loading/Error/Empty triad + CTA block** (formalizes existing `:665-666`/`:613`) | — | — | — | owns `[states]` | — | reuses `crudFormTargets` (no new predicate) |
| **M4a** (active) | — | strategy field already exists; `scoring.ts` owns the fix (not in this table's columns — see `scoring.ts`/`arch.ts`) | — | — | — | — | `[strategy-fidelity]` already shipped (pre-dates the spike; no new gate work) | — | — |
| **M4b** (deferred) | — | — | consumer branch update (deferred) | — | — | consumer branch update (deferred) | — | — | — |
| **S-HERMETIC** | — | — | — | — | — | — | owns timestamp-absence check | — | — |
| **S-DEEPLINK** | reuses `ShellDestination`, no edit | — | — | owns branch-index mapping | extends (restoration wiring) | — | extends `[shell]` | — | — |

**Additional module touched only by M4b/P5-D2, not in the table above:** `generators/state.ts`
(M4b primary, deferred — not touched by the active M4a fix, which is `scoring.ts`-only),
`generators/test.ts` (M4b + P4 + P5/D2 each add their own regression-test generation branch — same
"own named block" rule applies there too, not just in `screen.ts`).

**The merge rule, stated once, for every future co-ownership case:** each spike claims a named,
disjoint insertion point in a shared generator, recorded in this table's Notes; if two spikes
genuinely need the same widget/point (as P1/P3 do for `app_shell.ts`'s `NavigationBar`), the spike
that lands **later** in roadmap order extends the earlier spike's function signature additively —
never duplicates or forks the function — and the earlier spike's own acceptance tests must keep
passing unmodified after the extension.

## 3. Decision log — grill C1..C16

| # | Challenge | Resolution | Where |
|---|---|---|---|
| C1 | "ctx" undefined, determinism invariant is a tautology | `GenContext`/`GenerationPlan` are already 100% IR-derived (verified: no LLM call anywhere in `composition.ts`/`plan.ts`/`scoring.ts`); **S-CTX** spike writes this down explicitly and adds a `[plan-determinism]` gate that would fail if it ever stopped being true | S-CTX |
| C2 | N=0/1/4 features and >5 hard-abort-vs-fallback unspecified | Already resolved by shipped code: N≤1 → no shell (`composition.ts:112`), N=2..5 → NavigationBar, N>5 → hard `throw`, no fallback exists or is planned | Already shipped (P1), cited not re-spiked |
| C3 | Co-owned generators break "untouched unless owning slice" | Generator-ownership matrix (§2) + the stated merge rule: disjoint named insertion points per spike; same-point conflicts resolved by later-spike-extends-earlier-function, never forking | §2 (this doc) |
| C4 | P2's `title`/`name` predicate is the banned name-guess | Already resolved by shipped/in-flight code: `entity.primaryDisplayField` is an explicit declared IR semantic, not a name match (`composition.ts:155-166`) | Already shipped (P2), cited not re-spiked |
| C5 | Single-field presumption, no mode×type matrix | Resolved by explicit scope-lock in the P2 brief: single field, `contains`-only, String-typed only in this slice; a multi-field/typed-mode matrix is a distinct, unscheduled future pattern (`P2b`), not part of this roadmap | P2 (already scoped); flagged as backlog, not a spike |
| C6 | "Server-query without touching screen generators" unverified | Resolved by explicit scope exclusion: P2 is in-memory `contains` only; server-query is declared a **new pattern** requiring its own async-seam design, never assumed free | P2 (already scoped); flagged as backlog, not a spike |
| C7 | P3 cosmetic collides with pagination/scroll-restoration | **P3** spike explicitly delineates viewport-scroll (its own, cosmetic) from data-pagination (no owner in this roadmap — named as a future `P6 pagination` gap) and from restoration (C14/S-DEEPLINK's problem) | P3 |
| C8 | List-vs-grid-vs-slivers has no deterministic home | Explicitly out of scope for every spike in this plan — no current sample needs grid; if/when needed, it must be an explicit IR-declared `screen.layout` field (never inferred), consistent with the master principle — named here as a future backlog item, not scheduled | Backlog (unscheduled) |
| C9 | Capability→action static 1:1, no enablement/confirm/params | **P4** spike defines the `ActionSpec` schema (enablement, confirm, params, overflow grouping ≥2), reusing the `quickDecisionTargets` (LM6) precedent for row-level enablement | P4 |
| C10 | Build-time capability vs runtime authorization conflated | **P4** spike explicitly scopes itself to build-time capability only; runtime per-user authorization is named as a future, separate, auth-roadmap-dependent spike (not scheduled here) — documented so "action rendered" is never mistaken for "action permitted" | P4 |
| C11 | P5-into-D2 has two placement owners; runtime error source unspecified | **P5/D2** spike is the single placement owner (formalizes the existing ad hoc `screen.ts:665-666`/`:613` insertion points into a named, gated slot); runtime error copy is sourced from the existing deterministic Failure taxonomy, never from IR | P5/D2 |
| C12 | Byte-identical broken by toolchain hermeticity | Generator-output determinism already proven (not the actual gap); real gap is pubspec caret-range/lockfile drift — **S-HERMETIC** spike pins or lockfiles it, plus adds a timestamp-absence regression check (confirmed already-true today) | S-HERMETIC |
| C13 | Icon collisions/missing glyphs unconstrained | Glyph-absence already impossible by construction (finite hand-picked stem map, `KNOWN_SHELL_ICONS`); collision explicitly **allowed by design** (shared icons across features/actions, no dedupe error) — **P4** extends the same finite-map pattern to action icons and states this policy explicitly | P1 (icon-absence, shipped) + P4 (extends to actions, states collision policy) |
| C14 | Deep links + per-tab restoration implied but undelivered | Addressing primitive (`featureId`) already exists; **S-DEEPLINK** spike scopes the actual gap (URL→branch resolution, process-death restoration) as backlog pending real demand, not built speculatively | S-DEEPLINK (backlog) |
| C15 | LLM-authored plan recurses nondeterminism | Same resolution as C1 — the plan is not LLM-authored today; **S-CTX**'s `[plan-determinism]` gate is the standing guard against this ever becoming true silently | S-CTX |
| C16 | Unknown capabilities have no failure-mode policy | Capabilities are already a closed, enumerable TS-predicate vocabulary (`operations.ts`), not an open IR field — **P4** makes the export/delete/audit/write subset official and states the rule: a fifth action kind requires a new named predicate + contract update, never an ad hoc string | Already true by architecture (operations.ts); P4 formalizes it |

---

## 4. Review resolution (ChatGPT round-2 reply — 5 final corrections, incorporated 2026-08-17)

Approved-with-5-edits. These edits are binding on the sections above; where they conflict, this section wins.

1. **S-CTX — "IR-derived" must be a *transitive* property** (C1/C15 hardening). A helper called by
   `shellFor`/`searchTargets`/the sm selector could read env/time/randomness yet stay inside the
   same call graph. The contract must state the invariant exactly:
   > Every value in `GenerationPlan` and `GenContext` is a pure function of
   > (IR, pinned generator version, pinned schema/versioned constants). No wall clock,
   > filesystem enumeration, environment variable, network, randomness, model output, or
   > mutable process state may influence it.
   Add this verbatim to the S-CTX doc + enforce it in the `[plan-determinism]` gate by
   re-running the full call path the same way `index.ts` does (not just spot-checking outputs).

2. **P3 — `scrollFor` universality is a *declared contract rule*, not a selector default.** If the
   rule is universal, write it as:
   > `scroll.enabled = screen.kind ∈ {list, detail}`
   as a stated contract rule (versioned), not a silent "all list/detail" in the selector. This
   closes the residual C8/C1-style ambiguity: either the composition decision is explicit IR/
   contract-driven or it is a named rule — never an unstated default.

3. **P4 — drop `params?` from the v1 `ActionSpec`.** v1 has no parameterized actions; keeping the
   field invites C9's "what is a parameter?" back. v1 schema:
   ```ts
   ActionSpec {
     kind: Export | Delete | Audit | Save
     label
     icon
     enablement
     confirm?
     presentation: inline | overflow | primary   // replaces ad hoc "…"-menu threshold logic
   }
   ```
   `params` is reserved for a future action-pattern contract, not implemented now.

4. **P5/D2 — the Loading/Error/Empty triad is NOT universal; it is state-model-conditional.** The
   `[states]` validator must check each screen against its *applicable state contract* (the
   generated cubit/bloc's state shape), not blindly require all three members on every detail/
   form screen. Otherwise the validator itself becomes the false heuristic C4/C8 warn about.
   Acceptance criterion:
   > each screen renders exactly the triad members its own state model declares; a state that
   > cannot produce a given member (e.g. a synchronous form with no loading) must not be forced
   > to render it.

5. **S-HERMETIC — hard two-layer contract, never one promise.**
   - **L1 Generator determinism:** same IR + same generator/toolchain inputs → identical
     generated bytes.
   - **L2 Build reproducibility:** same generated source + same SDK/dependency lock → reproducible
     dependency graph and equivalent build artifacts.
   Do NOT promise byte-identical Flutter binaries (that would require controlling the full
   compiler/toolchain environment). Commit the lockfile strategy as L2, keep L1 as the proven gate.

### Sequencing gate (binding)

**P2 is a prerequisite gate, not a roadmap item.** P3 cannot begin until P2 is formally closed:
`[search]` validator exists and PASSes, all samples regenerate cleanly, CDP evidence exists, and
P2 diff/golden evidence is recorded. Otherwise P3 lands on an unvalidated shared `screen.ts`,
recreating exactly the C3 ownership problem this plan exists to prevent.

### Not-scheduled register (closed vocabulary of open gaps)

| Gap | Status |
|---|---|
| P2 `[search]` gate + full P2 closure | MUST close before P3 (gate above) |
| Multi-field/typed search (`P2b`) | Backlog |
| Server-side/paginated search | Backlog / new architecture (C6) |
| Pagination / infinite scroll (`P6`) | Backlog (C7) |
| Grid/sliver layout selection | Backlog; requires explicit IR `screen.layout` field |
| Runtime authorization | Auth-roadmap dependency (C10) |
| Deep-link + process-death restoration | S-DEEPLINK backlog (C14) |
| Search-as-global-tab | Backlog |
| NavigationRail adaptive shell | Backlog / stretch |
| Skeleton loading | DESIGN_OPTS defer (O6.1) |
| Undo | Explicitly deferred |
| M4b sealed-events template family | SPIKE M4 complete (MODIFY, `b5eb50c`) — deferred until a real `stateMachines`-declaring IR exists; M4a (scoring.ts selector fix) is the only active M4 next step |

### Frozen order (unchanged except the gate)

```text
S-CTX → P3 → P4 → P5/D2        (P2 closure is the gate in front of S-CTX/P3)
M4a (M4 spike complete, MODIFY — scoring.ts only) ┐
S-HERMETIC ───────────────────────────────────────┤ parallel
S-DEEPLINK → backlog ──────────────────────────────┘
```

Do not add further interface patterns until this contract + its validators are closed — every new
pattern is just another surface for nondeterminism/ownership/IR-semantics leakage.
