# P5/D2 Slice 3 — Implementation brief for Claude Code

**From:** Orchestrator (zen) — **To:** Claude Code (implementer) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_P5_D2_REPORT.md` (§11 model, §13 slices, §14.3 test matrix, §15 rejected alternatives, §16 decisions).
**Task:** Implement **Slice 3 (composition)** — O6.2 empty-state CTA + O6.3 retry/refresh. Slice 4 (`[states]` gate) is a LATER slice; do NOT do it here.

## Decisions already made (owner): §16 open questions

- Retry/refresh → **lists only** (deterministic via `has load()`); detail-screen retry is a follow-up, not this slice.
- Child list screens with an FK filter → empty-state CTA navigates via the **existing FAB path** (the `?<fk>=` forwarding the FAB already uses).

## What Slice 3 is

Wire the RENDERED, user-visible companions of the Slice-2 `StatePlacementSpec` (which is already in `types.ts`/`composition.ts`/`plan`/`ctx` and consumed by `screen.ts`). Slice 2 only added the SPEC fields; this slice makes the UI real for the cases where the spec says the members are active:

```
empty       = state has a backing collection (list archetype, items.isEmpty sibling check)
emptyCta    = empty AND crudFormTargets(ir).get(s.entity) has create → "New <Entity>" CTA,
              navigates exactly like the FAB (same crudFormTargets + ?<fk>= forwarding)
retry       = error AND repo has load()            → OutlinedButton → context.read<XCubit>().load()
refresh     = list archetype AND has load()        → RefreshIndicator wrapping the list's scroll parent
```

Grounded in the spike: `screen.ts:619` (search-only empty variant — keep as-is for the search/no-results branch, it is NOT the plain-empty case), `screen.ts:71` (search-only EmptyState today; no empty-state for a plain-empty collection, no retry, no RefreshIndicator, no CTA anywhere in the screen), P4 `crudFormTargets` (:73-85, entities with create+update).

## Non-negotiable boundaries

1. **Do NOT implement Slice 4.** `validate.ts` stays untouched this slice — the `[states]` gate is the NEXT slice.
2. **Do NOT emit emptiness as a status value.** `"empty"` is not a status enum member — it is a COLLECTION-derived sibling check (list archetype + `items.isEmpty`). Never render an empty-state from a status branch.
3. **Retry/refresh bind the already-existing cubit/riverpod `load()`** (already emitted by the state pattern) — no new runtime state, no new dependencies. `RefreshIndicator` and `OutlinedButton` are stock Material.
4. The **search/no-results empty variant stays as-is** (`filtered.isEmpty && query.isNotEmpty`) — it coexists with the new plain-empty state; do not blur the two.
5. **Deterministic, dependency-free.** All conditions derivable from IR at plan time. No package additions.
6. Wizard / detail screens: spec null (empty=false) → emit nothing new. No loading-branch CTA on detail.
7. Additive-only; generated code ownership (headers, regions) unchanged; byte-identical for unaffected screens (detail screens, search-only lists).

## Definition of done (verify all before reporting)

1. `npm run typecheck:builder` clean.
2. Regenerate ALL apps + samples (`tasks`, `rasheed`, `work_auth`, `hr_service`, `ledgerly`, `todo`, `promo`, `inventory`, `wizard`) with `index.ts`, then:
   - `npx ts-node --transpile-only builder/src/validate.ts <ir> <out>` per output — all existing gates pass.
   - `flutter analyze` 0 errors on the generated apps (confirm wizard + reimbursement still compile — Slice 2's fix holds).
3. Screens now render the new pieces exactly per the spec table:
   - list w/ repo `load()`: `RefreshIndicator` wraps the list scroll parent; `OutlinedButton` retry visible on error branch;
   - empty-collection list: `EmptyState` with "New <Entity>" CTA (only when the entity has create — `crudFormTargets`);
   - non-CRUD entity: no CTA (an empty state may still show, but never a CTA with no target);
   - no `load()` repo (none strategy): no retry/refresh;
   - wizard + detail: nothing new emitted.
4. **Byte-identical proof** (stash-based): screens whose placement is unchanged (detail screens, search-only lists) are byte-identical before/after — only the target screens change.
5. Goldens (390×844) updated where goldens exist for the affected screens: `flutter test --update-goldens` only if a golden test covers the changed screens (add one empty-with-CTA case if the sample app's golden set doesn't already include it — keep it minimal and tokenized).
6. Make small, one-logical-slice-per-commit commits. Report each commit hash + a ≤12-line chat summary (files changed, decisions, verification output).

## Files you will most likely touch

`builder/src/generators/screen.ts` (empty/error/list emission, RefreshIndicator wrap), possibly `builder/src/composition.ts` (if `statePlacementFor`'s `emptyCta`/`retry`/`refresh` need exact field carry), and `builder/src/gen_context.ts`/`plan.ts` ONLY if the spec fields aren't already carried (Slice 2 added them — reuse, don't duplicate). Ground truth is the current Slice-2 code; read it before editing.