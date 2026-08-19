/**
 * Composition layer (extendable by design — OCP).
 * Maps a screen archetype → a deterministic composition spec: layout, hero, rhythm (spacing),
 * and surface treatment. Adding a new archetype = one entry here (data), no dispatch rewrite.
 * The screen generator consults this registry; unknown archetypes fall back to `list`.
 */
import { FeatureModel, ScreenModel, EntityModel, RepositoryModel, StatePlacementSpec, VisualHierarchy, VisualCornerRadius, VisualPersonality, SectionModel, SectionType } from "./types";
import { entityPluralTitle } from "./naming";
import { screenPath } from "./routing";
import { findRepoForEntity, crudFormTargets, isAudited, resolveExport, findWizardScreen } from "./operations";
import { DEFAULT_STATUSES } from "./generators/state";

export interface CompositionSpec {
  archetype: string;
  layout: "list" | "detail" | "grid" | "wizard" | "sections";
  hasHero: boolean;      // whether the archetype renders a hero header
  heroGap: number;       // space below the hero (logical px)
  itemGap: number;       // space between list/grid items (wizard: space around the step footer)
  surface: "plain" | "card"; // items wrapped in a Card vs plain rows
}

const LIST_SPEC: CompositionSpec = { archetype: "list", layout: "list", hasHero: false, heroGap: 24, itemGap: 8, surface: "card" };

export const COMPOSITIONS: Record<string, CompositionSpec> = {
  list:   LIST_SPEC,
  detail: { archetype: "detail", layout: "detail", hasHero: true, heroGap: 24, itemGap: 4, surface: "card" },
  // P8-W1: step header + progress indicator (hasHero) drives the step title block; itemGap
  // spaces the Next/Back footer from the step content.
  wizard: { archetype: "wizard", layout: "wizard", hasHero: true, heroGap: 16, itemGap: 16, surface: "card" },
  // S2 (SPIKE_S2_REPORT.md §14.2): a declarative section-list home. hasHero:false — hierarchy
  // comes from a first-class `hero` SECTION (position + heroScale), not the legacy s.hero/comp.
  // hasHero mechanism list/detail/wizard use; heroGap/itemGap space consecutive sections.
  sections: { archetype: "sections", layout: "sections", hasHero: false, heroGap: 16, itemGap: 16, surface: "card" },
  // Extend here: add an entry (e.g. dashboard/settings) + a layout branch in screen.ts.
};

export function compositionFor(archetype: string): CompositionSpec {
  const spec = COMPOSITIONS[archetype];
  if (!spec) {
    // SOLID review #8: warn (don't throw — generation must stay resilient to a typo'd IR) so an
    // unrecognized archetype (e.g. "detial") doesn't silently render as "list" with no trace.
    // eslint-disable-next-line no-console
    console.warn(`[composition] unknown screen archetype '${archetype}' — falling back to 'list'. Known archetypes: ${Object.keys(COMPOSITIONS).join(", ")}.`);
  }
  return spec ?? LIST_SPEC;
}

/**
 * P1 (INTERFACE_PATTERN_CONTRACT.md §3) — global bottom-navigation shell for multi-feature apps.
 * This is the ONE centralized owner of the shell decision (contract §1 master principle): route.ts
 * and app_shell.ts only ever consume the `ShellPattern` this returns — no hidden heuristics, no
 * re-derivation, in either generator.
 */

// One destination per top-level feature (contract §3.1). `featureId` is deliberately `feature.name`
// — FeatureModel has no separate `id` field, and `name` is already the stable, never-regenerated
// identifier every other cross-reference in this codebase (symbols.ts, di.ts, route.ts) keys on.
export interface ShellDestination {
  featureId: string;
  title: string;   // humanized plural title of the feature's root screen's entity (entityPluralTitle
                    // — the same helper screen.ts's own list AppBar title already uses, so a tab's
                    // label always reads identically to the screen it opens)
  icon: string;     // a `Icons.*` Dart expression from the fixed stem map below (additive, no LLM)
  rootPath: string; // the feature's root route — its first list screen's screenPath()
}

// route.ts needs the underlying feature (to build that branch's own GoRoutes) alongside the
// already-decided destination — bundled here so it never has to re-derive title/icon/order itself,
// only consume `.feature` for route construction (data plumbing, not a pattern decision).
export interface ShellBranch extends ShellDestination {
  feature: FeatureModel;
}

export interface ShellPattern {
  branches: ShellBranch[];
}

// Contract §3.2: V1 target capability ceiling — NOT an IR/schema limit (a 6-feature IR is a valid
// application; this target's shell just can't render 6 top-level destinations yet).
export const MAX_SHELL_DESTINATIONS = 5;

// Fixed feature-id-prefix -> Material icon stem map (contract §3.1: "deterministic icon"). Additive
// only — extend with new prefixes as new sample domains appear; never inferred/guessed per-app.
const SHELL_ICON_STEMS: [string, string][] = [
  ["expense", "Icons.receipt_long"],
  ["approval", "Icons.approval"],
  ["budget", "Icons.account_balance_wallet"],
  ["auth", "Icons.person"],
  ["user", "Icons.person"],
  ["task", "Icons.checklist"],
];
export const SHELL_FALLBACK_ICON = "Icons.widgets";
export const KNOWN_SHELL_ICONS = new Set([...SHELL_ICON_STEMS.map(([, icon]) => icon), SHELL_FALLBACK_ICON]);

function shellIconFor(featureId: string): string {
  const lower = featureId.toLowerCase();
  const hit = SHELL_ICON_STEMS.find(([stem]) => lower.startsWith(stem));
  return hit ? hit[1] : SHELL_FALLBACK_ICON;
}

/**
 * P1 pattern selector (contract §2.2/§3): decides whether a multi-feature app gets a global
 * NavigationBar shell and, if so, its destinations — strictly in `features[]` order (no sorting,
 * no inference). Returns `null` for `features.length <= 1` so a single- (or zero-) feature app's
 * output is unaffected (contract §9.2/§9.3: byte-identical, no screen.ts/route.ts heuristics).
 *
 * `mergedScreens` must be the SAME app-wide screens array RouteGenerator itself builds routes
 * from (i.e. `app.features.flatMap(f => f.screens ?? [])`, in that order) — screenPath()'s
 * collision disambiguation depends on walking the exact same list, so a destination's `rootPath`
 * here is guaranteed to match the path RouteGenerator actually emits for that screen.
 *
 * Throws a plain generation-time error (contract §3.2 — deliberately NOT a validator/schema
 * failure) when the app declares more top-level features than the V1 shell target can render, and
 * when a feature has no screens at all (no root screen -> no destination is derivable).
 */
export function shellFor(features: FeatureModel[], mergedScreens: ScreenModel[]): ShellPattern | null {
  if (features.length <= 1) return null;
  if (features.length > MAX_SHELL_DESTINATIONS) {
    throw new Error(`[shell] V1 shell supports at most ${MAX_SHELL_DESTINATIONS} top-level destinations (got ${features.length})`);
  }
  const branches: ShellBranch[] = features.map((f) => {
    const root = (f.screens ?? []).find((s) => s.type === "list") ?? (f.screens ?? [])[0];
    if (!root) {
      throw new Error(`[shell] feature '${f.name}' declares no screens — cannot derive a shell destination`);
    }
    return {
      featureId: f.name,
      title: entityPluralTitle(root.entity),
      icon: shellIconFor(f.name),
      rootPath: screenPath(mergedScreens, root),
      feature: f,
    };
  });
  return { branches };
}

/**
 * P2 (INTERFACE_PATTERN_CONTRACT.md §4) — per-list search. Same centralized-decision posture as
 * P1's shellFor above: this is the ONE place that decides whether a list screen gets search, and
 * with what field/mode; screen.ts only ever renders the `SearchSpec` it's handed, never re-derives
 * the decision (contract §1 master principle).
 *
 * Scope locked by the brief (grill C4/C5/C6):
 * - Single field, mode "contains" only (in-memory, case-insensitive, no server-query/multi-field/
 *   startsWith/enum/date in this slice — a later slice changes the payload shape, never this
 *   architecture).
 * - `enabled` is a SEMANTIC predicate, never a name-guess: list screen + repo has `list`
 *   (structural — `findRepoForEntity` only ever resolves a repo that HAS a `list` operation, see
 *   its own doc comment, so that leg is never separately re-checked) + the entity declares
 *   `primaryDisplayField` referencing one of its own String-typed fields. No IR `primaryDisplayField`
 *   -> predicate stays false, same as `TITLE_FIELD_NAMES`-style guessing would have wrongly fired
 *   for entities that merely happen to have a same-shaped field under a different name.
 */
export interface SearchSpec {
  enabled: true; // only ever constructed true — a screen with no search simply has no map entry
  field: string; // IR field id (entity.primaryDisplayField, already confirmed String-typed)
  mode: "contains";
}

export function searchFor(screen: ScreenModel, entity: EntityModel | undefined, repo: RepositoryModel | undefined): SearchSpec | null {
  if (screen.type !== "list") return null;
  if (!entity || !repo) return null;
  if (!entity.primaryDisplayField) return null;
  const field = entity.fields.find((f) => f.name === entity.primaryDisplayField);
  // Defensive, not a crash: a mistyped/renamed primaryDisplayField (no matching field, or a
  // non-String one — "contains" only has a well-defined meaning on a String in this slice, grill
  // C5) means the semantic didn't actually resolve, so the predicate stays false — same posture
  // `compositionFor`'s unknown-archetype fallback and `shellFor`'s own resolution checks take.
  if (!field || field.type !== "String") return null;
  return { enabled: true, field: field.name, mode: "contains" };
}

// Runs searchFor across every screen in one IR (single- or already-merged multi-feature — this
// reads only `ir.screens`/`ir.entities`/`ir.repositories`, all flat arrays on FeatureModel, so it
// needs no per-feature grouping the way shellFor does). Keyed by screen NAME (always available to
// screen.ts as `s.name`, no extra lookup); index.ts separately re-keys by screenPath() when it
// serializes the decision into plan.json (contract §4: "keyed by screen path").
export function searchTargets(ir: FeatureModel): Map<string, SearchSpec> {
  const out = new Map<string, SearchSpec>();
  for (const screen of ir.screens ?? []) {
    const entity = ir.entities.find((e) => e.name === screen.entity);
    const repo = findRepoForEntity(ir.repositories, screen.entity);
    const spec = searchFor(screen, entity, repo);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}

/**
 * P3 (INTERFACE_PATTERN_CONTRACT.md §5) — per-screen on-scroll AppBar color-fill. Same
 * centralized-decision posture as P1's shellFor/P2's searchFor: this is the ONE place that decides
 * whether a screen gets the Material-Expressive scroll tint; screen.ts only renders the `ScrollSpec`
 * it's handed, never re-derives the decision (contract §1 master principle).
 *
 * The trigger is a DECLARED contract rule (ChatGPT round-2 edit #2, SPIKE_PLAN §4), not a silent
 * selector default:
 *
 *   > scroll.enabled = screen.kind ∈ { list, detail }
 *
 * — a screen scrolls (and thus tints on scroll) iff it is a list or detail archetype. Versioned
 * here so a future predicate change is a deliberate contract edit, not an invisible drift in this
 * module. Wizards/forms deliberately return `null` — their content is inherently step-sized, and
 * the `[scroll]` gate proves those screens stay template-unchanged.
 *
 * The rule is state-management AGNOSTIC on purpose: unlike P2's search (bloc-only this iteration,
 * a documented gap), the tint is pure presentation and cheap to emit in every widget template —
 * so the riverpod sample gets the same listener, and the gate needs no SM carve-out (no latent
 * [scroll] FAIL waiting for a riverpod list/detail IR, the way [search]'s bloc-only gap sits
 * unexercised until such a sample appears).
 */
export interface ScrollSpec {
  enabled: true; // only ever constructed true — a screen without scroll simply has no map entry
}

export function scrollFor(screen: ScreenModel): ScrollSpec | null {
  if (screen.type === "list" || screen.type === "detail") return { enabled: true };
  return null;
}

// Same name-keyed shape as searchTargets (screen.ts looks itself up by `s.name`); index.ts
// re-keys by screenPath() when serializing into plan.json `patterns.scroll` (contract §5).
export function scrollTargets(ir: FeatureModel): Map<string, ScrollSpec> {
  const out = new Map<string, ScrollSpec>();
  for (const screen of ir.screens ?? []) {
    const spec = scrollFor(screen);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}

/**
 * P4 (INTERFACE_PATTERN_CONTRACT.md §6, SPIKE_PLAN §P4) — capability-driven actions.
 *
 * The S-P4 spike (research/SPIKE_P4_REPORT.md) concluded MODIFY, owner-accepted with a tightened
 * architecture contract (2026-08-17):
 *
 *   - operations.ts  → "can this capability exist?"  (semantic truth — already exists)
 *   - actionsFor()   → "which actions does THIS screen get, and how are they presented?" (THE
 *                      single action-composition decision — the ONLY place screen.ts's actions
 *                      come from; never a second operations.ts)
 *   - screen.ts      → "how do I render the decided payload?" (consumes ActionSpec[].presentation;
 *                      NEVER computes grouping, never re-derives from crudTarget/audit/export)
 *   - validate.ts    → "does the generated output agree with the decision?" ([actions] gate)
 *
 * Invariants this slice implements (owner-accepted acceptance criteria):
 *   1. Single decision source — actionsFor() is the only action decision.
 *   2. Existing semantics reused — NO new capability predicates, NO IR/schema additions.
 *   3. No heuristic rendering — renderer consumes ActionSpec.presentation, never counts actions.
 *   4. Delete is always confirmed — Delete → confirm dialog; Cancel = no mutation; Confirm =
 *      existing delete behavior.
 *   5. Audit becomes reachable — only audited entities get the Audit action; navigates to the
 *      existing /audit-log route.
 *   6. Save has NO second visual affordance — existing in-body PrimaryButton remains the renderer;
 *      NO FAB generated. `save` exists as a SEMANTIC kind only ("semantic action ≠ mandatory
 *      visual widget") — it is never emitted as a separate control.
 *   7. Null-set preservation — screens with no applicable capability render byte-identically.
 *   8. Closed vocabulary — ActionKind is exactly { edit, export, delete, audit, save } where the
 *      four SEMANTIC kinds are export/delete/audit/save and `edit` is the pre-existing navigation
 *      affordance (crudFormTargets) carried through the same decided payload (owner's example:
 *      actionsFor(detail) → [edit:inline, delete:overflow, audit:overflow]).
 *   9. Plan is derived, not authoritative — [actions] validates plan.json against actionsFor().
 *  10. Negative controls — stale plan entry, removed expected action, unexpected action,
 *      Delete-without-confirm, and Save-FAB all FAIL the gate.
 */
export type ActionKind = "edit" | "export" | "delete" | "audit" | "save";
export type ActionPresentation = "inline" | "overflow" | "primary";

export interface ActionSpec {
  kind: ActionKind;
  label: string;                 // tooltip / menu text stem (locale-aware via screen.ts's str())
  icon: string;                  // a `Icons.*` Dart expression from the fixed stem map below
  confirm?: boolean;             // true → screen.ts wraps the action in a confirm dialog (Delete only)
  presentation: ActionPresentation; // decided here, consumed verbatim by screen.ts (invariant 3)
}

// Fixed action-kind → Material icon stem map (contract §6 + C13 extension of the P1 shell map).
// Additive only; glyph-absence impossible by construction; collision allowed by design.
const ACTION_ICONS: [ActionKind, string][] = [
  ["edit", "Icons.edit"],
  ["export", "Icons.download"],
  ["delete", "Icons.delete"],
  ["audit", "Icons.history"],
  ["save", "Icons.save"],
];
const ACTION_ICON: Record<ActionKind, string> = Object.fromEntries(ACTION_ICONS) as Record<ActionKind, string>;
export const KNOWN_ACTION_ICONS = new Set(ACTION_ICONS.map(([, icon]) => icon));

// P4 selector (contract §6): the ONE place that decides a screen's action list and each action's
// presentation. Reads ONLY the existing closed operations.ts predicates (invariant 2) — never
// re-implements resolveExport/audit/CRUD (owner: "operations.ts owns capability semantics;
// actionsFor() owns action composition"). Null-set: a screen with no applicable capability gets
// an empty list (byte-identical output, invariant 7).
//
// Overflow grouping (invariant 3): the ">2 → overflow" decision is made HERE, as a declared
// `presentation` on each ActionSpec — screen.ts never counts. Match the owner's accepted example:
// a 3-action detail ([edit, delete, audit]) becomes [edit:inline, delete:overflow, audit:overflow].
export function actionsFor(screen: ScreenModel, entity: EntityModel | undefined, repo: RepositoryModel | undefined, ir: FeatureModel): ActionSpec[] {
  const out: ActionSpec[] = [];
  if (screen.type === "detail") {
    const crud = entity ? crudFormTargets(ir).get(entity.name) : undefined;
    // edit = the pre-existing navigation affordance (crudFormTargets create+update), carried
    // through the same decided payload so screen.ts never re-derives it from crudTarget.
    if (crud) {
      out.push({ kind: "edit", label: "edit", icon: ACTION_ICON.edit, presentation: "inline" });
      if (crud.delete) out.push({ kind: "delete", label: "delete", icon: ACTION_ICON.delete, confirm: true, presentation: "inline" });
    }
    // audit (invariant 5): only audited entities get the Audit action; navigates to /audit-log.
    if (entity && isAudited(ir, entity.name)) out.push({ kind: "audit", label: "audit", icon: ACTION_ICON.audit, presentation: "overflow" });
  } else if (screen.type === "list") {
    // export: resolves against a real `exported: bool` field (operations.ts's resolveExport) —
    // the SAME predicate the [export] gate and the export button already use.
    if (resolveExport(ir, screen)) out.push({ kind: "export", label: "export", icon: ACTION_ICON.export, presentation: "inline" });
  }
  // Overflow decision (invariant 3): detail screens with >2 actions push the non-edit actions into
  // the overflow menu (edit stays inline as the primary affordance). Decided HERE, as
  // presentation, never counted in screen.ts. For ≤2 actions everything stays inline.
  if (out.length > 2) {
    return out.map((a) => (a.kind === "edit" ? a : { ...a, presentation: "overflow" }));
  }
  return out;
}

// Runs actionsFor across every screen in one IR (single- or already-merged multi-feature — reads
// only flat ir.screens/entities/repositories, same posture as searchTargets/scrollTargets).
// Keyed by screen NAME (screen.ts's lookup); index.ts re-keys by screenPath() for plan.json.
export function actionsTargets(ir: FeatureModel): Map<string, ActionSpec[]> {
  const out = new Map<string, ActionSpec[]>();
  for (const screen of ir.screens ?? []) {
    const entity = ir.entities.find((e) => e.name === screen.entity);
    const repo = findRepoForEntity(ir.repositories, screen.entity);
    const actions = actionsFor(screen, entity, repo, ir);
    if (actions.length) out.set(screen.name, actions);
  }
  return out;
}

/**
 * P5/D2 Slice 2 (SPIKE_P5_D2_REPORT.md §13 Decision, §14.1/§14.2) — state-model-conditional
 * Loading/Error/Empty placement. Same single-owner posture as P4's actionsFor: this is the ONE
 * place that decides which triad members a screen's own state model actually declares;
 * screen.ts's `checks` block only ever renders the decided `StatePlacementSpec`, never re-derives
 * it from `state.status` (contract §1 master principle).
 *
 * Contract (§14.1):
 *   loading   = the state model's flow-status field's enum declares "loading"
 *   error     = flow-status enum declares "failure" AND the state declares errorMessage
 *   empty     = the state has a backing collection (list archetype) — Slice 3 renders the widget
 *   emptyCta  = empty AND crudFormTargets(ir).get(entity) has create — Slice 3 renders the CTA
 *   retry     = error AND the state's Cubit/Notifier has load() — Slice 3 renders the button
 *   refresh   = empty AND the state's Cubit/Notifier has load() — Slice 3 wraps RefreshIndicator
 *   null      = none of loading/error/empty apply (today: the wizard archetype — its flow-status
 *               field is `wizardStatus`, namespaced by state.ts's B1 fix so it never collides with
 *               an entity's own `status` field, and its transitions are step progress, not a load
 *               phase — findWizardScreen is the SAME classifier state.ts itself uses to decide
 *               whether a state is wizard-shaped, so this never drifts from what state.ts emits)
 *
 * `load()` is unconditionally emitted on every non-wizard Cubit/Notifier (generators/state.ts,
 * demo-data fallback when no repository backs the entity) — so retry/refresh trace directly to
 * error/empty rather than a second capability check that could only ever read `true`.
 */
export function statePlacementFor(screen: ScreenModel, ir: FeatureModel): StatePlacementSpec | null {
  if (findWizardScreen(ir, screen.state)) return null;
  const stateModel = (ir.states ?? []).find((st) => st.name === screen.state);
  if (!stateModel) return null;
  const statuses = stateModel.statuses ?? DEFAULT_STATUSES;
  const loading = statuses.includes("loading");
  const error = statuses.includes("failure"); // errorMessage is a builtin field on every non-wizard state (state.ts)
  const empty = screen.type === "list";
  if (!loading && !error && !empty) return null;
  const emptyCta = empty && !!crudFormTargets(ir).get(screen.entity)?.create;
  return { flowField: "status", loading, error, empty, emptyCta, retry: error, refresh: empty };
}

// Runs statePlacementFor across every screen in one IR (single- or already-merged multi-feature).
// Keyed by screen NAME (screen.ts's lookup); index.ts re-keys by screenPath() for plan.json.
export function statePlacementTargets(ir: FeatureModel): Map<string, StatePlacementSpec> {
  const out = new Map<string, StatePlacementSpec>();
  for (const screen of ir.screens ?? []) {
    const spec = statePlacementFor(screen, ir);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}

/**
 * S1 (SPIKE_S1_REPORT.md §13/§14, D1/D2/D4) — visual-intent scoring selector. Same single-owner
 * posture as P4's actionsFor/P5's statePlacementFor: this is the ONE place `ScreenModel.visualStyle`
 * is translated into a deterministic `VisualSpec`; screen.ts only ever applies the decided deltas
 * verbatim, never re-derives them from the enum values. The one rule that cannot break (S1 brief):
 * visualStyle NEVER selects a widget/asset directly — it only biases this composition-layer spec
 * (radius token set, hero weight, spacing/surface bias), which screen.ts was already consuming
 * (comp.heroGap/itemGap/surface) before this slice.
 *
 * `imagery` (S3) and `emphasis` (S2) are deliberately absent from both the enum set (types.ts) and
 * this mapping (D2/D3) — not silently ignored, but never admitted as a v1 field in the first place.
 */
export interface VisualSpec {
  // FIX-1 (S1_TOKEN_RIGOR_BRIEF_CLAUDE.md): component-role radius tokens, not one generic value
  // applied indiscriminately — search/fab are their OWN role (never reuse `control`) so a search
  // field and a FAB can carry a different corner treatment than a list row, matching the review's
  // "radius needs semantic ownership" finding. AppRadius.* token names, never numbers.
  radiusScale: { control: string; surface: string; container: string; search: string; fab: string };
  // FIX-3: every layout relationship this archetype has, all AppSpacing.* token names (or "" = no
  // override for that ONE relationship, personality unset/that field not part of the row).
  spacing: { screen: string; section: string; itemGap: string; cardInset: string; fabInset: string };
  heroScale: 0 | 1 | 2; // hierarchy: soft=0 (de-emphasized), balanced=1 (default preserve), strong=2
  surfaceBias: "plain" | "card" | "inherit"; // personality; "inherit" = archetype default (no override)
  // FIX-2/FIX-4: hierarchy's measurable typography effect (an AppType.* FontWeight token name, or
  // "" = no override) — lives on hierarchy, not personality: "strong" is both the hero-hierarchy
  // signal AND the typography signal, which is what makes heroScale:2 observable (screen.ts applies
  // it to the one element every archetype always renders — the AppBar title).
  titleWeight: string;
}

// D2 §14.2: cornerRadius.rounded is an explicit alias for today's default scale (AppRadius.control/
// surface/container) — a screen that sets ONLY cornerRadius:"rounded" renders the same radius
// numbers as no visualStyle at all. sharp/soft/pill are the report's declared rows (§14.2).
// FIX-1: search/fab rows added (S1_TOKEN_RIGOR_BRIEF_CLAUDE.md) — roundedSearch/roundedFab are
// NOT byte-identical to the pre-fix Material default (a real, intentional visual change once a
// screen opts into cornerRadius; a screen with none stays untouched via NO_RADIUS_OVERRIDE below).
const RADIUS_SCALE: Record<VisualCornerRadius, VisualSpec["radiusScale"]> = {
  sharp:   { control: "AppRadius.sharpControl",   surface: "AppRadius.sharpSurface",   container: "AppRadius.sharpContainer",   search: "AppRadius.sharpSearch",   fab: "AppRadius.sharpFab" },
  soft:    { control: "AppRadius.softControl",    surface: "AppRadius.softSurface",    container: "AppRadius.softContainer",    search: "AppRadius.softSearch",    fab: "AppRadius.softFab" },
  rounded: { control: "AppRadius.roundedControl", surface: "AppRadius.roundedSurface", container: "AppRadius.roundedContainer", search: "AppRadius.roundedSearch", fab: "AppRadius.roundedFab" },
  pill:    { control: "AppRadius.pillControl",    surface: "AppRadius.pillSurface",    container: "AppRadius.pillContainer",    search: "AppRadius.pillSearch",    fab: "AppRadius.pillFab" },
};
const NO_RADIUS_OVERRIDE: VisualSpec["radiusScale"] = { control: "", surface: "", container: "", search: "", fab: "" };

// hierarchy → heroScale ordinal (like DENSITY, scoring.ts:48-52). balanced=1 is the "default
// preserve" row — a screen with no hierarchy set (but cornerRadius/personality set) gets 1, so
// screen.ts's heroGap override is a no-op unless hierarchy is explicitly declared.
const HERO_SCALE: Record<VisualHierarchy, VisualSpec["heroScale"]> = { soft: 0, balanced: 1, strong: 2 };
const DEFAULT_HERO_SCALE: VisualSpec["heroScale"] = 1;

// FIX-2/FIX-4: heroScale → titleWeight (an AppType.* FontWeight token, or "" for balanced/default
// — the negative control: heroScale=1 must change nothing). Keyed on the ORDINAL (not the raw
// VisualHierarchy string) since heroScale is already the single source both screen.ts's heroGap
// bias and this typography bias read from — one decision, two observable effects.
const TITLE_WEIGHT: Record<VisualSpec["heroScale"], string> = { 0: "AppType.titleWeightSoft", 1: "", 2: "AppType.titleWeightStrong" };

// personality → {spacing, surfaceBias} fixed row (§14.2, §16 open question). All 5 v1 enum
// values ship a declared row here (D2 admits the full personality enum for v1 — only imagery/
// emphasis are deferred fields, not a partial personality set); each row is distinct from the
// null-set default so no admitted value is an unscored no-op (G6.1).
// FIX-3 (S1_TOKEN_RIGOR_BRIEF_CLAUDE.md): `spacing` replaces the old single `baseSpacing` field —
// every layout relationship this personality has an opinion on (screen padding, section gap, item
// gap, card inset, FAB inset) resolves from the SAME scale step, not just the item gap.
const PERSONALITY_ROW: Record<VisualPersonality, { spacing: VisualSpec["spacing"]; surfaceBias: VisualSpec["surfaceBias"] }> = {
  professional: { spacing: { screen: "AppSpacing.sm", section: "AppSpacing.sm", itemGap: "AppSpacing.sm", cardInset: "AppSpacing.sm", fabInset: "AppSpacing.sm" }, surfaceBias: "inherit" },
  friendly:     { spacing: { screen: "AppSpacing.md", section: "AppSpacing.md", itemGap: "AppSpacing.md", cardInset: "AppSpacing.md", fabInset: "AppSpacing.md" }, surfaceBias: "card" },
  premium:      { spacing: { screen: "AppSpacing.lg", section: "AppSpacing.lg", itemGap: "AppSpacing.lg", cardInset: "AppSpacing.lg", fabInset: "AppSpacing.lg" }, surfaceBias: "card" },
  playful:      { spacing: { screen: "AppSpacing.lg", section: "AppSpacing.lg", itemGap: "AppSpacing.lg", cardInset: "AppSpacing.lg", fabInset: "AppSpacing.lg" }, surfaceBias: "plain" },
  minimal:      { spacing: { screen: "AppSpacing.xs", section: "AppSpacing.xs", itemGap: "AppSpacing.xs", cardInset: "AppSpacing.xs", fabInset: "AppSpacing.xs" }, surfaceBias: "plain" },
};
const NO_SPACING_OVERRIDE: VisualSpec["spacing"] = { screen: "", section: "", itemGap: "", cardInset: "", fabInset: "" };
const DEFAULT_PERSONALITY_ROW = { spacing: NO_SPACING_OVERRIDE, surfaceBias: "inherit" as VisualSpec["surfaceBias"] };

// visualFor: closed-enum → fixed table, per screen. `null` (no map entry) means the screen declares
// no visualStyle sub-field at all — screen.ts then renders exactly as it did pre-S1 (byte-identical).
// A screen with at least one sub-field set gets a full VisualSpec; the fields it did NOT set resolve
// to their documented no-op default (NO_RADIUS_OVERRIDE / DEFAULT_HERO_SCALE / DEFAULT_PERSONALITY_ROW)
// rather than being silently omitted, so screen.ts never has to guess which half of the spec is live.
export function visualFor(s: ScreenModel, _ir: FeatureModel): VisualSpec | null {
  const vs = s.visualStyle;
  if (!vs || (!vs.hierarchy && !vs.cornerRadius && !vs.personality)) return null;
  const radiusScale = vs.cornerRadius ? RADIUS_SCALE[vs.cornerRadius.value] : NO_RADIUS_OVERRIDE;
  const heroScale = vs.hierarchy ? HERO_SCALE[vs.hierarchy.value] : DEFAULT_HERO_SCALE;
  const { spacing, surfaceBias } = vs.personality ? PERSONALITY_ROW[vs.personality.value] : DEFAULT_PERSONALITY_ROW;
  return { radiusScale, spacing, heroScale, surfaceBias, titleWeight: TITLE_WEIGHT[heroScale] };
}

// Runs visualFor across every screen in one IR (single- or already-merged multi-feature — same
// posture as statePlacementTargets). Keyed by screen NAME (screen.ts's lookup); index.ts re-keys by
// screenPath() for plan.json `patterns.visual`.
export function visualTargets(ir: FeatureModel): Map<string, VisualSpec> {
  const out = new Map<string, VisualSpec>();
  for (const screen of ir.screens ?? []) {
    const spec = visualFor(screen, ir);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}

/**
 * S2 (SPIKE_S2_REPORT.md §14.2) — section-list selector. Same single-owner posture as every other
 * selector in this family: sectionsFor is the ONE place a screen's declared `sections[]` becomes a
 * decided `SectionSpec`; screen.ts's sections branch applies it verbatim (component selection +
 * token mapping happen HERE, never re-derived in the renderer).
 *
 * Deliberately archetype-agnostic (mirrors visualFor: it reads only `s.sections`, never `s.type`) —
 * whether `sections` is well-formed FOR this screen's archetype (declared on a non-"sections"
 * screen, or a "sections" screen with none) is a `[sections]` gate concern (validate.ts), not a
 * selector concern; a selector that silently normalized a misuse case would erode the same schema
 * teeth D1's rejected alternatives warn against.
 */
export interface SectionSpec {
  sections: SectionModel[];
}

export function sectionsFor(s: ScreenModel, _ir: FeatureModel): SectionSpec | null {
  if (!s.sections || !s.sections.length) return null;
  return { sections: s.sections };
}

// Runs sectionsFor across every screen in one IR (single- or already-merged multi-feature — same
// posture as visualTargets). Keyed by screen NAME (screen.ts's lookup); index.ts re-keys by
// screenPath() for plan.json `patterns.sections`.
export function sectionsTargets(ir: FeatureModel): Map<string, SectionSpec> {
  const out = new Map<string, SectionSpec>();
  for (const screen of ir.screens ?? []) {
    const spec = sectionsFor(screen, ir);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}

/**
 * S3 (SPIKE_S3_REPORT.md §14.1) — the procedural asset-resolution selector. Same single-owner
 * posture as every other member of this family: `assetFor` is the ONE place a screen's decided
 * imagery role resolves to a token-only `AssetSpec`; screen.ts applies the decision verbatim
 * (D1/D5's `:44` never-rule — a tokenRef/icon is always a token/glyph reference, never a path,
 * URL, or raw number).
 *
 * D1 (no `AssetRequest` vocabulary exists yet — VLM_DESIGN_TO_IR_CONTRACT_V2.md's shape is
 * contract prose only) keys this purely off ALREADY-decided `sections[]` semantics — the same
 * input sectionsFor already reads (no new IR field, §14.2 imagery flip is owner-gated and out of
 * this slice). D2 (rung 3 ADOPT): hero/promoBanner resolve to the AppHeroBanner gradient that
 * already ships (components.ts:270); productGrid resolves to `omitted` — AppProductCard has no
 * image param today and D2's "no image (S3 owns the asset ladder)" promise is realized by
 * recording that as a decision, not by adding one. `storeLogo` is the contract's third sample role
 * (VLM_DESIGN_TO_IR_CONTRACT_V2.md:249) but has no v1 section-type trigger — SPIKE_S3_REPORT.md
 * §16 is explicit that wiring a storeLogo/avatar section into the S2 vocabulary is a follow-up,
 * NOT an S3 decision — so the row is declared for closed-table completeness but is unreachable
 * until that follow-up lands; ASSET_MAPPING below deliberately has no entry that resolves to it.
 */
export interface AssetSpec {
  role: string; // "hero" | "productGrid" (closed; "storeLogo" declared, unreachable — see above)
  kind: "icon" | "gradient" | "shape" | "placeholder" | "omitted";
  tokenRef?: string; // an AppColors.*/AppAvatar-style token or component reference — never a path/URL/number
  icon?: string; // an Icons.* glyph reference — never a path/URL/number
}

// Closed, fixed table (RADIUS_SCALE/PERSONALITY_ROW style, `:421-456`): every admitted section
// type resolves to the SAME AssetSpec regardless of which screen/app declares it — there is no
// per-app variability to decide (rung 3 is deterministic-by-construction, SPIKE_S3_REPORT.md
// §2c/D2), so this is a lookup table, not branching logic. hero/promoBanner share one `role`
// (the sections gate already caps hero-family sections at 0..1 per screen, GAP-1) so a screen
// never records two different decisions for the same focal-point slot.
const ASSET_MAPPING: Partial<Record<SectionType, AssetSpec>> = {
  hero: { role: "hero", kind: "gradient", tokenRef: "AppColors.primary" },
  promoBanner: { role: "hero", kind: "gradient", tokenRef: "AppColors.primary" },
  productGrid: { role: "productGrid", kind: "omitted" },
};

// assetFor: closed-enum → fixed table, per screen — mirrors sectionsFor's `null` posture (a
// screen with no sections, or whose sections carry no asset-bearing role, records nothing) and
// actionsTargets' `AssetSpec[]` posture (a screen can carry more than one decided role at once —
// keemart's HomeScreen declares both a `hero` AND a `productGrid` section, so a single-object
// return type would lose one of the two decisions; `gen_context.ts`'s `actions?: Map<string,
// ActionSpec[]>` is the exact multi-valued precedent this mirrors instead). Depth-1 children are
// scanned too (same flattening sectionsCheck's GAP-1/GAP-2 already do) since an asset-bearing
// section may sit inside a `type:"section"` grouping container (keemart's `offersGrid`).
export function assetFor(s: ScreenModel, _ir: FeatureModel): AssetSpec[] | null {
  if (!s.sections || !s.sections.length) return null;
  const flatten = (secs: SectionModel[]): SectionModel[] => secs.flatMap((sec) => [sec, ...(sec.children ?? [])]);
  const seenRoles = new Set<string>();
  const out: AssetSpec[] = [];
  for (const sec of flatten(s.sections)) {
    const spec = ASSET_MAPPING[sec.type];
    if (spec && !seenRoles.has(spec.role)) {
      seenRoles.add(spec.role);
      out.push(spec);
    }
  }
  return out.length ? out : null;
}

// Runs assetFor across every screen in one IR (single- or already-merged multi-feature — same
// posture as sectionsTargets/visualTargets). Keyed by screen NAME (screen.ts's lookup); index.ts
// re-keys by screenPath() for plan.json `patterns.assets`.
export function assetTargets(ir: FeatureModel): Map<string, AssetSpec[]> {
  const out = new Map<string, AssetSpec[]>();
  for (const screen of ir.screens ?? []) {
    const spec = assetFor(screen, ir);
    if (spec) out.set(screen.name, spec);
  }
  return out;
}
