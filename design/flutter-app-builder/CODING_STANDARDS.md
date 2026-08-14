# Flutter App Builder — Compiler Coding Standards (`builder/`)

*Applies to `/Users/username/Documents/cto/flutter_generator/builder/`. Grounded in DESIGN.md §2 (IR), §3 (generation classes), §6 (generator contract + purity), §11 (ownership), §14 (validation). Verified against the current codebase, not written from the design alone — file:line citations point at real code, including things it already does right and things it doesn't.*

---

## 1. Architecture standards (load-bearing invariants)

These are not style preferences. Each one is a control that makes a specific DESIGN.md guarantee actually true. Violating one doesn't produce ugly code — it makes a claim in DESIGN.md false.

**A1. Generator purity.** Every function in `src/generators/*.ts` has the signature `(IR fragment, ...) → string` (or `GeneratedFile[]` once that type exists). No generator imports `fs`, `path`, `child_process`, or performs any I/O, network call, `Date.now()`, or `Math.random()`. All file writes happen in exactly one place: `src/index.ts`. **This is currently true** — verified by reading every file in `src/generators/`; none imports `fs`/`path`. Treat this as a regression to prevent, not a gap to fix.

**A2. Registry-based dispatch (OCP).** `src/index.ts` currently dispatches generators via six separate hardcoded `for` loops (`index.ts:41-74`) — one block per artifact type, each hand-written. Adding a `RouteGenerator` means editing `main()` again. This violates the requested invariant directly: a registry (`artifactType → { schema, generator, outputPath }`) must replace the loop-per-type structure so the dispatch core is closed for modification. See §4.1.

**A3. Determinism.** Output is a pure function of `(IR + GenerationContext)`. Concretely: no `Date.now()`/`new Date()` in generated content, no reliance on `Object.keys()`/`Map` iteration order for anything that affects output text, no reliance on filesystem read order. **The existing code already follows the safe pattern in the two places it matters**: `entity.ts:13-22` and `model.ts:84-96` both build import lists via `Array.from(new Set(...)).sort()` — dedup via `Set`, then an explicit `.sort()` before emission. This is the *required* pattern for any future generator that collects a set for emission — codify it, don't leave it as an accident of two files.

**A4. Metadata header on every emitted file.** Every generated file's first line(s) must declare `generator=`, `template=`, `class=`, `ownership=`. **Currently inconsistent** — see §4.3 for the exact gap (one generator emits zero header, three others emit a shorter header than the rest).

**A5. Schema validation before generation — no generator trusts raw JSON.** Every IR fragment passed into a generator must have already passed Ajv validation against its schema. **Currently false for 3 of 6 artifact types.** `schemas/` contains exactly 3 files (`entity`, `enum`, `valueobject`). `index.ts:65-68` (repositories) and `index.ts:71-74` (states) call their generators directly on raw `ir.repositories`/`ir.states` entries with **no `check()` call at all** — contrast with `index.ts:42/47/52`, which do call `check()` for enum/valueObject/entity. `generateModel` (`index.ts:58-62`) is in the same position: there is no `model.schema.json` and no validation call before `ir.models` entries are read. This is the most important architecture gap in the codebase because it's not hypothetical — it's the literal current state of three of six generators.

**A6. Layering — generators depend on the IR only, never on each other's output, via a resolved symbol table.** Cross-references (`Field.of`, `RepositoryModel.entity`, `ModelModel.entity`) are currently resolved by ad hoc string matching scattered per call site — `index.ts:59` does a linear `.find()` over `ir.models` inline; `dart.ts:68-72` (`entityByName`) is the only real symbol-lookup helper and it covers *only* entities, not repositories/models/states/enums/VOs. No generator validates that a referenced name (e.g. `f.of` in `model.ts:10,12,60-63`) actually exists in the IR before emitting an import to it — a typo in `of` silently produces a working-looking generator run and a broken `flutter analyze` on the *output*, days later. Required: one `SymbolTable` built once after validation, exposing `resolve(kind, name) → element | throws`, used by every generator instead of inline `.find()`/direct array access.

**A7. Ownership regions.** Not yet exercised by the current codebase (no scaffold/user-region content is emitted anywhere yet — `state.ts:84` has a `// [user] region:user` comment inside a Cubit method body, which is the *only* place this exists today). Rule for when regen/scaffold work starts: user-owned regions are marked with the DESIGN.md §11.1 anchor-comment convention at declaration level, never inline, and no generator overwrites a region without a content-hash check first. Not a current violation — a placeholder rule for the next phase, included here so it's written down before the second scaffold-emitting generator is built inconsistently.

---

## 2. Coding standards

**Naming**
- Generator functions: `generate<ArtifactName>` (PascalCase artifact, e.g. `generateEntity`, `generateRepository`). This is already 100% consistent across the codebase — keep it as a hard rule, not just an observed pattern.
- Generator modules: `src/generators/<lowercase-artifact>.ts`, one module per **artifact class** (not necessarily one output file — `project.ts` legitimately emits four related project-shell files from one module, which is fine: it mirrors DESIGN.md's own grouping of Localization/Theme/Config as one generator class). Don't split a module just to get to one-function-one-file; split when the artifacts are genuinely different classes.
- IR types: `<Name>Model` suffix (`EntityModel`, `RepositoryModel`, `StateModel`, `ValueObjectModel`). **One existing violation**: `types.ts:70` names the DTO-override type `ModelModel` — a confusing double-"Model" name for what DESIGN.md calls the "DTO/Model" artifact. Rename to `DtoOverrideModel` or `ModelOverrideModel` before more code depends on the name.
- Schema files: `schemas/<name>.schema.json`, where `<name>` is exactly the string passed to `loadSchema(n)` in `index.ts:21-27`. Keep schema id and IR-type name in lockstep — a schema for `RepositoryModel` is `schemas/repository.schema.json`, loaded as `validators.repository`.
- Dart identifiers (file names, class names derived from IR names): **never** inline string transforms (`.toLowerCase()`, ad hoc concatenation). Always go through the shared helpers in `dart.ts`. See §4.2 — this rule is stated in the design brief and is *currently violated* in most call sites, not just a hypothetical to guard against.

**File/folder layout** — current layout is correct, keep it:
```
builder/
├── schemas/*.schema.json     # one per validated IR type
├── src/
│   ├── types.ts              # IR types — no logic
│   ├── dart.ts                # shared, pure Dart-emission helpers — no IR-shape-specific logic
│   ├── generators/<artifact>.ts
│   └── index.ts               # the ONLY file allowed to import fs/path
```
Add: `src/registry.ts` (§4.1), `src/symboltable.ts` (A6), `src/errors.ts` (structured pipeline errors, see below).

**Import discipline** (already true, make it enforced not incidental): a file in `src/generators/*.ts` may import from `../types` and `../dart` only. It may never import from `../index`, from another file in `src/generators/`, or from `fs`/`path`/`child_process`. Verified true today for all six generator files — write the lint rule now so the next contributor doesn't break it.

**Error handling — fail fast, structured, no bare exceptions.** The pipeline already has one good pattern (`index.ts:29-34`, the `check()` helper: `[validator] label: INVALID` + all Ajv errors + `process.exit(1)`). That pattern is the *only* acceptable shape for a pipeline-level failure, and it must be applied everywhere a fallible operation happens — currently it is not: `index.ts:18` (`JSON.parse(fs.readFileSync(irPath))`) and `index.ts:21-22` (schema file load) throw raw, unlabeled Node errors on a missing/malformed file. Inside generators, `model.ts:65` and `dart.ts:70` already throw labeled errors (`[model] unsupported field type...`, `[symbol] unknown entity...`) — that `[stage] message` convention is correct and should be the mandatory shape for every `throw` in the codebase, generators included.

**TypeScript strictness.** There is currently **no `tsconfig.json` and no `package.json`** anywhere in `builder/` (verified: `find . -iname "package.json" -o -iname "tsconfig*.json"` returns nothing). The documented run command (`README.md`) is `npx ts-node --transpile-only builder/src/index.ts ...` — `--transpile-only` **skips type-checking entirely**, so even the loosest default TS settings aren't enforced today, let alone strict mode. This is a foundational gap, not a nice-to-have: exhaustiveness bugs like the two below are currently invisible until runtime.

---

## 3. Linting rules (machine-checkable)

| # | Rule | Why (principle) | How to check | Pass/fail test |
|---|---|---|---|---|
| L1 | No `fs`/`path`/`child_process` import outside `src/index.ts` | A2/A1 — I/O confined to the pipeline | `grep -rn "require('fs')\|from \"fs\"\|from 'fs'\|require('path')\|from \"path\"\|from 'path'" src/generators/ src/dart.ts src/types.ts` | Fail if grep matches anything outside `src/index.ts` |
| L2 | Every entry in the artifact registry has a matching schema file | A5 — no generator trusts raw JSON | Script: for each key in `registry.ts`'s map, assert `schemas/<key>.schema.json` exists | Fail if any registered artifact type has no schema on disk |
| L3 | Every artifact loop in `index.ts` calls `check()` (or its registry-driven successor) before invoking a generator | A5 | AST check (ts-morph) or, until the registry lands, grep: for each `generate<X>(` call site in `index.ts`, a `check(` call must appear on an earlier line in the same block | Fail on `index.ts:65-68` and `:71-74` today — this rule currently fails and should stay red until §4 item 2 lands |
| L4 | No `Set`/`Map`/`Object.keys()` iteration result is used in generated output without an explicit `.sort()` (or equivalent deterministic ordering) between collection and emission | A3 — determinism | grep for `new Set(` / `Object.keys(` / `.entries()` in `src/generators/*.ts` and `src/dart.ts`; each match must have a `.sort(` within the same expression chain or the next 2 lines | Fail if any match lacks a `.sort()` in scope |
| L5 | No `Date.now()`, `new Date()` (without a fixed injected value), or `Math.random()` anywhere under `src/generators/` or `src/dart.ts` | A3 | `grep -rn "Date.now()\|new Date(\|Math.random(" src/generators/ src/dart.ts` | Fail on any match |
| L6 | Every string returned by a `generate*` function begins with a header containing all four of `generator=`, `template=`, `class=`, `ownership=` | A4 | Script: run every exported `generate*` function against a minimal valid fixture, assert the first 1-2 lines match `^(//|#) \[generated\] generator=\S+ template=\S+ class=\S+ ownership=\S+` | Fail today on `generatePubspec` (`project.ts:8-32`, no header at all) |
| L7 | Every generated Dart file's header is exactly 2 lines: metadata line + `// Do not hand-edit this file; regenerate from IR.` | A4, consistency | Same fixture-run approach as L6, check line 2 | Fail today on `generateMain`, `generateBarrel`, `generateWidgetTest` (`project.ts:51-52, 91-92, 98-99` — each is 1 line, missing the do-not-edit line) |
| L8 | No inline `.toLowerCase()` (or any ad hoc case transform) used to derive a Dart file name or identifier — must call a named helper from `dart.ts` | Coding standards §2, "no bare string concatenation for Dart identifiers" | `grep -rn "\.toLowerCase()" src/index.ts src/generators/ src/dart.ts` then manually confirm each match is either inside `dart.ts`'s own helper definitions or absent elsewhere | Fail today — 15 matches outside `dart.ts` (`index.ts:43,48,53,60,66,72`; `project.ts:83,84,86,87,89,90`; `state.ts:57`; `repository.ts:34`) |
| L9 | `fileName()` (`dart.ts:19-21`) must convert PascalCase/camelCase to true `snake_case`, not merely lowercase the whole string | Correctness — a broken helper is worse than no helper, since it's silently wrong for any multi-word entity name | Unit test: `fileName("ExpenseCategory") === "expense_category.dart"` | Fails today — current implementation returns `"expensecategory.dart"` |
| L10 | Exactly one definition of `capitalize()` in the codebase | DRY / single source of truth | `grep -rn "function capitalize" src/` — must return exactly 1 match | Fails today — 2 matches (`dart.ts:15-17`, `repository.ts:3-5`) |
| L11 | Every `switch` over a closed union type (`OperationKind`, `Invariant["kind"]`, `PrimitiveType`, etc.) in `src/generators/` and `src/dart.ts` has either a `default` branch that throws a structured `[stage] unhandled <X>` error, or is proven exhaustive via a `never`-typed assertion helper | Fail-fast; prevents a future union-member addition from silently returning `undefined` into generated Dart | `tsc --strict` with `noImplicitReturns: true` once `tsconfig.json` exists (L15); until then, grep every `switch (` in those dirs and manually confirm a `default`/exhaustiveness guard | Fails today on `repository.ts:7-18` (`returnType`) and `valueobject.ts:11-21` (`invariantAssert`) — both have no default case |
| L12 | Ajv is constructed with `strict: true` (or a specific, comment-justified narrower relaxation — never a blanket `false`) | Trust-boundary rigor (§9.1/§14.1) — a loosely-configured validator is a weaker trust boundary than the schema implies | `grep -n "new Ajv(" src/index.ts` — assert the options object does not contain `strict: false` without an adjacent `// justified:` comment | Fails today — `index.ts:20` is `new Ajv({ allErrors: true, strict: false })` with no justification comment |
| L13 | Every `throw` in `src/` uses the `[stage] message` structured format | Error-handling standard | `grep -rn "throw new Error(" src/` then check each matched string starts with `` `[`` | Fails today at `index.ts:18` and `index.ts:21-22` implicitly (unwrapped `fs.readFileSync`/`JSON.parse`, not a `throw` site itself but an unguarded fallible call with no try/catch wrapper producing a structured message) |
| L14 | No file under `src/generators/` imports from another file under `src/generators/`, or from `../index` | A6 layering | `grep -rn "from \"\.\./generators\|from '\.\./generators\|from \"\.\./index\|from '\.\./index" src/generators/` | Pass today (0 matches) — keep it that way with a CI check, not just a memory |
| L15 | `tsconfig.json` exists at `builder/` root with `"strict": true`, `"noImplicitReturns": true`, `"noUncheckedIndexedAccess": true`; the documented/CI run command invokes `tsc --noEmit` (or `ts-node` **without** `--transpile-only`) before any generation run | Coding standards §2, TypeScript strictness | File existence + `grep` for the three flags; CI step that runs `tsc --noEmit` and fails the build on any error | Fails today — file doesn't exist |
| L16 | Every IR cross-reference (`Field.of`, `RepositoryModel.entity`, `ModelModel.entity`) resolves to a real element in the loaded IR before any generator runs | A6, correctness | Post-validation, pre-generation pass: walk every declared reference field, look it up in the `SymbolTable`, collect all unresolved references, fail with one `[symbol]`-prefixed message per dangling reference | Not yet implementable (no `SymbolTable` exists) — write the test first (`resolves valid refs`, `rejects a typo'd Field.of`), then build to green |

---

## 4. Minimal refactor to compliant

Ranked by (impact to correctness/architecture) ÷ (cost to fix). Do these **before** writing a seventh generator — every one of them gets more expensive the more generators exist that need to be migrated.

1. **Close the schema-validation gap for repository/model/state** (A5, L2, L3). `index.ts:65-68` and `:71-74` currently call generators on unvalidated IR. Write `repository.schema.json`, `state.schema.json`, `model.schema.json`, add them to the `validators` map (`index.ts:23-27`), add `check(...)` calls matching the existing pattern at `index.ts:42/47/52`. This is the single highest-priority item — it's the literal gap between "0% LLM, fully trusted" as designed and what the code does today.

2. **Introduce the generator registry** (A2). Replace `index.ts:41-74`'s six hardcoded loops with one table-driven loop: `{ irKey: "entities", schema: "entity", generate: generateEntity, fileName: (e) => fileName(e.name) }[]`, iterated once. This is what makes L2/L3 self-enforcing (a registered artifact type *can't* skip validation, because the loop does it uniformly) and is the prerequisite for adding any new generator without touching `main()`.

3. **Fix `fileName()` and make every call site use it** (L8, L9). Two-part fix: (a) rewrite `dart.ts:19-21` to do real PascalCase→snake_case conversion (a proper word-boundary regex, not `.toLowerCase()`); (b) replace all 15 inline `.toLowerCase()` call sites (`index.ts:43,48,53,60,66,72`; `project.ts:83-90`; `state.ts:57`; `repository.ts:34`) with calls to `fileName()`. This is a live, present-tense bug for any multi-word entity name (e.g. `ExpenseCategory` → `expensecategory.dart`, which won't match what `import` statements elsewhere expect once real multi-word IR names show up) — fix it before the sample IR grows past single-word entity names and the bug becomes load-bearing.

4. **Create `tsconfig.json` + `package.json` with strict mode, and stop running via `--transpile-only`** (L15). Currently zero type-checking happens on any run. This is cheap (an afternoon) and is what turns L11's exhaustiveness rule from "a thing you grep for" into "a thing the compiler enforces for free."

5. **Deduplicate `capitalize()`** (L10). Delete `repository.ts:3-5`, import `capitalize` from `../dart` instead. Five-minute fix, but do it before a third copy appears.

6. **Add `default`/exhaustiveness handling to `returnType` (`repository.ts:7-18`) and `invariantAssert` (`valueobject.ts:11-21`)** (L11). Both currently return `undefined` silently if the union type grows without the switch being updated — with `noImplicitReturns` from item 4, these become compile errors instead of runtime `undefined`-in-generated-Dart bugs.

7. **Fix the header gap** (L6, L7): add a header to `generatePubspec` (`project.ts:8-32` has none), and add the missing "Do not hand-edit" second line to `generateMain`/`generateBarrel`/`generateWidgetTest` (`project.ts:51-52, 91-92, 98-99`) to match the two-line pattern every other generator already uses.

8. **Justify or remove `strict: false` on the Ajv constructor** (L12, `index.ts:20`).

9. **Build the `SymbolTable` module** (A6, L16). Larger than the above — do it after items 1-2 land, since the registry refactor is a natural place to also centralize IR-loading and hand the resulting symbol table to every generator, rather than doing this refactor twice.

10. *(Low priority, note only)*: `README.md`'s documented run command writes to `builder/generated`; `index.ts:16`'s actual default `outDir` is `builder/output/rasheed_replica`. Pick one and fix the other — currently anyone following the README literally gets a different output location than what a bare `node index.ts` with no args produces.
