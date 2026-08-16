# Backend generation options — research report (P9 spike)

> Research date: 2026-08-16 · Source: ROADMAP.md **P9** (NestJS backend generation) +
> `research/PERSISTENCE_ARCH.md` (persistence arch-selection pattern) + `DESIGN.md` §4/§17/§18/§19.
> Scope: **what backend target the generator should emit** so one IR produces a full-stack app —
> NestJS/Fastify/tRPC/Supabase/Firebase/Serverpod/dart_frog compared against P9's acceptance
> criteria, mapped onto this repo's determinism + offline-first + trust-boundary culture.
> Research + design only — **no code changes.** Version claims are hedged where the 2026 landscape
> is in motion; re-verify the pin list in §10 before B1.

## 0. Verdict (opinion, up front)

**Keep NestJS as the P9 target. This spike validates the ROADMAP's default and sharpens *why*:
NestJS is the option whose structural shape (decorator-metadata modules, controllers, DTOs,
guards, interceptors, pipes) maps 1:1 to what P9 demands, and whose determinism story (booting
with an in-memory SQL store, `npm test` + `tsc` from the existing Node toolchain) matches this
generator's "0% LLM, pure `(IR, ctx) → string`" core.** The alternatives split cleanly:

- **Fastify** — not a competitor but a *transport*. NestJS runs on `@nestjs/platform-fastify`;
  the "NestJS vs Fastify" framing is largely framework-vs-server, resolved by pinning the Nest
  adapter. A bare Fastify app means re-generating modules, DI, guards, and test harness that Nest
  already defines → more template surface, same result.
- **tRPC** — its core value (inferred end-to-end types) is **TS↔TS only**. Our client is
  Flutter/Dart; the Dart side must consume HTTP/OpenAPI regardless, so tRPC loses its reason to
  exist here. It is a supplement (REST + tRPC sidecar) at best, never the P9 shape.
- **Supabase / Firebase (BaaS)** — a *different `persistence.backend` lane* (`baas` per
  `DESIGN.md` §18), not a `remoteApi` substitute. Relational + `tenant_id` + Idempotency-Key +
  closed-rule-language eval + "Postgres-shaped in-memory store" for deterministic smoke all fight
  a hosted service. Supabase is the *better* BaaS (Postgres/RLS ≈ tenant convention) and Firebase
  the worst (NoSQL, no joins, no tenant_id convention) — but both are deferred lanes, not P9.
- **Serverpod** — the strongest non-TS contender: Dart both sides, model-driven codegen that
  emits the client too, and `Money`/rules already live in Dart. It would *beat* OpenAPI parity
  for the Flutter side. But it drags Postgres+Redis+Docker into every deterministic test, has a
  far smaller ecosystem, and makes us port the closed rule language to a second Dart surface.
  Worth a documented "if Dart-everywhere wins" swap lane, not the P9 default.
- **dart_frog** — minimal (Shelf file-routing), no ORM/auth/DI/validation/tests out of the box;
  the generator would hand-emit almost everything Nest gives free. Not an enterprise-shape fit.

**Net:** P9's B1–B4 slices stand as written, targeting NestJS + TypeORM + Postgres with an
in-memory SQL fallback for deterministic boot/tests. The spike's value-add is (1) a scored
selection rule mirroring `PERSISTENCE_ARCH.md` so `persistence.backend` is a *recorded
architecture decision*, (2) an OpenAPI **contract-parity gate** as the B4-style proof, and
(3) explicit "when to swap" lanes (Serverpod / BaaS) so the choice is reversible.

---

## 1. What P9 actually demands (requirements distillation)

P9's acceptance bullets, restated as checkable hard requirements. Every option below is judged
against these — an option that can't satisfy a bullet on the mechanical/codegen path fails P9
regardless of how nice its DX is.

| # | P9 requirement (ROADMAP.md) | Hard consequence for a backend target |
|---|---|---|
| R1 | Modular monolith from the same IR | Per-feature *module* must be a first-class, mechanically-emittable unit (module/entity/controller/DTO as decorator-metadata or equivalent); one module per IR feature. |
| R2 | REST-shaped DTOs + routes (`/expenses`, `/reports`, `/approvals`, `/policies`, `/budgets`, `/card-transactions`, `/exports`) | Path + payload derive from IR fields, not hand-writing. Target must make route+DTO emission a deterministic template (not inferred runtime magic). |
| R3 | PostgreSQL + tenant scope (`tenant_id` on every table; `TenantContext` JWT guard on every controller; repo reads/writes require tenant scope) | Must support (a) per-row tenant column, (b) a per-request guard reading a JWT, (c) repo-level tenant filtering. Mirrors Flutter `tenantId + actorId`. |
| R4 | `Idempotency-Key` honored on create/submit/approve/export → 409 on replay | Middleware/interceptor + unique `(tenant_id, idempotency_key)` store + 409 mapping — not built into any framework, so the *emitter* must produce it. |
| R5 | `FakeRemoteDataSource` in Flutter, shaped like backend DTOs | Backend DTO shape is the contract the Flutter fake mirrors; the two must be generated from one IR view of the envelope (§4). |
| R6 | Live path: Flutter repo impl switches in-memory ↔ HTTP behind one interface; offline-first default; S1 outbox for sync | Backend must expose plain HTTP (no exotic transport), stable envelope, and stay *optional* — the app is offline-first by default. |
| R7 | Backend: `npm test` green, `tsc` clean, boots + serves, HTTP/CDP smoke drives routes + tenant guard + idempotency | Must boot deterministically (in-memory store OK), run tests in CI with the existing Node toolchain, and be drivable over HTTP without hosted infra. |

R7 is the sleeper requirement: it forces a **deterministic local boot** (no hosted account, no
docker-in-CI, ideally no native-compile step). That single line disqualifies hosted BaaS and
drags Postgres-needing options toward an in-memory fallback — exactly the
`PERSISTENCE_ARCH.md` "real adapter where the platform supports it, in-memory fallback for
deterministic tests" pattern, now applied server-side.

## 2. The decision frame: this is an architecture decision, not a bolt-on

`PERSISTENCE_ARCH.md` locked the *client* persistence decision as `decideArchitecture(ir)`
returning `persistence: none|sql|nosql`, recorded in `plan.json` scoring. The backend choice is
the **server-side sibling** and belongs in the same lane:

- `DESIGN.md` §18 already declares `persistence: { backend: baas|localFirst|remoteApi, ... }`.
  P9 is the **`remoteApi`** case (self-hosted generated backend). Supabase/Firebase are the
  **`baas`** case. They are different *values of the same IR field*, selected deterministically,
  never mixed.
- Selection rule (sketch, to be finalised with `persistence.ts`-style scoring): defaults to
  `remoteApi` when the IR has cross-feature rules (`RuleModel`), relational entities, money, or
  idempotency-sensitive writes (approvals/exports); `baas` only when the app is document-shaped,
  cache-heavy, and rule-light (the `nosqlScore` analog); `none`/`localFirst` unchanged. P9 only
  implements the `remoteApi` lane; the `baas` value stays a documented, validator-rejected-or-
  later option.
- Rationale for recording it: the same anti-llm-gate logic as client persistence — the
  requirement agent may only *add attributes*; the deterministic scorer picks the lane
  (`DESIGN.md` §5.2).

The rest of this report evaluates the **`remoteApi` candidates** (NestJS, Fastify, tRPC,
Serverpod, dart_frog) plus the two `baas` candidates (Supabase, Firebase) so the `baas` lane is
scoped before it is ever scored.

## 3. Option deep-dives (2026 state of play)

### 3.1 NestJS — the P9 default (recommended)

- **Shape:** decorator-driven framework: `@Module({imports:[...]})` per feature, `@Controller()`
  with `@Get/@Post/@Put/@Delete`, `@Entity()`/TypeORM models, class-validator DTOs, DI via
  constructor injection. **Every artifact P9 names (R1/R2) is a named decorator-bound construct**
  — i.e. a deterministic emission target with a closed set of shapes. This is the single strongest
  reason it wins: the IR→Nest mapping is template-shaped, exactly like the Dart→Flutter mapping.
- **Version/tooling (2026):** v11 current stable (v12 in motion); Node 20+/22 LTS baseline;
  `emitDecoratorMetadata` + reflection = build-time constant, good for `tsc`-clean gates. ORM
  ecosystem: `@nestjs/typeorm` (TypeORM 0.3.x) is the canonical, `@nestjs/prisma` community,
  MikroORM/Drizzle via adapters. Validator: `class-validator` + `class-transformer` +
  `ValidationPipe` on the app. Docs: `@nestjs/swagger` emits an OpenAPI 3 spec *from the
  decorators* — this is our contract-parity hook (see §6.3).
- **R3 tenant scope:** one `TenantContext` guard (JWT → `tenant_id` claim → `ExecutionContext`
  → attach) applied globally or per-module; repo filters `tenant_id` from the guard's context.
  Mechanically trivial: the emitter writes the guard once (shared) + a `@UseGuards`/global
  registration, and every repo query gets `.andWhere('x.tenant_id = :tid', …)`.
- **R4 idempotency:** not built in. Emit a custom `IdempotencyInterceptor` + a
  `(tenant_id, idempotency_key)` unique column; on `unique-violation` → `409 Conflict`. The same
  shape the offline `PaymentPend` registry already uses (`PAYMENTS_OPTS.md` §5.3) — "mirrors the
  offline registry" is a literal goal, easy to match.
- **R7 determinism:** `@nestjs/typeorm` supports `type: 'sqlite', database: ':memory:'`
  (better-sqlite3, native but Node-ecosystem standard) — boots with a **Postgres-shaped
  relational in-memory store** for CDP smoke without a DB server; the store is swapped to
  `postgres` via one `config` file when deploying. Jest + supertest e2e is the default harness
  (`npm test` is the P9 gate verbatim).
- **Cons:** decorator magic (metadata must compile; swc/esbuild setups are loader-sensitive);
  a heavier runtime than Fastify (raw req/s — irrelevant at our scale); Nest version churn is the
  main maintenance tax; class-validator versions have had CVE churn (ReDoS-class) — pin + Dependabot.
- **Fit score (codegen): 10/10** for P9's exact bullet list. It is the option the ROADMAP named,
  and this spike found nothing that displaces it.

### 3.2 Fastify — a transport, not a Nest alternative

- **Shape:** minimal HTTP server, plugin system, JSON-Schema-first validation/serialization,
  `onRequest` hooks (auth/tenant), `fastify-type-provider-typebox|zod` for typed schemas,
  `@fastify/swagger` for OpenAPI. No DI container, no module system, no ORM, no test harness,
  no auth — you assemble each.
- **The key nuance:** `@nestjs/platform-fastify` lets NestJS run on Fastify as its HTTP adapter.
  So "NestJS vs Fastify" is largely **framework vs server**; the generator can emit Nest modules
  *and* pin the Fastify adapter if raw throughput or plugin richness ever matters. A bare Fastify
  app, meanwhile, forces the generator to re-emit modules/DI/guards/test-wiring that Nest already
  defines — more emitted surface, more ways to break determinism, zero P9 benefit.
- **Where it would win:** a "thin REST facade over an existing service" style IR, or if the repo
  later decides schema-first (JSON Schema/Zod) output is more deterministic than decorators. Not
  today's requirements.
- **Fit score: 7/10** — viable, but as "NestJS-on-Fastify adapter" not as a competing target.

### 3.3 tRPC — the wrong client kills the value proposition

- **Shape:** TS RPC, server `router`/`procedure` tree, **client types inferred with zero codegen**
  (v11 stable; v12 in development through 2025–2026). Server via Fastify/Express adapter.
- **The fatal mismatch:** its headline feature (inferred end-to-end types, no client codegen)
  exists only because client and server are both TypeScript. Our client is **Flutter/Dart** — it
  must talk HTTP and parse a JSON envelope anyway, and a Dart client can't `import` tRPC types.
  We'd be emitting `trpc-openapi`-generated REST *anyway*, so we keep all of tRPC's ceremony and
  none of its payoff.
- **R2 problem:** P9 names REST paths (`/expenses`, …). tRPC's native shape is procedure calls
  (`expense.create`), not resource paths — REST requires the OpenAPI layer, i.e. a second contract
  to keep in parity. Same for R3 (guard = middleware on a router — doable, but non-standard).
- **Where it would win:** a future TS-client product (web dashboard in React) sharing one spec
  with the Flutter app — then a tRPC *sidecar* next to the Nest REST API is genuinely nice. That
  is a supplement, not the P9 backend.
- **Fit score: 5/10** — good technology, wrong boundary for a Dart client.

### 3.4 Supabase — the better BaaS, still not P9

- **Shape:** hosted Postgres + **PostgREST** (REST from the schema — routes come from DDL, no
  controllers to generate), Auth, Realtime, Storage, **Edge Functions (Deno)**. Supabase CLI +
  local docker stack for dev; OpenAPI auto-served.
- **What genuinely fits:** `tenant_id` on every table maps beautifully onto **RLS policies**
  (`tenant_id = auth.jwt()->>'tenant_id'`), arguably cleaner than a guard. Entity → DDL emission
  is simpler than entity → `@Entity()` + controller (the schema *is* the API). The BENCHMARK.md
  note flags auth/RLS misconfiguration as the #1 generated-backend failure class elsewhere — so a
  strong deterministic RLS emitter would be defensible.
- **What breaks P9:**
  - **R4 idempotency:** no built-in `Idempotency-Key`; you implement a unique constraint (fine)
    *or* an Edge Function (Deno, new language surface).
  - **Rules:** the closed rule language (§19 decision tables/state machines/aggregates) would need
    a **Deno or Postgres/SQL port** — by far the hardest eval target of any option (SQL has no
    first-class state machines; Deno TS is a third emitter language).
  - **R7 determinism:** no "Postgres-shaped in-memory store" — local dev needs docker Postgres;
    CI needs the hosted service or the docker stack. Boot/smoke can't be a zero-dependency
    `npm test`. This fails P9's exit verbatim.
  - **Ownership:** the "generated backend" becomes a hosted project the owner must provision; the
    repo's trust-boundary ethos (no external side effects from a generation run) is violated.
- **Fit score: 6/10 as a `baas` lane** (relational BaaS done well), **2/10 for P9** — P9's
  acceptance assumes a self-hosted deterministic Node target.

### 3.5 Firebase — the wrong data model for P9

- **Shape:** Firestore/RealtimeDB (NoSQL document store) + Auth + Cloud Functions (Node 20) +
  Hosting; Emulator Suite for local deterministic dev; security rules for authz.
- **Why it's the worst P9 fit:** P9 is "**PostgreSQL** + `tenant_id` on every table" (R3). Firestore
  has no SQL, no joins, no relational foreign keys — the Ledgerly expense/report/approval graph is
  relational by nature; every join becomes a denormalized duplication the generator must manage.
  RLS-equivalent = security rules (fine, but rules are path/type filters, not row-scoped guards
  without extra query discipline). Idempotency via transactions only (no 409 semantics).
- **Where it shines:** document-shaped, realtime-sync, high-read consumer apps — which our IR
  scores *away* from (`PERSISTENCE_ARCH.md` nosqlScore wants document-shaped+cache, and even then
  `hive_ce` covers that lane client-side).
- **One genuine strength:** the **Emulator Suite is the best local-determinism story of any BaaS**
  (Firestore/Auth/Functions all run locally, no docker). If a `baas` lane is ever funded, this
  gives it a CI story Supabase lacks — but it cannot fix the relational mismatch.
- **Fit score: 4/10 as `baas` lane, 1/10 for P9.**

### 3.6 Serverpod — the strongest non-TS contender (documented swap lane)

- **Shape:** **Dart full-stack**: `serverpod` server + a generated typed **Dart client** from the
  same model files. Model-driven: define models (Dart classes / `podspec.yaml`), run
  `serverpod generate` → DB tables (Postgres) + server-side API + client API, migrations, auth
  module, testing scaffolding, admin/insights. Version: 2.x current (2.2 line), 3.0 on the
  horizon — moving target.
- **What genuinely fits this repo:**
  - **One IR → both sides with a *typed Dart client*** — this *beats* OpenAPI parity for the
    Flutter app: `FakeRemoteDataSource` could be generated to satisfy the exact generated client
    interface, and R5/R6 become near-free.
  - `Money`, the rule language's value objects, and the client model are all **already Dart** —
  no cross-language mapping for the VO layer (the one thing NestJS must re-derive).
  - State-machine effects (§19) eval in Dart mirrors the client's Dart eval — one port, not two.
- **What breaks the P9 path:**
  - **R7 determinism:** the server needs **Postgres + Redis** (Docker) even for tests
    (`serverpod test` spins a test DB). No in-memory store story like Nest's sqlite-`:memory:`.
    "Boots + serves + CDP smoke" becomes a docker-in-CI requirement — a real regression on R7.
  - **R3/R4:** tenant guard + idempotency are *not* built in — we'd generate them (fine), but the
    surface to emit (endpoints + middleware + DB column) is as large as Nest's with a smaller
    framework vocabulary to emit against.
  - **Toolchain:** a second package manager (pub), a second CLI (`serverpod`), version churn of a
    small-ecosystem framework; the repo's Node/npm test scripts don't reach into it.
  - **Rules port:** decision tables/aggregates/temporal eval must be ported to *server-side Dart* —
    medium effort, and it forks the rule engine into two Dart dialects (client vs server).
- **Verdict:** the "right answer" for a pure-Dart house; here it's a **documented swap lane**
  ("if Dart-everywhere wins over Node ops"), with the caveat that R7's deterministic-boot
  requirement must be relaxed or dockerized first.
- **Fit score: 8/10 as a philosophy, 6/10 for P9's R7-bound exit criteria.**

### 3.7 dart_frog — too minimal to generate *to*

- **Shape:** Very Good Ventures' minimal server on `shelf`, file-based routing (`routes/*.dart`),
  tiny API (context request/response), no ORM/auth/DI/validation/tests/migrations built in.
- **The problem is inverted:** Nest *gives* the generator a closed vocabulary to emit
  (`@Module/@Controller/@Entity/@Guard`); dart_frog gives almost nothing, so the generator must
  emit routing, DI, validation, authz, idempotency, AND a test harness — i.e. it would re-invent
  the framework inside the emitter, defeating the purpose of picking a framework at all.
- **Where it would win:** micro-service-style generated endpoints, or a "serverless-style" thin
  API — not a modular monolith with tenant+idempotency+policy verdicts (P9's shape).
- **Fit score: 4/10** for P9; would need a full harness emitted alongside every app.

## 4. Comparison matrix

| Dimension | NestJS | Fastify | tRPC | Supabase | Firebase | Serverpod | dart_frog |
|---|---|---|---|---|---|---|---|
| Type | Framework | Framework (transport) | RPC lib | BaaS | BaaS | Full-stack framework | Micro framework |
| Runtime | Node/TS | Node/TS | Node/TS | Hosted + Edge (Deno) | Hosted + Functions (Node) | Dart VM | Dart VM |
| IR→code surface | 1:1 decorator shapes | Assembled manually | Procedure tree + REST layer | DDL → REST auto | Schema → REST via rules? no | Model files → both sides | Routes + hand-everything |
| Rule-language eval target (R: closed §19) | TS (easy port) | TS | TS | SQL/Deno (hardest) | Node (medium) | Server Dart (medium) | Dart (medium) |
| R2 REST paths from IR | ✅ `@Controller()` | ✅ | ⚠️ needs trpc-openapi | ✅ PostgREST | ❌ doc store | ✅ endpoints | ✅ routes |
| R3 tenant_id + guard | ✅ guard + repo filter | ✅ onRequest hook | ⚠️ middleware | ✅✅ RLS (best) | ⚠️ rules ≠ row guard | ⚠️ generate it | ⚠️ generate it |
| R4 Idempotency-Key 409 | ✅ interceptor + unique col | ✅ plugin/plugin-emitted | ⚠️ layer | ⚠️ unique col / Edge fn | ❌ no 409 semantics | ⚠️ generate it | ⚠️ generate it |
| R5 FakeRemoteDataSource parity | OpenAPI parity gate | OpenAPI | OpenAPI via plugin | OpenAPI | rules/docs | **generated typed client** | OpenAPI by hand |
| R7 deterministic boot (no docker/hosted) | ✅ sqlite `:memory:` | ✅ sqlite | ✅ sqlite | ❌ docker/hosted | ✅ emulator (no docker) | ❌ Postgres+Redis | ✅ (bare) |
| `npm test`/`tsc` in existing toolchain | ✅ (default) | ✅ | ✅ | ❌ (deno/docker) | ⚠️ (functions) | ❌ (pub/dart) | ❌ (pub/dart) |
| Ecosystem maturity 2026 | Very high | Very high | High | Very high | Very high | Low–medium | Low |
| Offline-first interop (R6) | ✅ plain HTTP | ✅ | ⚠️ RPC over HTTP | ✅ REST | ⚠️ realtime leans online | ✅ typed client | ✅ |
| **P9 fit** | **10/10** | 7/10 | 5/10 | 2/10 (6/10 as baas) | 1/10 (4/10 as baas) | 6/10 (8/10 philosophy) | 4/10 |

## 5. Fit analysis vs P9 acceptance (per criterion)

Every criterion below is checked against the **recommended stack** (NestJS + TypeORM + Postgres,
in-memory SQL fallback):

- **R1 modular monolith:** `@Module()` per IR feature; feature folders mirror the Flutter
  `lib/features/<name>/` layout — one-to-one by construction, so cross-referencing the two trees
  in a review is trivial. B1 emits module/entity/controller/DTO per feature from the same entity
  walk the Flutter side already uses.
- **R2 REST DTOs/routes:** controller paths + class-validator DTO fields derive from the IR entity
  + action set (the same `list/detail/create/update` surface the Flutter repo contract declares).
  `@nestjs/swagger` turns that into OpenAPI for free — the parity artifact for B4.
- **R3 tenant scope:** global `TenantContext` guard (shared, emitted once) + per-repo
  `tenant_id` filters. Mirrors the Flutter `tenantId + actorId` convention in
  `apps/…/output/rca/` and `DESIGN.md` R1. `tenant_id` column added to every `@Entity()`
  automatically.
- **R4 idempotency:** `IdempotencyInterceptor` + `(tenant_id, idempotency_key)` unique index →
  409. Emitted only on idempotency-sensitive routes (create/submit/approve/export — derivable from
  the IR's rule/state-machine surface). Client-side registry shape matches `PAYMENTS_OPTS.md` §5.3.
- **R5 FakeRemoteDataSource:** the fake is *generated from the same DTO/envelope view* as the
  backend (`DESIGN.md` §4 data-layer emission rules: per-endpoint typed parser, declared envelope
  depth) so "shaped like the backend's DTOs" is structural, not hand-matched.
- **R6 live path:** Flutter HTTP repo impl implements the existing repository interface; the swap
  is a DI registration change (same pattern PERSISTENCE_ARCH uses for drift/hive adapters).
  Offline-first stays the default; outbox (S1) later just points its sync sink at these endpoints.
- **R7 gates:** `npm test` (Jest+supertest) + `npx tsc --noEmit` run inside the existing
  `npm run` pipeline; boot uses the sqlite `:memory:` store so CDP smoke needs no DB server.

The ROADMAP's B1–B4 slices are **unchanged** by this spike; it only adds two things to their
"done when": an explicit `persistence.backend` recording, and the OpenAPI contract-parity gate
(§6.3).

## 6. Determinism & codegen analysis

This section matters more than framework flavor: the generator's core tenet is
"deterministic core is 0% LLM; pure `(IR, ctx) → string`" (AGENTS.md). A backend target is
worth adopting only if every P9 artifact is a *closed, deterministic template*.

### 6.1 Mechanical mapping surfaces (what the emitter writes)

| IR concept | NestJS artifact | Template-ness |
|---|---|---|
| Entity (fields, types) | `@Entity()` class + columns | ✅ fully mechanical (money → int minor units, enum → `@Column('varchar')` + validator) |
| Entity + validation | class-validator DTO (`@IsNotEmpty`, `@IsInt`, `@IsEnum`, custom `@Money`-style) | ✅ mechanical; mirrors Flutter form validators |
| Repo action set | `@Controller` routes `GET/POST/PATCH/DELETE` per action | ✅ mechanical (same action walk as the Flutter repo contract) |
| Relationship / parent links (`<Parent>Id`) | FK column + relation | ✅ mechanical (same `<Parent>Id` convention) |
| Envelope (§4) | interceptor that wraps `{success, data}` at declared depth | ✅ one shared emitted interceptor |
| Business rule (§19) | TS port of `RuleModel` eval (decision table, state machine, aggregates) | ◐ — structural eval is mechanical; the *port* is one-time shared code, not per-app |
| Tenant + idempotency | guard + interceptor + unique index | ✅ shared emitted helpers |

### 6.2 The rule-language port problem (why BaaS ranks lowest)

`RuleModel`'s closed language (§19) currently evaluates in **Dart** (client). A backend means a
second eval target:

- **TS (NestJS/Fastify/tRPC):** the same switch/table structure compiles 1:1 to TS; shared helper
  emitted once per app. **Cheapest port.**
- **Dart server (Serverpod/dart_frog):** near-identical eval (same language) but a *new Dart
  runtime surface* to maintain; medium.
- **Deno (Supabase Edge) / SQL:** decision tables and state machines are not first-class in SQL;
  a Deno TS port is a third emitter language. **Most expensive; this alone keeps `baas` deferred.**

### 6.3 Contract-parity gate (new, suggested for B4)

The strongest determinism proof this repo can adopt: **emit the Nest app with `@nestjs/swagger`,
then a `[backend]` validator compares the generated OpenAPI spec against the IR-declared
`DataSourceContract`/envelope** (paths, methods, request/response shapes, envelope depth).
This is the server-side analog of the `[oracle]`/`[money]` gates: if the emitted backend and the
generated Flutter `DataSourceGenerator` parsers disagree on shape, `VALIDATION PASSED` fails —
mirroring `DESIGN.md` §4's per-endpoint typed-parser rule. It also makes "same IR, both sides"
verifiable rather than asserted. (Serverpod would make this moot — the generated client *is* the
proof — which is its strongest argument in §3.6.)

## 7. Offline-first interop story (per option)

- **NestJS/Fastify/tRPC:** plain HTTP + JSON envelope; the Flutter side already has the
  `ApiGenerator`/`DataSourceGenerator` shape. Outbox (S1) sync sink posts to the same endpoints;
  idempotency keys make retries safe. **Cleanest fit.**
- **Serverpod:** the generated typed Dart client *is* the interop; but realtime/caching features
  lean online, so offline-first still means using the local repo first and the client as a sync
  target. Fine, just heavier.
- **Supabase:** REST + RLS is online-shaped; offline-first needs the local client DB plus
  PostgREST sync — workable but duplicates the drift/hive adapter layer the client already has.
- **Firebase:** Firestore offline cache is genuinely good, but it's the *service*'s cache, not our
  repo interface — the generated app's repository contract would have to funnel through Firestore
  SDK APIs, coupling the Dart layer to a vendor SDK (violates the "swap impl, not interface" P9
  goal).

## 8. Recommendation + phased path

1. **P9 ships NestJS + TypeORM (Postgres) + in-memory SQL fallback**, exactly as the ROADMAP's
   B1–B4. B1–B3 land as written; B4 gains the OpenAPI contract-parity gate.
2. **Record the decision:** extend `arch.ts`/`scoring.ts` with `persistence.backend:
   remoteApi` (default when relational/rules/money/idempotent writes present), `baas` (rejected
   this phase → `[backend]` validator fails on it for now, "not yet supported" not "silent"),
   mirroring how `PERSISTENCE_ARCH.md` records `persistence: none|sql|nosql`.
3. **Emit the in-memory SQL store first** (sqlite `:memory:` via TypeORM) so R7's deterministic
   boot/CDP smoke has zero external deps; swap file points at Postgres for deploy. Validate driver
   choice (better-sqlite3 native vs PGlite WASM) before B1 — see §10.
4. **Documented swap lanes (no code now):**
   - **Serverpod lane** — if "Dart everywhere" ever wins over Node ops *and* R7 is relaxed to
     dockerized tests; the model-driven client generation is its unbeatable card.
   - **BaaS lane (Supabase-first)** — if an IR class emerges that is document-shaped,
     rule-light, and hosted-by-nature; RLS makes it the only defensible BaaS. Firebase stays
     rejected (relational mismatch).
   - **Fastify** is not a lane — it's a Nest adapter choice (`@nestjs/platform-fastify`) if
     throughput/plugins ever matter.
5. **Do not** let the backend generate a single line of client code via LLM, and do not let a
   "hosted" step enter the generation run: the trust boundary (AGENTS.md #5) and the
   "no external side effects from a generation run" property hold server-side exactly as they do
   client-side.

## 9. Risks & open questions

1. **TypeORM vs Prisma vs MikroORM (2026):** TypeORM is the Nest-canonical and gives the
   sqlite-`:memory:` boot; Prisma has no in-memory SQL and a heavier generate step; MikroORM is
   more esoteric. Re-verify before B1 — if TypeORM maintenance regresses, swap to a
   repository-interface change, not an app change (the in-memory impl insulates us).
2. **better-sqlite3 vs PGlite for the in-memory store:** better-sqlite3 needs node-gyp/native
   builds (CI risk); PGlite (WASM Postgres) has no native deps but its TypeORM driver story is
   less settled. Pick on CI-time risk, not peak fidelity; either satisfies "Postgres-shaped".
3. **Nest version churn + class-validator CVEs** (ReDoS class): pin versions, Dependabot, and
   keep DTO generation conservative (no user-supplied regex in emitted validators).
4. **tRPC's future v12** is irrelevant to us — do not plan around it; the REST-first shape is the
   contract, not the RPC flavor.
5. **Serverpod 3.0** may land mid-build — that's fine because it is not the P9 target; the swap
   lane documents the decision, it does not track every release.
6. **P12 interplay (payments):** `payments.intent` as a *backend capability* only exists when a
   P9 backend is configured. The BaaS lane must therefore never pretend to host L3+ payments —
   the `[payments]` validator's "no silent production fallback" invariant applies to a BaaS Edge
   Function too, which is another reason to defer the lane.
7. **Testing the generated backend's business rules:** the TS `RuleModel` port must be
   oracle-gated like the Dart one (a rule without an oracle stays blocked). Rule eval on the
   server is *verification*, not a new source of truth — the IR/oracle remains authoritative.

## 10. Next steps before B1 (verify, then build)

1. **Pin the stack (2026 re-verification):** NestJS stable minor + Node LTS; TypeORM vs
   Prisma/MikroORM decision; `@nestjs/swagger` current; better-sqlite3 vs PGlite for `:memory:`.
2. **Prototype the emitter surface on `expense.ir.json`** (B1): one module/entity/controller/DTO
   set, `npm test` + `tsc` clean, boot + `curl /expenses` smoke with the in-memory store.
3. **Add `persistence.backend` to `arch.ts`/`scoring.ts` + `plan.json`** with the `remoteApi`
   default and a `[backend]` validator rejecting `baas` "not yet supported" — mirrors
   `PERSISTENCE_ARCH.md`'s locked pattern and keeps the decision recorded, not assumed.
4. **Contract-parity gate spike:** emit OpenAPI from the prototyped app and diff it against the
   IR-declared `DataSourceContract`/envelope; confirm the diff is a stable CI check before B4.
5. Leave B3 (FakeRemoteDataSource + repo-impl switch) and B4 (end-to-end CDP flow) to the ROADMAP
   order; this spike only de-risks the target choice, which it concludes as: **NestJS, unchanged.**
