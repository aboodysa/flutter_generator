# S2.1 sections hardening — implementation brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer) — **Date:** 2026-08-18
**Trigger:** second review ratified S2 (A1 emphasis-drop + B1 `sections`) but found structural
gaps the shipped implementation does NOT yet check. Disposition: `S2_RATIFICATION.md`. This brief
is the resulting S2.1 hardening — ONE coherent change, then gates re-run.

**Read first:** `SPIKE_S2_REPORT.md` §14 (the original slice spec), `S2_RATIFICATION.md` (this
round's ownership record + naming matrix + ratified semantics), `SPIKE_S1_REPORT.md` §13 D4
(provenance), `VLM_DESIGN_TO_IR_CONTRACT_V2.md` §5 (the no-pixel-coords rule). Note S1 token-rigor
already landed (`S1_TOKEN_RIGOR_BRIEF_CLAUDE.md`): `VisualSpec` now has component-role
`radiusScale.{search,fab}`, full `spacing` matrix, `titleWeight` — respect all of it.

## Objective

Close the review's five real gaps in current S2 as ONE additive, deterministic change:

### GAP-1 — Hero cardinality 0..1
`[sections]` gate (`builder/src/validate.ts`, around `:1097-1133`): count the hero-family sections
(`type === "hero" || type === "promoBanner"`) per screen; FAIL if `> 1`. Zero is valid. Error copy
mirrors the existing style: `[sections] screen '<name>' declares N hero-family sections (hero/
promoBanner) — at most one focal section per screen`.

### GAP-2 — Duplicate section IDs
Gate: collect `sec.id` per screen (top-level + `children`); FAIL on any duplicate.
`renderer` (`builder/src/generators/screen.ts`, sections branch `:386-500`): give every emitted
section a `ValueKey('section-<id>')` (each RenderSection switch case that emits a widget; `section`
and `children` too). This makes `id` meaningful (keyed rendering + test selectors + future deep-link
anchors) instead of bookkeeping.

### GAP-3 — Sections-screen state model
- keemart proof (`apps/keemart/input/keemart.ir.json`): the Home currently declares
  `"states": "None"`. **Add** loading/error states so the sections screen exercises the shared
  `checks` path (the review's "empty/loading/error" ask). Mirror how an existing sample declares
  states, e.g. `apps/hr_service/input/hr_service.ir.json` or `apps/tasks/input/tasks.ir.json`.
- Renderer: confirm the sections branch applies the shared `checks` (loading/error) like the list
  branch does (`screen.ts:945-950`) — the Home's `statePlacementFor` should emit the
  `if (state.X == status.loading) return const LoadingState();` guard at the top of the sections
  build, and error state with retry when it's a list-style screen.
- `productGrid` empty list: the grid's `itemBuilder` should render an inline `EmptyState` when the
  backing list is empty (the grid is inside a shrinkWrapped NeverScrollableScrollPhysics ListView,
  so an empty grid renders zero children today — an invisible but real empty affordance). Emit the
  existing `EmptyState` component with the collection's no-data copy when `items.isEmpty`.

### GAP-4 — Hero heading semantics (a11y)
`AppHeroBanner` (`builder/src/generators/components.ts`): its headline `Text` must keep a real
heading level independent of `heroScale`. Wrap the headline in
`Semantics(header: true, child: ...)` (or use `Text` with `style` that keeps it a heading — the
emitted widget must expose a heading role for the a11y test). Ensure the existing a11y test
generator passes for keemart unchanged.

### GAP-5 — Deterministic + gates intact
- Run the existing S2 negative controls again (columns→schema abort; list-with-sections→`[sections]`
  FAIL) plus NEW ones: two hero sections → gate FAIL; duplicate id → gate FAIL.
- Section-less apps stay byte-identical (existing determinism test + keemart-only golden churn).
- `patterns.sections` re-derive still matches after the renderer key/empty-state changes (the gate
  diff tests this — plan entries stay the same shape).

## Constraints
Additive only. Do not change `scoreApp`/`ScoringInputs`, `route.ts`, squeeze/a11y generators, or
weaken `[visualIntent]`/`[contrast]`/`[literals]`. The review's "heroScale 0/1/2 semantics" and
"hero-first vs order" are DECIDED (see `S2_RATIFICATION.md` — screen-level heroScale, order-based
prominence); do not add a per-section heroScale field. Small additive commits, push to origin/master.

## Verification (all mandatory, report exact output)
1. `npm run typecheck:builder`.
2. `npx jest test/s1_visual_intent.test.ts` — 20/20.
3. `npm test` — full suite green.
4. Regenerate + validate keemart: `index.ts` then `validate.ts` (PASS), `flutter pub get && flutter
   analyze && flutter test --update-goldens && flutter test` in `apps/keemart/output/app` (goldens
   only the Home; a11y keemart pass; squeeze 320/390/1400 green).
5. New negative controls (two heros, duplicate id) actually FAIL the gate; existing negative
   controls still fail as before.
6. Determinism: regenerate keemart twice to temp dirs, `diff -r` byte-identical; a section-less
   sample (e.g. tasks) regenerates byte-identical.
7. Report ≤12 lines: per-gap commit hashes, gate diff before/after, golden churn list (only keemart
   home), negative-control outputs, determinism proof.