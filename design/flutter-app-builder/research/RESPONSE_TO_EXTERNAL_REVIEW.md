# Response to the external architecture review (ChatGPT) of DESIGN_OPTS.md + PAYMENTS_OPTS.md

Author: opencode (project orchestrator/architect). Date: 2026-08-16.
This is my engineering assessment of the third-party review, what we adopted, what we pushed back
on, and why. The review was folded into `ROADMAP.md` (committed c3397cc) via a fresh claude
session; this document records MY judgment on it.

---

## Overall verdict

The review is **architecturally sound and largely right for this project**. Its strongest and most
correct claim: *"the key issue isn't that you need more features — you need a better system for
adding features."* We adopted that framing wholesale. A deterministic compiler whose growth is
gated by hand-written if/else in `screen.ts` is not scalable; a capability contract that bounds
"what comes in → what's emitted → how it's validated → how it's tested" is exactly the right
abstraction for agent-driven extension. Several specific recommendations are already true in the
project (money-never-double, offline-first, in-memory fallback, no secrets) — the review's value is
making them *explicit and machine-checkable* rather than implicit.

Adopted: capability contract · agent contract · generator manifest · decision trace · golden
impact · UX pattern engine · UX linter · payment state machine + capability levels · provider
capability matrix · adapter contract tests · specialized agents + stage gate.

Pushed back on (see below): the review over-weights UI primitives as a *phase*; its reorder risks
slowing the visible demo loop that the owner actually reviews; some "agent workflow" items are
process theater unless tied to the existing verify→commit→CDP loop; and the payments levels
(L3–L6) should NOT be planned as code until the P9 backend exists.

---

## What we adopted, and how it maps to the roadmap

### P10 — Generator platform foundations (new phase)
- **Capability contract** (`CAPABILITY_CONTRACT.md`): id/version/inputs/outputs/dependencies/
  validators/runtime/testing/fallback. We retrofit **one existing capability** (`money.v1`) as the
  worked example — documentation only, no code move. This is the review's "single most important
  addition" and it's cheap because the generator already *behaves* this way; we're making it
  declarative.
- **Agent contract** (`GENERATOR_CONTRACT.md`): the machine-checkable rules are largely already
  enforced by `validate.ts` gates (archCheck, secrets, idioms, `[money]`, `[oracle]`, `[datepicker]`,
  `[verdict]`). Making them an explicit contract turns "what an agent must not break" from tribal
  knowledge into a file. Low cost, high value.
- **Generator manifest**: emit `.generator-manifest.json` per app (generatorVersion, schemaVersion,
  capabilities[], providers{}, features[]). Provenance/reproducibility. Additive file — zero churn.
- **Decision trace**: instrument the EXISTING deterministic decision points (`scoring.ts` 8-input
  scoring, `composition.ts` archetype) to log `{screen, decisions:[{rule, reason, result}]}`. The
  review is right that agents shouldn't hallucinate "why a grid" — and we already decide it
  deterministically, so the trace is logging, not new logic.
- **Golden impact report**: wrap golden regeneration to report `{Changed, Added, Deleted,
  Intentional[], Unexpected[]}`. Directly addresses the review's "agents can't casually modify 40
  screenshots."

### P11 — UX pattern engine + design-system slices
- The review's **pattern engine** (IR → semantic analysis → pattern selection → composition →
  component → Flutter) is a formalization of what `scoring.ts` + `composition.ts` + `fieldRole()`
  already do piecemeal. We made it an explicit rule catalog. This is a genuine improvement over
  the current spread-out logic and it's deterministic by construction.
- **UX linter** (UX001–012) as a formal compiler stage — the review's strongest *new* idea. A
  generated app should be judged by "no overflow, contrast, touch targets, hierarchy, RTL,
  loading/empty/error present," not just "it compiles." We already have the CDP + golden machinery;
  this is the missing judgment layer.
- **Resisted**: adding many UI primitives *as a phase*. We keep the composition-rule framing
  ("design vocabulary → composition rules → components") and land D1–D4 exactly as DESIGN_OPTS.md
  scopes them, NOT a widget zoo.

### P12 — Payments capability (levels, state machine, contract tests)
- **Capability levels L0–L6, ship L0–L2 only** — exactly right and matches PAYMENTS_OPTS.md §7.
  The generator must never emit a "production-looking" payment system when only a mock is wired.
  `attributes.payments.provider: none|mock` gates it.
- **Payment state machine** as a first-class artifact, reusing our existing `state_machine.ts`
  pattern + an impossible-transition validator. Correct: payment bugs aren't UI bugs.
- **Provider capability matrix** + **`PaymentGatewayContractTest`** run against every adapter —
  the review's "agent knows when an adapter is finished" is a great success criterion.
- **`[payments]` security validator** mirroring `[money]`: blocks `cardNumber/cvc/pan` typed as
  anything but `PaymentToken`, blocks secret-key-shaped strings in generated Dart.

### P13 — Specialized agents + stage gate
- Adopted as **process-only** (no generator code): a mission-brief template (flagship example:
  payments.v1) + the DISCOVER→…→REVIEW stage gate stapled onto our existing Standing Loop. We
  already effectively run architect/generator/validator/test/visual-QA/adversarial roles across
  opencode + claude sessions; making it an explicit gate keeps a capability from being declared
  done on "it compiles."

---

## What we pushed back on

1. **The reorder (Phase A foundations before design) is too waterfall for this project.** The owner
   reviews by *seeing* the generated app on an iPhone via Tailscale every cycle. Burying all UI work
   until after manifest/contract/decision-trace tooling would starve the demo loop. Our resolution:
   P10 is "doc + tooling only, zero golden churn, runs in parallel with anything" and P11's D1–D4
   (theme/dark-mode/CTA/composition) stay alongside, not behind, the meta-layer. The meta-layer is
   additive, not a blocking prerequisite.
2. **"Agent workflow" items (P13) are process theater unless tied to the existing loop.** The
   review's 9-stage gate is fine as a *completion definition*, but our Standing Loop already forces
   typecheck → generate → validate → flutter analyze/test → CDP → RCA until green on every slice.
   We stapled the stage gate onto that rather than inventing a parallel process.
3. **Payments L3–L6 must stay P9-era, not a roadmap phase now.** The review's Phase C lists
   backend intent/webhooks/reconciliation/payouts as one payments phase. Those are backend
   capabilities; our P9 (NestJS generation) is the prerequisite and is itself mid/long-term. We
   explicitly bound P12 to L0–L2 now, L3+ waits for P9. Emitting L3-shaped code without a backend
   would violate the review's own L0–L6 safety principle.
4. **Provider count.** The review implies shipping moyasar/Tap/Stripe adapters. We ship the PORT +
   mock first (PAY1–PAY3), then adapter *shells* that compile and "downgrade to mock" (PAY4). The
   shells are valuable (they prove the port) but none of them becomes real until a backend can hold
   the secret keys. We won't burn cycles making three payment integrations against nothing.

---

## What the review got right that surprised us (worth calling out)

- **"Resist the widget zoo."** We had drifted toward additive components; the composition-rule
  framing is a genuinely better organizing principle and we're adopting it for the pattern engine.
- **Payment Intent ≠ Payment Execution.** Splitting `PaymentGateway` (create/confirm/get/refund/
  methods) from `PaymentSession` (requiresAction/redirect/sdk/completed/failed) is correct and we
  will shape the port that way — mada/Apple Pay/STC Pay/3DS/BNPL genuinely don't share one lifecycle,
  and the domain model shouldn't be contaminated by provider behavior.
- **Adapters from contracts, not prose.** "Don't give an agent 'Implement Moyasar' — give it the
  ProviderAdapterContract + a fact sheet." This matches how we've been working (deterministic core +
  IR-driven) and we're making it the norm for PAY4.

---

## Bottom line

The review is a strong external validation that the project's determinism-first architecture is
right, and its meta-layer proposals (capability contract, manifest, decision trace, golden impact,
UX linter, payment state machine + levels, contract tests) materially improve how this generator
will grow. We adopted ~85% of it, grounded every item in what exists today, and held the line on
three points where the review would have slowed the demo loop, over-built payments without a
backend, or invented process disconnected from the loop that already gates every change.

Result: ROADMAP.md now has P10–P13 (committed c3397cc); P10–P13 are the next slices after the
current capability work (MF4 in flight, then MF2/MF3/MF5, L3/L4, MF6, then the 4 sample apps).
