# S2 — Section-layout IR (zero pixel coordinates) — SPIKE brief (remote opencode agent)

**From:** Orchestrator (zen) — **To:** remote opencode agent (tracematrix, germany3) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding — read it FIRST).
**Spike plan:** `SPIKE_PLAN.md` + `VISUAL_GENERATION_REVIEW.md` §5-Modified §12 (lines ~98), **§6 S2** (P1, lines ~116-121), §7 slotting (lines ~151-152).
**Working copy:** `/root/fg-p5` on this host, freshly synced to current master (includes the shipped S1: `ScreenModel.visualStyle`, `[visualIntent]` gate, `test/s1_visual_intent.test.ts`).

## What this is

A RESEARCH SPIKE (read-only, no commits, implement-last). You investigate whether a declarative
**section-list** IR is sufficient to render a "rich" home-style screen deterministically — using only
existing tokens + registry components, **no absolute positioning / no pixel coordinates** — and passes
the overflow validators at 320/390/1400 widths. You CLOSE the decision. You do NOT write generator code.

## The hypothesis (VISUAL_GENERATION_REVIEW §6 S2, lines 116-121 — falsifiable)

> A declarative section-list IR (`Header/Search/Hero/Section[...]`) added to `ScreenModel` renders a
> Keemart-style home deterministically using only existing tokens + registry components, with zero
> absolute positioning or coordinate literals, and passes the overflow validator at 320/390/1400-wide
> viewports.

**Decision criteria (from the plan):** ADOPT if it renders + overflow-clean at 3 viewports + contains
no coordinate literals. MODIFY if some sections need a new registry component. REJECT if any section
requires absolute x/y.

## Grounding you must read first (read-only)

- `VISUAL_GENERATION_REVIEW.md` — §5 §12 (lines ~98), §6 S2 (lines ~116-121), §7 (lines ~151-152).
- S1 shipped shape (ground truth, this is what S2 builds on): `builder/src/types.ts` `ScreenModel`
  (now with optional `visualStyle`), `builder/src/composition.ts` `visualFor()`/`compositionFor()` +
  the archetype selectors (`list|detail|form|wizard` + `statePlacementFor`), `builder/src/schema/*.json`
  (screen.schema.json additionalProperties handling), `builder/src/generators/screen.ts` (how a screen
  is rendered from composition), `builder/src/validate.ts` `[visualIntent]` + the overflow validator
  reference (search for overflow/`viewport`/`fit` in the validator file(s)).
- Registry/components: `builder/src/components.ts` or the component registry file (`AppListCard`,
  chips, empty/error states, etc.) — list its concrete components; these are the ONLY building blocks
  a section renderer may use.
- The P5/D2 state-conditional emission + `test/s1_visual_intent.test.ts` patterns (what a deterministic
  renderer + regression test look like in this repo).
- Keemart-style home: the VLM contract v2 has a worked "Keemart home" example — read
  `VLM_DESIGN_TO_IR_CONTRACT_V2.md` §8 or the worked-examples section for what a "rich home"
  section tree means (Header, Search, Hero, multi-productGrid sections, offers) BUT translate it to
  the closed section-list vocabulary below — never to pixel/coordinate terms.

## Investigation questions to answer (each evidence-grounded)

1. **Section-list vocabulary design.** Propose (spec, not implement) the exact closed section types
   v1 should support, e.g. `header | search | hero | promoBanner | productGrid | divider | section` —
   which map cleanly onto EXISTING registry components + tokens, and which would need ONE new registry
   component (the MODIFY branch). Each section = { type, title?, id?, children? } with constraints
   NEVER coordinates. Validate against schema-teeth: zero free-form positional fields.
2. **Renderer feasibility.** Confirm the deterministic path: `screen.ts` currently emits list/detail/
   form/wizard archetypes from composition; show how a `sections[]` flag on ScreenModel would route
   to a section renderer WITHOUT touching existing archetypes (byte-identical for IRs without
   sections). What existing layout primitives (ListView/Column/ScrollView with token spacing,
   aspect-ratio-constrained image surfaces, grid via existing widget) cover the 3 viewports?
3. **Overflow at 3 viewports.** Map each proposed section type to the overflow validator story at
   320 (small), 390 (iPhone), 1400 (wide): which sections are naturally `Expanded`/wrapped (safe),
   which need `aspectRatio`/`maxWidth`/elision constraints (the validator's job), and whether the
   current overflow check (cite file:line) already covers section-style constrained widgets.
4. **MODIFY branch — missing components.** Enumerate precisely which section types have no existing
   registry component (e.g. a product "grid" card if `AppListCard` is list-only, a "hero" block) and
   propose each as a one-line new-component spec (tokenized, no raw numbers) — this is the future
   implementer slice list.
5. **Interaction with S1/visualStyle.** Does the section renderer consume `ScreenModel.visualStyle`
   (via `visualFor`) for hierarchy (hero prominence) and personality (spacing/radius) the same way
   S1's proof screens do? Confirm the spec keeps `screen.ts`+composition.ts as the ONLY layout
   authority (never coordinates from IR).

## Decisions you must CLOSE (with evidence)

- **D1 — Vocabulary v1:** the exact closed v1 section-type set (ADOPT/MODIFY) with its constraint spec.
- **D2 — Renderer routing:** how `sections[]` routes through composition/screen.ts, byte-identical
  for section-less IRs (evidence from the existing archetype code paths).
- **D3 — Missing components:** the precise new-component list (MODIFY branch) each one-line tokenized.
- **D4 — Overflow readiness:** verdict that the 320/390/1400 criteria are covered by existing overflow
  validators + constrained-section design, or a named gap (near-term validator addition).
- **D5 — S1 interplay:** visualStyle feeds hierarchy/personality into the section renderer (ADOPT/
  MODIFY), no new IR field beyond `sections[]`.

## Constraints (SPIKE_PROTOCOL non-negotiables)

- READ-ONLY. No commits, no edits, no builds, no `npm`/ts-node/Flutter on this 1GB box.
- Failure modes mandatory per decision.
- Do NOT implement the section renderer, do NOT do S3/S4/S5/S6/S7 or S-DEEPLINK. S2 ONLY.

## Deliverable (§17 report)

`design/flutter-app-builder/research/SPIKE_S2_REPORT.md` in YOUR clone, same structure as
`SPIKE_S1_REPORT.md`. Mandatory: hypothesis + corrected premise; ground truth (file:line); the v1
section-type table (type × registry component × token mapping × overflow story at 320/390/1400);
answers Q1-Q5; decisions D1-D5 CLOSED (verb + evidence); rejected alternatives; implementer slice
spec (vocabulary + routing + new components, each one-line); risks/failure modes; open questions.
In your chat summary: the 5 decision verbs + one-line vocabulary (~6 lines total).