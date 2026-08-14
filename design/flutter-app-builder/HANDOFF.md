# HANDOFF — current round (2026-08-14)

> Lean round summary. Previous content archived to `context_history.md`.

## Objective
Drive the Flutter App Builder to **v1** (end of Phase 3: semantic lane + trust boundary),
and prove it by **running + testing a generated Flutter web app in Chrome for Testing**
via `~/Documents/cto/new_chrome_ext` (malls-app pattern). See
`design/flutter-app-builder/PLAN_RUN_TEST_CFT.md`.

## Actors
- **opencode (me)** — orchestrator: briefs, approve claude's commands, verify, commit.
- **claude** — tmux `claude-flutter-grill` (cwd `~/temp/opencode/flutter-app-builder`), manual mode. Implements delegated slices.
- **`opencode/deepseek-v4-pro`** — semantic-lane LLM (`MODEL` in `builder/src/requirements.ts` + `business_rule_agent.ts`).

## Repo map
- `lib/` `test/` — payment pilot (Rasheed). Don't regress.
- `builder/` — Flutter App Builder (deterministic compiler). Active area.
- `design/flutter-app-builder/` — `DESIGN.md` (v3.5) + `PHASE_PLAN.md` + `GRILLING.md` + `BENCHMARK.md` + `HANDOFF.md` (this) + `context_history.md`.
- `AGENTS.md` (repo root) — operating contract for agents.
- Briefs live in `~/temp/opencode/flutter-app-builder/*.md`.

## Ground truth (roadmap vs done)
| Phase | State |
|---|---|
| 1 deterministic core | ✅ plan.json, region hash, lockfile tuple, arch/security/determinism gates |
| 2 pattern gen | ✅ component registry, 8-input scoring + none branch, forms, state machines (gaps: pagination/caching, persistence validator, 2nd state-mgmt plugin) |
| 3a semantic lane | 🚧 BusinessRuleAgent IN PROGRESS (claude) — NL→`RuleModel`, schema-validate, entity/field cross-check, provenance, `extensionQueue`; fixture dry-run path |
| 3b trust boundary | ✅ write-ACL, provenance, approve gate, oracle corpus + blocking coverage gate, decision-table `rows[]` + `daysSince>|<` |
| 4 novel/hardening | partial (extract.ts, regen.ts) |

## Commits this session
`8fd3e39` … `468e48f` (last: ops AGENTS.md + CFT plan + deepseek-v4-pro default).
3b rules+oracle slice committed `eb87a58`.

## In flight (uncommitted, claude)
- `builder/src/business_rule_agent.ts` (NEW)
- `builder/samples/promo.ir.json` (Promotion + `promotionStatus` decision-table rule)
- `builder/samples/rules/promotionStatus.oracle.json`, `rules/_fixture/business_rule_agent_output.json`
- Verifying: typecheck → `--fixture` dry-run → all samples validate → promo flutter analyze+test

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts <ir> <out>   # then:
npx ts-node --transpile-only builder/src/validate.ts <ir> <out> # expect VALIDATION PASSED (incl [oracle] PASS)
# sample app: flutter pub get && flutter analyze && flutter test
```
Sample IRs: `builder/samples/{expense.semantic, inventory, todo, rasheed, promo}.ir.json`.
Oracle corpus: `builder/samples/rules/`.

## Next steps
1. Claude finishes 3a → I verify + commit ("add Phase 3a BusinessRuleAgent…").
2. Track B: `flutter build web` a generated sample + serve.
3. Track C: CFT launch + browserpilot driver navigates/asserts (app boots, screen renders, zero console/network errors) — evidence under `docs/qa/<sample>/`.
4. Loop until run + tested green; then handle remaining 3b (approval routing 2×2, two-party confidence) → v1.

## Rules
- Additive-only; small commits; never bypass oracle/approval gates; SOLID; 0% LLM in deterministic core.
