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

## Archived 2026-08-17 (round: P2 CLOSED, SPIKE M4 COMPLETE → superseded by M4a applied)

# HANDOFF — P2 CLOSED, SPIKE M4 COMPLETE (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**P2 (per-list search) — CLOSED.** **SPIKE M4 (sealed-class state codegen) — COMPLETE, decision
MODIFY.** Both per `INTERFACE_PATTERN_CONTRACT.md`/`SPIKE_PLAN.md` sequencing; `SPIKE_PLAN.md`
updated to reflect the M4 outcome (commit `908cd84`).

## P2 — per-list search, CLOSED

Three commits close the P2 brief (`research/P2_IMPLEMENTATION_BRIEF.md`) in full:

- `99da57b` — `searchFor`/`searchTargets` selector (`composition.ts`), `entity.primaryDisplayField`
  IR semantic (schema + `types.ts`), `screen.ts` SearchBar/filter/no-results template, `plan.json`
  `patterns.search`, new `[search]` validate gate. Also fixed a real `scroll_test.dart` fragility
  the slice surfaced (switched to `tester.scrollUntilVisible`).
- `dafe4b1` — declared `primaryDisplayField` on all 4 samples (tasks/hr_service/work_auth/ledgerly),
  regenerated real search UI + goldens. `validate.ts` 22/22 gates PASS on all 4 (`[search]` +
  `[shell]` + determinism all PASS), `flutter analyze` clean, `flutter test` green
  (36/36 hr_service, 22/22 work_auth, 83/83 ledgerly, tasks clean aside from a pre-existing
  unrelated harness issue).
- `f48e5a6` — CDP walk (ledgerly + tasks): filter-as-you-type, case-insensitive contains,
  no-results EmptyState, clear — all confirmed live on both a shelled (ledgerly) and unshelled
  (tasks) app, proving search and P1's shell compose independently. Findings under
  `apps/{ledgerly,tasks}/output/qa/p2-search/`.

Gate evidence: `[search]` PASS, `[shell]` still PASS, `[determinism]` still PASS, across all 4 real
apps — the acceptance invariant (contract §3.3) holds.

## SPIKE M4 — sealed-class state codegen, COMPLETE (decision MODIFY)

`research/SPIKE_M4_REPORT.md` (commit `b5eb50c`, remote opencode/tracematrix `germany3`) closes the
`LEFTOVER_NOTES.md` M4 item that had been root-caused but left OPEN. Investigated per
`SPIKE_PROTOCOL.md`'s research-not-implementation discipline: no `builder/src` edits from the spike
itself, decision recorded before any implementation.

**Finding — `SPIKE_PLAN.md`'s prior ground truth for M4 was wrong.** It claimed "today no sample
crosses the sealed-events threshold"; the spike's probe proves `builder/samples/rasheed.ir.json`'s
`AllExpenses` state does (11 ≥ `SEALED_EVENTS_THRESHOLD=8`), and that the already-shipped
`[strategy-fidelity]` validate gate already catches the resulting plan/emit mismatch
(`apps/rasheed/output/qa/validate_probe1.log`: `[strategy-fidelity] FAIL (1)`). The real defect is
that `scoreStateStrategy` (`builder/src/scoring.ts`) measures `statuses + extraFields` count
instead of DESIGN §5.2's stated `stateMachines[]` transition/guard surface — every IR in the repo
declares zero `stateMachines`, so the correct metric would fire sealed nowhere today.

**Decision: MODIFY.**
- **M4a (next step, not yet implemented)** — fix `scoreStateStrategy` to measure the
  `stateMachines` surface instead of field count. `scoring.ts`-only (+ `arch.ts` call-site passing
  `ir` through). No IR/schema change. Estimate S (1 slice). Unblocks `npm run build:rasheed` +
  validate, which currently FAILs.
- **M4b (deferred)** — implement the `sealed-events` template family in `generators/state.ts` +
  consumer branches (`screen.ts`, `crud_form.ts`, `generators/test.ts`). Not scheduled: no sample
  would exercise it under the corrected selector, and the cost is a permanent second
  template-family sync burden with no verifiable current benefit. Revisit only when a real IR
  declares a genuine `stateMachines` transition vocabulary.

Full decision, evidence, and rejected alternatives (ADOPT / REJECT-outright / raise-the-threshold /
implement-behind-current-metric) in `SPIKE_M4_REPORT.md` §13-§15. `SPIKE_PLAN.md` updated to match
(§0 grounding, M4 section, ownership matrix, sequencing diagram, not-scheduled register).

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (global shell) | ✅ shipped, committed `4e91e50` |
| P2 (per-list search) | ✅ **CLOSED** this round — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **COMPLETE**, decision MODIFY — `b5eb50c`; **M4a not yet implemented** (next step) |
| S-CTX, P3, P4, P5/D2, S-HERMETIC, S-DEEPLINK | Not started — see `SPIKE_PLAN.md` for scope/sequencing |
| Ledgerly-MVP, LEFTOVER_NOTES queue (pre-P1/P2 items) | ✅ complete (prior round, see `context_history.md`) |
| SwiftUI target S1+S2 | PARKED/DEFERRED (prior round) |

## Verification commands
```bash
npx tsc -p builder/tsconfig.json --noEmit
npx ts-node builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter analyze && flutter test
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real, full `apps/<app>/{input,output}`
convention) + `builder/samples/*.ir.json` (smaller probes, incl. `rasheed.ir.json` for the M4
probe).

## Next steps (not started, for whoever picks this up)

1. **M4a** — implement the `scoring.ts` selector fix (own slice, small — see `SPIKE_PLAN.md` M4
   section for the exact acceptance checklist). Can run locally or on a remote opencode channel;
   zero overlap with the interface-pattern spikes below, safe to do first or in parallel.
2. **S-CTX** — composition/plan determinism contract + `[plan-determinism]` validate gate (small,
   do before P3 per `SPIKE_PLAN.md`'s sequencing rule).
3. **P3 → P4 → P5/D2** — sequential interface-pattern chain, per `SPIKE_PLAN.md` §1.
4. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
5. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.

---

## 2026-08-17 — S-CTX round (before P3)

# HANDOFF — S-CTX COMPLETE, next: P3 scroll (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**S-CTX — COMPLETE** (contract + `[plan-determinism]` gate). **P2 — CLOSED.** **SPIKE M4 — FULLY
CLOSED (M4a applied).** Next per the frozen order (`SPIKE_PLAN.md`): **P3** scroll behavior.

## S-CTX — plan-determinism contract + gate, COMPLETE

Resolves grills C1 ("'ctx' undefined / determinism tautology") + C15 ("LLM-authored plan recurses
nondeterminism") — the roadmap's standing guard before P3/P4/P5-D2 (each cites plan.json in its
acceptance).

- **`research/DETERMINISM_CONTRACT.md`** — field-by-field derivation map of `GenContext` +
  `GenerationPlan` (`scoring`, `patterns.shell`, `patterns.search`, `entry.*`) with each pure
  selector cited (file:line), + the **transitivity invariant** (every helper in the closure must be
  pure — no wall clock/FS-content/network/env/randomness/mutable state/LLM).
- **`[plan-determinism]` gate in `validate.ts`** — reuses the existing `[determinism]` regeneration
  (one fresh generate), diffs the regenerated `plan.json` against the on-disk one
  (JSON.stringify compare — stable, key-stable output). Catches hand-edits, stale plans, and any
  purity leak in a plan-field helper. Additive (new field in `ValidationResult` + printout), zero
  generator changes, zero IR/schema changes.
- **Negative controls proven**: hand-edit `patterns.shell` → `[plan-determinism] FAIL (1)`;
  delete `plan.json` → `FAIL (1)` (not vacuous).
- **Verification**: typecheck clean; `[plan-determinism] PASS` on all 4 apps + all 5 samples
  (9 IRs), `[determinism]`/`[strategy-fidelity]`/`[verdict]` all still PASS.
- **Decision brief delivered** to owner first (MD + PDF with mermaid pipeline/sequence diagrams,
  shaded areas of interest — `research/SCTX_DECISION.{md,pdf}`, committed `5a67f5f`).
- everywhere including the rasheed probe (was FAIL). Next per the frozen order: S-CTX → P3 → P4 →
  P5/D2.

## M4a — corrected `scoreStateStrategy` selector, APPLIED

Implements `SPIKE_PLAN.md`'s M4a (the actionable half of SPIKE M4's MODIFY decision), per the
owner's directive **"no hardcoded magic numbers"**. Before, `scoreStateStrategy` fired
`sealed-events` when `statuses.length + extraFields.length >= SEALED_EVENTS_THRESHOLD (8)` (plus a
synthetic `["initial","loading","success","failure"]` status list when none declared) — while
`generators/state.ts` only ever emits `state_enum_status.v1` / `state_notifier.v1` (no sealed
template exists). rasheed's `AllExpenses` (5+6=11) selected sealed → `[strategy-fidelity]` FAIL.

Fix (`scoring.ts` only, plus the `arch.ts` call site): `scoreStateStrategy(s, ir)` now selects
`sealed-events` **purely from declared IR semantics** — a `stateMachines` entry whose state
vocabulary covers the state's declared `statuses` AND which declares a non-empty `events` +
`transitions` surface (the DESIGN §5.2 "transition surface"). No threshold constant, no synthetic
list. Every other state resolves to `enum-status`. Since no repo IR declares such a matching
machine, sealed fires nowhere today — honest with the generator, and M4b (the sealed template
family) stays deferred exactly as the spike ruled.

Verification (all green):
- `npm run typecheck:builder` — clean.
- `[strategy-fidelity] PASS` on all 4 apps (tasks/ledgerly/hr_service/work_auth) + all samples
  (todo/inventory/expense.semantic/promo/rasheed). rasheed probe refresh:
  `apps/rasheed/output/qa/validate_probe1.log` now `PASS` (was `FAIL (1)`).
- Determinism **byte-identical** across the 8-IR sweep (only `plan.json` strategy string changed on
  rasheed's `AllExpenses` entry: `sealed-events` → `enum-status`; determinism gate diffs `lib/`
  only, so unaffected).
- **Negative control still fires**: a hand-edited `plan.json` claiming `sealed-events` against an
  emitted `enum-status` template → `[strategy-fidelity] FAIL (1)` — the gate is not weakened.
- `apps/rasheed/output/qa/m4_evidence.ts` updated to the fixed signature: sealed fires in **0/25
  states across all 15 IRs**; matching-machine count 0 everywhere.

## P2 — per-list search, CLOSED

Three commits close the P2 brief (`research/P2_IMPLEMENTATION_BRIEF.md`) in full:

- `99da57b` — `searchFor`/`searchTargets` selector (`composition.ts`), `entity.primaryDisplayField`
  IR semantic (schema + `types.ts`), `screen.ts` SearchBar/filter/no-results template, `plan.json`
  `patterns.search`, new `[search]` validate gate. Also fixed a real `scroll_test.dart` fragility
  the slice surfaced (switched to `tester.scrollUntilVisible`).
- `dafe4b1` — declared `primaryDisplayField` on all 4 samples (tasks/hr_service/work_auth/ledgerly),
  regenerated real search UI + goldens. `validate.ts` 22/22 gates PASS on all 4 (`[search]` +
  `[shell]` + determinism all PASS), `flutter analyze` clean, `flutter test` green
  (36/36 hr_service, 22/22 work_auth, 83/83 ledgerly, tasks clean aside from a pre-existing
  unrelated harness issue).
- `f48e5a6` — CDP walk (ledgerly + tasks): filter-as-you-type, case-insensitive contains,
  no-results EmptyState, clear — all confirmed live on both a shelled (ledgerly) and unshelled
  (tasks) app, proving search and P1's shell compose independently. Findings under
  `apps/{ledgerly,tasks}/output/qa/p2-search/`.

Gate evidence: `[search]` PASS, `[shell]` still PASS, `[determinism]` still PASS, across all 4 real
apps — the acceptance invariant (contract §3.3) holds.

## SPIKE M4 — sealed-class state codegen, COMPLETE (decision MODIFY)

`research/SPIKE_M4_REPORT.md` (commit `b5eb50c`, remote opencode/tracematrix `germany3`) closes the
`LEFTOVER_NOTES.md` M4 item that had been root-caused but left OPEN. Investigated per
`SPIKE_PROTOCOL.md`'s research-not-implementation discipline: no `builder/src` edits from the spike
itself, decision recorded before any implementation.

**Finding — `SPIKE_PLAN.md`'s prior ground truth for M4 was wrong.** It claimed "today no sample
crosses the sealed-events threshold"; the spike's probe proves `builder/samples/rasheed.ir.json`'s
`AllExpenses` state does (11 ≥ `SEALED_EVENTS_THRESHOLD=8`), and that the already-shipped
`[strategy-fidelity]` validate gate already catches the resulting plan/emit mismatch
(`apps/rasheed/output/qa/validate_probe1.log`: `[strategy-fidelity] FAIL (1)`). The real defect is
that `scoreStateStrategy` (`builder/src/scoring.ts`) measures `statuses + extraFields` count
instead of DESIGN §5.2's stated `stateMachines[]` transition/guard surface — every IR in the repo
declares zero `stateMachines`, so the correct metric would fire sealed nowhere today.

**Decision: MODIFY.**
- **M4a (next step, not yet implemented)** — fix `scoreStateStrategy` to measure the
  `stateMachines` surface instead of field count. `scoring.ts`-only (+ `arch.ts` call-site passing
  `ir` through). No IR/schema change. Estimate S (1 slice). Unblocks `npm run build:rasheed` +
  validate, which currently FAILs.
- **M4b (deferred)** — implement the `sealed-events` template family in `generators/state.ts` +
  consumer branches (`screen.ts`, `crud_form.ts`, `generators/test.ts`). Not scheduled: no sample
  would exercise it under the corrected selector, and the cost is a permanent second
  template-family sync burden with no verifiable current benefit. Revisit only when a real IR
  declares a genuine `stateMachines` transition vocabulary.

Full decision, evidence, and rejected alternatives (ADOPT / REJECT-outright / raise-the-threshold /
implement-behind-current-metric) in `SPIKE_M4_REPORT.md` §13-§15. `SPIKE_PLAN.md` updated to match
(§0 grounding, M4 section, ownership matrix, sequencing diagram, not-scheduled register).

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (global shell) | ✅ shipped, committed `4e91e50` |
| P2 (per-list search) | ✅ **CLOSED** — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **FULLY CLOSED** — decision MODIFY (`b5eb50c`), **M4a applied** (`scoring.ts`, no threshold); **M4b deferred** until a real event-rich IR |
| **S-CTX** (plan determinism) | ✅ **COMPLETE this round** — `DETERMINISM_CONTRACT.md` + `[plan-determinism]` gate; decision brief `SCTX_DECISION.{md,pdf}` committed `5a67f5f` |
| P3 scroll, P4 actions, P5/D2 placement | **Next** — sequential, per `SPIKE_PLAN.md` §1 |
| S-HERMETIC, S-DEEPLINK | Backlog / owner call, see `SPIKE_PLAN.md` |
| Ledgerly-MVP, LEFTOVER_NOTES queue (pre-P1/P2 items) | ✅ complete (prior round, see `context_history.md`) |
| SwiftUI target S1+S2 | PARKED/DEFERRED (prior round) |

## Verification commands
```bash
npx tsc -p builder/tsconfig.json --noEmit
npx ts-node builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter analyze && flutter test
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real, full `apps/<app>/{input,output}`
convention) + `builder/samples/*.ir.json` (smaller probes, incl. `rasheed.ir.json` for the M4
probe).

## Next steps (not started, for whoever picks this up)

1. **P3 → P4 → P5/D2** — sequential interface-pattern chain, per `SPIKE_PLAN.md` §1 (P3 scroll
   first: contract rule `scroll.enabled = screen.kind ∈ {list, detail}`).
2. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
3. **M4b (sealed template family)** — deferred by design; reopen only when a real IR declares a
   genuine `stateMachines` transition vocabulary (new sample or owner request).
4. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.

---

## 2026-08-17 — P3 + RCA-007 round (archived before P4)

# HANDOFF — P3 COMPLETE, next: P4 actions (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**P3 (scroll behavior) — COMPLETE** (commit `f0254f9`). **Post-submit back-button fix —
COMPLETE** (commit `ac3939d`, RCA-007). **S-CTX — COMPLETE.** **P2 — CLOSED.** **SPIKE M4 —
FULLY CLOSED (M4a applied).** Next per the frozen order (`SPIKE_PLAN.md`): **P4** (ActionSpec v1 —
`presentation: inline|overflow|primary`, ChatGPT round-2 edit #3).

## Post-submit back button fix (RCA-007, 2026-08-17)

Owner-reported: *"after create task, there is no return to home back button"* (browser back only,
absent on iPhone). Root cause: `crud_form.ts` emitted `context.go(postSubmitPath)` after submit;
`go()` replaces the whole go_router stack, so the detail screen became the sole entry
(`canPop=false` → AppBar auto-back never rendered). Fix: `postSubmitNav` — detail path →
`context.pushReplacement('/entity/:id')` (replaces the form, keeps the list beneath it → Back
button works), list path → `go()` (home has no parent). RCA-007 + CDP evidence
(`apps/tasks/output/qa/nav-back/`) committed `ac3939d`. 13/13 IRs validate, typecheck clean, no new
analyzer issues.

## P3 — per-screen on-scroll AppBar tint, COMPLETE

Implements `INTERFACE_PATTERN_CONTRACT.md` §5 + `SPIKE_PLAN.md` §P3 via the **declared contract
rule** (ChatGPT round-2 edit #2): `scroll.enabled = screen.kind ∈ { list, detail }`.

- **`composition.ts`** — `ScrollSpec {enabled:true}` + `scrollFor(screen)` (the ONE selector that
  decides; rule inline as a versioned declared rule) + `scrollTargets(ir)` (name-keyed, same shape
  as `searchTargets`). **State-management AGNOSTIC on purpose** — unlike P2 search's bloc-only
  carve-out, the tint is pure presentation, so the riverpod sample tints too (no latent `[scroll]`
  gate gap).
- **`screen.ts`** — `scrollEnabled = !!ctx?.scroll?.get(s.name)`; `NotificationListener<ScrollNotification>`
  wrapper flips a widget-local `_scrolled` on `extentBefore > 0` (contract §5 "IR state ≠ scroll/UI
  state"); AppBar `backgroundColor: _scrolled ? surfaceContainerHighest : null` (`null` at rest =
  theme default ⇒ at-rest pixels/goldens byte-identical; `surfaceContainerHighest` is a stock M3
  token, passes the `[architecture]` raw-color gate). Riverpod list/detail → `ConsumerStatefulWidget`;
  bloc list/detail → `StatefulWidget` only when `needsLocalState = scrollEnabled || searchEnabled`.
  Template tag gains `_scroll` suffix.
- **`validate.ts`** — `[scroll]` gate + exported `scrollCheck`: re-derives via the **SAME**
  `scrollTargets`, cross-checks `plan.json patterns.scroll` (missing / wrong `enabled` / stale
  path), then scans **every** screen — list/detail must render the listener, wizard/form must NOT
  (the null-set is a *checked* claim).
- **`index.ts`/`plan.ts`/`gen_context.ts`** — `scrollByPath`, `patterns.scroll` (screenPath-keyed),
  `ctx.scroll` (name-keyed); threaded through single- and multi-feature paths.

### Verification (all green)

- typecheck clean; regen+validate **13/13 IRs** PASS (`[scroll] [search] [shell]
  [plan-determinism] [determinism] [verdict]`).
- **Negative controls (both directions):** stale `patterns.scroll["/bogus"]` → `[scroll] FAIL(1)`
  + `[plan-determinism] FAIL(1)`; listener stripped from a fresh generate → `[scroll] FAIL(1)`
  (`apps/tasks/output/qa/p3-scroll/scroll_negative_harness.ts`).
- **Byte-identical proofs:** wizard screen (`signup_wizard_screen.dart`) diff EMPTY pre/post P3
  (stash-based); list/detail at-rest renders 0/329160 px diff pre/post (CDP pixel compare).
- **CDP walk** (tasks web build on tailnet, CFT headless + shared driver): wheel-scroll over a
  300px viewport flips the AppBar `(244,251,248)→(204,218,215)` on list AND detail; scroll-back
  restores byte-identically; no overflow at 320/390/768/1280. Evidence under
  `apps/tasks/output/qa/p3-scroll/`.
- tasks (bloc) + `todo.riverpod` analyze clean; tests green (riverpod golden freshly captured;
  bloc golden_test+focus_test pass).
- **Pre-existing, NOT P3:** `test/temp_all_flows_test.dart` (P1-era harness) fails the same 5
  goldens before AND after P3 — `ArgumentError: Type TaskRepository is already registered inside
  GetIt` (harness calls `setupDependencies()` per test into a shared GetIt singleton). Not a pixel
  diff, not a regression; tracked in `LEFTOVER_NOTES.md`.
- **Decision brief delivered:** `research/P3_DECISION.{md,pdf}` + mermaid
  `research/mermaid/p3_{pipeline,sequence}.{mmd,png}` (amber = `scrollFor` + `[scroll]` gate,
  blue = decision-as-data), committed `f0254f9`.

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (global shell) | ✅ shipped, committed `4e91e50` |
| P2 (per-list search) | ✅ **CLOSED** — `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 (sealed-state codegen) | ✅ **FULLY CLOSED** — decision MODIFY (`b5eb50c`), M4a applied; M4b deferred |
| S-CTX (plan determinism) | ✅ **COMPLETE** — `DETERMINISM_CONTRACT.md` + `[plan-determinism]` gate (`5a67f5f`) |
| **P3 (scroll)** | ✅ **COMPLETE this round** — commit `f0254f9`; declared rule, `[scroll]` gate, SM-agnostic, CDP-verified |
| **Back-button fix** | ✅ **COMPLETE** — commit `ac3939d` (RCA-007): `pushReplacement` after submit, in-app Back restored |
| P4 actions, P5/D2 placement | **Next** — sequential, per `SPIKE_PLAN.md` §1 |
| S-HERMETIC, S-DEEPLINK | Backlog / owner call, see `SPIKE_PLAN.md` |
| Ledgerly-MVP, LEFTOVER_NOTES queue | ✅ complete (prior rounds) |
| SwiftUI target S1+S2 | PARKED/DEFERRED (prior round) |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
npx ts-node --transpile-only apps/tasks/output/qa/p3-scroll/scroll_negative_harness.ts  # P3 negative control
```
Samples: `apps/{hr_service, ledgerly, tasks, work_auth}` (real) + `builder/samples/*.ir.json`
(9 probes incl. `wizard.ir.json` / `reimbursement.ir.json` — the wizard null-set proof targets).

## Next steps (not started, for whoever picks this up)

1. **P4 → P5/D2** — sequential interface-pattern chain per `SPIKE_PLAN.md` §1. P4 = ActionSpec v1:
   `presentation: inline|overflow|primary` (ChatGPT round-2 edit #3 — `params` dropped), same
   composition-selector + plan.json + validate-gate loop as P2/P3. P5/D2 = state-model-conditional
   triad (edit #4).
2. **`[nav]` validate gate** (from RCA-007 prevention) — assert form submit handlers use
   `pushReplacement`/`pop`, never bare `go` to a detail path; matches [scroll]/[search] posture.
3. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see `SPIKE_PLAN.md`.
3. **P1 harness bug** (`temp_all_flows_test.dart` GetIt re-registration) — pre-existing, not P3;
   candidate: make `setupDependencies()` idempotent or `GetIt.reset()` per test.
4. **M4b (sealed template family)** — deferred by design; reopen only when a real IR declares a
   genuine `stateMachines` transition vocabulary.
5. SwiftUI target S3+ (CRUD/rules) — parked; resume only per owner directive.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat verified via stash+regen+diff before every generator change lands; agents read
`AGENTS.md` + `research/SPIKE_PROTOCOL.md` (spike discipline) + the relevant
`research/*_IMPLEMENTATION_BRIEF.md`/`SPIKE_PLAN.md` section before starting work.

---

## 2026-08-18 — P4 round + P5/D2 complete + S-HERMETIC complete (archive of HANDOFF before v1-milestone rewrite)

Content of HANDOFF.md as of 2026-08-18 (pre v1-milestone): P4 COMPLETE (a8629f6/d289f59), P3 COMPLETE, RCA-007, S-CTX, P2, M4 all closed. P5/D2 placement = next. Model-tier zen/orchestrator separation (a2b3c14). TOOL-1 opencode compression = roadmap-only.


---

## HANDOFF archived from round 2026-08-18 (v1 milestone round)

# HANDOFF — V1 MILESTONE: frozen roadmap COMPLETE (round: 2026-08-18)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**The frozen roadmap is COMPLETE → v1 milestone reached.** S-CTX → P3 → P4 → **P5/D2** → **S-HERMETIC**
all done. Remaining: **S-TDE (visual lane S1–S7, from `VISUAL_GENERATION_REVIEW.md`)** and
**S-DEEPLINK** (backlog). P5/D2 is finished as 4 slices + D1 theme; S-HERMETIC closes C12.

## This round: P5/D2 + S-HERMETIC + visual-lane decision (2026-08-17/18)

### P5/D2 — state-model-conditional placement, COMPLETE (4 slices + D1)

- **D1 (theme)** `4e60c76` — `normalizeBrandSeed` (teal fallback 0D9488), `buildThemeDark()`,
  `AppAttributes.{brandSeedColor,themeMode}` (additive), dark goldens, `[theme]` gate
  (`validate.ts:79`, wired :1122).
- **Slice 1** `eff7168` — `StatePlacementSpec` + `statePlacementFor()` in composition.ts, plan/ctx
  wiring.
- **Slice 2** `38111b4` — screen.ts renders the spec; wizard (null spec) emits no loading/failure
  → fixes the wizard compile bug.
- **Slice 3** `e715646`+`6627d70`+`9d3e74b`+`c81049c` — empty-state CTA "New <Entity>"
  (`crudFormTargets`-gated, FAB nav), Retry `OutlinedButton` + `RefreshIndicator` on LIST screens
  only (owner decision); non-CRUD → no CTA; wizard/detail → nothing new; `*_empty.png` goldens.
- **Slice 4** `5256671`+`41c3a9d` — `[states]` gate (`validate.ts:647`, exported, wired :1266);
  re-derives `statePlacementFor` vs plan.json `patterns.states` + screen markers; retry marker
  requires `screen.type==="list"`. 3 negative controls demonstrated as real runs.

### S-HERMETIC — toolchain hermeticity, COMPLETE (3 slices)

- Spike (remote germany3/DeepSeek) `af5bdb3` — decisions: **D1 ADOPT (b)** caret+committed
  per-app `pubspec.lock` / REJECT exact pins; **D2 ADOPT** toolchain pin doc; **D3 CONFIRM+ADOPT**
  timestamp-absence gate. Found + grounded real drift: generated `sdk: ^3.0.0` below the proven
  floor; stale `localeDataVersion "intl-0.19.0"` vs resolved 0.20.2.
- Impl (Claude Mac): **`cebae60`** `[lockfile]`+`[timestamp]` gates; **`23a52ee`** SDK floor
  `>=3.11.0 <4.0.0` + intl-from-lock in context.ts; **`6a2e26d`** `FLUTTER_TOOLCHAIN.md` + C12
  closure; **`d7e9b28`** bonus — `[determinism]` crashed on real diffs (execSync no try/catch,
  like swiftdeterminism).
- Verified: typecheck clean; 4 apps regen — lib+plan.json byte-identical (only sdk line +
  localeDataVersion changed); validate 29/29 (rasheed_replica WARNs floor-differs per ratified
  severity; expense.semantic_app ERRORs no-lock — pre-existing); negative controls fired; `pub get`
  reproduced the lock byte-for-byte.

### Visual-lane product decision (Opus + ChatGPT ADOPT)

- `F_brief` `cb94e94` + review `eadee35` — Claude Opus reviewed the owner's visual-generation
  proposal: **13 ACCEPT / 6 MODIFY / 1 DEFER / 1 REJECT** (REJECT §18 LLM-visual-judge loop;
  kept via deterministic validators + human goldens). Spike backlog S1–S7 with priorities.
- ChatGPT replied **ADOPT WITH MODIFY** (record `039a8d6`); Opus produced contract **v2**
  `40e40e1` (`VLM_DESIGN_TO_IR_CONTRACT_V2.md`): provenance envelope
  `{origin,confidence,evidence,requiresApproval}` on every inferred decision, Observed/Inferred/
  Proposed/Approved split, id'd+nested sections with `emphasis.targetId`, AssetRequest decoupled,
  observations[] with evidence regions, **evidence coords ≠ layout coords**, existing `dashboard`
  archetype (not "market"), productGrid never encodes columns (320→1/390→2/1400→N), acceptance:
  provenance on every inferred value + no silent promotion.

## Ground truth table

| Area | State |
|---|---|
| Frozen roadmap (S-CTX→P3→P4→P5/D2→S-HERMETIC) | ✅ **v1 COMPLETE** |
| P5/D2 (placement) | ✅ COMPLETE (4 slices + D1) |
| S-HERMETIC (C12) | ✅ COMPLETE |
| VLM contract v2 | ✅ (product decision, ready for S1+) |
| S1 VisualIntent spike (P0) | **Next** (entry vocabulary for UI-SLC) |
| S6 no-vision-judge (P0) | Next (before any visual-QA work) |
| S2 section-layout IR / S5 banner (P1/P2) | After S1 |
| S3 asset ladder / S4 asset manifest (P1) | After P4-data layer / at S-HERMETIC hardening |
| S7 AI asset gen | Post-v1 / Phase 4 (trust boundary) |
| S-DEEPLINK | Backlog / owner call |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
```

## Next steps (not started, for whoever picks this up)

1. **S1 — typed VisualIntent fragment** (P0): closed-enum `visualStyle` on ScreenModel, feeds §5.2
   scoring, zero new raw literals, byte-identical re-run. Spike (remote) → then impl slice.
2. **S6 — Section-18 defect coverage without a vision judge** (P0): proves the rejected
   LLM-visual-analyzer's intent is fully covered by deterministic validators + human goldens.
3. **S2 section-layout IR + S5 banner-composition** — the Keemart-level visual richness pass.
4. **S3 asset ladder, S4 asset manifest** — deterministic, no-AI (AI deferred to S7/Phase 4).
5. **S-DEEPLINK** — backlog/owner call (see SPIKE_PLAN.md).
6. **VLM contract v2 → feed the S1 spike brief** so the VLM-mapping contract and the IR fragment
   stay consistent.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat via stash+regen+diff; zen = orchestrator, Claude-first implementer (remote opencode
fallback), spikes on remote agents per SPIKE_PROTOCOL; report everything to owner on Telegram; keep
HANDOFF lean (archive to context_history with dated header).
<!-- ARCHIVED 2026-08-19 (next round handoff) -->

# HANDOFF — VISUAL LANE S1 ✅ / S6 ✅ / S2 ⏳ (round: 2026-08-18)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

Frozen roadmap (S-CTX→P3→P4→P5/D2→S-HERMETIC) is v1 COMPLETE. Now executing the **visual lane
S1–S7** (`VISUAL_GENERATION_REVIEW.md`) with two implement lanes: Claude Code (Mac, `s-hermetic`)
for implementation, remote opencode (tracematrix `germany3`, DeepSeek Flash Free) for read-only
spikes. Zen session orchestrates/verifies only.

## This round: S1 done+approved+token-rigor, S6 done, S2 done, S3 in flight

### S1 — VisualIntent fragment, **APPROVED + token-rigor hardening**

- Owner's ChatGPT review of the showcase (`S1_SHOWCASE_REVIEW.md`) found the token system
  under-specified. Fixes ADOPTED via `S1_TOKEN_RIGOR_BRIEF_CLAUDE.md` (Claude, 5 commits
  `1b0fc86`→`7997a46`):
  - `VisualSpec.radiusScale` grows component-role `{control,surface,container,search,fab}` — search
    field + FAB now follow the cornerRadius rules (FIX-1, never reuse `control`).
  - `spacing` is a full matrix `{screen,section,itemGap,cardInset,fabInset}` all `AppSpacing.*`
    (FIX-3); `titleWeight` (AppType.*, keyed on hierarchy) makes `heroScale:2` observable as a
    title-weight change, heroScale=1 byte-identical (FIX-2/4).
  - `[visualIntent]` gate extended to flag enum-branching in generated components (FIX-6); contact
    sheet rebuilt with corrected caption labels (FIX-5).
  - Proof: search/FAB radius in B, pill search in C visible in goldens; A-vs-B and A-vs-C
    pixel-diffs quantified.
- Original S1 (approved): evidence v3 `8c13198`, tests `061cf7e`/`d31f73c`/`16b00bd`/`19332d6`,
  `test/s1_visual_intent.test.ts` 20/20.

### S2 — sections archetype, **IMPLEMENTED** (Claude, 5 commits `d69c5d4`→`b561269`, defaults A1/B1)

- Vocabulary (`SectionType` closed enum, `ScreenModel.sections?`, schema `additionalProperties:false`
  + `"sections"` type), `sectionsFor`/`sectionsTargets` selector, fourth `comp.layout==="sections"`
  renderer branch, `AppHeroBanner`/`AppProductCard` (+`AppTokens.gridExtent/cardWidth`), `[sections]`
  gate, keemart grocery-home proof app (7 sections: header/search/hero/horizontalCards/section/
  divider/floatingCart). Determinism + negative controls (columns→abort, list-with-sections→FAIL).
- **Pending owner ratify:** contract decisions doc `S2_CONTRACT_DECISIONS.md` (emphasis drop A1 /
  archetype `"sections"` B1) — shipped with defaults, override possible.

- Spike `bb68a9e` → impl (7 commits `c848640`→`f030dd4`) → goldens/QA `a6f7a51` → evidence v3
  `8c13198` → regression tests `061cf7e`,`d31f73c`,`16b00bd`,`19332d6` → **owner Verdict: APPROVED**
  (5/5 on evidence v3; caveat was standalone PNGs, delivered).
- `ScreenModel.visualStyle` optional `{hierarchy, cornerRadius, personality}`; each value is a
  `VisualStyleValue<T>` with provenance; `visualFor()` (composition.ts) → `plan.json
  patterns.visual`; `[visualIntent]` gate (`validate.ts:741`) re-derives + closed-enums +
  blocks unattested nested visualStyle. AppColors theme remains app-level; `userSelections
  .visualFor` no longer authored by hand.
- Proof screens: tasks TaskListScreen = friendly/rounded; hr_service LeaveRequestDetailScreen =
  professional/sharp/strong (hero "Leave request"); ledgerly ExpenseClaimListScreen = premium/soft.
- Tests: `test/s1_visual_intent.test.ts` 20/20 (token-agreement 6, provenance 9, trust-boundary 2,
  determinism 3). Determinism canon: `find|sort|xargs shasum|shasum` (naïve unsorted differs).

### S6 — no-vision-judge coverage, **D2 implemented (slices 1-4)**

- Spike `182af5c` (D1 ADOPT all §18 defects deterministic; D2 ADOPT validator list; D3 CONFIRM
  golden-diff; D4 CONFIRM S1 interplay). §18 REJECT of LLM-visual-judge stands.
- Impl (Claude): `d8a46f6` `[contrast]` WCAG gate (real luminance on theme tokens; found+fixed 2
  genuine pre-existing chip failures); `871fab1` darken AppColors.success/warning/danger/info;
  `da811fc` per-screen viewport-squeeze generator (320/390/1400, assertions-only, caught+fixed a
  real 2.5px overflow on 3 detail screens); `facc2fe` `[literals]` raw spacing/typography scan all
  screens (token-routed itemGap/heroGap, zero golden churn). Gates PASS all apps; jest 20/20; npm
  test 63/63; typecheck clean.
- Deferred: slice 3 `[asset-ref]`/`[aspect-ratio]` (S3 not in tree — gated on S3); slice 5
  A11yTestGenerator → queued as its own fresh objective (context policy).

### Ops: context policy + orchestrator framework (ChatGPT review adopted)

- `CONTEXT_POLICY.md` + OPERATING_PRINCIPLES 11-12 (`6937718`): each objective = independent fresh
  session; context is a pipeline resource; artifacts are durable state; progress observable WITHOUT
  context accumulation (L1/L2/L3 levels).
- `tools/orchestrator/` (`a738763`+helpers): report.sh (L0-L3, 6 tags), run_loop.sh
  (objective.md-driven guard→dispatch→poll→verify→escalate/recover→COMPLETE), poll.sh, tgsend.sh,
  pdf_build.sh, genapp.sh, dispatch_kill_fresh.sh, capture_golden.sh.
- `tools/orchestrator-kit/` (new, uncommitted): portable project-agnostic template extracted from
  the above — generic `core/` + owner/machine `adapters/` reading `config.env` + reference
  `examples/`. Copy into any project to run objective-driven loops.
- Lessons `cf44427`, principles `549f37f` (now 12).

## Ground truth table

| Area | State |
|---|---|
| Frozen roadmap (S-CTX→P3→P4→P5/D2→S-HERMETIC) | ✅ v1 COMPLETE |
| S1 VisualIntent (P0) | ✅ **APPROVED + token-rigor hardening** |
| S6 no-vision-judge (P0) | ✅ spike closed; D2 slices 1,2,4,5 done; slice 3 deferred to S3 |
| S2 section-layout IR (P0) | ✅ **IMPLEMENTED** (keemart proof app); contract ratification pending |
| S3 asset ladder (P1) | ⏳ **spike in flight** on germany3 (fresh session) |
| S4 asset manifest (P1) | After S3 |
| S5 banner-composition (P2) | After S3 |
| S7 AI asset gen | Post-v1 / Phase 4 (trust boundary) |
| S-DEEPLINK | Backlog / owner call |

## Verdicts & review record

- S1: owner APPROVED (evidence v3, 5/5, standalone PNGs delivered). Review checklist lives in
  `S1_PROOF_SCREENS.html` review-instructions section.
- S6: D1-D4 closed (see `SPIKE_S6_REPORT.md` §13). Slice 3 needs S3 in tree.
- Display-side open item: same-screen showcase (TaskListScreen @ A_rounded/B_sharp/C_pill) contact
  sheet has a caption-render TODO (ImageMagick convert font issue → use `magick` + pinned
  `/System/Library/Fonts/*.ttf`); artifacts at `/Users/username/temp/opencode/s1_showcase/`.

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx jest test/s1_visual_intent.test.ts          # S1 regression, 20/20
npm test                                        # full builder suite, 63/63
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
```

## Next steps (in order)

1. **S3 spike → close**: poll germany3 (fresh S3 session, dispatch sent), scp `SPIKE_S3_REPORT.md`
   when present, review decisions, commit + push → Telegram → S3 impl brief for Claude (incl. S6
   slice-3 `[asset-ref]`/`[aspect-ratio]` gates flipping ON).
2. **Owner ratify S2 contract decisions** (`S2_CONTRACT_DECISIONS.md`): emphasis drop + archetype
   name — shipped with defaults; document override if any.
3. **S2 verification pass**: keemart flutter analyze/test + CDP probe at 320/390/1400 (per AGENTS
   rule 15) once the S3 lane frees; send goldens to owner.
4. **S4 asset manifest** (spike → impl), then **S5 banner-composition**.
5. Keep looping S3→S4→S5 (+ S7 later). Each spike closes decisions with ONE verb (SPIKE_PROTOCOL),
   implementation goes to Claude first (remote as fallback), zen verifies. CONTEXT_POLICY every
   lane: fresh session per objective (germany3 now fresh for S3; s-hermetic cleared post-S1/S2).

## Rules

Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat via stash+regen+diff; zen = orchestrator (Claude-first implementer, remote opencode
fallback); spikes on remote agents per SPIKE_PROTOCOL; CONTEXT_POLICY applies to every lane;
report everything to owner on Telegram (goldens as photos, files as sendDocument, text in separate
short messages); keep HANDOFF lean (archive to context_history with dated header).

## Lanes

- **s-hermetic** (Claude Code 2.1.210, Mac): **S2 sections-archetype implementation RUNNING**
  (dispatched brief `S2_SECTION_IMPL_BRIEF_CLAUDE.md`; was parked after S6-slice-5 landed).
- **germany3** (remote tracematrix, DeepSeek Flash Free): idle after S2 spike re-run — report
  recovered + transferred (already at HEAD, byte-identical). Keep fresh for the next spike.
- Mac git origin HEAD: `d937b02` (S6 slice 5 A11yTestGenerator + same-screen showcase landed+push
  past old 6937718). Remote /root/fg-p5: synced to origin/master (verified). ⚠ tracematrix flaps
  (OOM, 1vcpu n8n) — re-dispatch tolerates refusals with backoff.
- `tools/orchestrator-kit/` (new): portable project-agnostic kit + USAGE.md/pdf (md2html.js
  pipeline). Verified in-tree (run_loop monitor ran a real round loop to [COMPLETE]); sent to
  owner as documents. Commit this round.