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
