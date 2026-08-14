# The Flutter App Builder — Full Explainer

> **وثيقة شاملة تشرح المشروع كاملًا** — what we're building, why, how it works, what the evidence says, and what comes next.

---

## 1. What this is, in one paragraph

We are building a **general-purpose Flutter application compiler** — not "an AI that writes Flutter code." You describe what you want (natural language, an API schema, a database schema, a design file); the system turns that intent into a **production Flutter app** through a hybrid pipeline where **deterministic generators** produce everything that can be mechanically derived, and an **LLM** is used *only* for reasoning, interpretation, and business logic — and even then it writes into a **validated intermediate representation (IR)**, never raw code into the project.

The rule that drives everything:

> **Never ask the LLM to generate code when a deterministic generator can — and never trust that deterministic code is *correct* without an independent oracle.**

---

## 2. Why not just "LLM writes Flutter code"?

Because that fails in a specific, well-documented way. The benchmark research (see `BENCHMARK.md`) confirms:

- **Hallucination is real.** ~5% of packages suggested by commercial LLMs don't exist (open-source models: ~22%).
- **Security flaws are common.** 40% of Copilot-generated programs in one study contained security flaws.
- **Agents fail at the edit, not the search.** "Coherence collapse": 60–69% of agent failures reach and edit the *correct* function, then overwrite/thrash it into a broken patch.
- **LLM judges are unreliable.** An LLM judge and a human agreed only ~62% of the time on code correctness; executable tests beat *both*.

So a "prompt → LLM → 500 lines of Flutter" system is a hallucination machine. The alternative — the one this project pursues — is a **compiler with a reasoning lane**.

---

## 3. The pipeline

```
Product Intent (NL / API schema / DB schema / design)
      ↓
Application Model (IR)      ← single source of truth: semantic, versioned, framework-agnostic
      ↓
Generation Planner          ← deterministic classification + generator selection
      ↓
┌─────────────────────────────────────────────────────┐
│  Deterministic  │  Template  │  Schema  │  LLM Reasoning  │  LLM Coding (gated)  │
└─────────────────────────────────────────────────────┘
      ↓
Generated Flutter Project
      ↓
Validation Pipeline  →  static → architecture → tests → oracle → a11y/UX → security → build
      ↓
Production Flutter App
```

The key idea: the **IR is the single source of truth**. Flutter is just a *target backend* for it.

---

## 4. The Intermediate Representation (IR)

A declarative, typed, versioned, diffable model of the *whole app* — semantic, not implementation. It contains entities, value objects, repositories, use cases, business rules, datasources, screens, state machines, routes, forms, permissions, localization, theme, secrets, observability, and the dependency graph — each element carrying **provenance** (`origin`, `actor`, `confidence`, `source`, `ownership`, `trace`).

Two rules that matter:

1. **The IR says *what*; plugins say *how*.** "A paginated list of employees" is IR; "Riverpod + go_router + dio" is a plugin choice.
2. **The IR is the diff unit.** Incremental regeneration diffs IR elements, not Dart files.

---

## 5. The four generation classes (the LLM boundary)

| Class | Meaning | LLM role |
|---|---|---|
| **Structural** | Mechanically predictable from a schema. Entity, DTO, repository contract, datasource, direct mapper, DI, routes, state boilerplate, serialization, config, test boilerplate. | **None** |
| **Pattern** | Known pattern; deterministic *selection* + parameterization. Forms, list/detail screens, pagination, caching, auth flow. | May add IR attributes; never selects directly |
| **Semantic** | Requires understanding meaning. LLM emits a *formal rule*; the generator compiles it. | **Reasoning only** |
| **Novel** | Fits no pattern. Gated LLM coding. | Coding, **always human-approved** |

The classification of every artifact is **computed deterministically** by the planner from the IR schema — never decided by an LLM (otherwise an agent could route arbitrary code into the "Novel" lane to bypass the rules).

---

## 6. The correctness model (four distinct questions)

This is the hardest part of the design, and it took a full grilling session to get right:

| Correctness type | The question | Who answers it |
|---|---|---|
| **Structural** | Is the IR valid? Is the generated AST valid? Does it respect the architecture? | **Validator** (schema + arch-linter) |
| **Behavioral** | Does the code actually do what the business spec says? | **Oracle** (human example/expected-value pairs + property-based invariants) — *not* another LLM |
| **Trust** | Was this written by an authorized actor? Was approval genuinely human? | **Provenance + field-level write-ACL + approval routing** |
| **Regeneration** | Did an IR change regenerate the app *without destroying human intent*? | **Plan-diff → region-aware merge → ownership regions** |

The two insights that took the most work:

1. **Schema validation proves *shape*, not *correctness*.** "The rule is well-formed JSON" ≠ "the rule is right." A second LLM reading the same requirement is *not* an oracle — it's correlated failure wearing a disguise. Only **human-attested examples** and **executable invariants** are the oracle.
2. **Confidence is not self-reported.** An agent can't truthfully score its own output. Confidence must be second-party (an adversarial reviewer) and — per the research — LLM-judge is **triage, never certification**.

---

## 7. The LLM boundary (how the reasoning lane is kept honest)

- **Agents** (Requirement, Domain, BusinessRule, UI, State, Test, Review) produce **schema-validated JSON**, never free-form code.
- **Field-level write-ACL.** Every IR write carries an `actor` credential (`agent:<name>` or `human:attested`). Fields like `implementation` and `classification.class` live in a **human-only writable subschema** — an agent structurally *cannot* write them. ("Human" means an attested interactive token from a real prompt, not an API key.)
- **Business rules** go through `NL → formal rule → validator → oracle → code generator → tests`. The formal rule language is a **closed, typed** language (comparison/boolean/arithmetic, temporal like `daysSince(...)`, aggregates like `sum(...)`, decision tables, state machines). Anything it can't express goes to a **human extension queue** — never silently reclassified as "novel."
- **Approval routing** is a **Reversibility × Blast-radius** 2×2: reversible decisions (naming, golden baselines) batch and defer; irreversible/high-blast decisions (money, permissions, compliance) are always solo and blocking.

---

## 8. Plugins — why it's "general-purpose" and not one style of app

The IR declares **semantics**; a plugin binds them to a concrete library. A plugin is *not* a string swap — it's a **generation strategy + template family + conformance suite**:

| Capability | Options |
|---|---|
| State management | riverpod, bloc, provider, signals |
| DI | get_it, riverpod, provider, injectable |
| Routing | go_router, auto_route |
| HTTP | dio, http |
| Local DB | drift, hive, sqflite, isar |
| Serialization | json_serializable, freezed, manual |

The two things that keep this from exploding combinatorially: (a) **generation strategies** — there are only 2–3 *shapes* of state management (observable-notifier, sealed-events, mutable-notifier), each a template family, and (b) **axes are orthogonal except a few coupled pairs** (state-mgmt × DI is the real one); Clean Architecture already isolates HTTP/DB/serialization behind repository interfaces the state layer never sees.

---

## 9. Ownership & regeneration safety

The single most-differentiating feature, and the one every competitor fails at. Three regions, enforced by **content-hash detection** (not fragile comments):

| Region | Meaning | Regeneration behavior |
|---|---|---|
| **generated** | fully generator-owned | overwrite freely |
| **scaffold** | generated once, then user-owned (extension points) | 3-way merge; conflict → queue |
| **user** | human/novel code | never touched |

The benchmark showed *silent regeneration clobber* is the one failure mode **every** competitor shares (FlutterFlow's AI-Gen-vs-custom-code collision, v0/Bolt/Lovable's context degradation, GPT Engineer's whole-file re-send). Our region-aware merge is the thing no competitor can demo credibly — which is exactly why it's pulled forward into the investor demo.

---

## 10. What the field says (benchmark + tier-one research)

The evidence is in `BENCHMARK.md`. The headline: **the field provides *component-level* independent evidence for our architecture** — a peer-reviewed MODELS 2024 paper does "LLM generates the model, not code, validated against a metamodel," and the Athena project concludes "pure LLM generation produces inconsistent results; structural IRs are necessary." No single commercial precedent implements the *full* stack — which is stronger for us: we compose components the field independently validated, rather than copying a prior art.

The three market positions:

```
LLM-first agents (Copilot, Cursor, v0, Lovable, Bolt)  ← no semantic IR; regen/maintenance hard
      ↓
Hybrid structural (FlutterFlow, Builder.io/Mitosis)     ← closest, but regen/hand-edit boundary broken
      ↓
Deterministic platforms (OutSystems, Mendix, Appsmith)  ← deterministic, but AI is advisory-only
      ↓
★ OUR BUILDER: semantic IR + deterministic compiler + LLM reasoning lane
              + oracle + provenance + ACL + regen-safe merge
```

---

## 11. The phase plan

Full detail in `PHASE_PLAN.md`. The gist:

- **Phase 0 — Stratified vertical slice** (draft 6 schemas → walk 4 slices by rule category). Purpose: prove the IR is sufficient and the oracle works, *cheaply*. The exit heuristic: **"did we add any *semantic* information to the generated code that wasn't in the IR?"** — if yes, the IR is incomplete.
- **Phase 1 — Deterministic compiler core** (no LLM). Full IR + schemas + all structural generators + **Generation Plan as a first-class serialized artifact** + arch-linter + security-validator + lockfile + determinism regression test. One plugin per axis (built as a *strategy family*, not a one-off).
- **Phase 2 — Pattern generation.** Component registry, scoring function, forms, state machines, pagination/caching — plus a *second* state-mgmt plugin to prove the coupled-pair matrix is real, not combinatorial.
- **Phase 3 — Semantic (LLM) generation.** Split: **3a** = one agent (BusinessRuleAgent) proves the *semantic lane*; **3b** = remaining agents prove the *trust boundary* (write-ACL + approval routing + domain-oracle split). **v1 = end of Phase 3.**
- **Phase 4 — Novel + hardening** (post-v1). 3-way merge, reverse extraction, full a11y, grammar-growth reconciliation.

---

## 12. Current status & next steps

**Settled:** architecture, generation matrix, the six converged mechanisms, the correctness model, the PII policy, the phase plan. Documented across `DESIGN.md`, `GRILLING.md`, `BENCHMARK.md`, `PHASE_PLAN.md`.

**Next:**
1. Fold everything into `DESIGN.md` **v3** (the six mechanisms + Generation Plan artifact + correctness taxonomy + PII policy).
2. Write `AGENTS.md` (agent operating instructions for the repo) and the framework-of-thinking doc.
3. Start **Phase 0** — draft the 6 schemas, walk the 4 stratified slices, apply the "no semantic info beyond the IR" heuristic.

The one genuinely hard open item — **free-text PII in human example pairs** — has been resolved by design (structurally exclude free text from oracle-relevant input + deterministic PII-detector lower bound + synthetic-by-default + secrets discipline). See `CHATGPT_GRILLING_3.md` §PII.

---

## 13. Glossary

| Term | Meaning |
|---|---|
| **IR** (Application Model) | The canonical, semantic, versioned representation of the whole app — the single source of truth. Says *what*; not *how*. |
| **Deterministic generator** | A pure function that turns an IR fragment into code, byte-identical for the same input+context. No LLM. |
| **Generation class** | How an artifact is produced: **Structural** (schema-derived, 0% LLM), **Pattern** (deterministic selection), **Semantic** (LLM emits a formal rule), **Novel** (gated LLM coding). |
| **Generation Plan** | The persisted, inspectable list of artifacts-to-generate (`{artifact, generator, strategy, dependsOn, mode}`). The unit of dry-run/audit/diff. |
| **Dependency graph** | Nodes (IR elements/symbols) + edges (structural deps + derived `consumes/affects`) driving generation order and change impact. |
| **Plugin** | Binds a capability (state mgmt, routing, HTTP…) to a concrete library; a generation strategy + template family + conformance suite. |
| **Generation strategy** | One of 2–3 *shapes* of code a capability takes (e.g. observable-notifier / sealed-events / mutable-notifier). |
| **Validator** | The trust boundary for *shape* — JSON-schema + arch-linter + security checks. |
| **Oracle** | The trust boundary for *correctness* — human-attested example/expected-value pairs + executable invariants. **Never another LLM.** |
| **Provenance** | Metadata on every IR element: `origin`, `actor`, `confidence`, `source`, `trace`. |
| **Actor / write-ACL** | The credential (`agent:*` or `human:attested`) authorizing an IR write; field-level ACL prevents agents from writing human-only fields. |
| **Approval routing** | The **Reversibility × Blast-radius** 2×2: Tier R (reversible → batch/defer), Tier I (irreversible/high-blast → solo/blocking). |
| **Business rule (RuleModel)** | A formal, closed-language decision (expression / decision table / state machine) the LLM produces and the generator compiles. |
| **Extension queue** | The human handoff for rules the formal language can't express — a defined path, never silent fallthrough. |
| **Ownership region** | `generated` / `scaffold` / `user` — enforced by content-hash, determines overwrite vs merge vs never-touch. |
| **Regeneration safety** | Guarantee that an IR change regenerates code *without destroying human intent* (plan-diff → region-aware merge). |
| **Coherence collapse** | Benchmark-documented failure: an agent edits the *correct* function yet still breaks it. Mitigated by re-running all prior examples on every rule edit. |
| **Determinism regression test** | CI gate asserting byte-identical output on re-run with the same `GenerationContext`. |
| **Conformance suite** | Behavioral tests a plugin must pass (states, transitions, disposal, single-flight). |
| **Golden reference** | A human-approved idiomatic sample per plugin version; re-review is version-triggered, not similarity-scored. |
| **Correctness model** | The four questions — **structural** (validator), **behavioral** (oracle), **trust** (ACL/approval), **regeneration** (merge). |
