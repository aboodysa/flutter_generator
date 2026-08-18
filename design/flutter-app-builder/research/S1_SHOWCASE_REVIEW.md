# S1 same-screen showcase review — token-system rigor gaps

**Reviewer:** ChatGPT review of the showcase contact sheet (owner-provided, 2026-08-18).
**Verdict:** the showcase communicates the three personalities, but does **not yet prove a
rigorous token-only system** — some differences are invisible, some apply to only one component,
and the mapping tables are under-specified.

## What reads well

| Config | Visual read | What works |
|---|---|---|
| A — friendly / rounded | Soft, approachable baseline | Rounded cards, moderate rhythm, relaxed composition |
| B — professional / sharp / strong | Denser, more utilitarian | Reduced spacing, squarer cards, stronger title weight |
| C — premium / pill | Airier, more elevated | Larger vertical spacing, highly rounded cards |

Same screen, same data, shared controls — clearly a same-screen experiment, not three layouts.

## Main gaps

1. **"One semantic variable" needs clearer framing** — each style changes several primitives
   (spacing, radii, weight, heroScale). Correct framing: *one semantic selector, `visualStyle`,
   resolves a coordinated set of visual tokens*.
2. **B is not consistently sharp** — cards are sharp but the SearchBar stays pill-shaped and the
   FAB rounded. The most dominant control looks identical across A/B/C. Apply the sharp scale to
   search (`radius.search=8/16`), cards (`8`), FAB (`8` or documented exception), focus rings.
3. **C is not fully pill-shaped** — cards round but don't reach true pill; search already looks
   pill-like in every config, so C lacks a unique signature. `999` only produces a pill at
   fixed/bounded height; define per component: `search:999`, `taskCard:24`, `fab:999`.
4. **`heroScale:2` is not observable** — no element visibly doubles; the "Tasks" heading looks
   similar across A/B/C. Either make B's title the hero, add a hero metric ("3 open tasks"), or
   remove heroScale from this screen. Do not retain a token with no visible, testable effect.
5. **Radius needs semantic ownership** — use component-role tokens
   (`input/listItem/floatingAction/focusOutline`) instead of a generic `cornerRadius` applied
   indiscriminately.
6. **Spacing needs a complete mapping** — `baseSpacing` must affect screen padding, section gaps,
   list gap, card inset, and FAB inset from the same scale, not just the list-row gap.
7. **Typography under-specified** — "strong" needs a measurable weight/contrast effect
   (title 500→650/700), or a professional-sharp style reads as merely cramped.

## Recommended acceptance criteria

1. Component tree + task data identical across A/B/C.
2. Only `visualStyle` differs at the screen boundary.
3. No `if (style === 'premium')` conditionals in components — they consume resolved tokens only.
4. B visibly sharp on search, cards, FAB, focus (or documented exceptions).
5. C reserves `999` for capsule/circular; `24` for variable-height cards.
6. Each `baseSpacing` preset affects all defined layout relationships.
7. `heroScale:2` produces an obvious documented difference, or is removed from the preset.
8. A screenshot-diff test verifies only token-driven styling differs (content/order/copy/affordances
   unchanged).

## Priority fixes

1. Search field + FAB participate in B/C radius rules.
2. Expose B's hero hierarchy visibly, or remove `heroScale:2` from this screen.
3. Complete spacing token matrix (external + internal).
4. Clarify: one semantic selector resolving a coordinated token set.
5. Fix the `professionalff` caption typo.

**Disposition:** all are ADOPTED → implementer brief `S1_TOKEN_RIGOR_BRIEF_CLAUDE.md` (FIX-1…FIX-6).
