# P5/D2 Slice 2 — State-placement implementation brief (Claude Code)

> **Implementer:** Claude Code (this machine, local repo `/Users/username/Documents/cto/flutter_generator`).
> **Task:** Implement SPIKE_P5_D2_REPORT.md's **Slice 2 (placement)** — the stateplacement pattern. Slices 3 (CTA/retry) and 4 ([states] gate) are LATER slices; do NOT do them here.
> **Gate: D1 (theme wiring) already landed** — repo HEAD is `0dde62c`.

## Source of truth (read first)
1. `design/flutter-app-builder/research/SPIKE_P5_D2_REPORT.md` — §13 Decision, §14.2 Slice 2, §14.3 test matrix.
2. `design/flutter-app-builder/research/D1_THEME_SPIKE_BRIEF.md` + the D1 commit to see the established pattern (already-merged).
3. `AGENTS.md` — hard rules (deterministic core, additive-only, small commits, no code comments unless required).

## The problem (context)
Today the Loading/Error/Empty placement is **ad hoc inline in `screen.ts`** (around `:671-672`):
```ts
if (state.status == ${statusEnum}.loading) return const LoadingState();
if (state.status == ${statusEnum}.failure) return ErrorState(message: state.errorMessage);
```
This hard-codes a universal `status` field on every state. **Wizard samples** (`builder/samples/wizard.ir.json`,
`apps/.../reimbursement.ir.json`) use a different flow-status field (`wizardStatus`), so emitting loading/failure:
branches against `wizardStatus` is a **latent compile bug** (the wizard state enum has no `loading`/`failure` members → generated app won't compile).

## Required change (Slice 2 — placement only)
Make the placement **state-model-conditional** with a single owner, per the report's final contract (§14.1):

```
statePlacementFor(s, ir) → StatePlacementSpec | null
  flowEnum    = the state model's flow-status field's enum type (wizard → "wizardStatus")
  loading     = flowEnum has "loading"
  error       = flowEnum has "failure"  AND  state declares errorMessage
  empty       = state has a backing collection (list archetype)   ← NOT this slice's UI, only the SPEC's fields
  emptyCta    = empty AND crudFormTargets(ir).get(s.entity) has create   ← spec field only
  retry       = error AND repo has load()                         ← spec field only
  refresh     = list archetype AND has load()                     ← spec field only
  spec is null (emits nothing) when !loading && !error && !empty  // wizard
```

### Files to change (single-owner posture — mimic P4's `actionsFor` selector pattern)
1. **`builder/src/types.ts`** — add `StatePlacementSpec` interface (fields: `loading`, `error`, `empty`, `emptyCta`, `retry`, `refresh`, all `boolean`; plus enough info to render, e.g. the flowEnum name if needed).
2. **`builder/src/composition.ts`** — add `statePlacementFor(screen, ir): StatePlacementSpec | null` selector, deterministic, IR-derived. Reads the state model's flow-status field + enum members + `crudFormTargets` (reuse the P4 precedent) + repo `load()`. **Wizard → null.**
3. **`builder/src/plan.ts`** (or where `GenerationPlan`/`GenContext` live) — record the selector result: add `GenerationPlan.patterns.states?: StatePlacementSpec` and wire `GenContext.states` same as `search`/`scroll`/`actions` precedent.
4. **`builder/src/index.ts`** — invoke `statePlacementFor` during plan composition, write into `plan.json patterns.states`.
5. **`builder/src/generators/screen.ts`** — replace the `:671-672` literals with payload-driven emission: read the spec from ctx/plan; emit the loading/failure branches ONLY when `spec.loading` / `spec.error`; **wizard (null spec) emits NOTHING** → compile fix. Keep the empty-state (searchable-list `no results`) as-is unless the spec says otherwise — **do NOT implement O6.2/CTA or retry UI in this slice** (Slice 3).
6. **Do NOT touch `validate.ts`** (`[states]` gate is Slice 4).

### Do NOT do (deferred to other slices)
- `[states]` validator gate (Slice 4).
- Empty-state CTA "New <Entity>", retry `OutlinedButton`, `RefreshIndicator` (Slice 3).
- Dark-mode/theming (D1 already done).
- Any IR/schema change — derivable from existing fields only.

## Definitions of done (verify all locally on the Mac — you have Flutter + ts-node)
1. `npm run typecheck:builder` → clean.
2. Generate **every** sample + app IR (both `builder/samples/*.ir.json` and `apps/*/input/*.ir.json`) into scratch dirs with `npx ts-node --transpile-only builder/src/index.ts <ir> <out>` → all succeed.
3. **The wizard + reimbursement samples COMPILE**: `flutter analyze` in their generated dirs shows **0 errors** (they were broken pre-fix). This is the headline regression fix.
4. All other apps (`tasks`, `ledgerly`, `hr_service`, `work_auth`, `rasheed`, `todo`, `promo`, `inventory`, `expense`, `moneycrud`) still `flutter analyze` clean AND their tests still pass (regenerate → analyze → test; goldens only if you must).
5. **Byte-identical backward-compat**: for a light sample whose placement decision is unchanged (detail screens, search-only lists), a stash-regen-diff shows the emitted screen is byte-identical (or only the loading/failure lines structurally move — confirm the diff is minimal and explain it).
6. Run `builder/src/validate.ts` on each generated dir → the existing gates still PASS (no new gate expected this slice).

## Constraints
- Deterministic, 0% LLM at generation time — the selector is pure `(IR, ctx) → spec`.
- Additive-only; never delete existing behavior (except the wizard's wrong branches, which are the bug fix).
- Small commits: type+selector+plan wiring, then screen.ts emission fix, then the wizard-compile regression, as logical slices.
- No code comments unless genuinely explanatory (match the D1 code style — brief header comments are acceptable, e.g. `// P5/D2 (...)`).
- Do not commit secrets; commit only when the diff is verified per Definitions of done.

When done, report: the exact list of commits (Hashes), the verify output summary (typecheck/generate/analyze/test + wizard compile before vs after), and the byte-identical proof note. Leave the repo on a clean HEAD.