# S2 contract decisions — options with impact

**From:** S2 spike (§16 open questions) — **Owner calls needed before the implementer slice.**
Report: `design/flutter-app-builder/research/SPIKE_S2_REPORT.md` (committed `28b3163`).
Decision criteria per SPIKE_PROTOCOL: each choice is catalog truth (IR/schema/contract) that ships in
code, goldens, and tests — a change later is a regeneration + review, so pick for the long run.

---

## Decision A — contract amendment: is `emphasis.targetId` dropped?

**Context.** S1 D3 deferred `emphasis.targetId` to S2 ("lands sections[] AND emphasis.targetId
together"). The S2 spike's evidence (§13 D5, §15) says: under a section-list the focal element IS
the `hero` section — prominence = its position + order + `heroScale`. `targetId` would resolve to
exactly the section that already declares itself, adding an IR field + cross-reference validation
with zero expressive gain.

### Option A1 — DROP emphasis (spike recommendation)

- IR has **no** `emphasis` field anywhere. Hierarchy expressed purely by:
  `hero` section position + `heroScale` (0/1/2) + section order.
- **Contract:** v2 §2.3 `emphasis` deleted; amendment note in the decision log.
- **Impact — for:** one less IR field to validate; no cross-reference target checks; the section-list
  is self-explanatory; fewer failure modes (§9). **Against:** if a future NON-section context (e.g.
  "make THIS product card pop inside a detail screen") needs focal emphasis, it has no home — a
  later spike reintroduces it; the S1 D3 deferral is closed without delivering its original promise.

### Option A2 — KEEP emphasis for a future non-section context

- S2 ships sections WITHOUT `emphasis`. `targetId` stays in the contract (§2.3), unimplemented,
  documented as "future: detail/other screens".
- **Impact — for:** contract keeps the door open; a detail-screen "make this element pop" ask later
  has a pre-agreed slot. **Against:** a dead IR concept today — `targetId` on a section-less screen
  is ambiguous (targets what?); the validation burden is deferred not avoided; mild contract cruft.

### Impact table

| Axis | A1 DROP | A2 KEEP |
|---|---|---|
| IR surface | smallest (no field) | +1 field, unimplemented |
| Validation | none new | future target-ref gate needed |
| S1 D3 closure | original promise closed-without-delivery | kept open |
| Future non-section emphasis | needs new spike | pre-agreed slot |
| Today's code/tests | simplest | unchanged by absence |

---

## Decision B — archetype label for the new `screen.type` value

**Context.** The new screen renders a section-list home. The VLM worked example calls it
`"dashboard"` and claims it's an "existing archetype" (it is NOT — `COMPOSITIONS` has only
list/detail/wizard, schema enum is closed to those three; S2 must ADD the archetype in
composition.ts + screen.schema.json + screen.ts). The label becomes catalog truth in IR, schema,
plan.json (`patterns.sections`), generated `Screen<X>` naming, routes, goldens, and tests.

### Option B1 — `"sections"` (spike recommendation)

- Neutral, catalog-honest: "this screen is a section-list". `market`/`home`/`dashboard` become
  future **personality/convention** values (via `visualStyle.personality`), never special-cases.
- **Impact — for:** vocabulary stays descriptive of the mechanism; S2-gate note
  (`VLM_DESIGN_TO_IR_CONTRACT_V2.md:323-326`: catalog truth only after spike proves it) satisfied;
  no semantic overload ("dashboard" implies analytics). **Against:** less product-flavored; the
  VLM example text must be amended (`"dashboard"` → `"sections"`).

### Option B2 — `"home"`

- Product-oriented: implies the app entry/home screen.
- **Impact — for:** reads naturally in IR/screens. **Against:** a home screen is a PRODUCT role, not
  a layout mechanism — a home could also be a list/detail today; adds ambiguity ("home" as type vs
  "home" as first screen). Minor mismatch if a sections screen is ever not the entry.

### Option B3 — `"dashboard"`

- The literal label in the VLM worked example A.
- **Impact — for:** matches the contract's existing text; familiar. **Against:** connotes analytics/
  admin dashboards; the example's own framing ("NOT market") shows the label is contested; carrying
  a misnamed type into schema/code is harder to unwind later than picking right now.

### Impact table

| Axis | B1 sections | B2 home | B3 dashboard |
|---|---|---|---|
| Contract-text delta | amend example (dashboard→sections) | amend example | none (matches) |
| Semantic accuracy | mechanism-true | product-role | analytics-connoted |
| Reuse risk | market/dashboard = future personalities | could collide with 'first screen' logic | locks in a contested name |
| Schema/code stability | high | medium | low |

---

## Suggested combined decision (for the owner to ratify or edit)

> **A1 DROP emphasis** (hierarchy = hero + order + heroScale) **+ B1 `"sections"`** (neutral
> archetype; contract example amended). Both are the spike's evidence-based recommendations; they
> minimize IR surface and keep vocabulary mechanism-true. Then the implementer slice (§14.1–14.7)
> ships with those labels.

Reply with the chosen options (or edits), and I'll amend the contract + write the implementation brief.
