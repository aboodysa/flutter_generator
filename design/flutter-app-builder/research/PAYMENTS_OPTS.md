# Payment options for the generated Flutter apps — research report

> Research date: 2026-08-16 · Source brief: `~/temp/opencode/flutter-app-builder/RESEARCH_PAYMENTS.md`
> Scope: what the **generator** should be able to emit and how — provider landscape for
> SA/GCC, a `PaymentGateway` port + mock, DTOs, idempotency, and a priority roadmap.
> This is research + design only — no code changes.
> Facts (fees/availability) verified against 2026 public sources; fee tables are indicative,
> quote your merchant for hard numbers.

## 0. What the generator actually needs (opinion, up front)

The generated apps are **B2B money apps** (Ledgerly expense, HR, work-auth, CRM). Money is
integer minor units + ISO currency (never `double`) — the `Money` value object already emitted
by `money.v1` (`builder/src/generators/infra.ts`). These apps are **reimbursement/payout-first**
(pay money *out*), not acquiring-first (charge cards *in*).

**Recommendation: the generator's first payment emission is a payment-*intent orchestrator*,
not a card form.** Concretely:

1. **Emit now (pure offline Dart, no backend):** a `PaymentGateway` **port** +
   `MockPaymentGateway` (deterministic in-memory), payment DTOs, a client-side idempotency
   registry, and the UI that rides it (amount in `Money`, method picker, status stepper,
   receipt). This is honest: nothing is charged, everything is testable, goldens/CDP stay
   deterministic, and it is identical to how F2 (persistence) already works — real adapter where
   possible, in-memory fallback for offline/demo (§RESEARCH/PERSISTENCE_ARCH).
2. **Emit adapter shells for 2–3 real providers** (moyasar, Tap, Stripe) behind that port.
   They compile offline and "downgrade to mock" until a backend/publishable key is configured.
3. **Move real money movement to server-side when the P9 backend lands** (secret keys are
   server-only; webhooks verified there; idempotency middleware mirrors the offline registry).

Anytime a provider needs `PaymentIntent` creation or card collection, that is **backend work** —
generated pure Dart must stay out of PCI scope (§8).

---

## 1. Regional ground truths (why SA ≠ US/EU coverage)

These five facts shape every provider decision below. Most US/EU tutorials assume you can just
"add cards"; in SA that is losing 60%+ of the market.

| Fact | Detail | Design impact |
|---|---|---|
| **mada dominates** | ~60%+ of SA online transactions; ~80% of Saudi cards are mada debit; in-store fee cap 0.80% (SAR 40 max), online ~1% capped ~SAR 200 | A checkout without mada is broken in SA. mada is a **domestic scheme with no direct API** — you reach it only through a SAMA-licensed acquirer (Tap, moyasar, HyperPay, PayTabs, Paymob, APS). Stripe is **not** among them. |
| **SAMA licensing** | Merchants don't need a licence; the *gateway* must be SAMA-licensed. SAMA-licensed 2026: HyperPay, moyasar, PayTabs, Tap, Amazon Pay Services | Provider selection = licence check first, features second. Unlicensed gateways get elevated declines. |
| **Apple Pay rides mada** | In SA, Apple Pay usually tokenizes a **mada card from Apple Wallet** — the transaction settles on mada, not Visa/MC. Apple charges no merchant fee; the card's rate applies | Apple Pay is free conversion — always render it (conditionally, Apple devices only). But you must test with **Saudi mada cards in the wallet**, and the gateway must be configured for mada-through-Apple-Pay or the sheet opens then declines. |
| **STC Pay is a real wallet** | ~7M+ users; authenticates inside the STC Pay app then returns; T+1 settlement; usually exposed via gateways (moyasar/HyperPay/PayTabs/Tap/Paymob), plus a direct merchant API | First-class SA method for mobile-first users; gateways expose it as an OTP/redirect flow (moyasar: 2-step `pay` + `verifyOTP`). |
| **BNPL is table stakes** | Tamara + Tabby combined ≈ 35–40% of SA e-commerce checkouts; merchant fees 2.5–5.99%; both are gateway add-ons (Checkout.com×Tabby, Tap, PayTabs, Paymob) | Treat BNPL as a **method on the gateway** (or a sibling checkout widget), not a separate integration. For B2B reimbursement apps BNPL is low-priority; for CRM/invoice apps it matters. |

Also in play: **SADAD** (invoice/bill payments — B2B/government/subscription only, not consumer
retail) and **ZATCA Phase 2 e-invoicing** (≥SAR 500K revenue → VAT-compliant e-invoices; gateways
don't do this for you — it's an invoice-layer concern, pair with the audit/CSV L3 capability).

---

## 2. Provider deep-dives

### 2.1 Stripe
- **What:** global (US/EU-centric) stack: `PaymentIntents`, `SetupIntents` (off-session/saved
  cards), `PaymentSheet`/`Elements`, Apple Pay + Google Pay via **Payment Request**, Connect for
  marketplaces/payouts.
- **Integration surface:** mobile = `flutter_stripe` (official) with `Stripe.publishableKey`
  client-side; all secret-key calls (creating intents, webhooks) on a backend; `Idempotency-Key`
  header is standard on the API.
- **SA/SE/SG/GCC fit:** UAE-supported for years; a **direct SA path existed since ~Feb 2026**
  (Saudi LLC + Saudi bank, SAR settlement) but **not SAMA-licensed for mada acquiring** — mada,
  mada-through-Apple-Pay and STC Pay are unavailable. Fine for a global-SaaS-style caller base
  (cards/AP), wrong alone for an SA-first app. Strong in SE/SG (Singapore supported).
- **Offline-first testability:** excellent — official Dart SDK, test card numbers, generous
  sandbox; the client is a thin wrapper over intents, easily mocked.
- **Generator-emittable:** intents DTOs (`createPaymentIntent(amount, currency, methods,
  idempotencyKey)`), a `StripePaymentAdapter` behind the port (compiles offline), PaymentSheet
  config when a backend exists. Effort: **M** — surface smallest of the three because the API
  shape maps 1:1 to the port.
- **Impact:** H for method breadth, L for SA-local coverage.

### 2.2 moyasar
- **What:** Saudi-first, SAMA-licensed (Riyadh, est. 2015). Methods: mada, Visa/MC/Amex, Apple
  Pay, Samsung Pay, STC Pay, cards; hosted cashier and managed 3DS. Amounts in **halalas**
  (int — lines up perfectly with `Money.minorUnits`). Clean Stripe-style REST, public pricing,
  fast self-serve sandbox. Invoice API exists.
- **Integration surface:** official `moyasar` Flutter SDK (verified publisher, v3.x) — Apple Pay,
  Samsung Pay, `STCPay` (2-step + `verifyOTP`), credit-card source. Example amounts: `10000` = 100.00
  SAR. Publishable key client-side; secret key server-side; webhooks with `secret_token`.
- **SA/GCC fit:** **best-in-class for SA-only startups** — fastest path to live mada,
  Apple Pay and STC Pay, no monthly fee, public rate card (mada ~2.5%, cards ~2.9%). **SA only**
  — no expansion to UAE/KW/BH. No native BNPL.
- **Offline-first testability:** good — sandbox + `PaymentConfig`, test cards; sandbox
  amounts; STC Pay OTP `123456`/`000000`.
- **Generator-emittable:** a `MoyasarPaymentAdapter` (halala codec = reuse `minorUnits` as-is),
  `PaymentConfig`/source DTOs, OTP-verify flow for STC Pay. Effort: **S–M**.
- **Impact:** H for SA, L outside.

### 2.3 Tap Payments (goSell / Checkout)
- **What:** GCC-native (est. 2013, 50k+ merchants). Methods: mada, KNET (KW), benefit (BH), STC
  Pay, Apple/Google/Samsung Pay, cards; **native BNPL (Tamara/Tabby)**, subscriptions, and
  marketplaces. SAMA-licensed.
- **Integration surface:** `checkout_flutter` (Tap's Flutter SDK) needs a server-generated **hash
  string** and a checkout session; also `goSell` Flutter SDK. Charge/authorize/save-card/tokenize
  modes. **Native idempotency** via `reference.idempotent` (24 h validity) — the cleanest of the
  three for our design. Onboarding 2–5 days, Arabic-first.
- **SA/GCC fit:** best multi-country GCC choice in one integration (SA, UAE, KW, BH + more);
  mada approved though not the market's highest; fees ~2.5–2.95%.
- **Offline-first testability:** fine — sandbox keys, published mada test cards; SDK returns
  charge/status you can assert against.
- **Generator-emittable:** `TapPaymentAdapter` (`reference.idempotent` → port `idempotencyKey`
  mapping is 1:1), charge/authorize DTOs, the hash string as an explicit "needs backend" seam.
  Effort: **M**.
- **Impact:** H for GCC-wide, H for SA.

### 2.4 HyperPay / PayTabs / Checkout.com / Verifone / Paymob
- **HyperPay** — SAMA-licensed, SA enterprise-scale, **highest tested mada approval (>96%)** via
  direct bank acquiring; mada, cards, Apple Pay, STC Pay, KNET, benefit, Alipay/WeChat. ReadyUI/
  CustomUI mobile SDK (Flutter wrappers `hyperpay_plugin`, `hyperpay_payment_sdk` need a
  server **checkoutID**). Fees custom (~2.65–2.95% + SAR 1, monthly SAR 0–500). Generator effort
  **M–L** (checkoutID server dependency is the seam). Impact H (SA) — but the extra server call
  makes it a "backend-era" adapter.
- **PayTabs** — Saudi-built, MENA-wide (SA/UAE/KW/BH/OM/QA/JO/EG/IQ/MA) on region-specific REST
  hosts; cards, mada, KNET, OmanNet, benefit, STC Pay, urpay, Apple/Google/Samsung Pay, **SADAD
  invoices**; hosted/tokenized + `flutter_paytabs_bridge`. Fees ~2.85%. Server-key based → all
  flows through a backend. Effort **M–L**.
- **Checkout.com** — enterprise, operations in KSA/UAE; **mada + Apple Pay-over-mada supported**
  (checkout.com/payment-methods/mada); partners Tabby; own tokenization Flutter SDK in **public
  beta** (card + Apple/Google tokenization only — charge creation entirely server-side). Custom
  volume pricing. Fine raw cards, low SA-self-serve fit. Effort **L** (mostly server).
- **Verifone (2Checkout)** — global/SE-focused, hosted checkout, not SA-native; weak fit for
  our SA-first lane. Skip as a generator adapter.
- **Paymob** — MENA (EGY/KSA/UAE/OMN on regional hostnames), Intention API + Unified Checkout/
  Pixel; notably **payment creation can run from the mobile client with public key + client
  secret** (keeps secret keys off-device), so it's the least-backend-dependent of the regional
  crowd; mada, OmanNet, STC Pay + EGY wallets, Apple/Google Pay, BNPL (Valu, Tabby, Tamara).
  Community Flutter wrappers only. Fees competitive (~2.5–2.95%). Generator effort **M**; strong
  candidate as a **fourth** adapter if an EGY-adjacent sample appears.

### 2.5 Local wallets / schemes
- **STC Pay (direct)** — genuine wallet balance; direct merchant API exists but standard route is
  via gateways (T+1). Direct effort M–L; skip for v1 (gateway coverage suffices).
- **mada (direct)** — **no public merchant API**; acquire via a gateway only. Never a generator
  adapter; it's a *method class* on other adapters (`methods: ["mada"]`).
- **Apple Pay** — SDK (PassKit, in-app) vs **Payment Request** (web, zero-Apple-mandate, works
  on Safari/macOS and increasingly desktop). For generated **web** builds prefer Payment Request
  surfaced by the provider's web SDK; for mobile, the provider SDK handles it. Render
  **conditionally** (detect support) — never show Apple Pay on non-Apple devices. No merchant fee.
- **Google Pay** — SA/UAE-supported via gateways (not Egypt). Same conditional-render rule.
- **SADAD** — invoice/bill rail for B2B/government/subscription; via PayTabs/Tap. Not consumer
  retail; **B2B invoice lanes in our sampled apps qualify** later (P9).
- **Tamara / Tabby (BNPL)** — standard in SA/GCC e-commerce; merchant fee 2.5–5.99%; both expose
  hosted/SDK checkouts and are pre-integrated in Tap/PayTabs/Paymob/Checkout.com. For generator v1:
  a `methods: ["tamara","tabby"]` on the provider; no separate adapter.

> **Brief corrections (as prompted in the task):**
> - moyasar does **not** do QPay — it is SA-only. Qatar's QPay wallet is reached via Tap/PayTabs
>   cross-border coverage.
> - Checkout.com's SA story is **mada + Apple Pay coexisting with their global acquirer**; no
>   product named "fastnet" was found — flagging so the generator spec uses the mada-capable
>   Checkout.com account, not a mis-named one.
> - Stripe's SA availability is **partial**: direct Saudi entities since 2026, but mada/STC Pay
>   missing (not SAMA-licensed for mada). US/EU-grounded guides will mislead an SA-first app.

---

## 3. Provider comparison table

| Provider | Region / licence | Methods | Flutter SDK | Fees model (indicative) | Offline testability | Server need to *charge* |
|---|---|---|---|---|---|---|
| **Stripe** | Global; UAE ✓, SA partial (no mada) | Cards, Apple/Google Pay, wallets, APM, Connect | Official `flutter_stripe` (+ web `pay`) | ~2.9% + fixed | Excellent (test cards, generous sandbox) | **Yes** (intents/webhooks server-side) |
| **moyasar** | SA-only; SAMA ✓ | mada, cards, Apple/Samsung Pay, STC Pay, invoices | Official `moyasar` (verified publisher) | mada ~2.5%, cards ~2.9%, no monthly | Good (sandbox, test cards, OTP tests) | Yes, but payment *creation* is simple REST; SDK does most |
| **Tap Payments** | SA/UAE/KW/BH(+); SAMA ✓ | mada, KNET, benefit, STC Pay, Apple/Google Pay, BNPL(Tabby/Tamara), subs | `checkout_flutter` / goSell Flutter | ~2.5–2.95% | Good (sandbox + published mada test cards) | **Yes** (hash + checkout session) |
| **HyperPay** | SA+UAE/EG/JO; SAMA ✓ | mada, cards, Apple Pay, STC Pay, KNET/benefit, Alipay/WeChat | Community plugins (ReadyUI/CustomUI) | Custom (~2.65–2.95% + SAR1) | Medium | **Yes** (server checkoutID) |
| **PayTabs** | MENA-wide; SAMA ✓ | cards, mada, KNET, benefit, STC Pay, SADAD, Apple/Google/Samsung Pay | `flutter_paytabs_bridge` | ~2.85%, opaque SME pricing | Medium | **Yes** (server key, region hosts) |
| **Checkout.com** | Global + KSA/UAE; licensed locally | mada (w/ Apple Pay), cards, BNPL via Tabby/Tamara | Own Flutter SDK (public beta, tokenization only) | Custom / enterprise | Medium | **Yes** (fully server) |
| **Verifone (2Checkout)** | Global/SE | cards, hosted | none first-party | Custom | Low | Yes |
| **Paymob** | EGY/KSA/UAE/OMN | mada, OmanNet, cards, StcPay, Apple/Google Pay, BNPL | Community wrappers + native SDKs | ~2.5–2.95% | Medium-good | **Partial** — Intention API can run client-side (public key + client secret) |
| **STC Pay (direct)** | SA wallet (7M+) | wallet balance | Gateway-mediated mostly | ~card rates | Low | Yes (direct API) |
| **mada / SADAD (direct)** | schemes, no merchant API | — | via gateways only | — | — | n/a |
| **Tabby / Tamara (BNPL)** | SA/GCC standard | installments | hosted/SDK + pre-wired in gateways | 2.5–5.99% | Medium | Yes (checkout url) |

---

## 4. PCI posture (non-negotiable)

1. **Generated apps never touch raw PAN/CVC/expiry.** No card field may exist on any generated
   screen. Card entry happens inside the provider's hosted cashier, **PaymentSheet**, hosted
   fields, or (web) Payment Request — the app receives only a **token/charge id**.
2. **Secret keys are never in the app** (neither Dart source nor config). Only publishable keys /
   client secrets ship client-side; every secret-key or webhook flow assumes a backend (P9).
3. **IR-level enforcement**: the `[payments]` validator blocks entity fields named
   `cardNumber`, `cvc`, `pan`, `expiry…` unless typed `PaymentToken` — a hard gate, mirroring the
   `[money]` never-double rule (validate.ts). A `payment` capability therefore looks like
   `{amount, currency, method, token?, status, idempotencyKey}` — never raw card data.
4. **Penalty**: entered-cards apps take on PCI-DSS scope (SAQ A-EP or worse). The whole point of
   the port is that SAQ-A (hosted) is the default emitted posture.

---

## 5. Recommended generator design

### 5.1 The `PaymentGateway` port + DTOs (fully deterministic, emitted pure Dart)

```dart
// core/pay/payment_gateway.dart  (header: // [generated] generator=payments.v1 ownership=generated)
enum PaymentStatus { created, requiresAction, paid, failed, refunded }

class PaymentRequest {
  final Money amount;                 // integer minor units + ISO currency — reuse money.v1
  final String tenantId; final String actorId; // R1 RBAC convention like every repo call
  final List<PaymentMethodId> methods;         // ["mada","applePay","stcPay", ...]
  final String idempotencyKey;                 // tenant-scoped, generated or from the IR
  final String? statementDescriptor;
}

abstract class PaymentGateway {
  Future<PaymentIntent> createPaymentIntent(PaymentRequest req);
  Future<PaymentStatus> status(String providerTxnId);          // pull, for reconciling
  Future<PaymentReceipt?> verify({required String providerTxnId, String? idempotencyKey});
  Future<void> refund(PaymentRefundRequest req);               // full/partial, idempotent
  List<PaymentMethodId> availableMethods();                     // drives the method picker UI
}
```

Rationale (SOLID, mapped to existing lanes): the port is an **interface, not a provider** — DI
wires it (same pattern as the datasource/repository ports); it depends on `Money`/entities/types,
never on I/O; each real provider is a thin adapter behind it. GenContext/`dart.ts` emit it from the
new `payments` registry exactly like `persistence.ts`/`money.v1`.

### 5.2 `MockPaymentGateway` (the offline/demo truth)
- Deterministic in-memory store keyed by `idempotencyKey`: **same key → same outcome, always**.
- Fixed state machine `created → requiresAction → paid|failed → refunded`; outcome seeded
  deterministically (e.g. hash of `idempotencyKey` + a `MockPaymentPolicy`), overridable via
  `attributes.payments.mockOutcome` in the IR for goldens/CDP.
- Exposes `availableMethods()` per `attributes.payments.methods`.
- This is what makes **goldens, widget tests, and CDP flow tests green with real text, no sandbox
  and no network** — the exact F2 trick, applied to money.

### 5.3 Idempotency (offline-first, honest)
- **Client-side idempotency registry** (app-level, appended before any provider call — pairs with
  the MF6 outbox shape): `PaymentPend {idempotencyKey, requestHash, state, attempts, at}`. Replay
  returns the recorded result; the mock enforces it; real adapters map it on top of the provider's
  native key (Tap `reference.idempotent`, Stripe header) and, where the provider lacks one (moyasar),
  the local registry is the dedup authority (moyasar `metadata.order_ref` + verify-by-status).
- The **HTTP adapter (P9)** honors an `Idempotency-Key` header server-side (409 on replay) —
  matching P9's backend contract.

### 5.4 Amount codec (per-adapter)
Each adapter owns unit conversion into the provider's format: Stripe/Paymob int minor units (1:1),
moyasar halalas (1:1), Tap decimal-string ("25.50"). The `MockPaymentGateway` always uses
`Money(minorUnits: …)` directly. `Money`'s `forex`-adjacent math already guarantees rounding; the
codec is the only place a provider's units are touched.

### 5.5 IR + arch selection (deterministic, §5.2-style architecture decision)
```
attributes.payments: {
  provider:  "none" | "mock" | "moyasar" | "tap" | "stripe" | "hyperpay" | "paymob",
  methods:   ["mada","applePay","stcPay","card","googlePay","tamara","tabby"],
  mockOutcome?: "paid" | "failed" | "requiresAction",   // goldens/CDP only
  currency:  "SAR"
}
```
Rule: `provider` default `"none"` (no payment surface emitted, zero cost). Setting it to a real
provider **always also emits the port + mock**, so any generated app builds, runs and tests
offline; the real adapter activates only when a backend endpoint/config is present (union of the
"explicit override wins" persistence rule and the in-memory-fallback rule from `PERSISTENCE_ARCH`).

### 5.6 What the UI emits
- **Payment screen** (composition): order/reimbursement as `Money`, method picker from
  `availableMethods()` (order: mada → Apple Pay (device-gated) → STC Pay → cards → BNPL), status
  stepper (`created → requiresAction → paid`), retry wired to `idempotencyKey` (never double-charge),
  and a **receipt** card (`PaymentReceipt{txnId, amount, method, at, actorId}`).
- **Receipts/invoices now, payouts later**: `PaymentReceipt`/`PaymentLedger` entities are
  app-local and offline now; **payout file export (CSV / ISO 20022 camt/pain), reconciliation and
  refund-orders are P9-backend** work (they implied an ERP/accounting layer and signed files).

### 5.7 Validator gates (`validate.ts`)
- `[payments]` gate as described in §4 (no raw card fields; `provider` implies port+mock emitted;
  `methods` entries validated against a curated allowlist — mirroring the dependency allowlist).
- Existing `[money]`, `[oracle]` and secrecy gates apply unchanged.

---

## 6. Which adapters to ship first (recommendation, SA-first)

Ship **3 adapters now**, in this order:

1. **moyasar** — the SA default. SAMA-licensed, public pricing, simplest REST, official
   maintained Flutter SDK, halalas == `minorUnits` (codec is a no-op), native STC Pay/Apple Pay/
   mada. Lowest effort, highest SA demo value. *Adapt as adapter #1 and as the default real
   provider in SA samples.*
2. **Tap Payments** — the GCC default. One account across SA/UAE/KW/BH, mada/KNET/benefit, BNPL,
   marketplaces, and **native idempotency** that maps 1:1 onto the port. More demo surface than
   moyasar; slightly more effort (hash string = "needs backend" seam).
3. **Stripe** — the global/interop default and the best-documented **backend contract**.
   Include for where a customer wants US/EU-style cards or Stripe Connect marketplaces; explicitly
   **document mada/STC-Pay absence** so nobody misreads it as SA-ready. Despite SA-where-partial,
   its API shape is the one most teams already know — good for the `PaymentGateway` port's
   "exercise every route" story.

Deferred in order: **HyperPay** (enterprise SA, checkoutID server seam) and **PayMob** (fourth,
when an EGY-adjacent sample shows up), then STC-Pay-direct/SADAD (P9 backend lane).

---

## 7. Priority roadmap (what to emit now vs when a backend lands)

**Now (offline, deterministic, in `builder/src`):**
- `payments.ts` registry + `payments.v1` generator: the `PaymentGateway` port, `MockPaymentGateway`,
  DTOs, `PaymentLedger`/`PaymentReceipt` entities, idempotency registry, and the payment screen +
  receipt (iPhone goldens with real text).
- `AppAttributes.payments` + arch selection + `[payments]` validator gate.
- Adapter shells for **moyasar / Tap / Stripe** (compile offline; runtime downgrade to mock when
  endpoint/api-key absent) + their unit-codec tests + determinism samples.
- Validate on ≥2 sample apps of different types (e.g. Ledgerly expense-reimbursement + CRM
  invoice) per the capability contract; CDP drive the Pay→paid flow against the mock.

**P9 / backend-era (server-side, keeps pure-Dart PCI-safe):**
- Secret-key operations move to the generated NestJS module: `/payments` (create intent/charge,
  tenant-scoped, `Idempotency-Key` 409-on-replay), webhook endpoints with signature/HMAC
  verification, refund/void.
- Flutter `PaymentGateway` HTTP adapter behind the same port; MF6 outbox drives
  retry-on-recovery; `FakeRemoteDataSource` style fixtures keep tests offline.
- Payout file export (CSV/ISO 20022), reconciliation reports, SADAD/STC-Pay-direct lanes, ZATCA
  invoice hooks (pair with L3 audit/CSV).

**Acceptance checklist for the capability:**
- [ ] `provider:"none"` emits no payment code; `"mock"` emits port+mock+UI and passes offline.
- [ ] Real adapters compile in every sample without keys; tests use the mock; `validate.ts`
      passes; `npm run typecheck:builder` clean.
- [ ] No generated screen/entity can carry raw card data (validator enforced).
- [ ] Same idempotency key twice → identical result (mock test + port contract test).
- [ ] Goldens + CDP flow (Pay → paid) on ≥2 app types, SA-flagged methods render in order.

---

## 8. Sources & follow-ups

Marked indicative; re-verify fees/coverage at go-live (gateways change fast):
- Stripe availability & Apple Pay: docs.stripe.com; UAE Stripe site; SA direct path reports (2026);
  Stripe feature-availability-by-country.
- moyasar: docs.moyasar.com, pub.dev `moyasar` 3.0.5 (verified publisher), Moyasar site, Gulf SaaS
  Review 2026 KSA gateway rankings.
- Tap: developers.tap.company (Checkout Flutter SDK; **Idempotency in Payment Processing**), pub.dev
  `checkout_flutter`, `tap.company/en-sa/products/checkout`.
- HyperPay/PayTabs/Paymob/SADAD/Checkout.com: pub.dev plugin pages (`hyperpay_payment_sdk`,
  `flutter_paytabs_bridge`), PayTabs API hosts, Paymob dev portal + AI-skill repo, checkout.com
  mada page.
- Regional context: mada statistics + FAQs (mada.com.sa), SAMA licensing/news, ZATCA e-invoicing,
  SA gateway fee roundups (IJjad 2026, LogioLegion 2026), BNPL fee ranges (Tamara/Tabby).

Open items to confirm before implementing adapters: exact current fee tables (they move), Tap hash
string lifecycle (does it require a server round-trip even for tests?), moyasar webhook verification
shape, and whether Stripe's SA path now permits mada acquiring (track SAMA licensing news).

---

*End of report. Research only — no generator or Flutter code changed.*