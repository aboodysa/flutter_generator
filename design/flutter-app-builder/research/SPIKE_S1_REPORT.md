# S1 — Typed `VisualIntent` fragment drives differentiated composition

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — read-only; NO commits, NO
> edits, no `npm`/ts-node/Flutter (1vcpu/1gb box). Repo: `/root/fg-p5`, HEAD `f9521d6`, `git status`
> clean before/after.
> Grounding: DOI benchmark — repo state on 2026-08-18. Sources cited with file:line are the real
> generator source at HEAD.

## 1. Status

Research-only. No scratch generation was run (brief forbids builds on this box), so every claim
is grounded in generator source (`builder/src/**`), the committed design docs
(`VISUAL_GENERATION_REVIEW.md`, `VLM_DESIGN_TO_IR_CONTRACT_V2.md`, `DESIGN.md`, `HANDOFF.md`,
`SPIKE_PLAN.md`), and the committed sample IRs (`apps/{tasks,hr_service}/input/*.ir.json`,
`builder/samples/*.ir.json`). Repository tree was not modified (`git status` clean).

## 2. Hypothesis — and a corrected premise

> A **closed-enum** `VisualIntent {density, hierarchy, cornerRadius, personality, emphasis}` added to
> `ScreenModel` is sufficient to make the §5.2 scoring function emit *measurably different*
> deterministic compositions for 3 sample screens, introducing **zero** new raw literals and staying
> byte-identical on re-run. (`VISUAL_GENERATION_REVIEW.md` §6 S1.)

**Corrected premise 1 (density is NOT in the fragment).** The brief's "the contract's v2 shape moves
`density` to `screen.visualStyle`" is a misreading of `VLM_DESIGN_TO_IR_CONTRACT_V2.md`. §2.3 defines
`screen.visualStyle = {hierarchy, cornerRadius, personality, imagery, emphasis}` (no density), and
worked example A (lines 260-264) keeps `density` at `attributes.density` — app-level, as today
(`types.ts:159`). `density` already exists **and is already consumed** by the §5.2 architecture
scoring (`scoring.ts:80,141`). So "the fragment" splits cleanly: a **per-screen `visualStyle`** with
the psychological set, plus **`density` stays app-level** (shared infrastructure affecting every
screen uniformly).

**Corrected premise 2 (S1 is "0% LLM" the way §5.2 is deterministic).** `scoring.ts` is strictly
*architecture* scoring (state/DI/routing/persistence), while composition is chosen by the separate
registry lookup `compositionFor(archetype)` (`composition.ts:33-42`) — today **fixed per archetype**,
ignoring density and anything visual. The §5.2 sense that matters ("deterministic scoring function
over explicit IR attributes selects the pattern/parameters", `DESIGN.md:202-203`) is therefore
satisfied by a **new composition selector in composition.ts** (the established single-owner pattern
`shellFor/searchFor/scrollFor/actionsFor/statePlacementFor`) that consumes `visualStyle` and returns
composition deltas — *not* by modifying `scoreApp`/`ScoringInputs`, which stay presentation-agnostic.

**Corrected premise 3 (not every proposed enum can ship in v1).** Three of the five proposed fields
have **no renderer consumer today**: `imagery` (no asset pipeline until S3), `emphasis` (no
`sections[]` until S2), and `personality` is only weakly mappable. Under the hypothesis's own
acceptance rule — "MODIFY if ≥1 field never changes output (underdetermined)" (§6 S1) — v1 must
contain exactly the fields that can move bytes *now*.

## 3. Ground truth

| What | Where (file:line) | State |
|---|---|---|
| `AppAttributes` — `density: "compact"\|"comfortable"` **already exists** | `types.ts:159` | real, app-level |
| `AppAttributes` — themeMode/brandSeedColor/responsiveness/locale (D1) | `types.ts:165-181` | real |
| `ScreenModel` — name/entity/type/state/hero/steps/export, **no visualStyle** | `types.ts:265-278` | genuine absence |
| `visualStyle`/`VisualIntent`/hierarchy/cornerRadius/personality/imagery in `builder/src` | grep (0 hits) | **genuinely absent** |
| §5.2 scoring = architecture selection (state/di/routing/persistence) | `scoring.ts:14,114-168` | real |
| `density` consumed into complexity (`1 · i.density`, NONE_FLOOR=3) | `scoring.ts:48-51,80,141` | real |
| Presentation data deliberately NOT fed into architecture scoring (D1) | `scoring.ts:29-33` ("informational only") | real |
| Composition = `compositionFor(archetype)`, spec is `{archetype, layout, hasHero, heroGap, itemGap, surface}` — fixed constants | `composition.ts:13-42` | real; the knobs a visual selector can bias |
| Single-owner selector precedent + plan.json `patterns.{shell,search,scroll,actions,states}` + path re-keying | `composition.ts:112,156,211,293,357`; `index.ts:736-788` | real |
| Radius tokens exist — `AppRadius.control 12 / surface 16 / container 24`; CardTheme uses `AppRadius.surface` | `infra.ts:230-235,249` | real tokens to select from |
| Spacing tokens exist — `AppSpacing xs/sm/md/lg/xl` | `infra.ts:222-228` | real tokens |
| Component registry — `AppListCard(card: bool)` surface driven by `comp.surface`; no raster/image component | `components.ts:108-120,280-308` | real |
| `[theme]` gate proves token wiring + seed | `validate.ts:80-117` | real |
| Gate inventory (same posture for a new `[visualIntent]`) | `validate.ts` (this round's S-HERMETIC: `[search][scroll][actions][states]`… all re-derive via the SAME selector) | real |
| Provenance type `{actor, origin, confidence, confidenceSource, requiresApproval, source}` | `provenance.ts:15-22` | real; **the envelope type already exists** |
| `stampElement`/`humanAttest` recurse **only** `el.fields` — NOT nested objects | `provenance.ts:34,52` | real gap for nested visualStyle |
| `unapprovedElements` checks only top-level array elements | `provenance.ts:63-73` | real gap for nested visualStyle |
| `approve.ts` gate = `humanAttestAll` + `unapprovedElements` count | `approve.ts:12-17` | real; would miss nested unapproved values today |
| Envelope = instance of existing `Provenance`; `evidence` the one proposed extra, stripped pre-Plan | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:63-94,416-426` | real contract statement |
| `visualStyle` shape (no density inside); worked example keeps density app-level | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:188-207,260-264` | real contract statement |
| `emphasis: targetId` must resolve `sections[].id`; no `sections[]` anywhere yet | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:202-207,435`; grep (`sections` in types.ts) 0 hits | S2-gated |
| No sample IR sets `density` today (grep over all samples) | `grep '"density"' builder/samples apps/*/input` → 0 | additivity trivially true |
| Sample screens for the three-way diff | `apps/tasks/input/tasks.ir.json` (4 list/detail screens), `apps/hr_service/input/hr_service.ir.json` (dashboard-ish auth/approval), `apps/ledgerly` (multi-feature) | real |

## 4. Questions (SPIKE_PROTOCOL §6 — answered with evidence)

**Q1 — fragment home: `AppAttributes` vs `ScreenModel`?**
Per-screen `ScreenModel.visualStyle`, additive (`types.ts:265-278` has no collision; index.ts merges
screens wholesale, so absent `visualStyle` flows through unchanged → byte-identical). `density` is
**not** part of the fragment — it stays on `AppAttributes` (`types.ts:159`), already consumed by
`scoring.ts` (§5.2), and contract v2 never moves it (§2.3 / §4). No move/copy: moving breaks
additivity of existing IRs that set it; copying creates two sources of truth. Evidence:
`VLM_DESIGN_TO_IR_CONTRACT_V2.md:130,188-207,260-264` vs the brief's own §Q1 framing.

**Q2 — closed-enum root set: which have a deterministic renderer mapping TODAY?**
- `cornerRadius` — **yes, cleanest**: `AppRadius.control/surface/container` exist (`infra.ts:230-235`)
  and CardTheme already consumes `AppRadius.surface` (`:249`); a selector mapping
  `sharp|soft|rounded|pill → radius-token scale` changes emitted bytes + goldens with zero new
  page-level literals. `rounded` = today's default (byte-identical for absent).
- `hierarchy` — **mappable today via composition fields**: `hasHero`/`heroGap`/`itemGap`
  (`composition.ts:22-31`) are exactly "section-order/resonance" knobs before S2 sections exist.
  Define `strong→hero+scaled gaps`, `balanced→default`, `soft→de-emphasized hero/tighter gaps`.
- `personality` — **weakest, but mappable as a bias-weight table** over the SAME composition fields
  plus radius/spacing scales (a fixed generator-side table, never IR-side numbers). Must be tied to
  a concrete acceptance check (≥1 sample shows different bytes/goldens) or drop to DEFER (G6.1).
- `imagery` — **zero renderer effect today** (no AssetRequest, no asset ladder, no image component
  in `components.ts`; S3 owns it). Pure vocabulary under the hypothesis's own acceptance rule →
  **DEFER to S3**, out of v1's scored set.
- `density` — **already mapped and consumed** app-level (Q1); no duplicate in the fragment.

**Q3 — `emphasis`: targetId-now vs semantic-role-now?**
**DEFER to S2 in both shapes.** `targetId` cannot resolve (no `sections[]`; acceptance check 4 would
be vacuous — a schema field with no validator teeth, i.e. G6.1). A transitional semantic-role enum
(primary_hero/product_grid/order_status) is speculative vocabulary that S2's catalog does not
contain (zero such sections exist) and would have to be remapped onto `targetId` when S2 lands —
exactly the future rewriting S1 is charged to minimize. Least-future-rewriting = ship nothing now;
S2 lands `sections[]` **and** `emphasis.targetId` together with real validation.

**Q4 — scoring effect & acceptance criteria.**
Deterministic mapping (proposed, to be implemented by the slice):
`density(compact)` → tighter base scale; `hierarchy` → hero/resonance deltas on `CompositionSpec`;
`cornerRadius` → `AppRadius`-scale selection; `personality` → fixed bias weights (spacing
generosity / radius tendency / `surface` preference). Acceptance for "measurably different":
(a) 3 screens with **distinct** `visualStyle` produce distinct screen bytes + distinct
`plan.json patterns.visual` + distinct goldens; (b) zero new raw literals (emitted screens consume
only `AppRadius*`/`AppSpacing*`/`comp` fields — asserted by the `[visualIntent]` scanner +
existing `[arch]` raw-color gate); (c) re-run is byte-identical (`[determinism]` + `[plan-determinism]`
already prove it; `patterns.visual` rides the plan diff). Suggested trio from existing IRs:
`tasks/TaskListScreen` (utility, `friendly/rounded`), `hr_service/LeaveRequestDetailScreen`
(`professional/sharp/strong`), `ledgerly` (dashboard archetype, `premium/soft`) — all existing, no
new sample required; a true commerce home is a post-S2 artifact, not an S1 prerequisite.

**Q5 — provenance: reuse `provenance.ts` or a fragment-carried envelope?**
Reuse the **existing** `Provenance` type (`provenance.ts:15-22`); an enveloped
`visualStyle.hierarchy` value *is* an instance of it (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:63-94,423-426`
reconciles exactly this). What does NOT exist is **recursion into nested envelopes**:
`stampElement`/`humanAttest` recurse only `el.fields` (`provenance.ts:34,52`) and
`unapprovedElements` inspects only top-level array elements (`:63-73`). Without extending that
recursion, `approve.ts` would attest a screen, report 0 unapproved, and silently leave
`visualStyle.hierarchy.origin=llm-inferred` — a trust-boundary hole (violates acceptance check 7,
"no silent promotion"). So: reuse the type, extend three small functions (S-sized) or add a generic
envelope walker, and add the `[visualIntent]` gate.

## 5. Evidence

All cited in §3. Highlights:
- `visualStyle` genuinely absent in `builder/src` (grep 0 hits) — nothing to extend, schema is clean.
- `density` already real + consumed (`types.ts:159`, `scoring.ts:80,141`) and contract v2 keeps it
  app-level — the brief's "density moves into visualStyle" is contradicted by the contract it tells
  the spike to match (§2/§4 of the contract vs the brief's §Q1).
- Composition today is archetype-fixed (`composition.ts:22-42`); the four fields that do exist
  (`hasHero/heroGap/itemGap/surface`) are the exact knobs a visual selector can bias without a new
  widget vocabulary.
- `AppRadius`/`AppSpacing` token families exist (`infra.ts:222-235,249`); `AppListCard.surface`
  renders via a bool (`components.ts:280-308`) — a cornerRadius/space change is byte- and
  golden-visible with no registry addition.
- Provenance machinery exists but is shallow (top-level + `.fields` recursion only;
  `provenance.ts:27-35,46-53,63-73`) — the one genuine new machinery S1 needs.
- No sample IR sets `density` — additivity/byte-identical for existing IRs is trivially preserved.

## 6. Semantic contract

- **New IR (additive, closed):** `ScreenModel.visualStyle?: VisualStyleModel` where
  `VisualStyleModel = { hierarchy?, cornerRadius?, personality? }`, each value an envelope
  `{ value: <closed enum>, origin, confidence?, confidenceSource?, evidence?, requiresApproval }`
  conforming to the existing `Provenance` type. Closed v1 enum sets:
  `hierarchy {soft|balanced|strong}`, `cornerRadius {sharp|soft|rounded|pill}`,
  `personality {professional|friendly|premium|playful|minimal}`. Any other key/value = **schema
  error** (hard reject), so free-form never enters.
- `density` = **unchanged** existing `AppAttributes.density` (`types.ts:159`) — consumed by the
  visual selector as a base-scale input, additionally to its existing §5.2 arch role.
  No duplication.
- `imagery` (→S3) and `emphasis` (→S2) are **outside the v1 scored set**; the validator must reject
  them in v1 IRs and the contract v2 §2.3 receives a version amendment (worked-example A stays the
  post-S2/S3 end-state, not the v1 shape).
- **Hard rule (unchanged):** `visualStyle` never selects a widget/asset. It biases the deterministic
  selector → composition deltas from tokenized components. `personality: friendly` → radius/spacing
  bias; never "use FriendlyCard" (no such component).

## 7. Determinism analysis

- **Inputs:** IR (`screen.visualStyle` envelopes + `attributes.density`) → schema-validate → the
  new `visualFor(screen, ir)` selector (pure) → `VisualSpec` deltas → `ctx.visual` (by screen name)
  → `writePlan` `patterns.visual` (by screen path) → screen.ts consumes deltas verbatim. No
  randomness, time, env, network, filesystem enumeration, LLM composition.
- **Selector is deterministic-by-construction:** enum → fixed generator-side mapping table (the same
  style as `DENSITY/RESPONSIVENESS` ordinals in `scoring.ts:48-52`). No magic numbers learned from
  output; tokens are the only emitted numbers.
- **Where determinism is proven:** existing `[determinism]` + `[plan-determinism]` gates
  (`validate.ts:1091-1117`; `DETERMINISM_CONTRACT.md`) byte-diff `lib/` and JSON-diff `plan.json` —
  `patterns.visual` rides the existing plan diff, no new determinism machinery needed.
- **The hypothesis's "stays byte-identical on re-run" is inherited, not new** — the only plan-side
  surface is the additive `patterns.visual`.

## 8. Ownership analysis

- `types.ts` — add `VisualStyleModel` (+ per-field envelope interface) to `ScreenModel`; additive.
- `composition.ts` — **the single new selector**: `visualFor(screen, ir): VisualSpec | null` +
  `visualTargets(ir)` (name-keyed), same posture as `shellFor/searchFor/scrollFor/actionsFor/
  `statePlacementFor` (contract §1 master principle: the ONE place that decides; shared-generator
  rule respected — no fork, no second decision site).
- `scoring.ts` — **untouched** for architecture scoring (presentation data never feeds complexity;
  the D1 precedent at `scoring.ts:29-33`). The §5.2-sense selector lives in composition.ts.
- `screen.ts` — consumes `VisualSpec` only (hero/resonance, radius scale, spacing scale, `surface`
  bias) — never re-derives (same posture screen.ts already applies to search/scroll/actions/states).
- `infra.ts` — (optional, additive) emit the expanded radius **token scales** as consts
  (`AppRadius.sharp.*` etc.) so the selector has library values, not newly-invented numbers.
- `generators/components.ts` — `AppListCard` optionally accepts a `radius` (defaulting to today's
  `AppRadius.surface` → byte-identical for absent), or the radius delta is applied via a per-screen
  `CardTheme` override in screen.ts; implementer picks the lower-churn of the two.
- `index.ts` — `visualByPath(ir, visual)` re-key + `writePlan` gains `patterns.visual` (the 10th
  pattern slot, same additive pattern as `statesByPath`, `index.ts:758-761,772-788`).
- `provenance.ts` — extend `stampElement`/`humanAttest` recursion (or add a generic envelope
  walker) to descend into nested `visualStyle` envelopes; extend `unapprovedElements` to discover
  them.
- `validate.ts` — new `[visualIntent]` gate (below).

## 9. Failure modes (each deterministic)

| Condition | Deterministic outcome |
|---|---|
| `visualStyle` value not in the closed v1 set (or unknown key) | Schema/`[visualIntent]` **validation error** — generation refuses the IR |
| `imagery`/`emphasis` declared in a v1 IR | `[visualIntent]` error (v1 vocabulary closed; field joins with S3/S2) |
| Enveloped value missing `origin`/`requiresApproval` | `[visualIntent]` hard reject (acceptance check 6) |
| Enveloped value `requiresApproval: true` at Plan time | Generation rejected until `approve.ts` flips it (`human-confirmed`, `actor=human:attested`) — no silent promotion |
| Screen with `visualStyle` but the selector returns `null` (unexpected enum) | Defensive `null` → today's composition, byte-identical; gate flags underdetermined enum |
| Screen with visual deltas — decided-but-absent marker in source | `[visualIntent]` FAIL |
| Marker present without a decided delta (stale plan) | `[visualIntent]` FAIL |
| A raw literal (px/hex) appears in an emitted visual path | `[visualIntent]` + `[arch]` FAIL |
| A scored field never changes bytes across the 3 proof screens | Underdetermined → drop the field from v1 (DEFER), MODIFY the gate's closed set |

## 10. Architecture impact

Classification **A — pure presentation**, with one re-used trust-boundary touch:
- Presentation only: radius scale, spacing scale, hero/resonance deltas, `surface` bias all live in
  the composition/screen emission path. No interaction/state, no data-flow, no navigation, no
  runtime authorization.
- Trust boundary reuse: per-value provenance envelopes ride the existing `Provenance` type and the
  existing `approve.ts` gate; S1 does NOT weaken the "no silent promotion" rule — it makes it
  recursive.
- Explicitly **NOT** a change to `scoreApp`/`ScoringInputs`, `stateManagement/DI/routing/
  persistence` selection, or runtime architecture. This is not called cosmetic — it is a visual
  richness layer (the reviewer's §5 "§3 Visual Intent" accept, mapped onto the existing selector +
  plan contract).

## 11. Cost/complexity

- Generator: **S–M** — one new pure selector + ScreenModel emission deltas + (optional) radius
  token-scale consts; screen.ts additions are conditional literals around existing types.
- IR/schema: **S** — additive optional `visualStyle`; closed enums; no changes to existing fields.
- Validation: **S** — one gate reusing the `[states]`/`[actions]` re-derive-and-scan posture.
- Testing: **S–M** — 3-sample proof (bytes + plan + goldens all differ), null-set byte-identical,
  negative controls: unapproved envelope → blocked; raw literal → FAIL; stale/absent markers → FAIL;
  determinism re-run untouched.
- Golden churn: **YES, by design** — exactly the 3 screens that declare `visualStyle` (the point of
  the spike); every screen without it is byte-identical.
- CDP/a11y: radius/spacing deltas are low-risk; `pill` radius on a list card is the one case worth
  an eyeball + overflow scan at 320/390/1280 (a CDP `[visualIntent]` extension, not a blocker).
- Determinism risk: **Low** — pure selector; the only new plan surface is additive.
- **Benefit worth the cost: yes if ≥2 of the 3 v1 fields provably move output** (acceptance
  criteria §4/Q4); if only `cornerRadius` does, the honest outcome is a slimmer v1 + DEFER of the
  rest.

## 12. Findings

1. **`density` is already real, app-level, and consumed** (`types.ts:159`; `scoring.ts:80,141`) and
   contract v2 keeps it there — the brief's premise that the v2 shape "moves density into
   visualStyle" is false; the fragment splits: per-screen psychological set + app-level density.
2. **Composition today ignores everything visual.** `compositionFor(archetype)` returns fixed
   constants (`composition.ts:13-42`); the future difference can only come from a NEW selector, not
   a tweak of `scoreApp`. The four existing spec fields (`hasHero/heroGap/itemGap/surface`) are
   exactly the biasable knobs — measurable in screen bytes and goldens.
3. **Three of the five proposed fields have a real deterministic mapping today; two do not.**
   `cornerRadius` (token-scale selection over `AppRadius`, `infra.ts:230-235`), `hierarchy`
   (hero/resonance deltas), and `density` (already mapped) can move output. `imagery` has no
   consumer until S3; `emphasis` has no `sections[]` until S2 — G6.1-flagged; both defer.
4. **The provenance machinery covers flat IR but not nested envelopes.** `stampElement`/`humanAttest`
   recurse only `.fields` and `unapprovedElements` checks only top-level elements
   (`provenance.ts:27-53,63-73`) — nested `visualStyle` values would silently survive attestation.
   The type is right; the traversal is the gap.
5. **No sample sets `density` and no current IR sets any visual field** — S1's additivity/byte-
   identical claim is vacuous-for-now and only becomes load-bearing when the 3 proof screens are
   declared.
6. **The envelope type already exists** and the v2 contract explicitly reuses it
   (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:63-94,423-426`) — a fragment-carried parallel envelope would be
   pure duplication.

## 13. Decisions (4, CLOSED)

**D1 — Fragment home: ADOPT per-screen `ScreenModel.visualStyle`; MODIFY the brief's density
premise (density stays app-level, never moved/copied).**
Evidence §3/Q1: `ScreenModel` (`types.ts:265-278`) is additive-clean; `AppAttributes.density`
(`:159`) is real + consumed (`scoring.ts:80,141`) + stays app-level per contract v2 (§2.3, §4);
moving/copying breaks additivity or creates dual truth. Net fragment = {per-screen
hierarchy/cornerRadius/personality} + {unchanged app-level density}.

**D2 — Field set: ADOPT `cornerRadius`, `hierarchy`, `personality` (with mandatory mapping +
proof each moves output); DEFER `imagery` → S3 and `emphasis` → S2; CONFIRM `density` handling as
status-quo-app-level. MODIFY v1 closure accordingly.**
Evidence §3/Q2: radius + hero/rhythm mappings exist on real tokens/`CompositionSpec` today; `imagery`
has no consumer before the S3 asset ladder (`components.ts` has no image surface); `emphasis` cannot
resolve without `sections[]`. Zero sample sets `density` → status quo is additively safe.

**D3 — `emphasis`: DEFER to S2, in the contract's `targetId` shape — do NOT ship a
semantic-role-enum transitional.**
Evidence §3/Q3: `targetId` without `sections[]` is an unresolvable ref = schema teeth with nothing
to validate (G6.1 + acceptance check 4 vacuous); a role-enum now (primary_hero/product_grid/
order_status) names catalog sections that do not exist and would be rewritten at S2 — the exact
future-rewrite cost S1 must avoid. Least-future-rewriting = nothing now; S2 lands both together.

**D4 — Provenance: ADOPT reuse of the existing `Provenance` type/envelope + REQUIRED additive
recursive traversal; add the `[visualIntent]` gate.**
Evidence §3/Q5: envelope = instance of `Provenance` (`provenance.ts:15-22`; contract v2 §1.5/§6);
the real gap is traversal: extend `stampElement`/`humanAttest`/`unapprovedElements` (or a generic
envelope walker) so nested visualStyle values are stamped, attested, discovered, and (until
attested) BLOCK generation without silent promotion.

## 14. Recommended implementation (slice spec for the Mac implementer)

> One slice, S, per the MODIFY conclusion above. All changes additive; nothing in `scoreApp`/
> `ScoringInputs`/existing patterns touched.

**14.1 Fragment shape (`types.ts`)**
```ts
// additive — absent = today's output byte-identical
export type VisualHierarchy = "soft" | "balanced" | "strong";
export type VisualCornerRadius = "sharp" | "soft" | "rounded" | "pill";
export type VisualPersonality = "professional" | "friendly" | "premium" | "playful" | "minimal";

export interface VisualStyleValue<T> extends Provenance { value: T }   // reuse provenance.ts
export interface VisualStyleModel {
  hierarchy?: VisualStyleValue<VisualHierarchy>;
  cornerRadius?: VisualStyleValue<VisualCornerRadius>;
  personality?: VisualStyleValue<VisualPersonality>;
}
// in ScreenModel: visualStyle?: VisualStyleModel;
```
`density` stays `AppAttributes.density` (no new field).

**14.2 Selector (`composition.ts`) — the single owner (contract §1 posture)**
```ts
export interface VisualSpec {
  radiusScale: { control: string; surface: string; container: string };  // token names, e.g. "AppRadius.soft.control"
  baseSpacing: string;          // "AppSpacing.xs|sm|md" (density bias)
  heroScale: 0 | 1 | 2;         // hierarchy: soft=0 (de-emphasized), balanced=1 (default preserve), strong=2
  surfaceBias: "plain" | "card" | "inherit"; // personality; "inherit" = archetype default
}
export function visualFor(s: ScreenModel, ir: FeatureModel): VisualSpec | null;  // closed-enum → fixed table
export function visualTargets(ir: FeatureModel): Map<string, VisualSpec>;        // name-keyed
```
Mapping table is generator-side constants (like `DENSITY` ordinals, `scoring.ts:48-52`): e.g.
`cornerRadius.rounded → AppRadius.soft scale` (the current default), `sharp → {control:4, surface:8, container:16}`,
`soft → {8,12,20}`, `pill → {16,24,999}` — all as **new emitted `AppRadius.*` consts in `infra.ts`**
(never IR-side numbers). `personality` weights: `friendly → baseSpacing=md, surfaceBias=card, radiusBias=+1`,
`minimal → baseSpacing=xs, surfaceBias=plain`, `professional/premium/playful` → a declared fixed row.
If any row moves no bytes on any of the 3 proof screens → drop that row (DEFER the value).

**14.3 Wiring (`index.ts` / `screen.ts` / `plan.json`)**
- `index.ts`: `visualByPath(ir, visual)` re-key + `writePlan` gains `patterns.visual`
  (`{ …(hasVisual ? { visual } : {}) }`, same additive slot as `statesByPath`, `index.ts:758-788`).
- `screen.ts`: read `ctx?.visual?.get(s.name)`; apply deltas verbatim (hero scale → `comp.hasHero`/
  `heroGap`; radius → `CardTheme(shape: ...)` override or `AppListCard(radius: ...)` defaulting to
  today's; spacing → `itemGap`/`heroGap` values from `AppSpacing`; `surfaceBias` → `comp.surface`
  unless `inherit`). Never re-derive.

**14.4 Trust boundary (`provenance.ts`)**
Extend `stampElement`/`humanAttest` to recurse into `el.visualStyle?.<key>?.value` envelopes
(or a generic "has `value` + `origin`" envelope walker); extend `unapprovedElements` so
`approve.ts` counts and blocks nested unapproved values.

**14.5 `[visualIntent]` gate (`validate.ts`)**
Mirror `[states]` exactly: (a) re-derive `visualFor` fresh per screen → diff `patterns.visual`
(missing/wrong/stale per path, INCLUDING the null set — no visualStyle ⇒ no plan entry); (b) scan
every generated screen marker (decided-but-absent / present-but-undecided FAIL); (c) assert every
consumed value is attested (`requiresApproval !== true`, `origin` in
`human-confirmed|deterministic`); (d) closed-v1 enum check (imagery/emphasis in a v1 IR → error);
(e) raw-literal scan over the visual path only (no `padding: <num>`/hex/radius numerics introduced).
New FAIL-set fields: `visualIntent`.

**14.6 Proof samples (3, all existing IRs — no new sample required)**
1. `apps/tasks` `TaskListScreen` → `friendly / rounded` (vs today's default = the null-ish baseline).
2. `apps/hr_service` `LeaveRequestDetailScreen` → `professional / sharp / strong`.
3. `apps/ledgerly` (dashboard archetype screen) → `premium / soft`.
Acceptance: the three screens' generated files + `plan.json patterns.visual` + goldens **differ**;
every other screen (no visualStyle) is **byte-identical**; `[determinism]`/`[plan-determinism]`
pass; re-run md5 of `lib/` + `plan.json` stable.

**14.7 Verification commands (Mac implementer)**
```
npm run typecheck:builder
# 1. add visualStyle to the 3 proof screens, regenerate:
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app   # [visualIntent] PASS, incl. negative controls (unapproved envelope, raw literal, stale plan)
npx ts-node --transpile-only builder/src/approve.ts <ir>   # nested visualStyle values attested; unapproved→0
cd apps/<app>/output/app && flutter test --update-goldens && flutter test   # goldens differ for the 3, stable otherwise
# determinism:
npx ts-node --transpile-only builder/src/index.ts <ir> <tmp2> && diff -r <app>/output/app/lib <tmp2>/lib
# negative control: inject `visualStyle.hierarchy.requiresApproval:true` post-approve → generation refused
```

## 15. Rejected alternatives

- **Density moved/copied into `screen.visualStyle`** (brief's original framing): rejected — breaks
  the additivity of IRs that already set `attributes.density` (`types.ts:159`) and splits one fact
  into two sources; contract v2 never does it.
- **Extending `scoreApp`/`ScoringInputs` to weigh visual inputs for architecture
  (state/DI/routing) selection:** rejected — presentation data must not feed architecture
  complexity (D1 precedent, `scoring.ts:29-33`); the §5.2 sense S1 needs is a composition selector,
  not an architecture one.
- **`emphasis` as a now-semantic-role enum (primary_hero/product_grid/order_status):** rejected —
  names S2 catalog sections that don't exist; guaranteed rewrite when S2 delivers `sections[]` +
  `targetId`. Witness: `productGrid` already sits on the S2/S3 side of the contract
  (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305`).
- **Imagery admitted as "informational, no scored weight yet":** rejected — the hypothesis's own
  acceptance rule (G6.1: a field that never changes output = MODIFY/REJECT) makes an unscored field
  worse than absent; it lands with its consumer (S3).
- **A bespoke fragment-carried provenance envelope:** rejected — duplicates the existing
  `Provenance` type (`provenance.ts:15-22`) that the v2 contract already standardizes on
  (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:423-426`); drift risk for zero benefit.
- **A brand-new commerce-home sample for the 3-screen proof:** rejected (deferred to S2's richer
  catalog work) — 3 existing screens from tasks/hr_service/ledgerly already exercise distinct
  archetypes and give a real diff today. (A commerce home is S2-catalog work, not an S1 blocker.)

## 16. Open questions (owner / contract-owner calls)

- **Contract v2 §2.3 amendment sign-off:** v1 `visualStyle` = `{hierarchy, cornerRadius,
  personality}`; `imagery` re-opens at S3 and `emphasis.targetId` at S2 (worked example A stays the
  post-S2/S3 end-state). Requires the contract owner (Config/decision-log) to ratify the reduced v1
  set — the report RECOMMENDS MODIFY, does not unilaterally rewrite the contract.
- **`personality` weights** — 3 of 5 values (professional/friendly/minimal) have obvious fixed rows;
  `premium`/`playful` MAP is weakest (risk of moving no bytes without inventing hero/surface combos
  that outrun archetype defaults). Implementer decision: ship with 3 rows, DEFER `premium`/`playful`
  until a sample demands them.
- **Radius application mechanism** — per-screen `CardTheme` override (no component change, churns
  goldens slightly) vs `AppListCard(radius:)` param defaulting to today's (additive, byte-identical
  null set). Pick the lower-churn; both acceptable to this spike.
- **`pill` radius on list-row Cards** needs a visual-overflow sanity pass at 320/390 (CDP) once the
  slice lands — flag, not blocker.

## 17. Follow-up

- Report 4 CLOSED decisions + evidence to the orchestrator (Zen model) on Telegram: **D1 ADOPT
  (per-screen)/MODIFY-premise (density stays app-level), D2 ADOPT {hierarchy,cornerRadius,
  personality} + DEFER imagery→S3 + DEFER emphasis→S2, D3 DEFER-to-S2 (no transitional enum),
  D4 ADOPT reuse + REQUIRED recursive traversal + `[visualIntent]` gate.**
- Capture a brief for the (Claude-first) implementer: one S slice per §14.1–14.7 on the Mac
  (types.ts + composition.ts selector + index.ts wiring + screen.ts consumption + provenance
  recursion + `[visualIntent]` gate + 3 proof samples + goldens + CDP overflow probe for `pill`).
- Contract amendment note (decision-log entry): "v2 §2.3 `visualStyle` v1 set reduced per S1;
  `imagery`→S3, `emphasis.targetId`→S2."
- This report lives under `design/flutter-app-builder/research/` (research archive).