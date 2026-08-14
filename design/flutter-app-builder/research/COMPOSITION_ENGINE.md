# Composition Engine — design discussion (pre-implementation)

> Grilled 2026-08-15. Two ChatGPT references prompted this (see `chatgpt_design_intelligence.md`
> and `chatgpt_composition.md`). Decisions below are locked; implementation not started.

## The proposal (distilled)
The generator renders correct UI but not *intentional* UI. Add a layer that teaches it
composition: **screen archetypes** (task-first/decision/marketplace/wizard/dashboard/timeline/
review/confirmation/settings/profile), a **hero system** ("what the eye lands on first"),
a **visual weight budget** (hero 100 > card 60 > section 35 > metadata 20 > divider 10),
a **surface system** (background/section/card/interactive/CTA levels), **rhythm templates**
(hero gap 40 > section 28 > card 20 > item 12 > inline 8), and a **brand layer** (recurring
signatures). Optionally a full "Design Genome" (composition/hierarchy/brand/aesthetic).

## Grilling findings
- **Right:** "wireframe + tokens" diagnosis is accurate; archetype → layout rule is a legitimate
  deterministic generator concern.
- **Wrong/risky:** "delight/premium" cannot be computed — violates DESIGN §14.6 (deterministic
  checks, never "is the UX good? → YES") and §9.4 (oracle ≠ LLM judge). "Refuse screens without
  a hero" needs a judgment oracle. Aesthetic/Brand Genome is Phase 4 (subjective, needs human review).

## Locked decisions
1. **Archetype source:** declared wins + infer fallback — `ScreenModel.type` gains a closed
   archetype set; explicit value wins, otherwise inferred deterministically (needs confidence/oracle).
2. **Composition oracle:** declared **hero** field + **deterministic** checks (hero prominence,
   spacing rhythm, contrast, hierarchy order) — never an LLM judge.
3. **Scope now:** archetypes + hero + rhythm only. Defer brand signatures + Aesthetic/Brand Genome to Phase 4.

## Open questions for claude to stress-test
- Closed archetype set (which, and how each maps to a deterministic layout)?
- How inference fallback stays deterministic + oracle-able (not a vibes guess)?
- Hero representation in IR (field ref vs explicit widget)?
- Rhythm/surface as token scales — reuse the existing theme tokens or a new scale?
- How the composition validator is a deterministic check (not an aesthetic judge), and how it
  fits the existing `validate.ts` gates + golden workflow?
- Interaction with the app-matrix (`app_matrix.json`): archetype defaults per app category.
