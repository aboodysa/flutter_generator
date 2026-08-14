# Flutter App Builder — Phase Plan

> Produced by Claude Code (tmux session), grounded in DESIGN.md §23 + GRILLING.md converged mechanisms.

Stopping the benchmark research here — pivoting to the phase plan, built directly from DESIGN.md §23 and the six converged GRILLING.md mechanisms already in context.

Your skeleton is right in its ordering. One structural adjustment before the phases: several of the six mechanisms are **foundational-but-latent** — cheap to build early, expensive to retrofit, but not load-bearing until a later phase actually exercises them. I've marked each mechanism "designed in / activated in" where those differ, rather than forcing each into exactly one phase. I also pulled a thin slice of §11 region-detection forward into Phase 0/1, for reasons explained in the investor-demo section — it's the single highest-leverage differentiator against every competitor benchmarked in the research pass, so proving it early is worth bending the "no regen machinery before Phase 4" instinct.

---

## Phase 0 — Stratified vertical slice (two sub-steps, not one)

**Goal:** Prove the IR is sufficient and the oracle model works, across the categories of rule that actually vary in difficulty — before any generalization is funded.

**Entry criteria:** None (this is where the project starts) — but Phase 0 itself has an internal gate: you cannot walk a slice against a schema that doesn't exist yet, so:
- **0a (schema draft):** Draft JSON Schemas for only the models the four slices touch — `EntityModel`, `RepositoryContractModel`, `UseCaseModel`, `ScreenModel`, `RuleModel`, `StateMachineModel` — with `schemaVersion: "1-draft"`. Not the full §2.1 shape.
- **0b (slice walk):** Hand-walk four slices end-to-end through the *entire* pipeline (IR → generator → code → test → green build), stratified by rule category, not by domain:
  1. **Mechanical CRUD** — Employee list/detail/create/edit. Proves Structural class, 0% LLM, basic Entity/Repo/UseCase/Screen generators.
  2. **Business rule (decision table)** — promotion eligibility (the running example from GRILLING.md). `RuleModel` is hand-authored (no BusinessRuleAgent exists yet) to prove `RuleCodeGenerator` + the §9.4 oracle: human example/expected-value pairs + invariant fuzzing.
  3. **State machine + temporal** — an approval workflow (Draft→Submitted→Approved/Rejected) with a guard and a `daysSince(...)` condition, whose rule also flips a `scr:employee_status_badge` — this is DESIGN.md §12.2's own worked example. Proves §19.3 transitions, §15 async/cancellation conventions, and gives you a real `consumes/affects` edge to test the change-impact graph against.
  4. **One deliberately ambiguous/pricing-style rule** expected to partially fail — e.g., weighted scoring for promotion ranking. This is not a nice-to-have: it's your first real data point for the GRILLING.md Q2 coverage-stratification exercise, and it proves the §19.4 human-extension-queue handoff is a defined path rather than silent fallthrough.

**Deliverables:** 6 draft JSON Schemas; 4 hand-built IR instances (one per slice), each element carrying `actor: human:attested` on every field even though no ACL enforcement exists yet; four generated, green-building mini-apps; a written coverage note for slice 4 (expressible / partially expressible / rejected-to-queue, and why).

**Exit criteria:** All four slices produce a green build + passing tests from hand-authored IR with zero code hand-written outside declared extension points. Slice 4's fallthrough is documented, not silently absorbed.

**Mechanisms landing here:** (2) domain-oracle field shape — `origin`/confidence fields exist in the entity/relation schema now, even though no agent proposes them yet (retrofitting this later is expensive). (5) `schemaVersion` exists from the first schema you write.

**De-risking:** This is the cheapest point in the project to discover the IR vocabulary is wrong. If slice 3 (state machine) or slice 4 (ambiguous rule) can't be expressed cleanly, that's a schema redesign now, not a Phase 3 agent-pipeline redesign later. Watch specifically for: does `RuleModel` actually need quantifiers/ordering (GRILLING.md Reviewer finding #4) to express even slice 4 partially? If yes, that's a required schema change before Phase 1, not an optional Phase 3 nice-to-have.

---

## Phase 1 — Deterministic compiler core (no LLM)

**Goal:** A general-purpose, zero-LLM compiler that turns a complete, hand-authored IR into a production-shaped Flutter app, with regen-safety and plugin architecture built right the first time.

**Entry criteria:** Phase 0 exit criteria met; the four slices' schema gaps folded into `schemaVersion: "1"` (now locked, with a migration table stub for v1→v2).

**Deliverables:**
- Full IR + JSON Schemas for every `*Model` in §2.1 (not just the six from Phase 0).
- Generators: `EntityGenerator`, `ValueObjectGenerator`, `RepositoryContractGenerator`, `UseCaseGenerator` (mechanical), `ModelGenerator`, `MapperGenerator`, `DataSourceGenerator`, `DIGenerator`, `RouteGenerator`, `StateGenerator` (boilerplate), `ScreenGenerator` (basic layouts only — full pattern selection is Phase 2), `TestGenerator` (entity/mapper/repo/usecase).
- One plugin per axis (state-mgmt, DI, routing, HTTP, local DB, serialization, secure-storage) — built as a **strategy family**, not a bespoke one-off: the plugin contract (§10) and the "generation strategies vs coupled-pair matrix" distinction (mechanism 4) must exist in the architecture now, even with one member per family, because retrofitting the strategy abstraction onto a single-plugin-shaped codebase is expensive later. **v3.4 priors:** (a) **manual serialization is the v1 reference implementation** — the 13-project scan found zero build_runner/codegen usage, so `ModelGenerator` ships manual-first, codegen plugins are secondary (N5); (b) **`none`/`vanilla` is a first-class strategy value** on state/DI/routing, resolved by the §5.2 scoring function below a complexity floor — a compiler that unconditionally emits get_it + state machine + router over-builds ~half of real projects (N1); (c) **structural datasource/repository generators emit `Failure`-mapping + release-sink wiring unconditionally** as baseline output, never contingent on hand-written error handling (N3/v3.4).
- Full IR + JSON Schemas **including the v3.3 additions** (§2.1.1): `acceptedKeys`/`parseMode`, `envelopeVariants[]`, `catalogs[]`, `queries[]`, `deliveryMode`, `useCases[].steps[]`, `navigation.guards[]`, `stateMachines[].persisted`, `persistence.offlineQueue` — not just the six from Phase 0.
- **Generation Plan as a first-class serialized artifact** (not a transient internal data structure): the planner's output, persisted and inspectable, one entry per artifact `{artifact, generator, strategy, dependsOn, mode, provenance}`. It feeds the build-order dependency graph (§12.1) and is the unit of `--dry-run`, explainability, caching, and audit. This is the fix ChatGPT flagged (and is genuinely new): the plan must be readable as `IR → Plan → artifact → generator → output`.
- `ArchLinter`, `SecurityValidator` (secret-literal rejection, incl. **DSN/URL-with-credentials patterns** — the 64 committed literals across 6/13 projects were mostly Sentry DSNs), `GenerationContext` cache key (§6.2, full tuple) + lockfile (§16.2).
- **A11y semantics generated as part of the UX contract** (§7 topology guarantee + §8 `semanticContract` + §14.4.1 + §15 `A11yTestGenerator`) — this is structural (0% LLM), so it lands in Phase 1, not deferred: every interactive component template emits `Semantics(role: true)` as the outermost node, and every screen's `test/a11y/<screen>_a11y_test.dart` is a build-gate invariant.
- A **thin slice of §11 region detection**: content-hash markers + "never silent overwrite" behavior for exactly one artifact class (recommend: use-case scaffold shells, §11.3's example). Full 3-way merge (§11.4) is NOT here — just detect-and-block, queue the conflict.
- A stub write-ACL test: a fake `agent:test` credential attempts to write `implementation: novel` into an IR patch; validator must reject it. No real agent exists yet — this proves the lock works before Phase 3 mints a key.
- Golden-reference sign-off (mechanism 6) for the one plugin per axis, established now as a practice even though there's nothing to compare it against yet — this is the cheapest point to start the discipline.
- **Determinism regression test**: re-run the full pipeline on the same IR + same `GenerationContext`, assert byte-identical output. This is a CI gate, not a one-time check.

**Exit criteria:** A hand-authored, realistic multi-entity IR (harder than any Phase 0 slice) produces a green build through `dart format → flutter analyze → arch linter → security validator → tests`; determinism regression test passes on every commit; the write-ACL stub test passes; the region-detection slice correctly blocks an overwrite when the hashed region has drifted.

**Mechanisms landing here:** (1) write-ACL scaffolding + provenance schema (designed now, load-bearing in Phase 3). (4) strategy-family plugin architecture + coupled-pair matrix documented explicitly, even at n=1 per axis (state-mgmt×DI is the only real cross-product cell — document that now so Phase 2 doesn't accidentally build a full grid). (5) generic `schemaVersion`/migration mechanism (not yet the rule-grammar-specific version). (6) golden-reference practice established for plugin v1.

**De-risking:** The biggest risk here is scope creep into "build every generator perfectly." Time-box: if a generator category is taking more than ~1.5x its estimate, ship the narrowest version that satisfies the exit criterion and defer richness to Phase 2. Watch the determinism regression test closely — if it's flaky, that's a purity violation (§6.2) hiding somewhere, and it's far cheaper to find now than after Phase 2/3 generators depend on the same purity guarantee.

---

## Phase 2 — Pattern generation

**Goal:** Deterministic *selection*, not just deterministic emission — screens, forms, and state machines chosen and parameterized by explicit IR attributes, not hardcoded per app.

**Entry criteria:** Phase 1 exit criteria met; at least one more plugin added to at least one axis (to actually exercise the strategy-family design from Phase 1, not just assert it).

**Deliverables:** Component registry (Tokens→Foundations→Atoms→Molecules→Organisms→Templates→Pages) with the "generated screens can't bypass the registry" arch-linter rule enforced; the §5.2 deterministic scoring function over `collectionCardinality/filterAxes/refreshCadence/density/responsiveness/offlinePolicy/permissionScope/stateComplexity` **with the `none`/vanilla low-end branch** (v3.4); `FormModel` + form generator; `StateMachineGenerator` for declared (non-agent) machines; pagination/caching pattern generator; `PersistenceModel` selection validator (§18, backend/syncStrategy coherence check); a second plugin per axis for at least the state-mgmt axis specifically, to prove the coupled-pair matrix (state-mgmt×DI and state-mgmt×persistence) is real and bounded, not a surprise combinatorial explosion. **v3.4:** ship **enum-status AND sealed-events at parity** — chosen by `stateComplexity` (state/transition/guard counts), not by recency of discovery (N2).

**Designer attach point (v3.5 — extensibility, §8.1):** the design system becomes an *external, schema-validated input package* (tokens + component registry + template overrides). Deliverables: `theme.tokens` overridable from a designer package; `components[]` consumed by `ScreenGenerator` by semantic requirement; `templates[]` versioned per-component overrides; the invariant "designer changes appearance, generator preserves behavior + a11y" enforced by the §14.4 validators. Exit criterion: a designer swaps tokens + one component template in a package and regenerates, and the screens restyle with zero generator-source edits while a11y/UX/golden gates stay green.

**Exit criteria:** The same IR, re-run with `stateManagement: riverpod` vs `stateManagement: bloc`, produces two idiomatically-different but both-conformant apps, passing the same conformance suite; golden-reference re-review (mechanism 6) is exercised for real on the second plugin's first version bump, not just documented.

**Mechanisms landing here:** (4) fully exercised — this is where you find out whether "orthogonal axes, one coupled pair" actually holds, or whether HTTP/local-DB secretly leak into the state layer despite Clean Architecture boundaries. (6) fully exercised — first real golden-reference re-review event.

**De-risking:** This phase is where GRILLING.md Q4's claim ("state-mgmt×HTTP is not a real cross-product cell because Clean Architecture already isolates it") gets tested against reality. If adding the second state-mgmt plugin forces changes in generators outside the state/DI layer, that's a layering violation you want to catch now — before Phase 3 agents start depending on the pattern layer being stable.

---

## Phase 3 — Semantic (LLM) generation

**Goal:** Bring the LLM into the loop as a reasoning-only participant that writes into the validated IR — and make the trust boundary a mechanism, not a policy.

**Entry criteria:** Phase 2 exit criteria met; the write-ACL stub test from Phase 1 has been passing continuously (proves the lock hasn't rotted); slice 4's fallthrough data from Phase 0 has been revisited with real coverage-stratification data if possible (CRUD/workflow/temporal/aggregate/pricing buckets per GRILLING.md Q2) — this is the funding gate the design itself proposed; don't skip it.

**Delivered in two sub-phases — one agent first (3a), then the rest (3b).** ChatGPT's point here is correct: prove the semantic lane with a single agent before scaling to seven. Note the precise scope: 3a proves the **semantic lane** (LLM→IR→validator→oracle→generator); 3b proves the **trust boundary** (write-ACL + approval routing), which only becomes meaningful with multiple agents and decision types.

### Phase 3a — one semantic agent (prove the semantic lane)
- `BusinessRuleAgent` only — schema-validated in, schema-validated out (§9.1).
- The full semantic lane wired end-to-end: `LLM → RuleModel → Validator → Oracle (human examples + invariants) → RuleCodeGenerator → Tests`.
- Formal rule language (§19) shipped with **grammar versioning as additive-only** (mechanism 5, generic mechanism from Phase 1's schema versioning, now specialized): every grammar bump is a new primitive, migrated forward, coverage tracked per grammar version as a release criterion.
- The **coherence-collapse check**: every rule edit re-runs *all* previously-passing examples and invariants for that rule, not just new ones; any decision-table row with zero example/invariant coverage is flagged "unverifiable edit" and requires mandatory human diff review.

### Phase 3b — remaining agents + trust-boundary machinery
- `RequirementAgent`, `DomainAgent`, `UIAgent`, `StateAgent`, `TestAgent`, `ReviewAgent` — each schema-validated in/out (§9.1).
- **Real write-ACL enforcement** (mechanism 1): every agent call is issued a real `agent:<name>` credential; `implementation` and `classification.class` live in a human-only writable subschema; a real interactive-approval flow mints `human:attested` tokens (CLI prompt or UI click, not an API key).
- **Domain-oracle split** (mechanism 2): `DomainAgent` output tags every relation/field `origin: schema-structural` (conf 1.0, only for facts the DDL/OpenAPI/GraphQL source mechanically encodes: column existence, FK target, cardinality tier from uniqueness/PK shape) vs `origin: schema-interpreted` or `origin: llm-inferred` (conf <1.0, routed to human confirmation, scoped tightly to cardinality/nullability/identity — not every field name, to avoid confirmation fatigue).
- **Approval routing 2x2** (mechanism 3): the human-touchpoint queue is keyed on decision-type × blast-radius, not structural similarity. Blast radius is read off the `consumes/affects` graph from §12.2 — which must now be **AST-derived from the closed rule language**, not hand-declared, since a hand-declared edge is exactly the drift vector that would let a Tier-I decision slip into the batched Tier-R pool. Tier R (relation/cardinality confirmations, naming, golden baselines) is deferrable and batchable; Tier I (money/permissions/compliance/cascade-affecting rules, critical transitions) is always solo and blocking.
- Two-party confidence (§9.3) implemented with the corrected framing from the tier-one research pass: **ReviewAgent disagreement is a triage signal, never a correctness certification** — the actual oracle is §9.4 (human examples + invariants), stated explicitly in the agent contract docs so no one downstream reads "two models agree" as proof.
- Traceability (§9.6): `Requirement → Rule → UseCase → Code → Tests` links populated for every agent-produced element.
- A short **data-handling policy** for human example/expected-value pairs (the open GRILLING.md thread) before they're sent to any LLM provider or checked into golden tests — this becomes load-bearing exactly here, since `RequirementAgent` is what starts capturing real (possibly sensitive) examples.

**Exit criteria — 3a gate:** Re-run slice 2 and slice 3 from Phase 0 via `BusinessRuleAgent` instead of hand-authored `RuleModel` — output must pass the same oracle (human examples + invariants) the hand-authored version did, and the coherence-collapse check must catch a deliberately-planted adjacent-row corruption.
**Exit criteria — 3b gate:** a red-team test proves an agent credential cannot set `implementation: novel` or `classification.class` directly; a Tier-I decision (e.g., a rule touching `permission: manage:employees`) is shown blocking generation until solo human approval, while ten Tier-R relation confirmations from the same run are shown batched and deferred without blocking.

**Mechanisms landing here:** (1), (2), (3) fully activated. (5) rule-grammar-specific versioning shipped (the reconciliation *tooling* for already-deployed apps is still Phase 4).

**De-risking:** This is the highest-risk phase, and the risk is invisible failure, not crashes — the coherence-collapse failure mode (LLM correctly edits one decision-table row while silently corrupting an adjacent, untested one) has no automated oracle unless invariants are broad. Concretely: require every rule edit to re-run *all* previously-passing examples and invariants for that rule, not just new ones, and flag any decision-table row with zero example/invariant coverage as an "unverifiable edit" class requiring mandatory human diff review regardless of confidence score. Build this check before you trust any agent-produced rule edit in a demo.

---

## Phase 4 — Novel + hardening

**Goal:** Close the remaining gaps that don't block a v1 release but that a durable product needs: gated human-authored code, full a11y/UX validation, brownfield import, and fleet-lifecycle tooling.

**Entry criteria:** Phase 3 exit criteria met and stable in a real (even if small) generated app for at least one iteration cycle.

**Deliverables:** Full §11.4 3-way merge (generated-vN shell, generated-vN+1 shell, user's file) with conflict queue; Novel lane (§5.4) end-to-end (`CodingAgent` → quarantined `ExternalCodeNode` → format→analyze→lint→human-tests→adversarial-review→approval); reverse extraction (existing project → IR + `ExternalCodeNode` hybrid, explicitly *not* full round-trip); full §21 UX/A11y semantic validation (focus order, RTL correctness, not just mechanical touch-target/contrast checks); **advisory-vs-blocking gating** (v3.4/N6): Quality/Security/Behavioral checks run blocking on `generated` regions and advisory on inherited `user`/legacy regions until the compiler regenerates them — this is what lets reverse-extraction of a `sem=0` legacy app proceed without failing the whole build; the grammar-growth **reconciliation tooling** from mechanism 5 — surfacing a 3-way *behavioral* diff (old `ExternalCodeNode` test results vs new primitive's spec vs set-difference) as an opt-in suggestion when a grammar bump structurally matches a deployed workaround; incremental regeneration at scale (§12.2 change-impact model exercised across a real multi-screen app, not just the Phase 0 slice-3 badge example).

**Exit criteria:** A deliberately-planted Novel-lane requirement goes through the full gate and is promoted only after human approval; a deliberately drifted user-edited file triggers the conflict queue instead of silent overwrite or silent freeze; a brownfield sample project imports with unmapped code correctly captured as `ExternalCodeNode`, not dropped or misclassified as generated.

**Mechanisms landing here:** (5) reconciliation tooling (the mechanism was *designed* in Phase 3, but there's nothing to reconcile against until Phase 4 has a real `ExternalCodeNode` history). (6) continues to apply as more plugins/versions accumulate.

**De-risking:** None of the competitor tools researched in the benchmark pass have a working, audited 3-way merge at this level of rigor — you can't borrow confidence from prior art here (Aider's diff-hunk match-or-fail is the closest analogue, and it's structurally simpler than what §11.4 proposes). Treat the 3-way merge as the highest-uncertainty deliverable in the whole roadmap and prototype it against real drifted files early in this phase, not late.

---

## Out of scope for a first releasable version (v1 = end of Phase 3)

- **Novel lane entirely.** No in-product gated LLM coding, no `ExternalCodeNode` promotion pipeline. A requirement that doesn't fit Structural/Pattern/Semantic is rejected to the human extension queue and hand-written *outside* the tool — out-of-band, not merged back in.
- **Reverse extraction / brownfield import.** v1 is greenfield-only.
- **Plugin marketplace / third-party plugins.** Ship exactly one reference plugin per capability axis (plus the second state-mgmt plugin proven in Phase 2 for the coupled-pair matrix) — no external conformance-suite submission process.
- **Full semantic a11y/UX validation.** Ship mechanical checks only (touch target size, contrast); defer focus-order and RTL-correctness judgment.
- **Golden visual-regression testing for every screen shape.** Cover only the pattern-generated CRUD screens proven in Phase 2.
- **3-way merge conflict-resolution UI.** The conflict *queue* and block-on-conflict behavior must exist (from Phase 1's thin slice); a polished resolution UI can be CLI/manual for v1.
- **Grammar-growth reconciliation tooling.** Requires Novel lane + fleet history, both out of scope — necessarily post-v1.
- **Multi-environment matrix beyond dev/prod.** Staging is a nice-to-have.
- **Multi-app / shared-fragment IR (v3.4/N4).** v1's unit of generation is a single `ApplicationModel`; shared code across sibling apps in one repo (e.g. a mono-repo `consumer`/`admin`) is out of scope, same non-goal treatment as full round-trip.

## Minimum demo-the-thesis-in-one-sprint

Pull directly from Phase 0's Slice A (CRUD) + Slice B (promotion-eligibility rule), packaged as a live demo, **plus the thin §11 region-detection slice pulled forward from Phase 1** — not the full Phase 1 build, just region markers + hash-check on one artifact.

The reason to pull that forward: the benchmark research just completed shows the *one* failure mode every competitor in Section 1 shares — FlutterFlow's AI-Gen-vs-custom-code collision, v0/Bolt/Lovable's "context fills, changes clobber each other," GPT Engineer's whole-file re-send — is silent regeneration clobber. It's also the single hardest thing for a competitor to fake in a live demo. The sprint's script: (1) generate the Employee entity + list/detail screens + promotion-eligibility rule from IR, app builds and runs; (2) show the rule's oracle working — a human example passes, a boundary case (`yearsInGrade = 3`) correctly fails; (3) hand-edit a generated scaffold region in the browser/editor; (4) change something unrelated in the IR and regenerate; (5) prove the hand-edit survived untouched. That last beat is the one no benchmarked competitor can currently demo credibly, and it's a one-sprint build if you scope the region-detection slice to exactly one artifact type rather than the general case.
