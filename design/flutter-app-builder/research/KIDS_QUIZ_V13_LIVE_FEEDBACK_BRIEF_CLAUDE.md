# KIDS-QUIZ v1.3 — live feedback during the run + explainable score — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner UX feedback (verbatim): "correct and incorrect answers are not show
[during] or at result page, score is magic number". v1.2 (a31d986/4b6a269/165f6be) already put
score+stars+marks on the **result** page (verified live, 56/56 tests). This slice fixes the two
things v1.2 still gets wrong: (1) **no feedback DURING the run** — steps 1–4 show nothing when a
chip is tapped; (2) the **score is a magic number** — "Score: 15 ⭐" with no breakdown and the
correct answer is never revealed on a wrong pick.

Primarily a generator change, applied to kids_quiz's IR. Never hand-edit the generated app.

Sources: `apps/kids_quiz/output/qa/PROBE_FINDINGS_V12.md`, `apps/kids_quiz/output/app/lib/.../
quiz_run_wizard_screen.dart` (current result-page-only gamification, builder at step 5), the v1.2
brief (`research/KIDS_QUIZ_V12_GAMIFICATION_BRIEF_CLAUDE.md`).

## Current state (verified, the starting point)

- Result step (5): `Builder` computes `evaluateQuizRunPolicy(state.draft)`, filters the three
  `QuestionNCorrect` rules, sums points (hardcoded map → 15 ⭐ for 3/3), renders `⭐⭐⭐  (3/3)`,
  `Score: 15 ⭐`, and three `AppChip` — `Correct! +5 ⭐` / `✗`.
- Steps 1–4 (during the run): a `Wrap` of `ChoiceChip`s only; **no feedback, no running score, no
  correct answer when wrong**.
- No correct-answer text anywhere; the "✗" doesn't say which option was right.

## Task — TWO change areas (generator + IR, additive, small commits)

### Part 1 — live per-step feedback during the run

Make each question step (1, 2, 3) show, immediately after the user picks a chip on that step, a
feedback block below the choices:

- If the pick is **correct**: a success `AppChip` "Correct! +5 ⭐" (reuse `AppChipTone.success`).
- If **wrong**: a neutral/danger `AppChip` "Not quite — the answer was <CorrectOption.label>"
  (reuse the tone vocabulary; no invented colors — token-driven). Reveals the correct answer.
- A **running score line** on steps that have ≥1 answer, e.g. "1 correct · 5 ⭐ so far" (or stars
  "⭐~ 5"), updating live as they go.
- Show feedback deterministically: on step N, evaluate the Nth rule(s) against the picked value via
  the same `evaluateQuizRunPolicy(state.draft)` path the result page uses (keep ONE source of
  truth for correctness — don't hardcode a second correct-answer map).

Generator shape: the wizard step template must render this block generically when a step has
oracle-backed rules over its primary choice field. Keep it **additive** — a wizard without gamified
choice-rules (work_auth) emits today's step byte-identical.

### Part 2 — explainable score (no more magic number)

Replace the bare "Score: N ⭐" with a derived, human-readable line that shows the arithmetic:

- e.g. "3 correct × 5 ⭐ = 15 ⭐" (correctCount, per-rule points, total). On a partial
  run: "1 correct × 5 ⭐ = 5 ⭐".
- Keep the "⭐⭐⭐ (3/3)" star row (that part is good — owner asked for stars).
- If per-rule points can differ, derive from each rule's configured points rather than a fixed
  map; show the breakdown explicitly so it's never a mystery number.
- A11y: the semantic label for the step reads the score + correct/incorrect state (real text, not
  Ahem).

## Hard constraints

- Never delete; additive only. `builder/src` = the wizard step-feedback + explainable-score
  template; IR = kids_quiz only. Never hand-edit the generated app.
- Deterministic core stays 0% LLM.
- Small commits, each green + pushed: (1) generator feedback template + tests, (2) regenerate
  kids_quiz + verify.
- 5 existing apps (keemart/tasks/work_auth/hr_service/ledgerly) stay byte-identical.
- Regression tests that can fail pre-fix: (a) a step with a picked-wrong value renders the
  "answer was X" chip + running score; (b) the result shows "N correct × M ⭐ = T ⭐".
- The v1.2 result-page additions stay (no regression), only upgraded by Part 2.

## Deliverable

kids_quiz regenerated: during-run feedback (PerChore step shows correct/wrong + correct answer +
running score as you tap), explainable result score ("3 correct × 5 ⭐ = 15 ⭐" + "⭐⭐⭐ (3/3)").
`validate.ts` ALL gates PASS (incl `[oracle]`, `[choice]`), npm test green, builders unchanged for
work_auth/others. Rebuild web `/kids_quiz`, re-serve, CDP a full run capturing a DURING-step
feedback screenshot + the result page, AX shows the feedback text. Evidence under
`apps/kids_quiz/output/cdp/` + `qa/`. Final message to the orchestrator (this session) with exact
command outputs; do NOT report to the owner directly.