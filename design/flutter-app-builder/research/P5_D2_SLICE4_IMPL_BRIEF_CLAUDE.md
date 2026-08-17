# P5/D2 Slice 4 — Implementation brief for Claude Code

**From:** Orchestrator (zen) — **To:** Claude Code (implementer) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_P5_D2_REPORT.md` (§11 model, §13.6 Slice-4, §14.3 test matrix, §15 rejected alternatives).
**Task:** Implement **Slice 4 (gate)** — the `[states]` validator in `builder/src/validate.ts`. This is the FINAL P5/D2 slice.

## What Slice 4 is (SPIKE_P5_D2_REPORT §13.6)

Add a `statesCheck(ir, outDir, files)` gate to `validate.ts` that:

1. **Re-derives** `statePlacementFor(screen, ir)` for EACH screen (import/use the SAME selector from Slice 2 — `composition.ts` — never a parallel copy).
2. **Diffs it against the recorded** `plan.json.patterns.states` entry for that screen (the Slice-2 plan/ctx record). Stale/missing plan entry → FAIL, mirroring `[search]`'s re-derive pattern (`validate.ts:403-414`: plan declares X but re-deriving no longer resolves → stale, and its reverse).
3. **Scans the emitted screen source** for the presence/absence of each member's marker, per the **applicable contract** for that state model (§9 table):
   - `loading`/`error`/`empty`/`emptyCta`/`retry`/`refresh` — each flagged when the spec says true but the marker is absent, AND (reverse) when the spec says false but the marker is present (e.g. a wizard that still has a loading branch).

Mirror the existing gate **spirit** exactly like `[search]Check` + `[scroll]Check` (`validate.ts:374,447`): same issue-string `[states] ...` format, same "plan.json missing → cannot verify" guard, same re-derive-not-trust posture.

### Negative controls that MUST FAIL (test in your verification)

- **Wizard with a loading branch** → FAIL (spec is null for wizards; a loading marker means Slice-2's compile fix regressed).
- **Detail screen requiring `empty`** → FAIL (no backing collection on a detail screen).
- **Non-CRUD entity forcing a CTA (`emptyCta`)** → FAIL (no create target — a CTA with no target is a spec bug, §13/§15).

### Decision posture ("applicable contract per state model")

Same principle Slice 2 already encodes (state-model-conditional, §11): `empty` ⇔ the state has a backing collection (`collectionField`); `emptyCta` ⇔ `empty` AND `crudFormTargets(ir).get(s.entity)` has create; `retry`/`refresh` ⇔ `error`/list archetype AND repo has `load()`. The gate re-derives EXACTLY these — it must not second-guess them independently (that's the "blind all-three validator trap" the spike REJECTED, §15).

## Non-negotiable boundaries

1. **`validate.ts` only** — plus whatever `composition.ts` export already exists (reuse the Slice-2 `statePlacementFor`; do NOT touch `screen.ts` emission or the plan/ctx writers this slice).
2. **Additive, no deletions.** New function + wire `issues.push(...statesCheck(...))` into `main` next to the other gates; pass through the same args the sibling checks use.
3. Gate severity: **error**, matching `[search]`/`[scroll]`/`[shell]`/`[actions]` (`§16` open question 2 — owner decision pending defaults to error).
4. No IR/schema change (same as Slices 2/3). No package changes. Deterministic re-derivation only.
5. `statePlacementFor` is PURE — the gate must not mutate state. Plan entry read-only.

## Files you will most likely touch

- `builder/src/validate.ts` — the `statesCheck` function + wiring.
- Possibly a tiny shared helper move (only if `statePlacementFor`'s inputs aren't already exposed — DO NOT create a second implementation).

## Definition of done (verify all before reporting)

1. `npm run typecheck:builder` clean.
2. All 9 apps+samples regenerate + `validate.ts` PASS (existing gates + new `[states]`), including `wizard` + `reimbursement`.
3. **Negative controls**: craft 3 deliberately-broken IR/regenerations (or, if that's heavy, argue each statically with exact line references) showing:
   - wizard-with-loading-branch → `[states]` FAIL,
   - detail-requiring-empty → FAIL,
   - non-CRUD-forced-CTA → FAIL.
   Best if you can demonstrate at least ONE as a real run; the other two statically argued are acceptable this slice (document exactly what you did).
4. **Positive confirmations**: wizard + detail screens still PASS (spec correctly inactive), and screens where Slice 3 rendered retry/CTA/refresh PASS with their markers present.
5. `[[plan-determinism]]` on `patterns.states` still green; a second regen is byte-identical (determinism regression — the recorded plan entry is what the gate re-derives).
6. Small, one-logical-slice commits; last commit closes **P5/D2** (Slice 4). State that explicitly in the final summary.
7. Report: ≤12-line chat summary with commit hashes + the exact gate wiring line numbers in validate.ts + which negative-control strategy you used (real run vs static argument).

## After you finish

P5/D2 will be COMPLETE. Do NOT start anything beyond Slice 4 (no S1-S2 visual-lane spikes, no S-HERMETIC work, no v2-contract work) — the orchestrator will pick the next roadmap item. Just confirm P5/D2 is closed and your summary.