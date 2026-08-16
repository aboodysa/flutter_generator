# S1 Implementation Brief — SwiftUI target: schema/platform knob

Status: **STARTED** — queued to claude (claude-flutter-grill) 2026-08-16.
Contract: `research/SWIFTUI_REQUIREMENTS.md` (§3.1, §3.1.1, §3.2, §3.3) — approved-with-corrections by owner.
Ground truth: `research/SWIFTUI_GROUND_TRUTH.md` (§1 tooling, §3 registry/dispatch, §8 operations.ts, §17 gap analysis, §18 SPM shape).

---

## 1. What S1 is

S1 is a **pure additive plumbing slice**. It introduces the optional IR knob that selects a
generation target, validates it, routes it at the composition root, and proves the Flutter path
stays byte-identical. **No SwiftUI code is generated in S1** — the `swiftui` target is dispatched,
then returns a clear not-yet-implemented exit until S2 builds the module.

Definition (requirements §3.1):
- `attributes.platform` is a **generation target**, not an application capability. It is consumed
  only by the composition root (`index.ts`) for target dispatch and by `validate.ts` for
  target-specific gates. **It never enters the runtime IR surface the generated app sees**; no
  rule, screen, or repository may branch on it.
- Allowed V1 values: `"flutter"` | `"swiftui"`. **Absent means `flutter`.**
- `targets[]` is RESERVED for a future multi-target mode (§3.1.1) — do NOT implement it, do NOT
  even add a `targets` key. V1 = exactly one target per invocation; do not conflate the two.

Compatibility rule (§3.2): **For every existing IR with no `attributes.platform`, generation must
remain byte-identical to the current Flutter output.** Existing Flutter generator modules,
templates, and validator semantics are NOT edited.

## 2. Exact changes allowed in S1 (each must land)

### 2.1 `builder/src/types.ts` — typed platform field (DONE, UNVERIFIED — begin here)

A pre-handoff edit is already applied. Confirm it, do NOT redo it:

```ts
// in interface AppAttributes (near outbox?, at ~line 171)
platform?: "flutter" | "swiftui"; // generation target, not a capability (§3.1)
```

and immediately after the interface:

```ts
export type GenerationTarget = NonNullable<AppAttributes["platform"]>; // "flutter" | "swiftui"
```

Verify by `grep -n "platform" builder/src/types.ts` → lines ~172 (`platform?: ...`) and ~175
(`GenerationTarget`). If for any reason the edit was not saved, apply it exactly as above.

### 2.2 Platform value constraint

`builder/src/schema.ts` does **not exist** in this repo. The 15 JSON schemas in
`builder/schemas/*.schema.json` are **per-model** (entity/state/screen/rule/…) and have no
application-level schema. App-level attributes (budget, locale, outbox, auth) are validated the
way `operations.ts` predicates are — e.g. `hasBudget`, `hasOutbox`, `hasLocale` — plus runtime
gates in `validate.ts`.

Therefore: implement the platform constraint exactly like the existing app-attribute precedent —
**do not fabricate a new `application.schema.json`**, and do not touch any of the 15 per-model
schemas. Concretely:

1. Add a small predicate in `builder/src/operations.ts` (mirror `hasLocale`/`hasOutbox` style):
   `export function targetOf(ir: any): GenerationTarget` — returns
   `ir.attributes?.platform ?? "flutter"`, and is the **single canonical read** for target.
   Also `isSwiftUI(ir: any): boolean` as `targetOf(ir) === "swiftui"`.
2. The `GenerationTarget` type import must come from `./types` and be used by `targetOf`.

Sanity-check precedent first: read `builder/src/operations.ts` around `hasLocale` and `hasOutbox`
and copy their defensive shape (`ir.attributes?.... ?? default`). If operations.ts predicates do
not take arbitrary `ir`, keep the helper tiny and local — but it must be importable by both
`index.ts` and `validate.ts`.

### 2.3 `builder/src/validate.ts` — platform value gate (additive; existing gates unchanged)

Add a gate early in the pipeline that reports `[platform]` issues. It must:

- Accept any `platform` value not in `{ "flutter", "swiftui" }` → issue
  `[platform] attributes.platform="<val>" must be "flutter" or "swiftui" (absent=flutter)`.
- Accept absent → `flutter` (no issue).
- NOT weaken or alter any existing gate (`[oracle]`, `[money]`, `[verdict]`, `[split]`, `[secret]`,
  `[idiom]`, `[arch]`, `[determinism]`, `[tenant]`, `[attachments]`, `[budget]`, `[audit]`,
  `[export]`, `[locale]`, `[outbox]`, `[fidelity]`). The suite must stay green on existing IRs.
- Follow the existing issue-string + count pattern (e.g. `issues.push(...)` and a counter), and
  be wired into the same result object the CLI and HTTP pipeline share (find where the other
  gates' counters land — likely `counts` — by reading the tail of `validate.ts` where issues are
  aggregated and printed).

Prefix the fix in a comment with a requirements cite, e.g.
`// S1 (§3.1): platform=generation target; absent=flutter`.

### 2.4 `builder/src/index.ts` — target dispatch at composition root (additive)

- In `main()` (CLI) AND in whatever entry the HTTP pipeline uses (`server.ts` calls into
  `generateApp`/`writeCore`), resolve the target ONCE at the composition root:
  `const target = targetOf(ir);` and log it (e.g. `[target] flutter` / `[target] swiftui`).
- `flutter` (default) → current path, byte-identical. **Do not rebind or rename the registry.**
- `swiftui` → log
  `[swiftui] target S2: builder/src/generators/swiftui/ not yet implemented` and return a
  non-zero / explicit failure (`process.exitCode = 1` style, or throw a clear Error — pick the
  pattern `main()` already uses for invalid input) so a caller can never mistake "nothing
  generated" for success.
- **Do NOT** create `builder/src/generators/swiftui/` yet (that is S2). Refer to the path only.
- Read `builder/src/gen_context.ts` first — currently `GenContext` has `pkg/symbols/ir/sm` only
  (line ~7-16). Requirements §3.3 item 6 is conditional ("if required by the current context
  implementation"). In S1 it is NOT required — target dispatch happens before generation and the
  Flutter generators never see the target. **Leave gen_context.ts unchanged in S1.** (Revisit in
  S2, when the SwiftUI context needs its own identity.)
- Same for `builder/src/pipeline.ts` (§3.3 item 5: "only if the existing pipeline needs an
  explicit Swift build/test phase") — S1 does NOT need it. Leave pipeline.ts unchanged.

### 2.5 Header/determinism parity for dispatched runs

Even though `swiftui` fails before generating in S1, keep this invariant now so S2 inherits it:
`[generated]` header ownership is `ownership=generated` (children's header rule) — when the
SwiftUI module lands, its own `build`/`test` emerge later. In S1 nothing new is generated, so no
header changes are needed. Do not add SwiftUI-oriented headers anywhere yet.

## 2.6 Clean code + SOLID (owner requirement — applies to every line you write)

The owner explicitly requires: **"make sure code is clean and solid principles."** This repo's
contract (AGENTS.md rule 7) binds all new code to SOLID. For S1 this means:

- **Single Responsibility:** one module = one concern. `targetOf` lives in `operations.ts`; the
  gate lives in `validate.ts`; dispatch lives in `index.ts`. Do not make `index.ts` also validate,
  or `validate.ts` also dispatch.
- **Open/Closed:** every existing behavior stays untouched (see §3 hard constraints). S1 is
  purely additive — no editing existing generator/template/validator logic.
- **Interface Segregation:** depend on the narrowest types. `targetOf(ir)` takes the full IR
  only because that's what app-attribute predicates already do — do not widen any existing
  signature to thread a target through.
- **Dependency Inversion:** depend on types, not I/O. `operations.ts` stays a pure predicate
  module (no fs/child_process); `index.ts` stays the only I/O composition root.
- **Clean code, concretely:**
  - Follow the existing naming/style of the file you edit (look at neighbors first).
  - Small, focused functions with one job; no speculative `targets[]`/multi-target scaffolding.
  - No comments that restate the code; comment only the *why* (with §3.x cites where useful).
  - No dead code, no unused imports — `npx tsc --noEmit` enforces types; also grep for unused.
  - Match existing error-message conventions verbatim (issue strings like `[platform] ...`).
  - Keep the diff minimal: S1 should be ~3-4 files touched, tens of lines, not hundreds.

## 3. What S1 must NOT touch (hard constraints)

- No edits to `builder/src/generators/*.ts` (all existing Flutter generators live directly in
  `builder/src/generators/` — there is no `flutter/` subdir; leave them physically in place).
- No edits to `builder/schemas/*.schema.json`.
- No `targets` key, no multi-target anything (§3.1.1).
- No SwiftUI generator files (`builder/src/generators/swiftui/` must not be created in S1).
- No `Package.swift` / `.swift` fixtures.
- No deletes anywhere. All changes additive.
- No commits unless the orchestrator/owner explicitly asks.

## 4. Verification (run in repo root; must all pass before reporting done)

```bash
# 1. Strict typecheck
npx tsc -p builder/tsconfig.json --noEmit

# 2. Regenerate every committed IR TWICE into scratch dirs and diff → must be byte-identical.
#    Existing committed IRs (generator samples under builder/samples/ AND apps/ apps):
#    use the standard command npx ts-node --transpile-only builder/src/index.ts <ir> <out>
#    e.g. for apps/tasks:  input apps/tasks/input/tasks.ir.json
#                         output apps/tasks/output/app (this is the working app dir — use a
#                         TEMP copy target like /tmp/s1_a and /tmp/s1_b for the diff, do NOT
#                         overwrite apps/tasks/output/app in S1)
#    then: diff -r /tmp/s1_a /tmp/s1_b  → expect "identical"
#    Repeat for: apps/tasks, apps/ledgerly, apps/work_auth, apps/hr_service,
#                builder/samples/expense.ir.json, expense.semantic.ir.json, inventory.ir.json,
#                todo.ir.json, rasheed.ir.json, promo.ir.json

# 3. Validator suite on a sample output dir (existing suites must stay green):
npx ts-node --transpile-only builder/src/validate.ts <ir> <out>

# 4. Platform gate unit-exercises (manual, via node -e or a scratch IR):
#    - absent platform        → generates fine, treated as flutter
#    - platform:"flutter"     → generates fine
#    - platform:"swiftui"     → clear not-yet-implemented failure (exit != 0), no partial output
#    - platform:"bogus"       → validate.ts reports [platform] bogus
#    Do these in /tmp scratch dirs (rule: no throwaway work without a copy in repo — keep the
#    tiny probe scripts under apps/*/output/qa/ or rebuild them ad-hoc; docs/qa/ is allowed).

# 5. Optionally: npm run typecheck:builder and npm run validate:gen (root package.json) for the
#    aggregate view — report their output verbatim.
```

Expected outputs to paste into the handoff:
- typecheck: exit 0.
- each `diff -r`: "identical" (or diff empty).
- validate: the usual PASS lines incl. `[determinism] PASS`.
- platform probes: exactly the 4 behaviors above.

## 5. Deliverable back to orchestrator

Report back:
1. Exact file-by-file diffs (paths + what + why, with §3.x cites).
2. Verification output (verbatim final lines per command).
3. Any surprise (e.g. where the platform value validation actually lives, given
   `builder/src/schema.ts` does not exist).
4. Confirm zero edits in `builder/src/generators/` and `builder/schemas/`.

## 6. Next slices (context only — do NOT build in S1)

S2 swiftui module skeleton → S3 list screen → S4 detail/form → S5 wizard → S6 l10n/RTL →
S7 rules/verdicts (generated Swift RuleModel, oracle parity) → S8 auth/tenant → S9 split/budget →
S10 audit/export → S11 persistence (SwiftData adapter) → S12 attachment/OCR → S13 outbox/sync →
S14 e2e parity. Slice plan: requirements §7; ground truth §17 gap analysis, §18 SPM shape.