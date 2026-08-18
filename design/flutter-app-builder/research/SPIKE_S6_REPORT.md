# S6 — No-vision-judge defect-coverage — SPIKE report

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — read-only; NO commits, NO
> edits, no `npm`/ts-node/Flutter (1vcpu/1gb box). Repo: `/root/fg-p5`, HEAD `044e537`, `git status`
> clean before/after.
> Grounding: DOI benchmark — repo state on 2026-08-18. Sources cited with file:line are the real
> generator source at HEAD.

## Chat summary (the 4 decision verbs + coverage matrix one-liner, ~6 lines)

1. **D1 ADOPT** — every §18 defect maps to an existing deterministic check, a near-term validator, or a
   human-baselined golden pixel-diff; **no cell requires semantic vision**.
2. **D2 ADOPT** — near-term validator candidates: `[contrast]` gate, per-screen viewport-squeeze
   overflow test, all-screens spacing-literal scan, `[asset-ref]`+`[aspect-ratio]` (post-S3),
   `A11yTestGenerator`.
3. **D3 CONFIRM** — the golden workflow IS a real pixel-diff gate (`matchesGoldenFile`, default exact
   comparator); add a golden-drift review step + per-app golden manifest.
4. **D4 CONFIRM** — S1's `[visualIntent]` gate + `test/s1_visual_intent.test.ts` already close the
   hierarchy, corner-radius, and token-consistency cells; overflow/RTL are closed independently by the
   generated l10n/scroll/golden tests.
5. Matrix one-liner: **3 EXISTS** (overflow, RTL, hierarchy) · **4 NEAR-TERM** (contrast,
   viewport-matrix overflow, spacing-literals, missing-asset) · **2 GOLDEN-ONLY** (alignment,
   typography feel) · **2 NONE-today-vacuous** (aspect-ratio, missing-asset-until-S3).
6. **Corrected premise** — review §4's "already exists" for §14.4.3 overflow and §14.4.1 contrast
   overstates reality: both are DESIGN-spec, not gates; overflow exists via the widget-test binding +
   `takeException` (390×844 only), contrast has no validator yet.

## 1. Status

Research-only. No scratch generation ran (brief forbids builds on this box), so every claim is
grounded in generator source (`builder/src/**`), the committed generated output
(`apps/*/output/app/**`, `apps/*/output/goldens/`), the committed QA probes
(`apps/*/output/qa/**`), the committed tests (`test/s1_visual_intent.test.ts`), and the committed
design docs (`VISUAL_GENERATION_REVIEW.md`, `DESIGN.md`, `HANDOFF.md`). Repository tree was not
modified (`git status` clean before/after). The `tools/overflow/overflow_scan.py` +
`new_chrome_ext/tools/FLUTTER_TESTING_LESSONS.md` cited in AGENTS.md are **not reachable from this
host** (they live in a Mac repo) — the CDP-overflow layer is documented as the QA-probe substitute
already present in-tree (§3/§5).

## 2. Hypothesis — and corrected premises

> Every defect the §18 "Visual Analyzer" targets (overflow, clipping, alignment, spacing, typography,
> contrast, aspect-ratio, missing-asset, RTL, component-consistency, hierarchy) maps to either an
> existing/near-term **deterministic validator** or a **human-baselined golden pixel-diff** — no case
> requires semantic image understanding. (`VISUAL_GENERATION_REVIEW.md` §6 S6, lines 111-115.)

**Corrected premise 1 — the review's §4 "already exists" overstates reality for two cells.**
`VISUAL_GENERATION_REVIEW.md:75-82` claims "overflow → §14.4.3 viewport-squeeze overflow validator
(already exists)" and "contrast → §14.4.1 alpha-composited contrast check (already exists)". Ground
truth: **both are DESIGN.md specifications, not implemented gates.** The §14.4.3 multi-viewport
matrix (`DESIGN.md:567`) has no generated per-screen test; the only in-tree realization is a
per-slice QA probe (`apps/ledgerly/output/qa/p1-shell/overflow_probe_test.dart`). The §14.4.1
alpha-composited WCAG contrast check (`DESIGN.md:503`) has **no validator function anywhere in
`builder/src`** (grep for `contrast|WCAG|luminance` across `builder/`, `tools/`, generated apps → 0
implementation hits). This moves those cells to NEAR-TERM but does **not** change the verdict: both
are computable deterministically, they just are not computed today.

**Corrected premise 2 — "overflow" is already largely covered, but by the widget-test binding, not a
dedicated validator.** Flutter's `flutter_test` binding converts any unreported `RenderFlex` overflow
into a failing test; the generated suite pumps every screen through at least one test
(`golden_test.dart` for screen[0], `flow_test`/`crud_flow_test` list→detail→form, `scroll_test` for
every list screen) and the l10n test explicitly asserts `tester.takeException() == null`
(`generators/test.ts:368,374`). So overflow is a *de-facto* existing gate at 390×844; the genuine gap
is the **viewport matrix** (320/768/1280) that §14.4.3 promises.

**Corrected premise 3 — aspect-ratio and missing-asset are vacuously "NONE" today because no generated
app references any image asset.** `grep Image.asset|Image.network|BoxFit|aspectRatio` over all
generated `lib/` → 0 hits; the component registry has no image surface (`components.ts`); `project.ts`
emits only the two bundled font families. These cells become load-bearing only when S3 (asset ladder)
+ S4 (asset manifest) land. The review's "missing assets → resolvable from the Asset Manifest at plan
time" (`VISUAL_GENERATION_REVIEW.md:78`) is therefore a *near-term future* coverage, not a present
one.

## 3. Ground truth

| What | Where (file:line) | State |
|---|---|---|
| Gate inventory in `main()` — `[platform] [determinism] [plan-determinism] [headers] [secrets] [forbidden-idioms] [architecture] [oracle] [strategy-fidelity] [money] [datepicker] [verdict] [split] [tenant] [symbols] [auth] [attachment] [budget] [audit] [export] [l10n] [theme] [outbox] [shell] [search] [scroll] [actions] [states] [visualIntent] [lockfile] [timestamp]` | `validate.ts:1504-1535` | real (30 gates) |
| Arch linter: presentation may not emit raw colors / bypass registry | `validate.ts:41-72` (`archCheck`, raw-color regex :67) | real |
| `[theme]` gate: buildTheme wiring, seed provenance, dark mode | `validate.ts:81-118` | real |
| **No contrast/WCAG/luminance validator** in `builder/src` | grep `contrast|WCAG|luminance` → only a comment word in `symbols.ts:75` | **genuine absence** |
| §14.4.1 spec: alpha-composited WCAG contrast, touch ≥44px, text-scale | `DESIGN.md:498-503` | design-spec only, **not implemented** |
| §14.4.3 spec: viewport-squeeze matrix (1400×900/390×844/320×480), zero overflow | `DESIGN.md:566-567` | design-spec only, **not generated** |
| QA probe realization of the matrix (320/390/768/1280, `takeException`) — NOT generated, per-slice only | `apps/ledgerly/output/qa/p1-shell/overflow_probe_test.dart:19-48` | real probe, copy-in QA artifact |
| Generated golden test: `matchesGoldenFile` at 390×844, real Roboto via FontLoader | `generators/test.ts:135-279` (FontLoader :141-150, surface :192-194, golden :275, dark :226, empty :248) | real |
| **No `flutter_test_config.dart` / fuzzy comparator in any generated app** → default exact-pixel `LocalFileComparator` | grep over `apps/*/output/app` → 0 hits | real — golden diff is exact |
| Generated l10n test: Directionality flip + `takeException()==null` + AR/EN goldens | `generators/test.ts:360-409`; `apps/hr_service/output/app/test/l10n_test.dart:47-116` | real — closes RTL + overflow@390 |
| Generated scroll test: list screens scroll without overflow | `generators/test.ts:705-845`; `apps/hr_service/output/app/test/scroll_test.dart:77-104` | real |
| Generated app main: `supportedLocales [en,ar]` + GlobalMaterialLocalizations delegates | `apps/hr_service/output/app/lib/main.dart:31-36` | real |
| `ScreenModel.responsive` + §14.4.3 wiring | `DESIGN.md:568`; `types.ts` | design/IR only |
| **No A11yTestGenerator** (`generateA11yTest`/`A11yTestGenerator` → 0 hits in `generators/`, `index.ts`) despite DESIGN §15:589 | grep 0 hits | **genuine absence** |
| `[visualIntent]` gate (S1, landed): plan re-derive + markers + radius/raw-literal guard | `validate.ts:741-835` | real |
| `visualFor` selector + RADIUS_SCALE/HERO_SCALE/PERSONALITY_ROW tables | `composition.ts:393-454` (tables :403-428) | real |
| S1 codified tests: token agreement, pairwise-distinct specs, trust-boundary negative control, determinism | `test/s1_visual_intent.test.ts:124-326` | real |
| Registry-owned rhythm constants `itemGap` 8/4/16, `heroGap` 24/16 | `composition.ts:22-30` | real — spacing is single-owner |
| `itemGap` reaches emitted layout as `EdgeInsets.only(bottom: ${itemGapExpr})` | `generators/screen.ts:673` (`itemGapExpr` :205) | real — raw `8.0` appears when personality unset (`approval_list_screen.dart:95`) |
| No app assets: pubspec emits only fonts (Roboto+MaterialIcons), `uses-material-design` | `generators/project.ts:68-78`; `apps/hr_service/output/app/pubspec.yaml` | real — aspect-ratio/missing-asset vacuous today |
| Prototype↔golden pixel-diff tool (PIL ImageChops, drift%) — disabled by default, prototype-map driven | `tools/compare_all_goldens.py:57-154` (`--enable` :26, disabled reason :71-75) | real tool, opt-in only |
| Golden baselines committed per app + S1 proof goldens | `apps/{tasks,hr_service,ledgerly}/output/goldens/*.png` (+ `s1_*.png`) | real |
| Human baseline vehicle: §15 "human-reviewed on first render, context change → re-approval" | `DESIGN.md:593`; AGENTS.md rule 10 (Telegram goldens) | real process rule |
| LLM judge = triage never certification; no LLM in correctness loop | `DESIGN.md:342` (§9.4), `DESIGN.md:582` (§14.6) | real principle |
| S6 plan status | `HANDOFF.md:66,84-85` | "Next (before any visual-QA work)" |

## 4. Questions (SPIKE_PROTOCOL §6 — answered with evidence)

**Q1 — Which deterministic state covers each §18 defect today?** → Matrix in §5. Summary: overflow
(partial, widget-test binding @390), RTL (exists, l10n test), hierarchy (exists, `[visualIntent]`),
spacing (exists, tokens+registry), clipping (overflow-proxy + golden), contrast (NONE), alignment +
typography feel (GOLDEN-ONLY), component-consistency (partial-by-construction + S1 token test),
aspect-ratio + missing-asset (NONE-today, vacuous).

**Q2 — Is a human-baselined golden pixel-diff sufficient for the soft/impossible-to-script defects?**
Yes — with two conditions, both satisfied: (a) the baseline exists and is human-owned (committed
`output/goldens/*.png`, §15:593 first-render human review, AGENTS.md rule 10 Telegram review), and
(b) the diff is numeric and enforced (`matchesGoldenFile`, default exact comparator — no
`flutter_test_config.dart` in any generated app means no fuzzy auto-tolerance; a drifted render fails
`flutter test`, which runs in `npm run pipeline`). The diff is byte/pixel-exact, deterministic, and
runs locally with the real Roboto fonts loaded (FontLoader, `generators/test.ts:141-150`) — so the
baseline is meaningful (real glyphs, not Ahem boxes).

**Q3 — The one-gap probe: is any defect ONLY catchable by semantic image understanding?**
No. The three "feel" judgments (typography rhythm, alignment feel, hierarchy/component look-right)
are human baseline decisions — precisely what the §15 golden baseline is. Once a baseline exists, the
gate is numeric ("does the current render equal what the human approved?"), and the human approves
the baseline at first render. Aspect-ratio is derivable from an IR `ImageSpec` aspect-ratio when S3
lands; text elision from a max-lines/overflow check (Flexible+ellipsis, `DESIGN.md:566`); RTL from
the already-generated `Directionality` assertion. The residual "first render needs a human look" is a
process gate (send golden to owner), not a vision requirement. **No defect provably needs an LLM
looking at a render.**

**Q4 — Candidate deterministic additions for each NEAR-TERM/NONE cell** → §14 (D2 list).

## 5. Evidence — the defect × coverage matrix

Mechanism classes: **EXISTS** (real gate/test today) · **NEAR-TERM** (small deterministic validator,
spec'd in §14) · **GOLDEN-ONLY** (soft judgment → human-baselined pixel-diff) · **NONE** (nothing
today; vacuous or blocked on S3/S4).

| §18 defect | Class | Deterministic mechanism today / proposed | Where |
|---|---|---|---|
| **overflow** | EXISTS (partial) + NEAR-TERM | RenderFlex overflow fails the test binding; `takeException()==null` (l10n @390 LTR+RTL); scroll tests; golden test pumps screen[0]. Multi-viewport matrix 320/768/1280 only in the QA probe. | `generators/test.ts:360-377,705+`; `overflow_probe_test.dart:19-48` |
| **clipping** | EXISTS (proxy) + GOLDEN | Same overflow mechanism; golden pixel-diff catches cut content; intentional text elision = Flexible+ellipsis pattern. No dedicated clip assert. | `DESIGN.md:566`; goldens §3 |
| **alignment** | GOLDEN-ONLY | Composition is deterministic (Column stretch / spaceBetween, screen.ts patterns); "feels off" is a human-baseline decision → exact pixel-diff. | `DESIGN.md:593`; `compare_all_goldens.py` |
| **spacing** | EXISTS + GOLDEN | `AppSpacing.*` tokens throughout; registry-owned `itemGap`/`heroGap` (single owner); S1 gate asserts the hero-gap token = decided hierarchy. Soft feel → golden. | `composition.ts:22-30,403-428`; `screen.ts:673`; `validate.ts:811-818` |
| **typography** | NEAR-TERM (nice) | Material textTheme from seed via `buildTheme()`; arch gate bans raw colors. No `fontSize:` literal exists today; a text-style literal scan is a cheap guard. | `validate.ts:67`; generated apps grep |
| **contrast** | NEAR-TERM (gate-worthy) | **No validator exists.** Computable deterministically from emitted `AppColors`/textTheme (alpha-composited fg-over-bg WCAG ratio, per `DESIGN.md:503`). | grep 0 hits; `DESIGN.md:503` |
| **aspect-ratio** | NONE (vacuous) → NEAR-TERM w/ S3 | No images generated today. Proxy: IR `ImageSpec.aspectRatio`/`fit` token asserted by validator; crop drift → golden. | `project.ts:68-78`; generated grep 0 hits |
| **missing-asset** | NONE (vacuous) + build-time → NEAR-TERM | No app assets today; `flutter build web` fails on a missing referenced asset (Artifact layer). Plan-time `[asset-ref]` check (declared-in-pubspec + on-disk) closes it before build. | `DESIGN.md:455` (§14.1); `project.ts:68-78` |
| **RTL** | EXISTS | l10n test asserts `Directionality` flip (ltr↔rtl) + no overflow + AR/EN goldens; main.dart wires `supportedLocales`/delegates. | `generators/test.ts:360-409`; `main.dart:31-36` |
| **component-consistency** | PARTIAL + NEAR-TERM | Registry-only vocabulary by construction (arch gate + no bare `Card`/`ListTile` in generated screens); S1 token-consistency test on proof screens. No cross-screen scan. | `validate.ts:62-68`; `s1_visual_intent.test.ts:163-197` |
| **hierarchy** | EXISTS | `[visualIntent]` gate: hero-padding marker = decided `heroScale`; S1 test asserts 3 proof screens pairwise-distinct on ≥2 structural dimensions; golden baseline. | `validate.ts:811-818`; `s1_visual_intent.test.ts:140-148` |

## 6. Semantic contract

No new IR. The cells map to **existing declared semantics**:
- `screen.visualStyle.{hierarchy,cornerRadius,personality}` (S1, `types.ts`) → hierarchy/radius/
  spacing/hierarchy cells.
- `attributes.locale` (L4) → RTL cell (l10n test exists when locale-aware).
- `ScreenModel.responsive` (`DESIGN.md:568`) → the §14.4.3 viewport matrix (already-declared
  semantic; the matrix test just consumes it).
- Future `ImageSpec` (S3 contract v2 asset ladder) → aspect-ratio cell.
- Contrast/spacing/typography need **no new IR** — they are pure functions of the emitted token layer
  (`AppColors`/`AppSpacing`/`AppRadius`/Material textTheme) and are validated over the emitted tree.
**Forbidden:** naming heuristics; no new schema field is proposed for any cell (D2 candidates all
consume existing emitted state).

## 7. Determinism analysis

- **Inputs:** emitted `lib/**` (screens, theme.dart, main.dart, test/**) → static scans or pure
  functions over tokens → PASS/FAIL. No randomness, time, env, network, filesystem enumeration, or
  LLM in any gate.
- **Contrast:** parse the emitted `AppColors.*` consts + seed, alpha-composite fg-over-bg, WCAG
  ratio — pure arithmetic on emitted bytes (the §14.4.1:503 blend rule). Deterministic.
- **Overflow matrix:** widget test at fixed `tester.view.physicalSize` sizes, asserting
  `takeException()==null` — same mechanism `golden_test` already uses, fixed inputs.
- **Spacing literal scan:** regex over presentation-layer files, exact-string, deterministic.
- **Asset/ratio gates:** file-existence + declared-in-pubspec + IR `ImageSpec` token match —
  deterministic.
- **Where proven:** `[determinism]`/`[plan-determinism]` (`validate.ts:1505-1506`) already byte-diff
  `lib/`; any new validator is part of `validateOutput` (`validate.ts:1240-1476`), so a re-run that
  changes output bytes fails. S1's determinism tests (`s1_visual_intent.test.ts:265-326`) prove the
  S1 fragment is byte-stable; S6 adds no plan surface.

## 8. Ownership analysis

- **`validate.ts`** — all four validator candidates live here as siblings of `[theme]`/`[visualIntent]`
  (single-gate-surface posture, §5.2 precedent: re-derive, never fork).
- **`generators/test.ts`** — the per-screen viewport-squeeze test generator (new exported generator,
  same posture as `generateScrollTest`; wired in `index.ts:283` registry).
- **`composition.ts`** — untouched (visualFor/COMPOSITIONS stay the single owner of spacing/radius
  decisions; the `8.0` gap decision belongs here, not the validator).
- **`index.ts`** — new test file row in the registry for the matrix generator.
- **A11yTestGenerator** — new file/owner per `DESIGN.md:589` (a separate L slice, not this S6's core).
- **Shared-generator rule respected:** no fork of `visualFor`/`statePlacementFor`; no second decision
  site. The one conflict surfaced: the spacing-literal scan must **allowlist the registry-owned
  `itemGap` emission** (`screen.ts:673`), or it false-positives on `8.0` — a decision that belongs to
  composition.ts (recorded in §16).

## 9. Failure modes (each deterministic)

| Condition | Deterministic outcome |
|---|---|
| Contrast computed on a not-yet-tokenized/inherited color | Advisory (report, don't block) on `user`/inherited regions per §14.1 v3.4:458; blocking on `generated` regions only |
| Spacing-literal scan flags the registry `8.0` gap | False positive by design unless allowlisted — treat `EdgeInsets.only(bottom: ${itemGapExpr})` as a declared registry decision (or route through an `AppSpacing` token); the gate records the choice, it does not guess |
| Golden baseline missing for a new screen (first render) | Process gate: human review required before `--update-goldens` output is committed (§15:593, AGENTS.md rule 10); no auto-acceptance |
| Font rasterization noise across OS causes golden churn | Exact compare is the documented default (§15); a tolerance policy (`matchesGoldenFile(allow:…)`) is an owner call (§16), never auto-silent |
| Multi-viewport matrix increases test time 3× | Accepted cost (no goldens for the matrix — assertions only, so no golden churn); gate-worthy over CI-time preference |
| An S3+ app ships a wrong-crop image before `[aspect-ratio]` lands | Golden baseline catches it on first human review; the gate closes it deterministically after S3 |
| **What would falsify D1** | A defect with (a) no concrete validator AND (b) no possible baseline AND (c) only judgeable semantically from a render — none found; the closest three (alignment/typography/hierarchy feel) all have a baseline by §15 |

## 10. Architecture impact

Classification **A — pure presentation/quality** for all cells. New work is validator-layer only
(DESIGN §14.4 Quality): contrast (a11y sub-layer §14.4.1), viewport matrix (layout §14.4.3), spacing
scan + asset/ratio checks (structural/artifact). **No crossing** to B interaction/state, C data-flow,
D navigation, or E runtime authorization. The `[contrast]` gate touches the a11y sub-layer the design
already scopes (§14.4.1), and the A11yTestGenerator is a separate larger slice (§15) — neither is
architectural. This is not called cosmetic: it closes two DESIGN-spec'd gates that do not exist yet.

## 11. Cost/complexity

| Candidate | Generator | IR/schema | Validation | Testing | Golden churn | CDP | Determinism risk |
|---|---|---|---|---|---|---|---|
| `[contrast]` gate | — | — | S (pure fn over emitted tokens) | S | none | none | Low |
| Viewport-squeeze test generator | M (new test generator + registry row) | — | S (`[matrix]` marker scan optional) | M (3× test time, no goldens) | none | none | Low |
| Spacing-literal scan | — | — | S (regex over presentation layer) | S | none | none | Low |
| `[asset-ref]`+`[aspect-ratio]` | — | S (ImageSpec, S3) | S-M | S | possible (first asset goldens) | none | Low |
| A11yTestGenerator | L (own slice) | S | S | L | none (semantics-only) | S (semantics tree) | Low |

**Benefit worth the cost: yes.** Contrast is the highest-value/lowest-cost cell (a real WCAG defect
nothing catches today, computed from tokens already emitted); the viewport matrix closes the largest
"already-exists" overclaim (§14.4.3) using an already-proven mechanism. The two asset cells are
explicitly S3/S4-gated, so they add zero cost now.

## 12. Findings

1. **The review's §4 "already exists" overstates two cells.** The §14.4.3 viewport-squeeze matrix
   and the §14.4.1 alpha-composited contrast check are DESIGN specs, not gates. Overflow is covered
   today only via the widget-test binding at 390×844 + the per-slice QA probe; contrast has zero
   implementation.
2. **No defect requires semantic vision.** Every cell is either a computed check, a token-level check,
   or a human-baselined golden pixel-diff (numeric, exact comparator). The §18 REJECT stands with its
   intent fully re-routed.
3. **The golden workflow is a real, exact pixel-diff gate** — `matchesGoldenFile` with no fuzzy
   comparator in any generated app → a drifted render fails `flutter test` (runs in `npm run
   pipeline`). The one weakness is process, not mechanism: nothing formalizes "human re-approval on
   `--update-goldens`" beyond the §15 rule + Telegram workflow.
4. **Aspect-ratio and missing-asset are vacuously uncovered today** — no generated app references any
   image asset (`project.ts` emits fonts only). Coverage becomes load-bearing with S3/S4; the honest
   classification is NONE-today, not EXISTS.
5. **S1 already closes three cells.** `[visualIntent]` (hierarchy marker, `validate.ts:811-818`),
   the radius/AppRadius-only guard (`:820-831`), and the S1 codified tests
   (`s1_visual_intent.test.ts:124-197`) give deterministic hierarchy + corner-radius +
   token-consistency coverage. RTL was closed earlier by the generated l10n test.
6. **The `8.0` item gap is a registry decision, not a leak.** It is the composition's `itemGap`
   default (`composition.ts:22-30` → `screen.ts:673`), rendered as a raw number only when no
   personality biases it. Any all-screens spacing scan must treat it as a declared constant or route
   it through an `AppSpacing` token — a small, owner-visible cleanup.
7. **A11yTestGenerator (DESIGN §15:589) does not exist**, despite being called a "checked invariant".
   It is the largest missing piece adjacent to §18's component-consistency/hierarchy cells and is its
   own L slice.

## 13. Decisions (4, CLOSED)

**D1 — Coverage verdict: ADOPT.** Every §18 defect maps to an existing deterministic check, a
near-term deterministic validator (D2), or a human-baselined golden pixel-diff — **no cell requires
semantic vision**. Evidence: matrix §5; the three "feel" defects are baselined by §15; aspect-ratio is
IR-derivable at S3; text elision is a max-lines/overflow check; RTL is already asserted. Corrected
premise recorded (§2): two cells the review called "already exists" are NEAR-TERM, not present — the
verdict is unchanged because both are deterministic-by-construction.

**D2 — Near-term validator candidates: ADOPT** the list in §14 (contrast gate first; viewport matrix
second; asset/ratio gates gated on S3/S4; spacing scan + A11yTestGenerator as nice-to-have).

**D3 — Golden-diff sufficiency: CONFIRM, with one improvement.** The existing golden workflow is a
real numeric pixel-diff gate (`matchesGoldenFile`, default exact comparator, real fonts loaded,
committed per-app baselines). One improvement makes it a trustworthy baseline gate: a **formalized
golden-drift review step** — a documented policy that any `--update-goldens` change is human-reviewed
before commit (§15 already mandates this; enforce it with a per-app golden manifest recording
baseline + generation context/fonts, and keep exact-compare as the default). The prototype↔golden
diff tool (`compare_all_goldens.py`) exists but is disabled by default — leave it opt-in; the
generated widget-test goldens are the load-bearing gate.

**D4 — Interaction with S1's tests: CONFIRM, they close three cells.** `[visualIntent]`
(`validate.ts:741-835`) + `test/s1_visual_intent.test.ts` already close **hierarchy** (hero-padding
marker per decided heroScale; S1 pairwise-distinct-specs test), **corner-radius** (radius marker +
AppRadius.*-only raw-literal guard), and **token-consistency** (Item 3: AppRadius/AppSpacing tokens +
zero raw literals on proof screens). Overflow and RTL are closed independently by the generated
l10n/scroll/golden tests, not by S1. Not closed by S1 or anything else today: contrast, viewport
matrix, typography-literal scan, asset cells.

## 14. Recommended implementation (D2 slice spec, for the Mac implementer — not built by this spike)

Prioritized; each one-liner = name, what it computes, where it plugs.

1. **`[contrast]` gate (S, gate-worthy — highest value)** — parse emitted `core/theme.dart`
   `AppColors.*` + derived textTheme colors, alpha-composite fg-over-bg (src-over blend first), WCAG
   ratio; FAIL <4.5 (body) / <3.0 (large) on `generated` regions; plugs in `validate.ts` as a sibling
   of `themeCheck`; advisory on inherited regions (§14.1 v3.4).
2. **Per-screen viewport-squeeze overflow test (M, gate-worthy)** — new generator in
   `generators/test.ts` emitting, per screen, a widget test rendering at 320×480 / 390×844 /
   1400×900 asserting `tester.takeException()==null` (the §14.4.3 matrix, currently only the
   p1-shell QA probe); register in `index.ts:283`; assertions-only (no goldens) so zero golden churn.
3. **`[asset-ref]` + `[aspect-ratio]` gates (M, gated on S3/S4)** — at plan time: every asset
   reference in generated code is declared in pubspec + exists on disk; every emitted `Image` carries
   the IR `ImageSpec` `fit`/`aspectRatio` token, never an IR-side number. Block until S3 lands; then
   closes the two NONE cells deterministically.
4. **All-screens spacing/typography literal scan (S, nice)** — extend S1's `RAW_LITERAL_PATTERNS`
   (`s1_visual_intent.test.ts:167-172`) from the 3 proof screens to every screen: no
   `EdgeInsets.only/all(<digit>`, `fontSize: <num>` in presentation layer; allowlist the registry's
   `itemGap` emission (`screen.ts:673`) or first route it through an `AppSpacing` token (owner call,
   §16).
5. **A11yTestGenerator (L, own slice, nice)** — implement DESIGN §15:589's per-screen a11y test
   (role/name/bound-state assertions) — the missing "checked invariant" adjacent to the
   component-consistency cell.

**Priority:** 1 (contrast) > 2 (viewport matrix) > 3 (with S3) > 4 > 5.

## 15. Rejected alternatives

- **Semantic-vision LLM "Visual Analyzer" (the §18 mechanism)** — rejected: violates
  `DESIGN.md:342,582` (§9.4 triage-only, §14.6 no-LLM-judge) and reintroduces render-time
  non-determinism; this spike confirms no defect needs it (D1).
- **Golden-only coverage for contrast** — rejected: contrast is computable deterministically from
  emitted tokens (`DESIGN.md:503`); leaving it to goldens ships WCAG failures until a human eyeballs
  the render. The gate is S-cheap.
- **A fake "hierarchy/alignment score" validator** — rejected: no honest computable check exists for
  "looks right"; a numeric pretender would certify the uncertifiable. The human baseline (§15) is the
  honest gate.
- **CI screenshot-diff infra (headless render per PR)** — DEFER: heavier than the widget-test binding
  already in-tree (same binding, same `matchesGoldenFile`/`takeException`), and CDP viewport control
  is unreliable in this environment (`overflow_probe_test.dart:3-11`). The generated widget-test
  suite is the load-bearing layer.
- **Splitting "overflow" into a separate §18 cell change** — rejected as unnecessary: the matrix
  (D2#2) covers it wholesale; no re-scope of the defect list needed (brief's MODIFY option not
  required).

## 16. Open questions (owner-call items)

- **Contrast gate scope + threshold** — block all generated screens at 4.5/3.0, or advisory on
  inherited regions only (§14.1 v3.4:458)? Recommend: blocking on `generated`, advisory elsewhere.
- **Golden drift policy** — keep exact-compare default (recommended), or allow a small documented
  `allow:` tolerance for anti-aliasing? And: approve committing a per-app **golden manifest**
  (baseline + context/fonts + generator version)?
- **`8.0` item-gap decision** — route through an `AppSpacing` token (cleaner, small golden churn) or
  formally allowlist the registry constant (zero churn)? This is composition.ts's decision either way.
- **Viewport matrix test placement** — generated per-screen (3× test time) vs a single generated
  "matrix" test per app (cheaper, coarser). Recommend per-screen, assertions-only.
- **A11yTestGenerator** — its own slice (L), before or after S2/S3? Recommend after S3 (semantics
  tree stable) but independent of S6's gates.

## 17. Follow-up

- Report 4 CLOSED decisions + evidence to the orchestrator (zen) via the ~6-line summary (§Chat
  summary); orchestrator relays to the owner on Telegram (sendMessage, one point per message).
- Capture a brief for the (Claude-first) Mac implementer: **Slice 6a `[contrast]` gate**, then
  **Slice 6b viewport-squeeze test generator** (D2 priorities 1–2); defer 6c (asset gates) to S3/S4
  and 6d/6e (spacing scan, A11yTestGenerator) as owner-approved nice-to-haves.
- Owner-call items §16 (contrast scope, golden manifest + drift policy, item-gap token) resolve before
  or alongside 6a.
- This report lives under `design/flutter-app-builder/research/` (research archive).
