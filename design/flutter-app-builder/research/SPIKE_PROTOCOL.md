# SPIKE_PROTOCOL — Spike execution operating rules

> Source: owner-provided ChatGPT insight (2026-08-17). This is the **binding operating protocol**
> for every spike conducted by any agent (local claude, remote opencode on
> tracematrix/tracematrix001). A spike is a research/investigation activity that produces a
> **decision** — it must never assume the proposed solution is correct.

## 1. Purpose

Every spike investigates a hypothesis and must conclude one of:

- **ADOPT** — evidence supports implementation.
- **MODIFY** — useful, but the proposed design needs changes.
- **REJECT** — evidence shows it should not be implemented.
- **DEFER** — potentially useful, but insufficient value or readiness.
- **SPLIT** — the investigation reveals multiple independently implementable patterns.
- **ESCALATE** — requires an architectural/product-owner decision.

**Critical rule:** never start with the assumption the proposed spike design will be implemented.
The proposal is a hypothesis. The spike must be capable of concluding the hypothesis is wrong.

## 2. Spike lifecycle

```
READ → GROUND → FORM HYPOTHESIS → INVESTIGATE → PROTOTYPE/PROVE → VALIDATE →
ASSESS COST + RISK → DECIDE → DOCUMENT → ONLY THEN implementation backlog
```

Never skip from "this seems like a good pattern" to "modify generator X".

## 3. Phase 1 — READ

Read: `INTERFACE_PATTERN_CONTRACT.md`, relevant `DESIGN_OPTS.md` sections, `GRILL_S0_REPLY.md`,
current spike plan, relevant `LEFTOVER_NOTES.md`, `AGENTS.md`. Then inspect the **current
generator implementation**, the **generated output** (not just generator source), and the
relevant existing samples. Determine whether the proposed pattern is: already shipped, partially
shipped, in-flight, merely documented, or genuinely absent.

**Rule:** never recommend implementing something that already exists without first explaining why
the existing implementation is insufficient.

## 4. Phase 2 — GROUND

A Ground Truth section answering: what exists today, where is it implemented, what does the
generated app actually do, which samples demonstrate it, what limitations are observable. Use
source inspection, grep, generated files, `plan.json`, schemas, validators, Flutter analysis/
tests, screenshots, CDP interaction, golden comparisons. **Do not rely on assumptions from the
original research document when repository evidence is available.**

## 5. Phase 3 — FORM THE HYPOTHESIS

State exactly one primary hypothesis and list the proposed solution only as a **candidate**. Do
not phrase it as "P3 will add ScrollSpec" — that assumes the result.

## 6. Phase 4 — DEFINE THE QUESTIONS

Define the questions evidence must answer (e.g. for a UI pattern: does it improve the generated
UI, does it work at compact/wide widths, does it interact correctly with existing behaviors,
does it introduce a11y problems, does it require new state, can it remain deterministic, is the
complexity justified, does Flutter provide the behavior without new deps). Questions must be
answered with **evidence, not preference**.

## 7. Phase 5 — SEMANTIC CONTRACT

Determine the semantic input (IR screen kind, declared capability, declared display field). Ask:
can this decision be derived deterministically from existing IR semantics? If yes document the
rule; if no determine whether (1) the IR needs a new explicit declaration, (2) the pattern
should not be generated, or (3) it belongs to a future architectural layer.

**Forbidden:** hidden heuristics like `field.name === "title"` unless the contract explicitly
defines that semantic.

## 8. Phase 6 — DETERMINISM

Answer: what exact inputs determine the generated result? Model: IR → validated semantic facts →
deterministic selector → GenerationPlan → generator → bytes. Identify inputs, selectors,
constants, allowlists, thresholds, ordering rules, failure conditions. **Never introduce**
randomness, time, environment-dependent decisions, unsorted filesystem enumeration, network
lookups, LLM-generated composition decisions, implicit naming heuristics. If the pattern can't be
deterministic without an IR semantic, **say so** — that is a valid spike result.

## 9. Phase 7 — PROTOTYPE BEFORE COMMITMENT

For visual/interaction questions, create the smallest possible proof — prefer a small temporary
prototype → generated sample → CDP/manual interaction → screenshot/golden. The prototype answers
"does this actually work?"; it is not permission to permanently modify the generator. If generator
changes are necessary to answer, label them **experimental**.

## 10. Phase 8 — TEST ACROSS DIMENSIONS

Compact 320/390, medium 768, wide 1280; light and dark (if applicable); empty/loading/error
(where applicable); long content; accessibility (semantics + target sizes); RTL (if supported);
multi-feature (shell/navigation); single-feature (shell logic). Not every spike needs every
dimension, but the spike must explain exclusions.

## 11. Phase 9 — OWNERSHIP ANALYSIS

Before recommending implementation, identify the exact home: module, existing owner, proposed
insertion point, new responsibility, interaction with existing slices.

**Shared-generator rule:** never fork a generator. Existing owner stays; a later slice **extends**
the existing function, never duplicates. If two patterns genuinely need the same insertion point
and cannot coexist cleanly, the spike must **stop and report the architectural conflict** — do
not solve it silently.

## 12. Phase 10 — FAILURE MODES

For no applicable semantic, too many items, unknown capability, unknown icon, invalid config,
unsupported screen type, conflicting composition, malformed IR — define the outcome:
deterministic omission, deterministic fallback, validation error, or generation abort. Do not
invent a fallback merely to avoid an error; if the correct behavior is a hard error, say so.

## 13. Phase 11 — ARCHITECTURAL IMPACT

Classify the pattern: A. pure presentation; B. interaction/state; C. data-flow; D. navigation
architecture; E. runtime authorization. If it crosses from A → B/C/D/E, acknowledge it explicitly.
Do not call an architectural change "cosmetic".

## 14. Phase 12 — COST

Record generator complexity, IR/schema changes, runtime architecture, testing, golden churn, CDP
testing, accessibility impact, maintenance, cross-platform implications, determinism risk (each
S/M/L or Low/Med/High). Answer: is the user-visible benefit worth this complexity?

## 15. Phase 13 — DECIDE

Exactly one: ADOPT / MODIFY / REJECT / DEFER / SPLIT / ESCALATE, with evidence and a
recommendation. A spike does not fail because it rejects the original proposal.

## 16. IMPLEMENTATION HANDOFF

Only ADOPT or an appropriate MODIFY/SPLIT creates an implementation proposal, **generated from
the spike conclusion**, not copied from the original hypothesis: decision, final semantic
contract, IR/schema impact, selector, generator ownership, validation gates, test matrix,
implementation slices. REJECT/DEFER → no implementation task.

## 17. REQUIRED SPIKE REPORT

Produce `# <Spike ID> — <Question>` with: 1. Status (research-only / experimental changes);
2. Hypothesis; 3. Ground truth; 4. Questions; 5. Evidence (repository / generated-app / runtime
CDP / visual-golden); 6. Semantic contract; 7. Determinism analysis; 8. Ownership analysis;
9. Failure modes; 10. Architecture impact; 11. Cost/complexity; 12. Findings; 13. Decision;
14. Recommended implementation (if any); 15. Rejected alternatives; 16. Open questions;
17. Follow-up.

## 18. SPECIFIC EXPECTATIONS

- **S-CTX (determinism):** prove or disprove that GenerationPlan and GenContext are fully derived
  from validated IR + deterministic constants. Trace the actual call graph IR → scoring →
  composition selectors → GenerationPlan → GenContext. Identify every external input. Deliver a
  field-by-field derivation table, deterministic-input contract, proposed regression test,
  negative control, decision. Do not assume the proposed `[plan-determinism]` gate is correct.
- **S-P3 (scroll):** investigate whether scroll-aware behavior actually improves generated apps;
  test AppBar scroll treatment and nav-bar hide/minimize **independently** — they may conclude
  ADOPT AppBar / REJECT nav-bar hiding.
- **S-P4 (actions):** investigate whether capability-driven actions produce a better, semantically
  safe CRUD experience; test Save/Delete/Export/Audit; determine whether enablement/params/
  confirmation thresholds are right; output may recommend a smaller v1 action model.
  Separate build-time capability from runtime authorization.
- **S-P5/D2 (state placement):** can placement be deterministic from screen semantics without
  confusing runtime state content with build-time composition? Do not assume every screen needs
  the same Loading/Error/Empty triad.
- **M4 (sealed state):** investigate whether the "sealed-events" strategy is desirable AND
  implementable; first determine whether the scoring decision itself is correct; test a synthetic
  high-complexity IR. Possible outcomes: MODIFY threshold / REJECT / ADOPT — all valid.
- **S-HERMETIC (reproducibility):** investigate generator-source determinism vs Flutter
  dependency/build reproducibility as **two separate contracts**; decide pins vs committed locks
  vs CI-controlled versions after investigating repo/CI constraints.
- **S-DEEPLINK (deep links):** investigation only — feature-ID addressing, route mapping,
  cold-start links, nested nav, process death, restoration APIs, generated complexity,
  testability. Outcome may remain DEFER — insufficient current demand.

## 19. WHAT "DONE" MEANS

A spike is done when someone unfamiliar can answer: what did we believe, what did we inspect,
what did we test, what did we learn, what changed our mind, what should happen next. Not done
because code compiles / a prototype looks good / the architecture works. Completion criterion:
question answered + evidence recorded + alternatives considered + risks identified + determinism
established/rejected + ownership established/rejected + decision recorded.

## 20. NON-NEGOTIABLE RULES

1. Read-only by default.
2. Do not modify `builder/src` during research unless the spike explicitly requires an
   experimental prototype.
3. Do not commit during research.
4. Do not assume the proposed implementation is the conclusion.
5. Inspect repository source AND generated output before making claims.
6. Prefer existing IR semantics over naming heuristics.
7. Every generator decision has a deterministic home.
8. Every shared-generator change has an explicit ownership/insertion point.
9. Every proposed failure case has a defined deterministic outcome.
10. Separate build-time capability from runtime authorization.
11. Separate presentation state from data-flow architecture.
12. Do not turn a future pattern into an implicit dependency of the current spike.
13. Do not create schema fields merely to make a prototype convenient.
14. Do not add dependencies without an explicit spike conclusion supporting them.
15. Negative evidence is valuable and must be recorded.
16. A rejection/defer decision is a successful spike outcome.
17. Only after the decision is recorded may an implementation plan be proposed.
18. The implementation plan must reflect the evidence, not the original hypothesis.

**Final operating principle: investigate first. Prove second. Decide third. Implement last.**