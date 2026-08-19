# BREL/ChatGPT-reply assessment — addendum to BREL_DECISION.md

> Read-only notes (2026-08-19). Owner supplied a ChatGPT reply reviewing the generator
> architecture. This doc records which of its claims are already true, which are real gaps, and
> what we decided to do. It deliberately does NOT re-litigate BREL_DECISION.md.

## The one refinement worth folding into the BREL slice
ChatGPT item 4: prefer a nested expression shape over the flat `{fn,args,op,value}` form:
```
{ "left": { "fn": "daysSince", "args": [{ "field": "endDate" }] },
  "op": ">",
  "right": { "value": 0 } }
```
Cleaner grammar (Comparison over ValueExpression), scales to `sum`/`length`/`length of list`
later without adding special cases. **ADOPT as the canonical AST shape in the BREL brief**; keep
the flat form acceptable on input, normalize to nested internally.

## Claims already true in the repo (do not rebuild)
- Schema validation + semantic gates exist: 15 JSON schemas (`builder/schemas/`), ~45 validate
  gates (`[oracle] [verdict] [money] [tenant] [split] [plan-determinism] [shell] …`).
- IR is effectively layered by schema-per-concern (`schemaVersion, name, attributes, enums,
  entities, businessRules, repositories, states, screens, useCases`).
- States are deterministic (`state.ts` + state.schema.json).
- Screens have a single deterministic selector owner (`composition.ts` + screen.schema.json).
- Capability matrix exists: `CAPABILITIES.md` (L1–L5 / MF1–MF6).
- Generator-as-compiler concept, multi-target (`targets/`, `attributes.platform`, SwiftUI target).

## Real gaps (candidates, NOT in current scope)
1. **Canonical IR / normalizer layer** — no `normalize → canonical IR` step; generator consumes
   raw IR directly (`usecase.ts` needs explicit `uc.operation`, no repository→usecase derivation).
   Biggest gap. Would enable `expense.ir.json` vs `expense.semantic.ir.json` migration tests.
   **DECISION: DEFER** — a large architectural slice touching every generator; not needed for the
   current kids_quiz/rule work. Revisit after BREL lands.
2. **Repository → UseCase derivation** — currently explicit; small simplification. DEFER.
3. **Numbered lint codes (IR001–IR011)** — gates exist but unnumbered; cosmetic. DEFER.
4. **5-layer IR file split** — flat file already layered by schema; not required. DEFER.

## Bottom line
ChatGPT's architecture vision is sound but overclaims what's missing. The only change adopted now
is the **nested BREL expression shape**. Everything else is either already implemented or DEFER.
