/**
 * Composition layer (extendable by design — OCP).
 * Maps a screen archetype → a deterministic composition spec: layout, hero, rhythm (spacing),
 * and surface treatment. Adding a new archetype = one entry here (data), no dispatch rewrite.
 * The screen generator consults this registry; unknown archetypes fall back to `list`.
 */
import { FeatureModel, ScreenModel, EntityModel, RepositoryModel } from "./types";
import { entityPluralTitle } from "./naming";
import { screenPath } from "./routing";
import { findRepoForEntity, crudFormTargets, isAudited, resolveExport } from "./operations";

export interface CompositionSpec {
  archetype: string;
  layout: "list" | "detail" | "grid" | "wizard";
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
