# BREL Semantic Type System + Validation — implementation brief (claude@s-hermetic)

> Source of truth: `BREL_DECISION.md` (MODIFY, committed `b560aea`), `BREL_CHATGPT_ADDENDUM.md`,
> and the just-merged additive slice (`465de72` + `57d7f4d`) which this brief extends. Read
> AGENTS.md, DESIGN §19, and those three first. Repo HEAD = `08e5b39`; pull latest first.
> This lane is freshly launched (kill+fresh) so start clean.

## Why this slice / where we are

The additive BREL slice shipped: `RuleModel.expression` (optional), `expression.ts` with
normalize/fields/compile, nested `Comparison(left,op,right)` AST, fn registry (daysSince/daysUntil/
isBefore/isAfter/isBetween), 9 new operators, `rule.expression` generator branch, live-recompute in
crud_form. Verified byte-identical for all existing apps; `choice_demo` proves the `or` path.

**The proven boundary is now frozen** (per owner). This slice must NOT expand operators/functions or
change the additive contract — it hardens the existing surface by making the expression a **typed**
language that rejects invalid field/operator/type combinations at **IR validation time**, instead of
discovering the problem during Dart generation.

## Task 1 — Canonical AST + normalization tests (hardening)

`expression.ts` has no unit tests today. Add a test file (follow the repo's existing test
conventions — check `builder/` for a vitest/jest setup, e.g. `builder/src/*.test.ts` or a `test/`
dir) covering, for `normalizeExpression` and `compileExpression`:
- every supported operator (`>= <= > < == != contains startsWith endsWith matches in notIn isNull
  isNotNull isEmpty isNotEmpty`)
- nested `and`/`or`/`not` (incl. mixed depth)
- field refs, function calls (value-kind inside Comparison; predicate-kind as bare leaf)
- flat → nested normalization for all 4 accepted input shapes (Comparison / flat fn-comparison /
  bare predicate / flat RuleCondition)
- malformed expressions (missing field/op/right, unknown fn, unknown shape) → error

## Task 2 — Semantic type system (the core ask)

Add a **type-checking layer** over `expression.ts` (new pure module, e.g. `builder/src/expression_types.ts`)
that resolves each field ref to its declared type and rejects type-incompatible operators **before**
Dart generation. Type resolution source: the target entity's `fields[]` (`Field.type` /
`Field.of` / `Field.semanticType` / `Field.nullable`), plus `enums[]` for `enum`/`of` references.

Typing rules (each with a deterministic check):
- `Money` fields (`semanticType:"Money"`) — only numeric comparison operators (`>= <= > <`); reject
  `contains`/string ops/`matches`.
- `DateTime` fields — only `>= <= > < == !=`; reject `contains`, `startsWith`, `matches`, `in`.
- `enum` fields (type `enum`, `of: <EnumType>`) — only `==`/`!=`/`in`/`notIn`; reject `>`/`<`/`contains`.
- `bool` fields — only `==`/`!=`.
- `String` fields — `== != contains startsWith endsWith matches in notIn`.
- `List` fields — `isEmpty isNotEmpty in notIn` (and `length`-style checks only if we later admit
  them; NOT now — keep surface frozen).
- `int`/`double` fields — numeric comparison ops; reject string ops.
- `isNull`/`isNotNull` — any field type (nullable or not) OK.
- Function argument types: `daysSince/daysUntil` arg must be `DateTime`; `isBefore/isAfter/isBetween`
  args must be `DateTime`. Reject a non-DateTime field passed to a date fn.
- Comparison operand compatibility: left and right side must be type-compatible (numeric vs numeric,
  DateTime vs DateTime, String vs String, enum vs enum constant, Money vs numeric literal).

Where the check lives: expose a `typeCheckExpression(e: RuleExpression, entity: EntityModel, enums:
EnumModel[]): string[]` (returns a list of human-readable violations, empty = OK) in the new module.
Wire it into BOTH:
1. `builder/src/validate.ts` as a new additive gate (e.g. `[expression-types]`) that runs over every
   `businessRules[].expression` — a rule with an invalid expression fails validation at generation
   time, NOT during Dart compile.
2. `builder/src/business_rule_agent.ts` `parseAgentOutput` — so LLM candidates that produce a
   type-invalid expression are caught in the semantic lane (consistent with the existing
   `unknownFields` cross-check).

## Task 3 — BREL evaluator parity + golden compilation tests

- Add a small deterministic **evaluator** in the new type-checking module (or a sibling
  `expression_eval.ts`) that computes a `RuleExpression` against a plain record of field values —
  mirroring the Dart `compileExpression` semantics exactly (same operator semantics, fn semantics,
  short-circuit `and`/`or`). This proves the Dart compiler and the reference evaluator agree.
- Add **golden compilation tests**: for a fixed set of representative expressions (flat and nested,
  each operator family, each fn), assert the committed expected Dart string from
  `compileExpression` AND the committed expected boolean result from the evaluator for a known
  field-value record. Commit expected outputs (additive; nothing existing changes).

## Task 4 — Migration compatibility (explicit, not incidental)

- Keep `conditions[]` as the legacy/current path — untouched, byte-identical.
- `expression` stays the additive path. Do NOT migrate any existing IR to `expression` in this
  slice (the fixture suite migrates later, deliberately).
- Update the `BREL_DECISION.md` follow-up note only if needed; otherwise leave it.

## Hard constraints (AGENTS + decision)
- **Additive only.** No removal, no rename of existing rule fields/types, no IR migration.
- **No new operators or functions.** The fn registry and operator set are FROZEN for this slice —
  the deliverable is typing + validation, not more surface.
- Do NOT touch the proven `conditions[]`/`rows[]` generator branches or `policy.ts`/`operations.ts`
  (they need no changes — verified in the last slice).
- No new npm deps. Deterministic core stays 0% LLM — the type checker is a pure function.
- No `then.set`/`emit`/quantifiers (`exists`/`sum`/`length` stay REJECTED).

## Verification (required before reporting done)
1. `npm run typecheck:builder` — clean.
2. New unit tests for normalize/compile/types/eval/goldens — all pass (report the command + count).
3. Regenerate `choice_demo` + validate: `[expression-types]` gate passes on its (valid) `or`
   expression; all other gates green.
4. Add a small **negative IR fixture** (a rule with a deliberately invalid expression, e.g.
   `amount contains "foo"` on a Money field) and show `validate.ts` rejects it with the new gate —
   this proves the typing layer catches the error at IR time, not Dart time.
5. Determinism: regen the 5 benchmark apps + kids_quiz — byte-identical. Independent double-regen of
   ONE app → byte-identical.
6. Report exact command output for each step.

## Report-back format
- Files added/changed (path → what → why), the new `[expression-types]` gate + negative fixture,
  verification output, golden files committed. Small commits per logical slice. Report to the owner
  on Telegram (rule 11).
