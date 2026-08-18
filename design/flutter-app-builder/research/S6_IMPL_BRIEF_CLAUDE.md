# S6 implementation brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_S6_REPORT.md` (read §13 decisions + **§14 slice spec** fully). Task is the §14 list, prioritized as given. Additive only, small commits, do NOT touch the S1 tests or `[visualIntent]` gate.

## Context

S6 spike CLOSED: every §18 "Visual Analyzer" defect maps to an existing deterministic check, a
near-term validator, or a human-baselined golden pixel-diff — no semantic-vision judge needed
(§13 D1 ADOPT; D2 ADOPT validator list; D3 CONFIRM golden workflow; D4 CONFIRM S1 closes 3 cells).
This brief is the D2 implementation, in the report's priority order.

## The slice spec (§14 — implement in priority order)

1. **`[contrast]` gate (S, gate-worthy — highest value).** Parse emitted `core/theme.dart` `AppColors.*`
   + derived textTheme colors; alpha-composite fg-over-bg (src-over blend); WCAG contrast ratio;
   FAIL <4.5 (body) / <3.0 (large) on `generated` regions; plugs into `validate.ts` as a sibling of
   `themeCheck`; advisory on inherited regions.
2. **Per-screen viewport-squeeze overflow test (M, gate-worthy).** New generator in
   `builder/src/generators/test.ts` emitting, per screen, a widget test rendering at 320×480 /
   390×844 / 1400×900 asserting `tester.takeException()==null` (the §14.4.3 matrix, currently only the
   p1-shell QA probe); register in `index.ts:283`; assertions-only (no goldens) → zero golden churn.
3. **`[asset-ref]` + `[aspect-ratio]` gates (M, gated on S3/S4).** At plan time: every asset reference
   in generated code is declared in pubspec + exists on disk; every emitted `Image` carries the IR
   `ImageSpec` `fit`/`aspectRatio` token, never an IR-side number. **Do NOT gate on these until S3
   lands** — if S3 is not in the tree, either build the gates in a way that is inert/opt-in until S3,
   or mark them DEFER-to-S3 in your report and skip implementation. Owner decision follows the spike:
   build the checks, wire them so they pass vacuously today, flip them ON when S3 arrives.
4. **All-screens spacing/typography literal scan (S, nice).** Extend S1's `RAW_LITERAL_PATTERNS`
   (`test/s1_visual_intent.test.ts:167-172`) from the 3 proof screens to EVERY screen: no
   `EdgeInsets.only/all(<digit>`, `fontSize: <num>` in presentation layer; allowlist the registry's
   `itemGap` emission (`screen.ts:673`) OR first route it through an `AppSpacing` token (report §16
   makes this an owner call — pick the token-routing option only if it is a small additive change;
   otherwise allowlist and note it).
5. **A11yTestGenerator (L, own slice, nice).** Implement DESIGN §15:589's per-screen a11y test
   (role/name/bound-state assertions). Only if time/context permits after 1-4 — do NOT let it delay
   the first four.

## Constraints

- Additive only; no deletions; don't weaken existing gates/tests/evidence requirements.
- `[contrast]` must use real WCAG math (relative luminance, not a heuristic).
- Viewport matrix tests must be assertions-only (no `matchesGoldenFile`) so existing goldens stay
  unchanged. They must pass for all currently-generated apps.
- Follow the established `validate.ts` gate pattern (mirror `themeCheck`/`statesCheck`/`visualIntentCheck`
  structure: function + wire into `validateOutput` + `main()` print + count into the failed sum).
- Small commits, one logical slice each, pushed to origin/master.

## Verification (all mandatory)

1. `npm run typecheck:builder` clean after each slice.
2. Run `validate.ts` on ALL generated apps (tasks, hr_service, ledgerly, + samples) — new gates PASS
   (or pass vacuously where gated on S3); no existing gate regressed.
3. Run `npx jest test/s1_visual_intent.test.ts` — still 20/20 green.
4. Run `npm test` (full suite) green.
5. **Contrast gate teeth:** find or construct one emitted screen with a deliberate
   below-threshold fg/bg (or a known-weak AppColors pair) → gate FAILS; revert. Show the FAIL→PASS
   before/after.
6. **Viewport matrix teeth:** inject an overflow-inducing change in a generated screen → its
   squeeze test fails; revert. Show FAIL→PASS.
7. Report ≤14 lines: per-slice commit hashes, gate wiring lines, teeth proofs, gate counts across
   apps, jest/typecheck results, what was deferred.