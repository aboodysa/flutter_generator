# Refined external review #2 (ChatGPT, responding to our RESPONSE_TO_EXTERNAL_REVIEW.md)

Owner-relayed. This is the SECOND round of third-party review. Overall: our response was
**accepted** ("I would consider the response accepted"), with ONE architectural change strongly
recommended + a handful of refinements. Preserve for agent consumption.

## Accepted as-is (do not reopen)
P10 capability contract · agent contract · generator manifest · decision trace · golden impact ·
UX pattern engine · payment state machine + levels · provider matrix · adapter contract tests ·
provider shells · L3–L6 deferred to P9 · specialized agents · 9-stage workflow as completion
criteria · resisting UI-widget expansion.

## NEW — P10.5 Capability Registry (the one strongly-recommended addition)
Capabilities must become **executable/self-describing**, not just Markdown docs. Evolution:
```
CAPABILITY_CONTRACT.md
   ↓
capability schema
   ↓
capability registry
   ↓
compiler introspection
   ↓
agent tooling
```
Concretely, the compiler should eventually answer:
- `$ builder capabilities list` → money.v1, payments.v1, theme.v2, navigation.v1, …
- `$ builder capabilities inspect payments.v1` →
  ```
  Inputs: attributes.payments
  Outputs: PaymentGateway, PaymentSession, PaymentModels, MockPaymentGateway
  Validators: payments, money, secrets
  Tests: contract, determinism, integration
  Runtime: offline=true
  Providers: mock, moyasar-shell, tap-shell, stripe-shell
  ```
Each capability declares: ID, version, dependencies, inputs, outputs, validators, tests,
generators, providers, runtime constraints. Agents then don't need to read the whole repo to
discover architecture — critical once there are 20–30 capabilities.

## NEW — Capability dependency graph (machine-readable, immediately)
```
payments.v1 → money.v1, security.v1, state-machine.v1
checkout.v1 → payments.v1, money.v1, navigation.v1
```
Compiler can then answer: "If I modify money.v1, which capabilities/artifacts are affected?" —
powerful for agents + regression.

## P12 refinement — no silent mock fallback in production
Our "adapter shells that downgrade to mock" is fine for DEV, dangerous in PROD. Distinguish:
- **Development**: provider unavailable → explicit mock allowed (opt-in flag).
- **Production**: provider unavailable → **FAIL BUILD / FAIL CONFIG VALIDATION**.
Never: Production Moyasar → config error → silently MockPaymentGateway (UI would say "Payment
successful" while nothing happened).
**Hard compiler invariant**: if backend capability `payments.intent` is absent, the generator MUST
NOT emit production payment-execution code. Make it an explicit P12 constraint.

## P11 refinement — UX linter three tiers
Split UX001–012 into:
- **Hard errors** (must never ship): overflow, invalid touch target, missing required a11y label,
  broken RTL, secret leakage, invalid payment state, invalid navigation.
- **Warnings** (may be intentional): too many actions, dense screen, CTA below fold, long form,
  low hierarchy.
- **Advisory** (can improve, doesn't block): could group fields, reduce nesting, better hierarchy,
  progressive disclosure.
Prevents the linter being overly restrictive.

## P11 refinement — semantic patterns over components
The rule "design vocabulary → composition rules → components" should be fundamental. Ask "what
semantic pattern is missing?" not "what component should we add?". Example:
`entity with lifecycle` → Header/Status/Primary action/Metadata/Timeline/Secondary actions →
Card/Chip/Button/List.

## P13 refinement — missions consume capability contracts (machine-oriented)
Ideal future agent task is a MISSION, e.g.:
```
Capability: payments.v1  Version: 1  Scope: L0–L2 only
Required: [ ] schema [ ] port [ ] state machine [ ] validator [ ] mock
          [ ] provider shells [ ] contract tests [ ] determinism [ ] manifest [ ] decision trace
Forbidden: production backend, real provider secrets, silent production fallback, unrelated UI changes
Done when: builder verify payments.v1 · builder generate fixture/payments · flutter analyze ·
           flutter test · CDP create→requiresAction→paid · goldens unchanged except declared
```

## Final verdict table (refinements only)
| Area | Decision |
|---|---|
| P10 capability contract | ✅ keep |
| Agent contract | ✅ keep |
| Generator manifest | ✅ keep |
| Decision trace | ✅ keep |
| Golden impact | ✅ keep |
| **Capability registry** | ⭐ ADD (P10.5) |
| **Capability dependency graph** | ⭐ ADD |
| UX pattern engine | ✅ keep |
| UX linter | ✅ keep, split error/warning/advisory |
| Payment state machine | ✅ keep |
| Payment capability levels | ✅ keep |
| Provider matrix | ✅ keep |
| Adapter contract tests | ✅ keep |
| Provider shells | ✅ keep |
| **Silent mock fallback** | ⚠️ forbid in production |
| L3–L6 | ⏸️ defer to P9 (correct) |
| Specialized agents | ✅ keep as orchestration roles |
| 9-stage workflow | ✅ keep as completion criteria only |
| UI widget expansion | ❌ resist |
