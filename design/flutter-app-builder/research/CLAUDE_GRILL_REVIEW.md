# Independent adversarial review — the 3 spike reports + GRILL_NOTES.md

> Review date: 2026-08-16 · Reviewer: claude (independent of the report authors and of
> `GRILL_NOTES.md`'s self-grill). Method: read all three spikes + `GRILL_NOTES.md` +
> `ROADMAP.md`/`CAPABILITIES.md`, then spot-checked the reports' load-bearing claims against
> actual code (`builder/src/generators/auth.ts`, `repository_impl.ts`, `persistence.ts`,
> `arch.ts`, `types.ts`, `DESIGN.md` §18) rather than taking either the spikes or the self-grill at
> their word. Findings below note explicitly where a claim was **verified in code** vs **taken on
> faith** (and flagged unverified, same as the spikes' own web-search-disabled caveat).
> No `builder/src` or IR/generated-output files were touched. This doc plus additive edits to
> `ROADMAP.md`/`LEFTOVER_NOTES.md` are the only changes made.

---

## 1. COMPETITIVE_BENCHMARK.md

### Verdict
**Sound thesis, overconfident conclusions.** The "nobody occupies the middle" positioning holds up
— it's grounded in checkable `ROADMAP.md`/`CAPABILITIES.md` rows (verified: `MF1` features[] shape,
`MF2` tenant scoping in `repository_impl.ts`, `L1` money-as-int, all present in code, not just
planned). But the report's own `§2` confidence table rates vendor facts "Medium — directional,
unverified," and then `§5`–`§8` (the parts most likely to get copy-pasted into a deck) state vendor
absence-of-features as flat fact — "**none** shipped an oracle, a regen merge, an LLM write-ACL…"
— with no re-flagging of the uncertainty. That's a methodology bug: hedge in the intro, assert in
the conclusion. Anyone who reads only `§8` inherits false confidence.

### Grill
1. **Confidence laundering.** `§8.1`: "No 2026 entrant ships an oracle, a regen merge, or a
   write-ACL" is stated as settled fact. The report cannot know this without web search (which was
   disabled). This isn't a minor nit — it's the report's single most quotable line, and it's the
   least verified one.
2. **The steal-list (`§7.1`) mixes real steals with non-actions.** "Bolt: full file visibility —
   already ours" and "Replit: rollback — already superseded by region-preserving merge" aren't
   steals, they're validations dressed as steals. Only v0 (visual polish → `P11`) and Lovable
   (frictionless loop → `G1`–`G3`) are actually actionable. Folding all five into a roadmap slice
   dilutes the two that matter.
3. **G3 (live preview) demotion — `GRILL_NOTES.md` pushes to demote it wholesale; I only
   half-agree.** The self-grill's reasoning ("our product is for teams, not prompted consumers")
   is right for *chasing WebContainer-style in-browser preview* — that's genuinely not our audience.
   But it throws out the cheap half of G3 with it: a `flutter run -d web-server` watch-mode preview
   is, by the report's own words, "lowest-cost parity," and it has an on-thesis use the self-grill
   misses entirely — showing the IR→app live *during the human-approval review step*
   (`DESIGN.md` §9.4–9.5) makes the approval gate a better gate, not a demo toy. That's not
   "chasing a consumer feature," it's strengthening the trust boundary. Verdict: demote the
   WebContainer chase, keep a preview-in-review slice.
4. **G5 (deploy) — I'd go further than `GRILL_NOTES.md`'s "keep as roadmap option."** The apps this
   generator targets carry money (`L1`) and PII (tenant/employee data). "One-click public deploy"
   for those isn't just a product decision, it's a liability surface (who hosts, who holds secrets,
   TLS, data residency) that the "enterprise trust" positioning (`§8.4`) actively cuts against if
   done carelessly. Any public-deploy slice needs a security-review gate *before* it's a roadmap
   item, not bundled into the same sprint as G1/G2.
5. **Answering the task's own grill question — "is visual quality really the moat, or is it the
   demo-loop speed?"** Neither. The report already gets this right and I want to state it plainly
   rather than re-litigate: the moat (`§5`) is regen-safety + oracle correctness + trust boundary;
   G4 (visual quality) and G1–G3 (demo-loop speed) are both first-impression items on the *outside*
   of the moat. Confirmed, no correction needed — but worth saying explicitly since it's easy to
   conflate "the thing that loses first impressions" with "the thing that wins the sale."
6. **Doc-hygiene finding (tangential but real):** the scorecard's "Us" column cites roadmap phases
   for capabilities that are **already shipped in code**, not just planned — I verified `MF1`
   (`types.ts:81` `features: FeatureModel[]`), `MF2` (`repository_impl.ts` `_inScope`/
   `_stampTenant`), and money-as-int all exist today. `ROADMAP.md`'s own "Where we are" (line 8-23)
   doesn't mention any of these as done — it's stale relative to `CAPABILITIES.md`'s further-along
   sequence note and the actual code. Not this spike's fault, but it means the spike's "Us (phase)"
   column understates current state in places. Flagged to `LEFTOVER_NOTES.md`, not fixed here (out
   of scope for this review).

### Adopt / reject
| Item | Verdict | Why |
|---|---|---|
| G4 visual-quality gap → `P11` D2–D4 priority | **ADOPT** | correctly slotted; code confirms `P11`'s target surfaces exist |
| Steal-list: v0 polish, Lovable frictionless loop | **ADOPT** | the only two actionable entries |
| Steal-list: Bolt file-visibility, Replit rollback | **REJECT (not actionable)** | already-true statements about us, not steals |
| G3 blanket demotion (`GRILL_NOTES.md`) | **PARTIAL ADOPT** | demote WebContainer-chase; keep cheap watch-mode preview, reattached to the approval-review step |
| G5 "keep as roadmap option" | **ADOPT + STRENGTHEN** | add a security-review gate before any public-deploy slice |
| `§5`/`§8` absolute vendor claims | **REJECT AS WRITTEN** | re-flag as unverified estimates anywhere quoted outside this file |
| `§4` scorecard phase framing | **ADOPT WITH CAVEAT** | fine internally; needs a shipped-vs-planned legend before external use |

---

## 2. BACKEND_GEN_OPTS.md

### Verdict
**Sound — NestJS is the right call and the analysis is the strongest of the three reports** (most
rigorous requirements table, most honest fit-scoring, best original addition in the contract-parity
gate). Two real gaps survive the self-grill's two pushes: the "one module per feature is mechanical"
claim is asserted at 10/10 without addressing cross-feature relations, and the rule-engine
dual-eval risk (Dart client + TS server) is filed as a risk (`§9.7`) rather than promoted to a hard
acceptance gate the way `[oracle]`/`[money]` already are.

### Grill
1. **R1 "one module per feature" — `GRILL_NOTES.md` asks the right question and doesn't answer it;
   I looked.** `§5`'s claim ("one-to-one by construction... B1 emits module/entity/controller/DTO
   per feature from the same entity walk the Flutter side already uses") is true for
   *single-feature* entities. It's silent on cross-feature FK relations — e.g. an approvals feature
   reading an expenses feature's entity needs `imports:[TypeOrmModule.forFeature([Expense])]` in
   the approvals module plus an explicit `exports` from the expenses module. That's a second
   ownership graph the emitter must compute (who owns vs. who references), and it's exactly the
   kind of thing that silently becomes "one giant module" or broken DI if skipped. `MF1` already
   solved an analogous problem client-side (shared core + merged router/DI per `CAPABILITIES.md`)
   — the report should say "reuse that graph walk server-side," but it doesn't say anything. This
   is a real gap, not a nitpick: it's the difference between B1 landing clean and B1 landing with
   silently-wrong cross-feature wiring.
2. **The contract-parity gate (`§6.3`) is the best thing in this report — full adopt, no notes.**
   It's the direct server-side analog of `[oracle]`/`[money]`: diff the emitted OpenAPI spec against
   the IR-declared `DataSourceContract`; fail `VALIDATION PASSED` on drift. Checkable, cheap,
   fits the existing gate philosophy exactly.
3. **Rule-engine dual-eval — the report under-sells its own finding.** `§9.7` correctly identifies
   that a TS port of `RuleModel` eval creates two eval surfaces (Dart client, TS server) and
   correctly states "the IR/oracle remains authoritative" — but files this as a numbered risk, not
   an acceptance criterion. Two eval engines that can silently drift is exactly the failure class
   the oracle gate exists to prevent everywhere else in this generator. This should be a **named,
   blocking gate**: the TS port must reproduce the Dart oracle corpus's verdicts byte-for-byte
   (a cross-language golden test), or `[backend]` fails — same posture as `[money]` never silently
   coercing to `double`.
4. **Cross-report gap neither spike catches: Supabase-as-Auth (`AUTH_OPTS.md`) vs.
   `persistence.backend: baas` (this report).** `AUTH_OPTS.md` recommends Supabase as the first
   *auth* adapter. This report treats "Supabase" monolithically as a rejected `baas` persistence
   lane. Neither report states the obvious reconciliation: these are independent axes. A generated
   app can use Supabase **only** as the IdP (validating Supabase-issued JWTs via RS256+JWKS in the
   `P9` NestJS `TenantContext` guard) while `persistence.backend` stays `remoteApi` (NestJS/Postgres)
   — never touching PostgREST/RLS as the data layer. As written, a reader could conflate "adopt
   Supabase for auth" with "adopt the deferred BaaS lane." This needs to be stated explicitly
   somewhere both reports can be read against, or a future implementer will wrongly gate Supabase
   auth behind the BaaS deferral. **Verdict: no actual conflict, but an unstated reconciliation** —
   worth one explicit line in `ROADMAP.md`.
5. **Task's suggested grill — "would a BaaS lane conflict with P12 payments L0–L2?"** No. `P12`'s
   L0–L2 is explicitly backend-independent ("Does not need `P9` for L0–L2"), and this report's `§9.6`
   already states BaaS Edge Functions must never silently host L3+ payments. Already reconciled by
   both docs independently — confirmed, no edit needed here.
6. **Task's suggested grill — "is the offline-first + optional-backend position preserved?"**
   Yes, verified: R6 is stated as an explicit P9 requirement ("backend must stay OPTIONAL... behind
   ONE interface"), and the existing `P9` roadmap exit criteria already say "offline-first remains
   the default." No violation found.

### Adopt / reject
| Item | Verdict | Why |
|---|---|---|
| NestJS as `P9` default | **ADOPT** | R1–R7 analysis sound; code confirms the `features[]`/tenant precedent it leans on |
| Contract-parity gate (`§6.3`) | **ADOPT** | best original addition; extends `[oracle]`/`[money]` philosophy directly |
| BaaS deferred; Supabase-if-ever, Firebase rejected | **ADOPT** | consistent once explicitly scoped apart from Supabase-as-Auth-only (see grill #4) |
| Serverpod documented swap lane | **ADOPT (docs only)** | correctly hedged, no code implied |
| R1 "mechanical, 10/10" claim | **REJECT AS OVERCONFIDENT** | cross-feature relation/DI wiring unaddressed; needs a design note before B1 |
| Rule-engine dual-eval as a listed "risk" | **ADOPT + ELEVATE** | promote to a blocking cross-language golden-parity gate, not a risk note |

---

## 3. AUTH_OPTS.md

### Verdict
**Supabase-first is right. The report's own sequencing (port + mock is future work, "no code
today") is correct as written — and `GRILL_NOTES.md`'s push against that sequencing rests on a
factual error I checked in code.**

### Grill
1. **`GRILL_NOTES.md`'s Push on `§5` is wrong, verified against code.** It claims "our MF2 already
   emits the mock `AuthPort` + Session + persona login... the report's sequencing under-credits what
   MF2 shipped." I read `builder/src/generators/auth.ts` (126 lines): it emits a concrete `Session`
   singleton class (`class Session` at line 39) and a `kPersonas` list — **there is no
   `AuthProvider`/port interface anywhere in the file or the codebase.** `AUTH_OPTS.md §0`/`§5.1`
   correctly describes the port as something to *add*, not something that exists. The self-grill
   overclaims shipped state here; the spike's original sequencing should stand. (The underlying
   instinct — "expose the seam now" — is fine and I still recommend it as a near-term slice; only
   the "already shipped" framing is false.)
2. **Direct answer to the task's suggested grill — "does the Supabase RLS lane really lift our
   tenantId convention, or does it fork it?" It forks it, at one specific point.** Today's
   `tenantId` is generator-derived: `operations.ts::authPersonas` assigns tenants deterministically
   at *build time* over a static `TENANT_POOL`, and the client-side `Session.tenantId` (settable via
   `signIn`) is what `_inScope`/`_stampTenant` trust. RLS moves enforcement to the database via
   `auth.jwt()->>'tenantId'` — a **signed claim**, which means `tenantId` must now be provisioned
   into Supabase `app_metadata` at account-creation time via an admin operation (service-role key,
   server-only, per the report's own `§4.1` secrets rule). There is no such provisioning step in the
   generator today — personas are static, not created through a signup API. So RLS doesn't lift the
   convention unchanged; it **forks the assignment mechanism** from "generator-derived static demo
   persona" to "runtime admin-provisioned claim." This gap isn't mentioned in `§5`/`§6`'s adapter
   plan and should be an explicit acceptance item before any RLS SQL emission ships.
3. **Push `§6` Clerk-fourth — `GRILL_NOTES.md` asks to not rank it "last by fit alone"; I'd resolve
   it more sharply than "keep it documented."** The report's own effort estimates put Keycloak at
   **M–L** (JVM + Postgres, real infra) and Clerk at **S–M** (hosted SDK, zero local infra) — i.e.
   by the *same* "deterministic local boot, no docker" principle `BACKEND_GEN_OPTS.md`'s R7 uses to
   rank NestJS above Serverpod, Clerk is the lighter-weight option, not Keycloak. Keycloak's
   realm-per-tenant primitive is architecturally the cleanest of the four, but it genuinely belongs
   in the "P9-backend-era" bucket (the report's own `§6` bullet 3 already says this) precisely
   *because* its infra weight pairs naturally with the backend's infra, not because it's
   "more enterprise." **Concrete fix: reorder to Supabase → Clerk → Keycloak → Firebase-stays-4th-
   for-breadth**, i.e. ship Clerk third (matches the demo-velocity need `GRILL_NOTES.md` is actually
   pointing at, and it's cheaper to ship), defer Keycloak to when `P9` infra exists anyway.
4. **`[auth]` gate vs. the existing `[tenant]` gate — the report doesn't say whether `[auth]` is new
   or an extension.** It should be additive/new: `[tenant]` already checks generated code's
   `_inScope`/`_stampTenant`; `[auth]` would check provider allowlist + port/mock co-presence +
   claim-path validity — different artifacts, no overlap, but `ROADMAP.md`/`validate.ts`'s gate list
   should name both so the gate inventory stays enumerable.
5. **Task's suggested grill — "is the offline-first + optional-backend position preserved?"**
   Yes, verified: `§5.3`'s IR rule is explicit — `provider: none|demo` stays byte-identical,
   any real provider *always also* emits port + mock so builds/goldens/CDP stay offline. No
   violation found.
6. **Unverified vendor facts flagged per the task's instruction:** SAMA PIN+biometric banking norm
   (`§6`, `§8`), exact Supabase/Keycloak passkey maturity in their Flutter SDKs, Clerk's mobile-token
   vs. `__session` cookie story — all explicitly hedged by the report itself (`§8`) as
   "re-verify at go-live." No new unhedged claims found beyond what the report already flags.

### Adopt / reject
| Item | Verdict | Why |
|---|---|---|
| Supabase-first adapter | **ADOPT** | strongest tenant-primitive fit; verified against real `_inScope`/`_stampTenant` code |
| `AuthProvider` port + `MockAuthProvider`, "Now" slice, byte-identical for `provider:none\|demo` | **ADOPT** | correct as originally sequenced |
| `GRILL_NOTES.md`: "MF2 already emits the AuthPort" | **REJECT — factually wrong** | verified in `builder/src/generators/auth.ts`; no port exists today |
| "RLS lifts the tenantId convention" (as stated) | **REJECT AS STATED** | it forks the provisioning mechanism; needs an explicit acceptance item |
| Clerk ranked 4th "by fit alone" | **ADOPT WITH REORDER** | Clerk 3rd (lighter infra, matches R7-style determinism principle), Keycloak 4th (belongs in P9-era per the report's own words) |
| Biometric/PIN SAMA claim | **ADOPT WITH FLAG** | keep, already correctly marked unverified by the report |

---

## 4. Cross-report checks (task's suggested grill questions, consolidated)

| Question | Answer |
|---|---|
| Is visual quality the moat, or demo-loop speed? | **Neither** — both are first-impression items outside the moat (regen-safety/oracle/trust-boundary). Confirmed correct in `COMPETITIVE_BENCHMARK.md`, no correction needed. |
| Does Supabase RLS lift or fork the `tenantId` convention? | **Forks** — at the claim-provisioning step (static build-time persona → runtime admin-provisioned `app_metadata`). Not stated by `AUTH_OPTS.md`; now an explicit roadmap acceptance item. |
| Would a BaaS lane conflict with `P12` L0–L2? | **No conflict** — L0–L2 is backend-independent by `P12`'s own exit criteria; `BACKEND_GEN_OPTS.md §9.6` already forbids silent L3+ on an unconfigured backend. Already reconciled. |
| Is "one module per feature" actually mechanical? | **Partially** — true for single-feature entities, unaddressed for cross-feature FK relations. Needs a design note reusing `MF1`'s existing shared-core/DI graph walk, before B1. |
| Is offline-first + optional-backend preserved by every recommendation? | **Yes, across all three reports** — explicit acceptance lines exist or were verified in each (P9 R6, AUTH §5.3, COMPETITIVE's G1–G3 all stay local-first). No violations found. |

---

## 5. What's unverified (carried forward, not resolved by this review)

All three spikes ran with web search disabled; none of the vendor-specific facts below were
independently verified here either (no network access in this review pass):
- NestJS v11/v12, TypeORM 0.3.x, better-sqlite3 vs. PGlite maturity (`BACKEND_GEN_OPTS.md §10`).
- Supabase/Firebase/Clerk/Keycloak passkey/MFA/SSO feature maturity in their Flutter SDKs
  (`AUTH_OPTS.md §8`).
- Vendor incident specifics (Replit DB deletion, Lovable RLS misconfig) — directionally plausible,
  not tier-one sourced (`COMPETITIVE_BENCHMARK.md §2`).
Treat all of the above as still-open per each report's own "re-verify before build" language; this
review did not close them.

---

*End of review. Research only — no `builder/src`, IR, or generated-output files changed. Roadmap
edits made as a result of this review are in `ROADMAP.md` (P9, new "MF2-evolution", P11 cross-ref,
P12 cross-ref, new P14) and `LEFTOVER_NOTES.md` (dated section below).*
