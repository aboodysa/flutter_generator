# RCA — WorkAuthWizardScreen 20px overflow @320×480 (viewport-squeeze)

**Date:** 2026-08-18
**Severity:** medium (pre-existing layout defect surfaced by S6 slice-2 viewport-squeeze test)
**Lane:** discovered by Claude (s-hermetic) during the work_auth stale-output fix
**App:** `apps/work_auth`

## 1. Symptom

The S6 slice-2 viewport-squeeze test (`builder/src/generators/test.ts`) fires a FAIL on
`WorkAuthWizardScreen` rendered at 320×480: "overflowed by 20.0 pixels" while validating the
currently-generated work_auth app. Discovered during the work_auth determinism/contrast/literals
cleanup (commit `13005a7` sync work_auth output).

## 2. Investigation

- The viewport-squeeze matrix (320×480 / 390×844 / 1400×900) renders every generated screen and
  asserts `tester.takeException()==null`. Only the 320×480 cell overflows; 390/1400 pass.
- Claude's regression-differential (git-stash A/B) proved the overflow is **not** caused by any of
  the determinism/contrast/literals fixes in `13005a7` — it reproduces on the pre-change generator
  too. It is an additive-scan table catalog rebuild (design/src), a fix to `visualizer`... no —
  root finding via fresh regen: `WorkAuthWizardScreen` renders a scrollable form whose content depth
  at 320-wide + 480-tall exceeds the viewport, and the wizard's step scaffold forces a fixed-height
  frame rather than letting the inner list scroll, so the last row is clipped by 20px.

## 3. Root cause

`WorkAuthWizardScreen`'s wizard step body does not delegate vertical overflow to its own
`SingleChildScrollView`. Instead the step content is laid out inside a fixed-height
`ConstrainedBox`/column whose intrinsic height exceeds 480 logical pixels on the narrow 320 width
(long labels wrap to more lines). The scrollable parent (p1-shell) never engages because the inner
box reports a tight height, so the extra 20px spills past the bottom edge. This is a **generator
defect**, not app-specific: any future wizard screen with a multi-field, wide-label step can hit the
same at 320×480.

## 4. Fix (proposed — NOT yet applied, owner decision required)

In `builder/src/generators/screen.ts` wizard branch: wrap each wizard step's body in its own
`SingleChildScrollView` (so the step content scrolls to fit its own viewport height), mirroring the
pattern the list/detail branches already use. This is a small additive change. Do NOT patch
`apps/work_auth/output/app` — fix the generator, then regen (rule: never edit the generated app).

## 5. Logic / rationale

The clean fix is to give every wizard step an inner scrolling viewport: the step owns its vertical
scrolling rather than relying on an outer shell that a tight-height inner box defeats. Alternative
considered and rejected: shrinking the wizard's content/spacing at narrow widths (masks the symptom,
would also change typography/px targets across the design-system scale); wrapping only the
overflowing step (fragile — depends on content, breaks later edits to labels). A per-step scroll
view is the deterministic, content-agnostic guarantee.

## 6. Verification (when the fix lands)

1. `npm run typecheck:builder`.
2. `npx jest test/s1_visual_intent.test.ts` — 20/20.
3. `npm test` — 63/63.
4. Regen work_auth; `flutter analyze` + `flutter test` in `apps/work_auth/output/app` — viewport
   squeeze test (320×480) now FAIL→PASS. Prove with a stash-based before/after: test fails on the
   pre-fix generator, passes after.
5. Determinism: two fresh regens byte-identical.

## 7. Prevention

- Add the 320×480 cell as a permanent fixture in the viewport-squeeze suite (it already is) — this
  is the guard that caught it; keep it.
- New wizard/step generators must include an inner scroll viewport on the step body; note in the
  design doc (§ wizard generation) so future slices inherit the guarantee.

## 8. Follow-up

- Owner decision: approve the generator fix (wizard step inner scroll). Then dispatch to a fresh
  Claude session as next implementable objective (Claude is currently at context boundary).
- Status: OPEN, dispatched as a standalone objective; not part of the closed work_auth
  stale-output fix.
