# HANDOFF — current round (2026-08-14, state-mgmt + arch)

> Lean round summary. Previous content archived to `context_history.md`.

## Objective
Reach **v1** (end of Phase 3) and prove it: a generated app that runs + is tested in
Chrome for Testing (`new_chrome_ext`, malls-app pattern). See `ROADMAP.md` + `PLAN_RUN_TEST_CFT.md`.

## Actors
- **opencode (me)** — orchestrator: briefs, verify, commit. (Claude in tmux `claude-flutter-grill` is **out of quota** — paused until reset.)
- **`opencode/deepseek-v4-pro`** — semantic-lane LLM (`MODEL` in requirements.ts / business_rule_agent.ts).

## Just done (this round)
- **P1 real screens** — list/detail render declared entity fields (title/subtitle/labeled rows), 3-row demo seed, null-safe field formatting. `e3caeaa`.
- **Arch decision layer + state-mgmt providers** — new `arch.ts` (`decideArchitecture` = single source of truth for stateManagement/DI/routing/per-state strategy + coupled-pair matrix guard); `provider.ts` registry (none/bloc/riverpod); **riverpod** implemented as the 2nd provider (Notifier+NotifierProvider, ConsumerWidget+ref.watch, ProviderScope); bloc unchanged as enterprise default; explicit `attributes.stateManagement` override. `16d9da8`.
- **CFT driver** — `docs/qa/expense/drive_cft.cjs` (puppeteer-core → CFT :9222; asserts boot/title/console-clean). Generated `main()` now calls `ensureSemantics()` (a11y + DOM text for tests). `2775ec8`.

## Ground truth (roadmap)
| Area | State |
|---|---|
| Phase 1 (deterministic core) | ✅ |
| Phase 2 (pattern) | ✅ + arch layer + bloc/riverpod/none providers (gaps: pagination/caching, persistence validator) |
| Phase 3a (BusinessRuleAgent) | ✅ `6fb6672` |
| Phase 3b (oracle + trust core) | ✅ `eb87a58`; gaps: approval routing 2×2, two-party confidence, sealed-events template (C3) |
| Phase 4 | partial (extract.ts, regen.ts) |
| CFT run/test (P2) | 🚧 driver + build+serve done; `hasDataRow` assertion fails (seeded title field `merchant` is null → rows show 'Untitled', id is key not title) |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts <ir> <out>   # then:
npx ts-node --transpile-only builder/src/validate.ts <ir> <out> # VALIDATION PASSED (incl [oracle])
# app: flutter create --platforms=web . && flutter build web; serve + drive_cft.cjs
```
Samples: `builder/samples/{expense.semantic, inventory, todo, promo, rasheed, todo.riverpod}.ir.json`.

## Next steps
1. P2 CFT: fix demo seed so the rendered list *title* field is distinct (not just the key) → `hasDataRow` passes → commit CFT green evidence.
2. P3: approval routing 2×2 (C1), two-party confidence (C2), honor per-state `sealed-events` (C3), strategy-fidelity gate (C4).
3. Keep HANDOFF lean; archive prior → `context_history.md`.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
LLM = `opencode/deepseek-v4-pro`; agents read `AGENTS.md` + briefs in `~/temp/opencode/flutter-app-builder/`.
