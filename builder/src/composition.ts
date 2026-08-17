/**
 * Composition layer (extendable by design — OCP).
 * Maps a screen archetype → a deterministic composition spec: layout, hero, rhythm (spacing),
 * and surface treatment. Adding a new archetype = one entry here (data), no dispatch rewrite.
 * The screen generator consults this registry; unknown archetypes fall back to `list`.
 */
import { FeatureModel, ScreenModel } from "./types";
import { entityPluralTitle } from "./naming";
import { screenPath } from "./routing";

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
