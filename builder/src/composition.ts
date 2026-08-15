/**
 * Composition layer (extendable by design — OCP).
 * Maps a screen archetype → a deterministic composition spec: layout, hero, rhythm (spacing),
 * and surface treatment. Adding a new archetype = one entry here (data), no dispatch rewrite.
 * The screen generator consults this registry; unknown archetypes fall back to `list`.
 */

export interface CompositionSpec {
  archetype: string;
  layout: "list" | "detail" | "grid";
  hasHero: boolean;      // whether the archetype renders a hero header
  heroGap: number;       // space below the hero (logical px)
  itemGap: number;       // space between list/grid items
  surface: "plain" | "card"; // items wrapped in a Card vs plain rows
}

const LIST_SPEC: CompositionSpec = { archetype: "list", layout: "list", hasHero: false, heroGap: 24, itemGap: 8, surface: "card" };

export const COMPOSITIONS: Record<string, CompositionSpec> = {
  list:   LIST_SPEC,
  detail: { archetype: "detail", layout: "detail", hasHero: true, heroGap: 24, itemGap: 4, surface: "card" },
  // Extend here: add an entry (e.g. dashboard/wizard/settings) + a layout branch in screen.ts.
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
