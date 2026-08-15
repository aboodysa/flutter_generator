# ROADMAP — Flutter App Builder (v1 → beyond)

> Ground truth: DESIGN.md §25 phases. "v1 = end of Phase 3 (semantic lane + trust
> boundary)." This roadmap turns that into actionable, testable slices. The loop:
> implement → verify (typecheck/validate/flutter) → commit → (run + test in CFT).
> Each phase has entry + exit criteria. Lean; full narrative lives in DESIGN.md/PHASE_PLAN.md.

## Where we are (2026-08-14)
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
6. One logical slice per commit; HANDOFF kept lean; history → `context_history.md`.
