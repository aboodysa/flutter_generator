# External architecture review of DESIGN_OPTS.md + PAYMENTS_OPTS.md (ChatGPT review, relayed by owner)

Date: 2026-08-16. Source: owner-relayed third-party review (ChatGPT) of the two research reports.
Purpose: input to a fresh claude review session → roadmap enhancement. This file preserves the
review verbatim-ish for agent consumption.

## Verdict (reviewer's own)
Direction is strong; convert from "enhancement backlogs" into a **capability-driven generator
platform** where agents extend the generator safely (no drift, no golden churn, no
provider-specific hacks). Scores: design 8.5→9.5, determinism 9→9.7, payments 8.5→9.5, agent
friendliness 7→9.5, testing 8→9.5, extensibility 7.5→9.5, production 7→9.

## 1. Capability Architecture (biggest recommendation)
Organize as `capability = IR schema + generator + validators + tests + fixtures + goldens + docs`,
bounded per capability:
```
capabilities/
  theme/{schema, generator, validator, fixtures, tests}
  payments/{schema, generator, validator, mock, adapters, tests}
  search/ notifications/ authentication/ persistence/ analytics/ accessibility/
```
An agent gets "implement capability payments.v1 per the capability contract" and works in a
bounded area — no need to understand the whole compiler.

## 2. Formal Capability Contract (single most important)
Every capability declares: id, version, inputs (e.g. attributes.payments), outputs (e.g.
dart/core/pay/payment_gateway.dart), dependencies (e.g. money.v1), validators, runtime
(offline/deterministic), testing (unit/golden/cdp), fallback (provider: mock). Generator then
knows what comes in → what's emitted → deps → validation → tests.

## 3. Agent Contract in repo (machine-checkable rules)
AGENTS.md / ARCHITECTURE.md / GENERATOR_CONTRACT.md / CAPABILITY_CONTRACT.md / TESTING_CONTRACT.md.
Rules like: never modify generated output; never provider logic in core/; never double for money;
never emit secrets; every capability requires IR schema + validator + generator + unit tests +
determinism test + fixture; golden output frozen unless approved; every adapter implements the
capability port; generated apps work offline.

## 4. Generator Manifest
Per generated app: {generatorVersion, schemaVersion, capabilities[], providers{}, features[]} for
provenance/reproducibility — answer "why does this app look different / which capability produced
this file" without reverse-engineering.

## 5. DESIGN_OPTS: resist adding too many UI primitives
Prefer composition rules over a widget zoo: IR → list/detail/wizard composition → search+filter →
loading/empty/error → primary action. "Design vocabulary → composition rules → components".

## 6. UX Pattern Engine (strongly recommended)
Deterministic pattern selection from IR semantics: many records+image+short title+status →
GRID; many metadata fields+scanning → DENSE LIST; single record+many fields → SECTIONED DETAIL;
workflow+status transitions → DETAIL+ACTION HERO. Pipeline: IR → semantic analysis → pattern
selection → composition → component selection → Flutter emission. Replaces if/else growth in
screen.ts.

## 7. Design Decision Trace
Per screen, emit {screen, decisions:[{rule, reason, result}]} so an agent can answer "why did you
generate a grid here?" from the trace, not hallucination.

## 8. Payments: separate Payment Intent from Payment Execution
PaymentGateway{createPayment, confirmPayment, getPayment, refundPayment, availableMethods} +
PaymentSession{requiresAction, redirect, sdk, completed, failed}. Reason: mada/Apple Pay/STC Pay/
3DS/BNPL/redirect/hosted/native SDK don't share one lifecycle; don't contaminate the domain model
with provider-specific behavior.

## 9. Payment State Machine as first-class artifact
created→requiresAction→processing→paid; created/requiresAction/processing→failed; paid→refunded/
partiallyRefunded. Validator rejects impossible transitions.

## 10. Payment Capability Levels
L0 none, L1 mock UI, L2 provider checkout, L3 backend intent, L4 webhooks+reconciliation, L5
refunds, L6 payouts. Prevents emitting a "production-looking" payment system without backend
capabilities.

## 11. Security Capabilities
security/{secret-scanner, payment-data-validator, pii-validator, auth-validator,
permission-validator, generated-config-validator}. Secret leakage gate scanning generated artifacts
for sk_/secret/private_key/api_key/client_secret/password/token with allowlists; run after
generation, not just IR validation.

## 12. Provider Capability Matrix
Per provider metadata: {provider, capabilities:{mada, applePay, stcPay, googlePay, bnpl, refund,
partialRefund, subscriptions}}. UI renders what's available deterministically; easier adapter
implementation.

## 13. Don't implement providers from prose
Give agents a ProviderAdapterContract (input PaymentIntent, output ProviderPaymentResult,
required create/confirm/status/refund, constraints: no secrets in Flutter, idempotency required,
Money stays minor units, provider amount conversion isolated, offline mock required) + a separate
provider fact sheet — prevents provider assumptions leaking into core.

## 14. Contract Tests for every adapter
PaymentGatewayContractTest (creates, idempotency deterministic, different key = different payment,
requiresAction, success, failure, refund, partial refund, invalid amount rejected, currency
mismatch rejected) run against every adapter (moyasar/Tap/Stripe). Agent knows when an adapter is
finished.

## 15. Golden Budget
Every run reports Golden Impact {Changed, Added, Deleted, Intentional[], Unexpected[]} — agents
can't casually modify 40 screenshots.

## 16. Visual Regression Judge
Pipeline IR→generator→Flutter→CDP→screenshot→deterministic visual checks→golden→UX heuristics→
PASS/FAIL. Report per screen: no overflow, contrast, touch targets, text hierarchy, RTL,
responsive width, loading/empty/error states + warnings (primary CTA below fold, 8 fields without
grouping).

## 17. UX Linter (formal compiler stage)
UX001 primary action not visible, UX002 too many actions, UX003 unlabelled destructive action,
UX004 missing empty state, UX005 missing error recovery, UX006 poor heading hierarchy, UX007 touch
target <44px, UX008 insufficient contrast, UX009 excessive card nesting, UX010 detail lacks
grouping, UX011 navigation lacks global chrome, UX012 grid unsuitable for density. Pipeline:
schema → semantic → architecture → security → UX → codegen.

## 18. Specialized agents, not one giant agent
Architect (IR/architecture/capabilities → IMPLEMENTATION_PLAN.md), Generator Engineer, Validator
Engineer, Test Engineer, Visual QA Agent (Flutter/CDP/screenshots/UX), Adversarial Reviewer
(money/payments/secrets/idempotency/responsive/RTL/a11y), Integrator.

## 19. Strict agent workflow (no skipped stages)
DISCOVER → PLAN → SCHEMA → GENERATE → VALIDATE → TEST → VISUAL QA → ADVERSARIAL QA → REVIEW.
"Code compiles" is NOT done; completion requires IR+generator+validator+mock+contract tests+
determinism+security+golden+CDP+docs.

## 20. Roadmap reorder
Phase A foundations: capability contract, generator manifest, decision trace, deterministic gen,
golden impact tracking, validator framework, agent contract.
Phase B design system: theme, dark mode, responsive max width, composition engine, UX linter, a11y.
Phase C payments: domain, MockPaymentGateway, idempotency, provider capability matrix, adapter
contract tests, moyasar/Tap/Stripe.
Phase D backend: payment API, webhook verification, reconciliation, refunds, payout.

## Strongest recommendation
Give agents capability-sized MISSIONS with success criteria, e.g. "Implement payments.v1":
capability schema exists, IR accepts attributes.payments, provider:none → zero artifacts,
provider:mock → deterministic flow, PaymentGateway contract exists, state machine enforced,
idempotency enforced, PCI validator enforced, provider matrix exists, all 3 adapters compile +
pass PaymentGatewayContractTest, works offline, CDP Pay→Paid passes, goldens pass, no unrelated
golden changes, npm typecheck passes.
