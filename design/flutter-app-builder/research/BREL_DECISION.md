# SPIKE-BREL — Formal Business Rule Expression Language: Decision Brief

> **Audience:** owner. **Purpose:** make an informed go/no-go on adopting BREL (a proposed Formal
> Business Rule Expression Language for the IR) in place of / alongside the current closed rule
> language (§19). **Form:** executive summary → hypothesis → ground truth → analysis →
> decision → recommended implementation → rejected alternatives → open questions → follow-up.
> Companion to `DESIGN.md` §19 and the rule primitives in `builder/src/types.ts`.

**Status: MODIFY — adopt the additive expressive core; reject the closed-boundary violations.** Date 2026-08-19.

---

## 1. Hypothesis

BREL's proposed `when`/`then` expression-tree rule language is a strict improvement over the
current closed rule language and should replace it in the IR.

This brief **does not assume that hypothesis holds**. It investigates BREL against the existing
language and the generator that consumes it, then decides.

## 2. Ground truth — what the current language actually is

**Repository evidence** (`builder/src/types.ts:411-445`, `builder/src/business_rule_agent.ts`,
`builder/src/generators/policy.ts`, `builder/src/validate.ts`, `builder/samples/rules/*.oracle.json`):

- **`RuleOperator`** (`types.ts:411-413`): `>= <= > < == != contains daysSince> daysSince<`.
- **`RuleModel`** (`types.ts:421-434`): `name`, `entity`, `conditions[]` (AND-only flat form),
  `result` (string), optional `rows[]` (decision table), optional `severity`
  (`autoApprove | warn | requireJustification | block`), optional `message`, optional `points`.
- **`DecisionTableRow`** (`types.ts:436-439`): `outcome` + `conditions[]` (AND within row).
- **`RuleCondition`** (`types.ts:441-445`): `field`, `operator`, `value`.
- **`business_rule_agent.ts`** (§19 semantic lane): parses NL → `RuleModel[]` in the closed
  language; anything unexpressible (quantifiers, top-N, cross-entity, arbitrary computation) →
  `extensionQueue`. Operators include `daysSince> daysSince<` with `value` = day count.
- **`policy.ts`** (L2 policy engine): consumes `severity` (`autoApprove/warn/requireJustification/block`),
  `message`, `points`, and the decision-table `rows`. `autoApprove` → informational; `warn` → shows
  never blocks; `requireJustification` → blocks until justification; `block` → always blocks until waived.
- **Oracle correctness gate** (§9.4, `validate.ts` `[oracle]`/`[verdict]`): every rule ships
  `<rule>.oracle.json` with `input`/`expected` cases; the oracle's `expected` maps to the rule's
  `result`. A severity'd rule additionally requires `message` (`[verdict]` gate).

**Grounding in real samples:** kids_quiz uses AND-only flat rules (`q1Answer == b` etc.),
`PerfectRun` is a 3-condition AND. `promotionStatus.oracle.json` is a decision table. `LargeAmount`
is a flat threshold rule. The `Split.oracle.json` covers the split-group path.

## 3. What BREL changes vs. what it preserves

| Aspect | Current (§19) | BREL proposal | Compatibility |
|---|---|---|---|
| Condition structure | `conditions[]` (AND-only) | `when` expression tree (`and/or/not/exists/fn`) | **Breaking shape** unless additive |
| Operators | 8 (`>= <= > < == != contains daysSince*`) | 19 (`… startsWith endsWith matches in notIn isNull isNotNull isEmpty isNotEmpty`) | Additive superset (mostly) |
| Temporal | `daysSince>` operator | `fn: daysSince/daysUntil/isBefore/isAfter/isBetween` | Better fit to §19's "`daysSince(...)`" intent |
| Severity | `autoApprove/warn/requireJustification/block` | `info/warn/error/block/requireJustification` | **BREAKING** — drops `autoApprove`, adds `info`/`error` |
| Outcome | top-level `result` | `then.result` | **Breaking** — oracle `expected` maps to `result` |
| Decision table | `rows[].outcome` + top-level `result`=default | `kind:decisionTable` + `rows[].then.result` + `default` | **Breaking** rename |
| Quantifiers/aggregates | **Out of scope → extension queue** (§19:633) | `exists`, `sum`, `length` | **VIOLATES §19 boundary** |
| Side-effects/events | State machine + effect runner (§19) | `then.set`, `emit` | Conflicts with §19 state-machine home |

## 4. Questions (answered with evidence, not preference)

1. **Does BREL add genuinely new expressiveness the current language lacks?** *Yes — one real gap:*
   logical `or` / `not`. The current flat `conditions[]` is AND-only; "any of several correct
   answers" is unexpressible and currently falls to the extension queue. This is the strongest
   argument for BREL. String/collection operators (`startsWith`, `isNull`, `isEmpty`) are useful
   but lower-value; the fn registry is a cleanliness win matching §19's stated temporal intent.
2. **Does adopting BREL as-is break the generator/oracle/validator?** *Yes.* `policy.ts`,
   `validate.ts`, `operations.ts`, and `business_rule_agent.ts` all read top-level
   `conditions`/`result`/`rows[].outcome`/`severity`. BREL burying them under `when`/`then` and
   dropping `autoApprove` is a breaking IR-grammar migration — not a rename.
3. **Does BREL respect the closed-language boundary (§19:633)?** *No.* `exists`, `sum`, `length`
   re-open "quantifiers over collections" that §19 explicitly sends to the extension queue.
4. **Does BREL preserve the oracle contract (§9.4)?** *Silent.* The oracle's `expected` ↔ `result`
   mapping is unaddressed; moving `result` into `then.result` changes that contract.

## 5. Decision — MODIFY

- **ADOPT (additive):**
  - Logical combinators — `and` / `or` / `not` expression tree. This is the one real gap and the
    primary value of BREL.
  - Function registry — `daysSince` / `daysUntil` / `isBefore` / `isAfter` / `isBetween` as `fn`
    calls, replacing the ad-hoc `daysSince>`/`daysSince<` operators.
  - Extra string/null/collection operators (`startsWith`, `endsWith`, `matches`, `isNull`,
    `isNotNull`, `isEmpty`, `isNotEmpty`, `in`, `notIn`) — additive to `RuleOperator`.
  - JSON Schema for the expression grammar — aligns with schema-validation posture.
- **MODIFY (to preserve compat):**
  - Keep `autoApprove` in the severity enum (do not drop it); if `info`/`error` are wanted they are
    additive aliases, never a removal.
  - Express `or`/`not` as an **additive** alternative to `conditions[]` (e.g. a rule's `conditions`
    may hold a single expression, or an optional `when` sits beside `conditions`) so every existing
    IR stays valid without migration (§19.3 additive-only rule).
  - Keep the oracle `expected` ↔ `result` mapping intact; `then.result` must map back to the same
    `result` the oracle asserts.
- **REJECT / DEFER:**
  - `exists` (quantifier over a collection) + `sum`/`length` aggregates → stay in the extension
    queue; re-opening them is a §19.3 grammar-bump decision requiring its own spike, not a side-effect
    of adopting combinators.
  - `then.set` side-effects and `emit` events → the state machine + deterministic effect runner (§19)
    is the correct home; do not overload flat rules with them.

## 6. Recommended implementation (from the decision, not the hypothesis)

Slice scope (additive, backward-compatible):
1. **`types.ts`**: extend `RuleOperator` with the new operators; add an optional `Expression`-shaped
   alternative to `RuleCondition` for `or`/`not`/`fn`; keep `autoApprove`. No field renamed.
2. **`business_rule_agent.ts`**: teach the parser the expression tree; still route quantifiers →
   extension queue (unchanged boundary).
3. **`policy.ts` + `operations.ts`**: evaluate the expression tree in the policy engine.
4. **`validate.ts`**: extend `[oracle]`/`[verdict]` to validate expression-tree rules; a rule using
   `or`/`not` still needs an oracle with ≥1 case.
5. **New sample/oracle** demonstrating `or` (e.g. "any of several answers correct") to prove the
   additive path and its oracle.
6. **Determinism + backward compat**: regen all 5 benchmark apps + kids_quiz must stay byte-identical
   (existing rules untouched); determinism gate + regen diff guard it.

## 7. Rejected alternatives

- **Full BREL swap (ADOPT as-is):** rejected — silently breaks `autoApprove`, the oracle `result`
  contract, and re-opens the closed boundary without a §19.3 grammar-bump decision.
- **Do nothing:** rejected — leaves the genuine `or`/`not` gap unfilled (falls to extension queue today).

## 8. Open questions

- Should `info`/`error` be added as severity *aliases*? (Recommend: yes, additive only.)
- Is the fn registry worth the churn vs. just adding `or`/`not`? (Recommend: fn registry is
  low-risk and matches §19's temporal intent; bundle it.)
- Should `exists`/`sum` ever be re-admitted? That is a separate §19.3 grammar-bump spike, not this one.

## 9. Follow-up

Dispatch the additive combinator + fn-registry slice to the implementer lane (`s-hermetic`) as an
implementation brief; verify via typecheck, validate gates, flutter analyze/test, determinism diff,
and all-sample byte-identity. Revisit quantifiers only through a dedicated grammar-bump spike.
