# W2 — Wizard step-body vertical scroll (owner-approved) — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** reviewed + verified the parent round (S3 done, npm test 85/85)

## Task

Fix a **generator** defect: wizard steps with multi-field / wide-label content overflow the
viewport at 320×480 by ~20px. RCA: `apps/work_auth/output/rca/RCA-workauth-wizard-overflow-320.md`
(owner **APPROVED** the proposed fix on Telegram, 2026-08-19).

## Root cause (RCA §3)

`WorkAuthWizardScreen`'s wizard step body does **not** delegate vertical overflow to its own
`SingleChildScrollView`. Step content is laid out inside a fixed-height frame whose intrinsic
height exceeds 480 LP on a narrow 320 width (long labels wrap to more lines). The scrollable
parent shell never engages because the inner box reports a tight height → ~20px spills past the
bottom. Generator defect, not app-specific — any future wizard with a long step can hit it.

## Fix (RCA §4 — the approved approach)

In `builder/src/generators/screen.ts`, wizard branch (~`:649-748`), **wrap each wizard step's body
in its own `SingleChildScrollView`** so the step content scrolls to fit its own viewport height —
mirroring the pattern the list/detail branches already use. One small additive change to the wizard
branch only.

Concretely: the step body is currently a `switch (state.currentStep)` of step widgets inside an
`Expanded(child: Padding(...))`. Make the child of that `Expanded` (or its `Padding`) a
`SingleChildScrollView` whose child is the `switch`, so a tall step scrolls instead of clipping.

- DO NOT patch `apps/work_auth/output/app` — fix the generator, then regenerate (rule: never edit
  the generated app).
- Do NOT touch the wizard header (progress bar, step title) or footer (Back/Next) — only the step
  BODY gets the inner scroll view.
- Keep it deterministic: `render: (IR, ctx) → string`, no I/O in generators.

## Why correct (RCA §5)

Each step owns its vertical scrolling instead of relying on an outer shell that a tight-height
inner box defeats. Rejected alternatives: shrinking content at narrow widths (masks symptom,
changes typography/px targets), wrapping only the overflowing step (content-fragile). A per-step
scroll view is the deterministic, content-agnostic guarantee.

## Verification (run all; report each in your final message)

1. `npm run typecheck:builder` — clean.
2. `npm test` — full suite green (currently 85/85 base; any new tests additive).
3. `npx jest test/s1_visual_intent.test.ts` — 20/20 unchanged.
4. Regenerate `apps/work_auth` (input `apps/work_auth/input/work_auth...ir.json` → output
   `apps/work_auth/output/app`) then:
   - `npm run validate` (pipeline validate) — ALL gates PASS,
   - `flutter analyze` no new issues,
   - `flutter test` incl. the S6 slice-2 viewport-squeeze 320/390/1400 — **green**. If a regression
     test for this wizard fix is missing, ADD one (e.g. viewport-squeeze now covers
     WorkAuthWizardScreen without overflow) — additive.
5. Determinism: generate the same app twice → `diff -r` empty (byte-identical).
6. Negative control (prove teeth): hand-insert a temporary 2-line wizard step with two long-label
   fields into a scratch IR → generation must still PASS (now scrolls, no overflow); then remove the
   scratch. Prove the fix is load-bearing, not vacuous.

Report exact command outputs (the orchestrator re-runs independently). Commit in small additive
slices with clear messages: `fix(generator): wizard step body gets its own SingleChildScrollView
(320×480 overflow, RCA-workauth-wizard-overflow-320)` + any test commit. Push to `master`.

## Contract reminders

- Non-negotiables: never delete anything (additive only); small commits; no secrets; `[generated]`
  headers intact; user regions preserved by content-hash — you're only touching the wizard branch
  string template.
- When done, report to the orchestrator (this session) — not to the owner — with command outputs.