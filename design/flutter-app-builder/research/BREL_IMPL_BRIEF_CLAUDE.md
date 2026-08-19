# BREL additive combinator + fn-registry slice — implementation brief (claude@s-hermetic)

> Source of truth: `design/flutter-app-builder/research/BREL_DECISION.md` (committed `b560aea`).
> You are asked to **review** the decision brief for correctness, then implement the **additive**
> slice it recommends. Read AGENTS.md + DESIGN.md §19 + the decision doc first.

## Context / what to re-anchor on
- This lane was freshly relaunched. Repo HEAD = `b560aea`. Pull latest first (`git pull`).
- The current closed rule language lives in `builder/src/types.ts` (§19): `RuleOperator`,
  `RuleModel`, `DecisionTableRow`, `RuleCondition`, `PolicySeverity`. Consumed by
  `business_rule_agent.ts`, `generators/policy.ts`, `operations.ts`, `validate.ts`.
- The owner proposed **BREL** (a full `when`/`then` expression-tree rule language). The decision
  brief concludes **MODIFY**: adopt the additive expressive core, reject the closed-boundary
  violations. Your job is to (1) review that conclusion against the actual code, and (2) if you
  agree, implement the additive slice below.

## Task 1 — Review the decision
Sanity-check `BREL_DECISION.md` against `builder/src/types.ts`, `business_rule_agent.ts`,
`policy.ts`, `validate.ts`, and `builder/samples/rules/*.oracle.json`. Specifically confirm:
- The current `conditions[]` is AND-only (no `or`/`not`) — is that accurate? Search the code.
- Severity enum is `autoApprove|warn|requireJustification|block` and BREL dropping `autoApprove`
  would be breaking — confirm against `policy.ts`.
- `exists`/`sum`/`length` quantifiers are out of scope per DESIGN.md §19:633.
Report a short verdict (AGREE or list corrections) in your final summary.

## Task 2 — Implement the additive slice
Scope is **additive-only and backward-compatible** (AGENTS hard rule: never delete; §19.3
grammar growth is additive; all 5 benchmark apps + kids_quiz must stay byte-identical). Do NOT
rename existing fields, do NOT remove `autoApprove`, do NOT migrate existing IRs.

1. **`builder/src/types.ts`**
   - Extend `RuleOperator` additively with: `startsWith`, `endsWith`, `matches`, `in`, `notIn`,
     `isNull`, `isNotNull`, `isEmpty`, `isNotEmpty`.
   - Add an optional, additive expression form for `or`/`not`/`fn` WITHOUT breaking existing
     `conditions[]` rules. Recommended shape (you may refine, keep it deterministic):
     `RuleModel` gains optional `expression?: RuleExpression` where
     `RuleExpression = { and?: RuleExpression[] } | { or?: RuleExpression[] } | { not?: RuleExpression } | { fn: string; args: string[]; op?: RuleOperator; value?: string } | AtomicCondition`.
     A rule may carry `conditions[]` OR `expression` (not both) — existing rules keep `conditions`.
   - Keep `PolicySeverity` unchanged (do NOT drop `autoApprove`).

2. **`builder/src/business_rule_agent.ts`** — teach the parser to accept the optional `expression`
   form in candidates. Keep the closed boundary: `exists`/quantifiers/aggregates still route to
   `extensionQueue` (unchanged).

3. **`builder/src/generators/policy.ts` + `operations.ts`** — evaluate the `expression` tree in
   the policy engine / gamified wizard so `or`/`not`/`fn` actually compile to Dart. Respect the
   oracle `expected` ↔ `result` mapping (unchanged).

4. **`builder/src/validate.ts`** — extend `[oracle]`/`[verdict]` (and any rule-shape validation) to
   cover expression-tree rules; a rule using `expression` still needs an oracle with ≥1 case.

5. **New sample + oracle** proving the additive `or` path (e.g. "any of several answers correct")
   — a small IR rule + `<rule>.oracle.json` with ≥1 case.

## Hard constraints
- Additive only. No removal, no rename of existing rule fields, no IR migration of existing apps.
- Do NOT touch existing generator branches for `conditions[]` rules — those must stay byte-identical.
- No new npm deps. No LLM in the deterministic core — generators stay pure `(IR, ctx) → string`.
- No `then.set`/`emit`/quantifiers — those are explicitly rejected in the decision.

## Verification (required before reporting done)
1. `npm run typecheck:builder` — clean.
2. For each affected sample: generate then `validate.ts` on the same outDir (all gates green).
3. For a sample app with an `expression`-form rule: `flutter pub get && flutter analyze && flutter test`.
4. Determinism: regen the 5 benchmark apps (keemart, tasks, work_auth, hr_service, ledgerly) +
   kids_quiz — must stay **byte-identical** (existing rules untouched).
5. Independently double-regen ONE app and `diff -r` — byte-identical.
6. Report exact command output for each step.

## Report-back format
- Task 1 verdict: AGREE or list corrections.
- Task 2: files changed (path → what changed → why), the new sample + oracle, verification output.
- Small commit per logical slice. Report to the owner on Telegram (rule 11).
