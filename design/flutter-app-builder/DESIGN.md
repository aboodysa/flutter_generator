# Flutter App Builder — Design v3

> A general-purpose Flutter application **compiler/planner**, not "an AI that writes Flutter code".
> Greenfield. No existing project, domain, package, state-management library, or design system assumed.
> v3 folds in: the six converged grilling mechanisms, the Generation Plan artifact, the correctness model, the PII policy, and the benchmark evidence.

---

## 0. Product Thesis

The product turns **product intent** (natural language, structured briefs, API/database schemas, Figma/Penpot exports) into a **production Flutter application** via a hybrid pipeline:

```
Product Intent
      ↓
Application Model (IR)      ← single source of truth: semantic, versioned, framework-agnostic
      ↓
Generation Planner          ← deterministic classification + generator selection
      ↓
Deterministic | Template | Schema | LLM Reasoning | LLM Coding (gated)
      ↓
Generated Flutter Project
      ↓
Validation Pipeline (static → arch → tests → oracle → a11y/UX → security → build)
```

**Three non-negotiable principles:**

1. **Determinism first** — a deterministic generator is used whenever output can be derived from a template, schema, or rule. The LLM is for reasoning/interpretation/business logic, and writes into a *validated intermediate form*.

2. **Correctness needs an independent oracle** — determinism proves code matches the IR; it does **not** prove the IR matches intent. Schema validation proves *shape*, not *correctness*. The oracle is human-attested examples + executable invariants — **never** another LLM.

3. **The correctness model is four distinct questions** (§6) — structural, behavioral, trust, and regeneration — answered by *different* mechanisms. Conflating them is the root cause of most "AI app builder" failures.

**What it is NOT:** prompt-to-500-lines-of-Flutter autocomplete. A collection of per-project prompts. A generator for one style of app.

---

## 1. Universal Concepts (framework-agnostic)

| Concept | Definition |
|---|---|
| **Entity** | Durable domain object with identity. |
| **Value Object** | Immutable value with invariants, no identity. |
| **Field** | Typed attribute; semantic type (primitive vs VO). |
| **Relation** | Association between entities (1:1, 1:N, N:M, composition). |
| **Operation** | Effect/query on an entity (CRUD, query, command). |
| **Business Rule** | Formal decision/constraint/transition (§19). |
| **Workflow / State Machine** | States, events, transitions, guards, effects. |
| **Datasource** | External system (REST/GraphQL/SQL/Firestore/gRPC/file). |
| **Persistence** | Where data is source-of-truth (BaaS/local-first/REST+DB). |
| **Screen** | Composition of components bound to data/actions/nav. |
| **Component** | Reusable UI unit with a contract. |
| **Navigation** | Graph of routes, params, guards, deep links. |
| **Permission** | Guard on data/action/route. |
| **Secret / Auth** | Key material, tokens, rotation, secure storage. |
| **Localization** | Locale set, direction, keyed strings, ICU formatting. |
| **Theme / Tokens** | Design tokens and component styling. |
| **State Model** | Mechanical states or a state machine, with lifecycle. |
| **Observability** | Logging, crash reporting, tracing. |
| **Integration** | Non-CRUD external interaction (payment, notification). |

Flutter is a *target backend* for these nouns, not the vocabulary of the IR.

---

## 2. Application IR — `ApplicationModel`

Single canonical intermediate representation. Typed (JSON Schema + TypeScript/Zod), **versioned**, diffable, ID-addressable.

### 2.1 Top-level shape

```yaml
schemaVersion: "1"          # REQUIRED — see §2.4
project:          {name, package, targetFramework, sdkConstraint, defaults}
features, entities, valueObjects, relations,
repositories, useCases, businessRules, datasources,
persistence, models, mappers, screens, components,
stateMachines, navigation, forms, permissions,
localization, theme, secrets, observability,
catalogs, queries,          # v3.3: static reference data + query/filter models
plugins:          {stateManagement, routing, di, http, localDb, serialization, secureStorage}
di:               DependencyGraphModel
externalCode:     ExternalCodeNode[]    # preserved user/novel code
tests:            TestCaseModel[]
```

### 2.1.1 IR additions from the Rasheed gap audit (v3.3 — validated, semantic-only)

These were proposed by a cheap-model audit, then independently validated for purity by grilling + Claude. Only semantic additions survive; implementation-flavored proposals were moved to §10 (plugins/strategies) or rejected (see §27 log).

- **`models[].fields[].acceptedKeys[]` + `parseMode: strict|lenient`** — the wire contract may accept multiple key aliases (`totalAmount ?? total_amount ?? amount`). This is a contract *fact*, not implementation. `lenient` must still raise `SerializationFailure` when **no** accepted key matches — lenient ≠ silently default.
- **`datasources[].envelopeVariants[]`** — an endpoint may return one of several envelope shapes. Variants are **typed and discriminated** (by version / content-type / key-presence), never a try-cascade; no-match is `SerializationFailure`, never an empty/default fallback.
- **`catalogs[]`** — static reference data (in-code lists that mappers join against). Semantic; may merge with enum/status primitives.
- **`queries[]`** — a `QueryModel{filters, sort, pagination}` that stays **wire-name-agnostic**; the field→wire-param translation lives in `datasources[].operations[].paramMapping` (the query VO must not know wire names — that's the layering violation this corrects).
- **`repositories[].deliveryMode: oneShot|continuous`** — one-time read vs live/streaming subscription. The Dart `Stream` type is the generator's choice, not an IR value; `cacheThrough` is already §18's `syncStrategy`, not duplicated here.
- **`useCases[].steps[]`** — an ordered orchestration sequence referencing IR element IDs only (sub-use-case / repo-call / mapper), never embedded free logic.
- **`navigation.guards[]`** — declarative guard rules (auth/guest/registered/deep-link) replacing imperative redirect closures.
- **`stateMachines[].persisted: true|false`** — state persistence (hydrated), resolved per-strategy via a §10.2 coupled-pair (state-mgmt × persistence), not a flat plugin.
- **`persistence.offlineQueue{statuses, attempts, retryAt, lastError}`** — fleshes out `syncStrategy: offlineQueue` (outbox pattern).

### 2.2 Provenance record (on every element)

```json
{
  "id": "ent:employee",
  "class": "structural",
  "origin": "deterministic | schema-structural | schema-interpreted | llm-inferred | human-confirmed",
  "actor": "agent:domain | agent:businessRule | human:attested",   // ← v3 addition
  "confidence": 1.0,
  "confidenceSource": "deterministic | second-party | human-attested",
  "source": ["req:R-023"],
  "requiresApproval": false,
  "generator": "EntityGenerator",
  "template": "entity.v2",
  "schema": "entity.schema.v1",
  "ownership": "generated | scaffold | user",
  "trace": ["R-023"]
}
```

**`actor` is the load-bearing new field.** It is derived from the *pipeline stage credential*, never from a claim inside the payload (an agent cannot self-attest "I am human"). `human:attested` means a signed approval from an actual CLI prompt/UI interaction — **not** an API key, which is still a machine credential.

### 2.3 IR rules

1. IR is **semantic, not implementation** — it says *what*; plugins say *how*.
2. IR is the **diff unit**; incremental regeneration diffs IR elements, not Dart files.
3. IR is the **LLM's only write target** — except the gated Novel lane (§5.4), which writes a quarantined `externalCode` node.
4. IR is **versioned and migrated** (§2.4); every `*Model` has a full JSON Schema *before* its generator exists.
5. "Single source of truth" is **per-app, per pinned grammar version** — not a fleet-wide live invariant.
6. **v1 unit of generation is one `ApplicationModel` (v3.4).** Shared code *across sibling apps in one repo* (e.g. a `consumer` and `admin` app in a mono-repo) is **explicitly out of scope** — same non-goal treatment as full round-trip in §11.2. Multi-app/shared-fragment IR is post-v1/undecided.

### 2.4 IR versioning & migration

- `schemaVersion` is mandatory and monotonic.
- An explicit **migration table** maps `vN → vN+1` (e.g. "v1→v2: `ScreenModel.filter` defaults to `[]`").
- Grammar growth (§19) is **additive-only**: a bump adds primitives; it never retroactively reclassifies approved `ExternalCodeNode` work. A grammar bump that structurally matches a deployed workaround surfaces a **3-way behavioral diff** (old tests, new primitive's spec, set-difference) as an *opt-in human-approved suggestion* — never an auto-migration.

---

## 3. Artifact Taxonomy

**Axis A — Layer:** `core | domain | data | presentation | state | di | routing | localization | theme | testing | infra`.

**Axis B — Generation Class:**

| Class | Meaning | LLM role |
|---|---|---|
| **Structural** | Mechanically predictable from schema. | none |
| **Pattern** | Known pattern; deterministic selection + parameterization. | may *add IR attributes*, never selects |
| **Semantic** | LLM emits a *formal rule*; generator compiles it. | reasoning only |
| **Novel** | Fits no pattern; gated LLM coding. | coding, always human-approved |

**Classification is computed deterministically** by the Generation Planner from the IR schema — *not* by an LLM. This is enforced by a **field-level write-ACL** (§9.3): `implementation` and `classification.class` live in a **human-only writable subschema**; the Validator rejects any patch that sets them from an `agent:*` credential, before the write reaches the IR.

---

## 4. Master Generation Matrix

`Area | Artifact | Class | Det | LLM | Human | Generator | Tests | Validation | Ownership | Regen`. Determinism markers are **conditional**: `✅` = deterministic given the explicit IR fields cited; `~` = deterministic after pattern selection; `◐` = partial.

| Artifact | Class | Det | LLM | Generator |
|---|---|---|---|---|
| Entity | structural | ✅ | ❌ | EntityGenerator (equality/immutability explicit) |
| Value Object (known type) | structural | ✅ | ❌ | ValueObjectGenerator |
| Value Object (novel type) | semantic | ◐ | ✅ | SemanticTypeAgent |
| Repository contract | structural | ✅ | ❌ | RepositoryContractGenerator |
| Use case shell (mechanical) | structural | ✅ | ❌ | UseCaseGenerator |
| Use case logic (business) | semantic | ◐ | ✅ | BusinessRuleAgent → RuleCodeGenerator |
| Validator (standard/business) | structural / semantic | ✅/◐ | ❌/✅ | ValidationGenerator / BusinessRuleAgent |
| DTO/Model + serialization | structural | ✅ | ❌ | ModelGenerator |
| Mapper (direct/configured/novel) | structural / pattern / novel | ✅/~ /◐ | ❌/❌/✅ | MapperGenerator / CodingAgent |
| Datasource contract + impl | structural | ✅ | ❌ | DataSourceGenerator |
| API client / transport | structural | ✅ | ❌ | ApiGenerator |
| Repository implementation | structural | ~ | ❌ | RepositoryGenerator |
| Cache/offline strategy | pattern | ~ | optional | CacheStrategyAgent |
| Screen (list/detail/form/CRUD) | pattern | ~ | ❌ | ScreenGenerator |
| Screen (complex workflow) | semantic | ◐ | ✅ | UIAgent → ScreenGenerator |
| Complex/novel UI | novel | ◐ | ✅ | UICodingAgent |
| Loading/error/empty states | structural | ✅ | ❌ | StateGenerator |
| State boilerplate / state machine | structural | ✅ | ❌ | StateGenerator / StateMachineGenerator |
| Complex transition logic | semantic | ◐ | ✅ | StateAgent |
| DI registrations | structural | ✅ | ❌ | DIGenerator |
| Routes / guards / deep links | structural | ✅ | ❌ | RouteGenerator |
| Localization / theme / config | structural | ✅ | ❌ | LocalizationGenerator / ThemeGenerator / ConfigGenerator |
| Secrets/Auth wiring | structural | ✅ | ❌ | SecretsGenerator |
| Observability wiring | structural | ✅ | ❌ | ObservabilityGenerator |
| Entity/Mapper/Model tests | structural | ✅ | ❌ | TestGenerator |
| Repository/Datasource contract tests | structural | ✅ | ❌ | TestGenerator |
| Business-rule tests | structural | ✅ | ❌ | RuleTestGenerator (oracle = human examples + invariants) |
| Widget / golden / integration tests | structural / pattern | ✅/~ | ❌/sometimes | WidgetTestGenerator / GoldenGenerator / IntegrationGenerator |

**Data-layer emission rules (v3.2):** the API contract declares the **envelope shape + nesting depth per endpoint** (e.g. `{success, data:[...]}` single-nested vs `{success, data:{data:[...]}}` double-nested); `DataSourceGenerator`/`ModelGenerator` emit a **per-endpoint typed parser** derived from that declared shape — **never** a shared blind "unwrap one layer" utility (the source of a real production bug where a double-nested endpoint crashed a single-layer unwrap and the type error was swallowed into a generic message).

---

## 5. The Four Generation Classes

### 5.1 Structural — 0% LLM
Entity, DTO, repository contract, datasource, direct mapper, DI, routes, state boilerplate, serialization, config, test boilerplate, localization keys.

### 5.2 Pattern — deterministic selection
The IR expresses intent; a **deterministic scoring function** over explicit IR attributes selects the pattern family and parameters. The LLM may only *add attributes*; it never selects directly.

```
selection = score(collectionCardinality, filterAxes, refreshCadence, density,
                  responsiveness, offlinePolicy, permissionScope,
                  stateComplexity)          # v3.4: state/transition/guard counts
```

- **State-machine strategy selector (v3.4):** `stateComplexity` is computed from the already-declared `stateMachines[]` shape (state count, transition count, guard presence) — a machine with many guarded transitions favors **sealed-events** (exhaustive matching pays for itself); a simple loading/success/error status favors **enum-status**. No new IR field — the scoring function consumes data that already exists. *File-count is disqualified as an input* (it's a property of generated output, not computable from the IR at plan time — selecting architecture from code that doesn't exist yet inverts cause and effect).
- **Low-end "none" branch (v3.4):** below a complexity floor, the scoring function resolves to the `none`/`vanilla` strategy (§10) rather than over-generating state/DI/routing for minimal screens.

### 5.3 Semantic — reasoning only
```
NL requirement → SemanticModel → RuleModel (validated) → RuleCodeGenerator → Code + Tests
```
The LLM never writes code here; it produces a `RuleModel` in the formal language (§19). Unexpressible rules fail into a human extension queue (§19.4) — **not** Novel.

### 5.4 Novel — gated, always human-approved
Triggered only by an IR element that **explicitly declares `implementation: novel`** and carries a human-authored spec. The coding agent's output is quarantined as an `externalCode` node and must pass, in order: `dart format → flutter analyze → arch linter → human-authored tests → adversarial review → human approval`. Novel is a *human-declared* escape hatch, not an LLM-classifiable bucket.

---

## 6. Generator Architecture & the Generation Plan

### 6.1 Generation Plan — a first-class serialized artifact

Between IR and generators sits a **persisted, inspectable Generation Plan** (not a transient data structure):

```
IR → GenerationPlan → DependencyGraph → Generators → Output
```

Each entry: `{artifact, generator, strategy, dependsOn, mode, provenance}`. It is the unit of `--dry-run`, explainability, caching, audit, and diff. This is what makes `IR → artifact → generator → output` debuggable and auditable.

### 6.2 Generator contract
Each generator is a **pure function** `(IR fragment, GenerationContext) → GeneratedFile[]`.

```yaml
id: EntityGenerator
class: structural
inputSchema: entity.schema.v1
outputSchema: dart-file
template: entity.v2
validation: [schema, arch-linter, analyzer]
tests: [entity_eq_hash]
mode: deterministic
```

### 6.3 Purity contract
Output is deterministic in the **full GenerationContext** — an explicit, versioned input tuple that is also the cache key:

```
GenerationContext = { irVersion, fragment, templateVersion, pluginVersion,
                      generatorVersion, sdkConstraint, localeDataVersion, fontVersion }
```

Two runs with identical context produce **byte-identical** output (enforced by a determinism regression test).

### 6.4 Rules
1. Generators are pure (§6.3).
2. Generators compose along the dependency graph (§12); never in random order.
3. Every file carries ownership metadata (§11).
4. A generator never writes into a user-owned region.

---

## 7. Template Registry (versioned)

```yaml
template: { id: entity, version: 2, target: flutter, language: dart, inputs: [entity], params: [nullability, equality, immutability] }
```
Versioned; files carry the version; bumps are gated by the merge path (§11.4).

**Topology guarantees (production-derived, v3.2):** templates fix widget *topology*, not just text — every interactive-component template emits `Semantics(<role-flag>: true, ...)` as the **outermost** node, with `GestureDetector`/`InkWell`/child `ExcludeSemantics` nested *inside* it. This eliminates a whole defect class by construction (a human wrapping `Semantics` inside the gesture detector silently loses the `isButton` flag; a correct template structurally cannot).

---

## 8. Component Registry & Design System

`Tokens → Foundations → Atoms → Molecules → Organisms → Templates → Pages`. Each component exposes `{name, purpose, inputs, variants, states, tokens, semanticContract, responsive, examples}`. Generated screens select components by semantic requirement; an arch rule forbids bypassing the registry or hardcoding tokens.

The **semantic contract** is a first-class part of every component (not post-hoc metadata), and is what makes accessibility *generated as part of the UX contract*:

```yaml
component: IconButton
semanticContract:
  role: button            # inferred from interaction/purpose: button | link | heading | input | image | ...
  accessibleName: { source: label | action | boundData, fallback: "Delete" }
  states: [disabled, selected, expanded, loading, error]
  keyboardFocusable: true
  mergePolicy: merge | excludeSemantics   # to avoid duplicate/unnecessary semantics
```

The generator emits the semantics **with** the component (Flutter `Semantics` / `SemanticsProperties`; Web native HTML/ARIA only where it diverges from native), never as a later pass. The `mergePolicy` is what prevents duplicate semantics when a parent already describes a child.

### 8.1 Extension point — the UI/UX designer attach surface (v3.5)

The design system is the **extension seam** where a UI/UX designer attaches without touching generator code. A designer supplies a **design-system package** (tokens + component specs + templates) as data; the generator consumes it. Three pluggable inputs, all versioned, all schema-validated:

1. **Design tokens** (`theme.tokens`) — the primitive palette/spacing/typography. The designer overrides tokens; generated screens consume tokens by name, never raw values. The arch-linter already forbids raw color literals, so a designer *cannot* be bypassed silently.
2. **Component registry** (`components[]`) — the semantic component catalog (`{name, purpose, inputs, variants, states, tokens, semanticContract, responsive, examples}`). The designer adds/removes components; `ScreenGenerator` selects by *semantic requirement* ("a searchable filterable list"), so a designer shipping a new `FilterBar` component changes every generated screen that needs one — without regenerating the screen logic.
3. **Template overrides** (`templates[]`) — per-component or per-pattern Flutter/Dart templates, versioned like §7. A designer can replace the *visual* template for `PrimaryButton` while the semantic contract (a11y role/name/states) stays enforced.

The invariant that makes this safe: **semantics are generated from the IR/UX contract, and the component registry is the only vocabulary screens may use** — so a designer changes *appearance*, the generator preserves *behavior + accessibility*. A designer cannot introduce an unlabeled button or a hardcoded color, because the validator (§14.4) checks the emitted tree, not the designer's intent.

**Designer workflow (target):** designer edits tokens/components in a design-system package → re-run generation → screens restyle deterministically → a11y/UX/golden validators gate the result. No generator source edit.

### 8.2 Extensibility principles (beyond design system)

- **Generators** extend via the registry (`src/index.ts`): a new artifact type = one registry entry + one schema + one pure generator — the dispatch core is closed.
- **Plugins** (§10) extend state/DI/routing/HTTP/etc. via generation strategies + conformance suite — a new library = a new strategy, not a rewrite.
- **Business rules** (§19) extend via the formal rule language; new primitives are added by human-authored grammar bumps, not by recompiling the generator.
- The compiler's own **GenerationContext** (§6.3) is the versioned boundary: any extension bumps a version in the context, and the lockfile (§16) pins it.

---

## 9. LLM Agent Architecture

Specialized agents with schema-validated outputs: RequirementAgent, DomainAgent, BusinessRuleAgent, ArchitectureAgent, UIAgent, StateAgent, TestAgent, ReviewAgent.

### 9.1 Trust boundary
```
Agent → JSON (schema-validated) → Validator → IR
```
Free-form LLM output is never trusted.

### 9.2 Domain-oracle split (v3)
`DomainAgent` tags every field/relation with an origin that determines confidence:
- `schema-structural` (conf 1.0) — only facts a structured source mechanically encodes: column existence/type, FK target entity, cardinality *tier* from uniqueness/PK shape.
- `schema-interpreted` (conf <1.0 → human-confirm gate) — `NOT NULL` read as business-required, denormalized/blob-unpacked relations, naming-based inference.
- `llm-inferred` (pure NL, conf <1.0 → human-confirm gate, scoped tightly to cardinality/nullability/identity to avoid confirmation fatigue).

Confidence 1.0 is earned only by a thin band of literally-structural facts.

### 9.3 Field-level write-ACL (v3)
Every IR write carries `actor` (§2.2). Human-only fields (`implementation`, `classification.class`) live in a human-writable subschema; the Validator rejects agent writes to them. This is the *mechanism* that makes "no agent may reclassify an artifact" a fact, not a policy.

### 9.4 Two-party confidence + oracle (v3)
- **First-party**: the producing agent's calibrated probability (weak prior only).
- **Second-party**: an adversarial ReviewAgent (different model/prompt, zero shared context) — treated as **triage, never certification** (per benchmark: LLM judges are unreliable).
- **The actual oracle**: human-attested example/expected-value pairs + declared invariants. A rule that passes shape but violates an oracle cannot be promoted.

`secondParty < threshold (0.75)` **or** disagreement **or** critical rule → approval queue.

### 9.5 Approval routing — Reversibility × Blast-radius (v3)
- **Tier R** (reversible, cheap to fix): naming, VO boundaries, golden baselines, relation/cardinality confirmations — **batched + deferrable** (does not block generation).
- **Tier I** (irreversible / high blast radius): rules touching money/permissions/compliance/cascade, critical transitions — **always solo and blocking**.

Blast radius is read off the `consumes/affects` graph (§12.2), which is **AST-derived** from the closed rule language — never hand-declared (a hand-declared edge is the drift vector that lets a Tier-I decision slip into the batched Tier-R pool). Review-clustering axis is **decision-type × blast-radius**, not structural similarity (shape-similar entities hide high-stakes outliers).

### 9.6 Traceability
`Requirement R-023 → Rule BR-017 → UseCase UC-009 → Code → Tests` — provenance links for impact analysis.

---

## 10. Plugin / Adaptor Architecture

The IR declares semantics; a plugin binds them to a concrete library. A plugin = **generation strategy + template family + conformance suite + idiom lints + golden reference**.

| Capability | Plugins |
|---|---|
| State management | riverpod, bloc, provider, signals, **none** |
| DI | get_it, riverpod, provider, injectable, **none** |
| Routing | go_router, auto_route, **none** |
| HTTP | dio, http |
| Local DB | drift, hive, sqflite, isar |
| Serialization | json_serializable, freezed, manual |
| Form validation | formz, manual |
| Secure storage | flutter_secure_storage (native Keychain/Keystore), localStorage-sync (web) |

`none` (v3.4) is a first-class strategy value, not an absence: it means "emit the minimal vanilla form" (StatefulWidget state, no DI container, no router), resolved by the §5.2 scoring function below a complexity floor — never by omission. A compiler that *unconditionally* emits get_it + state machine + router over-builds the ~half of real projects that are minimal.

### 10.1 Generation strategies (v3 — not "adapter abstraction")
State management is **not** a parameterizable variation of one generator; it has distinct *shapes*. There are 3–4 **generation strategies** (observable-notifier, sealed-events, mutable-notifier, **enum-status**), each a full template family. A plugin implements a strategy.

- **enum-status (v3.3)** — the common Bloc idiom: a single state class with an `enum Status { initial, loading, success, failure }` field + Equatable `copyWith`, instead of sealed state subclasses. **Peer strategy, not primary** (v3.4): the cross-project scan found sealed-events genuinely dominant in the largest bloc apps (16 sealed classes in one 194-file app), so enum-status and sealed-events are chosen by §5.2's `stateComplexity` score, not by recency of discovery. The sealed-events exhaustiveness lint is **strategy-scoped** (only applies to the sealed-events strategy), not global.

### 10.2 Coupled-pair matrices (v3)
Only a few axes are genuinely coupled (state-mgmt × DI, state-mgmt × persistence, routing × guards — small matrices). All other axes are **orthogonal** because Clean Architecture isolates them behind interfaces (state never sees Dio-vs-http or Drift-vs-Hive). The design declares coupled-pair matrices explicitly and assumes orthogonality elsewhere — validated at plan time.

- **state-mgmt × persistence (v3.3)**: `stateMachines[].persisted: true` resolves to a persistence mechanism per strategy (e.g. `hydrated_bloc` for Bloc, a storage-backed provider for Riverpod). `hydrated_bloc` is **not** a flat fifth plugin — it's `bloc` + a cross-cutting persistence capability, so it lives in this pair, not the flat list.

### 10.3 Conformance + golden reference (v3)
- **Behavioral conformance suite**: states, transitions, disposal, single-flight.
- **Idiom lints** (plugin-authored lint pack): mechanizes the checkable part of idiomaticity (no rebuild storms, no hand-rolled providers, sealed-state exhaustiveness).
- **Golden reference**: a human expert reviews an idiomatic reference app **once per plugin version**; re-review is **binary + version-triggered** (any `GenerationContext` bump touching that plugin's template set = mandatory human re-review). The AST diff is a *UI aid*, not a gate. Idiomaticity is permanently outside automated self-certification.

---

## 11. Generated-Code Ownership & Regeneration Safety

| Region | Meaning | Regen behavior |
|---|---|---|
| **generated** | fully generator-owned | overwrite freely |
| **scaffold** | generated once, then user-owned | 3-way merge; conflict → queue |
| **user** | human/novel code | never touched |

### 11.1 Region detection — content-hash, not header comments
Files carry stable region markers at declaration level (survive `dart format`/refactors). Each region is **content-hashed**; before overwrite the generator hashes the current region and writes only if it matches the last-known-generated hash. Drift → conflict queue, never silent clobber.

### 11.2 External code node
User/legacy/novel code with no IR representation is an `ExternalCodeNode`: `{id, path, kind: user|novel, hash, boundary: {declaredInputs, declaredOutputs}, ownership}`. This makes "IR is the single source of truth" structurally true even after humans write code. Reverse extraction is **IR + preserved-code hybrid** — full round-trip is explicitly out of scope.

### 11.3 Scaffold extension points
```dart
class CalculatePromotionEligibility {
  // [generated] region:generated
  Future<Result<bool>> execute(EligibilityInput input) async {
    // [user] region:user — implement rule BR-017
    throw UnimplementedError();
  }
}
```

### 11.4 Scaffold migration — 3-way merge
Template v2→v3 with a user-filled region uses a **3-way merge** (generated-v2 shell, generated-v3 shell, user's file). A "clean" auto-merge is validated (`format → analyze → tests`) before acceptance; otherwise → conflict queue. No silent overwrite, no permanent freeze. The merge base is byte-reproducible from the lockfile (§23.3) which pins `generatorVersion`.

### 11.5 Regeneration as one unified flow (v3)
`Spec change → Generation Plan diff → artifact diff → region-aware merge → preserve human intent`. The Generation Plan, ownership regions, and change-impact graph are **one system**, not three features: the plan-diff *drives* the region-aware merge.

---

## 12. Dependency Graph & Generation Order

### 12.1 Build-order graph
Nodes = IR elements; edges = structural deps. `Entity → RepositoryContract → Datasource → Model → Mapper → RepositoryImpl → UseCase → State → Screen → Route`. Generation order = topological sort.

### 12.2 Change-impact model (v3)
Nodes = symbols with provenance + **derived** semantic edges. `consumes` is statically computed from the rule language AST (fields the expression reads); `affects` is derived from structural bindings (a badge's `source: rule:br:x`), **not hand-declared**. Impact = transitive closure over structural + derived-binding edges. A completeness lint warns on a rule consumed by nothing.

---

## 13. Incremental Regeneration

- Diff unit = IR element. Changing an entity field regenerates reachable nodes; a UI schema change regenerates UI only; a rule change regenerates rule impl + affected use cases + affected tests.
- Modes: `FULL | FEATURE | LAYER | ARTIFACT | PATCH | REGENERATE_AFFECTED`.
- `--dry-run` prints will-create / will-modify / will-regenerate / requires-LLM / requires-approval.

---

## 14. Validation Pipeline & the Correctness Model

The pipeline is a set of **layers**, not one sequential chain — once an artifact is structurally valid, Behavioral / Quality / Security checks can run in parallel.

### 14.1 Validation layer taxonomy

```
VALIDATION
├── Structural   — Static (dart format / flutter analyze) + Architecture (linter)
├── Behavioral   — Tests + Oracle
├── Quality      — A11y + UX  (two DISTINCT layers)
├── Security     — policy-driven checks (not just secrets)
└── Artifact     — Build
```

**Advisory vs blocking gating (v3.4):** Quality/Security/Behavioral checks are **unconditional (blocking)** on `generated` regions; on `user`/legacy regions inherited via reverse-extraction they run **advisory (report, don't block)** until the compiler actually regenerates that region. This is what lets regeneration of an existing app with zero existing `Semantics` proceed without failing the whole build — the a11y gate fires on code the compiler owns, not code it inherited. Scope to Phase 4 (where reverse-extraction already lives), not v1 core.

### 14.2 Correctness model — the four questions (orthogonal to the layers)
| Type | Question | Mechanism |
|---|---|---|
| **Structural** | Is IR/AST/architecture valid? | Validator (schema + arch-linter) |
| **Behavioral** | Does code do what the spec says? | Oracle (human examples + invariants) + tests |
| **Trust** | Was this written by an authorized actor? | Provenance + field write-ACL + approval routing |
| **Regeneration** | Did a change preserve human intent? | Plan-diff → region-aware merge (§11.5) |

The correctness model answers *what* must be true; the layers answer *how* it's checked. They are not the same axis.

### 14.3 Structural — static + architecture
- **Static**: `dart format`, `flutter analyze` (syntax, types, lint).
- **Architecture linter** (fails build): domain cannot import Flutter UI / Dio / DB packages; presentation cannot import datasource/repo-impl; feature A cannot import feature B internals; generated UI cannot use raw design constants or bypass the component registry.
- **Forbidden idioms (production-derived, v3.2):**
  - **No raw `dart.library.*` conditional imports** for platform/strategy selection in generated code — platform strategy selection goes through DI/plugin registration (§10). Conditional-import resolution has already changed across Flutter SDK versions (a `dart.library.html` check silently resolved false on Flutter 3.44 web builds and linked the wrong storage backend with zero runtime error).
  - **No swallowed deserialization/type/format errors** — any generated `catch` that can catch such an error must map it to a distinct `Failure` subtype (§17, `SerializationFailure`) and route it to observability; it must not collapse into a generic message.

### 14.4 Quality — A11y and UX as two DISTINCT layers

- **A11y (accessibility)** = *can everyone use it?* Semantic labels/roles/actions, focus order, keyboard navigation, contrast, text-scaling, touch-target size (≥44px). About assistive-technology reachability.
- **UX (interaction contract)** = *is the behavior correct and coherent?* Loading/error/empty states, disabled-until-valid submit, confirmation on destructive actions, error recovery, validation timing. About whether the interaction matches the UX contract.

Both are **IR-driven and deterministic**, not LLM reviews:

#### 14.4.1 A11y — semantics generated as part of the UX contract

Accessibility semantics are **generated with the component**, not added afterward. For every generated component the generator:

1. **Infers the semantic role** from interaction + purpose — `button`, `link`, `heading`, `input`, `image`, `list`, `alert`, etc.
2. **Generates an accessible name/label** for every interactive element (from the bound action/label/data, with a declared fallback — never a bare `IconButton` with no name).
3. **Generates the relevant states** — `disabled`, `selected`, `expanded`, `loading`, `error` — as part of the semantics (Flutter `SemanticsProperties`; Web `aria-*` / native element state).
4. **Makes interactive elements keyboard/focus-accessible** where applicable (tab order, focus traversal, keyboard activation).
5. **Preserves visual design and behavior** — semantics describe, they do not restructure; the rendered UI is unchanged.
6. **Avoids unnecessary or duplicate semantics** via the component's `mergePolicy` (§8): a parent that already describes a child (e.g. `ExcludeSemantics` on decorative icons, `MergeSemantics` on grouped rows) prevents double-announcement.
7. **Target mapping** — Flutter emits `Semantics`/`SemanticsProperties` on **every** platform, including Web. **Decision:** Flutter Web does **not** emit native HTML — its HTML renderer is deprecated/removed, and CanvasKit/Skwasm paint to a `<canvas>`; Flutter synthesizes an ARIA accessibility tree over the canvas (`<flt-semantics-host>`), never a native `<button>`/`<a>`/`<input>`. So the correct statement is "Flutter `Semantics` everywhere; ARIA only via Flutter's synthesized tree on Web." A *native* HTML+ARIA path is a **separate non-Flutter backend**, not a Flutter Web feature — out of scope for v1, but if built later it's a deterministic template mapping of `semanticContract` → `<button aria-pressed>` (same tier as the Flutter side). Custom-painted widgets without a wrapping Material widget (charts, bespoke gesture controls) need hand-authored semantics → routed through the Novel-lane approval gate, not assumed generator-deterministic.

Semantic requirements live in the IR/UX contract (§8 `semanticContract`), so they are **validated before the screen is considered complete** — not scanned as a post-generation nicety.

Deterministic A11y validator checks (over the generated semantics tree / DOM):
- every interactive element has an accessible name;
- every control has a valid role; no duplicate/conflicting semantics on a subtree;
- focus order matches visual order; keyboard can reach and activate every control;
- `disabled`/`selected`/`expanded`/`loading`/`error` states are surfaced semantically;
- contrast passes (**alpha-composited**: compute fg-over-bg src-over blend *first*, then WCAG ratio — a hand-rolled luminance check that skips compositing produced a false 2.31 vs true 3.13); touch targets ≥44px; text scales without overflow.

**Invariant (screen-complete gate):** a component is considered generated successfully only when it is **visually correct, behaviorally correct, and semantically correct** — all three are exit criteria, and the A11y validator is part of the build gate (§14.1), not a separate optional audit.

#### 14.4.1.1 Real-world failure-class catalog

These are concrete classes observed in a real production Flutter audit (mall-directory project), mapped to the generation rule that *prevents* them and the validator check that *catches* them. The A11y validator's checklist is defined by this catalog, not by generic "make it accessible" intent:

| Real audit finding | Sev | Generation rule that prevents it | Validator check that catches it |
|---|---|---|---|
| Tappable element, no button role | High | §14.4.1 #1 — role inferred from interaction/purpose | every control has a valid role |
| Tappable chip, no selected state | Medium | §14.4.1 #3 — `selected`/`disabled`/`expanded` states generated | states surfaced semantically on stateful controls |
| Unlabeled icon-only button | High | §14.4.1 #2 — accessible name generated for every interactive element | every interactive element has an accessible name |
| Decorative logo duplicates/unlabeled | Low | §14.4.1 #6 — `mergePolicy: excludeSemantics` for decorative elements | no duplicate/conflicting semantics on a subtree |

Each row is a regression target: a generated screen that reintroduces any of these four classes fails the build gate. This is the concrete form of "accessibility is generated, not audited afterward" — the audit findings become *generator invariants*, not a remediation queue.

#### 14.4.1.2 Prevention guarantees — what the IR MUST declare

Role inference and state/name generation are only *guaranteed* if the IR carries semantic intent, not opaque strings. Six requirements + one accepted limit make the failure classes unconditionally preventable (Claude review: the first two are generalized beyond the original four findings):

1. **Typed action vocabulary** — every interaction is one of `navigate | command | submit | toggle | select | input`, never an opaque `onTap`. The role is *derived* from this type (`navigate`→link, `command`/`submit`→button, `toggle`→checkbox/switch, `select`→chip/radio). Prevents "tappable, no role".
2. **Selection cardinality (v3.1 — closes the single-vs-multi gap)** — `select` actions declare `selectionCardinality: single | multiple`. `single`→`radio`+radiogroup; `multiple`→`checkbox`+multiselect group. Without this, a multi-select chip silently gets `radio` role, which is *wrong* (radio = mutually exclusive). The `selected` binding then supports two shapes: `selected: {field: isSelected}` (per-item boolean) **or** `selected: {derivedFrom: selectionSet, contains: item.id}` (set-membership — the honest shape for multi-select).
3. **Bound state declarations (generalized)** — `semanticContract.states` are *bindings*, not a static list. The rule is **general**: *any* role-implied state must be bound or generation fails — `selected` on a selectable chip, `expanded` on a disclosure/menu-trigger button, `disabled` on a command, `loading`/`error` on an async action. Not just the chip case (otherwise "menu button doesn't announce expanded" becomes the *fifth* audit finding next quarter — the same gap, ungeneralized).
4. **Required accessible name** — `accessibleName` is **required, non-empty** for every interactive element; the schema rejects an interactive element with no name and no `decorative` flag. Prevents "unlabeled icon-only button".
5. **Explicit `decorative` flag (with a hard contradiction rule)** — images/logos default to *meaningful* (require a label); `decorative: true` → `excludeSemantics`. **Hard rule:** `decorative: true` together with a defined `actionType` on the same element is a **validation error** — an excludeSemantics node that is also interactive is *unreachable* (worse than unlabeled). A decorative logo that also navigates home must be modeled as an interactive link *with* a name, not as decorative.
6. **Mandatory fallback for data-bound names** — when `accessibleName.source` is not a static string, `fallback` is a **required** field; a debug-build runtime assertion fires on empty *resolved* names. IR-time validation cannot prove a bound-data name resolves non-empty at runtime — this is an **accepted limit**, stated as such, not implied to be fully closed.

All IR cross-references here (`selected.field`, `derivedFrom`, `contains`, `accessibleName.source`) are **type-validated against the entity/state schema** (e.g. `ent:employee.isSelected` must be boolean), never bare strings — the same derived/validated discipline applied to relations and rule `consumes/affects` (§12.2).

Two production-derived sharpenings of the guarantees above:

- **`Tooltip` is additive, never the sole source of the accessible name.** A `Tooltip` only exposes its label *while visible*, so satisfying guarantee 4 via a `Tooltip` produces an unlabeled element in the static tree. The generator always emits an explicit `Semantics(label: ...)`; a `Tooltip` may layer on top but must never be the only name source. (Real bug: an a11y test asserting a static `label == "Show password"` failed because the name lived only in a conditionally-visible tooltip.)
- **`decorative: true` affects the semantics tree only, not contrast/visual QA.** Decorative is a WCAG 1.1.1 concern; contrast (1.4.3/1.4.11) is a separate concern that must still be checked for *visually load-bearing* decorative graphics (a 72px empty-state icon at 50% alpha that disappears from the a11y tree must not also disappear from contrast QA). The two checks are scoped independently.

The A11y validator enforces all of the above at IR-validation time (shape) and at semantics-tree time (emitted output), so a screen cannot pass without them.

#### 14.4.1.3 Residual gaps (ranked — Claude review, not yet closed)

The four catalog findings are now covered, but the review surfaced the *next* failure classes. Ranked by how soon they bite:

1. **Live-region announcements (highest value, cheapest).** §14.4.2 already generates a submit state machine; nothing wires a transition (`submitting→success/error`) into `SemanticsService.announce` / `aria-live`. The data dependency already exists in the IR — this is consuming a concept we already generate, not inventing one. Silent async success/failure for screen-reader users is a top real-world complaint.
2. **Form-field error linkage.** Field `validation` exists, but error text is not *associated* with the field (`aria-describedby` / Flutter equivalent) — a red string not programmatically linked to a field is invisible to field-by-field navigation (WCAG 4.1.3/3.3.1). Same as #1: binding target exists, linkage generation doesn't.
3. **Focus order is audited, not generated-correct (contradicts the thesis).** No IR-level construct (no `focusOrder`/tab binding tied to layout) — currently caught only by the validator walking the emitted tree, i.e. audit-after-the-fact. Needs a real IR-level fix (derive focus order from layout order deterministically, or an explicit ordering hint) before §14.4.1 is "complete".
4. **Heading hierarchy** — `heading` is in the role vocabulary but level-consistency (no h3 without h2, one h1/screen) is a *screen-level* relation between multiple components, not a per-component shape. Needs a distinct screen-level semantic linter pass.
5. **Color-alone conveyance (WCAG 1.4.1)** — "contrast passes" (a ratio) ≠ "state not conveyed by color alone" (a semantic judgment). Lower priority, harder to automate.
6. Reduced-motion preference; long-description for complex informative images (charts) — low frequency, note only.

Items 1–2 are closeable with schema/linkage additions; items 3–4 need IR or new-linter plumbing; 5–6 are deferred.

#### 14.4.2 UX
```yaml
form:
  fields: [{name: email, required: true, validation: email}]
  submit: { states: [idle, submitting, success, error] }
```
IR → generator emits loading indicator, disabled state, error recovery, success state → UX validator checks:
`required field has validation`, `async submit has loading state`, `error state has recovery message`, `destructive action has confirmation`.

#### 14.4.3 Layout / Responsive (v3.2 — third quality sub-layer)

Distinct from UX (which is about interaction-state correctness): this is about **visual layout not overflowing at real viewports**. Production-derived from an 11-overflow admin sweep:

- **Generator emits overflow-safe layout patterns by default** (named registry patterns in §8, not per-screen judgment): "text adjacent to a fixed-width sibling" → `Flexible` + ellipsis; "selection control with a variable-length label" → `isExpanded: true`; "nav/list in a height-constrained viewport" → `scrollable: true`.
- **Viewport-squeeze overflow validator** — renders each generated screen at a fixed viewport matrix (e.g. 1400×900 / 390×844 / 320×480) and asserts **zero** `FlutterError` overflow events via `FlutterError.onError`. Run **unconditionally across every generated screen** (the 11 real overflows were all on low-attention admin screens — sampling would miss exactly these). Wired to `ScreenModel.responsive`.
- **`ScreenModel.responsive.scaling: proportional|fixed` (v3.3)** — a *semantic* declaration of whether the layout scales proportionally with screen size or uses fixed/breakpoint sizing. The concrete mechanism (`flutter_screenutil` vs `MediaQuery`-based scaling vs alternatives) is a §10 plugin/generation-strategy choice, never a named package in the IR.

### 14.5 Security — policy-driven, runs early (not just secrets)

Security is its own layer with a wider surface than secret literals. Checks:

- secret/API key not committed; secure storage (Keychain/Keystore); token refresh/rotation (§20)
- **route authorization enforced** — `route: { path: /admin/users, requires: { role: admin } }` → validator confirms the guard is emitted
- permission checks present; unsafe input handling; sensitive data not logged; insecure network config; dependency vulnerabilities (curated allowlist, §1.3 of `RESEARCH.md`)

Security checks run **early** (secrets/deps at IR/plan time), not deferred to the end of the pipeline.

### 14.6 Principle — deterministic checks, not LLM reviews

A11y / UX / Security are encoded as **IR contracts + deterministic validators**. The LLM is used only when a rule itself is semantic/ambiguous (then it emits a formal rule, §19) — **never** as "is the UX good? → YES", which would reproduce the LLM-judge problem (§9.4).

---

## 15. Testing Architecture

- **Per-artifact auto tests**: entity eq/hash/immutability, mapper round-trip, DTO serde round-trip, datasource/repo contract (mocked transport), use-case wiring, validator boundaries, state transition table, widget render/interaction, golden (RTL/ar-first), integration.
- **`A11yTestGenerator` (v3.2 — dedicated category)**: emits one `test/a11y/<screen>_a11y_test.dart` per screen, asserting per interactive element the role/SemanticsFlag, non-empty accessible name, and bound states (`selected`/`disabled`/`expanded`). Wired into the screen-complete gate (§14.4.1): a screen is not "generated successfully" unless its a11y test file exists and passes — coverage is a checked invariant, not a once-live property.
- **`DataSourceGenerator` shape-confusion test** (v3.2): per datasource, feed endpoint B's declared shape through endpoint A's parser and assert a typed, loggable `SerializationFailure` (§17), not an untyped crash. Generated for free once envelopes are IR data.
- **Platform-strategy-selection test** (v3.2): asserts *which* concrete strategy resolved per platform target (not just that each works in isolation) — guards the "wrong storage backend linked for web" bug class (§10 secure storage).
- **Rule test oracle** (§9.4): structural coverage from the formal rule; correctness from human examples + invariants. Property-based generation (seeded) over declared invariants catches boundary errors. **Coherence-collapse guard**: every rule edit re-runs *all* prior examples/invariants; any decision-table row with zero coverage is an "unverifiable edit" requiring mandatory human diff review.
- **Golden workflow**: baselines are human-reviewed on first render (not self-certified), pinned to their generation context + fonts; a context change requires re-approval, never auto-acceptance.

---

## 16. RTL & Localization

Arabic-first, locale-agnostic. ICU MessageFormat via `intl`/`.arb` (plurals, gender, context), declared translation source-of-truth, locale-specific digit/number policies, localized validation messages. No hardcoded strings in widgets.

---

## 17. Error Model

`Failure → NetworkFailure | ServerFailure | ValidationFailure | AuthenticationFailure | AuthorizationFailure | CacheFailure | SerializationFailure | UnknownFailure`. Generated consistently and logged via §21.

**Baseline, not contingent (v3.4):** the structural datasource/repository generators (§4.2) emit Failure-mapping + release-sink wiring **unconditionally** as baseline output — never gated behind a human having already written a catch block. This serves both failure modes the cross-project scan found: it replaces swallowed errors in catch-heavy apps *and* injects the full `Failure → recovery → observability` scaffold into the ~half of real projects that currently have zero error handling.

**`SerializationFailure` (added from a real production envelope bug)** carries `{endpoint, expectedShape, actualShape, rawException}` — it exists specifically so a response that doesn't match its declared shape can never collapse into `UnknownFailure` or a generic "something went wrong". The absence of this slot was itself a taxonomy-level version of the swallowing bug it now prevents.

**`Failure.message.kind: literal|l10nKey` (v3.3)** — whether a `Failure`'s user-facing message is a literal string or a localization key (the Rasheed app's convention is exception-message-as-l10n-key, so the UI must `.tr()` it). Element-scoped per Failure type, not a global toggle — same discipline as `accessibleName.source`.

---

## 18. Persistence Decision

First-class IR decision, not a default guess:
```yaml
persistence: { backend: baas|localFirst|remoteApi, sourceOfTruth: ..., syncStrategy: none|cacheThrough|offlineQueue, conflictResolution: ... }
```
The planner validates backend/syncStrategy coherence against the offline pattern and fails on incoherent combinations.

---

## 19. Formal Rule Language

A **closed, typed** language. Three primitives; anything else → extension queue.

- **Expression**: comparison, boolean, arithmetic, temporal (`daysSince(...)`, `before/after`), aggregate (`sum/count/max/min/avg`), enum/status/null checks. **No arbitrary calls, no I/O.**
- **Decision table**: conditions + rows of `when/then`.
- **State machine**: states, events, transitions with guards (`rule:is_manager`) + declared effects (`effect:audit_log`, `effect:notify`) run by a deterministic effect runner.

**Out of scope** (quantifiers over collections, ordering/top-N, cross-feature rules, arbitrary computation, ML) → **human extension queue** (§19.4), a *defined handoff* — never silent fallthrough to Novel. Grammar bumps are additive; coverage per grammar version is a release criterion (§2.4).

---

## 20. Security & Secrets

`SecretsModel` + `SecretsGenerator` + platform secure-storage adapters. Secrets never appear in generated source/committed config; token refresh/rotation are first-class; Keychain/Keystore via plugin adapter; `SecurityValidator` fails the build on any secret literal.

**Detection coverage (v3.4):** the cross-project scan found 64 secret literals across 6/14 real projects, and the dominant committed-secret *shape* is **DSN-style URLs with embedded credentials** (Sentry DSNs), not classic `sk_live_...` API-key strings. The `SecurityValidator` pattern library must explicitly cover DSN/URL-with-credentials, and its test-hardening moves **earlier** (Phase 1) since real-world evidence shows it fires often. No severity tiers — enforcement is already binary build-blocking.

---

## 21. Observability

`ObservabilityModel` + generator + plugin: structured logging, crash reporting (Sentry/Crashlytics), analytics, request/trace-ID propagation, wired into the error model.

**Release-safe by default (v3.2):** the release-mode error path (crash reporting + PII-scrubbed structured logs, §24) is the *mandatory* default; debug-only logging is strictly additive, never the sole source of release error evidence. A validator check requires every `Failure`-producing path to have a non-debug-gated observability call reachable in release mode, and a test asserts each `Failure` type is observable through the release sink in a release-mode harness. This prevents the "HTTP 200 + swallowed error + zero console output" invisibility class.

---

## 22. Async & Concurrency

Deterministic async conventions in every generator: request tokens + cancellation on dispose; single-flight guards (no double-submit); transition discipline forbids invalid event→state edges (kills `setState after dispose` and out-of-order responses structurally). Verified by the state plugin conformance suite.

---

## 23. Multi-environment, Backward Compatibility & Lockfile

- **Env matrix**: ConfigGenerator emits dev/staging/prod + feature flags.
- **Lockfile** pins `{irVersion, plugin+template versions, generatorVersion, sdkConstraint, localeData, fonts}` — the exact `GenerationContext` tuple, so regeneration is reproducible and merge bases are byte-reproducible.
- **Toolchain floor + per-app `pubspec.lock` governance** (S-HERMETIC, closes C12): see `research/FLUTTER_TOOLCHAIN.md` for the declared SDK floor, the L1/L2 determinism-vs-build-reproducibility contract, and the lock-refresh ceremony.
- **Upgrade path**: a major bump triggers an explicit re-run/regen path, never silent breakage.

---

## 24. Data / Privacy Policy (v3 — the PII resolution)

Human example/expected-value pairs are oracle inputs and a leak vector (LLM providers, checked-in IR/goldens, local eval). Four layers, **no LLM judge**:

1. **Typed-field oracle schema** — no business-bearing free text in the corpus. A rule whose behavior depends on free-text content is a red flag that a *structured field is missing* → extract it.
2. **Deterministic PII-detector lower bound** — closed regex/allowlist (national IDs, phones, emails, IBAN, account numbers). Matched → redacted + human attestation.
3. **Synthetic-by-default** — anything reaching an LLM or a checked-in golden must be `synthetic`/`anonymized`; real data only in a local-only eval harness (no LLM in the loop), never persisted/committed.
4. **Corpus as security boundary** — governed by `SecurityValidator` + secrets discipline (§20).

Free text is *structurally excluded* from oracle-relevant input rather than pretended-to-be-detected.

---

## 25. MVP Roadmap

**Phase 0 — Stratified vertical slice.** Draft the 6 schemas the slices touch; walk 4 slices (mechanical CRUD, business-rule decision table, state-machine+temporal, one deliberately-ambiguous rule to test the extension queue). Exit heuristic: **"did we add any *semantic* information to the generated code that wasn't in the IR?"** — if yes, the IR is incomplete. *Not* "any information" (implementation detail is the plugin's job).

**Phase 1 — Deterministic compiler core (no LLM).** Full IR + schemas; all structural generators; **Generation Plan as a first-class artifact**; one plugin per axis (as a strategy family); arch-linter + security-validator + lockfile + determinism regression test; thin region-detection slice.

**Phase 2 — Pattern generation.** Component registry, scoring function, forms, state machines, pagination/caching, persistence selection; a second state-mgmt plugin to prove the coupled-pair matrix.

**Phase 3 — Semantic (LLM).** **3a** = one agent (BusinessRuleAgent) proves the semantic lane; **3b** = remaining agents prove the trust boundary (write-ACL + approval routing + domain-oracle split). **v1 = end of Phase 3.**

**Phase 4 — Novel + hardening (post-v1).** 3-way merge, reverse extraction, full a11y, grammar-growth reconciliation.

---

## 26. Critical Design Rules (recap)

```
LLM       = reasoning / interpretation / ambiguity / business logic
Generator = structure / boilerplate / schema transformation
Template  = known implementation pattern
IR        = single source of truth (semantic, versioned, per-app-per-version)
Plugin    = generation strategy + conformance (NOT an adapter abstraction)
Validator = trust boundary (shape)
Oracle    = correctness boundary (human examples + invariants; NEVER another LLM)
Tests     = proof of behavior
Approval  = gate for low-confidence, disagreement, critical logic, novel code
Discipline: every mechanism must have an executable definition — "policy, not mechanism" is the #1 recurring failure
```

> **Never ask the LLM to generate code when a deterministic generator can — and never trust deterministic code is correct without an independent oracle.**

---

## 27. Review & Grilling Resolution Log

| Source | Verdict | Disposition |
|---|---|---|
| **Griller (subagent)** — 19 findings | — | All resolved in v2 §22 |
| **Reviewer (subagent)** | APPROVE WITH CHANGES (5 issues) | Oracle independence, Novel-lane mechanism, `affects` derivation, rule-language sketch, 3-way merge base — all resolved in v3 |
| **Claude Code grilling** — 6 mechanisms | converged | Folded in: §9.3 ACL, §9.2 origin split, §9.5 approval 2×2, §10 generation strategies, §2.4 grammar growth, §10.3 golden re-review |
| **Benchmark (tier-one)** | component-level independent evidence | Folded into §0/§10/§11 (regen-safety is the key differentiator; LLM-judge = triage) |
| **ChatGPT (3 rounds)** | corroboration + 2 deltas | Folded in: Generation Plan artifact (§6.1), Phase 3a/3b (§25), benchmark wording, Phase-0 heuristic (§25), correctness taxonomy (§14.1) |
| **PII open thread** | was OPEN | Resolved in §24 (typed-field oracle + deterministic detector + synthetic-by-default + secrets discipline) |
| **Rasheed gap audit (deepseek-v4-flash)** | 20 proposals | Validated by grilling + Claude: 9 keep, 6 refine, 5 reject/move. Folded into v3.3 as §2.1.1 + §10.1/10.2 + §17 + §14.4.3. See `RASHEED_AUDIT_OUTPUT.md`. |
| **Cross-project scan (13 projects, deepseek-v4-flash-free)** | 6 new (N1-N6) + confirmations | Validated by Claude: none/vanilla strategy (§10/§5.2), stateComplexity selector (§5.2), baseline error-emission (§17), single-AppModel non-goal (§2.3), advisory-vs-blocking gating (§14.1), DSN-pattern coverage (§20). Folded into v3.4. See `CROSS_PROJECT_FINDINGS.md`. |
