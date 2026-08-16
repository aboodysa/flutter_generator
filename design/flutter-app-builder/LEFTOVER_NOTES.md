# LEFTOVER NOTES — tracked, actionable queue from claude reports

Compiled from every claude slice report + probe findings. Each item: source, what, why it
matters, status. Update on every slice. This is the "don't lose the notes" index.

## From spike review (COMPETITIVE_BENCHMARK/BACKEND_GEN_OPTS/AUTH_OPTS + adversarial review) — 2026-08-16
| Note | Detail | Status |
|---|---|---|
| R1 cross-feature module wiring | `BACKEND_GEN_OPTS.md`'s "one module per feature" claim doesn't address cross-feature FK relations (e.g. approvals→expenses); needs an explicit ownership-graph design note (reuse MF1's shared-core/DI graph walk server-side) before B1 lands | OPEN — queued as pre-B1 design note in `ROADMAP.md` P9 |
| R2 rule-engine dual-eval gate | Dart client + TS server rule eval is two sources of truth; `BACKEND_GEN_OPTS.md §9.7` files this as a risk, review promotes it to a blocking cross-language golden-parity gate (B6) | OPEN — queued as `ROADMAP.md` P9 slice B6 |
| A1 tenantId-claim provisioning gap | Supabase RLS needs `tenantId` as a signed `app_metadata` claim, provisioned via a server-side admin op at account creation; today's `kPersonas` are static/generator-derived with no such step — RLS **forks** the convention, doesn't lift it unchanged | OPEN — queued in `ROADMAP.md` MF2-evolution, must close before any RLS SQL emitter ships |
| A2 `GRILL_NOTES.md` factual error | Self-grill claimed MF2 "already emits the mock AuthPort"; verified false against `builder/src/generators/auth.ts` (126 lines, concrete `Session` class, no port/interface exists) — `AUTH_OPTS.md`'s original "future work" sequencing was correct | CORRECTED (see `research/CLAUDE_GRILL_REVIEW.md` §3 grill #1) |
| A3 Clerk/Keycloak order | Reordered Clerk ahead of Keycloak in `ROADMAP.md` MF2-evolution — Clerk is hosted-SDK/zero-infra (lighter than Keycloak's JVM+Postgres), matching the same no-docker-in-CI determinism principle P9's R7 uses; Keycloak deferred to P9-era, not demoted for enterprise-fit reasons | RESOLVED — applied to `ROADMAP.md` |
| C1 public-deploy liability | `COMPETITIVE_BENCHMARK.md` G5 said "keep deploy as a roadmap option"; review adds a hard requirement — any public-deploy slice (beyond Tailscale-default) needs a security-review gate first, given generated apps carry money (L1) + tenant PII | OPEN — queued as `ROADMAP.md` P14 slice W4 (gate) |
| C2 doc-hygiene: ROADMAP "Where we are" stale | `ROADMAP.md`'s "Where we are" (top of file) doesn't list MF1/MF2/L1 as shipped, but code confirms all three exist (`types.ts` `features[]`, `repository_impl.ts` `_inScope`/`_stampTenant`, money-as-int generator) — `CAPABILITIES.md`'s sequence note is similarly behind actual shipped state | OPEN (documentation debt, out of scope for this review — flagged, not fixed) |
| C3 confidence laundering in COMPETITIVE_BENCHMARK.md | `§2` hedges vendor facts as "Medium — directional, unverified" but `§5`–`§8` state vendor absences as flat fact with no re-flagging; anyone quoting `§8` externally inherits false confidence | OPEN — re-flag as unverified estimate anywhere this doc is quoted outside itself (no direct roadmap slice; a writing-hygiene note for whoever reuses `§8`) |

## Bugs round (committed 53ae2d2) — 2026-08-15
| Note | Detail | Status |
|---|---|---|
| Bug A create-keyboard | iOS Safari keyboard not showing on create (no DOM `<input>` proxy until first tap). Fixed: autofocus on create only. RCA-005 + focus_test guard | ✅ FIXED |
| Bug B list-scroll | No visible Scrollbar + mouse excluded from dragDevices. Fixed: AppScrollBehavior + Scrollbar(thumbVisibility) + AlwaysScrollableScrollPhysics. RCA-006 + scroll_test guard | ✅ FIXED |
| G6 FK-prefill | New-FollowUp drops ?taskId and form doesn't prefill. Fixed: FAB preserves query param + CRUD form prefills <Parent>Id | ✅ FIXED |
| B2 leftover | focus/scroll tests boot real DI per case; focus_test resets GetIt between cases | DOCUMENTED |
| B3 leftover | G6 prefill handles String FKs only (no sample uses non-String FK) | WONTFIX (documented) |

## From L4 RTL CDP testing — 2026-08-16
| Note | Detail | Status |
|---|---|---|
| G-L4-2 login-screen not localized | auth login screen hardcodes EN labels ("Sign in", "Choose a demo account") + no forced RTL directionality; only AppStrings chrome vocabulary is localized | OPEN — route login screen strings through AppStrings + verify Directionality.of == rtl under AR; extend l10n_test to the login screen |

## From parallel session B (samples) — 2026-08-16
| Note | Detail | Status |
|---|---|---|
| B1 wizard review-step duplicate-status bug | a wizard step bound to an entity's `status` field collides with the wizard's internal flow-status field → duplicate_definition analyzer error. Fixed 0385e5d: wizard internal flow-status namespaced as `wizardStatus` in state.ts (type-based default-qualification), screen.ts references it; work_auth review step re-bound to `status`. work_auth 22/22 tests | FIXED 0385e5d |
| B2 repo node broken | Homebrew node 25 broken (libllhttp), used nvm node 24; unrelated | INFO |

## From UIX Slice D (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| D1 ChoiceChip `onSelected` not exercised by generated test | crud_flow_test targets `firstCrudTextField` (never status/priority), so chip-tap interaction is only proven by render + analyze, not by a tap test | OPEN — fold into the bugs/regression-test task (claude in flight) |
| D2 ChoiceChip selected tint 0.2 vs AppChip 0.12 | deliberate stronger "selected" look; documented, no action | WONTFIX (documented) |

## From G2 date-picker (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| G2a `firstCrudTextField` could pick a DateTime field | generated crud_flow_test does `enterText(first TextField)`; a readOnly date field would fail. No sample triggers it today (first fields are String/double) | OPEN (latent) |
| G2b `datepickerCheck` reads `ir.entities` directly | vacuously passes for multi-feature AppModel IR (entities under `ir.features[].entities`) — same pre-existing gap as `moneyCheck` | OPEN (latent) |

## From MF1 multi-feature (committed 76f8a0f) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| M1 flow/crud tests only exercise feature[0] | multi-feature apps' generated tests drive the first feature only | OPEN (by design, document) |
| M2 arch-linter layer detection vacuous for multi-feature | path-segment mismatch (`features/<name>/`), passes without checking | OPEN |
| M3 symbol-table collisions across features | last-registered wins silently | OPEN |
| M4 rasheed strategy-fidelity mismatch | plan.json declares sealed-events, template emits enum-status; real but unrelated | OPEN (pre-existing) |

## From L1 Money (committed 739f933) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| L1a `generateCrudFlowTest` doesn't special-case money fields | typing into first TextField with a money field unchecked; reimbursement has no list/CRUD so it never fired | OPEN — moneycrud sample exercises CRUD+money; verify |
| L1b Money.format hardcodes 2-decimal exponent | JPY/BHD (0/3-decimal) not handled | WONTFIX (no sample needs it; documented) |
| L1c Money +/- assert() on currency match | asserts stripped in release | WONTFIX (demo; revisit if load-bearing) |

## From tasks probe (committed 039904a) — 2026-08-15
| Note | Detail | Status |
|---|---|---|
| P1 list-screen filter uses GoRouterState.of | child list screens throw under plain MaterialApp golden mount — latent; goldens render screens[0] only | OPEN (latent; flagged to claude) |
| P2 heroBlock + title-role heading could stack | no sample sets both; left as-is | WONTFIX (documented) |
| P3 list leading picks status over priority | deliberate tie-break when both present | DOCUMENTED |
| P4 AppChip tones are substring/vocab matches | non-English status vocabulary → default tone | WONTFIX (deterministic by design) |
