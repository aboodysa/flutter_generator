# Grilling — ChatGPT Response #3

## Verdict

**ChatGPT's strongest reply so far.** Fully aligned with our grilling, adds one genuinely sharp Phase-0 heuristic (needs a refinement), a useful correctness taxonomy (as vocabulary), and a good integration note. **But it does NOT resolve the free-text PII point — it names the steps while skipping the hard middle step — and its headline heuristic is too coarse.**

---

## Pros (keep)

### P1. "IR carries semantics, not templates" — the Phase 0 heuristic. KEEP, with a refinement.
ChatGPT's test — "did we have to add any information to the generated code that wasn't in the IR?" — is the right *spirit* and catches the "magic defaults / hidden conventions / template metadata" failure. It's the single best Phase 0 de-risking question yet.

**But it's too coarse as stated (see C2).** The refined form: "did we add any **semantic** information (behavior/business meaning) to the generated code that wasn't in the IR?" — because adding *implementation* detail not in the IR is exactly what plugins/templates are *for*.

### P2. Three correctness types. KEEP as vocabulary.
`Structural → Validator`, `Behavioral → Oracle + tests`, `Trust → Provenance + ACL + approval`. Clean disambiguation of the overloaded word "correctness". Not a new mechanism, but a useful lens.

### P3. Regeneration-correctness as a unified system. KEEP as an integration note.
"Generation Plan + ownership + regions = one system, not three features." Correct: the plan-diff should *drive* the region-aware merge, not exist alongside it. Fold into DESIGN.md §12 (change-impact) ↔ §11 (ownership/regions) as a single flow.

### P4. Don't overload Phase 0. Agree (already decided).

---

## Cons

### C1. PII is NOT resolved — ChatGPT defers it and its own pipeline has the same hole.
ChatGPT proposes: `Human Example → Sensitivity boundary → PII detection/redaction → canonical oracle → encrypted/scoped storage`. But **"PII detection/redaction" on free text IS the unsolved problem** — it's the exact step ChatGPT earlier admitted has no mechanism (field-level schema redaction misses free text; LLM-judge reintroduces the trust problem; human-per-example defeats automation). Naming the step is not solving it. **Status: OPEN.** (Resolution path in §PII below.)

### C2. The headline heuristic would collapse the IR/plugin separation.
"Any info not in the IR = IR is incomplete" is wrong as stated. The IR is *semantic by design* (§2.3 rule 1: "IR is semantic, not implementation"). Generators are *supposed* to add implementation detail (which freezed annotation, which provider form) that the IR never carries. Applied literally, the heuristic forces implementation detail into the IR and destroys the plugin/adaptor layer. **Fix:** the test is for *semantic* information, not any information.

### C3. "Regeneration correctness" isn't a fourth independent type.
It's Trust/Ownership applied across a plan-diff — a cross-cutting concern over the other three, not a peer category. The taxonomy is really 3 + one cross-cutting invariant. (Cosmetic, but keeps the model honest.)

### C4. "No more architecture grilling" is premature on exactly one axis.
Right for the architecture overall, but the PII thread is the one genuine open item — it must be resolved before Phase 3 (where `RequirementAgent` starts capturing real examples), which ChatGPT itself concedes. "No more grilling" should read "no more grilling *except* land the PII mechanism."

---

## §PII — the open point, resolved (the mechanism ChatGPT didn't supply)

The free-text PII leak is real and is **not** a Phase-0 blocker, but must be decided before Phase 3. The resolution has four layers, none of which is an LLM judge:

1. **Constrain the oracle example schema to typed fields — no business-bearing free text in the corpus.** If a rule's behavior depends on free-text content ("notes contains X"), that is a red flag that a *structured field is missing* — extract it into a typed field. Free text may exist as opaque/display-only data, but never as oracle-relevant input.
2. **Deterministic PII-detector lower bound** (closed regex/allowlist of national IDs, phones, emails, IBAN, account numbers — no LLM). Anything matched → redacted + requires human attestation before it can persist in the IR or reach any model. This is a *safety net*, not the oracle.
3. **Synthetic-by-default.** Anything that reaches an LLM provider or a checked-in golden/test fixture must be `synthetic` or `anonymized`. Real production data is permitted only in a local-only evaluation harness (no LLM in the loop), never persisted to IR, never committed.
4. **Treat the example corpus as a security boundary** — same `SecurityValidator` + secrets discipline already in §13/§21 (secret-literal rejection, scoped storage). The corpus is a secret-adjacent asset, not free-form config.

This closes the hole: free text is structurally excluded from oracle-relevant input (1), known patterns are caught deterministically (2), everything else is synthetic or local-only (3), and the corpus is governed like secrets (4). The one thing it does NOT do is perfectly detect PII inside genuinely-necessary free text — because that, as the grilling established, has no safe automated mechanism; (1) sidesteps it by design rather than pretending to solve it.

---

## What to fold into DESIGN.md v3

1. Phase 0 exit heuristic: "no **semantic** info in generated code beyond the IR" (refined).
2. Correctness taxonomy (structural/behavioral/trust) as a named lens in §21.
3. Plan-diff → region-aware-merge as one unified regeneration flow (§12 ↔ §11).
4. §PII four-layer policy (land before Phase 3).
