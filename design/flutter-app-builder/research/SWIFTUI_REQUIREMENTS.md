# SwiftUI Target Requirements

> Status: Requirements/design only, **approved with corrections** (architecture review 2026-08-16).
> No implementation is specified here beyond target architecture and gates.
>
> Grounding: `SWIFTUI_GROUND_TRUTH.md`, verified against the repository and Mac tooling on 2026-08-16.
>
> Constraint: additive, tokens-first, no deletion; existing Flutter generators remain untouched.
>
> Review verdict: core choices approved (same IR, 0% LLM deterministic core, additive target, no
> Flutter-generator fork, portable rule evaluator, `@Observable`/`@State`, SwiftData V1 with an
> abstraction boundary, `NavigationStack`, String Catalog + RTL, SPM over pbxproj for V1, oracle
> mandatory, incremental slices). Six corrections applied in this version; each is marked inline.

## 1. Goal + non-goals

### 1.1 Goal

Extend the deterministic Flutter App Builder so the **same IR remains the single source of truth** and can also produce a native iOS SwiftUI application.

The SwiftUI target is a second rendering target, not a second application model. The design must preserve the current trust boundary:

`IR -> schema/semantic validation -> deterministic generators -> generated artifacts -> validators/oracles`

The existing Flutter/Dart target must remain behaviorally and byte-for-byte unchanged when no SwiftUI target is requested.

### 1.1.1 Master architectural principle (review addition)

> **Target generators may translate IR semantics, but may not reinterpret IR semantics.**

A target generator renders the IR's declared semantics in its language and UI framework. It
must not change, narrow, widen, or re-derive what the IR declares. Where behavior must be
reimplemented (rules, Money, permissions, tenant isolation, wizard transitions, export, state
transitions), the Dart and Swift implementations are **two runtime implementations of one
formally defined semantics**, and the oracle corpus is the compatibility contract between them.

```text
                              SAME IR
                                |
               +----------------+----------------+
               |                                 |
         Flutter target                     SwiftUI target
               |                                 |
        Dart implementation               Swift implementation
               |                                 |
               +----------------+----------------+
                                |
                        SAME ORACLE CASES
                                |
                        SAME SEMANTICS
```

Consequences that are binding in this document:

- The IR never acquires Swift concepts (`@Model`, SwiftData stores, Swift enums, …). Those live
  in the target module only (correction 5).
- `attributes.platform` is a **generation target**, not an application capability (correction 1).
- Rule evaluation is one shared, formally defined semantics with two runtimes and a mandatory
  oracle-parity gate — never a loose re-interpretation of serialized JSON (correction 6).
- `swift build`/`swift test` prove the package; only `xcodebuild` against an iOS SDK proves the
  iOS target (correction 2).

### 1.1.2 Recommended V1 architecture (review addition)

```text
IR
 |
 +-- schema validation
 +-- semantic validation
 +-- oracle validation
 |
 +-- target dispatch
       |
       +-- flutter
       |     +-- existing generators
       |
       +-- swiftui
             +-- Domain
             +-- Application
             +-- Data
             +-- Navigation
             +-- Features
             +-- Localization
             +-- Tests
```

```text
builder/src/generators/flutter/*     NO CHANGE
builder/src/generators/swiftui/*     NEW
IR / schema / dispatch               MINIMAL ADDITIVE CHANGE
```

Note on the first line: existing Flutter generators today physically live directly under
`builder/src/generators/` (e.g. `rule.ts`, `state.ts`, `screen.ts`). "flutter/*" above is the
*logical* intent — those files stay exactly where they are, unmodified and unmoved. Only the new
`swiftui/` directory is added (additive; no renames, no moves).

### 1.2 Why a second target

The builder already models application semantics rather than Flutter implementation details: entities, value objects, relations, repositories, use cases, business rules, screens, state machines, navigation, forms, permissions, localization, persistence, and capability metadata.

A native SwiftUI target therefore adds a new delivery platform without forking the application model.

This is consistent with the architecture's "what, not how" IR rule (`DESIGN.md §2.3`) and the deterministic generation contract (`DESIGN.md §6.3`).

### 1.3 V1 scope

V1 should prove that the existing IR can generate a credible native SwiftUI app with:

- application shell;
- list, detail, and CRUD form screens;
- `NavigationStack` navigation;
- `@Observable` application/screen state;
- typed domain models and enums;
- portable business-rule evaluation;
- rule/verdict oracle parity;
- wizard/P8 flow;
- English/Arabic localization and RTL;
- Money represented without floating-point currency loss;
- deterministic export of generated source and resources;
- XCTest verification;
- simulator-oriented build/test verification.

V1 should preserve the semantics of L1-L4 and MF1-MF6 where the parity matrix in §4 explicitly marks them as in-v1.

### 1.4 Non-goals

V1 does **not**:

- fork or version the IR into a Swift-specific IR;
- modify existing Flutter generators;
- replace Flutter/Dart generation;
- introduce an LLM into generation or evaluation;
- generate arbitrary Swift from an LLM;
- generate an `.xcodeproj`/`pbxproj` as the primary project format;
- require physical-device signing/deployment;
- reproduce every Flutter-specific widget or package;
- make TCA a required dependency;
- create a second business-rule language;
- change existing validator gates or weaken the oracle gate;
- solve multi-platform Apple targets (macOS/watchOS/tvOS/visionOS) in V1;
- support simultaneous multi-target generation from one invocation unless explicitly added later.

The IR remains authoritative. Swift-specific implementation choices belong behind the target boundary.

---

## 2. Tooling ground truth

The following was verified on the target Mac and recorded verbatim in `SWIFTUI_GROUND_TRUTH.md`.
The comprehensive verbatim record (full `xcodebuild -showsdks`, all `xcrun --find` paths, Swift
version, Flutter version, full device list) lives in `SWIFTUI_GROUND_TRUTH.md §1` and is the
**authoritative record**. The excerpts below are reproduced from it **verbatim, unabbreviated** —
they must not be shortened or elided in any downstream copy (correction 4).

### 2.1 Xcode

```text
$ xcodebuild -version
Xcode 26.3
Build version 17C529

$ xcode-select -p
/Applications/Xcode.app/Contents/Developer
```

### 2.2 Swift

```text
$ swift --version
Apple Swift version 6.2.4 (swift-driver 1.127.15 Apple Swift version 6.2.4)
Target: arm64-apple-macosx15.0
```

### 2.3 Simulator discovery (verbatim — `head -20`)

```text
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

The Mac has Xcode 26.3, Swift 6.2.4, iOS 26.2/iOS Simulator 26.2 SDKs, and available iOS 18.2 and
iOS 26.0 simulator runtimes. The full device list in `SWIFTUI_GROUND_TRUTH.md §1.4` reports **33
available devices** matching the excerpt above.

### 2.4 Verification gate — two distinct gates (correction 2)

The generated SwiftUI target must have two **separate** native verification gates. They prove
different things and must not be conflated:

**Gate A — Package / domain gate (host macOS):**

```text
swift build
swift test
```

Proves the generated Swift package compiles and its tests pass on the host Mac. It does **not**
by itself prove an iOS SwiftUI *application* builds for iOS.

**Gate B — iOS target gate (simulator):**

```text
xcodebuild build -scheme <scheme> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.0'
xcodebuild test  -scheme <scheme> -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.0'
```

Proves the SwiftUI application and its tests build and run against an iOS SDK/simulator
destination. This is the real "does the iOS app build" gate; `swift build` alone is insufficient
for that claim.

Both gates run per slice once Swift output exists. The destination is pinned in test
configuration, never derived from "whichever simulator happens to be booted."

Both are **additional target gates** — they do not replace the existing builder oracle,
deterministic-generation, schema, or semantic validators.

**Sources:** `SWIFTUI_GROUND_TRUTH.md §1.6`; `DESIGN.md §6`, §9.4, §15.

---

## 3. Minimal-diff architecture

### 3.1 Recommended IR knob

Use an additive `attributes.platform` field:

```json
{
  "attributes": {
    "platform": "flutter"
  }
}
```

Allowed V1 values:

- `flutter`
- `swiftui`

Absent means `flutter`.

**Semantic clarity (correction 1):** `attributes.platform` must be defined and used strictly as a
**generation target** — "which rendering target does this generation invocation produce?" — and
must **not** be treated as an application capability or as anything a business rule, screen, or
repository can read at runtime. It is consumed only by the composition root (`index.ts`) for
target dispatch and by `validate.ts` for target-specific gates. It never enters the runtime IR
surface the generated app sees; a rule or screen must not branch on it.

Passing through `ApplicationModel` unchanged, it stays a single value:

- `flutter` (default) → the existing generators, byte-for-byte today's output;
- `swiftui` → the new `builder/src/generators/swiftui/` target.

This is preferred for V1 over immediately introducing a `targets` array because it changes the
fewest existing contracts and preserves the current "one generation invocation → one target" model.

### 3.1.1 `targets[]` — reserved, not part of V1 (correction 1)

A future **multi-target** generation mode may introduce:

```json
{
  "targets": ["flutter", "swiftui"]
}
```

`targets[]` is explicitly **reserved for that future mode** — simultaneous generation of two or
more targets from one invocation — and is out of scope for V1. V1 supports exactly one generation
target per invocation via the scalar `platform`. Do not conflate the two: `platform` selects the
target **now**; `targets[]` will express multi-target **later**. Opening question 2 (§8)
re-asks whether that future knob belongs at project level or under `attributes`; it is recorded
here as reserved regardless of where it lands.

### 3.2 Compatibility rule

For every existing IR with no `attributes.platform`, generation must remain byte-identical to the current Flutter output.

Therefore:

- schema addition is optional/additive;
- default target is Flutter;
- existing Flutter generator modules are not edited;
- existing generator templates are not edited;
- existing Flutter validator semantics remain unchanged.

### 3.3 Exact existing-tree changes

The intended minimal existing-tree changes are:

1. `builder/src/types.ts`
   - add the typed platform field to `AppAttributes`.

2. `builder/src/schema.ts` and/or the relevant application JSON schema
   - permit and constrain the optional platform value.

3. `builder/src/validate.ts`
   - validate the platform value and dispatch target-specific validation/gates without weakening existing gates.

4. `builder/src/index.ts`
   - add target selection at the composition root.
   - retain the existing Flutter registry untouched as a logical registry.
   - dispatch SwiftUI generation to `builder/src/generators/swiftui/`.

5. `builder/src/pipeline.ts`
   - only if the existing pipeline needs an explicit Swift build/test phase.
   - this must be additive; Flutter invocation behavior is unchanged.

6. `builder/src/gen_context.ts` / context type, if required by the current context implementation
   - add a target/version identity so target-specific generation remains deterministic.

7. Tests for schema/dispatch/Swift generation may be added under the existing test structure.

No existing file under `builder/src/generators/` should be modified for Flutter behavior.

### 3.4 New target module

Create:

```text
builder/src/generators/swiftui/
```

The module owns Swift source/resource generation and Swift-specific target validation helpers.

It must consume the same runtime IR models and target-agnostic helpers such as:

- `operations.ts`;
- `composition.ts`;
- `routing.ts` semantics;
- `sampling.ts`;
- rule/oracle models;
- schema/semantic validation results.

It must not reimplement IR discovery rules independently when a target-agnostic helper already exists.

### 3.5 Single source of truth

The source of truth remains:

```text
Application IR
```

Not:

- Dart source;
- generated Swift;
- Flutter templates;
- Swift templates;
- a Swift-specific schema;
- a second rule language.

The target modules are projections of the same semantic IR.

### 3.6 Trust boundary

The existing deterministic core remains 0% LLM:

```text
LLM / authoring
     |
     v
validated IR
     |
     +--> Flutter target
     |
     +--> SwiftUI target
```

The Swift target cannot create new business semantics that are absent from the IR.

**Sources:** `DESIGN.md §2.3`, §6.3, §10, §11; `builder/src/types.ts`; `builder/src/index.ts`; `SWIFTUI_GROUND_TRUTH.md §§3-4,17`.

---

## 4. Hard mapping problems and recommendations

### 4.1 Rule language (§19)

#### Problem

`builder/src/generators/rule.ts` currently emits Dart expressions. The RuleModel itself is portable, but emitting equivalent Swift expressions would create a second implementation of rule semantics.

The current rule language is intentionally closed:

- comparisons;
- `contains`;
- `daysSince`;
- Money comparisons;
- enum comparisons;
- decision tables;
- policy/verdict severity;
- state-machine primitives.

There is no arbitrary code execution, I/O, or unconstrained expression language.

#### Recommendation: portable rule evaluator over a strongly typed generated model (correction 6)

Generate a small Swift evaluator that runs **the same canonical rule semantics as the Dart
implementation**, over a **strongly typed Swift representation of the validated RuleModel** — not
a loose reinterpretation of arbitrary JSON.

Two design decisions are binding:

1. **Strongly typed representation, generated from the validated IR.** The generator emits Swift
   `Codable` types that mirror the *validated* `RuleModel` exactly (rule name, entity, AND-ed
   conditions, operators, literal values, decision-table rows, outcome, verdict severity). The
   Swift code is compiled against these types — the compiler rejects unknown fields, unknown
   operators, and mismatched operands at build time, which is exactly the kind of drift a
   JSON-reinterpretation path would let through silently.

2. **One formally defined rule semantics, two runtimes.** Dart (`rule.ts`) and Swift are treated
   as **two runtime implementations of a single formally defined semantics** (DESIGN §19). The
   semantics — operator meanings, Money `minorUnits` ×100 comparison, enum qualification,
   `daysSince*`, decision-table fall-through, `contains`, null/required handling — are defined
   once (in DESIGN §19 + the oracle corpus) and implemented twice. The **oracle corpus is the
   compatibility contract** between them, not a best-effort cross-check.

Conceptually:

```text
validated RuleModel
        |
        v
strongly typed Swift RuleModel (generated, Codable)
        |
        v
Swift RuleEvaluator  (same canonical semantics as Dart rule.ts)
        |
        v
same verdict/result semantics as Dart
```

The evaluator must not accept a broader language than the validated IR (§4.7); unknown operators
or fields fail at generation, not at runtime.

**Rationale:** this avoids maintaining two rule compilers with potentially divergent semantics,
uses the compiler as a drift detector, and directly supports the cross-language rule-evaluation
parity posture already identified in ROADMAP P9-B6. A loose "serialize and reinterpret" path
would reintroduce exactly the divergence the oracle gate exists to prevent.

#### Required gate

The existing rule oracle corpus remains mandatory.

For every rule oracle:

```text
Dart result == Swift result
```

must be asserted for the same cases.

A missing or empty oracle continues to fail the existing validation gate.

**Source:** `DESIGN.md §19`, §9.4; `builder/src/generators/rule.ts`; `builder/src/oracle.ts`; `builder/src/validate.ts`; `ROADMAP.md` P9-B6.

---

### 4.2 State management

#### Problem

Flutter currently selects `none`, Bloc, or Riverpod and couples that to DI/persistence/routing strategies.

SwiftUI already provides native state observation and environment mechanisms.

#### Recommendation: `@Observable` + `@State`

Use Swift Observation (`@Observable`) with SwiftUI `@State` ownership and environment injection where dependencies need propagation.

Do not introduce TCA for V1.

Mapping:

| IR / Flutter concept | SwiftUI |
|---|---|
| generated state object | `@Observable` model |
| local view-owned state | `@State` |
| dependency access | environment / explicit initializer injection |
| enum status | Swift `enum` |
| state transition | methods on observable model |
| loading/success/failure | typed enum state |
| wizard state | observable wizard model |

**Rationale:** idiomatic, minimal, dependency-light, and sufficient for the existing `none`/enum-status/sealed-event semantic shapes without importing a second application architecture.

**Source:** `builder/src/scoring.ts`, `builder/src/arch.ts`, `builder/src/provider.ts`, `builder/src/generators/state.ts`; `DESIGN.md §10`.

---

### 4.3 Persistence

#### Problem

Flutter's persistence registry has:

- SQL / Drift;
- NoSQL / Hive CE;
- none/in-memory.

Swift must preserve persistence semantics without importing Flutter packages.

#### Recommendation: SwiftData for V1 SQL persistence (with a hard boundary — correction 5)

Map the IR's `sql` persistence strategy to SwiftData for V1.

SwiftData is here **only a target implementation of the IR persistence contract** (§18:
`persistence: { backend, sourceOfTruth, syncStrategy, conflictResolution }`). The boundary is
binding:

- The IR must **never acquire SwiftData concepts** — no `@Model`, no `ModelContainer`, no
  `ModelContext`, no SwiftData schema in the IR or its schema files. Persistence is declared at
  the semantic level (`sql`/`nosql`/`none` + sync strategy); the target module decides the
  concrete store.
- The repository/protocol boundaries in the generated Swift app mirror the IR's repository
  contracts; SwiftData lives behind them (in Data/), never leaking into Domain or Features.
- This preserves the single-source-of-truth rule (DESIGN §2.3): the IR stays what, not how.

Mapping within the target module:

- `@Model` for persistent entities where appropriate (a target-internal choice);
- `Int64` minor units + currency for Money;
- repository/protocol boundaries matching the IR;
- in-memory repository for `none`;
- a small `UserDefaults`/`@AppStorage` adapter only for genuinely key-value/noSQL-like settings.

Do not treat `UserDefaults` as a substitute for relational application persistence.

GRDB remains a later option if the generated applications require stronger SQL control, migrations, query portability, or SQLite-level parity.

**Rationale:** SwiftData is the smallest idiomatic native mapping for an iOS 17+ SwiftUI target and pairs naturally with Observation; introducing GRDB in V1 adds an external persistence abstraction before the target's semantics are proven. Its role is strictly an adapter — a correct V1 must be able to swap SwiftData for another store behind the same generated repository protocols without IR changes.

**Source:** `builder/src/persistence.ts`; `DESIGN.md §18`; `SWIFTUI_GROUND_TRUTH.md §10.1`.

---

### 4.4 Navigation

#### Recommendation: `NavigationStack` + typed route values

Keep `screenPath()` as the semantic route source of truth.

Current route forms:

```text
list    -> /entity
detail  -> /entity/:id
wizard  -> /entity/wizard
```

Swift mapping:

```text
ScreenModel
    |
    v
Route enum / Hashable route value
    |
    v
NavigationStack(path:)
    |
    +--> navigationDestination(...)
```

Examples of semantic mapping:

| Flutter | SwiftUI |
|---|---|
| `GoRouter` | `NavigationStack` |
| path parameter `id` | typed route associated value |
| query FK | typed route/query value |
| `context.push` | append to navigation path |
| back | pop path |
| guarded route | root/session gate before destination |
| `/entity/new` | typed create route |
| `/entity/wizard` | typed wizard route |

`screenPath()` must remain the source of route identity; Swift route types are a target representation.

**Rationale:** preserves existing route semantics while using native iOS navigation rather than reproducing GoRouter.

**Source:** `builder/src/routing.ts`; `builder/src/generators/route.ts`; `builder/src/generators/screen.ts`; `DESIGN.md §10`.

---

### 4.5 l10n / RTL

#### Recommendation: String Catalogs (`.xcstrings`) + SwiftUI leading-edge layout

Generate an Xcode String Catalog as the primary localized resource.

Fallback/compatibility may use `Localizable.strings` where required by tooling.

Mapping:

| IR / Flutter | SwiftUI |
|---|---|
| `AppStrings` | generated localization keys |
| `locale: en/ar/both` | `.xcstrings` localizations |
| `fieldLabel` | localized resource entry |
| ICU-style plural/format data | String Catalog localization data |
| Material RTL | SwiftUI environment/layout direction |
| `EdgeInsets(left/right)` | leading/trailing |

All generated layout must prefer:

- `.leading` / `.trailing`;
- leading/trailing padding;
- semantic alignment;
- no physical left/right assumptions.

Arabic tests must explicitly exercise `.environment(\.layoutDirection, .rightToLeft)`.

**Rationale:** String Catalogs are the native Xcode localization representation and semantic leading/trailing layout directly preserves the existing Arabic-first RTL requirement.

**Source:** `DESIGN.md §16`; `builder/src/types.ts`; `builder/src/generators/l10n.ts`; `SWIFTUI_GROUND_TRUTH.md §10.2`.

---

### 4.6 Capability parity matrix

| Capability | Swift V1 | Reason |
|---|---|---|
| L1 Money | **in-v1** | Core semantic type; Swift must use `Decimal`/integer minor units and currency, never raw floating-point money. |
| L2 Verdicts | **in-v1** | Business-rule semantics are central to the IR and must share oracle parity. |
| MF4 Split | **in-v1** | Split grouping is IR-derived and can map cleanly to Swift domain models/forms. |
| MF2 Auth + roles + tenant | **in-v1** | Security/tenant semantics are part of repository and route behavior, not Flutter UI. |
| MF3 Attachment + OCR | **later** | Native file/photo capability needs platform service contracts and OCR implementation decisions beyond the core CRUD proof. |
| MF5 Budget/quota | **in-v1** | Budget semantics are deterministic and already resolved from IR Money fields. |
| L3 Audit | **in-v1** | Audit is domain/application behavior and must not disappear on a second target. |
| L3 Export CSV/JSON | **in-v1** | Export semantics are already IR-derived and portable through Codable + deterministic CSV writing. |
| L4 l10n AR/EN + RTL | **in-v1** | Existing IR explicitly models locale and RTL is a first-class UX requirement. |
| MF6 Outbox/sync | **later** | Offline queue/sync requires native networking/background execution and conflict semantics; prove the core target first. |
| MF1 multi-feature | **in-v1** | Multi-feature composition is an IR capability, not a Flutter-only concern. |
| G2/G3/G5 | **in-v1** | These are existing behavioral/UX gates and should remain semantic gates across targets. |
| UIX A-D | **in-v1, semantic subset** | Core list/detail/form/accessibility contracts map to SwiftUI; Flutter-specific visual implementation does not. |
| P8 wizard | **in-v1** | Wizard state/steps/validation are explicit IR semantics already implemented. |

"Later" does not mean unsupported forever; it means the capability must not be faked by a partial SwiftUI implementation.

---

### 4.7 Rule/entity reachability

The same reachability rules must hold.

A business rule is only attached to an entity when:

- `rule.entity` names an actual entity;
- referenced fields exist;
- `[verdict]` validation passes;
- the oracle exists and has cases.

The Swift evaluator must not accept a broader language than the validated IR.

A rule referencing an unreachable/nonexistent entity or field must fail before generation exactly as it does for Flutter.

**Source:** `builder/src/operations.ts`; `builder/src/validate.ts`; `builder/src/oracle.ts`.

---

### 4.8 Wizard/P8 mapping

The Swift implementation must preserve:

- `wizardStatus`;
- `currentStep`;
- `_draft`;
- per-step fields;
- required-field checks;
- `validate`;
- `when`;
- `next`;
- `back`;
- `jumpTo`;
- `canAdvance`;
- successful completion;
- skipped conditional steps.

Mapping:

```text
WizardStep
   -> Swift WizardStep model

currentStep
   -> observable Int

draft
   -> Codable/typed draft model

validate RuleModel
   -> portable RuleEvaluator

when
   -> condition/rule evaluation

next/back/jumpTo
   -> deterministic state transitions
```

A conditional step whose `when` is false must be skipped rather than becoming an unreachable/dead-end screen.

**Source:** `builder/src/generators/state.ts`; `builder/src/types.ts`; `builder/src/generators/screen.ts`.

---

### 4.9 Demo seeding

Reuse `sampling.ts` because it is IR/JSON-oriented rather than Dart-specific.

The same deterministic sample identities and values should feed the Swift target:

- primary title → `Sample Task`, etc.;
- identity → deterministic IDs;
- Money → minor units/currency;
- same semantic relationships.

This provides a shared demo-data oracle rather than a second hand-written Swift fixture.

**Source:** `builder/src/sampling.ts`; `SWIFTUI_GROUND_TRUTH.md §11`.

---

## 5. Output shape

### 5.1 Recommendation: Swift Package Manager

Use an SPM package as the V1 generated Swift target rather than generating `.xcodeproj`/`pbxproj`.

**Rationale:** `Package.swift` is text and therefore naturally compatible with the existing deterministic `(IR, context) -> string` model. `.pbxproj` generation introduces substantial order-sensitive project-file churn and a large new deterministic surface.

An Xcode project may be introduced later if simulator deployment, signing, or App Store packaging requires it.

### 5.1.1 Explicit iOS platform declaration (correction 3)

Because SPM defaults are not an iOS guarantee, the generated `Package.swift` **must** declare the
supported iOS deployment target explicitly:

```swift
let package = Package(
    name: "<AppName>",
    platforms: [
        .iOS(.v17)   // minimum deployment target — see decision below
    ],
    products: [ .library(name: "<AppName>", targets: ["<AppName>"]) ],
    targets: [ .target(name: "<AppName>"), .testTarget(name: "<AppName>Tests", dependencies: ["<AppName>"]) ]
)
```

This makes the SPM package's iOS requirement explicit and checkable (a `swift build` on the host
does not, by itself, demonstrate iOS eligibility — see §2.4). The exact minimum version is a
decision to lock in this round:

- **Recommended V1 minimum: iOS 17**, because `@Observable` and SwiftData are foundational
  assumptions and are available from iOS 17.
- This moves the "is iOS 17 the permanent minimum?" question (§8, open question 1) from a risk
  footnote to an explicit architectural requirement. V1 pins **iOS 17+**; relaxing or raising it
  later is a separate, deliberate change.

`platforms: [.iOS(.v17)]` must be present in every generated `Package.swift`; a generated package
without an explicit iOS platform declaration fails validation.

### 5.2 Generated layout

Keep the current generated-app convention and add SwiftUI beneath the generated app:

```text
apps/<app>/
  input/
    <app>.ir.json
  output/
    app/
      ...existing Flutter generated app...
      ios/
        Package.swift            # MUST declare platforms: [.iOS(.v17)] (correction 3)
        Sources/
          <AppName>/
            App.swift
            Core/
            Domain/
            Application/
            Data/
            Features/
            Navigation/
            Localization/
            Resources/
        Tests/
          <AppName>Tests/
            ...
        Resources/
          Localizable.xcstrings
          ...
```

The exact directory names may be refined during implementation, but the invariant is:

```text
existing Flutter output remains where it is
+
output/app/ios/ is additive
```

No existing Flutter output is replaced.

### 5.3 Package boundaries

V1 should keep one generated application package rather than prematurely splitting every layer into independent Swift packages.

Logical source ownership mirrors the review architecture (`Domain / Application / Data / Navigation / Features / Localization`):

```text
Domain/         Swift domain models, enums, rule evaluator (no SwiftUI/UIKit imports)
Application/    use-case/application orchestration, session, tenant
Data/           repository implementations, persistence adapters (SwiftData, in-memory)
Features/       SwiftUI screens and view state
Navigation/     route values + NavigationStack wiring
Localization/   .xcstrings / resource accessors
Core/           shared cross-cutting support
```

with dependency direction equivalent to the existing Clean Architecture constraints (Domain at
the center, Data and Features on the outside, both depending inward only).

---

## 6. Verification + gates

### 6.1 Existing gates remain mandatory

The Swift target must not bypass:

- schema validation;
- semantic validation;
- oracle coverage;
- verdict checks;
- money checks;
- export checks;
- split checks;
- budget checks;
- write ACL/ownership;
- generated-region preservation;
- single-generation determinism.

The existing validator is the oracle for the IR. Native Swift compilation is an additional target gate.

### 6.2 Deterministic generation

Run generation twice with the same:

```text
IR
+
generation context
+
targetVersion
```

and require identical Swift output.

The context must identify the Swift target/version so a Swift generator change is explicit and reviewable.

### 6.3 Swift architecture gate

Add a Swift analogue of `archCheck`.

Minimum V1 rule:

- Domain must not import SwiftUI;
- Domain must not import UIKit;
- Domain must not perform persistence/network I/O directly;
- views belong in presentation/features;
- repository protocols are domain/application-facing;
- repository implementations own persistence/network details.

This is the Swift equivalent of the existing layer-purity check.

### 6.4 Build/test gate (two gates — correction 2)

The V1 native gate is two distinct steps, both required once Swift output exists:

**Gate A — Package / domain gate:**

```text
swift build
swift test
```

**Gate B — iOS target gate (simulator destination, pinned in config):**

```text
xcodebuild build -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.0' ...
xcodebuild test  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.0' ...
```

- Gate A proves the generated Swift package compiles/tests on the host Mac.
- Gate B proves the generated **iOS SwiftUI application** builds and tests for iOS.
- `swift build` alone is **not** evidence the iOS target builds (correction 2) — Gate B is the
  gate that makes that claim.

The exact destination should be pinned in CI/test configuration rather than relying on whichever
simulator happens to be booted. Slices §S2+ run Gate A; Gate B runs wherever simulator availability
is part of the slice (see each slice's Verify).

### 6.5 XCTest

Generate focused tests for:

- model serialization;
- state transitions;
- wizard transitions;
- rule evaluator;
- oracle parity;
- Money;
- repository behavior;
- localization resource shape;
- route mapping;
- accessibility semantics where testable.

Do not attempt to duplicate Flutter golden testing.

### 6.6 No SwiftUI goldens

SwiftUI has no direct equivalent to the existing Flutter `matchesGoldenFile` workflow.

V1 should therefore use:

1. XCTest for behavior;
2. generated `.xcstrings` snapshot/content checks;
3. RTL/layout-direction tests;
4. deterministic generated-source diff;
5. optional simulator smoke build.

The **oracle gate remains mandatory** and is the primary correctness oracle for business rules.

A visual snapshot framework can be considered later, but it must not become a prerequisite for the initial target.

---

## 7. Slice plan

Each slice is independently verifiable and should be small enough to review and revert.

### S1 — Schema knob

**Scope**

- add optional `attributes.platform`;
- default absent -> Flutter;
- validate `flutter|swiftui`;
- target dispatch plumbing only.

**Must not**

- modify Flutter generators;
- alter existing Flutter output.

**Verify**

- TypeScript typecheck;
- schema tests;
- existing generation twice -> identical Flutter output;
- existing validator suite.

---

### S2 — SwiftUI module skeleton / hello screen

**Scope**

Create:

```text
builder/src/generators/swiftui/
```

Emit a minimal SPM SwiftUI application from a valid IR.

**Verify**

- deterministic generation;
- `swift build` + `swift test` (Gate A);
- iOS simulator build (Gate B) for the hello screen;
- `Package.swift` declares `platforms: [.iOS(.v17)]` (correction 3);
- Swift arch gate;
- existing Flutter generation remains unchanged.

---

### S3 — List screens

**Scope**

Map:

- screen composition;
- title/subtitle roles;
- field access;
- relationships;
- list -> detail navigation.

Reuse target-agnostic helpers from `operations.ts` and `composition.ts`.

**Verify**

- generated list compiles;
- generated route table compiles;
- deterministic diff;
- XCTest for list model/state;
- existing Flutter gates.

---

### S4 — Detail + CRUD form

**Scope**

Map:

- detail;
- create;
- update;
- primitive editable fields;
- enum;
- bool;
- DateTime;
- Money;
- validation state.

**Verify**

- `swift build`;
- XCTest form/state transitions;
- Money gate;
- deterministic generation;
- CRUD smoke test.

---

### S5 — Wizard/P8

**Scope**

Implement:

- `WizardStep`;
- draft;
- `currentStep`;
- `wizardStatus`;
- next/back/jump;
- required fields;
- `when`;
- `validate`;
- completion.

**Verify**

- generated wizard compiles;
- XCTest for all transition branches;
- conditional-step test;
- rule-backed validation test;
- deterministic diff.

---

### S6 — Localization + RTL

**Scope**

- `.xcstrings`;
- EN/AR;
- leading/trailing layout;
- explicit RTL tests.

**Verify**

- localization resource snapshot;
- EN/AR lookup tests;
- RTL directionality XCTest;
- generated-source determinism.

---

### S7 — Rules + verdicts

**Scope**

- strongly typed generated Swift RuleModel (correction 6);
- Swift evaluator over the validated model (same canonical semantics as Dart `rule.ts`);
- verdict/severity mapping;
- oracle runner.

**Verify**

This slice has the strongest gate:

```text
every Dart oracle case
        ==
Swift evaluator result
```

Any mismatch blocks the slice. The parity runner uses the same oracle corpus JSON, and the
generated Swift RuleModel must be **compiler-checked** (unknown operator/field → build failure),
not reinterpreted from loose JSON.

---

### S8 — Auth, roles, tenant

**Scope**

- session;
- persona/role;
- home route;
- route guards;
- tenant scoping;
- actor stamping.

**Verify**

- unauthorized route test;
- role access test;
- tenant isolation test;
- repository tests;
- build/test.

---

### S9 — Split + budget

**Scope**

- split-group mapping;
- percentage/value handling;
- budget/quota;
- Money parity.

**Verify**

- split validator;
- budget tests;
- Money tests;
- oracle parity where rules participate.

---

### S10 — Audit + export

**Scope**

- audit records;
- CSV;
- JSON;
- exported flag semantics.

**Verify**

- deterministic CSV/JSON tests;
- `[export]` gate;
- audit append/read tests;
- `swift test`.

---

### S11 — Persistence

**Scope**

- SwiftData adapter;
- repository protocol implementation;
- migrations needed by generated schema;
- in-memory implementation.

**Verify**

- persistence integration test;
- repository contract tests (SwiftData hidden behind IR contracts — correction 5);
- simulator build/test (Gate B).

---

### S12 — Attachment/OCR

**Scope**

Only after native capability contracts are defined.

**Verify**

- capability-service contract;
- mock-based XCTest;
- simulator smoke path.

---

### S13 — Outbox/sync

**Scope**

- durable outbox;
- retry/backoff;
- sync adapter;
- conflict policy.

**Verify**

- queue ordering;
- retry;
- failure recovery;
- conflict tests;
- simulator integration test.

---

### S14 — End-to-end parity

**Scope**

Run the target demo IR through both targets and compare semantic artifacts:

- entities;
- routes;
- rules;
- sample data;
- l10n keys;
- exports;
- expected state transitions.

**Verify**

- one-generation determinism;
- all existing validator gates;
- Swift build/test (Gate A) + simulator build (Gate B);
- complete rule-oracle parity;
- no Flutter diff when target is absent/default.

---

## 8. Risks + open questions

| Risk / question | Impact | Mitigation |
|---|---|---|
| Rule evaluator divergence | Critical | Strongly typed generated Swift RuleModel + one formally defined semantics, two runtimes; mandatory cross-language oracle parity (correction 6). |
| `.pbxproj` churn | High | SPM package in V1; defer project generation. |
| `swift build` mistaken for iOS proof | Medium | Two distinct gates: Gate A (`swift build`/`swift test`) proves the package; Gate B (`xcodebuild -sdk iphonesimulator`) proves the iOS target (correction 2). |
| Determinism without Flutter goldens | High | Keep source determinism + oracle gates; use XCTest and localization snapshots; optional visual snapshots later. |
| iOS deployment/signing | Medium | V1 uses simulator/build verification (Gate B); physical-device signing is later. |
| SwiftData leaking into the IR | Medium | SwiftData is a target-only adapter behind IR repository contracts; IR never acquires `@Model`/stores (correction 5). |
| SwiftData behavior differs from Drift | Medium | Repository contract tests and IR-level persistence semantics; consider GRDB later if SQL parity becomes necessary. |
| Swift version/API availability | Medium | V1 pins iOS 17+ APIs (`@Observable`, SwiftData); declared in `Package.swift` `platforms: [.iOS(.v17)]` and enforced by validation (correction 3). |
| UIKit/SwiftUI leakage into Domain | Medium | Add Swift architectural lint mirroring `archCheck`; Domain must not import SwiftUI/UIKit. |
| Multi-target generation ambiguity | Medium | V1 supports one generation target per invocation via scalar `attributes.platform`; reserve `targets[]` for the future multi-target mode (correction 1). |
| Native platform capabilities are not portable | High for MF3/MF6 | Keep attachment/OCR and outbox/sync behind explicit service/repository protocols; mark later until contracts are proven. |
| Generated project/package evolution | Medium | Add `targetVersion` to generation context and keep generated Swift files deterministic. |
| Test budget | Medium | Prefer domain/state/oracle tests over visual snapshot suites in V1; XCTest replaces golden tests. |
| Existing Flutter regression | Critical | Default platform remains Flutter and existing generators are untouched; run existing generation/diff gates on every target change. |

### Open questions

1. *(Resolved by correction 3 — moved out of open questions.)* V1 minimum iOS deployment target is
   **pinned to iOS 17+** and declared in every generated `Package.swift`. Whether the permanent
   policy should relax or raise later is a deliberate future decision, not a V1 ambiguity.
2. Should the future multi-target knob be `targets[]` at project level or remain under `attributes`?
   (Reserved for the future multi-target mode; see §3.1.1.)
3. At what point does SwiftData become insufficient and justify GRDB?
4. What exact native OCR contract is required for MF3?
5. What exact background execution model is required for MF6 on iOS?
6. Should simulator smoke tests run on one pinned iOS runtime or both the oldest supported and current installed runtime?
7. Does a future App Store/release requirement force an `.xcodeproj`/workspace wrapper around the SPM package?

---

## Source references

Primary evidence and architecture sources:

- `design/flutter-app-builder/DESIGN.md` — especially §§2, 6, 7, 8, 9, 10, 11, 15, 16, 18, 19, 25.
- `design/flutter-app-builder/ROADMAP.md` — P8, P9-B6, P10-P14.
- `builder/src/types.ts`
- `builder/src/schema.ts`
- `builder/src/validate.ts`
- `builder/src/index.ts`
- `builder/src/pipeline.ts`
- `builder/src/operations.ts`
- `builder/src/plan.ts`
- `builder/src/context.ts`
- `builder/src/gen_context.ts`
- `builder/src/routing.ts`
- `builder/src/composition.ts`
- `builder/src/sampling.ts`
- `builder/src/oracle.ts`
- `builder/src/arch.ts`
- `builder/src/persistence.ts`
- `builder/src/scoring.ts`
- `builder/src/generators/rule.ts`
- `builder/src/generators/state.ts`
- `builder/src/generators/screen.ts`
- `builder/src/generators/crud_form.ts`
- `builder/src/generators/route.ts`
- `builder/src/generators/l10n.ts`
- `builder/src/generators/auth.ts`
- `builder/src/generators/attachment.ts`
- `builder/src/generators/budget.ts`
- `builder/src/generators/audit.ts`
- `builder/src/generators/export.ts`
- `builder/src/generators/outbox.ts`
- `builder/src/generators/project.ts`
- `builder/samples/tasks.ir.json` / `apps/tasks/input/tasks.ir.json` as applicable.
- `SWIFTUI_GROUND_TRUTH.md` — verified repository and tooling evidence supplied for this requirements round.

