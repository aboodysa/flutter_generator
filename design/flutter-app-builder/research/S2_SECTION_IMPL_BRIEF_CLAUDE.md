# S2 — Section-layout IR ("sections" archetype) — IMPLEMENTATION brief (Claude-first)

**From:** Orchestrator (zen) — **Status:** ready to dispatch to Claude (s-hermetic lane)
**Spike that closes the decisions:** `SPIKE_S2_REPORT.md` (2026-08-18) — net verdict **MODIFY**,
D1 MODIFY, D2 ADOPT, D3 MODIFY, D4 ADOPT (with `[sections]` gate), D5 ADOPT.
**Source of truth:** `design/flutter-app-builder/DESIGN.md`, `SPIKE_PROTOCOL.md`,
`SPIKE_S2_REPORT.md` (read all before code). Repo must be on current master (`d937b02` or later).

> Zen-model note: this brief is written by the orchestrator from the spike's §14 slice spec.
> The implementer (Claude) edits `builder/src` + adds the proof sample; zen reviews + verifies.
> Open-owner calls from §16 are resolved with the proposed defaults below — flag any owner override back.

## 1. Objective

Land the **`"sections"` archetype**: a declarative `ScreenModel.sections?: SectionModel[]` on a
new `type: "sections"` screen renders a rich home-style layout **with zero pixel coordinates**,
using only tokens + registry components + stock Material, and passes the generated
ViewportSqueezeTestGenerator at 320×480 / 390×844 / 1400×900. Deterministic, additive,
byte-identical for every IR that does not declare sections.

## 2. What to build (from `SPIKE_S2_REPORT.md` §14.1–14.7, verbatim contract)

| # | Artifact | File | Spec |
|---|---|---|---|
| 1 | Vocabulary | `builder/src/types.ts` + `builder/schemas/screen.schema.json` | `SectionType` closed enum + `SectionModel {id, type, title?, children?}` + `ScreenModel.sections?`; schema `type` enum gains `"sections"`; section object `additionalProperties:false`; `children` only on `section`, depth-1. **No** columns/width/height/aspectRatio/padding/x/y anywhere. |
| 2 | Selector | `builder/src/composition.ts` | `COMPOSITIONS.sections` entry at the `:30` "Extend here" insertion point; `sectionsFor(screen, ir)` + `sectionsTargets(ir)` in the existing selector family (`visualFor` [composition.ts:435-453]); returns `null`/empty when the screen declares no sections. |
| 3 | Renderer | `builder/src/generators/screen.ts` | Fourth `comp.layout === "sections"` branch (before the detail branch at :351): pure per-type mapping under a vertical `ListView` scroll parent (the list branch's shape :744-759), applying `ctx.visual` deltas verbatim (:203-222, never re-derive); grid via `GridView.builder`+`SliverGridDelegateWithMaxCrossAxisExtent(gridExtent)`; rail via horizontal `ListView.builder`+`SizedBox(cardWidth)`. Template header marker gains `_sections`. |
| 4 | Organisms | `builder/src/generators/components.ts` | `AppHeroBanner` (gradient `AppColors.primary` ± alpha .85, headline/CTA/subtitle, `AppRadius.*`, `AppSpacing.*`; compact variant for `promoBanner`), `AppProductCard` (title ellipsis, `Money.format()` price, optional struck `oldPrice`, optional `AppChip` stock, `add` `IconButton`, decided radius token); optional `AppSectionHeader`. New `AppTokens.gridExtent`/`cardWidth` consts. **Conditional emission** (S1 posture `generators/infra.ts:202-228`, `components.ts:183-192`): emitted only when any screen in the app declares sections → section-less apps byte-identical. |
| 5 | Wiring | `builder/src/index.ts`, `builder/src/plan.ts`, `builder/src/gen_context.ts` | `sectionsTargets` once per run → `ctx.sections` (additive map) → `sectionsByPath` re-key → `patterns.sections` additive spread (mirror `index.ts:798-809,916-920,984`; `plan.ts:62`). |
| 6 | Gate | `builder/src/validate.ts` | `[sections]` gate mirroring `[visualIntent]` (:890-1002): (a) re-derive `patterns.sections` and diff plan; (b) closed-enum + `sections` allowed only on `type:"sections"` screens (sections screen with no sections = error, list/detail/wizard with sections = error — never silent fallback); (c) reject any section carrying coordinates/columns/pixels; (d) marker scan: each section type renders its mapped component + every extent is an `AppTokens.*`/`AppRadius.*`/`AppSpacing.*` token reference. |
| 7 | Proof sample | new app: a Keemart-style home | `Product` entity + `HomeScreen` (`type:"sections"`) with the worked-example section tree `VLM_DESIGN_TO_IR_CONTRACT_V2.md:296-307` minus images, `visualStyle` set; goldens 390×844; squeeze 320/390/1400 green; a11y auto-tests; CDP overflow scan; determinism byte-identical. Negative controls: `columns` on a section → schema abort; a list screen with `sections` → `[sections]` FAIL; section-less app regenerates byte-identical. |

## 3. Open-owner defaults resolved for this slice (flag if overridden)

- Archetype label: **`"sections"`** (neutral — `home`/`dashboard` rejected per §15).
- `AppTokens.gridExtent`: 200.0 (constraint: 1 col @ 320, 2 @ 390).
- `emphasis`/`targetId`: **NOT admitted** (D5; §16 pending owner ratification — implement `hero`
  section prominence via position + `heroScale` only; the `[sections]` gate must NOT accept an
  `emphasis` field).
- Provenance: sections ride the top-level screen element (already attested). No per-section
  provenance in v1.

## 4. Hard constraints

- Additive-only. Never delete/edit existing generator output shapes. No changes to
  `scoreApp`/`ScoringInputs`, state-management/routing/persistence DI selection, `route.ts`,
  `generators/test.ts` (squeeze is already unconditional), `a11y_test.ts`, or `routing.ts`.
- Deterministic core stays 0% LLM. Headers keep the `[generated] … template=_sections` marker.
- Every numeric literal must be a token/const — `[literals]` and the `[sections]` marker scan gate
  on it.
- Oracle/approval gates: no new business rule; do not touch `rule.*`/`approve.ts`.
- Commit in small slices (§5). Push to origin/master at the end.

## 5. Slice order (small commits)

1. vocabulary (`types.ts` + schema) + `[sections]` gate stub wiring that FAILs on a probe IR until
   the renderer exists (demonstrable negative control).
2. selector `sectionsFor`/`sectionsTargets` + COMPOSITIONS.sections + plan/ctx wiring.
3. screen.ts `sections` branch + the two organisms + grid/rail primitives.
4. proof sample app (input + oracle-free) + goldens + squeeze + a11y + CDP.
5. `[sections]` full gate + negative-control tests + determinism re-run.

## 6. Verification (all must pass; report exact outputs)

```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app   # VALIDATION PASSED
npm test                                                                  # full builder suite green
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test --update-goldens && flutter test
# determinism: generate twice to temp dirs, diff -r byte-identical; section-less existing samples regenerate byte-identical
# CDP (per AGENTS rule 15): build web + serve, drive HomeScreen at 320/390/1400, overflow scan, a11y snapshot
```

## 7. Report back

≤12 lines: files touched, decisions honored, gate outputs, golden churn list (only the new
screens), determinism proof, CDP evidence path, commit SHAs. Note anything that reopened a §16
owner call.