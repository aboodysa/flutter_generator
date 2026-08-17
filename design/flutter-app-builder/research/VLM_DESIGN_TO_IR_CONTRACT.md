# VLM Design → IR Mapping Contract

**Goal:** teach a Vision-Language (VLM) agent how to look at a visual design (screenshot/figma-export)
and emit schema-valid deterministic **IR** — so a human can later validate and the compiler renders it
byte-identically. The VLM maps *design* to *semantic decisions*; it never draws.

**Status:** contract spec for the visual lane (S1 VisualIntent / S2 section-layout / S3 asset ladder,
see `VISUAL_GENERATION_REVIEW.md`). Fields marked **(proposed)** are additive fragments not yet in
`types.ts` — the rest are the real IR consumed by `composition.ts`/`screen.ts`/`validate.ts`.

---

## 0. The invariant (why this works)

```
Design (screenshot) ──VLM──▶ IR (semantic, schema-validated) ──▶ human approval ──▶
deterministic compiler (tokens + registry + layout) ──▶ Flutter ──▶ validators + goldens
```

The VLM output is **decisions, not rendering**. Anything the VLM is *tempted* to draw is instead
expressed as a **reference** (a token name, a semantic role, a component id, an enum). The compiler
owns every pixel.

### The 5 "never" rules (VLM hard constraints)

1. **Never** emit a raw color (`#F4A261`, `Colors.orange`) → emit a semantic role (`brand.primary`) or propose one `brandSeedColor` for human approval.
2. **Never** emit a pixel/size (`padding: 17`, `radius: 13`, `fontSize: 21`) → emit a token name (`spacing.md`, `radius.card`, `heading`).
3. **Never** emit coordinates (`left: 27, top: 412, width: 351`) → emit ordered sections + relative emphasis; layout is computed.
4. **Never** emit a widget tree (`Column(children:[...])`) → emit a catalog component/section reference.
5. **Never** emit a file/URL for imagery → emit an `AssetRequest {semanticRole, style, aspectRatio, background}`; resolution is the asset ladder's job.

---

## 1. Mapping rules (design → IR)

| Design clue (what you see in the screenshot) | What the VLM emits | Real field / example |
|---|---|---|
| Overall app hue / brand color | `attributes.brandSeedColor` — ONE hex, only if the dominant brand color is NOT the baseline teal `0D9488` | `app.attributes.brandSeedColor: "#0EA5A4"` |
| Color roles (success/warning/danger/info tints) | Semantic roles, not hex | `theme.success: "semantic.success"` |
| Is it dark? | `app.attributes.themeMode` | `"light" \| "dark" \| "system"` (absent = light) |
| Density (tight vs spacious) | `app.attributes.density` | `"compact" \| "comfortable"` |
| Does it reflow on wide screens? | `app.attributes.responsiveness` | `"mobile" \| "responsive"` |
| Language / mirrored layout | `app.attributes.locale` (direction comes from locale) | `"en" \| "ar" \| "both"` |
| **Screen type** (list/detail/wizard/dashboard/market) | `screen.type` (composition archetype id, open set) | `"list"`, `"detail"`, `"wizard"`, `"dashboard"` |
| **Visual intent** of the screen (proposed S1) | `screen.visualStyle` — closed enums only | see §2 |
| Section order & hierarchy (hero/page/search/cards/…) | `screen.sections[]` (proposed S2) — ordered list of catalog section types | see §2 |
| Typography hierarchy (title/body/caption/label) | Token roles | `heading`, `body`, `caption`, `label` |
| Corner treatment (sharp/rounded/pill) | `cornerRadius` enum | `"sharp" \| "soft" \| "rounded" \| "pill"` |
| Iconography | `icon.semantic` role | `cart`, `search`, `support`, `location` … |
| Imagery (product shot / illustration / banner) | `AssetRequest` | see §3 |
| Row status (stages/stepper) vs plain | `screens[].state` + per-status placement (P5/D2) | `statePlacestFor` already introduced |

---

## 2. Proposed additive fragments (S1 + S2)

```yaml
# screen.visualStyle  (S1 — closed enums. MUST feed scoring, NEVER select a widget directly)
screen:
  visualStyle:
    hierarchy: strong        # soft | balanced | strong
    cornerRadius: rounded    # sharp | soft | rounded | pill
    personality: friendly    # professional | friendly | premium | playful | minimal
    emphasis: delivery_status # the element the eye lands on (semantic id)
    imagery: commercial      # none | commercial | illustrative | photographic
```

```yaml
# screen.sections    (S2 — ordered list of catalog section types; order = visual hierarchy)
screen:
  sections:
    - section: header            # back + logo + meta
    - section: search
    - section: heroBanner        # tokenized composition (S5), NOT a single AI image
    - section: horizontalCards   # "Discover more"
    - section: productGrid       # "Weekly offers"
    - section: floatingCart
```

Rule (chatgpt's strengthening, adopted): **`visualStyle` never directly selects a widget or asset.**
`personality: friendly` → the *scoring function* prefers rounded cards + generous spacing from the
registry — not `use FriendlyCard`. The compiler resolves intent → composition strategy → registry.

---

## 3. Asset requests (S3 ladder)

```yaml
assets:
  - id: baked_bread_hero
    type: illustration        # illustration | photo | banner | icon
    semanticRole: grocery_delivery
    style: friendly_3d        # commercial_product | friendly_3d | isometric | flat_illustration | photo
    aspectRatio: 16:9
    background: transparent   # transparent | neutral | brand
```

Resolution ladder (compiler, 0% LLM): existing project asset → declared library → procedural
gradient/shape → (S7, post-v1) AI with human approval + content-hash + manifest + lockfile.
An AI image, once approved, is an **immutable asset** — the compiler does not care who made it.

---

## 4. Worked example A — Keemart-style grocery Home

### INPUT (what you show the VLM)
A home screenshot: brand-green header with store logo + delivery-time meta; a rounded search field;
an auto-playing hero banner strip ("Ready For School" + product image + "Shop Now" CTA); a horizontal
"Discover more" card rail; a 2-column "Weekly offers" product card grid (price + old price + add
button); a floating cart FAB bottom-right. Light theme, generous spacing, rounded corners, friendly.

### RESULTING IR (what the VLM must return)

```jsonc
{
  "schemaVersion": "3",
  "name": "grocery_market",
  "attributes": {
    "refreshCadence": "occasional",
    "density": "comfortable",
    "responsiveness": "responsive",
    "locale": "both",
    "themeMode": "light",
    "brandSeedColor": "#0EA5A4",          // dominant brand hue ≠ baseline teal → ONE hex, human approval
    "stateManagement": "bloc"
  },
  "entities": [
    {
      "id": "Product",                    // one primary display field drives the cards
      "fields": [
        { "name": "id", "type": "String" },
        { "name": "title", "type": "String" },        // human label ("Rye Sourdough")
        { "name": "price", "type": "double", "semanticType": "Money", "currency": "SAR" },
        { "name": "oldPrice", "type": "double", "semanticType": "Money", "currency": "SAR", "nullable": true },
        { "name": "stockStatus", "type": "String", "of": "InStockStatus", "default": "open" },
        { "name": "categoryField", "type": "String", "of": "Category" }   // split/category grouping
      ]
    }
  ],
  "screens": [
    {
      "name": "HomeScreen",
      "entity": "Product",
      "type": "market",                   // archetype for a commercial home (proposed)
      "state": "HomeCubit",
      "visualStyle": {                    // S1 fragment — closed enums, no pixels
        "hierarchy": "strong",
        "cornerRadius": "rounded",
        "personality": "friendly",
        "imagery": "commercial",
        "emphasis": "heroBanner"
      },
      "sections": [                       // S2 fragment — order IS the hierarchy
        { "section": "header" },
        { "section": "search" },
        { "section": "heroBanner" },
        { "section": "horizontalCards" },
        { "section": "productGrid" },
        { "section": "floatingCart" }
      ]
    }
  ],
  "assets": [                             // S3 — semantic requests only
    { "id": "back_to_school", "type": "banner", "semanticRole": "promotion",
      "style": "flat_illustration", "aspectRatio": "16:9", "background": "brand" }
  ]
}
```

### Per-field description (why each line exists)
- `brandSeedColor #0EA5A4` — the ONE acceptable hex: it replaces the system seed so every color
  (button, header tint, card accents) derives from `ColorScheme.fromSeed`. No other color is emitted.
- `density: comfortable` → `spacing.*` map leans to `lg/xl` scales.
- `visualStyle` → scoring selects composition (hero-first order, rounded, generous) — **not** a widget.
- `sections[]` → the renderer maps each to the registry component deterministically, responsive at
  320/390/1400, RTL-aware under `locale: both`.

---

## 5. Worked example B — Order Tracking (state-aware)

### INPUT
Order detail: a map header with a translucent status banner over it; a 3-step "Preparing → Out for
delivery → Delivered" stepper (currently *preparing*, amber accent); delivery address + contact card;
delivery instructions; store summary; order items list; promo banner; a support row.

### RESULTING IR (delta)

```jsonc
{
  "entities": [
    {
      "id": "Order",
      "fields": [
        { "name": "id", "type": "String" },
        { "name": "title", "type": "String" },
        { "name": "status", "type": "String", "of": "OrderStatus", "default": "preparing" }
      ]
    }
  ],
  "stateMachine": { "name": "Order", "states": ["preparing", "picked_up", "out_for_delivery", "delivered", "cancelled", "failed"] },
  "screens": [
    {
      "name": "OrderDetailScreen",
      "entity": "Order",
      "type": "detail",
      "state": "OrderCubit",
      "visualStyle": { "hierarchy": "strong", "cornerRadius": "rounded",
                       "personality": "friendly", "imagery": "illustrative",
                       "emphasis": "order_status" },
      "sections": [
        { "section": "map", "overlay": "orderStatusBanner" },
        { "section": "orderStatus", "state": "preparing" },
        { "section": "deliveryAddress" },
        { "section": "customerContact" },
        { "section": "deliveryInstruction" },
        { "section": "storeSummary" },
        { "section": "orderItems" },
        { "section": "promotionBanner" },
        { "section": "support" }
      ],
      "statePlacement": {               // from P5/D2 StatePlacementSpec (types.ts) — field-derivative
        "key": "status",                // status vs wizardStatus → conditional placement, no orphan branches
        "loading": true, "failure": true, "empty": false
      }
    }
  ]
}
```

The stepper's *amber "preparing" accent* is **not** a color choice — it maps to
`semantic.warning`, driven by the `status` enum member (`state: "preparing"` inside the `orderStatus`
section). Every status member gets its visual accent deterministically; the UI is never a static image.

---

## 6. Schema grounding (real vs proposed)

| IR field | Status | Where |
|---|---|---|
| `app.attributes.{density, responsiveness, themeMode, brandSeedColor, locale}` | **real** | `builder/src/types.ts:157` (`AppAttributes`) |
| `screen.{name, entity, type, state, hero, steps, export}` | **real** | `types.ts:265` (`ScreenModel`) |
| `statePlacement` | **real (P5/D2)** | `statePlacementFor` (composition.ts) + `screen.ts:671` |
| `screen.visualStyle` | proposed S1 | `VISUAL_GENERATION_REVIEW.md` S1 |
| `screen.sections[]` | proposed S2 | S2 |
| `assets[]` + Asset Manifest | proposed S3/S4 | S3 + S4 |
| `heroBanner` composition | proposed S5 | S5 |

---

## 7. VLM output acceptance checks

1. JSON schema-validates (closed enums; the only hex allowed is one optional `brandSeedColor`).
2. Zero raw literals: no hex (except seed), no px, no fontSize/weight numbers, no coordinates.
3. Every `semanticRole`/`semantic` icon id resolves to the role vocabulary.
4. Every `section`/`component` id resolves to the catalog; `visualStyle` enums are all closed.
5. Every referenced field exists on a real entity; `status`-driven placements use real enum members.
6. Output is `origin=llm-inferred, requiresApproval=true` until a human attests (`builder/src/approve.ts`).
7. Regeneration is byte-identical (determinism regression) — the IR, not the screenshot, is the source of truth.