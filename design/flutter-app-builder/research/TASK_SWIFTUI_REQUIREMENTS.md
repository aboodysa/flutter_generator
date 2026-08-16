# Task: SwiftUI target — write REQUIREMENTS first (design doc, no code)

Repo: `/Users/username/Documents/cto/flutter_generator`. Do NOT commit generator changes.
This round is **research + requirements only**: deliver
`design/flutter-app-builder/research/SWIFTUI_REQUIREMENTS.md` (grounded, tokens-first,
additive — never delete). No code edits to `builder/src` this round.

## Objective
Write the requirements + target architecture to extend the deterministic Flutter App
Builder so the **same IR** can also generate a **native iOS SwiftUI app** ("minimum changes"
constraint: no forking the IR, no touching existing Flutter generators, keep the deterministic
0% LLM core, keep every validator gate and the trust boundary).

Current state (all committed): L1 money, L1b+MF1 multi-feature, L2 verdicts, MF4 split,
MF2 auth+roles+tenant, MF3 attachment+OCR, MF5 budget/quota, L3 audit+export, L4 l10n AR/EN
+RTL, MF6 outbox/sync, G2/G3/G5, UIX slices A-D, wizard(P8) in `state.ts`/`screen.ts`.

## What the doc MUST contain (numbered sections)
1. **Goal + non-goals** — why a second target; what v1 SwiftUI covers vs later.
2. **Tooling ground truth (VERIFY on this Mac, then cite command output)**:
   `xcodebuild -version`, `xcode-select -p`, `swift --version`,
   `xcrun simctl list devices available | head -20`. State what the verification
   gate for a generated SwiftUI app will be (build via xcodebuild / swift build, XCTest).
3. **Minimal-diff architecture** — additive `builder/src/generators/swiftui/` module chosen by a
   new IR knob (propose exact schema shape, e.g. `attributes.platform: "swiftui"` or
   `targets: ["flutter","swiftui"]`); explicit list of every file that must change in the
   existing tree (aim for: schema validator + index.ts dispatch + maybe a CLI flag — nothing
   touched in existing Flutter generators). Point out the single source of truth stays the IR.
4. **The hard mapping problems (research-grounded, recommend ONE each)**:
   - **Rule language (§19)** is emitted as Dart today (`rule.ts`). Swift needs a portable
     evaluator over JSON-serialized `RuleModel` (shared/interpreter) vs emitting Swift
     expressions. Recommend one, justify.
   - **State mgmt**: bloc/riverpod/get_it → SwiftUI `@Observable`/`@State` vs TCA. Recommend
     idiomatic minimal.
   - **Persistence**: drift/hive_ce/in-memory-web → SwiftData vs GRDB vs SQLite. Recommend.
   - **Navigation**: go_router → SwiftUI `NavigationStack` + route table. Sketch mapping.
   - **l10n/RTL**: AppStrings → String Catalog / Localizable.strings + leading-edge RTL.
   - **Capability parity matrix** L1-L4 + MF1-MF6 → Swift: Money→Decimal(+currency), enums,
     verdicts, split, auth/roles/tenant, attachment/OCR, budget, audit, export CSV/JSON,
     outbox/sync. Mark each **in-v1 / later / n/a** with a one-line reason each.
   - **Rule-vs-entity reachability, wizard (P8) steps, demo seeding** — what must map.
5. **Output shape** — SPM Package vs Xcode `.xcodeproj` (pbxproj generation burden): recommend
   one and the exact emit layout under a generated-app `ios/` folder (keep the existing
   Flutter outDir convention additive — `apps/<app>/output/ios/` or `output/app/ios/`?).
6. **Verification + gates** — deterministic diff (existing single-generation diff), validator
   gates unchanged, minimal Swift gates: analyze/build/test; no goldens (SwiftUI has none) —
   propose the leanest credible check (XCTest + build) that keeps the oracle gate mandatory.
7. **Slice plan (small commits)** — estimated slices numbered like prior work (S1 schema knob,
   S2 module skeleton emitting a hello screen, S3 list, S4 detail/form, S5 wizard, S6 l10n/RTL,
   S7 rules/verdicts, ...) each with its own verify step.
8. **Risks + open questions** — e.g. Apple platform constraint (macOS-only builds), simulator
   vs device, rule-eval divergence between Dart and Swift (dual implementation!), pbxproj
   churn, test budget. For each: mitigation.

## Ground-truth reading list (read before writing, cite section/file names)
- `design/flutter-app-builder/DESIGN.md` (esp. rule language §19, screens, §9.4 oracle, §25 roadmap)
- `builder/src/{types,schema,validate,index}.ts`; `builder/src/generators/{rule,state,screen,money,policy,split,auth,attachment,budget,audit,export,outbox,l10n,app,project}.ts`
- `builder/samples/tasks.ir.json` or `apps/tasks/input/tasks.ir.json` as the target demo IR
- `ROADMAP.md` (P9–P14 shape; note where SwiftUI fits vs P9 backend)

## Deliverable / report
Write the file, then report lean: file path, tooling ground truth verbatim, the 6
recommendations + one-line rationale each, parity matrix, slice plan, top 3 risks. No code.