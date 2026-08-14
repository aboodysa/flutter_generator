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
- 🟡 Screens: real widgets (boot into Scaffold/AppBar/BlocBuilder) but **thin** — rows are `toString()`, data = 1 seeded demo item, no real datasource wiring
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

### P3 — v1 closure (trust-boundary polish)
Entry: P1–P2 done; v1 definition ("end of Phase 3") nearly met.
Exit: DESIGN §9.5 approval routing 2×2 (Reversibility × Blast-radius: Tier R batched/deferrable, Tier I solo/blocking) implemented in `approve.ts`; §9.4 two-party confidence (second-party ReviewAgent + threshold) wired for business rules.
Slices: C1 approval routing 2×2; C2 two-party confidence.

### P4 — Phase 2 gaps (deterministic polish)
Entry: P3 done (v1 shipped).
Exit: pagination/caching generator, persistence selection validator, second state-mgmt plugin (coupled-pair proof).
Slices: D1 pagination/caching; D2 persistence validator; D3 second plugin.

### P5 — Phase 4 (post-v1)
Entry: v1 + P4 shipped.
Exit: 3-way merge (§11.4) for scaffold migration; full a11y semantics generator + gate; grammar-growth reconciliation (§2.4); reverse extraction completed.
Slices: E1 3-way merge; E2 full a11y; E3 grammar reconciliation.

## Standing loop (never stops between phases)
```
slice → implement (claude in tmux when quota resets, else me) → verify
(typecheck:builder + index/validate per sample + flutter analyze/test) → small commit
→ P2 CFT gate once P1 lands → feed failures back, repeat
```
Rules: additive-only; small commits; never bypass oracle/approval gates; SOLID;
LLM model = `opencode/deepseek-v4-pro`; agents read AGENTS.md + briefs in `~/temp/opencode/flutter-app-builder/`.

## Definition of Done per phase
1. `npm run typecheck:builder` clean.
2. Every affected sample: generate → `validate.ts` = `VALIDATION PASSED` (incl `[oracle] PASS`).
3. Sample app: `flutter pub get && flutter analyze && flutter test` green.
4. P2+: app builds to web, serves, and the CFT driver asserts boot + render + no console/network errors.
5. One logical slice per commit; HANDOFF kept lean; history → `context_history.md`.
