# Expected Gaps — Ledgerly spec vs. the Flutter App Builder

> Status: 2026-08-15. This is an honest gap analysis between a production T&E
> product spec ("Ledgerly": Expensify + Concur + Ramp + Zoho class) and what the
> deterministic generator in `builder/` can emit today. Use it to scope the next
> roadmap slices and to reset expectations: the generator produces a *small
> single-feature app with CRUD, rules, and navigation*, not a 14-module
> multi-tenant enterprise product.

## 1. What the generator DOES support (verified working)
| Capability | Status |
|---|---|
| Feature-first Clean Architecture layout (`lib/features/<f>/{domain,data,presentation}`) | ✅ |
| Entities, enums, VOs, queries, wrappers, models (DTO), repositories (contract + in-memory impl), use cases, datasources | ✅ |
| State mgmt: bloc (Cubit) / riverpod / none, DI (get_it / ProviderScope), routing (go_router) | ✅ |
| Navigation list → detail (onTap), route params | ✅ |
| Full CRUD in the repo impl (create/update/delete mutating the in-memory list) | ✅ in progress (P6-F1) |
| Business rules: `RuleModel` decision-tables + `daysSince>|<` + oracle coverage gate + `RuleOracleTestGenerator` | ✅ (flat + decision-table; no severity/waive) |
| State machines (transitions + guards) | ✅ structural |
| Forms (generated) + composition layer (cards/avatar/hero/spacing) | ✅ |
| iPhone goldens (390×844) with real Roboto/MaterialIcons text/icons; CFT/CDP run + flow driver | ✅ |
| `flutter analyze/test` green; validate gates (determinism, headers, secrets, arch, oracle, strategy-fidelity) | ✅ |
| AR/EN + RTL | ✅ pilot pattern (Rasheed) — not yet generator-first |
| Money | ❌ generated as `double` (spec forbids double for money) |

## 2. Gap categories (spec requires → generator today)

### A. Architecture / structure
| Spec | Generator | Gap |
|---|---|---|
| 14 feature modules, each with domain/data/presentation | one feature at a time | multi-feature app = N IR feature specs; generator emits a single `FeatureModel` |
| `app/`, `core/`, `shared/` scaffolding | `core/` yes; `app/` partial (main+router+di+theme); `shared/` no | add app/shared scaffolds |
| Typed routes + auth/tenant guards | go_router basic routes | guards/router-scope for roles/tenant |
| injectable + freezed + json_serializable codegen | manual Dart, no build_runner | not in pubspec; would need generator emit codegen setup |

### B. Domain modeling
| Spec | Generator | Gap |
|---|---|---|
| 26 aggregates (Tenant…SyncMeta) with tenantId/soft-delete/audit fields | plain entities | no tenant-scope/soft-delete/createdBy columns generated |
| Money as integer minor units + ISO currency (never double) | `double` fields | needs `Money` VO + integer minor units |
| Aggregates + one-repository-per-aggregate | one repository per feature entity | matchable but aggregates not modeled |
| Multi-currency fx (rate, date, locked-after-submit) | none | new domain |
| Tax/VAT, per-diem tables, mileage rate cards | none | new domain (VO + tables) |
| Card/virtual-card models, budgets, limits, merchant locks | none | new domain |
| Seed realistic mixed-currency demo data | seeded demo per entity | richer seed shaping |

### C. Policy engine (spec: "domain, not UI if-else")
| Spec | Generator | Gap |
|---|---|---|
| Rule types (max amount, caps, category/MCC ban, receipt-required, attendees, weekend, tip %, duplicate…) | `RuleModel` flat + decision-table | rule language is a subset; no MCC/cap/duplicate detectors |
| Severity: auto-approve / warn / require_justification / route_extra_approver / block | no severity concept | `RuleModel` yields a boolean/String outcome, not a `PolicyVerdict` |
| Persisted `PolicyVerdict {ruleId, severity, message, waivedBy?}` | oracle test only | new model + evaluation pipeline |
| Incremental evaluation on save AND submit | single evaluate | needs event-point evaluation |
| Finance waive with mandatory comment (audited) | none | new |
| Pure domain service + unit tests | rules are classes | policy service generator + tests |

### D. Approvals (graph, thresholds, delegation)
| Spec | Generator | Gap |
|---|---|---|
| Multi-level approval graph (manager → budget owner → finance), threshold jumps | state machine (transitions+guards) | state machine ≠ approval graph with routing/aging |
| Delegate / out-of-office approver | none | new |
| Approve/reject/request-changes, batch approve | none | new actions |
| SLA aging badges (24h/72h) | none | new |
| Cannot skip a required step | state machine guard | not enforced as approval invariant |

### E. Offline / sync (spec: "local source of truth")
| Spec | Generator | Gap |
|---|---|---|
| Drift/SQLite local source of truth | F2 persistence in progress (drift/hive adapters, in-memory fallback) | F2 covers the backend; full offline-first repo not yet |
| Outbox + retry with backoff + conflict resolution (server-wins-on-exported/client-wins-on-draft) | none | new |
| Offline draft survives process kill | in-memory only | needs local DB persist |
| Image store + checksum + separate upload queue | none | new |
| `Idempotency-Key` on create/submit/approve/export | none | new |

### F. Audit / integrity
| Spec | Generator | Gap |
|---|---|---|
| Immutable audit trail (who/what/before/after/reason/ts/device) | no `AuditEvent` | new |
| Approved/exported immutable; corrections = void + clone | none | new |
| Report/period close locks; no silent edits after export | none | new |
| PII: mask card numbers, encrypt receipts (interface) | secrets via `flutter_secure_storage` | partial (secrets only) |

### G. Platform / integration ports
| Spec | Generator | Gap |
|---|---|---|
| OCR port (camera, crop, torch, ML-Kit) | none | port interface only |
| Biometric unlock, camera, image picker | none | plugins not wired |
| Card-feed matching (mock), unmatched inbox | none | new |
| AccountingExport (CSV/JSON), idempotent, GL mapping | none | new (we can emit CSV export easily) |
| FakeRemoteDataSource (offline demo) | in-memory repo impl (similar idea) | ✅ aligned, needs DTO shape |

### H. UI/UX quality
| Spec | Generator | Gap |
|---|---|---|
| Skeleton loaders, optimistic approve, undo 5s | `LoadingState`/`ErrorState`/`EmptyState` only | add skeleton/optimistic patterns |
| Receipt lightbox pinch-zoom | none | new |
| Tablet master-detail | responsive flag exists; no master-detail | new |
| Full RTL + Arabic strings in .arb | RTL supported (pilot); .arb l10n not generated | add l10n generator (already planned Phase 2) |
| Light/dark tokens, Dynamic Type, reduce-motion | light theme only | add dark + a11y motion |
| 44px targets, Semantics labels | ensureSemantics + components | partial; needs explicit a11y generator (Phase 4) |

### I. Testing / tooling
| Spec | Generator | Gap |
|---|---|---|
| mockito/mocktail + bloc_test | flutter_test only (unit/widget/flow/golden) | add mock/bloc-test emission |
| Strict lints (Very Good / flutter_lints strict) | flutter_lints default | add strict analysis_options |
| Policy/split/fx/approval-graph unit tests | oracle tests + basic unit | add scenario test generators |

## 3. Realistic MVP slice the generator CAN produce today (single feature)
An `expense` feature module that is runnable and testable:
- Expense entity + Money-as-int VO (change the generator's money handling), category/tax code
- Expense CRUD + split (amount/% across categories)
- `RuleModel` policy rules (max amount, category ban, duplicate) evaluated on save/submit → `PolicyVerdict` (add severity/waive)
- Submit + manager approve/reject (state machine), batch not required
- go_router + get_it/bloc, iPhone goldens, seeded SAR/USD demo data
- Audit events (append-only `AuditEvent` list)
- CSV export (easy win)
- AR/EN + RTL via l10n generator

NOT in the MVP slice: multi-tenant RBAC, offline outbox/sync, OCR/camera, cards/limits, per-diem/mileage, budgets/analytics dashboards, accounting integrations.

## 4. Roadmap closure mapping
| Gap cluster | Roadmap item |
|---|---|
| Multi-feature app (N features) | not on roadmap — would be a generator capability (multi-feature IR) |
| Policy severity/waive/PolicyVerdict | P3/extension of `RuleModel` language |
| Approval graph + delegation + SLA | P3 (state-machine extensions) |
| Drift/hive offline-first + outbox/sync/conflict | P6-F2 (persistence) then a new offline-sync slice |
| Money-as-int VO | P6-F1 (money correctness) |
| l10n .arb + dark/a11y | P5 (full a11y) + Phase 2 (localization) |
| OCR/camera/cards/budgets/per-diem | new domain slices (post-v1) |

## 5. Bottom line
The generator is the right **architecture skeleton** for Ledgerly's MVP feature
(Expense CRUD + rules + approvals + RTL + goldens + tests), and the F2 persistence
work closes the offline-foundation gap. The **policy severity engine, approval graph,
outbox/sync, audit immutability, Money-as-int, multi-tenant RBAC, and the platform
ports (OCR/camera/cards/export)** are genuine gaps that need their own roadmap slices —
none are generated today.
