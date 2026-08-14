# AGENTS.md — operating instructions for AI agents working in this repo

This file is the authoritative operating contract for any AI agent (opencode,
Claude Code, subagents) working in this repository. Read it first. It binds
over tool-only guesses; when in doubt, prefer the explicit rules here.

## Repository shape

- `lib/` + `test/` — **payment pilot** Flutter app (Rasheed). Working, do not
  regress. Follow existing feature-first layout and the dispatch pattern.
- `builder/` — **Flutter App Builder**: a deterministic compiler that turns
  `requirements → IR → idiomatic Flutter`. This is the active work area.
- `design/flutter-app-builder/` — design source of truth:
  - `DESIGN.md` (v3.5) — the authoritative design. Cite section numbers when
    you reference a rule (e.g. §9.4 oracle, §19 rule language).
  - `PHASE_PLAN.md`, `HANDOFF.md`, `GRILLING.md`, `BENCHMARK.md` — phase/state docs.
- Node package: `fahs-specs` (root `package.json`). Flutter package: `fahs`.

## Non-negotiables (hard rules)

1. **Never delete anything.** Changes are additive. If something must go, ask
   first. "Fix" means extend, not remove.
2. **Small commits only.** One logical slice per commit. Commit only when the
   user asks, or when the user's workflow requires it ("always do small
   commits"). Never commit secrets.
3. **Deterministic core is 0% LLM.** Generators are pure `(IR, ctx) → string`;
   only `builder/src/index.ts` does I/O. The LLM never writes code — it produces
   schema-validated `IR`/`RuleModel` (semantic lane) that is BLOCKED until human
   approval.
4. **Correctness needs an independent oracle.** A business rule with no
   (or zero-case) `<rule>.oracle.json` fails validation (blocking gate in
   `builder/src/validate.ts`). Never bypass it.
5. **Trust boundary**: LLM agent output is stamped `origin=llm-inferred,
   requiresApproval=true` and generation refuses until `builder/src/approve.ts`
   attests `actor=human:attested`. Don't weaken this.
6. **Generated code is owned by the compiler.** Header comment
   `// [generated] generator=… ownership=generated`. User regions are preserved
   by content-hash (`regions.json`) — never silent-overwrite.
7. **SOLID applies to all new code** (see the briefs pattern): one module =
   one concern; generators emit strings (no I/O); the oracle module only reads
   the corpus; the composition root (`index.ts`) wires; depend on types, not I/O.
8. **Lean handoff every round.** At the end of each round (or when the user asks),
   overwrite `design/flutter-app-builder/HANDOFF.md` with a lean, current-state
   summary (objective, actors, repo map, ground truth table, commits, in-flight
   work, verification commands, next steps, rules). **Move the previous HANDOFF
   content to `design/flutter-app-builder/context_history.md`** (append, dated
   header) so HANDOFF stays lean and history is preserved.
9. **Send goldens + progress to Telegram each run.** After generating/updating
   screens, capture iPhone-size goldens (golden tests already set `390×844`) via
   `flutter test --update-goldens`, then send the `.png`s + a one-line progress
   note to the owner over Telegram (mac_companion bot). Send photos with:
   `curl -s -F "chat_id=1117739189" -F "photo=@<file.png>" "https://api.telegram.org/bot$(cat ~/.mac_companion/token)/sendPhoto"`
   and text with `sendMessage` (`text=` field). Goldens MUST render real text —
   the golden test loads Roboto via `FontLoader` + `buildTheme()` (never bare
   `MaterialApp`, which renders Ahem boxes).

## Commands (run from repo root unless noted)

```bash
npm run typecheck:builder            # strict tsc on builder/ (run after every change)
npx ts-node --transpile-only builder/src/index.ts <ir> <out>   # generate an app
npm run validate:gen                 # determinism + headers + secrets + idioms + arch + oracle
npm run pipeline                     # generate→pub get→analyze→test→build web→validators
npm run server                       # HTTP API on :8787 (POST /generate, /requirements, /generate/full)
npx ts-node --transpile-only builder/src/validate.ts <ir> <out> # run AFTER generating <out>
npx ts-node --transpile-only builder/src/approve.ts <ir-file>   # human attestation gate
npx ts-node --transpile-only builder/src/benchmark.ts            # semantic parity
npx ts-node --transpile-only builder/src/regen.ts <ir> entity:X  # affected-set
npx ts-node --transpile-only builder/src/extract.ts <dart> Name  # reverse extraction
```

Sample IRs: `builder/samples/{expense.ir.json, expense.semantic.ir.json,
inventory.ir.json, todo.ir.json, rasheed.ir.json, promo.ir.json}`.
Oracle corpus: `builder/samples/rules/<rule>.oracle.json`.

## LLM agent work (semantic lane)

- Default model for agent LLM calls is **`opencode/deepseek-v4-pro`** (see
  `MODEL` in `builder/src/requirements.ts` and `builder/src/business_rule_agent.ts`).
- `builder/src/requirements.ts` — RequirementAgent: NL → structural IR.
- `builder/src/business_rule_agent.ts` — BusinessRuleAgent: NL business rules →
  `RuleModel[]` in the closed rule language (§19). Deterministic shell:
  parse → schema-validate → cross-check entity/field references → stamp
  provenance → split unexpressible rules into `extensionQueue` (§19.4).
  Live path is a thin wrapper; verification uses `--fixture`.
- After producing IR with LLM-inferred elements: run `approve.ts`, then
  generate, then validate. A rule without an oracle stays blocked.

## Verification workflow (required before reporting done)

1. `npm run typecheck:builder`
2. For each affected sample: generate then validate
   (`index.ts` then `validate.ts` on the same outDir).
3. For a sample app: `flutter pub get && flutter analyze && flutter test`
   in the generated outDir (goldens: `flutter test --update-goldens` first).
4. Report exact command output; the orchestrator reviews and commits.

## References

- Architecture/design: `design/flutter-app-builder/DESIGN.md`
- Grilling (scope/planning): `design/flutter-app-builder/GRILLING.md`
- Roadmap phases: `DESIGN.md §25` — v1 = end of Phase 3 (semantic lane + trust boundary).
