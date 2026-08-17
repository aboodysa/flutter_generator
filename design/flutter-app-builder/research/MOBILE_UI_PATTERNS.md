# Mobile design interface patterns — research spike

> Research date: 2026-08-16 · Scope: **read-only spike** — no builder/src changes, no commits.
> Question: which mobile *design interface patterns* should the deterministic generator
> (`(IR, ctx) → string`) be able to emit, ranked by impact-vs-effort, given the 2026 platform
> landscape (Material 3 Expressive / Google I/O 2026; iOS 26 Liquid Glass / WWDC 2025-26) and
> what the generator already ships today.
> Sibling reports: `DESIGN_OPTS.md` (theme/visual identity), `UIX_ENHANCEMENTS.md`,
> `COMPOSITION_ENGINE.md`. This spike is the *interface-pattern* layer: navigation, shell,
> structural layout, primary/secondary action models, search, empty/error/loading, adaptive
> breakpoints, list/detail composition — not token values.

## 0. Ground truth — what the generator emits today (don't re-recommend)

Verified against generated apps (`apps/tasks/output/app`, `apps/ledgerly/output/app`) and
`builder/src/generators/*`:

| Pattern | Where today (generated) | Generator source | Status |
|---|---|---|---|
| Feature-first folder layout (domain/data/presentation per feature) | `lib/features/<f>/{domain,data,presentation}` | `index.ts` registry + `arch.ts` | ✅ shipped |
| Router: `GoRouter` flat route table, list/detail/form per entity | `lib/core/router.dart` (`appRouter`, `routes: [...]`) | `generators/routing.ts` | ✅ shipped — **no global shell** |
| Per-screen `Scaffold` + `AppBar` (implicit back, title from list heading) | each screen file | `generators/screen.ts` | ✅ shipped — AppBar is per-list, **no NavigationBar/NavigationRail anywhere** |
| List → detail navigation (tap card), FK + child list (parent→children) | route table + list/detail pairs | `screen.ts`, `routing.ts`, `crud_form.ts` | ✅ shipped |
| Detail hero: heading title, status/priority chips, identifier row, description section | detail screen | `screen.ts` (UIX Slice C) | ✅ shipped |
| CRUD form: `ChoiceChip` for status/priority (replaces bare dropdown), enum/date/Money inputs | `crud_form.dart` | `generators/crud_form.ts` (UIX Slice D) | ✅ shipped |
| Wizard steps (`states`, `stateMachine`) + required-step guard | wizard screens | `state_machine.ts`, `screen.ts` | ✅ shipped |
| Composition registry: list/detail/wizard archetypes, hero flag, rhythm, surface | — | `builder/src/composition.ts` | ✅ shipped (3 archetypes) |
| Status/priority chips (tone vocabulary), status-dot list leading, ID de-emphasized | components | `components.ts` | ✅ shipped |
| State placeholders: `LoadingState`/`ErrorState`/`EmptyState`, delete confirm | `core/components.dart` | `components.ts` | ⚠️ bare (spinner / centered text; confirmed in DESIGN_OPTS) |
| FAB (create/new) on list screens | list scaffold | likely `screen.ts` | ✅ basic |
| A11y: semantics labels, 44px targets, `ensureSemantics()`, I/O parity | components + main | `components.ts`, `project.ts` | ✅ baseline |
| **No global shell**: no bottom `NavigationBar`, no `NavigationRail`, no drawer, no tabs across features; every multi-feature app (ledgerly) is a set of parallel root routes with no feature switch | verified: `grep -rl NavigationBar apps/*/output/app/lib/` → **empty** | — | ❌ **biggest structural gap** |
| **No search** (no SearchBar / query filter / searchable list) | — | — | ❌ not shipped |
| **No adaptive/breakpoint behavior**: no `LayoutBuilder`/`NavigationRail` on wide screens; the O2.1 max-width+centering from DESIGN_OPTS is unlanded | — | — | ❌ not shipped |
| Dark mode / themeMode | not wired (main.dart uses `colorSchemeSeed`) | `project.ts` | ⚠️ D1 (DESIGN_OPTS) queued |
| Empty-state composition, pull-to-refresh, error-retry, skeletons, snackbar-with-undo | — | — | ❌ D2 (DESIGN_OPTS) queued |

**Consequence:** today a generated app is a *flat set of per-entity lists*. The two highest-value
interface-pattern additions are (a) a **global navigation shell** for multi-feature apps and
(b) **search** — both would make generated apps feel like real mobile products instead of CRUD
forms strung together by GoRouter.

## 1. 2026 platform landscape (captured verbatim — the design targets to emit toward)

### 1.1 Material 3 Expressive (Google, May 2025 + I/O 2026) — Flutter gen target
- **App bar** (renamed from top app bar): small, medium-flexible, large-flexible, plus **search
  app bar**. Medium/large deprecated → flexible variants. On scroll: **color fill** separates bar
  from content (no drop shadow). Center-aligned option.
- **Navigation (compaction-model, this is THE 2026 pattern):**
  - **Navigation bar** (bottom) = 3–5 destinations, compact (<600dp); active = filled icon +
    indicator pill; **hide-on-scroll optional**; label always visible.
  - **Navigation rail** (side) = 3–7 destinations, medium (600–839dp); transitions to expanded.
  - **Navigation drawer** = expanded (≥840dp); **deprecated in M3 Expressive** for phones — the
    drawer is being replaced by the adaptive rail/expanded pattern. A bottom-drawer "More" is no
    longer recommended.
  - Primary lesson: **one nav model does not scale** — pick by window-size class, never ship
    bottom-nav-only.
- **Navigation decisions table (M3, verbatim):** 2 destinations → tabs; 3–5 → bottom nav
  (compact) / rail (medium) / drawer (expanded); 6+ → drawer; hierarchical → drawer with sections.
- **Expressive components**: toolbars (floating action groups, may pair with FAB), split
  buttons, button groups (shape-shifting bump), progress indicators with waveform.
- **Search**: collapsed `SearchBar` → expanded "search view"; M3 web parity is limited (custom
  token-backed bar still needed for Flutter web).

### 1.2 iOS 26 Liquid Glass + WWDC25/26 (Apple) — SwiftUI target* (deferred, S2 parked)
- **Liquid Glass** = the new system material for navigation layer only: tab bars, sidebars,
  toolbars float above content, adapt light/dark, minimize-on-scroll (`tabBarMinimizeBehavior`),
  dedicated **Search tab** at trailing end, action sheets spring from their button, dialogs morph
  from the button. Reserve glass for the navigation layer; never stack glass-on-glass; reduce
  custom backgrounds.
- **Search (WWDC26, the pattern to copy):** (1) **Toolbar/actuator search** — field at bottom of
  iPhone screen (reachability), animates over keyboard; iPad/Mac top-trailing. (2) **Dedicated
  search page/tab** — replaces the tab bar with field + content; `searchable` on TabView.
  Recommendations: show recent searches inline on focus; let users clear them; show predictive
  suggestions; scope bars for light filtering (tokens for advanced); graceful empty/no-results view.
- **Tab bar**: preserve per-tab nav state; avoid overflow → "More" tab is an anti-pattern; labels
  always visible; prefer monochrome when content is colorful; search tab at trailing end.

> `*` The SwiftUI target is **PARKED/DEFERRED** per owner directive (`ca0eb39`) — these points are
> captured now so S6 (l10n/RTL) and the later SwiftUI slices can emit with Liquid-Glass-native
> thinking, but **no SwiftUI work proceeds this round.**

### 1.3 Cross-platform takeaways for the generator
1. **Navigation shell is the #1 missing pattern** (compact AND adaptive variants).
2. **Search is the #2 pattern** — a searchable list (filter-as-you-type) is achievable with the
   existing repo `list` + a text filter bar, no new deps.
3. **On-scroll behavior is the #3 pattern** (app-bar color-fill on scroll; nav-bar/rail
   hide-on-scroll) — cheap on Flutter (`scrollBehavior`, `AnimatedContainer`).
4. Everything must remain **deterministic** (`(IR, ctx) → string`, charted in
   `COMPOSITION_ENGINE.md`).

## 2. Pattern catalog — ranked options for codegen (impact × effort)

Legend: S/M/L effort · Low/Med/High impact. All options are deterministic-friendly and
dependency-free (Flutter SDK material/`go_router`/`flutter_bloc` only). Cite the sibling DESIGN_OPTS
slices where this overlaps.

### P1 — Global navigation shell for multi-feature apps (HIGH impact, M effort)
- **What:** when `ir.features.length > 1` (MF1 exists — ledgerly is the proof), emit a shell
  screen with a Material `NavigationBar` (3–5 destinations) that switches top-level features;
  `NavigationRail` on wide (≥840dp via `LayoutBuilder`) is a stretch, drawer is M3-Expressive
  deprecated so **skip drawer** in V1.
- **How (deterministic):** `composition.ts` gains an `appShell` archetype; `routing.ts` emits a
  `StatefulShellRoute.indexedStack`/`ShellRoute` wrapping feature roots, destinations derived from
  the `features[]` order + each feature's primary list entity title. Icons from a static stem
  map (add → note/list, person → auth, wallet → budget…), one icon per destination, no free-form
  icon input.
- **Why now:** ledgerly (the flagship multi-feature sample, `apps/ledgerly`) currently has NO way
  to switch features in-app — unreachable screens, and the CDP acceptance note LM6/LM7 gaps
  trace directly to "no entry point" issues. A shell is the first thing a reviewer/user looks for.
- **Effort: M · Impact: High.** Deferred once in DESIGN_OPTS (O#2 needs ≥2-feature apps) — it is
  now the single biggest gap vs. 2026 platform guidance.

### P2 — Searchable list (SearchBar + filter-as-you-type) (HIGH impact, S–M effort)
- **What:** on any list screen whose repo has `list`, emit an optional search field (only when a
  `title`/`name` field exists to search on): `SearchBar`/custom `TextField` in the AppBar or a
  chip row; filters the in-memory loaded list by substring; clear button; "no results" empty
  state reuses `EmptyState`.
- **How:** `screen.ts` list template gains a guarded block (`titleField ? filterWidget : ''`);
  state already holds the loaded list in the cubit → a public `filter(String)`/derived getter;
  deterministic given the field name.
- **Why:** M3 Expressive + iOS 26 both make search a first-class pattern (search app bar,
  search tab). Zero new deps. Also feeds G2a (date/enum inputs) improvement surface.
- **Effort: S–M · Impact: High.**

### P3 — On-scroll app bar/nav bar behavior (MEDIUM impact, S effort)
- **What:** app bar gets a color-fill on scroll (M3 Expressive pattern — no shadow, tinted
  surface once content scrolls under it); optional hide-on-scroll for the shell `NavigationBar`.
- **How:** `Scaffold` + a `Scrollable` list already exists → attach `scrollBehavior`/listen and
  swap `surfaceTintColor`; deterministic constants only.
- **Effort: S · Impact: Med.**

### P4 — Action model: secondary actions + toolbars (MEDIUM impact, M effort)
- **What:** M3 Expressive toolbars / split buttons are new; for CRUD apps this maps to a
  **bottom action bar / extended FAB** on the form screen (`Save` prominent, `Cancel` secondary)
  and grouping secondary actions (share/export/delete) into a `PopupMenuButton` on detail when
  the entity supports them (audit/export exist → a "…" menu is natural on detail).
- **How:** `screen.ts`/`crud_form.ts` emit the FAB + menu only when the capability predicate
  fires (`hasExport`, repo has delete…). Deterministic.
- **Effort: M · Impact: Med.** (Overlaps DESIGN_OPTS D2 CTA work.)

### P5 — Richer empty/loading/error states (MEDIUM impact, S effort)
- **What:** `EmptyState` gains a composed illustration-less layout (icon, title, subtitle, CTA);
  `ErrorState` gains Retry; `LoadingState` stays a spinner.
- **Effort: S · Impact: Med.** (DESIGN_OPTS D2 already scoped; not duplicated here.)

## 3. What NOT to do in the interface layer (2026 trap-avoidance)

- **No bottom-drawer "More" overflow** — M3 Expressive deprecated drawers as phone nav; cap the
  shell at 5 destinations and force the IR to order them (validation gate: shell emits an error
  if `features > 5`).
- **No separate nav for each window-size** complexity in V1: emit **NavigationBar (compact)**
  first; `NavigationRail` on ≥840dp is a stretch goal, keep it a documented gap, not a promise.
- **No search tab** in V1 (needs app-level search across features — large); P2's per-list search
  covers the 80% case at S-M effort.
- **No Skia/Cupertino/third-party pattern libs** — determinism + offline-first discipline; the
  pattern surface must stay SDK-only.
- **No glass-on-glass emulation on Flutter** — Liquid Glass is an iOS-native material; Flutter
  target maps to M3 Expressive surface roles, not glass imitation.

## 4. Priority roadmap (matches the ROADMAP loop; each slice: typecheck → all-samples validate →

```text
bench → analyze/test touched sample → small commit → goldens → Telegram
```

1. **P1** — Global shell (NavigationBar + rail stretch) for `features.length>1`. Ledgerly becomes
   navigable; closes the LM6/LM7 "no entry point" class of gap. [M]
2. **P2** — Searchable list (SearchBar + filter + no-results). Tasks/work_auth/ledgerly all gain
   it on titled lists. [S–M]
3. **P3** — On-scroll app bar + nav bar behavior. [S]
4. **P4** — Action model (extended FAB, detail "…" menu for export/audit). [M]
5. **P5** — Composed empty/error/loading states (overlaps DESIGN_OPTS D2; sequence after it). [S]
6. **Defer:** NavigationRail adaptive, search tab across features, drawers, split buttons,
   glass-emulation, P1 rail on wide screens. Record under LEFTOVER_NOTES.md.

## Acceptance gate per pattern

- [ ] `npm run typecheck:builder` clean; generate+validate on ALL existing samples (tasks,
  work_auth, hr_service, ledgerly, + builder/samples/*).
- [ ] Multi-feature ledgerly regenerates with a shell; `flutter analyze && flutter test` green;
  goldens on iPhone 390×844 (real Roboto) refreshed once.
- [ ] CDP (required for UI-affecting slices): drive ledgerly → switch features via bottom nav →
  search a titled list → no overflow at 320/390/768/1280 → screenshots + findings under
  `apps/ledgerly/output/qa/`.
- [ ] One-line progress + goldens to Telegram per slice (AGENTS rule 9).