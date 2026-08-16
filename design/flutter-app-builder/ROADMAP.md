# ROADMAP — Flutter App Builder (v1 → beyond)

> Ground truth: DESIGN.md §25 phases. "v1 = end of Phase 3 (semantic lane + trust
> boundary)." This roadmap turns that into actionable, testable slices. The loop:
> implement → verify (typecheck/validate/flutter) → commit → (run + test in CFT).
> Each phase has entry + exit criteria. Lean; full narrative lives in DESIGN.md/PHASE_PLAN.md.

## Where we are (2026-08-16)
- 📥 `research/EXTERNAL_REVIEW.md` received (third-party review of `research/DESIGN_OPTS.md` +
  `research/PAYMENTS_OPTS.md`) — verdict: strong direction, convert to a capability-driven platform.
  Folded in below as P10–P13 (additive; does not reorder P1–P9).
- 📥 `research/EXTERNAL_REVIEW_2.md` received (second-round review of our
  `RESPONSE_TO_EXTERNAL_REVIEW.md`) — verdict: **accepted**, with one strongly-recommended addition
  (capability registry) and four refinements to already-accepted P10–P13. Folded in below as P10.5
  (new) plus refinements inline in P11–P13 (additive; P10–P13 unchanged in spirit).
- ✅ Phase 1 deterministic core — plan.json, region hash, lockfile tuple, arch/security/determinism gates
- ✅ Phase 2 pattern gen — component registry, 8-input scoring + `none` branch, forms, state machines
- ✅ Phase 3a semantic lane — BusinessRuleAgent (NL→`RuleModel`, schema+field cross-check, provenance, `extensionQueue`)
- ✅ Phase 3b trust boundary (core) — write-ACL, provenance, approve gate, oracle corpus + blocking coverage gate, decision-table `rows[]` + `daysSince>|<`
- ✅ P1 real screens — cards/avatar/spacing/hero (composition), list→detail navigation, data flow (cubit → use case → repository → in-memory impl)
- ✅ P2 CFT run/test — generated app builds to web, serves, drives in Chrome-for-Testing, `passed: true`
- 🚧 SOLID review fixes in flight (claude): #1 route collision, #2–#6 majors (composition wiring, component-registry bypass, collection naming, dart.ts/GenContext split), #11 generateApp extraction
- 🚫 Phase 4 — 3-way merge, reverse extraction (stub), full a11y, grammar-growth reconciliation

## Roadmap (next phases in priority order)

### P1 — Real screens (content-rich, data-backed UI)  ← NEXT
Entry: P0 done; sample apps boot but show `toString()` rows / 1 seeded item.
Exit (acceptance):
- List screen renders declared entity fields (title from identity/first String; subtitle from 1–2 secondary fields; key per row).
- Detail screen renders every field as a labeled value row (type-formatted: String/int/double/bool/DateTime/enum).
- State seeds 2–3 deterministic demo rows (not 1) so screens look real out of the box.
- All samples generate + validate; expense/todo apps `flutter analyze` clean + `flutter test` green (goldens updated).
Slices: N1 list+detail field rendering; N2 richer demo seed; N3 tests+goldens.

### P2 — Run + test in Chrome for Testing (malls-app pattern)
Entry: P1 done (screens worth asserting).
Exit (acceptance):
- A generated sample `flutter build web` succeeds and serves.
- CFT (headless, `:9222`) + browserpilot drives the served app: app boots, screen renders, declared text visible, zero console/network errors.
- Evidence (screenshot + report) under `docs/qa/<sample>/`. See `PLAN_RUN_TEST_CFT.md`.
Slices: T1 build+serve harness; T2 CFT driver + assertions; T3 evidence/report.

### P6 — Full-fledged generated app: CRUD + multi-DB + CDP flow tests + feedback loop  ← NEXT
Entry: SOLID fixes landed; generator is multi-screen + data-flow-wired.
Exit (acceptance):
- **CRUD sample app** generated end-to-end: full create/read/update/delete flows working (repo impl implements mutations; UI forms for create/edit + delete action; the seeded in-memory list actually mutates).
- **Persistence selection (§18): SQL + NoSQL.** `attributes.persistence` ∈ `none | sql | nosql` selects the generated data layer — SQL (sqflite) vs NoSQL (shared_preferences/objectbox) vs in-memory default; deterministic + validated.
- **CDP flow-test harness** (NOT in tooling yet — added here per owner): drives the served app over CDP through the whole flow (list → create → detail → update → delete) and asserts each step.
- **Flow goldens**: iPhone-size screenshot per flow step (not just the first screen).
- **Feedback loop**: CDP test results feed the implementing agent → RCA → fix → re-test, until the loop is green. Failures + RCA logged under `docs/qa/<sample>/rca/`.
Slices: F1 CRUD sample (repo mutation impl + forms + delete) + `transactions`→entity-derived collection; F2 persistence selection (sql/nosql generators + validator); F3 CDP flow-test harness + flow goldens; F4 feedback-loop wiring.

### P7 — Ledgerly-MVP slice (single expense feature, real domain depth)  ← NEXT after P6-F1/F2
Entry: CRUD + persistence landed; generator emits a working multi-screen single-feature app.
Exit (acceptance) — see `research/EXPECTED_GAPS.md` §3 (generator CAN produce this today):
- **Money-as-int**: money fields generated as integer minor units + ISO currency VO (never double).
- Expense entity + category/tax code; **CRUD + split** (amount/% across categories summing 100%).
- **Policy `PolicyVerdict`**: extend `RuleModel` eval to emit `{ruleId, severity(warn|require_justification|block), message, waivedBy?}` on save AND submit; oracle-gated.
- Submit + manager approve/reject (state machine); no batch.
- go_router + get_it/bloc + iPhone goldens; seeded SAR/USD demo data.
- **Audit events** (append-only `AuditEvent` list).
- **CSV export** (idempotent; exported items immutable).
- AR/EN + RTL via generated l10n.
Slices: L1 money-as-int + split; L2 policy `PolicyVerdict` (+ severity/waive); L3 approvals + audit + CSV export; L4 l10n/RTL + seeded demo.

### P8 — Multi-step workflow capability (general, framework-level)
Entry: P6-F1/F2 done; generator emits multi-screen apps. NOTE: this is a general capability
(any multi-step/guided/approval app — Ledgerly was just a sample), NOT a single product.
Exit (acceptance):
- **Wizard/stepper archetype**: new IR (`WizardStep[]` — step id, screen/form, per-step validation,
  next/back/conditional-skip) + a composition `wizard` template with progress indicator.
- **Flow state machine wired to the UI**: step-index state + `next()/back()/jumpTo()` actions bound
  to the screens; transition guards sourced from `RuleModel` (evaluate a rule as "can advance?").
- **Branching / role-gated / conditional steps**: transition conditions (role, policy verdict,
  amount threshold) — the approval-pipeline pattern.
- **Generic workflow sample** (e.g. request → review → approve, or a multi-step onboarding) that
  proves it, with CDP flow tests + iPhone flow goldens.
Slices: W1 wizard archetype + step IR; W2 flow state machine wired to UI (next/back/guards);
W3 branching + role gates; W4 workflow sample + CDP flow tests + goldens.

### P9 — NestJS backend generation (same IR → backend; full-stack from one spec)
Entry: MF1 multi-feature IR landed; offline-first Flutter app + in-memory repos are the runtime
path; remote datasource port exists (`DataSourceGenerator`). NOTE: same capability rule as P8 —
this is a general "IR → REST backend" capability (Ledgerly, HR, CRM, work-auth all get it), not a
single product. Fits the owner's "offline-first now, backend contract documented" state: this phase
TURNS the documented backend contract into generated code.
Exit (acceptance):
- **NestJS modular monolith generated from the same IR**: one module per feature
  (auth, expenses, approvals, …), matching the Flutter feature folders — entities become
  `@Entity()`/`@nestjs/typeorm` models + `@Controller()` REST controllers.
- **REST-shaped DTOs + routes**: `/expenses`, `/reports`, `/approvals`, `/policies`, `/budgets`,
  `/card-transactions`, `/exports` (Ledgerly contract) — path + payload derive from the IR, not
  hand-written.
- **PostgreSQL + tenant scope**: `tenant_id` on every table (R1 RBAC convention) + a
  `TenantContext` (JWT) guard on every controller; repository reads/writes require tenant scope —
  mirrors the Flutter `tenantId + actorId` rule.
- **Idempotency-Key** honored on create/submit/approve/export (409 on replay).
- **FakeRemoteDataSource** in the generated Flutter app: in-memory fixtures shaped like the
  backend's DTOs, so the app runs fully offline/demo AND against the real backend behind the same
  repository interface (swap impl, not interface).
- **Wire the live path**: generated Flutter repo impls can switch from in-memory to the NestJS
  backend via the existing datasource port; offline-first remains the default (in-memory web
  fallback, S1 outbox for sync).
- Generated backend: `npm test` green, `tsc` clean, boots + serves, smoke-driven via CDP/HTTP.
Slices: B1 IR→NestJS scaffold (module/entity/controller/DTO generators, project files, `main.ts`,
CORS, validation pipe); B2 tenant context + idempotency middleware + `tenant_id` schema;
B3 FakeRemoteDataSource in Flutter + repo-impl switch (in-memory ↔ HTTP behind one interface);
B4 end-to-end sample (generate Ledgerly's backend + Flutter app from one IR, drive both in CDP:
Flutter UI → HTTP → NestJS → Postgres-shaped in-memory store, golden the flow); B5 (new,
`research/BACKEND_GEN_OPTS.md` + adversarial review) OpenAPI contract-parity gate — diff emitted
`@nestjs/swagger` spec against the IR-declared `DataSourceContract`/envelope, fail `VALIDATION
PASSED` on drift, same posture as `[oracle]`/`[money]`; B6 (new) cross-language rule-eval parity
gate — the TS port of `RuleModel` eval must reproduce the Dart oracle corpus's verdicts
byte-for-byte (golden test), blocking, not a listed risk — a rule engine that can silently drift
between client and server is exactly the failure class the oracle gate exists to prevent elsewhere.
Dependency note: B4 shines after MF6/S1 (outbox) so offline edits sync to the backend; B1–B3 do
not need outbox.

**Pre-B1 design note (2026-08-16 review, `research/CLAUDE_GRILL_REVIEW.md` §2 grill #1):** R1's
"one module per feature" claim is mechanical only for single-feature entities. Cross-feature FK
relations (e.g. an approvals-feature entity referencing an expenses-feature entity) need an
explicit ownership graph — which feature's module `exports` the entity, which modules `import` it
via `TypeOrmModule.forFeature([...])` — before B1 lands, or the emitter silently produces either
one giant module or broken DI. `MF1` already solved an analogous problem client-side (shared core +
merged router/DI per `CAPABILITIES.md`); B1 should reuse that graph walk server-side rather than
invent a second one. Write this as a short design note before B1, not during it.

**Supabase-as-Auth vs. `persistence.backend: baas` (2026-08-16 review):** these are independent
axes, not the same decision. `research/AUTH_OPTS.md` recommends Supabase as the first **auth**
adapter (validating Supabase-issued JWTs via RS256+JWKS in the `TenantContext` guard); this is
compatible with `persistence.backend: remoteApi` (NestJS/Postgres, the P9 default) and does **not**
imply or require the deferred `baas` persistence lane (PostgREST/RLS as the data layer). State this
explicitly wherever P9 and MF2-evolution are read together so a future implementer doesn't gate
Supabase-for-auth behind the BaaS deferral.

### MF2-evolution — Auth capability (AuthProvider port + real adapters, added 2026-08-16)
Entry: MF2 (demo auth: `Session` + `kPersonas` + tenant-scoped repos) shipped in
`builder/src/generators/auth.ts`. Source: `research/AUTH_OPTS.md` + adversarial review
(`research/CLAUDE_GRILL_REVIEW.md` §3). Note: **no `AuthProvider`/port interface exists in code
today** — `auth.ts` emits a concrete `Session` singleton directly. The port below is new work, not
a refactor of something already shipped (corrects `research/GRILL_NOTES.md`'s claim to the
contrary, which the review verified against `auth.ts` and found factually wrong).
Exit (acceptance):
- **`AuthProvider` port + `MockAuthProvider`** behind today's `Session` facade: `signIn`/`signOut`/
  `token`/`isSignedIn`, `MockAuthProvider` reproduces today's persona behavior byte-for-byte.
  `provider: none|demo` emits exactly today's code; `guardPath()`, `_inScope`/`_stampTenant`, and
  the CRUD form keep reading `Session.instance` unchanged — no downstream consumer changes.
- **Claims → Session mapper** (`identity.dart`): pure, unit-testable `claimsMapper(provider, jwt)`
  resolving `tenantClaim`/`roleClaim` paths per provider. 0% LLM, deterministic.
- **`attributes.auth.provider|tenantClaim|roleClaim|secureSession|biometric`** IR attributes
  (additive to `AuthModel`); any real provider *always also* emits port + mock so every generated
  app builds/runs/goldens/CDP-tests fully offline — the real adapter activates only when runtime
  config is present.
- **`[auth]` validator gate** — new, additive to `[tenant]` (not a replacement): allowlists
  `provider` values, requires port+mock co-presence when a real provider is set, validates claim
  paths against the IR role vocabulary. `[tenant]` keeps checking `_inScope`/`_stampTenant`
  presence in generated code; `[auth]` checks the provider/claims layer — different artifacts, name
  both explicitly in `validate.ts`'s gate inventory.
- **tenantId-claim provisioning gap closed before RLS SQL ships** (review finding, `AUTH_OPTS.md
  §2.2` grill): Supabase RLS enforces `tenantId` from a *signed* claim (`auth.jwt()->>'tenantId'`),
  which must be provisioned into `app_metadata` at account-creation time via a server-side admin
  operation — today's `kPersonas` are static, generator-derived, with no such provisioning step.
  This is a **fork** of the tenantId convention, not a lift of it; document and close the
  provisioning story as an explicit slice before any RLS SQL emitter ships, not assumed away.
- **secureSession + biometric app-lock layer**: `flutter_secure_storage` token persistence +
  `local_auth` biometric-or-PIN unlock, `MockBiometric` for goldens/CDP — 100% client-side,
  emittable now, independent of any IdP adapter.
Slices: A1 `AuthProvider` port + `MockAuthProvider` + `identity.dart` mapper (zero behavior change,
byte-identical `provider: demo` output, all existing auth tests stay green); A2 `secureSession` +
`biometric` app-lock (mock storage/biometric for tests); A3 `[auth]` validator gate; A4 Supabase
adapter (first real provider) + tenantId-claim provisioning design + emitted RLS SQL per
tenant-scoped entity — P9/backend-era, ships alongside or after P9 infra exists; A5 Clerk adapter
(**reordered ahead of Keycloak** — review finding: Clerk is hosted-SDK/zero-infra, matching the
same "no docker in CI" determinism principle P9's R7 uses to prefer NestJS's in-memory boot; Clerk
is *lighter* than Keycloak, not just faster to demo); A6 Keycloak adapter — deferred to when P9
backend infra exists anyway (JVM+Postgres), not ranked lower for enterprise-fit reasons.

### P3 — v1 closure (trust-boundary polish)
Entry: P1–P2 done; v1 definition ("end of Phase 3") nearly met.
Exit: DESIGN §9.5 approval routing 2×2 (Reversibility × Blast-radius: Tier R batched/deferrable, Tier I solo/blocking) implemented in `approve.ts`; §9.4 two-party confidence (second-party ReviewAgent + threshold) wired for business rules; **per-state strategy honored** (selection never lies) + **strategy-fidelity gate**.
Slices: C1 approval routing 2×2; C2 two-party confidence; C3 honor per-state strategy (`sealed-events` template + per-state `none` fallback; thread `stateStrategy` into `generateState`); C4 strategy-fidelity gate (validate asserts plan.json state strategy == emitted `template=` marker; coupled-pair matrix §10.2 declared).

### P4 — Phase 2 gaps (deterministic polish)
Entry: P3 done (v1 shipped).
Exit: pagination/caching generator, persistence selection validator, second state-mgmt plugin (proves a 3rd coupled-pair cell on top of the C3 sealed-events template).
Slices: D1 pagination/caching; D2 persistence validator; D3 second plugin (only after P3-C3).

### P5 — Phase 4 (post-v1)
Entry: v1 + P4 shipped.
Exit: 3-way merge (§11.4) for scaffold migration; full a11y semantics generator + gate; grammar-growth reconciliation (§2.4); reverse extraction completed.
Slices: E1 3-way merge; E2 full a11y; E3 grammar reconciliation.

## External review integration (P10–P13, added 2026-08-16)

`research/EXTERNAL_REVIEW.md` reviewed `DESIGN_OPTS.md` + `PAYMENTS_OPTS.md` and recommended
converting the generator from "enhancement backlogs" into a **capability-driven platform**
(capability contract, agent contract, manifest, decision trace, payment levels/state-machine/
contract-tests, golden budget, UX linter). Its own reorder puts this platform layer (its "Phase A")
*before* design/payments work. We do **not** reorder P1–P9 — P6/P7 are already in flight and the
platform layer is additive metadata/tooling, not a generator rewrite — but P10 should start in
parallel now since it's low-risk (docs + a manifest emitter, no change to existing generator output
or goldens). P11 folds in `DESIGN_OPTS.md`'s already-scoped Slices D1–D4 verbatim (don't
re-plan them here) plus the review's UX-linter/pattern-engine layer on top. P12 folds in
`PAYMENTS_OPTS.md` §5–§7 ("Now" slice) as the flagship capability, applying the review's levels/
state-machine/contract-test rigor so a `provider: mock` app never looks more production-ready than
its actual capability level. P13 is process only.

`research/EXTERNAL_REVIEW_2.md` (second round, reviewing our `RESPONSE_TO_EXTERNAL_REVIEW.md`)
**accepted** P10–P13 as scoped above without reopening any of it, and added one strongly-recommended
new phase (**P10.5**, capability registry + dependency graph) plus four refinements folded inline
into P11–P13 below: the UX linter's three-tier split and the semantic-patterns-over-components rule
(P11), the no-silent-mock-fallback-in-production invariant (P12), and the machine-oriented mission
format (P13). None of P10–P13's original scope changes; P10.5 slots in after P10 in this doc because
it depends on P10-G1's capability-contract shape, but doesn't reorder anything already in flight.

### P10 — Generator platform foundations: capability contract, agent contract, manifest, decision trace, golden impact
Entry: none — independent of P6/P7 CRUD work; doc + tooling only, no change to existing generator
output, so it carries zero golden-churn risk and can run in parallel with anything in flight.
Exit (acceptance):
- **Capability contract format** documented (`CAPABILITY_CONTRACT.md`): id, version, inputs (e.g.
  `attributes.payments`), outputs (emitted file paths), dependencies (e.g. `money.v1`), validators,
  runtime (offline/deterministic), testing (unit/golden/CDP), fallback (e.g. `provider: mock`).
  Retrofit **one** existing capability (`money.v1` in `builder/src/generators/infra.ts`) as the
  worked example — documentation only, no code move.
- **Agent contract** (`GENERATOR_CONTRACT.md`, new file next to `AGENTS.md`): machine-checkable
  rules already implicit in `validate.ts`'s `archCheck`/secret/idiom gates, made explicit — never
  modify generated output; no provider logic in `core/`; money never `double` (already enforced);
  no secrets in generated artifacts; every new capability ships schema+validator+generator+unit
  tests+determinism test+fixture; goldens frozen unless a slice explicitly says they churn.
- **Generator manifest**: emit `.generator-manifest.json` per generated app (`generatorVersion`,
  `schemaVersion`, `capabilities[]`, `providers{}`, `features[]`) alongside existing output —
  additive file, answers "which capability produced this" without reverse-engineering.
- **Decision trace**: instrument the existing pattern-selection points (`scoring.ts`'s 8-input
  scoring, `composition.ts`'s archetype pick) to emit `{screen, decisions:[{rule, reason, result}]}`
  — logging on top of decisions already made deterministically, not new decision logic.
- **Golden impact report**: wrap the existing golden-regeneration step in `validate.ts`/test runner
  to summarize `{Changed, Added, Deleted}` per run, so a slice can't silently touch unrelated
  goldens.
Slices: G1 capability contract doc + `money.v1` worked example; G2 `GENERATOR_CONTRACT.md` (rules
extracted from current `validate.ts` gates, nothing new enforced yet); G3 manifest emitter; G4
decision trace on `scoring.ts` + `composition.ts`; G5 golden impact report in `validate.ts` output.

### P10.5 — Capability registry + dependency graph (added 2026-08-16, `EXTERNAL_REVIEW_2.md`'s one strongly-recommended addition)
Entry: P10-G1 (capability contract shape) exists. Doc + a read-only introspection layer over
capabilities that already exist as generators — no change to what's emitted, so same zero
golden-churn profile as P10.
Exit (acceptance):
- **Capability schema** documented (extends P10-G1's contract shape, doesn't replace it): id,
  version, dependencies, inputs, outputs, validators, tests, generators, providers, runtime.
- **Capability registry**, starting as a document (not new code) of capabilities that already
  exist, keyed off their real emitted `template=` markers — grounded in what's actually there:
  - `money.v1` — `infra.ts`'s `generateMoney()`, header literally reads `template=money.v1`.
  - `theme.v1` — `infra.ts`'s theme generator, same literal marker.
  - `persistence.v1` — `persistence.ts`, emitted as two templates today
    (`persistence_sql_drift.v1`, `persistence_nosql_hive.v1`); the registry entry groups both
    under one capability id, as-is, not renamed.
  - `navigation.v1` — `route.ts`, emitted as `route_none.v1` / `route_go_router.v1` depending on
    the arch decision; same grouping note as persistence.
  - `policy.v1` (L2) — `generators/policy.ts`, emitted as `policy_core.v1` (shared
    `PolicyVerdict`/`PolicySeverity`) + `policy_engine.v1` (per-entity `evaluate<Entity>Policy`).
  - `split.v1` (MF4) — `generators/split.ts`, emitted as `split_core.v1` (`SplitLine`,
    `validateSplit`, `SplitRowControllers`), one shared file per app.
  - This is a **documentation pass over existing generators**, not a new generator layer — no
    template is renamed or restructured to fit the registry; the registry's job is to describe
    what's there, including where one capability id spans more than one `template=` marker.
- **`builder capabilities list|inspect` CLI** — marked as a follow-on, **P10.5-G2**, and may ship
  minimal (e.g. `list` prints the registry's ids/versions; `inspect <id>` prints its declared
  inputs/outputs/deps read straight from the registry doc/JSON — no new analysis). Not required for
  P10.5's exit; the registry document itself is the deliverable P11–P13 can start referencing.
- **Capability dependency graph** (machine-readable): `payments.v1 → money.v1, security.v1,
  state-machine.v1`; `checkout.v1 → payments.v1, money.v1, navigation.v1` (payments.v1/checkout.v1
  don't exist yet — P12 will introduce them against this graph once it does). This is the same
  conceptual shape `builder/src/regen.ts`'s `affected(ir, changed)` already computes **today**, just
  one level up: `regen.ts` walks a per-artifact dependency map (`entity → model/repository/state/
  screen`, built in its own `deps()`) to answer "if entity X changes, what's the affected set?";
  P10.5's capability graph is the same BFS-over-a-dependency-map pattern applied to *capability ids*
  instead of *artifact instances*, so a future `regen.ts`-style query can answer "if money.v1
  changes, which capabilities/artifacts are affected?" — reusing the existing algorithm, not
  inventing a new one.
Slices: R1 capability-schema doc (id/version/deps/inputs/outputs/validators/tests/generators/
providers/runtime), extending P10-G1's contract shape; R2 capability registry doc — the six
existing capabilities above, described from what's emitted today; R3 capability dependency graph
doc + convention note referencing `regen.ts`'s `affected()` as the existing per-artifact analog;
P10.5-G2 (follow-on, may be minimal) `builder capabilities list|inspect` CLI reading the registry.

### P11 — UX pattern engine + design-system slices (absorbs `DESIGN_OPTS.md` D1–D4, adds UX linter)
Entry: independent of P10 (design work doesn't need the manifest/contract yet), though P10-G1's
capability-contract shape is worth having before U3 formalizes the pattern-selection pipeline.
Cross-ref (2026-08-16, `research/COMPETITIVE_BENCHMARK.md` §7.1 steal-list, adversarial review):
D2–D4's visual-quality push is independently confirmed as the field's one genuine product-quality
gap (v0/FlutterFlow default polish) — no new slice added here, this phase already covers it; the
steal-list's other two entries (Bolt file-visibility, Replit rollback) were rejected as non-actions
in the review, already true of us.
Exit (acceptance):
- **D1–D4 land exactly as scoped in `DESIGN_OPTS.md` §10** (theme wiring incl. `buildTheme()` fix +
  dark mode; CTA+feedback; composition breadth incl. max-width/tonal surfaces; motion+a11y states) —
  referenced, not re-planned; that doc is the source of truth for these slices' detail.
- **UX pattern engine, formalized**: name the existing `scoring.ts` 8-input scoring +
  `composition.ts` archetype selection as an explicit rule catalog (IR → semantic analysis →
  pattern selection → composition → component selection) — this documents/labels current logic so
  future rules extend a named pipeline instead of growing ad hoc `if/else` in `screen.ts`; not a
  rewrite of working code.
  - **Refinement (`EXTERNAL_REVIEW_2.md`): semantic patterns over components.** State explicitly,
    as the rule this pipeline exists to enforce, that every extension to the catalog is asked "what
    semantic pattern is missing?" (`entity with lifecycle` → Header/Status/Primary action/Metadata/
    Timeline/Secondary actions), never "what component should we add?" (Card/Chip/Button/List come
    *after*, as the pattern's realization) — the failure mode this heads off is scoring.ts/
    composition.ts growing a new special case per component request instead of a new named pattern
    that then picks components the way the existing ones already do.
- **UX linter gate**: new `[ux]` validator in `validate.ts` covering the mechanically-checkable
  subset of the review's UX001–UX012 that this generator already has the data for — touch target
  <44px, missing empty/error state, contrast (reuses the a11y contrast check `DESIGN_OPTS.md` §7
  already calls for), heading hierarchy. Others (primary-action-below-fold, excessive nesting)
  deferred — they need the Visual QA/CDP loop (P6-F3/P13), not static IR analysis.
  - **Refinement (`EXTERNAL_REVIEW_2.md`): three tiers, not one flat gate.** Split UX001–012 into
    **Hard errors** (must never ship — overflow, invalid touch target, missing required a11y label,
    broken RTL, secret leakage, invalid payment state, invalid navigation — these fail
    `[ux]`/`VALIDATION PASSED` the same way `[money]`/`[oracle]` already do), **Warnings** (may be
    intentional — too many actions, dense screen, CTA below fold, long form, low hierarchy — printed
    but non-blocking), and **Advisory** (can improve, doesn't block — could group fields, reduce
    nesting, better hierarchy, progressive disclosure — informational only). Only Hard errors gate
    `VALIDATION PASSED`; the linter must never block a generation run on a Warning or Advisory item.
Slices: U1 land D1+D2 per `DESIGN_OPTS.md`; U2 land D3+D4 per `DESIGN_OPTS.md`; U3 document the UX
pattern-engine rule catalog (no behavior change) + the semantic-patterns-over-components rule; U4
`[ux]` validator gate wired into `validate.ts`, three-tiered (Hard/Warning/Advisory) from the start
— touch target, empty/error state, contrast, heading hierarchy classified as Hard; the rest of
UX001–012 not yet mechanically checkable land as Warning/Advisory stubs, not silently dropped.

### P12 — Payments capability: levels, state machine, contract tests (absorbs `PAYMENTS_OPTS.md` §5–§7 "Now" slice)
Entry: P10-G1 (capability contract shape) should exist first — payments is the review's own
flagship "MISSION" example (§ Strongest recommendation) and the biggest single generator addition
in either source doc, so it's the capability most worth contract-shaping before writing code.
Does not need P9 (backend) for L0–L2; L3+ explicitly waits for P9 per `PAYMENTS_OPTS.md` §7.
Cross-ref (2026-08-16 adversarial review, `research/CLAUDE_GRILL_REVIEW.md` §4): checked whether a
deferred `baas` persistence lane (`BACKEND_GEN_OPTS.md`) could conflict with L0–L2 here — it can't.
L0–L2 is backend-independent by this phase's own exit criteria, and `BACKEND_GEN_OPTS.md §9.6`
already forbids silent L3+ execution on an unconfigured/BaaS backend. Already reconciled by both
docs independently; no edit needed to this phase's substance.
Exit (acceptance):
- **Payment capability levels** L0 none (default, zero artifacts) · L1 mock UI · L2 provider
  checkout (adapter shells) · L3 backend intent · L4 webhooks+reconciliation · L5 refunds ·
  L6 payouts — derived from `attributes.payments.provider` + whether a P9 backend is configured, so
  a generated app never *looks* more capable than what's actually wired (review §10/§Strongest rec).
  This phase ships L0–L2 only; L3–L6 are P9-era per `PAYMENTS_OPTS.md` §7.
- **Refinement (`EXTERNAL_REVIEW_2.md`): no silent mock fallback in production — hard compiler
  invariant.** The adapter-shells-downgrade-to-mock pattern is fine for dev, dangerous in prod: dev
  (provider unavailable → explicit mock allowed, opt-in flag only, never the silent default) vs.
  production (provider unavailable → **FAIL CONFIG VALIDATION**, not a silent `MockPaymentGateway`
  swap — the failure mode this forbids is a misconfigured prod build where the UI says "Payment
  successful" while nothing happened). Concretely: **if the backend capability `payments.intent` is
  absent (no P9 backend configured, or `attributes.payments.provider` unset/misconfigured in a
  non-dev build), the generator MUST NOT emit production payment-execution code** — this is an
  explicit P12 constraint, not left implicit in "adapter shells" language. Same posture the
  generator already takes elsewhere (`[money]` never silently coerces to `double`; a missing oracle
  fails `[oracle]` rather than shipping unverified) — payments gets the equivalent hard-fail
  discipline, not a softer one.
- **`PaymentGateway` port + `MockPaymentGateway` + DTOs** exactly per `PAYMENTS_OPTS.md` §5.1–5.6:
  new `payments.ts` registry + `payments.v1` generator (mirrors how `persistence.ts`/`money.v1`
  already do real-adapter-with-in-memory-fallback), `Money`-based `PaymentRequest`, idempotency
  registry, method picker + status stepper + receipt UI.
- **Payment state machine as a first-class artifact**: `created→requiresAction→processing→paid`;
  `created|requiresAction|processing→failed`; `paid→refunded|partiallyRefunded` — reuses the
  existing `generators/state_machine.ts` pattern already used elsewhere in the generator; validator
  rejects any emitted/mocked transition outside this graph.
- **Provider capability matrix**: `{provider, capabilities:{mada, applePay, stcPay, googlePay,
  bnpl, refund, partialRefund, subscriptions}}` per provider, driving the method-picker order
  deterministically (`PAYMENTS_OPTS.md` §5.6 order: mada → Apple Pay (device-gated) → STC Pay →
  cards → BNPL).
- **`PaymentGatewayContractTest`**, run against the mock and every adapter shell: idempotency
  deterministic, different key → different payment, requiresAction/success/failure/refund/partial-
  refund paths, invalid amount rejected, currency mismatch rejected.
- **`[payments]` security validator** in `validate.ts`: blocks entity fields named
  `cardNumber`/`cvc`/`pan`/`expiry…` unless typed `PaymentToken`; blocks secret-key-shaped strings
  in generated Dart — mirrors the existing `[money]` never-double gate. Also enforces the no-
  silent-mock-fallback invariant above: fails validation (not a warning) if a build declared
  production-intent (non-dev) with `payments.intent` absent and still emitted payment-execution
  code rather than a config error — the same "loud failure over silent wrong output" posture
  `[money]`/`[oracle]` already hold this generator to.
Slices: PAY1 `payments.ts` registry + port + `MockPaymentGateway` + DTOs, `provider: none|mock`
(`PAYMENTS_OPTS.md` §7 "Now" step 1); PAY2 state-machine artifact + impossible-transition validator;
PAY3 capability levels L0–L2 wired to `attributes.payments` + provider capability matrix; PAY4
adapter shells in `PAYMENTS_OPTS.md` §6 order (moyasar → Tap → Stripe) + `PaymentGatewayContractTest`
per adapter; PAY5 `[payments]` security validator; PAY6 CDP Pay→Paid flow test + iPhone goldens on
≥2 sample app types of different domains (per the CAPABILITIES.md "≥2 app types" acceptance rule).

### P13 — Specialized agent roles + strict workflow gate (process only, no generator code)
Entry: P10 (capability contract + agent contract exist to hand agents a bounded mission); P10.5's
registry gives the mission format below something concrete to verify against once it exists.
Exit (acceptance):
- Document the review's specialized-agent roles (Architect, Generator Engineer, Validator Engineer,
  Test Engineer, Visual QA Agent, Adversarial Reviewer, Integrator) as capability-sized **mission
  briefs**, mapped onto this project's actual tooling (`opencode/deepseek-v4-pro`, the CFT/CDP
  driver, the oracle gate) — a workflow doc, not new infrastructure.
  - Worked example: a `payments.v1` mission brief (the review's own example) with success criteria
    (schema exists; `provider:none` → zero artifacts; `provider:mock` → deterministic flow; port +
    state machine + idempotency + `[payments]` validator all enforced; adapters compile + pass
    `PaymentGatewayContractTest`; works offline; CDP Pay→Paid passes; no unrelated golden changes;
    `npm run typecheck:builder` passes) — this becomes the template every later capability mission
    copies.
  - **Refinement (`EXTERNAL_REVIEW_2.md`): mission format consumes capability contracts.** Adopt
    the review's machine-oriented brief shape as the literal template AG1 emits — not prose, a
    checklist an agent (or a future P10.5-G2 CLI) can parse and tick off:
    ```
    Capability: payments.v1  Version: 1  Scope: L0–L2 only
    Required: [ ] schema [ ] port [ ] state machine [ ] validator [ ] mock
              [ ] provider shells [ ] contract tests [ ] determinism [ ] manifest [ ] decision trace
    Forbidden: production backend, real provider secrets, silent production fallback, unrelated UI changes
    Done when: builder verify payments.v1 · builder generate fixture/payments · flutter analyze ·
               flutter test · CDP create→requiresAction→paid · goldens unchanged except declared
    ```
    The `Capability`/`Version` line and the `Required` checklist items are meant to be looked up
    against the P10.5 capability registry (id, version, deps, inputs/outputs) once it exists, so a
    mission is *verifiable* against a machine-readable source, not just self-reported prose — this
    is why P10.5 is worth having before missions get written for capabilities beyond the
    `payments.v1` worked example. `Forbidden` lines make the no-silent-mock-fallback invariant (P12
    refinement above) and other hard constraints explicit per-mission, not just implicit in the
    phase doc.
- Staple the review's `DISCOVER → PLAN → SCHEMA → GENERATE → VALIDATE → TEST → VISUAL QA →
  ADVERSARIAL QA → REVIEW` gate onto the existing "Standing loop" below as an explicit Definition-
  of-Done addendum — codifies "code compiles is not done" without changing what the loop already
  does.
Slices: AG1 mission-brief template (machine-oriented Capability/Version/Scope/Required/Forbidden/
Done-when shape) + `payments.v1` worked example; AG2 stage-gate checklist added to Definition of
Done.

### P14 — Demo-loop parity (competitive steal-list, added 2026-08-16)
Entry: independent of P9–P13; low-cost, additive, does not touch determinism or the trust boundary.
Source: `research/COMPETITIVE_BENCHMARK.md` §6/§7.1 G1–G3 + adversarial review
(`research/CLAUDE_GRILL_REVIEW.md` §1). Purpose: close the "how do I see it / deploy it" first-
impression gap the competitive benchmark identified, without chasing the two things reviewed and
rejected (in-browser WebContainer-style preview; unguarded public one-click deploy).
Exit (acceptance):
- **G1 thin client + demo persona** around the existing `builder/src/server.ts` (`POST
  /requirements`, `/generate/full`, already running at `:8787`) — "describe → approve → app" feels
  like one flow instead of separate CLI/API steps. Does not touch the approve-gate itself (`DESIGN`
  §9.4–9.5 stays as the human step, not bypassed).
- **G2 watch-mode preview, reattached to the approval-review step** (review refinement — do NOT
  build this as a generic consumer preview): `flutter run -d web-server` on regenerate, surfaced
  during human review of an approve-gate diff, so the reviewer sees the IR→app live while deciding.
  Cheapest parity item per the source report; strengthens the trust boundary rather than
  competing with it.
- **G3 deploy manifest / `deploy.sh` per app** — Tailscale expose stays the default, private demo
  channel. Any public-deploy option requires a **security-review gate first** (who hosts secrets/
  PII, TLS, data residency) — this is a review addition beyond the source report's "keep as
  roadmap option": public deploy for apps carrying money (`L1`) and tenant/employee PII is a
  liability surface, not just a UX nicety, and must not ship without that review.
Slices: W1 thin API client + demo persona wrapper (G1); W2 approval-review watch-mode preview (G2,
scoped to the review step only); W3 deploy manifest/`deploy.sh`, Tailscale-default (G3); W4 (gate,
not a generator slice) security-review checklist that must pass before any public-deploy option is
added to W3.

## Standing loop (never stops between phases)
```
slice → implement (claude in tmux when available, else me) → verify
(typecheck:builder + index/validate per sample + flutter analyze/test) → small commit
→ CDP flow gate (P6-F3): drive served app through the whole flow + assert + flow goldens
→ failures feed the agent (RCA → fix → re-test) until green → repeat
```
Rules: additive-only; small commits; never bypass oracle/approval gates; SOLID;
LLM model = `opencode/deepseek-v4-pro`; agents read AGENTS.md + briefs in `~/temp/opencode/flutter-app-builder/`.

## Definition of Done per phase
1. `npm run typecheck:builder` clean.
2. Every affected sample: generate → `validate.ts` = `VALIDATION PASSED` (incl `[oracle] PASS`).
3. Sample app: `flutter pub get && flutter analyze && flutter test` green.
4. P2+: app builds to web, serves, and the CFT driver asserts boot + render + no console/network errors.
5. P6+: the CDP flow test drives list → create → detail → update → delete, asserts each, captures an iPhone flow golden per step; test results feed RCA until green.
6. P9+: generated NestJS backend — `npm test` green + `npx tsc --noEmit` clean; boots, serves, and an HTTP/CDP smoke drive asserts routes + tenant guard + idempotency.
7. One logical slice per commit; HANDOFF kept lean; history → `context_history.md`.
8. P10+: every new capability ships schema + validator + generator + unit tests + determinism test
   + fixture (agent contract, P10-G2); Golden Impact report (P10-G5) shows no unrelated golden
   changes; new capability missions follow the P13-AG1 brief template and its DISCOVER→…→REVIEW
   stage gate.
