# KIDS-QUIZ v1.2 — real gamification on the run: score, stars, per-question feedback — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner asked for "gamification components" (stars as the currency per the
answered decision) but the shipped v1.0/v1.1 quiz run shows **no score, no stars, no
correct/incorrect, no points, no badge earned** on the result step. Verified by both the v1.0 and
v1.1 CDP probes (`apps/kids_quiz/output/cdp/W_result_step_proof.png`, `verify_run_complete.png`) —
the result step is only a raw-answer summary. This slice makes the run actually gamified, generator-
first.

Sources: `apps/kids_quiz/input/KIDS_QUIZ_DESIGN_BRIEF.md` (gamification mapping §automated), the
three answered decisions (stars currency), `apps/kids_quiz/input/brief.md` findings #1–#3 (now
fixed by v1.1's `FieldRole "choice"`), this RCA-style finding below.

## Finding (root cause) — why no gamification surfaced

1. The three per-question correctness rules (`Question1Correct/2/3`) were authored **severity-less**
   in `apps/kids_quiz/input/kids_quiz.ir.json` because v1.0 had a generator gap: a `severity`'d rule
   over a plain (non-status) enum field emitted a *failing* `policy_test.dart` (PolicyTestGenerator
   assumed chip). **v1.1 `FieldRole "choice"` fixed that gap** (`27f6fb2`) but the IR was never
   updated to take advantage — so today the rules are oracle-verified but invisible in the UI.
2. `QuizRun` has no `score` field; `Question.points` is never summed.
3. The wizard result step (`quiz_run_wizard_screen.dart:83-100`) is a static summary of
   `playerName` + `q1Answer`/`q2Answer`/`q3Answer` — it doesn't render stars/points/feedback, and no
   generator template emits a "score" summary for a wizard's final step.

## Task — make the run genuinely gamified (generator + IR, additive)

Design intent (from the brief): stars are the visible currency (verdict messages show "+N ⭐"),
`points` is the internal accumulator, badges reward milestones; the result step shows the score +
stars + which answers were right/wrong; a perfect run also fires the bonus (+ the two-earned bonus).

### Part 1 — IR: correctness rules become severity'd (stars) + a `score` field

1. `apps/kids_quiz/input/kids_quiz.ir.json`:
   - Give `Question1Correct`, `Question2Correct`, `Question3Correct` a `severity` + a friendly
     `message` carrying stars, e.g. each `severity:"warn"`, `message:"Correct! +5 ⭐"` (mirror the
     pattern `RunCompleted` already uses — `Great job finishing the quiz! +5 ⭐`). Now that
     `FieldRole "choice"` is live, their conditions over `q1Answer` render as ChoiceChips and the
     generated `policy_test.dart` must pass.
   - Add a `score` (int) field to `QuizRun` (or a computed summary in the wizard state) so the run
     accumulates `sum(points where answer == correct)`; oracle-backed where it's rule-driven.
2. Regenerate. `validate.ts` ALL gates must PASS (especially `[oracle]`, `[verdict]`, `[choice]`).
   The five other apps stay byte-identical (this edits only kids_quiz's IR + additive generator
   surface below).

### Part 2 — generator: a score/feedback result template for wizard final steps

Make the wizard's result (final) step render gamified output generically, not by hand-editing the
generated app:

- Where a wizard has >0 values with severity'd oracle-backed rules, the final step should show for
  each such rule a per-question mark (✓ Correct! +5 ⭐ / ✗) and a summary line: total points + a
  star rating (e.g. 3/3 → "⭐⭐⭐ ~ +15"). Keep it token-driven (AppSpacing/AppText/AppChip), real
  text (never Ahem), and a11y-visible (semantic label reads the score).
- Keep it additive: a wizard with no gamified rules (e.g. work_auth) emits today's summary
  byte-identical. Only IRs declaring these rule+score patterns get the richer final step.
- Reuse `AppChip`/verdict tone (run_completed's existing precedent) for per-question chips; stars as
  literal text (⭐⭐⭐) per the owner's decision (real text, not an image/icon — Ahem-safe).

## Hard constraints

- Never delete; additive only. `builder/src` edits = the wizard-final-step gamified template + any
  score/accumulation support; IR edits = kids_quiz only. Never hand-edit the generated app.
- Deterministic core stays 0% LLM.
- Commit only when green; small commits: (1) IR rules→severity + score field + regen, (2) generator
  gamified-result template + tests. push each.
- Regression tests that can fail pre-fix: a wizard with 3 severity'd choice-rules whose final step
  renders the score + per-question marks; a wizard with NO gamified rules stays byte-identical.

## Deliverable

kids_quiz regenerated so a completed perfect run shows **score + stars + per-question ✓/✗ + correct
answers**, bonus step still fires, `validate.ts` ALL PASS, npm test green (new tests), 5 existing
apps byte-identical. Rebuild web `/kids_quiz`, re-serve (server reads disk — no restart), CDP-driven
full run producing a result screenshot + AX showing the score/stars text. Evidence under
`apps/kids_quiz/output/cdp/` + `qa/`. Final message to the orchestrator (this session) with exact
command outputs; do NOT report to the owner directly.