# S2 — Section-layout IR renders a rich home with zero pixel coordinates

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — read-only; NO commits, NO
> edits, no `npm`/ts-node/Flutter (1vcpu/1gb box). Repo: `/root/fg-p5`, HEAD `d937b02`, `git status`
> clean before/after (single untracked deliverable: this file).
> Grounding: repo state on 2026-08-18, freshly synced to current master (ships S1: `ScreenModel.
> visualStyle`, `visualFor`, `[visualIntent]` gate, `test/s1_visual_intent.test.ts`). Sources cited
> with file:line are the real generator source at HEAD.

## 1. Status

Research-only. No scratch generation ran (the brief forbids builds on this box), so every claim is
grounded in generator source (`builder/src/**`), the committed schemas (`builder/schemas/*.json`),
the committed design docs (`VISUAL_GENERATION_REVIEW.md`, `VLM_DESIGN_TO_IR_CONTRACT_V2.md`,
`SPIKE_PLAN.md`, `SPIKE_S1_REPORT.md`, `HANDOFF.md`), and the S1 regression suite
(`test/s1_visual_intent.test.ts`). Repository tree was not modified (`git status` clean before
writing this file).

## 2. Hypothesis — and corrected premises

> A declarative section-list IR (`Header/Search/Hero/Section[...]`) added to `ScreenModel` renders a
> Keemart-style home deterministically using only existing tokens + registry components, with zero
> absolute positioning or coordinate literals, and passes the overflow validator at 320/390/1400-wide
> viewports. (`VISUAL_GENERATION_REVIEW.md:116-119`; decision criteria: ADOPT if renders +
> overflow-clean at 3 viewports + no coordinate literals; MODIFY if some sections need a new
> registry component; REJECT if any section requires absolute x/y.)

**Corrected premise 1 — the overflow validator is a GENERATED STRUCTURAL TEST, not a validate.ts
gate.** `grep overflow|viewport|fit|squeeze builder/src/validate.ts` returns zero hits. The
overflow gate is `ViewportSqueezeTestGenerator` (`generators/test.ts:685-761`): it emits one
`viewport_squeeze_test.dart` that renders **every declared screen** at `320×480 / 390×844 /
1400×900` (`test.ts:700-704`) and asserts `tester.takeException()` is null — i.e. no RenderFlex
overflow or other layout exception (`test.ts:730-741`). It is run under `flutter test` in the
generated app, unconditionally, for every screen (`test.ts:690-692`), which is exactly what makes
the 320/390/1400 criterion automatically apply to any future section-rendered screen. (The matrix
is `1400×900`, not bare "1400-wide"; heights 480/844/900.)

**Corrected premise 2 — there is no `builder/src/schema/` and no `builder/src/components.ts`.**
Schemas live at `builder/schemas/*.json` (the brief's `screen.schema.json` is
`builder/schemas/screen.schema.json`); the component registry is `builder/src/generators/
components.ts`. Schemas are a HARD generation gate inside `generateApp` (`index.ts:929-934`,
`writeFeatureArtifacts` calls `check(...)` per IR item, throwing `[validator] INVALID` on
`additionalProperties` violations — proven by S1's negative control, `test/s1_visual_intent.test.ts:
249-262`). So "schema-teeth" for sections means: closed section-`type` enum + `additionalProperties:
false` on every section object → free-form positional fields are impossible by construction.

**Corrected premise 3 — the "existing `dashboard` archetype" the VLM contract points S2 at does NOT
exist.** Worked example A uses `"type": "dashboard"` calling it "existing archetype, NOT market"
(`VLM_DESIGN_TO_IR_CONTRACT_V2.md:286,323-326`), but `COMPOSITIONS` today holds only
list/detail/wizard (`composition.ts:24-31`) and the screen schema's `type` enum is only
`["list","detail","wizard"]` (`screen.schema.json:20-26`). `compositionFor("dashboard")` would
warn + fall back to `LIST_SPEC` (`composition.ts:33-42`), and the schema would **reject the IR
outright**. S2's routing change must therefore ADD the sections archetype to three places
(composition.ts COMPOSITIONS + screen.schema.json enum + screen.ts branch), not "reuse" one.

**Corrected premise 4 — two proposed section types have NO registry building block.** The registry
(`generators/components.ts:35-164`) exposes AppTokens, PrimaryButton, LoadingState, ErrorState,
EmptyState, AppAvatar, AppListCard, AppChip, AppStatusDot, AppScrollBehavior — no image surface
(no raster component anywhere; S3 owns assets), no card-grid organism, no promo/banner organism,
and the generator has never emitted `GridView`/`SliverGrid`/`ListView.horizontal`/`AspectRatio`/
`CustomScrollView` (grep across `builder/src/generators`: zero hits; the only "grid-ish" widget is
`Wrap` for ChoiceChips, `screen.ts:167`, `crud_form.ts:149`). So `hero`/`promoBanner`/`productGrid`
trigger the plan's **MODIFY branch** ("some sections need a new registry component"). No section
requires absolute x/y → not REJECT.

**Net verdict of the hypothesis (stated up front, proven below): MODIFY** — the section-list IR is
sound, deterministic, coordinate-free, and overflow-covered at the 3 viewports by the existing
squeeze gate, but 2 of the v1 section types need one new tokenized organism each, and the archetype
itself must be added (corrected premise 3).

## 3. Ground truth

| What | Where (file:line) | State |
|---|---|---|
| S2 hypothesis + decision criteria | `VISUAL_GENERATION_REVIEW.md:116-119` | real, binding |
| §5-Modified §12 (section-list IR accept; "constraints, never pixel coordinates") | `VISUAL_GENERATION_REVIEW.md:98` | real |
| §7 slotting — S2 purely-after P5/D2 | `VISUAL_GENERATION_REVIEW.md:151` | real |
| Keemart home worked example — section tree + id/order/no-column-count | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:246-321` (`sections[]` :296-307; "productGrid does NOT carry columns" :304-305; `type:"dashboard"` :286; S2-gate note :323-326) | real contract statement |
| `ScreenModel` — name/entity/type/state/hero/steps/export/visualStyle, **no `sections`** | `types.ts:267-285`; grep `sections` in types.ts/schemas → 0 hits | genuine absence |
| S1 closed enums + `VisualStyleValue<T> extends Provenance` | `types.ts:290-305` | real (S1 shipped) |
| `CompositionSpec` + `COMPOSITIONS` (list/detail/wizard ONLY) | `composition.ts:13-42` | real; no home/sections entry |
| `compositionFor` unknown-archetype fallback (warn → LIST_SPEC) | `composition.ts:33-42` | real |
| Single-owner selector family (`shellFor/searchFor/scrollFor/actionsFor/statePlacementFor/visualFor`) | `composition.ts:112,156,211,293,357,435` | real — S2's `sectionsFor` slots in beside them |
| `visualFor` → `VisualSpec` (radiusScale/baseSpacing/heroScale/surfaceBias) | `composition.ts:393-442`; mapping tables `:403-428` | real |
| screen schema — `type` enum closed to list/detail/wizard; `additionalProperties:false` top + visualStyle | `screen.schemas/screen.schema.json:20-26,104-152,191` | real; **the schema-teeth precedent** |
| Schema = hard generation gate (Ajv throw in generateApp) | `index.ts:929-934`; `writeFeatureArtifacts` `check` `:632` | real |
| screen.ts renderer — `comp.layout` branch (detail/wizard/list) | `screen.ts:351-760` (detail :351, wizard :457, list :561); hero block :317-323 | real — the routing insertion point |
| screen.ts consumes VisualSpec verbatim (never re-derives) | `screen.ts:203-222` | real (S1) |
| D2#2 overflow precedent — `Flexible` + `TextOverflow.ellipsis` on variable text | `screen.ts:380-386` | real (the elision rule sections inherit) |
| SearchBar as stock Material widget used directly (registry covers only custom atoms) | `screen.ts:662-677` (:662-665 rationale) | real — precedent for grid/rail stock widgets |
| FAB (stock FloatingActionButton) — `floatingCart` equivalent | `screen.ts:936-940` | real |
| ViewportSqueezeTestGenerator — 320×480/390×844/1400×900, `takeException()` null, every screen, unconditional | `generators/test.ts:685-761` (matrix :700-704, case :730-741) | **the overflow validator** |
| `takeException` catches RenderFlex overflow (RTL tests rely on it) | `generators/test.ts:361-375` | real |
| `[visualIntent]` gate — re-derive+diff plan, unapproved nested, closed enum, marker scan, token-only radius | `validate.ts:890-1002` (`specEqual` :938, unapproved :915-917, closed-enum :920-926, markers :968-998) | real — the template a `[sections]` gate mirrors |
| `[literals]` raw `EdgeInsets` digit scan (presentation layer) | `validate.ts:263-280` | real — raw-literal guard sections must pass |
| Component registry contents (11 defs) | `generators/components.ts:35-164` | real; no banner/card-grid/product organism |
| AppListCard (list-row only; S1-conditional radius param) | `generators/components.ts:297-325`; radius `:183-192` | real |
| AppTokens consts (spacing/radius/primary) + conditional emission posture | `generators/components.ts:204-208`; S1 radius-scale groups `generators/infra.ts:202-228`; AppSpacing `:255-261`; AppRadius `:264-268` | real — the new-token home for `gridExtent`/`cardWidth` |
| plan.json `patterns.*` + `visual` additive slot | `plan.ts:26-64`; `index.ts:812-835` (`hasVisual`/patterns spread :817-829) | real — `patterns.sections` rides the same slot |
| GenContext — `visual?: Map<string, VisualSpec>` | `gen_context.ts:18-40` | real — `sections` map adds here |
| Provenance recursion already covers nested `visualStyle` envelopes | `provenance.ts:30-52,63-102` | real (S1 D4) — a `sections[]` array is just top-level array elements |
| Routing — every screen gets a route via `screenPath`; non-list/detail/wizard types get `""` suffix | `routing.ts:10-37`; `route.ts:53` (`screenRoutes`), `:116-117` (`initialLocation = screens[0]`) | real — **a sections home needs NO route.ts change** |
| A11y per-screen tests run for EVERY declared screen | `generators/a11y_test.ts:25-70` | real — sections screens covered free |
| Golden test = screens[0] at 390×844 | `generators/test.ts:136-169` | real |
| No `GridView`/`SliverGrid`/horizontal `ListView`/`AspectRatio`/`CustomScrollView` anywhere in generators | grep `builder/src/generators` (0 hits) | genuine absence — grid/rail are new layout primitives |
| S2 status in flight; this spike is the closure run | `HANDOFF.md:59` | real |

## 4. Questions (SPIKE_PROTOCOL §6 — answered with evidence)

### Q1 — Section-list vocabulary design (spec, closed set + constraint spec)

**Proposed v1 closed section-type set** (each `{ id, type, title?, children? }`, order IS the
hierarchy — `VLM_DESIGN_TO_IR_CONTRACT_V2.md:296-307`):

| # | Section type | Maps to (today) | New registry component? |
|---|---|---|---|
| 1 | `header` | AppBar (stock, `screen.ts:979`) + optional brand Text with token Padding | no |
| 2 | `search` | Material `SearchBar` (stock — same widget P2 already emits, `screen.ts:666-677`) | no |
| 3 | `hero` | none | **yes — `AppHeroBanner` organism** |
| 4 | `promoBanner` | none | **yes — `AppHeroBanner` compact variant** |
| 5 | `productGrid` | none (no grid, no product card) | **yes — `AppProductCard` organism + grid layout primitive** |
| 6 | `horizontalCards` | `AppListCard` (existing) inside a horizontal `ListView.builder` + token width | no |
| 7 | `sectionHeader` | Text + token Padding (or tiny new `AppSectionHeader`) | optional/no |
| 8 | `section` (grouping container) | `Column` + `SizedBox` spacing (children are flat leaf sections) | no |
| 9 | `divider` | `Divider` (stock) | no |
| 10 | `floatingCart` | `FloatingActionButton` (existing FAB, `screen.ts:936-940`) | no |

**Constraints (schema teeth, never coordinates):** each section object = closed `type` enum +
optional `id`/`title`/`children`; `additionalProperties: false` at the section object AND at the
`sections[]` item level (mirror `screen.schema.json:104-152`); **no** `columns`, no `width`, no
`height`, no `aspectRatio`, no `padding`, no x/y — the `productGrid` no-column-count rule is
already the VLM contract's own contract line (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305`: "columns
derive from responsive policy: 320→1, 390→2, 1400→N"). `children` is allowed on `section` only,
one level, flat leaves (no recursion — keeps the renderer a simple depth-1 table). `floatingCart`
is optional (an existing FAB); its absence is fine.

Every emitted number is a token (`AppSpacing.*`, `AppRadius.*`) or a new **generator-side declared
const** in the AppTokens class (`gridExtent`, `cardWidth` — the `components.ts:204-208` class; the
S1 precedent for adding conditional consts is the radius-scale groups in `generators/infra.ts:209-228`).

### Q2 — Renderer feasibility: deterministic routing WITHOUT touching existing archetypes

**Feasible, by construction.** `generateScreen` already dispatches on `comp.layout` with three
self-contained branches — detail (`screen.ts:351-453`), wizard (`:457-560`), list (`:561-759`) —
then falls through to a shared footer (imports/checks/AppBar/actions/FAB, `:762-1089`). A
`"sections"` archetype adds a FOURTH branch, routed the same way: `compositionFor(s.type)` returns
the new `COMPOSITIONS.sections` entry (`composition.ts:24-31` — the "Extend here" comment at `:30`
is the named insertion point), and the branch is `comp.layout === "sections"`. Section-less IRs hit
the existing branches untouched → byte-identical (the exact additivity guarantee S1 already proved
for absent `visualStyle`, `test/s1_visual_intent.test.ts:277-302`).

**Orthogonality evidence — every existing selector is a no-op for a sections screen, so no existing
pattern can interfere:**
- `searchFor` returns `null` for any non-list screen (`composition.ts:157`);
- `scrollFor` returns `null` for non-list/detail (`composition.ts:212`);
- `actionsFor` returns `[]` for non-list/detail (`composition.ts:295`);
- `statePlacementFor`: a home's state still declares loading/error (it has a Cubit), so the
  `checks` block (`screen.ts:782-787`) renders those two branches normally and `empty=false`
  (list-only, `composition.ts:364`) — correct: no forced empty-state;
- `visualFor` works for ANY screen (`composition.ts:435`) — the sections renderer consumes it
  exactly as the list branch already does (`screen.ts:203-222`);
- `shellFor`/routing/shell: route registration is type-agnostic (`route.ts:53` maps every screen
  through `screenPath`), and `screenPath` gives a non-list/detail/wizard type an EMPTY suffix
  (`routing.ts:10-14`), so a home is just `/<kebab(entity)>`; as `screens[0]` it becomes
  `initialLocation` (`route.ts:116-117`) and the golden target (`test.ts:136-169`). **Zero route.ts
  / shell changes.**

**Layout primitives for the 3 viewports (all stock, all already used or allowed):** vertical
`ListView` (scroll parent — the list branch's `Expanded(child: ListView...)` shape, `screen.ts:744-759`);
`GridView.builder` with `SliverGridDelegateWithMaxCrossAxisExtent(maxCrossAxisExtent: AppTokens.
gridExtent)` for the grid (column count is `f(width)` by construction — no IR column number, and
the `childAspectRatio` bounds card height from width); horizontal `ListView.builder` with
`SizedBox(width: AppTokens.cardWidth)` cards for the rail; `Wrap`/`Column` for chips/headers.
`GridView`/horizontal `ListView` are new to this codebase but are stock Material — the exact
posture the SearchBar block already documents ("the component registry wraps only this app's own
custom design-system atoms, not stock Flutter/Material widgets", `screen.ts:662-665`).

### Q3 — Overflow at 320/390/1400: section-by-section story + is the current check sufficient?

| Section | Overflow mechanism at 320 / 390 / 1400 | Safe by |
|---|---|---|
| `header` | fixed-height AppBar + token-padded brand text | intrinsic height |
| `search` | full-width SearchBar, intrinsic height | intrinsic height |
| `hero` | content-height promo block (headline + CTA); image slot absent until S3; when S5 adds one, it must be `aspectRatio`-constrained + clipped | content-driven height; future aspect constraint |
| `promoBanner` | compact hero | same |
| `productGrid` | `SliverGridDelegateWithMaxCrossAxisExtent` ⇒ 320→1 col, 390→2, 1400→N by construction; card text elided (`Flexible`+ellipsis — the D2#2 precedent `screen.ts:380-386`) | adaptive columns + elision |
| `horizontalCards` | horizontal scroll — width overflow impossible; height bounded by `SizedBox` | scrollable axis |
| `sectionHeader` | `Text` with softWrap/ellipsis | elision |
| `section` (group) | `Column` inside vertical `ListView` | scrollable axis |
| `divider` | intrinsic | intrinsic |
| `floatingCart` | `FloatingActionButton` | fixed-size chrome |

**Is the current check sufficient? Mostly yes — the mechanism already exists.** The
ViewportSqueezeTestGenerator (`test.ts:685-761`) renders **every declared screen** (a sections home
included, with zero generator-test changes) at `320×480 / 390×844 / 1400×900` and asserts
`tester.takeException()` null (`test.ts:730-741`); `takeException` provably surfaces RenderFlex
overflows — the RTL tests depend on exactly that (`test.ts:361-375`). Because every section above
either (a) is intrinsic-height, (b) scrolls on its overflow axis, or (c) adapts columns from width,
the squeeze gate is the correct catch-all. **Named near-term gap (validator addition, not a defect):
a `[sections]` gate** that (a) re-derives `sectionsFor` and diffs `plan.json patterns.sections`
(the `[visualIntent]` `specEqual` posture, `validate.ts:938-961`), (b) scans the emitted section
renderer for token-only extents (mirror of the radius-token guard `validate.ts:994-997` + the
`[literals]` EdgeInsets scan `validate.ts:263-280`), and (c) rejects any section IR carrying a
coordinate/columns/pixel field (schema already hard-rejects; the gate is belt-and-suspenders).
The existing `[literals]`/`[arch]` gates already forbid raw EdgeInsets/colors in any new screen
(`validate.ts:263-280`).

### Q4 — MODIFY branch: the precise missing-component list

Exactly **two new registry organisms** (one-line tokenized specs — the future implementer slice
list; S5 owns the deeper banner-composition machinery and is untouched by this):

1. **`AppHeroBanner`** (organism, serves `hero` + `promoBanner[compact]`): background =
   `LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.85)])`;
   headline `Text(style: textTheme.headlineSmall/Medium)`; optional subtitle; optional
   `PrimaryButton` CTA; `BorderRadius.circular(AppRadius.container)` (or the screen's decided
   radius token); all paddings `AppSpacing.*`. Tokens only — no image (S3), no raw number.
2. **`AppProductCard`** (molecule→organism, grid cell): `title` (maxLines 1–2 + ellipsis),
   `price` via `Money.format()` (the P7-L1 rule, `screen.ts:24`), optional struck-through
   `oldPrice` when the field is set, optional `stockStatus` `AppChip`, optional `add`
   `IconButton`; radius from the decided radius token; card width/height derived by the grid
   delegate, never a literal.

Optional third, only if the implementer prefers a named molecule over inline text:
3. **`AppSectionHeader`** (molecule): `title` + optional `trailing` `IconButton`, token paddings.

All three follow the S1 conditional-emission posture (`generators/infra.ts:202-228`,
`generators/components.ts:183-192`): emitted into `components.dart`/`theme.dart` only when an app
has a sections screen, so section-less apps stay byte-identical.

### Q5 — Interaction with S1/visualStyle

**Yes — the section renderer consumes `ScreenModel.visualStyle` via `visualFor` exactly as S1's
proof screens do, with zero new IR fields.** `visualFor` returns a `VisualSpec` for ANY screen
(`composition.ts:435-442`); screen.ts already applies its four deltas verbatim (`screen.ts:203-222`):
`heroScale` (0/1/2) biases hero prominence/gaps, `radiusScale` picks the AppRadius.* set (which the
new organisms' card/hero radius params read), `baseSpacing` biases section rhythm, `surfaceBias`
picks `card` vs `plain` surfaces. A sections home therefore gets hierarchy (hero first + scaled
gaps), personality (generous/tight spacing, card bias), and cornerRadius for free. composition.ts
stays the ONLY layout authority (the sections renderer consumes a decided `SectionSpec`, never
coordinates from the IR — same "screen.ts never re-derives" rule). `emphasis` (S1 D3, deferred to
S2's `targetId` shape) is **NOT admitted**: in a section-list, the focal section is a first-class
`hero` section whose prominence is its type + position + `heroScale` — `targetId` would be
redundant (see §15 rejected alternative; contract amendment flagged in §16).

## 5. Evidence

All cited in §3. Highlights:
- `sections` is genuinely absent (`types.ts`/schemas grep → 0); `ScreenModel` is additive-clean
  (`types.ts:267-285`).
- The overflow gate is the generated ViewportSqueezeTestGenerator (`test.ts:685-761`), runs for
  every screen at 320×480/390×844/1400×900, and `takeException` provably catches RenderFlex
  overflows (`test.ts:361-375`) — a sections home is covered with zero test-generator changes.
- `COMPOSITIONS` + schema `type` enum close the archetype set to list/detail/wizard
  (`composition.ts:24-31`; `screen.schema.json:20-26`) — the "dashboard" the VLM example references
  is not real (corrected premise 3); S2 must add the archetype in three places.
- Registry has no banner/grid/product organism and the generator has never emitted a grid/rail
  (`generators/components.ts:35-164`; grep zero) — this is the plan's MODIFY trigger.
- The `[visualIntent]` gate is the exact template for a `[sections]` gate (re-derive+diff plan,
  closed-enum, token-only scans: `validate.ts:890-1002`); the `[literals]` scan already guards raw
  EdgeInsets in any new presentation screen (`validate.ts:263-280`).
- Routing/goldens/a11y/tests are all type-agnostic (`route.ts:53,116-117`; `routing.ts:10-14`;
  `test.ts:136-169`; `a11y_test.ts:25-70`) — a sections home needs no changes in any of them.

## 6. Semantic contract

- **New IR (additive, closed):** `ScreenModel.sections?: SectionModel[]` and a new archetype
  `type` value (e.g. `"sections"` — a "home"). `SectionModel = { id: string, type: <closed enum>,
  title?: string, children?: SectionModel[] }`. **`children` only on `section`**, depth-1, leaves
  only. Closed v1 enum (Q1 table): `header | search | hero | promoBanner | productGrid |
  horizontalCards | sectionHeader | section | divider | floatingCart`. Any other type / any extra
  key = schema error (hard reject; `additionalProperties: false` per section object — the
  `visualStyle` precedent `screen.schema.json:104-152`).
- **Never coordinates:** no `columns`, width, height, aspectRatio, padding, x/y anywhere on a
  section. Column counts derive from the responsive policy via
  `SliverGridDelegateWithMaxCrossAxisExtent` (a declared token extent); `productGrid` without
  `columns` is already the contract's own rule (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305`).
- **No new visual field:** `visualStyle` stays exactly the S1 v1 set (`hierarchy/cornerRadius/
  personality`, `types.ts:290-305`). `emphasis` stays out (see Q5/§15).
- **Sections render only on the sections archetype:** a `list`/`detail`/`wizard` screen declaring
  `sections`, or a sections screen with no sections, is a `[sections]` gate error — never a silent
  fallback.
- **Renderer authority:** `sectionsFor(screen, ir)` in composition.ts is the ONE place that
  decides the per-screen section spec (component selection + token mapping); screen.ts applies it
  verbatim. The renderer emits registry components + stock Material + tokens only.

## 7. Determinism analysis

- **Inputs:** IR (`screen.type` archetype + `screen.sections[]` + `screen.visualStyle` envelopes) →
  schema-validate (Ajv, hard gate `index.ts:929-934`) → `sectionsFor(screen, ir)` selector (pure,
  closed-enum→fixed mapping table, same style as `RADIUS_SCALE`/`PERSONALITY_ROW`,
  `composition.ts:403-428`) → `SectionSpec` per screen → `ctx.sections` (`gen_context.ts`,
  additive) → `patterns.sections` in plan.json (`index.ts:812-835`, additive slot) → section
  renderer (pure string gen). No randomness, time, env, network, filesystem enumeration, LLM
  composition.
- **Order is IR order** (sections render in the declared sequence — the worked example's "order IS
  the hierarchy", `VLM_DESIGN_TO_IR_CONTRACT_V2.md:296`).
- **Every emitted number is a token or a declared generator-side const** (`gridExtent`/`cardWidth`
  added to AppTokens, `components.ts:204-208`; conditional per the S1 radius-group posture,
  `infra.ts:202-228`) — no numeric literal ever originates in the IR.
- **Byte-identical guarantee:** absent `sections` ⇒ the four selectors that touch this screen
  return their existing values and `generateScreen` takes the existing `comp.layout` branch — the
  exact additivity S1 already proved for absent `visualStyle` (`test/s1_visual_intent.test.ts:
  277-302`). `[determinism]`/`[plan-determinism]` gates (`validate.ts:1091-1117`) ride along
  unchanged; `patterns.sections` joins the existing plan diff.

## 8. Ownership analysis

| Module | S2 change (all additive) |
|---|---|
| `types.ts` | `SectionType`/`SectionModel` + `ScreenModel.sections?: SectionModel[]` + `type` archetype union comment |
| `builder/schemas/screen.schema.json` | `type` enum + `sections` property (closed section-object schema, `additionalProperties:false`) |
| `composition.ts` | `COMPOSITIONS.sections` entry (`:30` "Extend here" is the named insertion point) + `sectionsFor`/`sectionsTargets` selector (same family as `visualFor`, `:435-453`) |
| `generators/screen.ts` | a fourth `comp.layout === "sections"` branch at the top of `generateScreen` (before `:351`); consumes `ctx.sections` + `ctx.visual` verbatim; NEVER re-derives (contract §1) |
| `generators/components.ts` | `AppHeroBanner`, `AppProductCard` (+ optional `AppSectionHeader`); `AppTokens.gridExtent`/`cardWidth` consts; S1-conditional emission |
| `generators/infra.ts` | (none required — radius groups already exist; grid-extent consts live in AppTokens) |
| `gen_context.ts` | `sections?: Map<string, SectionSpec>` |
| `plan.ts` | `patterns.sections?: Record<string, SectionSpec>` (additive slot beside `visual`, `:62`) |
| `index.ts` | `sectionsTargets` once per run + `sectionsByPath` re-key + `writePlan` spread (mirror `:798-809,916-920,984`) |
| `validate.ts` | `[sections]` gate (re-derive+diff plan; closed-enum; no-coordinate-schema; marker/token scans — mirror `[visualIntent]` `:890-1002`) |
| `routing.ts` / `route.ts` / `generators/test.ts` / `generators/a11y_test.ts` | **NO change** — type-agnostic already (`routing.ts:10-14`; `route.ts:53,116-117`; `test.ts:700-741`; `a11y_test.ts:25-70`) |

Shared-generator rule respected: `generateScreen` is extended with a new branch, never forked;
composition.ts gains one selector in the existing family, never a second decision site.

## 9. Failure modes (each deterministic)

| Condition | Deterministic outcome |
|---|---|
| Unknown section `type` | Schema enum → **generation abort** (`[validator] INVALID`, `index.ts:932-934`) — no compositionFor-style warn-and-fallback here (that posture is for typo'd archetypes, not closed section vocabulary) |
| Section carrying `columns`/width/height/x/y/padding | `additionalProperties: false` → **schema abort** (proven mechanism: S1's imagery negative control, `test/s1_visual_intent.test.ts:249-262`) |
| `children` on a non-`section` type, or depth-2 nesting | Schema → **abort** |
| `sections` on a list/detail/wizard screen (or sections screen with no sections) | `[sections]` gate **error** (decided, not silent) |
| A section type with no registry component (regression after v1) | Renderer's exhaustive mapping table **aborts generation** (no silent `SizedBox.shrink`) |
| Renderer emits a raw extent/number | `[sections]` marker scan + `[literals]` (`validate.ts:263-280`) **FAIL** |
| plan.json `patterns.sections` stale/missing/wrong | `[sections]` re-derive+diff **FAIL** (`[visualIntent]` posture, `validate.ts:938-961`) |
| Grid card overflows at 320 (elision missing) | **viewport-squeeze test FAILs** at `320x480` (`test.ts:730-741`) — deterministic, fix in the template |
| Unattested provenance on a section (if sections are enveloped later) | Existing `approve.ts` gate blocks (proven `test/s1_visual_intent.test.ts:212-247`) |

## 10. Architecture impact

Classification **A — pure presentation**, identical to S1's classification:
- Section renderer = composition-driven layout emission (components + stock Material + tokens).
  No interaction/state, no data-flow, no navigation architecture, no runtime authorization.
- The grid/rail layout primitives are presentation-only; "which archetype" is an IR-declared
  semantic, never inferred (the C8 grid-layout note stays satisfied — the archetype is explicit
  IR, not a hidden selector default).
- Explicitly NOT a change to `scoreApp`/`ScoringInputs`, state-management/DI/routing/persistence
  selection, or the trust boundary. Not called cosmetic — it is the visual-richness layer §12 of
  the review accepted, mapped onto the existing selector + plan + gate contract.

## 11. Cost/complexity

- Generator: **S–M** — one new pure selector + one new `generateScreen` branch + two new
  organisms (conditional emission). Grid/rail are stock widgets (SearchBar precedent,
  `screen.ts:662-665`).
- IR/schema: **S** — `sections[]` property + one `type` enum value + closed section-object schema.
- Validation: **S** — one gate reusing the `[visualIntent]` re-derive-and-scan posture.
- Testing: **M** — a new commerce-home sample IR (or an extension of an existing app) + goldens at
  390×844 + the squeeze suite (320/390/1400, zero new test code) + a `[sections]` negative-control
  (a section with `columns` → abort) + determinism re-run.
- Golden churn: **YES, by design** — exactly the new sections screen(s); every existing screen is
  byte-identical.
- CDP/a11y: new organisms need a 320/390/1400 overflow + a11y pass (a11y tests auto-generate);
  low risk given intrinsic-height/adaptive-column design.
- Determinism risk: **Low** — pure selector + closed mapping table; the only new plan surface is
  additive.
- **Benefit worth the cost: yes** — it is the headline visual-richness ask (§6 S2, P1) and the
  hypothesis survives with a narrow MODIFY (2 organisms), not a redesign.

## 12. Findings

1. **The overflow validator is a generated test, not a validate.ts gate** — ViewportSqueezeTestGenerator
   renders every screen at 320×480/390×844/1400×900 and asserts no layout exception
   (`test.ts:685-761`); it covers any sections home with zero changes. validate.ts has no
   overflow/viewport/fit code (grep 0).
2. **The archetype must be added, not reused** — `dashboard` is not in `COMPOSITIONS`
   (`composition.ts:24-31`) nor the schema `type` enum (`screen.schema.json:20-26`); the VLM worked
   example's "existing archetype" claim (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:286,323-326`) does not
   hold for today's code. S2 adds `"sections"` in composition.ts + schema + screen.ts.
3. **Exactly two registry organisms are missing** (`hero`/`promoBanner` → AppHeroBanner,
   `productGrid` → AppProductCard); everything else maps to existing registry components + stock
   Material + tokens. No section requires absolute x/y → REJECT never triggers.
4. **Grid is overflow-safe by construction** — `SliverGridDelegateWithMaxCrossAxisExtent` makes
   columns a function of width (320→1, 390→2, 1400→N), which is precisely the VLM contract's
   "no column counts" rule (`:304-305`); text elision inside cards reuses the proven D2#2 Flexible
   precedent (`screen.ts:380-386`).
5. **Routing, goldens, a11y, and all pattern selectors are sections-agnostic** — a home is just a
   screen with an empty-suffix path (`routing.ts:10-14`), and search/scroll/actions all return
   null/no-op for it (`composition.ts:157,212,295`); only `statePlacementFor`'s loading/error
   apply (correct) and `visualFor` works unchanged.
6. **`emphasis` becomes redundant under a section-list** — a first-class `hero` section + position
   + `heroScale` already express prominence; admitting `targetId` adds an IR field that must
   resolve to exactly the thing that is already there (see §15/§16).

## 13. Decisions (5, CLOSED)

**D1 — Vocabulary v1: MODIFY.** Adopt the closed v1 set `header | search | hero | promoBanner |
productGrid | horizontalCards | sectionHeader | section | divider | floatingCart` (each
`{id, type, title?, children?}`, depth-1 nesting on `section` only, order-is-hierarchy), but two
types (`hero`/`promoBanner` → `AppHeroBanner`; `productGrid` → `AppProductCard`) need a new
registry organism — the plan's own MODIFY trigger. **Evidence** §3/Q1: registry contents
(`generators/components.ts:35-164`) + zero grid/rail/image primitives (grep) + schema
`additionalProperties` teeth (`screen.schema.json:191`) + the no-column-count contract line
(`VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305`). **Failure mode if ignored:** admitting a section
without a rendering home silently degrades to nothing (warn-and-fallback) — the exact
free-form-teeth erosion S1 rejected; the exhaustive mapping table aborts instead.

**D2 — Renderer routing: ADOPT.** A `sections[]`-declared screen routes through a fourth
`comp.layout === "sections"` branch in `generateScreen`; section-less IRs are byte-identical.
**Evidence** §3/Q2: the three existing branches (`screen.ts:351-759`), the `:30` "Extend here"
insertion point, all five selectors' null-sets (`composition.ts:157,212,295,357,435`), type-agnostic
routing (`routing.ts:10-14`; `route.ts:53,116-117`), and S1's proven additivity test
(`test/s1_visual_intent.test.ts:277-302`). **Failure mode if ignored:** routing through the list
branch would render a fake home-list and silently merge section semantics into the CRUD archetype —
violating §12's "screen.ts+composition.ts sole layout authority".

**D3 — Missing components: MODIFY (the precise list).** Exactly two new organisms, one-line
tokenized: `AppHeroBanner` (gradient `AppColors.primary`, headline/CTA/subtitle, `AppRadius.*`,
`AppSpacing.*`; compact variant for `promoBanner`) and `AppProductCard` (title ellipsis,
`Money.format()` price, optional struck oldPrice + `AppChip` stock + add `IconButton`, decided
radius token); optional `AppSectionHeader`. S1-conditional emission keeps section-less apps
byte-identical. **Evidence** §3/Q4 + registry audit (`generators/components.ts:35-164`; the
AppListCard radius-param conditional `:183-192` as the emission template). **Failure mode if
ignored:** a home "grid" rendered by stretching `AppListCard` into `GridView` children — a new
ad-hoc widget shape bypassing the registry, exactly what §8.1 forbids.

**D4 — Overflow readiness: ADOPT, with one named near-term validator addition.** The existing
viewport-squeeze gate (`test.ts:700-741`) already renders every declared screen at 320×480/390×844/
1400×900 and asserts no layout exception; combined with intrinsic-height + adaptive-column +
scrollable-axis section design, the 3-viewport criterion is covered. Named gap: a `[sections]` gate
(re-derive `patterns.sections`, closed-enum, reject coordinate-carrying sections, scan emitted
token-only extents) mirroring `[visualIntent]` (`validate.ts:890-1002`) — plus the existing
`[literals]` scan (`validate.ts:263-280`) as the raw-literal backstop. **Evidence** §3/Q3.
**Failure mode if ignored:** a future grid-card template dropping the elision rule re-overflows at
320 with only a generated-test failure (caught but late); the gate makes the constraint structural.

**D5 — S1 interplay: ADOPT.** The section renderer consumes `visualFor`'s `VisualSpec` verbatim
(`heroScale` → hero prominence/gaps, `radiusScale` → organism radius tokens, `baseSpacing` →
section rhythm, `surfaceBias` → card/plain) exactly as S1's list/detail branches already do
(`screen.ts:203-222`); composition.ts remains the sole layout authority; **no new IR field beyond
`sections[]`** — `emphasis` stays deferred (the hero is first-class; see §15/§16).
**Failure mode if ignored:** re-deriving hierarchy inside screen.ts from raw `visualStyle` would
create a second decision site and break the `[visualIntent]` closed-enum/plan-diff invariant.

**Net hypothesis verdict: MODIFY** (D1+D3 trigger it; D2/D4/D5 hold as proposed; no section needs
absolute x/y → REJECT never fires).

## 14. Recommended implementation (slice spec for the Mac implementer)

> One to two slices, S–M, per the MODIFY conclusion. All changes additive; nothing in
> `scoreApp`/`ScoringInputs`/existing patterns touched; implement via Claude-first, review here.

**14.1 Vocabulary (`types.ts` + `builder/schemas/screen.schema.json`)**
```ts
export type SectionType = "header" | "search" | "hero" | "promoBanner" | "productGrid"
  | "horizontalCards" | "sectionHeader" | "section" | "divider" | "floatingCart";
export interface SectionModel { id: string; type: SectionType; title?: string; children?: SectionModel[]; }
// in ScreenModel: sections?: SectionModel[];   // archetype must be "sections" (schema/gate-enforced)
```
Schema: `type` enum gains `"sections"`; `sections[]` item = `{id, type enum, title?, children?}`,
`additionalProperties: false` (the `visualStyle` precedent `screen.schema.json:104-152,191`).

**14.2 Selector (`composition.ts`)**
```ts
export interface SectionSpec { sections: SectionModel[]; }  // decided mapping: type → component/template
export function sectionsFor(s: ScreenModel, ir: FeatureModel): SectionSpec | null; // null when no sections
export function sectionsTargets(ir: FeatureModel): Map<string, SectionSpec>;
```
`COMPOSITIONS.sections = { archetype:"sections", layout:"sections", hasHero:false, heroGap:16, itemGap:16, surface:"card" }` at the `:30` insertion point.

**14.3 Renderer (`screen.ts`)** — `if (comp.layout === "sections")` branch before `:351`: emit the
section list verbatim via a pure per-type mapping (AppBar/Text for `header`, `SearchBar` for
`search`, `AppHeroBanner` for `hero`/`promoBanner`, `GridView.builder`+`AppProductCard` for
`productGrid`, horizontal `ListView`+`AppListCard` for `horizontalCards`, Text/Padding for
`sectionHeader`, Column+spacing for `section`, `Divider`, existing FAB for `floatingCart`), all
under a vertical `ListView` scroll parent (`screen.ts:744-759` shape), applying `ctx.visual` deltas
(`screen.ts:203-222`) and token extents. Template header marker gains `_sections`.

**14.4 New components (`generators/components.ts`)** — `AppHeroBanner` (gradient `AppColors.primary`
± `.withValues(alpha: 0.85)`, headline/CTA/subtitle, `AppRadius.container` or decided radius,
`AppSpacing.*` paddings), `AppProductCard` (title ellipsis, `Money.format()`, optional struck
oldPrice, optional `AppChip` stock, add `IconButton`, decided radius), optional `AppSectionHeader`;
`AppTokens.gridExtent`/`cardWidth` consts; S1-conditional emission (only when `sectionsTargets(f).size > 0`).

**14.5 Wiring (`index.ts`/`plan.ts`/`gen_context.ts`)** — `sectionsTargets` once per run → `ctx.sections`
→ `sectionsByPath` re-key → `patterns.sections` additive spread (mirror `index.ts:798-809,916-920,984`;
`plan.ts:62`).

**14.6 `[sections]` gate (`validate.ts`)** — mirror `[visualIntent]` (`:890-1002`): (a) re-derive
`patterns.sections`; (b) closed-enum + `sections`-only-on-sections-archetype; (c) reject any
section carrying coordinates/columns/pixels; (d) marker scan: every section type renders its mapped
component; every extent is an `AppTokens.*`/`AppRadius.*`/`AppSpacing.*` token reference.

**14.7 Proof (one new sample, no existing app disturbed)** — a Keemart-style home IR (Product
entity, HomeScreen with the worked-example section tree minus images, `visualStyle friendly/rounded/
strong`, `sections[]` as in `VLM_DESIGN_TO_IR_CONTRACT_V2.md:296-307`); generate → validate →
`flutter test --update-goldens` → squeeze at 320/390/1400 green → a11y auto-tests → CDP overflow
scan at 320/390/1400 → determinism re-run byte-identical. Negative controls: a section with
`columns` aborts; a list screen with `sections` fails `[sections]`; a section-less app regenerates
byte-identical.

## 15. Rejected alternatives

- **`emphasis.targetId` admitted in the same slice (S1 D3's original expectation):** rejected —
  in a section-list the focal element IS the `hero` section; `targetId` would resolve to exactly
  the section that already declares itself, adding an IR field + cross-reference validation with
  zero expressive gain. Hierarchy = `hero` position + `heroScale`. Contract amendment (§16).
- **A dedicated `"home"`/`"market"` archetype vs `"sections"`:** rejected the market name — the
  S2-gate note (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:323-326`) requires the archetype to be catalog
  truth only AFTER the spike proves it; a neutral `"sections"` archetype is honest vocabulary for
  "this screen is a section-list", with `market` as a future personality/convention, never a
  special case.
- **Column counts in IR (`productGrid.columns`):** rejected — already forbidden by the contract
  (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305`); the responsive-policy grid (maxCrossAxisExtent)
  is deterministic and viewport-true.
- **Reusing `AppListCard` inside a grid for the product cell:** rejected — a list row stretched
  into a grid cell is a new ad-hoc shape bypassing the registry (§8.1), and lacks price/old-price/
  add affordances; `AppProductCard` is the honest organism.
- **A warn-and-fallback for unknown section types (compositionFor posture):** rejected — the
  archetype fallback exists to survive typo'd IRs; a closed section vocabulary must hard-abort
  instead, or the schema teeth silently rot.
- **Overflow only validated at 390 (goldens) + one extra width:** rejected — the existing
  squeeze generator already does all three widths unconditionally; no reason to weaken it.

## 16. Open questions (owner / contract-owner calls)

- **Contract amendment sign-off (S1 D3 → S2):** `emphasis` was deferred to S2 "lands `sections[]`
  AND `emphasis.targetId` together." This spike's evidence (§13 D5, §15) says `targetId` is
  redundant under a section-list and should NOT be admitted. Requires the contract owner to ratify
  "v2 §2.3 `emphasis` dropped; hierarchy expressed by `hero` section + position + `heroScale`."
- **Archetype name:** `"sections"` vs `"home"` vs `"dashboard"` — this spike proposes `"sections"`
  (neutral, catalog-honest); owner picks the label before the implementer slice.
- **Grid card width token value:** `AppTokens.gridExtent` (e.g. 200.0) — a generator-side const,
  not IR; the exact number is an implementer choice constrained by "1 col at 320, 2 at 390".
- **Provenance on sections:** v1 `sections[]` rides the top-level screen element (already stamped/
  attested — `unapprovedElements` covers top-level array elements, `provenance.ts:83-102`). If the
  owner later wants per-section LLM provenance, that's a small recursion extension (S1 D4 posture),
  not a v1 blocker.

## 17. Follow-up

- Report 5 CLOSED decisions + one-line vocabulary to the orchestrator (Zen) on Telegram: **D1
  MODIFY, D2 ADOPT, D3 MODIFY, D4 ADOPT (with a named `[sections]` gate), D5 ADOPT** → net
  hypothesis MODIFY.
- Capture a brief for the (Claude-first) implementer per §14.1–14.7 (types/schema + selector +
  screen.ts branch + 2 organisms + wiring + `[sections]` gate + commerce-home proof sample + goldens
  + CDP 320/390/1400). S5 (banner-composition) stays a separate later spike; this slice's
  AppHeroBanner is the minimal tokenized stand-in, not S5.
- Contract amendment note (decision-log entry): "v2 §2.3 `emphasis` → DROPPED under S2; hierarchy
  = hero section + order + heroScale" (pending §16 owner sign-off).
- This report lives under `design/flutter-app-builder/research/` (research archive).
