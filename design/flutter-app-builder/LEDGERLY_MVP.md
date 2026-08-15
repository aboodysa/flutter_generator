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
| Money as int minor units, never double | **L1** Money-as-int (`semanticType:"money"`) | in flight (claude) |
| Policy engine with verdicts, severity, waive | **L2** PolicyVerdict (`PolicyVerdict{ruleId,severity,message}` persisted; severity action mapping) | next |
| Audit log screen + CSV export + immutable-after-export | **L3** AuditEvent + export | later |
| AR/EN + RTL, arb not hardcoded | **L4** l10n/RTL | later |
| Auth demo login (employee/manager/finance) | **MF2** roles + login screen (feature:auth) | later |
| Capture + OCR stub | **MF3** camera/image_picker + ReceiptOcrPort stub | later |
| Expense CRUD + split (sum 100%) | **MF4** split allocation | later |
| Budget remaining | **MF5** budget entity + live remaining calc | later |
| Submit + manager approve/reject | ✅ already have (wizard + approvals, reimbursement app) | done |
| Multi-feature app shell | **MF1** multi-feature IR (features[] → feature folders + shared core) | next after L1 |
| Offline outbox | **MF6** outbox + sync queue (drift-based) | later |

## Sequence (each verified + small commit + goldens to Telegram)
1. L1 (in flight) → 2. MF1 → 3. L2 → 4. MF4 split → 5. MF2 auth → 6. MF3 capture stub →
7. MF5 budget → 8. L3 audit/CSV → 9. L4 l10n → 10. MF6 outbox → **Ledgerly-MVP sample + CDP run**.
Between slices keep: typecheck → all-7-samples validate → flutter analyze/test on touched sample →
commit → graph rebuild → Telegram goldens.

## Proof of MVP (final acceptance, adapted to generator reality)
- [ ] `ledgerly.ir.json` multi-feature sample generates + validates + runs clean
- [ ] Money never emitted as double anywhere
- [ ] Policy rule oracle tests run (policy engine pure domain + tests)
- [ ] Split allocation sums 100% (test)
- [ ] Approve/reject workflow: required steps cannot be skipped (flow test)
- [ ] Every repo method takes tenantId (or entity carries tenantId)
- [ ] RTL goldens render without overflow
- [ ] Feature folders match architecture (auth/expenses/policies/approvals/budgets/reimbursements/audit)
- [ ] CDP: demo login → capture(stub) → submit → manager approve → budget shows remaining → CSV
