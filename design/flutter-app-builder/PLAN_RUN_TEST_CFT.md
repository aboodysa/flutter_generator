# Plan — Phase 3a → Run + Tested Flutter App via Chrome for Testing

**Goal:** Get the Flutter App Builder's *semantic lane* (BusinessRuleAgent + oracle)
fully working, and prove it end-to-end by **running** a generated Flutter web app and
**testing** it in Chrome for Testing (CFT) through the `~/Documents/cto/new_chrome_ext`
browserpilot harness — the same way the malls app (`~/Documents/cto/mall_directory`)
was verified running under CFT.

## Actors & models

| Role | Who | Notes |
|---|---|---|
| Orchestrator | opencode (this session) | writes/updates briefs, approves claude, runs verifications, commits |
| Implementer | **claude** in tmux session `claude-flutter-grill` | implements the delegated slices from the brief files in `~/temp/opencode/flutter-app-builder/`; manual mode, I approve |
| Semantic-lane LLM | **`opencode/deepseek-v4-pro`** | `MODEL` in `builder/src/requirements.ts` and `builder/src/business_rule_agent.ts` |
| Browser harness | `new_chrome_ext` browserpilot + CFT | CFT on `:9222`, local-agent on `ws://127.0.0.1:4777/ws`, Go driver rides a live tab |

## Current state (ground truth, 2026-08-14)

- ✅ Phase 1 + Phase 2 (deterministic core): done — 24 generators, plan.json, region
  content-hash, lockfile tuple, 8-input scoring, component registry, arch linter.
- ✅ Phase 3b oracle: `rule.schema.json` `rows[]` + `daysSince>|<`, `<rule>.oracle.json`
  corpus, blocking `oracle-coverage` gate, `RuleOracleTestGenerator`. Committed `eb87a58`.
- 🚧 **Phase 3a (IN PROGRESS, claude):** `builder/src/business_rule_agent.ts`
  (NL → `RuleModel`, schema-validate, entity/field cross-check, provenance stamp,
  `extensionQueue` §19.4, `--fixture` deterministic verify) + fixture +
  `builder/samples/promo.ir.json` (`promotionStatus` decision-table rule + `daysSince>`)
  + `promotionStatus.oracle.json`. Uncommitted — under review.

## Track A — Finish the semantic lane (Phase 3a)

1. Claude completes `business_rule_agent.ts` + fixture + promo sample per
   `IMPLEMENT_BUSINESS_RULE_AGENT.md`.
2. Verify (orchestrator): `typecheck:builder`; `--fixture` dry-run produces schema-valid,
   provenance-stamped rules + extension queue; all samples (`expense.semantic`,
   `inventory`, `todo`, `promo`) generate + `validate.ts` PASS; promo app
   `flutter pub get && flutter analyze && flutter test` green (incl. decision-table
   oracle test).
3. Commit as a small commit (e.g. "add Phase 3a BusinessRuleAgent: NL→RuleModel,
   schema-validated + extension queue").
4. Loop to grilling/docs only if verification fails; otherwise move to Track B.

## Track B — Run the generated app (web)

The generated app is a normal Flutter app; run it headless-friendly:

```bash
# from a generated outDir (e.g. /tmp/oracle_promo or builder/output/<sample>_web)
flutter pub get
flutter build web --no-tree-shake-icons --no-wasm-dry-run   # -> build/web
python3 -m http.server 8123 --directory build/web &         # serve the static build
curl -s http://127.0.0.1:8123 | head -c 120                 # sanity: HTML boots
```

Acceptance: the built app serves; `curl` returns Flutter's bootstrap HTML.

## Track C — Test in CFT via new_chrome_ext (malls-app pattern)

Mirror the verified CFT workflow (`new_chrome_ext/tools/DRIVERS_GUIDE.md`):
1. **Launch CFT** headless with anti-throttle flags + `--remote-debugging-port=9222`
   (the exact invocation from DRIVERS_GUIDE.md; headless is required so
   `requestAnimationFrame` pumps and Flutter web actually renders).
2. **Browserpilot local-agent** on `ws://127.0.0.1:4777/ws` (binary
   `~/temp/opencode/bp-tree/apps/local-agent/bin/browserpilot`).
3. **Drive a live tab** via chromedp/CDP (like `tools/crm/ -action routes`): find the
   page tab id from `curl -s http://127.0.0.1:9222/json/list`, `Page.navigate` to
   `http://127.0.0.1:8123`, then assert:
   - app boots (Flutter root `flt-glass-pane` / rendered `flutter-view` present),
   - primary screen renders (find the generated screen's text/`Semantics` node),
   - `console.error`/failed-network captures are empty,
   - screenshot to `docs/qa/<sample>/` as evidence.
4. The malls-app equivalent was `verify:flutter` (analyze+test) **plus** running the
   web build under CFT; we mirror both: Track B+C = the CFT run+test gate.

## The loop (do-not-stop)

```
[claude implements slice] → [I verify typecheck/validate/flutter] → [I commit]
→ [Track B serve] → [Track C drive CFT + assert] → [green? DONE : feed failures back to claude, repeat]
```

- Loop until: semantic lane sample (promo/expense) builds to web, serves, **and** the CFT
  driver reports app-boots + screen-renders + zero console/network errors.
- One slice per commit; nothing deleted; never bypass the oracle/approval gates.
- All agents: `opencode/deepseek-v4-pro`; claude's briefs in
  `~/temp/opencode/flutter-app-builder/`.

## Acceptance criteria (Definition of Done)

1. `npm run typecheck:builder` clean.
2. All samples `VALIDATION PASSED` (incl. `[oracle] PASS`).
3. A generated sample app: `flutter build web` succeeds AND is served.
4. CFT drive: page navigates to the served app, Flutter renders, screen visible,
   no console/network errors — evidenced by a screenshot + report under
   `docs/qa/<sample>/`.
5. `BusinessRuleAgent` proven via `--fixture` (schema-valid rules, provenance stamped,
   unexpressible → extension queue) — the semantic lane, not just the deterministic core.
