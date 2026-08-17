# Interface-pattern contract (S0) — deterministic pattern selection

> Status: **S0 — contract** (owner-reviewed 2026-08-16; corrections folded in). Research context:
> `MOBILE_UI_PATTERNS.md` (read-only spike — 2026 M3 Expressive + iOS 26 Liquid Glass landscape,
> ground-truth inspection). Replace the spike as the implementation-ready requirement.
> Effort boxes S/M/L · impact Low/Med/High · all deterministic, SDK-only (no third-party UI libs).

## 1. Master principle (architectural guardrail)

**Patterns are selected deterministically from IR semantics + composition context. They must
never become hidden UI heuristics inside individual screen generators.**

```text
IR
 │
 ├── features
 ├── screens
 ├── capabilities
 ├── relationships
 └── composition metadata
          │
          ▼
   Pattern Selection        ← ONE centralized module (deterministic, IR-derived)
          │
     ┌────┼────┬────┬────┐
     ▼    ▼    ▼    ▼    ▼
    P1   P2   P3   P4   P5(→D2)
     │    │    │    │    │
     └────┴────┴────┴────┘
              │
              ▼
       deterministic emit
```

Consequences:
- `builder/src/generators/screen.ts` (and every generator) receives a **decided pattern
  payload**, never re-derives presentation decisions from the IR itself.
- The composition layer (`builder/src/composition.ts`) is the owner of pattern selection; the
  pattern decisions are data — a `patterns` block on the generation plan (`plan.json`) — not
  scattering `if (…)` in screen/state/routing generators.
- Acceptance invariant for EVERY slice:
  `same IR + same ctx + same generator version → byte-identical output`.

## 2. Locked decisions (owner review, verbatim intent)

| Pattern | Decision | Priority |
|---|---|---|
| **P1 Global shell** | Implement FIRST. NavigationBar (3–5 destinations) for multi-feature apps; rail/drawer NOT in V1 (M3 Expressive: drawer deprecated). | 1 |
| **P2 Per-list search** | Implement SECOND. Explicit `search:` block in the composition plan (see §4), not a screen.ts convenience. | 2 |
| **P3 Scroll behavior** | THIRD — keep cosmetic. Presentation-only; must not alter business state or the IR. | 3 |
| **P4 Capability-driven actions** | After P1/P2. Actions are derived from IR capabilities (`export`, `delete`, `audit`, `write`), never "always show …". | 4 |
| **P5 Empty/error/loading** | MERGE into existing `DESIGN_OPTS.md` D2. This contract defines the **structural placement** of those states (where they live in a screen), not a competing implementation. No duplicate effort. | 5 → D2 |

## 3. P1 — Global shell (destination contract)

### 3.1 Destination contract (deterministic)

Each shell destination is derived from one top-level feature:

```text
Feature
  ├── stable feature id      (ir.features[i].id — stable, never regenerated)
  ├── display title          (feature's primary list entity `title`/`name`/`label` field, humanized)
  ├── primary/root screen    (the feature's first list screen — ddScreen/root route)
  └── deterministic icon     (fixed stem map: feature-id-prefix → Material icon; additive)
```

- **`features[]` order ⇒ shell destination order.** No alphabetical sorting, no inferred
  ordering, no LLM selection. IR order is authoritative.
- **Navigation stack/state per destination.** Use `StatefulShellRoute.indexedStack` so each
  destination retains its own stack/scroll/search state across switches.

### 3.2 Destination-count rule (correction: target capability, not IR error)

- `features.length <= 5` → `NavigationBar` (bottom, compact).
- `features.length > 5` → **deterministic validation/planning error** at generation time:
  `"V1 shell supports at most 5 top-level destinations"`.
  This is a **target capability limitation**, NOT an IR validation error — a 6-feature app is a
  valid application; V1's shell target just cannot render 6 top-level destinations.

**Principle:** the IR describes the application; the target declares what it can render.
→ Therefore the >5 check lives in the pattern-selection/planning module (`composition.ts` +
`plan.ts`), and is reported as a generation error with an explicit "V1 shell capability" message,
not as an `[ir]`/schema failure. It never forbids the IR from existing.

### 3.3 Verification (P1 slice)

- Typecheck + validate ALL samples; ledgerly regenerates with a working 4-destination bar
  (auth/expenses/approvals/budgets — IR order), stacks preserved.
- `flutter analyze && flutter test` green; goldens refreshed (390×844, real text).
- CDP (required): drive ledgerly → switch features via bottom nav → per-destination state
  preserved → no overflow at 320/390/768/1280 → findings under `apps/ledgerly/output/qa/`.

## 4. P2 — Per-list search (explicit composition plan)

Search is **opt-in via the composition plan**, not an independent screen decision:

```json
{
  "search": {
    "enabled": true,            // deterministic predicate (see below)
    "field": "title",           // IR field id — the single search field
    "mode": "contains"          // contains | (future) startsWith | enum | date | multi-field | server-query
  }
}
```

- `enabled` predicate (deterministic): the screen is a list screen whose repo has `list` AND the
  entity has a `title`/`name`/`label` field (one primary display field).
- The pattern selector (composition module) emits the `search:` block; `screen.ts` renders
  SearchBar + filter-as-you-type + no-results `EmptyState` **from the payload only**.
- Future modes change the payload, never the screen generator architecture.

## 5. P3 — Scroll behavior (cosmetic, presentation-only)

- M3 Expressive on-scroll app-bar color-fill + optional shell nav-bar hide-on-scroll.
- **IR state ≠ scroll/UI state.** The generator must never add scroll behavior into the IR to
  support Material Expressive; scroll is a pure presentation concern of the screen template.
- Keep cosmetic: no business logic, no persisted state, no test that asserts state mutation.

## 6. P4 — Capability-driven actions (explicit action map)

Actions are derived from IR capabilities — the UI is explainable from the IR:

```text
export capability (hasExport)      → Export action   (detail "…" menu)
delete operation (repo hasDelete)  → Delete action   (detail menu / confirm dialog)
audit capability (hasAudit)        → Audit action    (detail "…" menu)
write capability (repo has create/update) → Save action (extended FAB on form)
```

- No "detail screen → always show …" heuristic. A capability-absent screen renders no menu.
- Implemented via existing operations.ts predicates (`hasExport`, `hasAudit`, repo method
  inspection) feeding the pattern selector; generators consume the decided action list.

## 7. P5 → merge with DESIGN_OPTS D2 (no duplication)

- `DESIGN_OPTS.md` owns richer state composition (composed empty state, error-retry,
  pull-to-refresh, skeleton). This contract contributes only: **structural placement** — where
  `EmptyState`/`ErrorState`/`LoadingState`/Retry slot into the list/detail/form templates,
  driven by the same centralized pattern payload.
- Close the P5 line in the spike; keep D2 as the single implementation owner.

## 8. Frozen roadmap

```text
S0  Pattern contract (this doc)                         ← done now
 │
 ├── P1  Global shell (NavigationBar, destination contract, >5 = target-limit error)
 ├── P2  Per-list search (explicit `search:` composition block)
 ├── P3  Scroll behavior (cosmetic, presentation-only)
 ├── P4  Capability-driven actions (export/delete/audit/write map)
 └── P5  merge → DESIGN_OPTS D2 (structural placement only)
```

Each slice: typecheck → all-samples validate → analyze/test touched sample → small commit →
goldens → Telegram. CDP for UI-affecting slices (P1, P2 at minimum).

## 9. Guardrails restated

1. One pattern-selection owner (`composition.ts` + plan); generators consume decided payloads.
2. Existing Flutter generators untouched **unless the specific pattern slice explicitly owns
   that generator** (P1 owns routing + a screen/app-shell; P2 owns screen list template).
3. Acceptance: `same IR + same ctx + same generator version → byte-identical`. Every slice
   re-verifies this across all 4 apps + `builder/samples/*`.
4. Never reduce IR-validity to a presentation limitation (§3.2).