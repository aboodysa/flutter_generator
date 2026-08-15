/**
 * Composition layer (extendable by design — OCP).
 * Maps a screen archetype → a deterministic composition spec: layout, hero, rhythm (spacing),
 * and surface treatment. Adding a new archetype = one entry here (data), no dispatch rewrite.
 * The screen generator consults this registry; unknown archetypes fall back to `list`.
 */

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
