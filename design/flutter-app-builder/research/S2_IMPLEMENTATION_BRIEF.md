# S2 Implementation Brief — SwiftUI module skeleton / hello screen

Status: **STARTED** — queued to claude (claude-flutter-grill) 2026-08-16.
Contract: `research/SWIFTUI_REQUIREMENTS.md` §5 (output shape), §6.3 (Swift arch gate), §6.4 (Gates
A/B), §7 S2 slice; `research/SWIFTUI_GROUND_TRUTH.md` §18 (SPM output shape).
Predecessor: S1 landed (verified by orchestrator: typecheck OK, byte-identical regen, all 20
validate gates PASS including `[platform]`). S1 introduced `targetOf(ir)`/`isSwiftUI(ir)` in
`builder/src/operations.ts:527-532` and a swiftui throw at `builder/src/index.ts:728-732`.

---

## 1. What S2 is

S2 replaces the S1 "not yet implemented" throw with a **minimal real SwiftUI target**: from a
valid IR it emits a tiny SPM SwiftUI application whose screen is a hello/welcome screen, and it
proves that output compiles on the host (**Gate A**) and builds as an iOS app on a pinned
simulator destination (**Gate B**). No CRUD, no navigation, no rules, no persistence — those are
S3+. The invariant (§5.2): **existing Flutter output stays exactly where it is; `ios/` is
additive.**

Definition/limits (§7 S2, §1.1.2, §5.3):
- New module: `builder/src/generators/swiftui/` — the ONLY new directory. Existing Flutter
  generators physically stay under `builder/src/generators/` (no `flutter/` subdir exists; do
  not create one, do not move anything).
- One generated SPM application package for V1 (no premature multi-package split, §5.3).
- S2 emits ONLY the skeleton: `Package.swift` + app entry (`@main` SwiftUI `App` + a hello View)
  + one trivial XCTest (e.g. asserts the hello text exists / a model value). The full
  Domain/Application/Data/Features/Navigation/Localization directory scaffold may exist as empty
  placeholder folders **only if** it does not break Gate A/B (Swift ignores empty dirs; do NOT
  ship empty `.swift` files that must compile — ship nothing that fails to build).
- IR keeps its shape. **No IR/schema change** in S2 — S1 already added `attributes.platform`.

## 2. Exact changes allowed in S2

### 2.1 `builder/src/generators/swiftui/` — the new target module

Follow the existing generator discipline: **pure `(IR, ctx) → string` functions, no I/O** (that
lives in `index.ts`). Mirror how the existing generators are organized — read
`builder/src/generators/` neighbors first (e.g. how `rule.ts`/`screen.ts` export named
`generateXxx(ir, ctx)` string functions) and reuse `builder/src/naming.ts` + `builder/src/dart.ts`
helpers where they are genuinely target-agnostic (e.g. `pkgName`, `fileName`, `camelize`); add
Swift-specific naming helpers ONLY if truly needed, and keep them additive.

Minimum files (names are suggestions — the module may organize differently, but the deliverables
below must exist):

- `builder/src/generators/swiftui/swift_package.ts` (or `package.ts`)
  → `generatePackageSwift(ir): string`. MUST emit (correction 3, §5.1.1):
  ```swift
  let package = Package(
      name: "<AppName>",
      platforms: [
          .iOS(.v17)
      ],
      products: [ .library(name: "<AppName>", targets: ["<AppName>"]) ],
      targets: [ .target(name: "<AppName>"), .testTarget(name: "<AppName>Tests", dependencies: ["<AppName>"]) ]
  )
  ```
  `<AppName>` = the IR app/feature name, Swift-identifier-safe (reuse the existing naming helpers
  to derive it; document which helper — e.g. `pkgName(ir.name)` or a PascalCase pass).
- `builder/src/generators/swiftui/app.dart`-analogue, e.g.
  `builder/src/generators/swiftui/app_entry.ts` → `generateAppEntry(ir): string` — a `@main`
  SwiftUI `App` struct + `WindowGroup` presenting the hello view.
- `builder/src/generators/swiftui/hello_screen.ts` (or `views.ts`) →
  `generateHelloScreen(ir): string` — a minimal SwiftUI `View` showing the app name + a friendly
  hello line. Use `@Observable`/`@State` only if natural for the skeleton (recommendation §4.2);
  a plain `struct HelloView: View` is sufficient for S2.
- `builder/src/generators/swiftui/swift_tests.ts` → `generateSwiftTests(ir): string` — one
  XCTest that compiles and passes (asserts hello content / a trivial model value; nothing
  platform-bridging).
- `builder/src/generators/swiftui/index.ts` (module barrel) exporting a single
  `generateSwiftUITarget(ir, ctx): SwiftUIProject` where `SwiftUIProject` is a small interface
  like `{ files: { path: string; content: string }[] }` (relative to `outDir/ios/`). This is the
  only entry `index.ts` calls. **Keep the surface minimal and typed.**

Swift-arch discipline from the start (§6.3): even in the skeleton, Domain-facing code must not
import SwiftUI/UIKit; the hello View is a Features/presentation concern. A skeleton has little
domain — but do not put `import SwiftUI` in any file that models data.

### 2.2 `builder/src/index.ts` — wire the swiftui branch (replace the throw)

At the S1 dispatch (lines ~726-732), replace the throw with a real emission path that satisfies:

- **Single composition root, I/O confined here.** In `generateApp`, when `isSwiftUI(ir)`:
  call `generateSwiftUITarget(ir, ctx)` and write each returned file under
  `path.join(outDir, "ios")` (relative paths from the module — e.g. `Package.swift`,
  `Sources/<AppName>/App.swift`, `Tests/<AppName>Tests/<AppName>Tests.swift`). Do NOT touch any
  Flutter file-writing path.
- **Keep the Flutter branch byte-identical.** The `flutter` path (registry loop,
  `writeSingleFeatureApp`/`generateMultiFeatureApp`) must not be edited at all — verify with a
  pre/post diff (brief §4).
- **Determinism:** the generated SwiftUI output must be deterministic (same IR → byte-identical
  files). Do not embed timestamps/absolute paths. If you need a target/version identity in the
  generated header, extend `GenContext` additively (`builder/src/gen_context.ts`) with an
  optional `target` field; do NOT thread a new required argument through existing generator
  signatures.
- **Headers:** emitted Swift files carry the same generated-file contract — header comment
  `// [generated] generator=… ownership=generated` (mirror the existing Dart header style, §
  DESIGN.md; check the exact string in an existing generated file and reuse it with a Swift
  comment marker). Do not claim `origin`/attestation that does not exist — a skeleton has no
  LLM-inferred content.
- **Return shape:** `generateApp` must still return `GenerateResult` (`{ outDir, fileCount,
  scoring, conflicts }`). For swiftui in S2, `fileCount` = number of emitted ios/ files; define
  `scoring`/`conflicts` sensibly (empty/minimal) and document the choice in a comment.
- **Gate A/B need the package on disk.** Since `main()` is `index.ts <ir> <out>`, ensure the
  ios/ files land in `<out>/ios/` so the verification commands below work. If `main()` has an
  exit path that rethrows, keep the loud-failure behavior for any unexpected error (never a
  silent partial success).

### 2.3 `builder/src/validate.ts` — Swift gates (additive, do NOT weaken anything)

S2 adds (guard with `isSwiftUI(ir)` so Flutter validation is untouched):

- **`[swiftpkg]` gate:** generated `Package.swift` must exist and must contain the literal
  `platforms: [\n .iOS(.v17)` declaration (correction 3). Regex on the file; report
  `[swiftpkg] Package.swift missing or missing .iOS(.v17) platform declaration`.
- **`[swiftarch]` gate (§6.3):** walk emitted `.swift` files; fail if a Domain-layer file
  imports SwiftUI/UIKit, or if any file outside Features/presentation does. In S2 the skeleton's
  layer split is trivial — implement the check now (mirror `archCheck` in validate.ts, additive),
  even if it has little to catch yet. Keep it strict: a skeleton must already pass it.
- **`[swiftdeterminism]`:** regenerate the swiftui output a second time and diff (only when
  target is swiftui). Additive, same pattern as the existing determinism gate.
- Counters + result wiring: follow the existing `[platform]` S1 pattern (`issues.push`, counter
  into the counts object). Do not renumber existing counters.

### 2.4 Verification gates (owner-mandated, §6.4)

These run on the generated `out/ios/` package. In S2 they are manual verification steps the
implementer runs and reports verbatim — do NOT add a CI integration yet (out of scope):

**Gate A — host package build:**
```bash
cd <out>/ios
swift build
swift test
```

**Gate B — iOS target build (pinned destination; do NOT derive from the booted simulator, §6.4):**
```bash
cd <out>/ios
xcodebuild build -scheme <AppName> -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.0'
```
(Ground truth: Xcode 26.3/17C529, Swift 6.2.4, iOS Simulator 26.2 SDK; runtimes iOS 18.2 + 26.0;
iPhone 17 Pro udid `CE624581-1C24-4D39-A87C-12FDE9481637`.) If the pinned destination is
unavailable in the current simulator list, surface the discrepancy explicitly in the report
(device/runtime names must come from `xcrun simctl list devices available`, verbatim) rather than
silently picking another device.

Gate B is the real "iOS app builds" claim — `swift build` alone is NOT sufficient (correction 2).
If Gate B cannot run (no simulators), say so explicitly and leave it as the S2 open item.

## 3. What S2 must NOT touch (hard constraints)

- No edits to any existing `builder/src/generators/*.ts` file (the Flutter generators).
- No edits to `builder/schemas/*.schema.json`, no IR/schema additions.
- No `targets[]` key; no multi-target anything (§3.1.1).
- Do NOT move/rename the Flutter generators; no `builder/src/generators/flutter/` directory.
- Do NOT add `@Model`/SwiftData/`ModelContainer` anywhere in S2 (persistence is S11; IR must
  never gain SwiftData concepts, correction 5).
- Do NOT implement CRUD/navigation/rules/persistence/list screens (S3+).
- No deletes. No commits unless the orchestrator/owner explicitly asks.
- Do NOT touch the S1 files' Flutter-side behavior: `operations.ts` `targetOf`/`isSwiftUI` stay
  as-is; `types.ts` `platform`/`GenerationTarget` stay as-is.

## 4. Verification (run in repo root; all must pass before reporting done)

```bash
# 1. Typecheck
npx tsc -p builder/tsconfig.json --noEmit

# 2. Flutter path byte-identical (prove zero Flutter drift):
npx ts-node --transpile-only builder/src/index.ts apps/tasks/input/tasks.ir.json /tmp/s2_flutter_a
npx ts-node --transpile-only builder/src/index.ts apps/tasks/input/tasks.ir.json /tmp/s2_flutter_b
diff -r /tmp/s2_flutter_a /tmp/s2_flutter_b && echo "FLUTTER DETERMINISTIC"
# (optional) diff /tmp/s2_flutter_a against the pre-S2 committed app dir to confirm shape.

# 3. SwiftUI target smoke:
#    Create a minimal probe IR under apps/*/output/qa/ (see rule below) or reuse a committed IR
#    with attributes.platform="swiftui" added via node. Then:
npx ts-node --transpile-only builder/src/index.ts <probe>.ir.json /tmp/s2_out
find /tmp/s2_out/ios -type f | sort        # expect Package.swift + Sources + Tests
npx ts-node --transpile-only builder/src/validate.ts <probe>.ir.json /tmp/s2_out
#    expect [swiftpkg] PASS, [swiftarch] PASS, [swiftdeterminism] PASS, [platform] PASS

# 4. Gate A
(cd /tmp/s2_out/ios && swift build && swift test)

# 5. Gate B (pinned destination) — as far as the environment allows; report verbatim.

# 6. SwiftUI determinism:
npx ts-node --transpile-only builder/src/index.ts <probe>.ir.json /tmp/s2_out2
diff -r /tmp/s2_out/ios /tmp/s2_out2/ios && echo "SWIFTUI DETERMINISTIC"
```

Probe-IR rule (AGENTS rule 11): any scratch/probe file you create must be saved under the repo —
put the swiftui probe IR at `apps/tasks/output/qa/s2_probe.ir.json` (additive; copy a committed
IR and set `"platform":"swiftui"` under `attributes`). No throwaway work in `/tmp` without a repo
copy.

## 5. Deliverable back to orchestrator

Report back:
1. Exact file-by-file diff for `builder/src/` (paths + what + why, with §/correction cites).
2. The full generated `ios/` tree listing + the exact `Package.swift` content.
3. Verification output verbatim: typecheck, Flutter determinism diff, SwiftUI determinism diff,
   validate gates, Gate A (`swift build` + `swift test`), Gate B (`xcodebuild`), including the
   `xcrun simctl list devices available` evidence used to pin the destination.
4. Any surprise (e.g. SPM quirks for a library-only product vs an app executable, whether the
   package product should be an executable for Gate B — decide and justify; §5.1 shows a library
   product and Gate B uses `xcodebuild -scheme <AppName>`; if an executable product is required
   for a SwiftUI app to launch, state the correction needed and keep the deliverable compiling).
5. Confirm zero edits to existing `builder/src/generators/*` and `builder/schemas/*`.

## 6. Next slices (context only — do NOT build in S2)

S3 list screens → S4 detail/CRUD form → S5 wizard → S6 l10n/RTL → S7 rules/verdicts (generated
Swift RuleModel, oracle parity) → S8 auth/tenant → S9 split/budget → S10 audit/export →
S11 persistence (SwiftData adapter) → S12 attachment/OCR → S13 outbox/sync → S14 e2e parity.
Ground truth §17 gap analysis, §18 SPM shape; slice plan requirements §7.