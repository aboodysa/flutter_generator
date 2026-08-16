# Design options for generated Flutter apps — research report

> Research date: 2026-08-16 · Source brief: `~/temp/opencode/flutter-app-builder/RESEARCH_DESIGN_OPTS.md`
> Scope: how the **generator** (`(IR, ctx) → string`) can make generated apps look *designed*,
> not boilerplate. Research + design only — no code changes. Each option: what / why / how
> the generator would emit it deterministically / effort (S/M/L) / impact (Low/Med/High).
> Grounded in `design/flutter-app-builder/` (DESIGN v3.5, UIX_ENHANCEMENTS, CAPABILITIES,
> COMPOSITION_ENGINE) and the generated app `apps/tasks/output/app/lib/core/`.

## 0. Ground truth — what already exists (don't re-recommend these)

| Area | Where (generated) | Where (generator) | Status |
|---|---|---|---|
| Tokens: `AppColors` (primary + semantic success/warning/danger/info), `AppSpacing` (4/8/16/24/40), `AppRadius` (12/16/24) | `core/theme.dart` | `builder/src/generators/infra.ts` (`theme.v1`) | ✅ shipped |
| M3 `ColorScheme.fromSeed`, near-zero elevation, filled input decoration, `Card` radius 16, Roboto | `core/theme.dart` | `infra.ts` | ✅ shipped (buildTheme()) |
| **BUT the running app ignores it**: `main.dart` uses `ThemeData(colorSchemeSeed: Colors.teal)`; `buildTheme()` + `AppColors` are only applied by goldens/tests and header-less `Router` screens rely on the ambient context | `lib/main.dart:28` | `generators/project.ts` (`main.v1`) | ⚠️ **bug — theme is not wired into the app** → fixes the whole "designed" story |
| **Token drift**: `AppTokens.primary = 0xFF006E6A` (components.dart) ≠ `AppColors.primary = 0xFF0D9488` (theme.dart) — two seeded teals | `core/components.dart`, `core/theme.dart` | `generators/components.ts`, `infra.ts` | ⚠️ inconsistency |
| Role-aware layout: status/priority chips (tone vocabulary), status dot leading, ID de-emphasized last, child relation → section card | `core/components.dart`, detail/list screens | `screen.ts`, `crud_form.ts`, `components.ts` | ✅ shipped (UIX B/C/D) |
| Composition registry: archetypes list/detail/wizard, hero flag, rhythm (`heroGap`/`itemGap`), surface plain/card | — | `builder/src/composition.ts` | ✅ shipped (3 archetypes; extensible data) |
| State placeholders: `LoadingState` (spinner), `ErrorState`, `EmptyState`, confirmed delete, success feedback | `core/components.dart` | `components.ts` | ⚠️ **bare** (spinner / centered text only — Slices F) |
| Humanized date/enum formatting | — | `screen.ts`, `crud_form.ts` | ❌ not landed (detail still renders `ISO…split('T').first`) |
| Dark mode, density-as-attribute, template presets (`minimal|productivity|…`) | `AppAttributes` (types.ts) has `density`, no `themeMode`/`template` | `scoring.ts`, `types.ts` | ❌ declared-intent only (UIX A/G deferred) |
| A11y: components carry `Semantics` labels, 44px targets, `ensureSemantics()`, `SemanticsBinding` | `core/components.dart`, `main.dart` | `components.ts`, `project.ts` | ✅ baseline (P2/F3 era); residual gaps §14.4.1.3 open |
| Goldens 390×844 real Roboto/MaterialIcons via `FontLoader` | `test/golden_test.dart` | `generators/test.ts` | ✅ shipped; the visual-regression gate |
| RTL/l10n AR-EN | pilot only (Rasheed) | — | ❌ Phase 2 (DESIGN §16) |

**Consequence:** the "designed" picture only holds in goldens today because the real app entry
ignores `buildTheme()`. Many suggestions below are cheap **because** the token layer already
exists — the work is wiring it and adding variation, not inventing a system.

---

## 1. Visual identity / theming

### O1.1 — Wire `buildTheme()` into the app root (the single highest-leverage fix)
- **What:** `main.dart` emits `theme: ThemeData(colorSchemeSeed:)` instead of `theme: buildTheme()` and never sets `darkTheme`; the entire 5-token system (semantic colors, radius, spatial rhythm, filled inputs) is dead code in the running app. Screens are correct only because goldens wrap them in `buildTheme()`.
- **Why:** a "designed" app whose live shell uses raw teal is a zero-cost reputation killer; every other option in this report compounds only if the app actually renders the tokens.
- **How (deterministic):** `ProjectGenerator.main.v1` imports `core/theme.dart` and emits `theme: buildTheme(), darkTheme: buildThemeDark(), themeMode: _mode` (values resolved from `attributes` in `infra.ts`, identical string each run). Golden tests already prove the visual; the live shell needs to match it.
- **Effort: S · Impact: High**

### O1.2 — Brand-seed via IR attributes (palette derivation, not palette literals)
- **What:** `attributes.brandSeedColor` (`#hex`) + optional `attributes.brandFontFamily`. Replace the hardcoded `AppColors.primary`/font with a seed the IR declares; emit `ColorScheme.fromSeed(seedColor: ...)` once and derive semantic tones from it.
- **Why:** M3's seed→roles pipeline is exactly a *deterministic* palette system — one input turns into full tonal roles with matching contrast. Small teams get a cohesive brand without a designer.
- **How:** `infra.ts` builds the `AppColors` block from the seed (primary/surface/text fg, semantic success/warning/danger/info as 40/70/60/40ish clamping functions — a tiny pure-Dart helper, not an LLM); validator `[theme]` forbids a raw palette if a seed is declared, and forbids forbidden pairings (e.g. literal colors not in the derived set unless exported). Default = today's teal (backward compatible, no golden churn except once when wired).
- **Effort: S · Impact: High**

### O1.3 — Dark mode (`attributes.themeMode: light|dark|system`)
- **What:** a second `ThemeData.dark` built from the *same* token names (`surfaceDark`, `textPrimaryDark`, semantic conservaite), toggled via `themeMode`; `system` follows the OS.
- **Why:** listed in DESIGN §16/EXPECTED_GAPS as a gap (`H: light/dark tokens`); dark mode is the cheapest "designed" perception bump and a hard requirement for any serious app.
- **How:** `generateTheme` emits `buildThemeDark()` mirroring `buildTheme()` (same radius/spacing, seed-derived, elevated dark surfaces, tinted fills). `main.v1` sets `darkTheme`. Goldens: two golden sets (`*_dark.png`) gated by `attributes.themeMode` — only generated when dark is on, so existing light goldens don't churn. Validator asserts dark contrast passes.
- **Effort: S–M · Impact: High**

### O1.4 — Density presets (wire the attribute that already exists)
- **What:** `AppAttributes.density: compact|comfortable` is already parsed by `scoring.ts` but never reaches the theme. Emit per-density tuning: compact → `visualDensity: VisualDensity.compact`, list `itemGap 8→4`, control heights tighter; comfortable (default) → current + larger touch targets.
- **Why:** one IR switch buys the admin/productivity ("dense") vs consumer ("roomy") differentiation for free from a mechanism already in place.
- **How:** `theme.v1` templates take a density factor; `composition.ts` `itemGap`/`heroGap` multiply by it. Goldens regenerate once per preset; validator checks no overflow at compact on the viewport matrix (§14.4.3).
- **Effort: S · Impact: Medium**

### O1.5 — Radius presets (`attributes.roundness: tight|default|soft`)
- **What:** map the existing `AppRadius` scale (12/16/24) to *presets*: `soft` = today (rounded), `default` = tighter (8/12/16), `tight` = near-square (4/8/12). Render `CardTheme`, `InputDecoration`, `Chip`, `FAB` from the chosen preset.
- **Why:** radius is the single strongest "genre" signal (rounded = friendly consumer, square = dense admin). Presets keep it deterministic and goldens-stable; no per-widget judgement.
- **How:** `infra.ts` selects one constant triple from `attributes`; validator `[theme]` ensures every emitted radius reads from the token (arch-linter already forbids raw literals — §8).
- **Effort: S · Impact: Medium**

**Recommendation for §1:** O1.1 + O1.2 ship together as one "theme wiring" slice (the app finally honors its design); O1.3 and O1.5 next; O1.4 when dense admin apps appear.

---

## 2. Layout & composition systems

Current state: `composition.ts` gives per-archetype hero gap/item gap/surface; detail screens already do hero (title → chips → metadata → body). What's missing is **breadth of composition**, and it's all data additions to the registry (§8's "extend here" seam).

### O2.1 — Constrained content width + responsive centering (i.e. "designed on iPad/desktop")
- **What:** cap body max width (e.g. 600–720 logical px) and center on wide screens; keep edge-to-edge on phones. This is *the* pattern that stops generated apps looking like stretched demos on tablet/web.
- **How:** a single `AppScaffoldBody` component (registry atom) wrapping the existing `ListView` children in `Center` + `ConstrainedBox(maxWidth: constraints.maxWidth < 720 ? double.infinity : 720, width: double.infinity)` — no per-screen branching, because `ScreenModel.responsive` already exists (§14.4.3) and defaults stay phone-fixed.
- **Effort: S · Impact: High** (visible in every CDP run on web)

### O2.2 — Surface hierarchy via M3 elevated/tonal roles (not flat-everything)
- **What:** today the theme is all elevation-0 tints. Use `surfaceContainerLowest/Low/High` + `surfaceContainerHighest` for bottom sheets, dialogs, dropdowns, and `outline`-bordered secondary cards — backgrounds, not shadows.
- **Why:** M3's own recipe for "designed but flat": hierarchy via tonal surfaces + outlines rather than shadows. Cheap, deterministic, no perf cost.
- **How:** `buildTheme` already derives from seed; emit `dialogTheme`, `bottomSheetTheme` (inset, rounded 24), `dropdownMenuTheme`, `chipTheme` `side: outline`. Card emphasis variations come from the composition `surface` field (`plain|card|raised|outlined`).
- **Effort: M · Impact: High**

### O2.3 — Grid vs list at a field level (the "poor man's dashboard")
- **What:** for read-mostly entities, allow `attributes.screen.<name>.grid: true` → emitted `GridView` (2-col on phone, 3–4 on wide) with `AppGridCard` (title, leading status dot, trailing chevron) instead of a list.
- **Why:** detail-typed apps (inventory, deals, marketplace) scream "grid" and a list reads off-by-genre. Determination: a grid is a *data* flip of the existing list composition — same state, same fields, different wrapper — so tests/goldens stay identical in shape.
- **How:** extend `CompositionSpec` with `layout: "grid"` + `CompositionVariants` in `composition.ts`; `screen.ts` picks the branch; scroll test + viewport squeeze validator still pass (§14.4.3).
- **Effort: M · Impact: Medium**

### O2.4 — Detail-screen section headers + field grouping
- **What:** group detail fields under labeled sections ("Details", "Dates", "People"), each with a `SectionHeader` molecule (small label, muted, optional count), replacing the current flat stack of `AppListCard`s.
- **Why:** the owner's review flagged "equal cards, weak hierarchy" (UIX_ENHANCEMENTS) — Slice C fixed row *weights*; grouping fixes scannability and is the standard *database-app* design.
- **How:** `screen.ts` buckets role-inferred fields: `meta` (status/priority/dates) always above `content` (description), then the rest; deterministic rule = field role order, never per-app config. New `AppSectionHeader` registry atom.
- **Effort: S–M · Impact: Medium**

### O2.5 — Rich hero for detail (banner + actions, not just a heading)
- **What:** detail hero grows an accent band / tonal container behind the title with the primary action (e.g. "Mark Done", "Approve") promoted to a `FilledButton` beside the title, keeping edit in an overflow.
- **Why:** hero = "what the eye lands on first" (COMPOSITION_ENGINE §locked). Currently the detail hero is a bare `headlineMedium` title; the CTA is buried in an unlabeled FAB-less app bar.
- **How:** `composition.ts` `hasHero` detail spec emits the tonal container + primary action expression derived from the screen type (detail → the entity's single most-likely first action = role-inferred from status enum). Golden-stable, deterministic.
- **Effort: M · Impact: High**

**Recommendation for §2:** O2.1 (max width) + O2.2 (tonal surfaces) first — they reframe *every* screen. O2.4/O2.5 then make detail feel designed; O2.3 where an IR says grid.

---

## 3. Component palette — ranked impact-vs-effort for codegen

The registry (`components.ts`) is the vocabulary screens may use (§8) — so *adding a designed component automatically upgrades every screen that needs it*. Ranked by `impact per unit of generator complexity`:

| # | Component | What it buys | How emitted deterministically | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Extended FAB / action button** (`label + icon`) | "button with a word" reads designed instantly; current bare `Icons.add` reads boilerplate | `screen.ts` emits `FloatingActionButton.extended` when the screen's primary action has a noun (list → "New Task") | S | High |
| 2 | `NavigationBar` (bottom) / `NavigationRail` (wide) | multi-screen apps get global chrome; app stops feeling like a demo single-flow | emitted from `AppModel` features count: ≥2 top-level list features → `NavigationDestination` per feature; rail on `width ≥ 800` (O2.1-aware) | S–M | High |
| 3 | **Segmented button** (enum selector) | replacement `SelectableSegmented` for 2–3-value enums (today it's chips everywhere); scannable & OS-native | `crud_form.ts` uses `SegmentedButton` for enum cardinality ≤3, chips >3, dropdown only for long/lazy enums | S | Medium |
| 4 | **Confirm dialog** (delete/void) | destructive safety + designed feedback; currently delete is instant (`IconButton` tap) | `state.ts`/screen templates emit `showDialog` with tonal `AlertDialog` + "Cancel/Discard" → registry `AppConfirm` atom | S | Medium |
| 5 | **Snackbar success feedback** | post-save "Saved ✓" with optional 5s undo; currently silent navigate | `crud_form.ts` after `await onSubmit` → `ScaffoldMessenger.showSnackBar` (automated-hide 4s); undo only when delete emitted (#4) | S | Medium |
| 6 | **Skeleton loader** | perceived speed; spinner (today) reads "empty" at fast networks | `LoadingState` variants: `skeleton:true` → shimmer-less pulsing placeholder cards matching list composition (`*Shimmer` = external dep — use `AnimatedOpacity` cycle, no package) | M | High (perceived) |
| 7 | `SearchBar` / filter header | real apps need search; instantly "product app" | registry `AppSearchHeader`: text field + trailing filter chips bound to repo `list(filter:)` — gate behind `attributes.search: true` | M | High |
| 8 | **Empty-state scene** (vector, no assets) | see §6 | see §6 | M | Medium |

**Recommendation:** 1, 4, 5 are a single "CTA + feedback" slice (S-effort, every screen benefits). 2 rides O2.1. 3 is nice-to-have. 6–8 are "read-to-real" polish for P7-era apps.

---

## 4. Typography & density

- **O4.1 — Type-scale tokens from M3.** Today screens reach for `textTheme.headlineMedium/bodySmall/label*` ad hoc. Emit `AppTypography` mirroring M3 roles (`display 36/500`, `headline 32`, `title 22/18`, `body 16/14`, `label 12/500`) with explicit letter-spacing and a declared height, then have screens reference only these via the registry (`TextStyleToken`), not bare `textTheme` lookups. *Why:* one coherent voice across screens, golden-stable. Effort M · Impact Med.
- **O4.2 — Save the font in the app root.** The Roboto in pubspec/assets is loaded only by test `FontLoader`s — `main.dart` (O1.1) must set `fontFamily: 'Roboto'` so the *running* app matches goldens. Same bug as §1. Effort S · Impact Med.
- **O4.3 — Numeric/tabular spacing.** Money, amounts, dates should render with `FontFeature.tabularFigures()` (fixed-width digits) so columns align and amounts don't jiggle. Emit via `labelLarge`/`bodyMedium` variants in `AppTypography`. Effort S · Impact Med (money apps).
- **O4.4 — Revenue-intent text styles.** In the `screen.ts` "compact metadata row" pattern (icon + label + value), the *value* should be `titleMedium`+`textPrimary` while the *label* stays `bodySmall`+muted — the hierarchy sliver M3 prescribes. Already partially landed (Slice C); standardize through a `KeyValueRow` atom. Effort S · Impact Low–Med.
- **O4.5 — Text scaling contract (a11y).** Declare `TextScaler.linear` from `MediaQuery.textScalerOf` and cap display styles (headlines stop at ~1.5×) so huge Dynamic Type doesn't overflow; validator already smells overflow (§14.4.3). Effort S–M · Impact Med (a11y).

---

## 5. Motion & feedback (deterministic, dependency-free)

- **O5.1 — Page transition.** go_router default is a plain fade; a `MaterialPageRoute`-style 8.0 fwd / 6.0 back slide-fade costs one template line in `route.ts` (`pageBuilder` + `transitionsBuilder`). No package. Effort S · Impact Med.
- **O5.2 — Animated list insertion/removal.** `AnimatedList` vs plain `ListView.builder` — swap item builder to use `ImplicitlyAnimatedList`-lite: wrap rows in `AnimatedSize`/`AnimatedOpacity` on mount when `state.items` length grows. Keep scroll position stable; tests already pump-and-settle. Effort S–M · Impact Med.
- **O5.3 — Micro-interaction on chips/FAB.** `ChoiceChip` → `AnimatedContainer` for the selected tint, `FloatingActionButton` press halos are free in M3; `InkWell` ripple already on. Only add what `*Animated*` gives without custom curves. Effort S · Impact Low.
- **O5.4 — Haptics.** `HapticFeedback.selectionClick()` on chip select / enum toggle, `.mediumImpact()` on confirm — two lines via `services.dart`, no plugin. Effort S · Impact Low.
- **O5.5 — Optimistic + undo (deferred).** Enqueue then show snackbar with undo only where delete is emitted (P7 money apps). *Why defer:* correctness (idempotency of rollback) needs the MF6 offline impulse; don't ship before that. Effort M · Impact Med.
- **O5.6 — reduced-motion.** Gate O5.1/O5.2 behind `MediaQuery.disableAnimations` / `prefers-reduced-motion` (DESIGN §14.4.1.3 #6) — a couple of ternaries, a11y-compliant by default. Effort S · Impact a11y-Med.

**Recommendation:** O5.1 + O5.6 + O5.4 are one S-effort "prefer/respect-reduced-motion" slice. O5.2 only after O2 lists/grids stabilize (golden churn).

---

## 6. Empty / loading / error states

- **O6.1 — Skeleton loader (primary).** Replace spinner-first loading with concrete skeletons: a `_SkeletonBlock` widget = `Container` tinted `outline` / 8–12% alpha with a breathing `AnimatedOpacity` loop (no shimmer package), sized from the *same* composition the list/detail uses (hero + 3 rows, or grid cells). *Why:* the fastest "designed" signal; deterministic (fixed durations, no random). Reuse `LoadingState`'s registry slot so screens don't change. Effort M · Impact High.
- **O6.2 — Empty state as a composed vector scene (no assets).** `EmptyState` becomes `Icon(Icons.inbox_outlined, 64, color: outline)` in a tonal `CircleAvatar` (radius container) + message + optional primary `TextButton` ("New <Entity>") when the repo has create. `ThemeIcon` = registry atom; nothing bundled. Effort S–M · Impact Med–High.
- **O6.3 — Error state with retry + recovery.** `ErrorState` gains a `Retry` `OutlinedButton` bound to the cubit's `load()` (already exists — it's just not wired) plus `RefreshIndicator` on lists (pull-to-refresh, one widget). Error text from §17 Failure taxonomy; never `Something went wrong` alone. Effort S · Impact Med.
- **O6.4 — Success feedback.** Save → snackbar "Saved" (O#5) + optional navigate-with-confirm; destructive (delete/void) → dialog (O#4), never instant. Effort S · Impact Med.

**Recommendation:** O6.3 + O6.2 + O6.4 = S-effort "state polish" slice (completes UIX Slice F). O6.1 separately for perceived performance.

---

## 7. Accessibility polish (codegen-reachable, no assets)

DESIGN §14.4.1.3 already enumerates the next gaps — *the generator should close them because the IR constructs exist*:

| Item | Mechanism (§14.4.1.3) | How emitted | Effort | Impact |
|---|---|---|---|---|
| Live-region announcements (#1) | `.announce()`/`aria-live` on async submit transitions (submitting→success/error) | `state.ts` emits `SemanticsService.announce(...)` in cubit `emit` on status change | S | Med (SR) |
| Field-error linkage (#2) | error text programmatically linked to the field | `crud_form.ts` sets `InputDecoration(errorText:, errorSemanticsLabel:)` from validator message | S | Med |
| Focus order from layout (#3) | derive tab order = layout order, or explicit `focusOrder` hint | mask-empty: order fields by emitted layout (deterministic today) + `FocusTraversalGroup` wrapper; validator asserts order | M | Med |
| Heading hierarchy (#4) | one h1/screen + no jumping levels | `screen.ts` assigns roles: app-bar title=h1, detail title=h1 on detail (app-bar becomes banner); `SectionHeader` = h2 | S | Med |
| 44px targets | already enforced | keep + add `minInteractiveSize` theme wins | S | Low |
| Contrast gating | alpha-composited WCAG check (§14.4) | validator runs per token/foreground pairing incl. dark palette | — | High (gatekeeper) |
| Dynamic Type + RTL | O4.5 + DESIGN §16 | as above | S–M | Med |
| Reduced motion | O5.6 | ternary guard | S | Low |

**Recommendation:** fold live-region + error-linkage + heading-hierarchy into the "state polish" slice (§6) — all three are IR data that already exists; the *emission* is what's missing. This is the "a11y generated, not audited" thesis made concrete.

---

## 8. Design-system / tokens adoption as generator inputs

Today tokens are **hardcoded template strings** (`AppColors`, `AppRadius`…). DESIGN §8.1 already defines the target: a designer-supplied *design-system package* (tokens + components + templates, versioned, schema-validated) consumed as data. Two ways to get there:

- **O8.1 — IR attributes for the common knobs (recommended first).** Expose the closed set as `attributes.{brandSeedColor, themeMode, density, roundness, fontFamily?, search}` (some already parsed). The generator answers 80% of "make it ours" without a designer. Everything validated by `[theme]`, goldens gate regressions. Effort M · Impact High.
- **O8.2 — Data-driven token override file (defer).** `theme.tokens` JSON (per DESIGN §8.1) loaded by `index.ts` merging onto defaults; unknown token → schema error. This is the designer attach surface — but it's a bigger change (token *indirection* through a Dart registry constant lookup rather than `static const`), so defer until O8.1 proves the shape. Effort L · Impact High (extensibility).

**Rule:** prefer *explicit IR over inference* for branding (§5.2 pattern-selection philosophy): color never inferred from app name; the attribute is required if the app overrides. Semantic-enum tone mapping (AppChip) stays vocabulary-inferred — that's a *status* signal, not a brand decision.

---

## 9. Reference apps — patterns worth copying

| Source | Pattern to copy | Where it lands |
|---|---|---|
| **Flutter Gallery (flutter/gallery)** — the reference M3 showcase | Tonal-surface cards with `surfaceContainer*` + `outline`s, bottom `NavigationBar` with selected pill indicator, seeded color palette | O2.2 (tonal hierarchy), O#2 (nav chrome) — direct codegen recipe |
| **Google Material 3 "Now in Android"-style energetic ("Waza"/expressive) M3** | Hero FAB `FloatingActionButton.extended` with noun label + wide touch targets, `SegmentedButton` for filters | O#1 (extended FAB), O#3 (segmented) |
| **gskinner/FlutterFolio** | Responsive `LayoutBuilder` — one Scaffold, content width capped on wide, gesture-clamped hero | O2.1 (constrain+center) — the definitive "phone app that grows to tablet without redesign" pattern |
| **Livedocs place/grocery UI showcases** | Skeleton placeholder cards and rich callback empty-state with tonal icon circle | O6.1, O6.2 — no-asset designed feel |

*Why these:* each is (a) open-source/documented, (b) implementable in ~1 composition entry, (c) no assets beyond MaterialIcons/Roboto that the generator already ships.

---

## 10. Priority roadmap (ranked, effort-boxed)

### Slice D1 — "Theme wiring" (S) · highest impact-per-effort
1. O1.1 wire `buildTheme()` (+Roboto font) into `main.dart` root; fix `AppTokens.primary` drift (O1.2 fold-in).
2. O1.3 dark mode via `attributes.themeMode` (+ dark goldens only when on).
→ Verifies by reason of *the tokens you already shipped now render on the iPhone*; goldens+CDP on tasks app.

### Slice D2 — "CTA + feedback" (S)
3. O#1 extended FAB, O#4 confirm dialog, O#5 success snackbar (v1: no undo).
4. O6.3 error-retry + pull-to-refresh; O6.2 composed empty state.
→ completes UIX Slice F; every CRUD app feels purposeful.

### Slice D3 — "Composition breadth" (M)
5. O2.1 max-width + centering (AppScaffoldBody); O2.2 tonal surface themes; O2.5 detail hero with promoted CTA.
6. O2.4 section-header grouping on details.
→ *framing* upgrade; visible on every CDP web run.

### Slice D4 — "Motion + a11y states" (S–M)
7. O5.1 page transitions + O5.6 reduced-motion; O5.4 haptics.
8. §7 live-region announce, field-error linkage, heading roles.
→ closes DESIGN §14.4.1.3 #1/#2/#4, the cheapest a11y wins.

### Defer (post-v1 / self-serve era)
- O6.1 skeletons (M, perceived-only), O#2 NavigationBar/Rail (needs ≥2-feature apps), O#7 SearchBar + O2.3 grid (feature-gated), O5.5 optimistic+undo (needs MF6), O8.2 designer data package (needs O8.1 + §8.1 contract), typography refinements O4.1/O4.3.

### Acceptance checklist per slice (matches ROADMAP loop)
- [ ] `npm run typecheck:builder` clean; generate+validate on **all** existing samples.
- [ ] `flutter analyze && flutter test` green; goldens regenerated once and verified for real text (Roboto, real icons).
- [ ] iPhone goldens + a one-line progress note to Telegram per slice (AGENTS rule 9).
- [ ] Viewport-squeeze overflow gate (§14.4.3) green across new layouts (O2.1/O2.5/O6.1).

---

*End of report. Research only — no generator or Flutter code changed.*