# S2 contract — ratification + disposition of second review

**Date:** 2026-08-18. **Source:** owner-provided ChatGPT review of `S2_CONTRACT_DECISIONS.md`.
**Disposition:** the review **ratifies A1 and B1** (both already shipped in the S2 implementation,
commits `d69c5d4`→`b561269`) and requires a **contract-tightening amendment pass** — some of its
structural-validation asks are already satisfied by shipped code, several are real gaps now being
closed. This doc is the ownership decision record.

## Ratified (confirms what shipped)

| Review call | Shipped status | Where |
|---|---|---|
| **A1 drop `emphasis`** | ✅ `emphasis` was NEVER admitted to the IR (S1 D2/D3 deferred it as a field; schema `additionalProperties:false` on screen/section objects rejects any incoming `emphasis`. The review's "existing IR may contain emphasis → migration policy" concern is **moot** — there is no v1 `emphasis` anywhere, so the migration policy is: *reject by construction, nothing to migrate*.) | `screen.schema.json:104-152,191`; `[sections]` gate |
| **B1 `sections` archetype** | ✅ boundary shipped as `"sections"` (screen.type), `patterns.sections`, `Screen<X>` naming, keemart sample. `home`/`dashboard` are NOT archetypes (rejected: product-role/analytics connotations). | keemart IR `type:"sections"` |
| Closed v1 enum (10 types) | ✅ | `validate.ts:1116` |
| No coordinates/columns/pixels | ✅ (schema `additionalProperties:false` + gate `ALLOWED_KEYS`) | `validate.ts:1120` |
| `sections` only on `type:"sections"`; sections-screen with none = error; children only on `section`, depth-1 | ✅ | `validate.ts:1105-1127` |
| Deterministic order = IR order | ✅ (order IS hierarchy) | `types.ts`/gate |
| Token-only extents | ✅ (gridExtent/cardWidth AppTokens; marker + `[literals]` scans) | `validate.ts:1209-1215` |
| No `if (style===...)` in emitted components | ✅ (FIX-6 `[visualIntent]` enum-branch scan) | `validate.ts:890-1002` |

## Real gaps the review found (adopt + fix in S2.1 hardening)

The review's "hero cardinality / heroScale semantics / section identity" asks map to checks that do
**not** exist in shipped code. Adopted with the review's recommended semantics:

1. **Hero cardinality 0..1** — per screen, at most ONE `hero` (or `promoBanner`) section may be
   declared; zero is fine (a sections screen need not have a hero). The focal section is optional.
   **Add:** `[sections]` count check (≤1 of the hero family per screen).
2. **Duplicate section IDs** — section `id`s must be unique within a screen. The renderer will use
   `sec.id` as a Flutter `ValueKey` per section (keyed rendering + test selectors + future
   deep-link anchors).
   **Add:** `[sections]` duplicate-id check + `ValueKey(sec.id)` in the renderer.
3. **Hero position** — order (not priority) determines prominence; `heroScale` modulates the hero
   block's typography/gaps (screen-level, from `visualStyle.hierarchy` — NOT a per-section field).
   Documented (no code change; already true by construction). Include a note in the semantic
   contract text.
4. **Sections-screen state model** — the review asks where loading/error/empty live. Decision:
   **screen-level** (the sections screen keeps its declared `state`; `statePlacementFor` loading/
   error `checks` guard the whole screen — same as list), **plus** per-section component-level
   empty affordances stay the responsibility of the deciding selector (a `productGrid` with no
   items renders an inline `EmptyState`, not a screen-level one). The keemart Home currently
   declares `states:None` — hardening adds a sections proof with a real state + declared
   loading/error and an inline productGrid empty-state, validated by the squeeze + a11y + CDP
   gates.
   **Add:** `[sections]` gate extension: a `type:"sections"` screen with a declared `state` must
   have loading/error states declared; renderer emits `checks` for sections (mirror list branch);
   `productGrid` gains empty-list handling.
5. **Accessibility / heading semantics** — `AppHeroBanner` headline must keep a real heading level
   (a11y reading order independent of `heroScale`). The a11y test generator already asserts
   non-empty accessible names per interactive element for EVERY screen, a sections background
   included. **Add:** `AppHeroBanner` headline renders an `AccessibleText`-style heading semantics
   (the generated a11y test covers it). No new IR.
6. **Naming propagation matrix** — canonical `sections` vocabulary across every artifact, documented
   in this section:

   | Artifact | Name |
   |---|---|
   | IR `screen.type` | `"sections"` |
   | IR field | `screen.sections: SectionModel[]` |
   | type | `SectionType` (closed enum); `SectionModel {id, type, title?, children?}` |
   | selector | `sectionsFor` / `sectionsTargets` (composition.ts) |
   | plan.json | `patterns.sections` |
   | renderer | `comp.layout === "sections"` branch (screen.ts) |
   | organisms | `AppHeroBanner`, `AppProductCard`, optional `AppSectionHeader` |
   | tokens | `AppTokens.gridExtent/cardWidth/cardHeight` |
   | route | `/<kebab(entity)>` via existing `screenPath` (no change) |
   | goldens | `*_home.png` at 390×844; template marker `_sections` |
   | gate | `[sections]` (validate.ts) |

## Contract amendments to record (decision log)

- v2 §2.3 `emphasis` → **DROPPED** (ratified A1). Hierarchy = ordered sections + optional single
  `hero` section + screen-level `heroScale`. No `targetId` anywhere. Migration: none required —
  `emphasis` never shipped; schema rejects it by construction. Future per-element prominence is a
  NEW field, to be spiked on its own ownership model (review's `card.presentation.prominence` note),
  NOT a resurrection of `screen.emphasis`.
- Archetype label `"sections"` (ratified B1) with the review's narrow definition:
  > `screen.type: "sections"` renders an ordered, vertically composed collection of independently
  > declared section blocks (`header|search|hero|promoBanner|productGrid|horizontalCards|
  > sectionHeader|section|divider|floatingCart`). It is NOT merely "a screen that contains grouped
  > content." `home`/`market`/`dashboard` are product roles or personalities, never screen types.

## Implementation gate (review's ask)

S2.1 hardening ships as ONE coherent change: schema/gate/type/renderer/keemart updates in a single
pass, then the squeezed/a11y/CDP gates re-run. See `S2_HARDENING_BRIEF_CLAUDE.md`.

## Open (owner) — anything else from the review you want tightened?
The remaining review items (heroScale 0/1/2 value semantics, hero-must-be-first vs order) are
already decided-by-construction and documented here; say the word if you want them re-opened.