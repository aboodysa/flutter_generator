# Ledgerly-MVP milestone (via the generator)

> ⚠️ NOTE: Ledgerly is ONE SAMPLE of a general, app-type-agnostic capability plan. The master plan
> lives in `CAPABILITIES.md` — capabilities are general (any app type: HR, work authorization, CRM…),
> each validated by ≥2 different sample apps. Ledgerly only exercises slice subset
> L1 L2 L3 L4 L5 MF1 MF2 MF4 MF5 MF6 C1 C2. Do not read this doc as the product target.

Target: generate a runnable multi-feature Ledgerly-MVP app from IR — auth (demo roles), capture/OCR
stub, expense CRUD + split, policy engine (8 seed rules), submit + approve/reject, report preview,
budget remaining, offline outbox, AR/EN + RTL, audit log, CSV export. No "toy" — real multi-role
product shape (feature-first folders, sealed states, Result/Failure, tenant-scoped repos).

## Slice map (MVP "must be runnable" → generator slice)
| MVP item | Slice | Status |
|---|---|---|
| Money as int minor units, never double | **L1** Money-as-int (`semanticType:"money"`) | done |
| Policy engine with verdicts, severity, waive | **L2** PolicyVerdict (`PolicyVerdict{ruleId,severity,message}` persisted; severity action mapping) | done — 8 seed rules across ExpenseClaim/MealBudget/Approval, 9f70dcb |
| Audit log screen + CSV export + immutable-after-export | **L3** AuditEvent + export | done — ExpenseClaim audited+exported, CSV export button, 9f70dcb |
| AR/EN + RTL, arb not hardcoded | **L4** l10n/RTL | done (incl. login screen, 1b297af) |
| Auth demo login (employee/manager/finance) | **MF2** roles + login screen (feature:auth) | done |
| Capture + OCR stub | **MF3** camera/image_picker + ReceiptOcrPort stub | done (core capability, no UI entry point by design — LEFTOVER_NOTES.md LM7) — 9f70dcb |
| Expense CRUD + split (sum 100%) | **MF4** split allocation | done — ExpenseClaimSplit, 9f70dcb |
| Budget remaining | **MF5** budget entity + live remaining calc | done — CDP-verified live in browser |
| Submit + manager approve/reject | ✅ already have (wizard + approvals, reimbursement app) | done — submit (ledgerly) + approve/reject now wired for ledgerly's own Approval entity too (repo `updateApproval` + list-row quick-decision buttons, generalized via `quickDecisionTargets`), not just reimbursement's wizard. LEFTOVER_NOTES.md LM6, 9415190 |
| Multi-feature app shell | **MF1** multi-feature IR (features[] → feature folders + shared core) | done |
| Offline outbox | **MF6** outbox + sync queue (drift-based) | done — 9f70dcb |

## Sequence (each verified + small commit + goldens to Telegram)
1. L1 → 2. MF1 → 3. L2 → 4. MF4 split → 5. MF2 auth → 6. MF3 capture stub →
7. MF5 budget → 8. L3 audit/CSV → 9. L4 l10n → 10. MF6 outbox → **Ledgerly-MVP sample + CDP run**.
All slices committed 9f70dcb (L2/MF3/MF4/MF6/L3 batch, plus 3 generator bugs the combination
surfaced) + 1b297af (L4 login-screen gap). Between slices kept: typecheck → all-samples validate →
flutter analyze/test on touched sample → commit. "Telegram goldens" step not available in this
environment (no Telegram integration tool) — goldens committed to git instead.

## Proof of MVP (final acceptance, adapted to generator reality)
- [x] `ledgerly.ir.json` multi-feature sample generates + validates + runs clean (20/20 validate.ts gates PASS)
- [x] Money never emitted as double anywhere ([money] gate — genuinely checked as of 9d3b948/e6608f5's G2b fix, not vacuous)
- [x] Policy rule oracle tests run (policy engine pure domain + tests) — 8 rules, all oracle-covered, all pass
- [x] Split allocation sums 100% (test) — split_test.dart passes
- [x] Approve/reject workflow: required steps cannot be skipped (flow test) — TRUE for reimbursement's wizard AND now for ledgerly's own Approval (quick-decision test, quick_decision_test.dart) — LM6 fixed, 9415190
- [x] Every repo method takes tenantId (or entity carries tenantId) ([tenant] gate — genuinely checked as of the G2b fix)
- [x] RTL goldens render without overflow (l10n_test, incl. login screen as of 1b297af)
- [x] Feature folders match architecture (auth/expenses/approvals/budgets exist as features; policy/audit/export/outbox/attachment are app-level core capabilities by design, not separate feature folders — matches every other sample's convention)
- [~] CDP: demo login → capture(stub) → submit → manager approve → budget shows remaining → CSV — login/submit/budget/CSV confirmed live in-browser pre-LM6; capture(stub) has no UI entry point (by design, LM7); manager approve now has a real UI entry point (list-row quick-decision buttons, LM6 fixed) — re-run pending, see apps/ledgerly/output/qa/cdp-acceptance/
