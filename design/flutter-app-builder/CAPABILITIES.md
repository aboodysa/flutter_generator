# Generator Capabilities Plan (app-type agnostic)

The generator does NOT target any single product. It develops **general capabilities** — each
app-type agnostic, deterministic, `(IR, ctx) → string` — that let ANY kind of multi-user app be
assembled from IR: expense/T&E (Ledgerly), HR service, work authorization, CRM, etc. Each slice is
validated by **at least two sample apps of different types**.

## Capability catalog (each is general; samples only validate)

| Cap | Capability (general) | Sample evidence |
|---|---|---|
| L1 | Money / typed amounts: integer minor units + currency VO, never double | Ledgerly (expense), HR (salary band), CRM (deal value) |
| L2 | Rule engine with verdicts: `Verdict{ruleId, severity, message, waivedBy?}` on save+submit; severity → action (auto-approve/warn/justify/block) | Ledgerly (policy), WorkAuth (visa rules), CRM (deal discount rules) |
| MF1 | Multi-feature IR: `features[]` → feature folders + shared core + merged router/DI | Ledgerly, HR service |
| MF2 | Auth + roles: demo login (multiple personas), tenant-scoped repos (actorId/tenantId on every read/write) | Ledgerly (emp/manager/finance), CRM (rep/manager), HR (employee/hr-admin) |
| MF3 | Attachment + OCR port: media capture stub + `OcrPort` interface (impl later), offline-safe | Ledgerly (receipt), HR (document upload), WorkAuth (passport scan) |
| MF4 | Split / allocation: amount-or-% split that must sum to 100%, audited | Ledgerly (expense split), CRM (split commission), HR (cost-center allocation) |
| MF5 | Budget / quota: entity + live remaining (committed vs actual) | Ledgerly (meal budget), HR (headcount budget), WorkAuth (visa quota) |
| MF6 | Offline outbox: local-first queue, pending mutations, retry/backoff, conflict rule (server wins on approved/exported, client wins on draft) | Ledgerly, CRM (field sync) |
| L3 | Audit + export: immutable `AuditEvent{who,what,before,after,reason,at,device}`; CSV/JSON export; no silent edit after export | Ledgerly (audit log, CSV), HR (compliance), WorkAuth |
| L4 | l10n + RTL: AR/EN arb files, RTL, per-locale number/date; no hardcoded strings | Ledgerly (AR+EN), HR, CRM |
| L5 | Workflow engine (already have): multi-step wizard, branching, per-step rules, required steps not skippable | Ledgerly approvals, WorkAuth application, HR onboarding |
| C1 | Approval graph: multi-level by amount/org/role, threshold jumps, delegate | Ledgerly (manager→finance), WorkAuth (supervisor→HR→visa office) |
| C2 | Multi-role UI patterns: persona-aware home, stacked inbox with policy/rule chips, batch approve with guard | Ledgerly (manager inbox), CRM (deal approval), HR (leave approval) |

## Sample apps (each exercises a DIFFERENT slice subset; Ledgerly is NOT the target, it's evidence #1)
1. **Ledgerly** (expense T&E) — L1 L2 L3 L4 L5 MF1 MF2 MF3 MF4 MF5 MF6 C1 C2 (MF3 added 2026-08-16
   for Ledgerly-MVP completion, beyond this row's original scope — attributes.attachments only,
   no UI entry point per MF3's own design; see LEFTOVER_NOTES.md LM7)
2. **HR service app** (leave requests, onboarding, salary bands) — L1 L2 L4 L5 MF1 MF2 MF3 MF5 C1 C2
3. **Work authorization app** (visa application wizard: submit → supervisor → HR → visa office, quota,
   passport OCR) — L2 L3 L4 L5 MF1 MF2 MF3 MF5 C1
4. **CRM app** (deals, contacts, approvals, commission split, field sync) — L1 L2 L4 MF1 MF2 MF4 MF6 C2

## Sequence (each slice: typecheck → all-7-samples validate → flutter analyze/test → small commit →
goldens+progress to Telegram)
1. **L1** (in flight) → 2. **MF1** multi-feature IR → 3. **L2** verdicts → 4. **MF4** split →
5. **MF2** auth/roles/tenant → 6. **MF3** attachment+OCR port → 7. **MF5** budget/quota →
8. **L3** audit+export → 9. **L4** l10n/RTL → 10. **MF6** outbox →
11. **ledgerly.ir.json** (full MVP evidence) → 12. **hr_service.ir.json** → 13. **work_auth.ir.json** →
14. **crm.ir.json** → CDP runs on each, final loop.

## Acceptance (capability-level, any app type)
- [ ] Same slice works across ≥2 different app types (evidence samples per Cap above)
- [ ] Money never emitted as double
- [ ] Every repo read/write carries tenantId + actorId
- [ ] Split sums exactly 100%
- [ ] Required workflow steps not skippable (flow test per app)
- [ ] Rule engine is pure domain with oracle unit tests
- [ ] RTL goldens no overflow on any sample
- [ ] Exported/approved records immutable; corrections = void + clone
- [ ] Feature folders match the architecture per sample
- [ ] README per sample: run, demo personas, feature map
