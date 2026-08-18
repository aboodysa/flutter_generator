# S1 token-system rigor fixes — implementation brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer) — **Date:** 2026-08-18
**Trigger:** owner review of the S1 same-screen showcase (A=friendly/rounded, B=professional/sharp/
strong, C=premium/pill). Verdict: the showcase communicates the three personalities but does NOT
yet prove a rigorous token-only system. This brief is the resulting fixes.

**Read first:** `design/flutter-app-builder/research/SPIKE_S1_REPORT.md`, `design/flutter-app-builder/
research/OPERATING_PRINCIPLES.md` (esp. principle 3: same screen, one varied semantic variable),
`design/flutter-app-builder/research/VLM_DESIGN_TO_IR_CONTRACT_V2.md` §2.3. Also read the review:
`design/flutter-app-builder/research/S1_SHOWCASE_REVIEW.md` (committed with this brief).

## Context — where we are

S1 shipped `ScreenModel.visualStyle {hierarchy, cornerRadius, personality}`, `visualFor()` in
composition.ts maps it to a `VisualSpec {radiusScale, baseSpacing, heroScale, surfaceBias}`, screen.ts
applies the spec verbatim. The showcase rendered the SAME TaskListScreen 3 ways to prove it. The
review's core message: **the token system is real but under-specified** — some differences are
invisible (`heroScale:2`), some are partial (search/FAB don't follow the radius rules), and the
mapping tables describe only SOME layout relationships (spacing/typography are incompletely wired).

## The goal

Make `visualStyle` a rigorous, inspectable **semantic preset** that resolves a COORDINATED SET of
tokens — not just 3-4 deltas. Every claim in the mapping tables must map to a visible, testable
property in the generated screen. Same IR, same screen, only `visualStyle` differs.

## Fixes (in priority order — from the review)

### FIX-1 — Search field + FAB must participate in the cornerRadius rules

Today only the task cards (AppListCard) get the radius override; the `SearchBar` (screen.ts:804) and
`FloatingActionButton` (screen.ts:1078) always use Material defaults (pill-ish/circle-ish), so B
never looks sharp and C never looks distinctly pill. **Change:** route search-field and FAB radii
through `VisualSpec.radiusScale`. Add the two new radius tokens to the scale groups in infra.ts
(generateTheme) — e.g. `sharpSearch=4`, `softSearch=8`, `roundedSearch=12`, `pillSearch=999` and
`sharpFab=8`, `softFab=12`, `roundedFab=16`, `pillFab=999` — as a NEW role dimension (do NOT reuse
`control`). Extend `VisualSpec.radiusScale` to `{control, surface, container, search, fab}` (or a
`{control, surface, container, input, floatingAction}` role-object — pick the cleanest additive
shape; component-role tokens are the review's explicit ask). screen.ts then applies
`radiusScale.search` to the SearchBar's `shape` and `radiusScale.fab` to the FAB's `shape`
(needs `shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(...))`). Do NOT regress
`hasVisual`-conditional emission — apps with no visualStyle stay byte-identical.

### FIX-2 — `heroScale:2` must be observable or removed

Today `heroScale` only biases `heroGap` (screen.ts:213-214), which on a task list is invisible.
The review says: make B's hierarchy visible (bigger/stronger screen title) OR add a real hero
metric OR remove it from this screen. **Decision for this slice (pick 1, document it):**
- (a) route `heroScale` into the AppBar/title `TextStyle` weight/size via a token (`headlineStrong`
  vs `headlineBalanced`), visible in goldens; OR
- (b) when `heroScale===2`, emit a small hero header (e.g. "N open tasks" summary line) above the
  search field, token-styled, visible in goldens; OR
- (c) if neither is clean, REMOVE heroScale from the `strong` mapping (keep the field, keep the
  gap bias, but declare in the mapping table that `strong` no longer claims a scale effect beyond
  what it delivers).
Whichever you pick: it must produce an OBSERVABLE golden difference for B and a passing negative
control that heroScale=1 changes nothing.

### FIX-3 — Complete spacing matrix (screen padding, section gaps, item gap, card inset, FAB inset)

Today `baseSpacing` only overrides `itemGap` (screen.ts:218). The review wants EVERY layout
relationship derived from the same scale. **Change:** extend the personality mapping so each
personality resolves a full spacing row, e.g.
`{ screen: xs|sm|md|lg, section: ..., itemGap: ..., cardInset: ..., fabInset: ... }` — but route it
through tokens (AppSpacing.*), never numbers. Extend `VisualSpec` with `spacing` (a role-object or
named tokens). screen.ts then applies: list `padding` from `spacing.screen`, hero/section gaps from
`spacing.section`, item gap from `spacing.itemGap` (today's behavior, keep), card `EdgeInsets` from
`spacing.cardInset`, FAB `FloatingActionButtonLocation`/margin from `spacing.fabInset`. Keep the
"inherit" default = today's exact output (byte-identical when personality unset). This is the
review's explicit ask: "define every spacing relationship from the same scale."

### FIX-4 — Typography: "strong" must be measurable

Review: "A professional sharp style can easily look merely cramped if it only reduces spacing and
radii. 'Strong' should have a measurable typography or contrast effect." **Change:** add a
`typography` role to VisualSpec (or fold into hierarchy): `hierarchy: strong` → title `w500→w700`
+ metadata contrast step; `soft` → `w400`; `balanced` → default. Implement via emitted token
constants (e.g. `AppType.titleWeight`) applied in screen.ts where the screen title is emitted. This
gives FIX-2 a natural place to live (title weight/size is both the hero-hierarchy and the typography
signal). Every state must be visible in a golden.

### FIX-5 — One semantic selector, not "one variable"

Non-code (docs): update `SPIKE_S1_REPORT.md`/`S1_PROOF_SCREENS.html`/the showcase captions to say:
**"One semantic selector, `visualStyle`, resolves a coordinated set of visual tokens."** And fix any
`professionalff` typo in the showcase captions (should be `professional`). Rebuild the contact-sheet
caption bar with `magick` + pinned SFNS font (the `convert` deprecation breaks it — use
`/System/Library/Fonts/SFNS.ttf`).

### FIX-6 — No conditional presentation logic in components

Review acceptance criterion 3: no component contains `if (style === 'premium')`. Verify none do
(they consume resolved tokens only), and ADD a `[visualToken]` gate addition or extend the existing
`[visualIntent]` gate so it FAILS if any generated component/screen contains a literal comparison
against `visualStyle`/`visualFor` enum values (only composition.ts may branch on the enum). If the
gate already covers this via the raw-literal scan, extend the marker scan to specifically catch
`hierarchy ===|!==|==` / `personality ===` inside emitted Dart.

## Constraints

- Additive only. Do not change `scoreApp`/`ScoringInputs`, DI/routing/persistence selection,
  `route.ts`, the squeeze generator, or a11y generator. Don't weaken `[visualIntent]`, `[contrast]`,
  `[literals]` gates or the S1/S6 tests.
- Deterministic core stays 0% LLM. All numbers must be token names (AppRadius/AppSpacing/AppType),
  never literals at call sites — the `[literals]` gate enforces this.
- `hasVisual`-conditional emission must keep non-visualStyle apps byte-identical (re-run the
  existing S1 determinism test).
- Small additive commits, one fix each. Push to origin/master.

## Verification (all mandatory; report exact outputs)

1. `npm run typecheck:builder` clean.
2. `npx jest test/s1_visual_intent.test.ts` — still 20/20.
3. `npm test` — full suite green.
4. Regenerate the three showcase configs (same IRs, only visualStyle differs) → goldens
   (`flutter test --update-goldens` at 390×844) → **prove FIX-1/2/3/4 are VISIBLE**: the B golden
   differs from A in search-field radius + FAB + title weight + spacing; the C golden differs in
   pill-search + card radius + airy spacing. `magick compare` (or a pixel-diff count) the A-vs-B
   and A-vs-C outputs to quantify the diff (this is the "screenshot-diff test" acceptance criterion).
5. Negative controls: heroScale=1 changes nothing; a no-visualStyle IR regenerates byte-identical
   (existing determinism test covers this — rerun it).
6. New `[visualToken]`/gate marker scan: inject a bogus `hierarchy === "strong"` branch into a
   generated screen → gate FAILS → revert.
7. Report ≤12 lines: per-fix commit hashes, mapping-table changes, golden-diff evidence (numbers),
   gate results, what (if anything) you could not make visible.

## Where the artifacts live

- Showcase configs: `/Users/username/temp/opencode/s1_showcase/{A_rounded,B_sharp,C_pill}` (each has
  `ir.json` + `out/`). Regenerate each, capture `out/test/cap.png` goldens.
- Repo copy of delivered evidence: `apps/tasks/output/qa/s1_showcase/`.
- Theme tokens: `builder/src/generators/infra.ts` (generateTheme, radius groups ~:209-228, AppSpacing
  :255-261, AppRadius :263-268).
- Components: `builder/src/generators/components.ts` (AppListCard radius param :183-192, :297-325).
- Screen application: `builder/src/generators/screen.ts` (visual deltas :203-222, heroGap/itemGap
  :213-218, SearchBar :804, FAB :1078).
- Selector: `builder/src/composition.ts` (VisualSpec :397-402, RADIUS_SCALE :407-412, HERO_SCALE
  :418-419, PERSONALITY_ROW :425-431, visualFor :439-446).
