# SWIFTUI_GROUND_TRUTH.md — read-only evidence bundle for the SwiftUI target requirements

> Status: **EVIDENCE READY**
> Builder source modified: NO / Flutter generators modified: NO / Existing files deleted: NO / Commit created: NO
> Date: 2026-08-16. Repo: `/Users/username/Documents/cto/flutter_generator` (branch `master`, ahead of origin by 97 commits).
> Purpose: ground-truth for the writer of `SWIFTUI_REQUIREMENTS.md` (see `TASK_SWIFTUI_REQUIREMENTS.md`). Every fact below is verbatim command output or a `file:line` citation; nothing is invented or guessed.

---

## 1. Tooling ground truth (verified on this Mac)

Commands run verbatim from repo root. This is the environment a generated SwiftUI app must build/test in.

### 1.1 Xcode

```
$ xcodebuild -version
Xcode 26.3
Build version 17C529

$ xcode-select -p
/Applications/Xcode.app/Contents/Developer

$ xcrun --find swift
/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/swift

$ xcrun --find xcodebuild
/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild

$ xcrun --find simctl
/Applications/Xcode.app/Contents/Developer/usr/bin/simctl
```

### 1.2 Swift toolchain

```
$ swift --version
Apple Swift version 6.2.4 (swift-driver 1.127.15 Apple Swift version 6.2.4)
Target: arm64-apple-macosx15.0
```

### 1.3 SDKs available

```
$ xcodebuild -showsdks
DriverKit:        macOS 26.2 (driverkit26.2)        - SDK version 26.2
iOS:              iOS 26.2 (iphoneos26.2)          - SDK version 26.2
iOS Simulator:    iOS Simulator 26.2 (iphonesimulator26.2) - SDK version 26.2
macOS:            macOS 26.2 (macosx26.2)          - SDK version 26.2
                  macOS 26.2 (macos26.2)           - SDK version 26.2
tvOS:             tvOS 26.2 (tvos26.2)             - SDK version 26.2
tvOS Simulator:   tvOS Simulator 26.2 (tvossimulator26.2) - SDK version 26.2
visionOS:         visionOS 26.2 (xros26.2)         - SDK version 26.2
visionOS Simulator: visionOS 26.2 (xrsimulator26.2) - SDK version 26.2
watchOS:          watchOS 26.2 (watchos26.2)       - SDK version 26.2
watchOS Simulator: watchOS 26.2 (watchsimulator26.2) - SDK version 26.2
```

### 1.4 Simulators (verification target)

```
$ xcrun simctl list devices available | head -20
== Devices ==
-- iOS 18.2 --
    iPhone 16 Pro (E9B0DCA0-BA87-4819-BF17-CE0CF10050B0) (Shutdown) 
    iPhone 16 Pro Max (B7B4AEC5-594C-4CB9-8582-38FFD4C69928) (Shutdown) 
    iPhone 16 (2D6FA51F-1EE2-4626-B23C-EBEC00AE844F) (Shutdown) 
    iPhone 16 Plus (2785A591-976E-4675-A193-B2B0159B9C8A) (Shutdown) 
    iPhone SE (3rd generation) (6CEA9100-F3DB-4D20-B2C8-D14F49679F19) (Shutdown) 
    iPad Pro 11-inch (M4) (7B69A8DA-5AC1-4A47-AA3E-027866413CF2) (Shutdown) 
    iPad Pro 13-inch (M4) (C61697DA-FBB3-46BD-B29B-C3F369C4220C) (Shutdown) 
    iPad Air 11-inch (M2) (F54F7234-60AF-40D6-BAA8-7F8F64A399A7) (Shutdown) 
    iPad Air 13-inch (M2) (7DAEF29F-3E2D-44B7-B29D-0C2BBAA50BC6) (Shutdown) 
    iPad mini (A17 Pro) (A5542435-8ADB-4C78-B4D9-C22E10628927) (Shutdown) 
    iPad (10th generation) (A1917C1B-9F9B-4C53-94EF-A90196D3A597) (Shutdown) 
-- iOS 26.0 --
    iPhone 17 Pro (CE624581-1C24-4D39-A87C-12FDE9481637) (Shutdown) 
    iPhone 17 Pro Max (BB0235BA-827B-4A7C-868D-174857292760) (Shutdown) 
    iPhone Air (0DB896BF-9F43-43D6-B5A9-F121ABD3B754) (Shutdown) 
    iPhone 17 (3C74FCDE-F620-462E-9484-EBAF7BA40C7B) (Shutdown) 
    iPhone 16e (C4D535D7-D61C-4770-A618-012B95882734) (Shutdown) 
    iPad Pro 13-inch (M5) (27AF7FEF-A4DE-4B69-99C1-60371CF27CDA) (Shutdown) 
```

Total: **33 available devices** across runtimes iOS 18.2 and iOS 26.0. Anchor devices for the
390×844 golden convention (see §12): **iPhone 16 Pro (iOS 18.2)** and **iPhone 17 Pro (iOS 26.0)**.

### 1.5 Flutter (existing pipeline baseline)

```
$ flutter --version
Flutter 3.44.3 • channel stable • https://github.com/flutter/flutter.git
Tools • Dart 3.12.2 • DevTools 2.57.0
```

### 1.6 Implication for the requirements doc

- Verification gate for a generated SwiftUI app = `xcodebuild` (simulator SDK `iphonesimulator26.2`) + `swift build`/`swift test` (Swift 6.2.4), e.g. `xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 17 Pro'` or a bare `swift build`/`swift test` on an SPM package (see §18 output-shape recommendation).
- macOS-only constraint is NOT a concern: full Xcode 26.3, arm64 host, macOS 15.0 host target, all simulators present.
- `xcrun` resolves inside Xcode's dev dir (`xcode-select -p`), so `builder/src/pipeline.ts`'s node child-process pattern can invoke `xcodebuild` the same way it invokes `flutter` (timeouts: 300000 default, 120000 pub-get/analyze — `pipeline.ts:runFlutter`).
<!--MORE-->
---

## 2. Repository shape (what the SwiftUI target must coexist with)

### 2.1 Layout

```
flutter_generator/
  builder/src/            # the deterministic compiler (active work area)
    index.ts              # composition root / I/O (995 lines)
    generators/           # 36 generator modules (§3, §5)
    schemas/              # 15 per-model JSON schemas (datasource, entity, enum, form, model,
                          #   query, repository, repository_impl, rule, screen, state,
                          #   state_machine, usecase, valueobject, wrapper — *.schema.json)
  builder/samples/        # legacy demo IRs + rules/ oracle corpus (see §14)
  apps/<app>/
    input/<app>.ir.json   # per-app IR (source of truth)
    input/rules/          # per-app rule oracles
    output/app/           # generated Flutter project (disposable — always regenerate)
    output/goldens/ cdp/ rca/ validation.txt README.md
  design/flutter-app-builder/
    DESIGN.md             # authoritative design (v3.5, 724 lines)
    ROADMAP.md            # P1–P14 + standing loop (474 lines)
    research/             # option/evidence docs (see §16)
    HANDOFF.md PHASE_PLAN.md GRILLING.md CODE_CATALOGUE.md CAPABILITIES.md LEFTOVER_NOTES.md
  lib/ test/              # "payment pilot" Flutter app (Rasheed) — separate, working
  tools/                  # legacy v1 pipeline scripts
  package.json            # fahs-specs (root node package — the builder's harness)
```

### 2.2 Root package.json scripts (verbatim)

| script | command |
|---|---|
| `typecheck:builder` | `npx tsc -p builder/tsconfig.json --noEmit` |
| `validate` / `validate:gen` | `npx ts-node --transpile-only builder/src/validate.ts` |
| `pipeline` | `npx ts-node --transpile-only builder/src/pipeline.ts` |
| `generate:router` | `npx ts-node --transpile-only builder/src/generators/route.ts` |
| `generate:screens` / `generate:screen` / `generate:pipeline` | `npx ts-node --transpile-only builder/src/generators/screen.ts [--name/--pipeline]` |
| `import:prototype` / `generate:from-html` | tools/import_prototype_html.ts / screen.ts --from-html |
| `verify:generated` | `npx ts-node --transpile-only tools/verify_generated.ts` |
| `guard:architecture` | `npx ts-node --transpile-only tools/check_architecture.ts` |
| `golden:*` / `compare:*` | golden capture + comparison helpers |

`builder/package.json` does NOT exist (no separate TS package; tsconfig at `builder/tsconfig.json`). `typecheck:builder` is the strict TS gate the requirements writer must keep green after touching `builder/src` (schema validator + `index.ts` dispatch only, §9).

---

## 3. Generator architecture (how a second target slots in)

### 3.1 The registry — `builder/src/index.ts:66-81`

Dispatch is an IR-key → generator map; each entry is `{ irKey, schema, layer, generator, class, generate: (item,ctx)=>string, file: (item)=>string, label }` (`index.ts:55-64`). 14 entries: enums, valueObjects, queries, wrappers, entities, repositories, useCases, datasources, repositoryImpls (all `structural`, `domain/…`+`data/…`); states, screens, stateMachines, forms (`pattern`, `presentation/…`); businessRules (`semantic`, `domain/rules`). Each maps `irKey → schema file` — a SwiftUI target either (a) selects a second skill registry behind a `plugins.platform`/`attributes.platform` knob, or (b) registers new generator modules under the same IR keys emitting Swift. The gap: today the target (Flutter/Dart) is implicit in every template — there is **no platform abstraction** (see §17).

### 3.2 `writeCore` — shared non-feature files — `index.ts:112-179`

Always: `di.dart, router.dart, components.dart, app_strings.dart, theme.dart, config.dart, secrets.dart, observability.dart, validator.dart`. Capability-conditional: `no_params.dart`, `money.dart`, `policy.dart`, `split.dart`, `attachment.dart`, `budget.dart`, `export.dart`, `audit.dart`+`audit_log_screen.dart`, `session.dart`+`auth_login_screen.dart`, `outbox.dart`. Each predicate is a **resolved** check (e.g. budget only when the entity + 3 Money fields resolve — never a bare declaration flag; see §8 `operations.ts`). SwiftUI needs an analogous "core" set; the `operations.ts` predicates are target-agnostic and reusable.

### 3.3 Generation plan — `plan.ts` (95) + `index.ts:main()`

`PlanEntry { irKey, fileName, generator, layer, provenance }`, `GenerationPlan`, `TAG_BY_KEY`, `tagForIrKey`. `main()`: CLI `<ir> <out>`; **defaults: IR `builder/samples/expense.semantic.ir.json`, outDir `builder/output/generated_app`**; requires a `schemaVersion` string. Returns `GenerateResult { outDir, fileCount, scoring, conflicts }` (`index.ts:83-88`). `bundleFonts()` (`index.ts:99-108`) copies `builder/templates/fonts/*.ttf|otf` → `<out>/assets/fonts` so goldens render real glyphs.

### 3.4 Purity contract — DESIGN §6.3

`GenerationContext = { irVersion, fragment, templateVersion, pluginVersion, generatorVersion, sdkConstraint, localeDataVersion, fontVersion }`; two runs with identical context produce **byte-identical** output (determinism regression). A SwiftUI target keeps the same `(IR, ctx) → string` shape — it must add `targetVersion` to the context (a context change = golden re-approval, DESIGN §10.3/§15).

---

## 4. IR surface (what a SwiftUI target consumes)

### 4.1 IR top-level shape — DESIGN §2.1

```yaml
schemaVersion: "1"          # REQUIRED — monotonic, §2.4
project: {name, package, targetFramework, sdkConstraint, defaults}
features, entities, valueObjects, relations,
repositories, useCases, businessRules, datasources,
persistence, models, mappers, screens, components,
stateMachines, navigation, forms, permissions,
localization, theme, secrets, observability,
catalogs, queries,          # v3.3 static reference data + query/filter models
plugins: {stateManagement, routing, di, http, localDb, serialization, secureStorage}
di: DependencyGraphModel
externalCode: ExternalCodeNode[]
tests: TestCaseModel[]
```

IR rules (DESIGN §2.3): semantic not implementation (what, not how); the diff unit; the LLM's only write target (except gated Novel lane → `externalCode`); versioned with full JSON Schema before its generator exists; per-app/per-pinned grammar; v1 unit = one ApplicationModel (multi-app/mono-repo shared fragments out of scope).

### 4.2 Runtime IR model — `builder/src/types.ts` (360 lines)

- `Field` (`types.ts:29-60` area): `{ name, type, of?, enumValues?, required?, nullable?, default?, semanticType?, currency?, secret? }`. `semanticType:"Money"` + `currency` (ISO 4217) = money (`operations.ts:107`); `secret` = L3 export exclusion.
- `PrimitiveType` = `String | int | double | bool | DateTime | enum` (+ reference/List shapes).
- `AppAttributes` (`types.ts:140-167`): `refreshCadence, density, responsiveness, offlinePolicy, permissionScope, stateManagement?, persistence?, auth? (AuthModel), attachments?, budget? (BudgetModel), locale? ("en"|"ar"|"both"), outbox?`. **No `platform`/`targets` key exists today** (verified by grep — §17). This is the natural home for the new knob.
- `OperationModel { name, returns, params: OperationParam[] }` (`types.ts:184-188`) — faithful arbitrary signature (positional/named, required/default).
- `ScreenModel` (`types.ts:239-252`): `{ name, entity, type: "list"|"detail"|"wizard"|… (open set, composition.ts), state, hero?, steps?: WizardStep[], export?: "csv"|"json"|"csv+json" }`; `export` requires a real `bool` field named `exported` (`[export]` gate).
- `WizardStep` (`types.ts:274-281`): `{ id, title, field?, fields?, validate?(RuleModel), when?(WizardCondition | RuleModel) }`; `WizardCondition { field, op: ">="|"<"|"==", value }` (`257-261`).
- `RuleOperator` (`types.ts:309-311`): `>=, <=, >, <, ==, !=, contains, daysSince>, daysSince<`.
- `PolicySeverity` (`types.ts:317`): `autoApprove | warn | requireJustification | block` (L2; flat rules only, via `severity`).
- `StateManagementProvider` = `none|bloc|riverpod`; `PersistenceKind` = `none|sql|nosql`; `OperationKind` = `list|get|create|update|delete` (`169-173`).
- `AuthModel` (MF2): roles + personas + homes (role → default screen) — session/tenant semantics §10.3.

### 4.3 IR versioning — DESIGN §2.4

`schemaVersion` mandatory + monotonic with an explicit migration table. The SwiftUI knob lands as an additive optional attribute (absent → today's output byte-identical), so no migration push.

---

## 5. The state/screen generators a SwiftUI target must reproduce semantically

### 5.1 `builder/src/generators/state.ts` (533 lines)

- `DEFAULT_STATUSES` (initial, loading, success, failure) + `builtinFields`.
- **Wizard (P8)**: flow status is namespaced as `wizardStatus` (`state.ts:281,289,298`) — type-based, so a wizard step may bind the entity's own `status` field without duplicate-definition analyzer errors (B1 fix, commit 0385e5d). Wizard state = `wizardStatus` enum + `currentStep` int + per-step setters + `next()/back()/jumpTo()/canAdvance` + `_draft`.
- `needsDraft` (`state.ts:320-330`): any step has `validate` or a string `when`. `finish()` (`state.ts:451,454`) sets `wizardStatus: success`.
- Filter/query wiring via `queryArgLiteral`.

### 5.2 `builder/src/generators/screen.ts` (730 lines)

- Field roles: `TITLE_PRIORITY = ["name","title","merchant","label","subject"]` (`screen.ts:15`); `SUBTITLE_TYPES = ["double","int","DateTime","enum"]` (`16`). (The full `fieldRole`/"relation" inference lives in `operations.ts:165-181` — UIX Slice C; screen.ts uses the lightweight list.)
- `fieldValue(field, item)` (`screen.ts:19`) — the field-aware accessor reused by list rows, detail blocks, and CSV/JSON export (`606-629`).
- Composition binding `compositionFor(s.type)` (`186`); `AppListCard`/`AppAvatar` from components.ts, never raw `Card`/`ListTile`/`CircleAvatar` (DESIGN §8 registry).
- List→detail route source-of-truth `screenPath()` (routing.ts); detail `final id = GoRouterState.of(context).pathParameters['id']` (`601`); parent→child nav `context.push('/<child>?<fkField>=$id')` (`350`); create/edit `context.push('/<child>/new')` (`660`).
- Wizard success check `if (state.wizardStatus == ${statusEnum}.success)` (`434,437`). Failure: `if (state.status == ${statusEnum}.failure) return ErrorState(message: …)` (`592`).
- Export action (L3): computes CSV/JSON of currently-listed rows via `fieldValue`, stamps `exported: true` through existing `update()`, guards already-exported rows (`614-629`).
- A11y topology (DESIGN §7): interactive templates emit `Semantics` as the outermost node with `GestureDetector`/`InkWell` nested inside — a SwiftUI target needs the same guarantee (SwiftUI's built-in controls do this for free).

### 5.3 `builder/src/generators/crud_form.ts` (form emitter)

- Editable fields = primitive types only (`String,int,double,bool,DateTime,enum`), identity excluded — shared with test.ts via `crudEditableFields` (`operations.ts:121-134`).
- Money → decimal text → minor units on submit; bool → Checkbox; enum → Dropdown; DateTime → G2 `readOnly` + `showDatePicker` on tap.
- RCA-005 focus bypass: first real keyboard-invoking TextField carries a gesture-bound `requestFocus()` (`firstFocusBypassField`, `operations.ts:142-145`).

---

## 6. Routing — what a SwiftUI `NavigationStack` must replace

### 6.1 `builder/src/routing.ts` (37 lines)

`screenPath()` is the single source of truth for a screen's route — the router and every screen onTap consume it (SOLID #1; fixed an onTap/router drift bug). Scheme: list → `/<kebab(entity)>`; detail → `/<kebab(entity)>/:id`; wizard → `/<kebab(entity)>/wizard`; collisions disambiguated `-<kebab(name)>`.

### 6.2 `builder/src/generators/route.ts` (136 lines)

- `routing:"none"` → no router (vanilla; `none` is a first-class strategy, DESIGN §10).
- MF2 auth variant: `/login` + `guardPath()` + `kHomeRoutes`/`kAllowedRoutes`; `auth.home` is the source of truth for the post-login landing.
- GoRouter `pathParameters['id']` and `uri.queryParameters['<fk>']` are the param-passing idioms screen.ts emits.

SwiftUI mapping note: `GoRouter` path table → `NavigationStack` + typed route values ("hashable path" pattern, iOS 17); guarded routes → a root-level `if` on the session before the stack; `context.push('/<child>?fk=id')` (parent→child) → value-based `navigationDestination`; `context.go` vs `push` back-stack semantics must be preserved for the G3 back-affordance lesson (§13). `screenPath()` stays the single truth; a Swift target needs its own path→value mapping (or one shared route table in the IR).

---

## 7. State management + DI + scoring (the coupled-pair matrix)

### 7.1 `builder/src/scoring.ts` (173 lines)

- `StateStrategy = "none" | "enum-status" | "sealed-events"`.
- `ScoringInputs`: collectionCardinality, filterAxes, refreshCadence, density, responsiveness, offlinePolicy, permissionScope, stateComplexity, hasRelationships, documentShaped, fullCrudSurface (`scoring.ts:11-26`). Ordinal maps: REFRESH (static→0 … realtime→3), DENSITY, RESPONSIVENESS, OFFLINE (none→0, cache→1, offline-first→2), PERMISSION (none→0 … sensitive→2).
- Complexity = cardinality + filterAxes + 2·refresh + density + responsiveness + 2·offline + 2·permission + stateComplexity (`131-139`); < `NONE_FLOOR` → `none`/vanilla (`141-149`).
- `scorePersistence` (`90-106`): SQL score from offline/relationships/filterAxes/fullCrudSurface; NoSQL from cache/documentShaped; `none` otherwise. Explicit `attributes.persistence` wins.
- `scoreApp` (`108+`): explicit `attributes.stateManagement` override wins (human-pinned, enterprise); else derived; DI riverpod→provider_scope / bloc→get_it; routing derived 1:1 from stateManagement.
- Registry `provider.ts` (26): PROVIDERS `none|bloc|riverpod`, each `stateTemplate` (state_none.v1 / state_enum_status.v1 / state_notifier.v1) + di (get_it|provider_scope|none).

### 7.2 `builder/src/arch.ts` (64) — coupled-pair guard (DESIGN §10.2)

Only state-mgmt × DI, state-mgmt × persistence, routing × guards are coupled (small matrices); everything else orthogonal because Clean Architecture isolates axes behind interfaces. Guard errors on an unsupported pair (`riverpod × get_it` fails). `routing` deliberately NOT in the guard (derived — SOLID #7 note).

### 7.3 SwiftUI mapping note (recommendation for §4 of the brief)

SwiftUI's native answers remove the whole axis: `@Observable`/`@State` (no bloc/riverpod container), environment injection (covers get_it), `NavigationStack` (covers go_router). Recommend **`@Observable` (iOS 17+)**, NOT TCA — idiomatic-minimal, matches `none`-strategy vanilla and the `enum-status` state shape (plain Swift enum + `@Observable` struct). The `sealed-events` exhaustiveness win is preserved by Swift's `switch` over an enum.

---

## 8. `builder/src/operations.ts` (518) — shared capability helpers (target-agnostic)

Pure IR-derived predicates the SwiftUI target reuses verbatim, no edits:

- `crudFormTargets(ir)` (`73-85`): entity gets a form screen iff its repo declares create AND update; keyed by entity name so symbols/index/route/screen agree (SOLID: one answer, no drift).
- `findWizardScreen(ir, stateName)` (`91-93`) + `stepFields(st)` (`99-101`).
- `isMoneyField` (`107`); `hasMoneyFields` (`113-115`).
- `crudEditableFields` / `firstCrudTextField` / `firstFocusBypassField` (`121-145`).
- `fieldRole(field, ctx)` (`152-181`): title/description/identifier/date/status/priority/money/relation/plain in fixed priority; FK requires the target entity to actually exist in the IR (else "plain" — no silent mis-render).
- `isPolicyRule` / `hasPolicyRules` / `policyRulesForEntity` / `policyEntities` (`190-206`) — L2 verdict engine (§11).
- `splitGroupFor(parent, ir)` (`217-237`): MF4 — child with `<Parent>Id` FK + `percent: double` is the parent's split line; one group per parent.
- `listEntityName` / `findRepoForEntity` / `classifyOperation` (lines ~23-58): an operation is `list`/`get`/`create`/… only when BOTH name prefix and return/param shape match (conservative — fixed the `createTask`-mis-picked-as-`get` bug).

---

## 9. Rule language (§19) + oracle — the correctness core

### 9.1 Dart rule emitter — `builder/src/generators/rule.ts`

`generateRule` → Dart bool function: Money compared via `minorUnits` (×100) directly (`conditionExpr`); enum comparisons use the qualified enum binding; operators per §4.2. Decision tables (`rows`) emit a fall-through chain with `result` as default outcome; flat rules with `severity` emit a `RuleVerdict` (policy engine). The closed §19 language: Expression / Decision table / State machine primitives; **no arbitrary calls, no I/O**; out-of-scope → human extension queue (quantifiers, ordering/top-N, cross-feature, arbitrary computation, ML).

### 9.2 Oracle system — `builder/src/oracle.ts` (51)

`oracleDirFor(irPath)` = `dirname(irPath)+"/rules"`; `loadOracle(rule, dir)` → `<rule>.oracle.json`; `oracleCoverage(ir, dir)` → `{ missing[], empty[] }`. **Gate (`[oracle]`)**: a business rule with no oracle or a zero-case oracle fails validation — blocking. DESIGN §9.4: correctness = human-attested examples + invariants (the actual oracle), never another LLM; second-party ReviewAgent is triage only (`secondParty < 0.75` or disagreement or critical → approval queue). §9.5 approval routing (Tier R batchable vs Tier I blocking) reads blast radius off the AST-derived `consumes/affects` graph.

### 9.3 Validation pipeline — `builder/src/validate.ts` (545)

`walk()` collects generated `.dart`; `archCheck` enforces layer purity (domain must not import flutter/dio/sqflite/data/presentation/flutter_bloc/get_it); oracle gate; determinism (single-generation diff, 80s→32s); secrets; idioms; money (`[money]`: double-typed money is a defect); `[export]`, `[split]`, `[verdict]`, `[budget]` gates. SwiftUI must keep the same *kind* of gates (content-hash regions, oracle, arch purity, determism) and add an SF/Swift arch check.

### 9.4 The hard problem — RuleModel portability (recommendation for §4 of the brief)

- **Option A — portable evaluator over JSON-serialized RuleModel** (one `eval(rule, entityJson)` in the generated app, Swift Codable structs mirroring `RuleModel`). Pros: single implementation, achievable byte-for-byte oracle parity, matches the P9-B6 precedent (ROADMAP.md:113-116 — cross-language rule-eval parity gate, blocking, golden). Cons: interpreter indirection.
- **Option B — emit Swift expressions** (mirror `rule.ts`). Pros: idiomatic, fast. Cons: **dual implementation** — exactly the divergence the oracle gate exists to prevent.

**Recommend A** (portable evaluator), justified by P9-B6; verification = run the Dart oracle corpus verdicts against the Swift evaluator as a blocking parity test (same posture as `[oracle]`).

---

## 10. Persistence, l10n/RTL, auth, budget, outbox — the capability stack

### 10.1 Persistence — `builder/src/persistence.ts` (30) + DESIGN §18

Registry: PERSISTENCE `none | sql (drift ^2.34.3) | nosql (hive_ce ^2.19.2)` with template markers. DESIGN §18: `persistence: { backend: baas|localFirst|remoteApi, sourceOfTruth, syncStrategy: none|cacheThrough|offlineQueue, conflictResolution }`; planner fails on incoherent backend/syncStrategy combos. `builder/context.ts` (40) `buildLockfile()` pins: bloc ^8.1.6, get_it ^8.0.1, go_router ^17.1.0, dio ^5.8.0+1, serialization manual, flutter_secure_storage ^9.2.4, intl 0.19.0, tajawal 1, sdk >=3.0.0. Decision locked in `research/PERSISTENCE_ARCH.md` (+ `persistence_benchmark.json`).

**SwiftUI mapping note (recommend for §4):** `sql` → **SwiftData** (iOS 17+, natural @Model + `@Observable` pairing) or GRDB (more control/cross-platform, SQLite-backed); `nosql`/hive_ce KV → `@AppStorage`/UserDefaults or a small KV store; `none`/in-memory → plain Swift arrays (repo impl with `_items`). Keep the S1/outbox async-sync model.

### 10.2 l10n/RTL — DESIGN §16 + IR `attributes.locale`

`locale: "en" | "ar" | "both"` (`types.ts:163`); "both" boots EN with Arabic as opt-in RTL; additive (absent → today's flat single-locale `AppStrings`, byte-identical). Design: Arabic-first, ICU MessageFormat via intl/.arb, locale-specific digit/number policies, no hardcoded strings in widgets. SwiftUI goldens don't exist (no matchesGoldenFile on iOS) — the golden-equivalent for l10n/RTL is a snapshot test of the generated `.xcstrings`/`.strings` + a Directionality/layout test.

**SwiftUI mapping note (recommend for §4):** String Catalogs (`.xcstrings`, Xcode 15+) with `Localizable.strings` fallback; leading-edge RTL via `layoutDirection`/`.environment(\.layoutDirection)` (mirror of MaterialApp `titleDirectionality: RTL`); tie to the existing ledgerly `l10n_test.dart` pattern (G-L4-2 leftover proves the directionality edge).

### 10.3 Auth/roles/tenant (MF2)

`attributes.auth: AuthModel` — additive; absent = no auth. `session.dart` (Persona + Session + `kPersonas`) + `auth_login_screen.dart` (persona-picker) are app-level, emitted once (`index.ts:158-165`). Repos filter by `/stamp` `tenantId`; create/update/delete stamp actor. Routes guarded via `guardPath()`. Enforced in repository_impl (tenant scoping) — a SwiftUI target must reproduce this in the same layer position (a repository/protocol, not a view concern).

### 10.4 Money (L1), verdicts (L2), split (MF4), attachments (MF3), budget (MF5), export (L3), outbox (MF6)

Capability-conditional core emitted per predicate (§3.2). Money carries `minorUnits` + `currency` structurally (never `double`) — the `[money]` gate treats a raw double as a defect. Budget (VisaQuota limit/committed/actual with scope+period) only emits when fields actually resolve as Money (`resolveBudget`). Outbox write-ahead on repo create/update/delete + sync queue with retry/backoff. All of these are generator concerns; the **IR semantics** (fields, rules, screens) are target-agnostic.

---

## 11. Rule-vs-entity reachability + wizard reachability (what must still hold)

- Rule reachability: `policyRulesForEntity(ir, entity)` = rules where `rule.entity === entity && isPolicyRule`; only combinable with fields that exist (`[verdict]` gate cross-checks rule conditions against entity fields; a rule referencing a nonexistent field fails validation).
- Wizard reachability: `findWizardScreen(ir, stateName)` + `stepFields`; `needsDraft` iff any step `validate` or string `when`; `canAdvance` = required-filled (default) or RuleModel-validated; `when` = inline `WizardCondition` (field/op/value) or a RuleModel name; a step whose `when` doesn't hold is skipped (never a dead end). `WizardStep.validate` names a RuleModel evaluated against the in-progress draft entity.
- Demo seeding: `sampling.ts` (98, full) — `voBaseType`, `entityByName`, `sampleArgFor` — primary title field → `Sample Task`/`Sample Task 1`, identity → `task-1` (kebab+index); Money args use minorUnits. A SwiftUI target reuses `sampling.ts` untouched (it's pure string/json; no Dart emission).

---

## 12. Generated-code ownership, tests, goldens (what can't be reused verbatim)

### 12.1 Ownership — DESIGN §11 + `region.ts` (52)

Generated files carry `// [generated] generator=… ownership=generated`; user regions preserved by **content-hash** (`regions.json`), never by header comments, never silent-overwrite. Write path is ACL-gated (`index.ts` — I/O confined there; `acl.ts` 29). SwiftUI files carry the same header + content-hash regions; the `[generated]` contract is target-agnostic.

### 12.2 Tests + goldens — `builder/src/generators/test.ts` + DESIGN §15

Per-artifact tests (entity eq/hash, mapper round-trip, DTO serde, repo contract, usecase wiring, state transitions, widget render, goldens), plus `A11yTestGenerator` (one a11y test per screen, wired into the screen-complete gate), datasource shape-confusion test (typed `SerializationFailure`), platform-strategy-selection test, rule-oracle tests, golden workflow (human-reviewed baselines, pinned to context + fonts). Generated test.ts uses `tester.view.physicalSize = const Size(390, 844)` (`test.ts:163,191,298,605,647`) and loads Roboto via `FontLoader` + `buildTheme()` so goldens render real glyphs — **never bare MaterialApp (Ahem boxes)**. Goldens live in generated `test/goldens/`.

**SwiftUI note:** matchesGoldenFile has no iOS analog. Recommend the leanest credible check the brief asks for: `swift build`/`xcodebuild` + **XCTest** (KIF/XCTest-driven UI checks or unit tests over the rule evaluator + formatters) with **no goldens**; keep `[oracle]` mandatory. Snapshot of generated `.xcstrings` as a cheap l10n gate.

---

## 13. Proven QA/RCA evidence (bugs the Swift target must not regress)

`apps/tasks/output/qa/PROBE_FINDINGS.md` (CDP probe, semantics-activated): G1 demo-seed junk (FIXED via sampling.ts) → after: `Sample Task 2024-01-01 · low`; G2 DateTime = plain text, no picker (OPEN — crud_form.ts + screen.ts wizard `TextFormField hintText 'YYYY-MM-DD'`); G3 detail screens have NO back affordance (OPEN — screen.ts AppBar + routing `context.go` vs push); G4 overflow/garbled rows across 320/390/768/1280 (fixed, iterative scroll fixes); G5 web/ regeneration drops `web/` (documented regen step, AGENTS.md). RCAs: `apps/tasks/output/rca/RCA-001-enum-rule.md`, `RCA-003-multi-cubit-main.md`, `RCA-005-create-form-keyboard.md` (focus bypass), `RCA-006-list-scroll-investigation.md`. CDP driver infra (mall-session pattern) + overflow scanner in `tools/overflow/`. Flow-harness goldens: `gen_all_flows_harness.py` + `capture_all_flows.sh` (one screen per invocation to avoid router-state contamination). Open leftovers in `LEFTOVER_NOTES.md` (e.g. G-L4-2 login-screen l10n + RTL directionality).

---

## 14. IR inventory (what "same IR" must keep working)

Committed, validated apps (all `schemaVersion:"1"`):
- `apps/tasks/input/tasks.ir.json` (352) — Task + FollowUp, enums TaskStatus/Priority, rules incl. HighPriority; oracle `apps/tasks/input/rules/HighPriority.oracle.json` (4 cases).
- `apps/ledgerly/input/ledgerly.ir.json` — **multi-feature** IR (`features:` array with 4 features; top-level entities/screens empty; no top-level businessRules; no `input/rules/` dir).
- `apps/work_auth/input/work_auth.ir.json` — bloc + **budget** (VisaQuota limit/committed/actual, scope country, period yearly); rules [NeedsManagerReview → WorkAuth]; oracle present.
- `apps/hr_service/input/hr_service.ir.json` — bloc + locale "both" + outbox + auth (employee/hr_admin, home LeaveRequest); rules [LongLeave → LeaveRequest]; oracle present.
- Generator samples: `builder/samples/{expense.ir.json, expense.semantic.ir.json, inventory.ir.json, ledgerly.ir.json, moneycrud.ir.json, promo.ir.json, rasheed.ir.json, reimbursement.ir.json, todo.ir.json, todo.riverpod.ir.json, wizard.ir.json}` (+ `rules/` corpus). `wizard.ir.json` (onboarding/Signup + EmailValid rule + steps name/email/review) is the P8 reference IR the requirements doc should point at.

The brief names `apps/tasks/input/tasks.ir.json` as the target demo IR — it exercises entities+enums+FK(parent→child)+rules+forms, i.e. the full list/detail/form/wizard/rule surface a SwiftUI target must cover first.

---

## 15. ROADMAP context — where a Swift target sits

ROADMAP.md head "Where we are (2026-08-16)": Phase 1 ✅, Phase 2 ✅, Phase 3a ✅, Phase 3b ✅, P1 ✅, P2 ✅ (CFT: generated app builds to web, serves, drives in Chrome-for-Testing, `passed:true`); 🚧 SOLID review fixes in progress. External review folded: P10–P13 (EXTERNAL_REVIEW), P10.5 (EXTERNAL_REVIEW_2, accepted) — capability registry + dependency graph, plugin contracts, UX engine, payments, specialized agent roles, demo-loop parity P14. P8 (wizard, general framework capability) LANDED in state.ts/screen.ts — already covered by this round's evidence. P9 = IRS→NestJS backend, different concern (server), explicit note: B6 cross-language rule-eval parity gate is the pattern to reuse for Swift rule parity. A Swift target is a NEW capability — it fits the "general capability, not a single product" rule P8/P9 state, and it must not regress the P10 capability-contract direction (a `platform` plugin contract is compatible with §3.1's registry).

---

## 16. Research/corpus references (already ground-truthed)

`design/flutter-app-builder/research/`: AUTH_OPTS.md, BACKEND_GEN_OPTS.md, CLAUDE_GRILL_REVIEW.md, COMPETITIVE_BENCHMARK.md, COMPOSITION_ENGINE.md, DESIGN_OPTS.md, EXPECTED_GAPS.md, EXTERNAL_REVIEW.md, EXTERNAL_REVIEW_2.md, GRILL_NOTES.md, PAYMENTS_OPTS.md, PERSISTENCE_ARCH.md, RESPONSE_TO_EXTERNAL_REVIEW.md, TIMING_LOG.md, app_matrix.json, app_matrix.md, cdp_flow_test.json, free_ram.sh, measure_times.sh, persistence_benchmark.json, prompts/, raw/. None touch SwiftUI. The composition engine (list/detail/wizard) lives in `builder/src/composition.ts` (37): `CompositionSpec`, `COMPOSITIONS` (list/detail/wizard), `compositionFor`. DESIGN §8.1 extension point (UIDesigner attach surface) is where a SwiftUI screen-shape family could also register.

---

## 17. Gap analysis — what is GREENFIELD for the SwiftUI target

Verified (rg/glob, this round):
- No `"platform"` / `"targets"` key in any IR. `AppAttributes` has no such field (`types.ts:140-167`).
- No Swift/SwiftUI references anywhere under `builder/` — no `swiftui/` generator directory, no `swift` string literals in generator IDs, no Swift SDK knowledge in `context.ts` lockfile/pins or `arch.ts` coupled-pairs.
- `index.ts` registry is Dart-*implicit* — `schema: "entity"` etc. resolve to Dart file generation; there is no per-target selector (§3.1). Pipeline (`pipeline.ts`) hardcodes `flutter` invocations.
- The IR knob is unspecified: proposed shape in the brief is `attributes.platform: "swiftui"` or `targets: ["flutter","swiftui"]` — recommend one in the requirements doc (attributes.platform is less invasive; a `project.targets` list is more future-proof for multi-target apps later; either is additive → byte-identical default output preserved).
- Single target per generation today; multi-target (both Flutter and SwiftUI from one IR) is NOT supported — a later decision.
---

## 18. Output-shape recommendation groundwork — SPM vs .xcodeproj

- SPM Package (a `Package.swift` emitting an app executable + XCTest target) builds with plain `swift build`/`swift test` — zero pbxproj churn, trivially reproducible in CI, and it matches the builder's `(IR, ctx) → string` + determinism discipline (byte-identical `Package.swift`). A real Xcode run/deploy to simulator still works (`xcodebuild -scheme` or `swift run`). Simulator boot + install + launch is scriptable via `xcrun simctl` (already a first-class tool here, §1.4).
- `.xcodeproj`/`.pbxproj` generation burden is real (the brief flags it): pbxproj is a fragile, order-sensitive plist; deterministic generation is possible but much costlier and harder to diff-gate. Recommend **SPM Package** for v1; `.xcodeproj` only if/when simulator-deploy or an app store build requires it (an Xcode project can wrap the SPM package then).
- Emit layout (keeps the Flutter outDir convention additive): `apps/<app>/output/app/ios/Sources/…` (a sibling `ios/` inside the existing generated outDir), or `apps/<app>/output/ios/` if the generated app folder must stay pure-Flutter. Recommend the brief's first option — `output/app/ios/` — so one IR → one app folder holds both targets; Flutter's own `ios/` convention is precedent.

---

## 19. Rules → Swift: exact emitter targets already identified

`rule.ts` today emits: `conditionExpr` (comparison/contains/daysSince, Money via minorUnits, enum qualified), decision-table fall-through, `RuleVerdict` (policy). A Swift target must emit or interpret equivalent semantics — the §9.4 "portable evaluator" option serializes `RuleModel` to JSON in the generated app and evaluates with one Swift implementation, so none of `rule.ts`'s Dart codegen is re-emitted. Rule-vs-entity: `[oracle]` + `[verdict]` gates are **IR-level validators** (`validate.ts`) — platform-agnostic, unchanged; oracle corpus JSON is portable as-is.

---

## 20. Persistence + budget + export to Swift: exact mapping inputs

- `drift` (sql) → SwiftData `@Model` (minorUnits Int64 + currency; never double — keep `[money]`). `hive_ce` (nosql KV) → `@AppStorage`/UserDefaults/Keychain. `none` → in-memory arrays.
- Budget: `resolveBudget(ir)` predicate (`operations.ts`) is target-agnostic; budget core logic (limit/committed/actual + quota verdict) must be re-implemented once (Swift `BudgetQuota` struct + eval) with a parity test against the Dart behavior.
- Export CSV/JSON: Dart core/export.dart → Swift `Codable` + a small CSV writer; the `[export]` gate (requires `exported: bool` field) is IR-level, unchanged.

---

## 21. l10n/RTL current state + exact strings surface

- Generated `app_strings.dart` (LocalizationGenerator) holds flat AppStrings; `locale:"ar"`/`"both"` impact digit/number policies + RTL. The bread-and-butter strings (list/detail/form labels, buttons, error messages) are **enumerable in the IR** (entity/label/action text is generated from field names, `fieldLabel`, etc.), so `.xcstrings` values can be generated deterministically, keyed by the same convention.
- G-L4-2 open leftover proves directionality is a real edge — the ledgerly `l10n_test.dart` is the pattern; Swift target gets a snapshot of `.xcstrings` (+ a Directionality unit test), no goldens.

---

## 22. Determinism + validators for Swift (concrete gate list)

Keep unchanged (target-agnostic): `[oracle]`, `[verdict]`, `[money]`, `[export]`, `[split]`, `[budget]`, schema validation, write-ACL/ownership headers, content-hash regions, single-generation determinism diff. Add (new, minimal): SF/Swift arch lint mirroring `archCheck` (domain layer must not import SwiftUI/UIKit/Foundation-IO), `swift build` gate in a `pipeline` extension, oracle-parity gate for the Swift rule evaluator (golden, blocking), `.xcstrings` snapshot. Timeouts: reuse `runFlutter`-style child process (default 300000 ms — §1.6).

---

## 23. Slice-plan groundwork (numbered like prior work)

Evidence supports the brief's S1–S7 shape; from the code, natural invariants per slice:
- S1 schema knob: add `attributes.platform` (+ optional `project.targets`), validate in schema + `validate.ts`, default `"flutter"` → byte-identical. No generator changes.
- S2 module skeleton: `builder/src/generators/swiftui/` + registry entries (reuse `operations.ts` predicates; pure string emission; no I/O).
- S3 list, S4 detail/form, S5 wizard: each consumes `screenPath()`/`fieldRole`/`crudEditableFields`/`wizardStatus` semantics (NOT their Dart codegen) — the operations.ts helpers are the shared truth.
- S6 l10n/RTL: `.xcstrings` + Directionality, reuses `fieldLabel`/label conventions.
- S7 rules/verdicts: portable evaluator + oracle-parity gate (§9.4).
- Later: money, split, auth/tenant, budget, export, outbox per §10.
Verification per slice: `npx tsc -p builder/tsconfig.json --noEmit` + `swift build`/`swift test` for the slice's generated app + determinism diff + oracle gate.

---

## 24. Top risks (evidence-grounded, for §8 of the brief)

1. **Rule-eval divergence (dual implementation)** — mitigate: portable evaluator + oracle-parity gate (golden, blocking), exactly the P9-B6 precedent (ROADMAP.md:113-116).
2. **pbxproj churn** — mitigate: SPM Package for v1 (§18); defer `.xcodeproj` unless simulator deploy demands it; deterministic pbxproj is a known trap.
3. **Determinism / golden-equivalence without goldens** — mitigate: context gains `targetVersion`; `.xcstrings` snapshot + XCTest unit tests replace matchesGoldenFile; keep `[oracle]` mandatory (the brief's own requirement).
4. **Simulator-only verification** (phys-device signing/codesign) — mitigate: v1 gate = simulator (all 33 devices available, §1.4) + `xcodebuild build` for archive; iOS 26.2 SDK present.
5. **I/O creep into generators** (SOLID §6) — mitigate: same rule as now — generators stay pure `(IR,ctx)→string`; `index.ts` + `pipeline.ts` do I/O, now extended for ft Swift build steps (not touched otherwise).

---

## 25. Sources consulted (all read this round, cite by file)

DESIGN.md (§§0-27; §2.1/2.3/2.4, §6, §7, §8, §9.2-9.6, §10, §11, §14, §15, §16, §17, §18, §19, §25); ROADMAP.md (head + P8/P9/P10-P14; where-we-are 2026-08-16); builder/src/{index,types,validate,operations,scoring,arch,provider,persistence,oracle,pipeline,plan,composition,context,gen_context,routing,naming,sampling,dart,symbols,acl,approve,provenance,region,regen,extract,requirements,server,benchmark}.ts; builder/src/generators/{rule,state,screen,crud_form,repository_impl,route,web,test,oracle_test,project,infra,policy,auth,split,attachment,budget,audit,audit_log_screen,export,outbox,persistence,di,form,components,entity,enum,model,query,wrapper,valueobject,datasource,repository,usecase,state_machine}.ts; builder/schemas/*.schema.json (15); builder/samples/*.ir.json + rules/; apps/{tasks,work_auth,hr_service,ledgerly}/input/*.ir.json (+ oracles); apps/tasks/output/{qa,rca,goldens}/; research/{PERSISTENCE_ARCH,EXTERNAL_REVIEW,EXTERNAL_REVIEW_2,TASK_SWIFTUI_REQUIREMENTS}.md; root package.json + pubspec.yaml + tools/; `git status --short --branch` (97 commits ahead; untracked app goldens/l10n_test/temp_all_flows_test/TASK_SWIFTUI_REQUIREMENTS.md/graphify-out/).

---

> End of evidence bundle. Writer of SWIFTUI_REQUIREMENTS.md: all facts above are verifiable against the cited paths; the 6 recommendations and their one-line rationales are flagged as such.
<!--EVIDENCE_READY-->