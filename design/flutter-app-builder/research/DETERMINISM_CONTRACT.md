# DETERMINISM CONTRACT — the plan/gen-context is 100% IR-derived (S-CTX)

> Owner doc (S-CTX, 2026-08-17). Resolves grills **C1** ("'ctx' is undefined; the determinism
> invariant is a tautology") and **C15** ("an LLM-authored plan recurses nondeterminism") by turning
> an already-true fact into a *written* invariant with a *standing check* (`[plan-determinism]`).
> Cited by section number from other docs.

## 1. What this contract bounds

Everything between the IR and the generated files that is **decision-shaped and recorded as data**:

| Artifact | Type | File |
|---|---|---|
| `GenContext` | in-memory, per-run | `builder/src/gen_context.ts:13-24` |
| `GenerationPlan` (`plan.json`) | serialized to `<out>/plan.json` | `builder/src/plan.ts:26-40` |

Both must be a **pure, transitive function** of the IR (plus pinned generator/schema versions).
Nothing else — no wall clock, filesystem reads for *content*, network, environment, randomness,
mutable process state, or LLM/model output may influence them. (Filesystem *writes* — writing
`plan.json` itself — are I/O performed after the value is computed, not an input to it.)

## 2. Field-by-field derivation map

### 2.1 `GenContext` (`gen_context.ts:18-24`)

| Field | Derived by | Pure? | Notes |
|---|---|---|---|
| `pkg` | `pkgName(ir.name)` (`index.ts`) | ✔ | string template over IR name |
| `symbols` | `buildSymbols(ir)` + per-feature, + auth/budget/attachment symbol seeding | ✔ | static maps; see `index.ts:918-971` |
| `ir` | the validated IR itself | ✔ | passed through, never mutated |
| `sm` | `decideArchitecture(ir).stateManagement` (`arch.ts:42`) | ✔ | §2.2 |
| `search` | `searchTargets(ir)` (`composition.ts:173`) | ✔ | §2.3 |

### 2.2 `GenerationPlan.scoring` (`plan.ts:31`, written `index.ts:741`)

`{ stateManagement, di, routing, persistence, coupledPair, complexity }` all come from
`decideArchitecture(ir)` (`arch.ts:42`) → `scoreApp(ir)` (`scoring.ts:108`) →
`computeInputs(ir)` (`scoring.ts:53`). Pure.

Per-state strategy (`perStateStrategy`, plan entry `strategy`) comes from
`scoreStateStrategy(s, ir)` (`scoring.ts:172`) — since M4a, decided **purely from declared IR
semantics** (a matching `stateMachines` entry with events+transitions), no constants
(`SPIKE_M4_REPORT.md`, `scoring.ts`).

### 2.3 `GenerationPlan.patterns.shell` (`composition.ts:111` `shellFor`, written `index.ts:745`)

`features.length <= 1` → `null` (omitted from plan.json). `2..5` → `ShellPattern` with branches
derived as: `featureId = f.name`, `title = entityPluralTitle(root.entity)`,
`icon = shellIconFor(f.name)` (fixed stem map, `composition.ts:79-94`), `rootPath =
screenPath(mergedScreens, root)`. **Order = `features[]` order** (no sort, no inference).
`> 5` → generation-time throw. Pure; `feature` is stripped from each destination before
serialization (`index.ts:745`).

### 2.4 `GenerationPlan.patterns.search` (`composition.ts:173` `searchTargets`, re-keyed `index.ts:723`)

Per list screen: `enabled` iff list screen + repo with `list` + declared
`entity.primaryDisplayField` resolving to a String field; `mode` fixed `"contains"`.
Keyed by screen **path** (`screenPath`) in plan.json; by name in `ctx.search`. Pure.

### 2.5 Everything else in `plan.json`

`entry.*` (`artifact/generator/schema/layer/file/strategy/dependsOn/mode/class`) are pure
functions of IR items + `tagForIrKey`/`dependsOnFor`/`validatePlanReferences` (`plan.ts`).
`artifactCount` = `entries.length`. `schemaVersion`/`generatorVersion` = pinned constants.

## 3. Transitivity invariant (ChatGPT round-2 review #1)

"IR-derived" is **transitive**: every helper in the derivation closure of §2 must itself be pure —
no wall clock, filesystem *content* reads, network, environment, randomness, mutable process
state, or LLM/model output in *any* of: `naming.ts` (`entityPluralTitle`), `routing.ts`
(`screenPath`), `operations.ts` (`findRepoForEntity`), `composition.ts` (`shellFor`,
`searchTargets`, `shellIconFor`), `scoring.ts` (`scoreApp`, `computeInputs`, `scoreStateStrategy`),
`arch.ts` (`decideArchitecture`), `plan.ts` (all).

**Enforcement:** the `[plan-determinism]` validate gate re-generates the plan from the IR with the
real builder and diffs it against the `plan.json` on disk (see §4). A purity break in any helper —
an LLM call, a `Date.now()`, a random number, a content read — changes the regenerated plan
(across runs or vs the stored one) and fails the gate. Human hand-edits to `plan.json` are caught
the same way (they no longer match a fresh derivation). This is a *behavioral* proof
(regenerate-and-diff), not a static import scanner (proving *potential* impurity statically was
deferred — see `SPIKE_PLAN.md` S-CTX option E).

## 4. The `[plan-determinism]` gate

- Re-runs `generateApp(ir, freshTmp)` (the same composition root `index.ts` uses) and diffs
  `freshTmp/plan.json` against `<outDir>/plan.json`.
- Shares the existing `[determinism]` regeneration (`validate.ts:747`) — same single
  fresh generation per validate; additive, no extra generation.
- Fires on any byte difference (missing file, hand-edit, pure-dependency leak, LLM recursion).
- **Negative control proven** (M4a-era discipline): a hand-edited `patterns.shell` fails the gate —
  the gate is not vacuous.

## 5. Non-goals / out of scope

- Not a static purity scanner (option E, deferred).
- Does not change how the plan is built — only proves + guards it (S-CTX scope).
- `typography`: the *generated app code* determinism is separately guaranteed by `[determinism]`
- **L1 vs L2**: this contract bounds L1 (generator determinism — same IR + same generator →
  identical bytes). It does not cover L2 (build reproducibility — same source + same SDK/dependency
  lock → equivalent build output); see `FLUTTER_TOOLCHAIN.md` for that layer (S-HERMETIC).
  (lib/ byte-diff); this contract covers the decision layer (`plan.json`) specifically.