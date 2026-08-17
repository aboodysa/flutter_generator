# Context History — Flutter App Builder

## Archived 2026-08-14 (round: end-of-design-session)

# HANDOFF — Flutter App Builder (greenfield design)

> Written Thu Aug 13 2026 (end of session). Everything needed to resume tomorrow.

---

## 1. What this is

Designing a **general-purpose Flutter Application Compiler/Builder** (not "an AI that writes Flutter code"). Hybrid pipeline: deterministic/schema/template generators produce most artifacts; an LLM is used only for reasoning/business logic, and writes into a validated Intermediate Representation (IR), never raw code.

Greenfield — no FAHS/MASAR/AppsInspector/any existing project baggage.

**The one non-negotiable rule:** never ask the LLM to generate code when a deterministic generator can — and never trust deterministic code is *correct* without an independent oracle.

---

## 2. Files (all under `design/flutter-app-builder/`)

| File | Status | Contents |
|---|---|---|
| `DESIGN.md` | v2 (needs v3) | Full design: IR, taxonomy, 4 generation classes, generation matrix, generators, LLM agents, plugins, ownership, regen, validation, testing, MVP. §22 = griller/reviewer resolution table. |
| `GRILLING.md` | done | 3-part hardening record: **Griller (19 findings)** → **Reviewer (verdict)** → **Claude Code live grilling (5 rounds, converged)** + convergence summary. |
| `CHATGPT_RESPONSE.md` | NOT grilled | Second external opinion (ChatGPT). Pending: grill + pros/cons. |
| `claude-session.log` | live | tmux-piped log of the running Claude Code session (benchmark research). |
| `_claude_dialogue.txt` | scratch | Raw extracted Claude dialogue (folded into GRILLING.md). |

Temp working copies also at `/Users/username/temp/opencode/flutter-app-builder/` (prompts, replies, v1 draft).

---

## 3. Hardening history (what's already been fixed)

**Griller pass (subagent)** found 19 flaws → DESIGN.md v1→v2 resolved all (see §22): confidence/oracle, LLM-boundary leak, determinism overclaims, pattern selection, IR under-spec/versioning, round-trip lie, regen safety, dependency graph, plugin layer, rule language, circular test oracle, MVP phasing, security, observability, async, multi-env, localization, persistence, purity.

**Reviewer pass (subagent)** → "APPROVE WITH CHANGES": 5 remaining issues (oracle not independent; Novel-lane is rule not mechanism; affects edges hand-declared; rule language sketch; 3-way merge base) + consistency errors.

**Claude Code live grilling (tmux)** — 5 rounds, all converged. The six load-bearing conclusions to fold into DESIGN.md v3:

1. **Novel-lane write-ACL** — field-level ACL enforced by the Validator, keyed on `actor` provenance derived from the pipeline stage credential. `human` = *attested interactive token* (signed approval from a real prompt), NOT an API key. `implementation`/`classification.class` live in a human-only subschema; agents structurally cannot write them.
2. **Domain-modeling oracle split** — `origin: schema-structural` (conf 1.0; only facts the DDL encodes with zero interpretation: column type, FK target, cardinality tier) vs `schema-interpreted` (conf <1.0 → human-confirm gate). Pure-NL domain modeling has NO artifact oracle → `requiresApproval` defaults true until human-confirmed. Split "is codegen deterministic" (always true for structural) from "is the IR value trustworthy" (depends on origin).
3. **Approval routing 2×2** — human-touchpoint budget keyed on **Reversibility × Blast-radius**: Tier R (reversible: naming, VOs, golden baselines) = batched + deferrable; Tier I (irreversible/high blast: money/permission/compliance) = solo + blocking. Review-clustering axis is **decision-type × blast-radius**, NOT structural similarity (shape-similar entities hide high-stakes outliers).
4. **Plugin economics** — generation **strategies** (2–3 template families: observable-notifier / sealed-events / mutable-notifier), NOT "abstract adapter interface". Declare **coupled-pair matrices explicitly** (state-mgmt × DI ~6 cells); all other axes are orthogonal and never multiply (Clean Architecture already decouples them).
5. **Grammar growth vs deployed code** — never auto-migrate. Grammar bumps are additive; surface a **3-way behavioral diff** (old tests, primitive spec, set-difference) as an opt-in human-approved suggestion. "IR is single source of truth" is **per-app, per pinned grammar version** — not fleet-wide.
6. **Plugin idiomaticity** — no similarity threshold exists. Golden-reference re-review is **binary + version-triggered** (any GenerationContext bump touching the plugin template set = mandatory human re-review). AST diff is a UI aid only. Plugin quality is permanently outside automated self-certification.

Two threads opened but unresolved: (a) Phase-0 must be **stratified** (multiple slices by rule category), not a single slice; (b) data/privacy of human example/expected-value pairs (free-text PII leak is the unsolved case).

---

## 4. Current task in flight: benchmark + tier-one research

Claude Code (tmux session `claude-flutter-grill`, restored after the first instance hung on background agents) is running the benchmark/research:

- **Task:** benchmark low-code/no-code (OutSystems, Mendix, Appsmith, Retool, Bubble, FlutterFlow, Draftbit, Glide, Adalo, Builder.io) + LLM code agents (Copilot, Cursor, v0, Lovable, Bolt.new, Replit Agent, GPT Engineer, Aider, OpenHands, Pythagora, MetaGPT). Columns: IR (or none), determinism-vs-LLM, regen-of-edited-code, known failure mode. Plus tier-one research (LLM codegen reliability, LLM-as-judge fallacy, low-code+LLM). Then synthesis vs DESIGN.md + ranked "design deltas".
- **Constraint given:** no background agents; use Web Search; stop if web unavailable; tier-one sources only (NeurIPS/ICML/ICLR/ACL/EMNLP/ICSE/FSE/ASE/PLDI/POPL/OOPSLA; SWE-bench/Verified, HumanEval, LiveCodeBench, BigCodeBench); flag uncorroborated claims.
- **Web Search permission:** already granted (option 2, "don't ask again").

### How to check on it tomorrow

```bash
tmux attach -t claude-flutter-grill        # watch it live
tail -f design/flutter-app-builder/claude-session.log   # follow the piped log
```

If the session hung again, kill + restore:
```bash
tmux kill-session -t claude-flutter-grill
# then re-run: tmux new-session -d -s claude-flutter-grill -c /Users/username/temp/opencode/flutter-app-builder
#   tmux send-keys -t claude-flutter-grill "claude" Enter
# prompt is at /Users/username/temp/opencode/flutter-app-builder/BENCHMARK_PROMPT2.txt
```

---

## 5. Pending deliverables (in order)

> **Update (next day):** Benchmark + phase plan are now DONE. See `BENCHMARK.md` (tier-one research + synthesis) and `PHASE_PLAN.md` (Phase 0→4, with entry/exit criteria, mechanism placement, out-of-scope list, and the one-sprint investor demo). The ChatGPT grilling (below) still needs pros/cons.

1. **Fold the 6 converged findings into DESIGN.md v3** (§2.2 provenance `actor` field, §3.3 ACL + origin split, §9 approval 2×2, §10 generation strategies + coupled-pair matrices, §16.2/§2.4 per-app truth scoping + 3-way behavioral diff, §20.3 binary version-triggered plugin re-review). Also fix the reviewer's §4.5/§22 broken cross-references and the `offlinePolicy`/`syncStrategy` naming.
2. **Grill ChatGPT's response** (`CHATGPT_RESPONSE.md`) → pros + cons. (Pre-notes: it agrees with the settled 80% — IR-first, artifact-not-layer, business-rule IR, ownership, vertical slice, mechanical DI/routing, state-as-adapter — but asserts an unevidenced "80/20" split, uses the "adapter" over-claim we already rejected, only handles toy rules, ownership-without-enforcement, and is silent on oracle/confidence/security/async.)
3. **Incorporate benchmark results** (once Claude finishes) into DESIGN.md.
4. **Write `AGENTS.md`** — agent instructions for this repo (deterministic-first rule, IR as source of truth, trust boundaries, what agents may/may not write, ownership regions, the four generation classes, approval gates).
5. **Write framework-of-thinking doc** — the distilled mental model (determinism-first; IR semantic-not-implementation; LLM = reasoning only; generator/template/IR/plugin/validator/oracle/tests/approval roles; "mechanism, not policy" discipline).
6. **Phase 0+ MVP** — begin implementation per §23 (stratified vertical slice first), but only after the matrix/IR are locked.

---

## 6. Key design invariants to preserve (from the whole session)

```
LLM       = reasoning / interpretation / ambiguity / business logic
Generator = structure / boilerplate / schema transformation
Template  = known implementation pattern
IR        = single source of truth (semantic, versioned, migrated, per-app-per-version)
Plugin    = how semantics bind to a concrete library (generation strategy + conformance)
Validator = trust boundary (shape)
Oracle    = correctness boundary (human examples + invariants; NOT another LLM)
Tests     = proof of behavior
Approval  = gate for low-confidence, disagreement, critical logic, novel code
Discipline: every "mechanism" must have an executable definition — "policy, not mechanism" was the #1 recurring failure
```

---

## 7. Environment facts

- **Claude Code CLI** v2.1.210, Sonnet 5, logged in (login "expires in 2 days" — renew with `/login` if needed).
- **tmux** sessions: `claude-flutter-grill` (this one), plus unrelated: `app_nav`, `bot`, `claude-grill`, `grok-*`, `mac`, `monitor`, `usavisa`, `whatsapp`.
- Project working dir: `/Users/username/Documents/cto/flutter_generator` (repo has an unrelated FAHS HTML→Flutter generator — do NOT touch it; this design is greenfield and lives only under `design/flutter-app-builder/`).
- Claude Code stores conversation JSONL at `~/.claude/projects/-Users-username-temp-opencode-flutter-app-builder/`.
## Archived 2026-08-14 (round: P1 real screens + state-mgmt provider selection)

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

## Archived 2026-08-17 (round: Ledgerly-MVP completion + LM6 + SwiftUI S1/S2 parked)

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

## Archived 2026-08-17 (round: main capability loop COMPLETE — P1 shell, LM6, SwiftUI S1+S2 parked)

# HANDOFF — main capability loop COMPLETE (round: 2026-08-16 → 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status: main capability loop declared COMPLETE

Every item the owner asked to close this round is closed, verified, and committed. This round
had three threads: (1) a SwiftUI target spike, deliberately parked; (2) completing the
Ledgerly-MVP sample to full slice coverage including the final acceptance gap (LM6); (3) working
down the `LEFTOVER_NOTES.md` queue. All three are done.

## What shipped this round

**SwiftUI target — S1 (schema/platform knob) + S2 (module skeleton) — PARKED/DEFERRED**
`ca0eb39`. Landed and verified (typecheck clean, byte-identical regen across 10 IRs, 20 gates
incl. new `[platform]`/`[swiftpkg]`/`[swiftarch]`/`[swiftdeterminism]`), then explicitly parked
per owner directive so the main capability loop could continue. Not touched further this round —
still parked, no regressions introduced by anything below (SwiftUI-target IRs weren't in the
backward-compat sweep because no sample currently opts into it; the Flutter path is unaffected by
construction, since every SwiftUI addition was additive-only per S1/S2's own hard constraints).

**Ledgerly-MVP extended to full slice coverage** `9f70dcb` + `1b297af`:
L2 (8 seed policy rules across ExpenseClaim/MealBudget/Approval), MF3 (attachment/OCR stub),
MF4 (ExpenseClaimSplit), MF6 (offline outbox), L3 (audit log + CSV export), plus the L4
login-screen localization gap (G-L4-2). `apps/ledgerly/input/ledgerly.ir.json` now exercises
L1-L5, MF1-MF6, C1-C2 — see `LEDGERLY_MVP.md` for the full slice map. Along the way, 5 real
generator bugs the multi-feature combination surfaced (LM2-LM5, oracle-tag resolution /
symbol registration / dormant Session import / multi-Waive-button test ambiguity) were found and
fixed, each with its own regression test.

**LEFTOVER_NOTES.md queue worked down**: D1, G2a, G2b, L1a, M2 (arch-linter vacuous layer
detection + the real violation it surfaced), M3 (cross-feature symbol-table collisions) all
closed `e6608f5`/`9d3b948`/`90cfd41`/`77e4ed1`. M4 (sealed-class state codegen: `scoring.ts` can
select "sealed-events" but `state.ts` never implements that branch) was root-caused but
deliberately left **OPEN** — it's a real, correctly-scoped-out generator gap, documented with its
root cause and recommendation in `LEFTOVER_NOTES.md`, not attempted this round since it's its own
slice.

**LM6 — the final Ledgerly-MVP acceptance gap — CLOSED** `9415190` + `2b6a24f`:
ledgerly's own `Approval` entity was read-only (`ApprovalRepository` had only `listApprovals`);
"approve/reject workflow" was only proven via reimbursement's wizard, not ledgerly's own list.
Fixed generally, not as an Approval-special-case:
- Added `ApprovalRepository.updateApproval` (+ `UpdateApproval` use case) to the IR.
- New shared `operations.ts` helper, `quickDecisionTargets(ir)` — identifies any entity whose
  repo has `update` but not `create` (i.e. an update-only "review queue" shape) and derives its
  quick-decision button set from the entity's own status-shaped enum values, using the existing
  `AppChip.toneForStatus` vocabulary (danger-toned value → close icon, otherwise check icon) —
  no hardcoded "approved"/"rejected" strings anywhere.
- `screen.ts` consumes it to render list-row quick-decision `IconButton`s; `test.ts` consumes the
  *same* helper to generate a matching regression test (`quick_decision_test.dart`) — one source
  of truth for both, per this generator's established pattern.
- **Root-caused a second, real bug this surfaced**: `entity.ts` only auto-upgraded a Cubit's
  Equatable `props` to full-field equality for `crudFormTargets` (create+update) entities.
  Update-only entities stayed identity-only (`props => [id]`), so Bloc's `Cubit.emit()` silently
  no-op'd on "same id, different decision" — the button looked wired but nothing visibly
  happened. Fixed by extending the same auto-upgrade to `quickDecisionTargets` entities.
- Backward-compat verified byte-identical for hr_service/tasks/work_auth (stash+regen+diff both
  ways); real `apps/ledgerly/output/app` regenerated; `validate.ts` 20/20, `flutter analyze`
  clean (only the pre-existing unrelated `split_test.dart` info-lint), `flutter test` 83/83,
  goldens refreshed.
- `LEDGERLY_MVP.md` Proof-of-MVP checklist and the LM6 leftover-note entry both updated to reflect
  reality; capture(stub)/LM7 line re-confirmed accurate as-is (by design, no UI entry point).

**CDP acceptance re-run** against the regenerated app — `apps/ledgerly/output/qa/cdp-acceptance/
LM6-approve-reject-rerun.md`: signed in as manager Khalid Aziz, navigated to `/approval`,
approved one row and rejected another live in the browser — both flipped color/status/available-
actions correctly, sibling row untouched. Budget-remaining and CSV export re-checked as
non-regression controls (both still correct, unchanged from the prior run). Screenshots were
visually confirmed in-session but couldn't be persisted as files this round — the browser
automation's `save_to_disk` didn't yield a locally-resolvable path on this machine; the notes
file documents exactly what was observed at each step as the substitute record.

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| Ledgerly-MVP (L1-L5, MF1-MF6, C1-C2 on the ledgerly sample) | ✅ complete, all Proof-of-MVP checklist items `[x]` except the CDP line (`[~]`, only because capture(stub) has no entry point by design) |
| LEFTOVER_NOTES queue | ✅ all closeable items closed; M4 correctly left OPEN (own slice) |
| SwiftUI target S1+S2 | ✅ landed, PARKED/DEFERRED per owner directive |
| M4 sealed-class codegen | OPEN — root cause documented (`state.ts` never implements the "sealed-events" branch `scoring.ts` can select), recommendation in `LEFTOVER_NOTES.md`, not attempted (own slice) |

## Verification commands
```bash
npx tsc -p builder/tsconfig.json --noEmit
npx ts-node builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter analyze && flutter test
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real, full `apps/<app>/{input,output}`
convention) + `builder/samples/*.ir.json` (smaller probes).

## Next steps (not started, for whoever picks this up)
1. M4 sealed-class state codegen — its own slice, see `LEFTOVER_NOTES.md` for root cause.
2. SwiftUI target S3+ (CRUD/rules) — currently parked; resume only per owner directive.
3. Anything from `ROADMAP.md`'s P9+ backlog (backend-gen, real auth adapters, payments) — none
   of it was in scope this round.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + briefs in `~/temp/opencode/flutter-app-builder/`.
