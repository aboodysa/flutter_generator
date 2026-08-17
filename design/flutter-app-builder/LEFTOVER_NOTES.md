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
| G-L4-2 login-screen not localized | auth login screen hardcodes EN labels ("Sign in", "Choose a demo account") + no forced RTL directionality; only AppStrings chrome vocabulary is localized | FIXED 1b297af — added `signIn`/`chooseDemoAccount` to AppStrings (en/ar), auth.ts routes both through AppStrings.of(context) when locale-aware, l10n_test gained an AuthLoginScreen RTL case (ltr/rtl + AR text assertion + goldens). RTL was a symptom of the hardcoded strings, not a missing Directionality wrapper — resolves automatically once the real string renders. Verified: ledgerly 82/82, hr_service 36/36 |

## From parallel session B (samples) — 2026-08-16
| Note | Detail | Status |
|---|---|---|
| B1 wizard review-step duplicate-status bug | a wizard step bound to an entity's `status` field collides with the wizard's internal flow-status field → duplicate_definition analyzer error. Fixed 0385e5d: wizard internal flow-status namespaced as `wizardStatus` in state.ts (type-based default-qualification), screen.ts references it; work_auth review step re-bound to `status`. work_auth 22/22 tests | FIXED 0385e5d |
| B2 repo node broken | Homebrew node 25 broken (libllhttp), used nvm node 24; unrelated | INFO |

## From UIX Slice D (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| D1 ChoiceChip `onSelected` not exercised by generated test | crud_flow_test targets `firstCrudTextField` (never status/priority), so chip-tap interaction is only proven by render + analyze, not by a tap test | FIXED e6608f5 — generateCrudFlowTest taps the second enum value during create (form defaults to the first) and asserts selected flips true/false; fires for tasks/hr_service/todo/todo_riverpod, all pass |
| D2 ChoiceChip selected tint 0.2 vs AppChip 0.12 | deliberate stronger "selected" look; documented, no action | WONTFIX (documented) |

## From G2 date-picker (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| G2a `firstCrudTextField` could pick a DateTime field | generated crud_flow_test does `enterText(first TextField)`; a readOnly date field would fail. No sample triggers it today (first fields are String/double) | FIXED e6608f5 — DateTime excluded from firstCrudTextField's candidate set (mirrors firstFocusBypassField's existing exclusion). Byte-identical everywhere today (latent, hardens against the next sample) |
| G2b `datepickerCheck` reads `ir.entities` directly | vacuously passes for multi-feature AppModel IR (entities under `ir.features[].entities`) — same pre-existing gap as `moneyCheck` | FIXED e6608f5 — same gap also hit moneyCheck/verdictCheck/tenantCheck/splitCheck/oracleCoverage; flattenedIr extended to also flatten businessRules/repositories/repositoryImpls, wired into all 6 call sites. Proven non-vacuous with a negative control (empty-message policy rule on ledgerly's multi-feature IR: FAIL with the fix, PASS without it) |

## From MF1 multi-feature (committed 76f8a0f) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| M1 flow/crud tests only exercise feature[0] | multi-feature apps' generated tests drive the first feature only | REVIEWED 2026-08-16 — confirmed still accurate and intentional (index.ts's own comment: "feature[0] is the app's testable identity" convention, shared by initialLocation/generateMain/generateGoldenTest). CONFIRMED BY DESIGN, no code change |
| M2 arch-linter layer detection vacuous for multi-feature | path-segment mismatch (`features/<name>/`), passes without checking | FIXED 9d3b948 — actually broader than scoped: vacuous for EVERY app (single-feature too), since `slice(0,2)` always captured "features/<name>" regardless. Fixed to `slice(1,3)`; also fixed a second latent bug the working check then surfaced (the raw-color regex matched "AppColors." too — false positive on the app's own token class) and the REAL violation both bugs were hiding (crud_form.ts's policy panel + split error text used raw `Colors.X` instead of AppChip.colorForTone/AppColors). [architecture] now genuinely PASSes (not vacuously) across all 14 samples |
| M3 symbol-table collisions across features | last-registered wins silently | FIXED (detection) 90cfd41 — new additive `[symbols]` gate scans every feature's declared names for cross-feature duplicates; the underlying last-wins merge in symbols.ts is intentionally left unchanged (fixing it needs a design decision — error vs namespace vs other — out of scope for a leftover-notes pass). Stash-proofed with a synthetic collision |
| M4 rasheed strategy-fidelity mismatch | plan.json declares sealed-events, template emits enum-status; real but unrelated | INVESTIGATED 2026-08-16 — root cause confirmed: scoring.ts can select "sealed-events" (SEALED_EVENTS_THRESHOLD) but state.ts's generator never implements that branch, always emits enum-status. Real bug; implementing exhaustive sealed-class codegen is its own slice. STILL OPEN (root cause documented) — **RESOLVED-WITH-DECISION 2026-08-17, SPIKE M4 (`design/flutter-app-builder/research/SPIKE_M4_REPORT.md`, commit `b5eb50c`): decision MODIFY.** The spike proves rasheed's `AllExpenses` state genuinely crosses the threshold (probe: `apps/rasheed/output/qa/probe1`) and that a `[strategy-fidelity]` validate gate already ships and already catches the mismatch (`apps/rasheed/output/qa/validate_probe1.log`: FAIL) — so the "needs a gate" half of this note is done. The real defect is `scoring.ts`'s `scoreStateStrategy` metric (status/field count) contradicting DESIGN §5.2's stated `stateMachines` transition-surface metric; under the DESIGN-correct metric no current IR fires sealed. Resolved scope: **M4a** (active next step) — fix the `scoring.ts` selector to measure the `stateMachines` surface, `scoring.ts`-only, S; **M4b** (deferred) — implement the sealed template family only when a real event-rich IR appears. See `SPIKE_PLAN.md` M4 section for the full resolved scope/acceptance and `HANDOFF.md` for current status. |

## From L1 Money (committed 739f933) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| L1a `generateCrudFlowTest` doesn't special-case money fields | typing into first TextField with a money field unchecked; reimbursement has no list/CRUD so it never fired | VERIFIED e6608f5 — moneycrud's generated crud_flow_test already types a decimal ('1250.50') and asserts the formatted '1,250.50 SAR' output; ran the real test, passes. No code change needed |
| L1b Money.format hardcodes 2-decimal exponent | JPY/BHD (0/3-decimal) not handled | WONTFIX (no sample needs it; documented) |
| L1c Money +/- assert() on currency match | asserts stripped in release | WONTFIX (demo; revisit if load-bearing) |

## From tasks probe (committed 039904a) — 2026-08-15
| Note | Detail | Status |
|---|---|---|
| P1 list-screen filter uses GoRouterState.of | child list screens throw under plain MaterialApp golden mount — latent; goldens render screens[0] only | OPEN (latent; flagged to claude) |
| P2 heroBlock + title-role heading could stack | no sample sets both; left as-is | WONTFIX (documented) |
| P3 list leading picks status over priority | deliberate tie-break when both present | DOCUMENTED |
| P4 AppChip tones are substring/vocab matches | non-English status vocabulary → default tone | WONTFIX (deterministic by design) |

## From Ledgerly-MVP capability completion + CDP acceptance run (committed 9f70dcb..90cfd41) — 2026-08-16
| Note | Detail | Status |
|---|---|---|
| LM1 apps/ledgerly extended to full slice coverage | apps/ledgerly/input/ledgerly.ir.json now exercises L2 (8 seed policy rules, all 4 severities), MF3 (attachments), MF4 (ExpenseClaimSplit), MF6 (outbox), L3 (ExpenseClaim audited+exported, CSV export) — was previously only MF1/MF2/MF5/L4. CDP-walked: demo login (employee) → submit an expense claim, live policy verdict rendered in-browser (StandardExpenseWarn card) → create → budget list shows live remaining ("used 58% · 420.00 SAR left") + detail (Limit/Committed/Actual/Remaining all correct) → CSV export SnackBar ("Exported 3 rows to CSV") | DONE 9f70dcb |
| LM2 MF1+oracle rule-tag mismatch (generator bug, found by LM1) | writeTests's oracle-test plan entry assumed a bare `rule:<name>` dependsOn tag; multi-feature apps prefix every per-feature artifact `feature:<name>:...`, so `[plan] oracle:X depends on unresolved 'rule:X'` on generation. First multi-feature IR to combine businessRules+oracle — hr_service/work_auth's rules are both single-feature IRs. Resolves the real tag from accumulated planEntries instead of assuming the shape | FIXED 9f70dcb |
| LM3 MF3 symbol registration missing for multi-feature (generator bug, found by LM1) | attributes.attachments is app-level like budget/outbox but had no post-merge symbol fix in generateMultiFeatureApp — barrel emitted `export 'receiptattachment.dart';` (guessed path, doesn't exist) instead of core/attachment.dart. Same class of gap MF5/MF6 already had fixes for | FIXED 9f70dcb |
| LM4 generatePolicyTest never imported Session (generator bug, found by LM1) | computed session.import for auth-aware apps but never spliced it into the returned template — dormant because no prior policy-rule sample also had attributes.auth (moneycrud has policy, no auth) | FIXED 9f70dcb |
| LM5 policy waive test assumed exactly one "Waive" button | a block-severity rule's trigger value can also cross a lower-severity rule's own threshold on the same field (e.g. amount>=15000 also satisfies amount>=500/2000) — every non-autoApprove, non-waived verdict renders its own Waive button, so more than one can be on screen. Scoped the test's finders to the specific rule's own Card; also auto-satisfies any co-triggered requireJustification verdict before asserting Save re-enables | FIXED 9f70dcb |
| LM6 CDP: Approval entity has no manager-approve UI action | ApprovalRepository only ever declared `listApprovals` (read-only) — no update operation, so Approval rows are non-interactive (no chevron, tapping does nothing). "Submit + manager approve/reject" is validated elsewhere (reimbursement's wizard has a real approve/reject step) but ledgerly's own Approval list was never wired for it | FIXED 9415190 — added `ApprovalRepository.updateApproval` (+ `UpdateApproval` use case) and a general `quickDecisionTargets` operations.ts helper (any update-only "review queue" entity, not Approval-specific) that drives both a list-row quick-decision button (screen.ts) and its regression test (test.ts). Along the way found + fixed a real second bug this surfaced: entity.ts's Equatable full-field-equality auto-upgrade only covered `crudFormTargets` (create+update), so Approval's Cubit stayed identity-only ([id] props) and Bloc's `emit()` silently skipped the rebuild on "same id, different decision" — extended the auto-upgrade to `quickDecisionTargets` entities too. Backward-compat verified byte-identical for hr_service/tasks/work_auth; ledgerly regenerated, validate.ts 20/20, flutter analyze clean, flutter test 83/83 |
| LM7 CDP: MF3 attachment capture has no UI entry point | core/attachment.dart (ReceiptOcrPort/ReceiptAttachment/MockReceiptOcr/synthesizeAttachment) is a real, tested capability but is never wired into any screen — by design (MF3's own doc comment: "deliberately does NOT wire a real file-picker... out of scope for a deterministic, offline, 0%-LLM generator"), so there's no "capture" button to CDP-click | DOCUMENTED (by design, matches MF3's stated scope — not a gap to fix) |
