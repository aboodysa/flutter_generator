# S3 — Deterministic asset-resolution ladder (no AI) — Spike report

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — read-only; NO commits, NO
> edits, no `npm`/ts-node/Flutter (1vcpu/1gb box). Repo: `/root/fg-p5`, HEAD `d4e5498`, `git status`
> clean before/after (single untracked deliverable: this file). Sources cited with file:line are
> the real generator source at HEAD.

## 0. Summary (6 lines)

1. **`AssetRequest` is contract prose only** — no type, no IR field, no schema key, no plan slot;
   the only imagery hook `visualStyle.imagery` is closed-out by `[visualIntent]` (types.ts:322-324,
   validate.ts:920-927, plan.ts:60-68). S3 must key off existing section semantics, not a new field.
2. **Rung 3 (procedural) is ADOPT-now** — the rendering home already shipped in S2: AppHeroBanner =
   the exact `LinearGradient([AppColors.primary, …withValues(alpha:.85)])` spec (components.ts:256-300)
   and AppProductCard/AppAvatar/AppStatusDot compose shape/icon/chip with zero raster (components.ts:97-148,303-340).
3. **All 3 contract sample roles resolve on rung 3 today** — hero banner (:299/:311-313), product-card
   image slot (:251-252/:303), store logo/avatar (:249) → deterministic, tokens-only, arch-clean. REJECT never fires.
4. **Rung 1 (existing asset) works for icon-role only** — fixed `Icons.*` stem maps (composition.ts:84-99,278-286);
   the only files the generator emits are fonts (index.ts:103-112) + static web icons (index.ts:256-260) — no imagery raster exists.
5. **Rung 2 (declared library) + manifest is S4's scope** — no library concept, no `flutter.assets`
   in pubspec (project.ts:66-78); zero-cost finding: v1 needs NO manifest (procedural assets emit no file).
6. **Net verdict: SPLIT** — procedural rung ADOPT-now (pure `resolveAsset` selector + `patterns.assets`
   slot + verbatim consumption); library rung DEFER-to-S4; S7 `generated` branch stays an external,
   never-returned stub behind the existing approve/provenance gate (index.ts:904-912, test/s1_visual_intent.test.ts:207-271).

## 1. Status

Research-only. No scratch generation ran (the brief forbids builds on this box), so every claim is
grounded in generator source (`builder/src/**`), the committed schemas (`builder/schemas/*.json`),
the committed design docs (`VISUAL_GENERATION_REVIEW.md`, `VLM_DESIGN_TO_IR_CONTRACT_V2.md`,
`SPIKE_S2_REPORT.md`, `HANDOFF.md`), and the S1 regression suite
(`test/s1_visual_intent.test.ts`). Repository tree was not modified (`git status` clean before and
after writing this file). Per SPIKE_PROTOCOL §3/§4, generated output was inspected through the
generator sources that produce it (no `flutter run`/CDP on this box).

## 2. Hypothesis — and verdict

> For N sample visual roles, the asset-resolution ladder **existing project asset → declared
> library → procedural gradient/shape** resolves every role without invoking any external generator
> (or AI), and each resolution is a **pure function of the IR + manifest**. (`VISUAL_GENERATION_REVIEW.md:121-124`)

**Net verdict: SPLIT.** The procedural stage (rung 3) — and the icon-role slice of rung 1 —
satisfy the hypothesis as-is: every sample role resolves deterministically, pure-function, zero AI,
arch-linter clean. But the *declared-library* stage (rung 2) is unrepresentable in today's
vocabulary: there is no `AssetRequest`/asset IR field, no manifest, and no `flutter.assets`
registration — the brief's own MODIFY trigger ("MODIFY if the library schema is insufficient").
That schema+manifest work is exactly S4's scope (`VISUAL_GENERATION_REVIEW.md:126-129`, `:34`), so
the ladder splits into two independently implementable pieces: procedural-now (S3) and
library+manifest (S4). No role requires AI generation → REJECT never fires.

## 3. Ground truth

| What | Where (file:line) | State |
|---|---|---|
| S3 hypothesis + decision criteria | `VISUAL_GENERATION_REVIEW.md:121-124` | real, binding |
| §5 §7 §8 accepts (ladder as new generator; images = build artifact; typed background) | `VISUAL_GENERATION_REVIEW.md:28,30,31,92,94,96` | real |
| §11 asset manifest accept → spike S4; §10 AI gen DEFER → spike S7 | `VISUAL_GENERATION_REVIEW.md:33,34,136-139` | real |
| S4 slotting after S3; S3 interleaved-after P4 | `VISUAL_GENERATION_REVIEW.md:152,153` | real |
| AssetRequest shape + "never emit file/URL" rule | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:44,216-243` | contract prose only |
| Ladder chain | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:238` | contract prose only |
| Worked example A input (store logo :249, hero+product grid :251-252) | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:246-321` | real contract statement |
| `sections[]` tree (heroBanner :299, productGrid :303, no-columns :304-305) | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:296-307` | real (S2 shipped) |
| `assets[]` banner AssetRequest (back_to_school, provenance) | `VLM_DESIGN_TO_IR_CONTRACT_V2.md:310-313,229-232` | contract prose only — **no IR field** |
| `visualStyle.imagery` deferred to S3; closed-out by `[visualIntent]` | `types.ts:322-324`; `validate.ts:920-927`; `composition.ts:394` | real — the S3 gate to flip |
| `ScreenModel` — visualStyle + sections only; **no asset/imagery field** | `types.ts:267-341` | genuine absence |
| Schemas — `screen.schema.json` has no asset/imagery key; sections closed at | `screen.schema.json:20-26,104-152,191` (visualStyle), `139` (imagery comment) | genuine absence |
| `AssetRequest`/`assets`/`Image.asset` in builder/src | grep (45 hits) — all comments/fonts/static-web-icons; **no type, no IR field** | genuine absence |
| Sample IRs (samples + apps/keemart) — no assets/imagery key | grep `*.ir.json` (`expense.ir.json:50` is an unrelated entity bool `isImage`) | genuine absence |
| Component registry — 13 defs incl. AppAvatar/AppStatusDot with `role:"image"` contracts | `components.ts:35-164` (AppAvatar :97-107, AppStatusDot :136-148) | real — procedural `image` role exists |
| AppHeroBanner = the exact S2 gradient spec | `components.ts:150-162` (def), `:256-300` (emission, `LinearGradient` at :270) | real (S2 shipped) |
| AppProductCard — no image param, tokens-only | `components.ts:164-177` (def), `:303-340` (emission) | real (S2 shipped) |
| AppTokens gridExtent/cardWidth/cardHeight (generator-side consts, no raster) | `components.ts:241-251` | real |
| sections renderer — hero/promoBanner/productGrid/horizontalCards branches | `screen.ts:386-532` (hero :443-445, grid :446-481, rail :482-501) | real — the verbatim-consumption precedent |
| Only emitted file assets: fonts (Roboto+MaterialIcons) + static web icons | `index.ts:103-112` (`bundleFonts`), `index.ts:256-260` (web-template PNGs); `web.ts:10-11` | real |
| pubspec — **only `fonts:`, no `flutter.assets` section** | `generators/project.ts:66-78` | genuine absence |
| Icon-role mechanism — fixed `Icons.*` stem maps | `composition.ts:84-99` (shell), `:278-286` (actions); `KNOWN_*` sets :93,286 | real — rung-1 icon path exists |
| Selector family + single-owner posture (searchFor/scrollFor/actionsFor/statePlacementFor/visualFor/sectionsFor) | `composition.ts:160,215,297,361,463,500` | real — `assetFor` slots beside them |
| `patterns.*` additive plan slot | `plan.ts:60-68` (shell/search/scroll/actions/states/visual/sections — no `assets`) | real — additive slot for `patterns.assets` |
| Plan serialization + re-key-by-path precedent | `index.ts:798-849` (`visualByPath` :801-809, `sectionsByPath` :814-822, `writePlan` :825-849) | real |
| Selector wiring once-per-run → GenContext | `index.ts:919-938`; `gen_context.ts:18-43` (visual :36-39, sections :40-43) | real |
| `[determinism]`/`[plan-determinism]` gates (regen+diff, byte-identical) | `validate.ts:1696-1742` | real |
| `[lockfile]` gate (pins pubspec.lock, transitive deps — NOT app assets) | `validate.ts:1527-1552`; `context.ts:16-29,43-60` (buildLockfile) | real |
| `regions.json` content-hash manifest (user regions, not assets) | `index.ts:959-962,971,848` | real — the cache/hash pattern |
| Approval gate — pre-write throw on unapproved | `index.ts:904-912`; `approve.ts:12-17`; `HUMAN_ACTOR` `provenance.ts:24` | real |
| Provenance envelope + nested visualStyle recursion | `provenance.ts:15-22,30-52,63-102` | real — AssetRequest would ride the same |
| S1 trust-boundary regression template | `test/s1_visual_intent.test.ts:207-271` (unattested→blocked→approve→unblocked; imagery rejected :257-270) | real |
| AI image code path in builder/src | grep `openai/anthropic/dalle/fetch/generateImage/S7` → 0; only semantic-lane LLM agents `requirements.ts:13`, `business_rule_agent.ts:136` (emit IR, not rasters) | genuine absence |
| S6 slice-3 `[asset-ref]`/`[aspect-ratio]` gates deferred — gated on S3 | `HANDOFF.md:64,86` | real (not in tree; grep 0) |
| S3 spike in flight | `HANDOFF.md:88,115-117` | real |

## 4. Questions (SPIKE_PROTOCOL §6 — answered with evidence)

### Q1 — Vocabulary: is there an `AssetRequest`/asset vocabulary today?

**No.** `AssetRequest` exists only as contract prose (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:44,216-243`):
it is neither a type in `types.ts` (ScreenModel at :267-292 carries only `visualStyle`/`sections`;
VisualStyleModel :336-340 is the closed 3-enum v1 set), nor a key in any schema
(`builder/schemas/*.json` — grep `assets|imagery|image` returns only the S1 "imagery (S3) deferred"
comment at `screen.schema.json:139`), nor a plan surface (`plan.ts:60-68` — patterns carries
shell/search/scroll/actions/states/visual/sections, no `assets`).

**The IR has no imagery/asset field S3 can key off.** The only hooks are:
- `visualStyle.imagery` — the contract's imagery enum (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:201`:
  `none | commercial | illustrative | photographic`) is **explicitly deferred to S3** (`types.ts:322-324`)
  and **hard-rejected if present** by the `[visualIntent]` gate (`validate.ts:920-927`) plus the S1
  regression negative control (`test/s1_visual_intent.test.ts:257-270` — a raw `imagery:{value:'photo'}`
  is refused with `additional propert...` at schema time). This is the field S3 flips on.
- `screen.sections[]` — the S2-declared `hero`/`promoBanner`/`productGrid` sections
  (`types.ts:299-309`; keemart proof app `apps/keemart/input/keemart.ir.json:62-77` — `primaryHero`
  hero section has **no image slot**, confirming `SPIKE_S2_REPORT.md` §13 D3: `components.ts:153`
  "no image (S3 owns the asset ladder)").

So today the honest input vocabulary for a `resolveAsset(ir, role)` is **decided IR semantics**
(`hero`/`promoBanner` section, `productGrid`/`horizontalCards`, the registry's `role:"image"`
component contracts) — **not** a new `AssetRequest` field. That asymmetry is the core finding: S3
can deliver the procedural rung with zero IR change.

### Q2 — Ladder stages feasibility

**(a) Existing project asset.** The generator emits exactly two kinds of file assets:
fonts (Roboto-Regular/Medium/Bold + MaterialIcons-Regular, bundled at `index.ts:103-112`, declared
in pubspec `fonts:` at `project.ts:66-78`) and the static web favicon/app-icon PNGs
(`index.ts:256-260`, from `builder/assets/web-template/`, `web.ts:10-11`). None is a semantic
imagery asset. The one "map a semantic to an existing asset with zero machinery" path that already
works is **Material icon glyphs**: fixed `semantic-role → Icons.*` stem maps for shell
(`composition.ts:84-99`, `SHELL_FALLBACK_ICON` :92) and actions (`:278-286`) — deterministic,
additive, glyph-absence impossible by construction. A semanticRole that is *icon-like* (e.g. a
`storeLogo` rendered as a glyph) maps to rung 1 today; a role that is *photographic/illustrative*
correctly **misses** rung 1 (no raster exists) and falls to rung 3 — which is exactly the ladder's
design.

**(b) Declared library.** No "library"/per-app-asset-manifest concept exists anywhere: no IR
`assets[]`, no asset directory convention beyond `assets/fonts/`, and crucially **pubspec has no
`flutter.assets` section** (`project.ts:66-78` emits only `fonts:`) — the registration point a
declared asset needs for `flutter build` to find it. The closest manifest patterns to ride:
`builder.lock.json` (`context.ts:43-60`, written `index.ts:991`) and `regions.json`
(`index.ts:959-962,848`) — both per-run artifacts, neither an asset registry. The minimal additive
shape for a library rung: the contract §3 `assets[]` fragment (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:221-233`)
as a schema-validated IR field + a per-app `assets/images/` dir + pubspec `flutter.assets` entries +
a content-hash manifest — which is precisely S4's mandate (`VISUAL_GENERATION_REVIEW.md:34,126-129`).
This spike does NOT build it (read-only); it scopes it.

**(c) Procedural gradient/shape.** Yes — this is already the stage's rendering home, shipped by S2.
`AppHeroBanner` (`components.ts:150-162` def; `:256-300` emission) is literally the S2-spec'd
`LinearGradient(colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.85)])` at
`:270`, with `AppRadius.container`, `AppSpacing.*`, and an optional `PrimaryButton` CTA. `AppProductCard`
(`:164-177` def; `:303-340` emission) composes title/price/oldPrice/stock chip/add-`IconButton` from
tokens. The registry also owns two **procedural `role:"image"`** atoms for identity glyphs:
`AppAvatar` (first-letter initial, `:97-107`) and `AppStatusDot` (tone dot, `:136-148`) — the 
"store logo/avatar" role's home. Composable procedural shapes with no raster: gradient
(AppHeroBanner), border/radius (all cards), icon (`Icons.*`), chip (AppChip), placeholder box
(AppHeroBanner without image / AppAvatar initial). The sections renderer already consumes all of it
verbatim (`screen.ts:443-445` hero, `:446-481` grid, `:482-501` rail).

### Q3 — Resolution as a pure function

`resolveAsset(ir, role) → AssetSpec` slots into the selector family as the next member, in the
exact posture of `sectionsFor` (`composition.ts:500-515`) — the S2 report already named this the
template (`SPIKE_S2_REPORT.md` §14.2). Concretely, every existing precedent lines up:
- **Selector**: `assetFor(screen, ir): AssetSpec | null` in `composition.ts`, closed
  `role→{kind, tokenRef?, icon?}` mapping tables (`RADIUS_SCALE`/`PERSONALITY_ROW` style,
  `composition.ts:421-456`); the single decision site (contract §1 master principle).
- **Decided payload consumed verbatim**: `screen.ts`'s sections branch consumes `ctx.sections` +
  `ctx.visual` and never re-derives (`screen.ts:386-390`; S1's `:203-222` precedent) — an
  `AssetSpec` handed to the renderer the same way. Never re-derive: S1's `[visualIntent]` FIX-6
  scan (`validate.ts:929-950`) would flag a screen branching on raw semantics.
- **Once-per-run wiring**: `index.ts:919-938` computes each `*Targets` once and threads through
  `GenContext` (`gen_context.ts:18-43`); `assetFor`/`assetTargets` mirror it.
- **plan.json surface**: `patterns.assets?: Record<string, AssetSpec>` is an additive slot beside
  `visual`/`sections` (`plan.ts:60-68`), re-keyed by screenPath via the `*ByPath` helper family
  (`index.ts:798-822`) and spread in `writePlan` (`:825-843`).
- **Gate**: a `[assets]` gate mirrors `[visualIntent]`/`[sections]` (re-derive+diff plan,
  closed-enum, marker scan — `validate.ts:909-1004`, `:1082-1149`). S6's deferred slice-3
  `[asset-ref]`/`[aspect-ratio]` gates (`HANDOFF.md:64`) flip ON against this surface.

Answer to the brief's sub-question: yes, it returns a decided `AssetSpec` that `screen.ts` consumes
verbatim (S1/S2 "never re-derive"), and `patterns.assets` is the additive plan slot.

### Q4 — Manifest + determinism (S4 groundwork)

The S-HERMETIC `[lockfile]` gate (`validate.ts:1537-1552`) pins **pubspec.lock** (the transitive
dependency graph — `context.ts:4-9` documents "lockfile pins the GenerationContext tuple"); it is a
build-reproducibility pin, **not** an asset registry. `[determinism]`/`[plan-determinism]`
(`validate.ts:1696-1742`) regenerate once fresh and diff against `outDir` — the byte-identical
guarantee that makes any second run a pure cache hit *today* (proven by the S1 determinism test,
`test/s1_visual_intent.test.ts:273-302`).

**Zero-cost answer: v1 needs NO asset manifest.** The procedural rung emits no file (gradients and
shapes are code on tokens), so there is nothing to register in pubspec, nothing to content-hash,
nothing to lock — `flutter build` needs no `flutter.assets` entry for an asset that doesn't exist.
A manifest only becomes mandatory when (a) a declared-library/file asset lands (S4) or (b) S7's
approved AI raster needs content-hash + lockfile pin (`VISUAL_GENERATION_REVIEW.md:34` §11 ACCEPT).
When S4 does land: registration = pubspec `flutter.assets` entries (`project.ts:66-78` gains an
`assets:` section), content-hash into a `regions.json`-style manifest (`index.ts:848,959-962`),
plan entry in `patterns.assets`, and the existing regen-diff gates keep everything byte-identical.

### Q5 — Trust boundary / S7 carve-out

**The AI branch is fully external today.** `grep` across `builder/src` for
`openai|anthropic|dalle|generateImage|image-generation|fetch(` returns zero; the only LLM calls in
the tree are the semantic-lane agents `requirements.ts:13` (`MODEL = "opencode/deepseek-v4-pro"`)
and `business_rule_agent.ts:136` — and both emit **IR text**, never rasters, and are already
approval-gated. No `Image.network`/`Image.asset`/`Image.file` is ever emitted by a generator
(grep 0 across `generators/`; the only `assets/fonts` references are golden-test FontLoader loads,
`test.ts:145-149`).

**Where the S7 `generated` stage hooks:** as a `kind: "generated"` branch in the future
`resolveAsset` selector that the **v1 ladder never returns** (the deterministic stages exhaust the
role space first — exactly the §5 §7 accept's "carve out + defer" shape, `VISUAL_GENERATION_REVIEW.md:28,94`).
The gate machinery already exists and needs no new invention:
- **Provenance envelope** — an `AssetRequest` carries `origin: llm-inferred, requiresApproval: true`
  (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:229-232`; `provenance.ts:15-22`), stamped by
  `stampAgentProvenance` (`provenance.ts:55-60`).
- **Generation refusal** — `index.ts:904-912` throws before any file write on any
  `requiresApproval` element (`unapprovedElements`, `provenance.ts:83-102`; S1's nested
  visualStyle recursion at :94-98 is the template for per-AssetRequest envelopes).
- **Human attestation** — `approve.ts:12-17` → `HUMAN_ACTOR = "human:attested"` (`provenance.ts:24`).
- **Regression template** — `test/s1_visual_intent.test.ts:207-271` proves: unattested →
  `[approval]` blocked, no `lib/`/`plan.json` written; `approve.ts` unblocks; and an out-of-enum
  value is schema-refused. S7 reuses this verbatim.
- **Immutable content-hash artifact** — S-HERMETIC lockfile pin (`validate.ts:1537-1552`,
  `context.ts:16-29`) + S4 manifest = "approved asset is a build artifact, never re-invoked".

## 5. Evidence

All cited in §3. Highlights:
- `AssetRequest` is absent as code: grep across `types.ts`/schemas/plan → 0; the only schema
  mention is the S1 "imagery (S3) deferred" comment (`screen.schema.json:139`); the only IR
  mention of `imagery` is the `[visualIntent]` hard-reject (`validate.ts:920-927`).
- The procedural rung is **already built and proven in goldens**: `AppHeroBanner` gradient
  (`components.ts:270`), `AppProductCard` (`:303-340`), keemart sections home
  (`apps/keemart/input/keemart.ir.json:62-77`), rendered by `screen.ts:386-532` with tokens only.
- pubspec registers fonts, never assets (`project.ts:66-78`); the only file assets emitted are
  fonts + static web icons (`index.ts:103-112,256-260`).
- Icon-role rung 1 exists as fixed `Icons.*` maps (`composition.ts:84-99,278-286`).
- Trust boundary is complete and regression-tested (`index.ts:904-912`; `approve.ts:12-17`;
  `test/s1_visual_intent.test.ts:207-271`); no AI image path exists (grep 0).
- Determinism guarantees are the existing regen-diff gates (`validate.ts:1696-1742`) + S1 test
  (`test/s1_visual_intent.test.ts:273-302`).

## 6. Semantic contract

- **No new IR field for the procedural rung.** `resolveAsset(ir, role)` derives from *decided*
  semantics only: `sections[]` (`hero`/`promoBanner` → gradient-banner role; `productGrid` →
  card-image-omitted role; `horizontalCards` → rail card), registry `role:"image"` component
  contracts (`AppAvatar`/`AppStatusDot`), and — once flipped on — `visualStyle.imagery`
  (`none|commercial|illustrative|photographic`, `VLM_DESIGN_TO_IR_CONTRACT_V2.md:201`) as a
  **closed-enum envelope feeding the selector's mapping table**, never a file/URL.
- **`AssetSpec`** (decided, closed): `{ role, kind: "icon"|"gradient"|"shape"|"placeholder"|"omitted",
  tokenRef?: string, icon?: string }` — every field a token/`Icons.*` reference, never a path,
  never a URL, never a raw number (`:44` rule, `VLM_DESIGN_TO_IR_CONTRACT_V2.md:44`).
- **The `generated` kind is out of the v1 enum** — the S7 branch is a stub the ladder never returns.
- **Library rung (S4):** the contract §3 `assets[]` fragment (`:221-233`) becomes a schema-validated
  IR field + pubspec `flutter.assets` + content-hash manifest — a separate contract slice, not
  smuggled into S3.
- **Consumption rule:** `screen.ts` applies the decided `AssetSpec` verbatim (S1/S2 never-re-derive;
  `[visualIntent]` FIX-6 would flag any enum-branching, `validate.ts:929-950`).

## 7. Determinism analysis

- **Inputs:** IR (`sections[]` types + `visualStyle.imagery` envelope once flipped) → schema-validate
  (Ajv, hard gate `index.ts:929-934`) → `assetFor` selector (pure, closed-enum → fixed table, the
  `RADIUS_SCALE`/`PERSONALITY_ROW` style `composition.ts:421-456`) → `AssetSpec` per screen → `ctx.assets`
  (`gen_context.ts`, additive) → `patterns.assets` in plan.json (`index.ts:801-843`) → renderer (pure
  string gen). No randomness, time, env, network, filesystem enumeration, LLM composition.
- **Byte-identical guarantee:** an app with no sections/imagery gets `assetFor → null` for every
  screen — no plan entry, no renderer change — the exact additivity S1/S2 already proved for absent
  `visualStyle`/`sections` (`test/s1_visual_intent.test.ts:273-302`); `[determinism]`/`[plan-determinism]`
  (`validate.ts:1696-1742`) ride along unchanged.
- **Manifest:** not an input for v1 (procedural assets emit no file — Q4). When S4 adds file assets,
  the content-hash manifest is a *record*, and regeneration stays IR-derived (regions.json precedent,
  `index.ts:848,959-962`).

## 8. Ownership analysis

| Module | S3 change (all additive) |
|---|---|
| `composition.ts` | `AssetSpec` + `assetFor`/`assetTargets` selector (next to `sectionsFor` `:500-515`; mapping tables like `RADIUS_SCALE` `:421-456`) + (flip) `imagery` closed-enum row |
| `gen_context.ts` | `assets?: Map<string, AssetSpec>` (beside `visual`/`sections` `:36-43`) |
| `plan.ts` | `patterns.assets?: Record<string, AssetSpec>` (additive slot `:60-68`) |
| `index.ts` | `assetTargets` once per run + `assetsByPath` re-key + `writePlan` spread (mirror `:919-938,801-822,825-843`) |
| `generators/screen.ts` | sections branch consumes `ctx.assets` verbatim (the `AppHeroBanner` call site `:445` gains the decided gradient/icon params, if any) — never re-derives |
| `validate.ts` | `[assets]` gate (re-derive+diff plan; closed-kind enum; token-only scan; provenance reuse — mirror `[visualIntent]` `:909-1004`); un-block `visualStyle.imagery` in `[visualIntent]` (d) `:920-927` + `types.ts` comment |
| `types.ts` | un-comment `imagery` into `VisualStyleModel` (closed enum) — S3's one IR-adjacent edit |
| `test/s1_visual_intent.test.ts` | the `:257-270` "imagery rejected" negative control flips to an approved-enum positive + S3 asset determinism case |
| S6 slice-3 `[asset-ref]`/`[aspect-ratio]` gates | flip ON against `patterns.assets` (`HANDOFF.md:64`) |

Shared-generator rule respected: `resolveAsset` is a new member of the existing selector family
(never a second decision site); `screen.ts`'s sections branch is extended, never forked.

## 9. Failure modes (each deterministic)

| Condition | Deterministic outcome |
|---|---|
| `visualStyle.imagery` present pre-S3 | `[visualIntent]` closed-enum **abort** (`validate.ts:920-927`; regression `test/s1_visual_intent.test.ts:257-270`) |
| Unknown asset kind / malformed AssetSpec | closed-enum schema/`[assets]` gate **abort** (the `[sections]` posture, `validate.ts:1082-1149`) |
| A role with no rung-1/3 resolution | deterministic **omission** (the S2 product-card posture: no image slot emitted, card still meaningful) — never an invented raster |
| Renderer emits a raw color/number/path | `[assets]` token scan + `[literals]` (`validate.ts:263-280`) **FAIL** |
| plan.json `patterns.assets` stale/missing | `[assets]` re-derive+diff **FAIL** (`[visualIntent]` posture `validate.ts:970-989`) |
| An unattested AssetRequest (S7 later) | Existing approval throw before any write (`index.ts:904-912`; `test/s1_visual_intent.test.ts:219-255`) |
| Grid card overflows once an image is ever added (S5) | viewport-squeeze test **FAILs** at 320 (`test.ts:730-741`); aspect-ratio gate (S6 slice 3) flips ON |

## 10. Architecture impact

Classification **A — pure presentation**, identical to S1/S2: the ladder is a composition-layer
decision (component/token selection) rendered by the existing sections branch. Explicitly NOT a
change to scoring, state-management/DI/routing/persistence, or the trust boundary. The S7 `generated`
branch, when it ever exists, crosses into C/D (external data-flow + approval machinery) — which is
why it stays out of v1 (`VISUAL_GENERATION_REVIEW.md:33` §10 DEFER, `:154` slotting). S3 does not
create that crossing; it carves the boundary.

## 11. Cost/complexity

- Generator: **S** — one pure selector + mapping tables + `AssetSpec` payload; renderer change is a
  param at existing call sites (`screen.ts:443-445`).
- IR/schema: **S** — un-comment one closed enum (`imagery`); no new IR field for the procedural rung.
- Validation: **S–M** — one `[assets]` gate reusing the `[visualIntent]`/`[sections]` re-derive+scan
  posture (`validate.ts:909-1004,1082-1149`) + flipping two S6 slice-3 gates ON.
- Testing: **S** — extend the S1 suite (imagery positive, determinism for a sections+imagery app);
  keemart goldens re-baselined for any imagery-driven delta; squeeze suite already covers 320/390/1400
  (`test.ts:700-741`).
- Golden churn: **YES by design** only for apps that declare `imagery`; section-less/imagery-less
  apps byte-identical.
- Determinism risk: **Low** — pure closed-enum selector; only additive plan surface.
- S4 (library/manifest) cost is a separate, larger slice and does not block S3's procedural value.
- **Benefit worth the cost: yes** — unblocks §5/§7/§8 accepts, activates S6's deferred asset gates,
  and (S2 D3's successor) gives hero/product/logo roles a decided, auditable resolution.

## 12. Findings

1. **The procedural stage is already 80% shipped.** S2's AppHeroBanner/AppProductCard + the
   registry's `role:"image"` atoms ARE the rung-3 rendering home; S3's work is a **selector +
   decision record**, not new widgets.
2. **No vocabulary exists to key an asset decision off today** — `AssetRequest` is prose
   (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:44,216-243`), and `visualStyle.imagery` is hard-rejected
   (`validate.ts:920-927`). The v1 ladder must key off decided `sections[]` semantics, or flip the
   `imagery` enum on (one closed-enum edit).
3. **All 3 contract sample roles resolve deterministically on rung 3 with zero AI**: hero banner
   (:299/:311-313 → AppHeroBanner gradient), product-card image slot (:251-252/:303 → AppProductCard
   with the slot intentionally omitted), store logo/avatar (:249 → AppAvatar/AppStatusDot glyph).
   The "image" in each is a **procedural shape on tokens**, exactly the §7/§8 accepts.
4. **Rung 1 (existing asset) only meaningfully serves icon-roles** (fixed `Icons.*` maps,
   `composition.ts:84-99,278-286`); imagery correctly skips it. Rung 2 (declared library) does not
   exist and is S4's schema+manifest job.
5. **v1 needs no manifest** — procedural assets emit no file, so nothing to register/lock; the
   existing regen-diff gates (`validate.ts:1696-1742`) already guarantee byte-identical re-runs.
6. **The trust boundary is complete and tested** (`index.ts:904-912`; `approve.ts:12-17`;
   `test/s1_visual_intent.test.ts:207-271`); the S7 `generated` branch is a stub the ladder never
   returns, and its future gate is the existing provenance/approval machinery.

## 13. Decisions (5, CLOSED)

**D1 — Vocabulary (Q1): MODIFY.** No `AssetRequest` type/IR field/schema/plan slot exists
(§3 grep table); `visualStyle.imagery` is closed-out (`types.ts:322-324`; `validate.ts:920-927`).
S3 keys its ladder off **decided semantics** (`sections[]` + registry `role:"image"` contracts) and
flips `imagery` on as one closed-enum edit; the contract §3 `assets[]` fragment stays prose pending
the library rung. **Failure mode if ignored:** a new `AssetRequest` IR field would be a schema-free
free-form channel — the exact teeth-erosion S1/S2's closed enums exist to prevent, and S4 would
inherit it unvalidated.

**D2 — Rung 3 procedural (Q2c): ADOPT.** AppHeroBanner (`components.ts:256-300`, gradient at `:270`)
+ AppProductCard (`:303-340`) + AppAvatar/AppStatusDot (`:97-148`) resolve every sample role with
zero raster; tokens-only, arch-linter clean. **Evidence** §3/Q2(c). **Failure mode if ignored:** S2's
"no image (S3 owns the asset ladder)" promise (`components.ts:153`) stays an unowned hole and S6's
deferred `[asset-ref]`/`[aspect-ratio]` gates never activate.

**D3 — Rung 1 existing asset (Q2a): ADOPT-with-limit.** Icon-roles already map through the fixed
`Icons.*` stem maps (`composition.ts:84-99,278-286`); imagery-roles miss rung 1 (no raster emitted —
only fonts `index.ts:103-112` + web icons `:256-260` exist) and fall to rung 3 by design. Zero new
machinery. **Failure mode if ignored:** inventing a fake "project image asset" for a role that has
none would smuggle a path/URL into the IR — the `:44` never-rule (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:44`).

**D4 — Rung 2 library + manifest (Q2b/Q4): DEFER → S4 (the brief's MODIFY trigger).** No library
concept, no `flutter.assets` in pubspec (`project.ts:66-78`), lockfile pins transitive deps not
assets (`validate.ts:1537-1552`). Minimal additive shape = contract §3 `assets[]` + schema + pubspec
assets + content-hash manifest — S4's mandate (`VISUAL_GENERATION_REVIEW.md:34,126-129`). **Zero-cost
finding:** v1 needs NO manifest — procedural assets emit no file; `[determinism]`/`[plan-determinism]`
(`validate.ts:1696-1742`) already give pure cache-hit re-runs.

**D5 — Trust boundary / S7 carve-out (Q5): ADOPT.** No AI image path exists in builder/src (grep 0;
only IR-emitting semantic agents `requirements.ts:13`/`business_rule_agent.ts:136`); the `generated`
kind is a stub the v1 ladder never returns, gated by the existing provenance envelope
(`provenance.ts:15-22`), pre-write approval throw (`index.ts:904-912`), `approve.ts` attestation
(`:12-17`), and the S1 trust-boundary regression (`test/s1_visual_intent.test.ts:207-271`).

**Net hypothesis verdict: SPLIT** — rung 3 (procedural) + rung 1 (icon) are ADOPT-now as one pure
selector slice; rung 2 (declared library) + manifest is S4's independent slice. No role requires AI
→ REJECT never fires; the brief's own MODIFY criterion ("library schema insufficient") is satisfied
by the S4 split rather than a silent schema guess.

## 14. Recommended implementation (slice spec for the Mac implementer)

> S3 = one pure-selector slice (procedural + icon rungs); S4 = separate library+manifest slice.
> All changes additive; nothing in scoring/arch/DI/routing/persistence touched. Claude-first,
> zen review, per AGENTS.md model-tier.

**14.1 Selector (`composition.ts`)** — `export interface AssetSpec { role: string; kind:
"icon"|"gradient"|"shape"|"placeholder"|"omitted"; tokenRef?: string; icon?: string }` +
`assetFor(screen, ir): AssetSpec | null` + `assetTargets(ir)` (mirror `sectionsFor`/`sectionsTargets`,
`:500-515`). Mapping tables: `hero/promoBanner → {kind:"gradient", tokenRef:"AppColors.primary"}`
(consumed as the existing AppHeroBanner gradient), `productGrid → {kind:"omitted"}` (explicit record,
not silence), store-logo role → `{kind:"shape", tokenRef:"AppAvatar"}`. Fixed closed-kind enum, no
paths/URLs/numbers (`:44` rule).

**14.2 Imagery flip (`types.ts` + `validate.ts`)** — un-comment `imagery?: VisualStyleValue<VisualImagery>`
(closed enum `none|commercial|illustrative|photographic`, `VLM_DESIGN_TO_IR_CONTRACT_V2.md:201`) into
`VisualStyleModel`; amend `[visualIntent]` (d) (`validate.ts:920-927`) to admit the closed set and
reject any non-enum value; update the S1 negative control (`test/s1_visual_intent.test.ts:257-270`)
to a positive + add a determinism case.

**14.3 Wiring (`index.ts`/`plan.ts`/`gen_context.ts`)** — `assetTargets` once per run
(`index.ts:919-937` precedent) → `ctx.assets` → `assetsByPath` re-key (`:801-822` precedent) →
`patterns.assets` additive spread (`writePlan :825-843`; `plan.ts:60-68`).

**14.4 Renderer (`screen.ts`)** — sections branch consumes `ctx.assets` verbatim at the existing
call sites (hero `:443-445`, grid `:446-481`); **never re-derives** (`[visualIntent]` FIX-6 scan
`validate.ts:929-950`).

**14.5 `[assets]` gate (`validate.ts`)** — mirror `[visualIntent]`/`[sections]`: re-derive+diff
`patterns.assets` (incl. null case), closed-kind enum, token-only/icon-only scan, provenance reuse.
Flip S6 slice-3 `[asset-ref]`/`[aspect-ratio]` gates ON against it (`HANDOFF.md:64`).

**14.6 Proof** — keemart + one sections app with `imagery` declared: generate → validate →
`flutter test --update-goldens` → squeeze 320/390/1400 green → determinism re-run byte-identical →
negative control (imagery non-enum value → abort). S4 owns the library/manifest proof.

## 15. Rejected alternatives

- **Adding a full `AssetRequest` IR field in S3:** rejected — the procedural rung derives from
  existing semantics; a new IR field now would be free-form until S4 validates it, duplicating the
  `imagery` envelope and pre-empting S4's schema work.
- **Building the declared-library rung in S3:** rejected — it requires a manifest + pubspec
  `flutter.assets` + content-hash machinery that is S4's mandate (`VISUAL_GENERATION_REVIEW.md:34`);
  folding it in would couple two independently shippable slices.
- **Emitting a raster placeholder (a generated PNG/gradient image file):** rejected — S2's
  procedural organisms already render gradient/shape without any file; an image file would need
  pubspec registration and break the zero-file v1 finding (Q4).
- **Faking a project image asset for logo/hero roles:** rejected — the only emitted file assets are
  fonts + web icons (`index.ts:103-112,256-260`); mapping an imagery role onto them would violate the
  `:44` never-rule (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:44`).
- **Admitting `kind:"generated"` as a silent fallback in v1:** rejected — the S7 branch must stay a
  never-returned stub; a fallback would route through the trust boundary without its provenance/
  approval/hash machinery (D5).

## 16. Open questions (owner / contract-owner calls)

- **`imagery` semantics for v1:** flipping `visualStyle.imagery` on (D1) admits
  `none|commercial|illustrative|photographic` as an IR-visible signal. Owner call: does a
  deterministic-only rung-3 still declare it (recorded intent → `patterns.assets` mapping), or stay
  closed until S4/S7? This spike's default: **flip on** — it is the S3 vocabulary the review's §5
  accept (`VISUAL_GENERATION_REVIEW.md:92`) implied.
- **Store-logo role:** the header section today renders Text/AppBar chrome only
  (`screen.ts:429-433`). Whether a future `storeLogo`/avatar section is added to the S2 vocabulary
  is a S2-ratification follow-up, not an S3 decision.
- **AssetSpec naming/surface:** `patterns.assets` keyed by screenPath (mirroring visual/sections)
  vs a global app-level `assets` — this spike proposes per-screen (consistent with every prior
  pattern); owner may prefer a global asset table in S4.

## 17. Follow-up

- Report 5 CLOSED decisions to the orchestrator: **D1 MODIFY, D2 ADOPT, D3 ADOPT, D4 DEFER→S4,
  D5 ADOPT → net SPLIT** (procedural-now; library+manifest with S4).
- Capture an implementer brief per §14.1–14.6 (Claude-first, zen review): one pure-selector slice,
  `imagery` flip, `[assets]` gate, S6 slice-3 gates ON, keemart+imagery proof, determinism + negative
  controls. S4 (asset manifest) becomes its own spike/brief afterwards.
- Contract note: v2 §3 `AssetRequest` remains prose until S4; v2 §2.3 `imagery` becomes an admitted
  closed enum at S3 (pending §16 owner sign-off).
- This report lives under `design/flutter-app-builder/research/` (research archive; single untracked
  file — `git status` clean before/after).
