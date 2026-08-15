# What can be done — timeline (now → near → short → mid → long)

> Grounded in `research/EXPECTED_GAPS.md` (Ledgerly spec vs generator) + `ROADMAP.md`.
> Horizons: **Now** = in flight/this iteration · **Near** = next 1–2 slices (this week) ·
> **Short** = 2–4 weeks · **Mid** = 1–3 months · **Long** = 3+ months (post-v1).
> Legend: ✅ done · 🚧 in flight · 🎯 planned · ❌ not scoped (needs a new slice).
> v1 = P3-C2. Persistence stack = Drift (sql) + hive_ce (nosql) + in-memory web fallback.

| Work stream | Now | Near (1–2 slices) | Short (2–4 wks) | Mid (1–3 mo) | Long (3+ mo) |
|---|---|---|---|---|---|
| **CRUD app** | 🚧 F1 (repo impl create/update/delete + forms + delete; collection name derived) | ✅ verify + commit | — | — | — |
| **Persistence (SQL/NoSQL)** | 🚧 F2 (arch-driven selection: Drift SQL + hive_ce NoSQL, in-memory web fallback) | ✅ unit-verify adapters | — | — | — |
| **CDP flow tests + flow goldens** | 🎯 F3 harness (drive list→create→detail→update→delete, iPhone golden per step) | 🎯 F3 wire + assertions | ✅ loop green | — | — |
| **Feedback loop (test→RCA→fix)** | 🎯 F4 design | 🎯 F4 wire (RCA logs under docs/qa/<sample>/rca) | ✅ loop active | — | — |
| **Money-as-int + split** | ❌ | 🎯 L1 (integer minor units + ISO VO; amount/% split) | ✅ | — | — |
| **Policy `PolicyVerdict`** | ❌ | 🎯 L2 (severity warn/justify/block + waive, eval on save+submit, oracle-gated) | ✅ | — | — |
| **Approvals + audit + CSV export** | ❌ | ❌ | 🎯 L3 (approve/reject state machine, append-only AuditEvent, idempotent CSV) | — | — |
| **l10n AR/EN + RTL + seeded demo** | ❌ | ❌ | 🎯 L4 (.arb + RTL + mixed SAR/USD seed) | — | — |
| **Multi-step workflow (wizard/approval)** | ❌ | ❌ | 🎯 P8-W1 wizard archetype + step IR | 🎯 P8-W2/W3 flow state machine wired to UI + branching/role gates | 🎯 P8-W4 generic workflow sample + CDP flow tests |
| **Sealed-events state strategy** | ❌ | ❌ | 🎯 C3 (honor per-state sealed-events template; C4 fidelity gate already live) | — | — |
| **v1 closure (trust polish)** | ❌ | ❌ | 🎯 C1 approval routing 2×2 (Tier R/I) | 🎯 C2 two-party confidence → **v1 reached** | — |
| **Phase-2 gaps (determinism)** | ❌ | ❌ | ❌ | 🎯 D1 pagination/caching · D2 persistence validator · D3 3rd provider cell | — |
| **Offline outbox + sync + conflict** | ❌ | ❌ | ❌ | 🎯 S1 (Drift source-of-truth, outbox, server/client-wins, idempotency-key) | — |
| **NestJS backend generation (same IR → backend)** | ❌ | ❌ | ❌ | 🎯 P9-B1/B2 (IR→NestJS scaffold, tenant guard + idempotency) | 🎯 P9-B3/B4 (FakeRemoteDataSource + live repo switch, full-stack Ledgerly from one IR) |
| **Multi-feature IR (N features/app)** | ❌ | ❌ | ❌ | 🎯 MF1 (`FeatureModel` list; per-feature folders) | — |
| **Audit immutability + void/clone** | ❌ | ❌ | ❌ | 🎯 AV1 (approved/exported immutable; corrections void+clone) | — |
| **3-way merge + reverse extraction + full a11y** | ❌ | ❌ | ❌ | ❌ | 🎯 P5 (E1 merge · E2 a11y · E3 grammar reconciliation) |
| **Multi-tenant RBAC + soft-delete** | ❌ | ❌ | ❌ | ❌ | 🎯 R1 (`tenantId`/`actorId` scope on every query) |
| **Platform ports (OCR/camera/cards/budgets/per-diem)** | ❌ | ❌ | ❌ | ❌ | 🎯 PP1 (`ReceiptOcrPort`, card feed, budgets, per-diem tables) |
| **Accounting integrations** | ❌ | ❌ | ❌ | ❌ | 🎯 I1 (QuickBooks/Xero CSV+JSON, GL mapping) |
| **Enterprise T&E (Ledgerly full, 14 modules)** | ❌ | ❌ | ❌ | ❌ | 🎯 LX1 composite of the above (post-v1 product build) |

## Headline read

- **This week (Now→Near):** land CRUD + persistence (claude in flight), stand up the CDP flow-test harness + flow goldens, and start the feedback loop. **Result: a runnable CRUD app you can drive end-to-end over CDP and see persist (Drift/hive_ce) with in-memory web fallback.** Do not start L1 until F1/F2 are verified and committed.
- **Weeks 2–4 (Short):** Ledgerly-MVP L1–L4, P8-W1 wizard IR, C3 sealed-events honor, C1 approval routing 2×2. **Result: a domain-serious single-feature expense app.** C4 stays done; it is not re-opened here.
- **Months 1–3 (Mid):** C2 two-party confidence (**v1**), P8-W2/W3, D1–D3, S1 outbox/sync, MF1 multi-feature IR, AV1 void/clone, **P9-B1/B2 NestJS backend scaffold + tenant guard**. **Result: v1 (end of Phase 3) shipped; foundation for real enterprise features; offline-first app has a generated NestJS backend to point its datasource port at.**
- **3+ months (Long):** P8-W4 workflow sample, **P9-B3/B4 (FakeRemoteDataSource + live repo switch, full-stack Ledgerly from one IR)**, P5 (E1–E3), R1 RBAC, PP1 platform ports, I1 accounting — the Ledgerly-class product (LX1).
