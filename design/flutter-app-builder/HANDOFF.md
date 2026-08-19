# HANDOFF — BREL decision brief (round: 2026-08-19, part 5)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**BREL (Formal Business Rule Expression Language) — MODIFY decision recorded.** Owner proposed a
full IR rule-language replacement. Spike concluded a straight swap breaks the generator/oracle/
validator and re-opens the §19 closed boundary; decision is to **adopt the additive expressive
core** (`or`/`not` combinators + `fn` registry + extra operators + JSON schema) while rejecting
quantifier aggregates and side-effects. HEAD `db301fa` (USAGE.md guide). Decision doc
`research/BREL_DECISION.md` written, uncommitted.

## This round

### (Earlier part) nosql persistence fix — DONE (`cc75d8c`, pushed)
See `context_history.md` for the archived summary.

### Orchestrator USAGE guide — DONE (`db301fa`, pushed)
`tools/orchestrator/USAGE.md` — in-repo operator guide grounded in the run_loop/poll/report/
adapter patterns. Also reviewed opencode session DB (30 sessions; 6 paid at ~$13 total, rest
zero-cost research spikes).

### BREL decision brief — DONE (uncommitted)
`research/BREL_DECISION.md`: hypothesis → ground truth (§19 language from `types.ts`,
`business_rule_agent.ts`, `policy.ts`, `validate.ts`, oracles) → analysis → **MODIFY**.

- **ADOPT (additive):** `or`/`not`/`and` expression tree (the one real gap — current language is
  AND-only), `fn` registry (`daysSince`/`daysUntil`/`isBefore`/`isAfter`/`isBetween`), extra
  string/null/collection operators, JSON schema.
- **MODIFY:** keep `autoApprove` in severity; keep oracle `expected`↔`result` mapping; express
  `or`/`not` additively beside `conditions[]` so existing IRs stay valid (§19.3 additive-only).
- **REJECT/DEFER:** `exists`/`sum`/`length` aggregates (re-open §19:633 closed boundary) and
  `then.set`/`emit` side-effects (state machine + effect runner is the right home).

### Verification
- Typecheck: not yet run (doc-only round so far; no `builder/src` change).
- Next: dispatch additive combinator + fn-registry slice to `s-hermetic` lane as implementation brief.

## Open findings ahead
1. `screen.ts` `appStringsUsed` unused_import (v1.1 probe, low).
2. `tasks` stray `test/temp_all_flows_test.dart` (breaks 5 tests, not generator-emitted).
3. Per-locale / human seed-content IR block (nice-to-have).
4. BREL additive combinator + fn-registry slice (decision recorded; implementation pending).

## Next steps
1. Commit `research/BREL_DECISION.md` + CODE_CATALOGUE/HANDOFF updates.
2. Dispatch the BREL additive-combinator + fn-registry implementation brief to the `s-hermetic`
   lane; review + verify the returned diff (typecheck, validate gates, flutter analyze/test,
   determinism, all-sample byte-identity).
