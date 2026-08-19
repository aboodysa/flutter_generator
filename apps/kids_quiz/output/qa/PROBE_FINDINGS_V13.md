# kids_quiz — v1.3 CDP probe: live per-step feedback + explainable score (2026-08-19)

**App:** `apps/kids_quiz` rebuilt (`flutter build web --base-href=/kids_quiz/` against the v1.3
regenerated output, commit `5ccbba8`) · served
`https://macbook-air-m4-1.taild16060.ts.net/kids_quiz/` (tailnet `/kids_quiz` → 127.0.0.1:8084,
live-reading `apps/kids_quiz/output/app/build/web`, no restart needed after rebuild). Verified in
an interactive Chrome tab.

Baseline this probe checks against: owner UX feedback verbatim — "correct and incorrect answers
are not show[n] [during] or at result page, score is magic number" — and `PROBE_FINDINGS_V12.md`,
which confirmed the result step already had score/stars/marks but steps 1–4 showed **no feedback
at all** during the run, and the result score was a bare `Score: 15 ⭐` with no breakdown.

## Part 1 — live per-step feedback, both branches driven live

1. Home (`/question`) → clicked the "Play Quiz" FAB → landed on the wizard's intro step.
2. `intro`: typed "Sara" into Player Name, tapped Next.
3. `q1` ("Which planet is known as the Red Planet?"): tapped chip **a** (Earth, **wrong**) —
   feedback appeared immediately, on the step itself, before advancing:

```
generic "Not quite — the answer was b" [ref_17]
generic "0 correct · 0 ⭐ so far" [ref_18]
```

   Corrected the pick to **b** (Mars, correct) — the block updated live, still on the same step:

```
Correct! +5 ⭐
1 correct · 5 ⭐ so far
```

4. `q2` ("Which animal says 'Moo'?"): tapped chip **a** (Cow, correct) → `Correct! +5 ⭐`,
   running score `2 correct · 10 ⭐ so far`.
5. `q3` ("What color do you get by mixing blue and yellow?"): tapped chip **b** (Green, correct)
   → `Correct! +5 ⭐`, running score `3 correct · 15 ⭐ so far`.
6. `bonus` (conditional, `when: PerfectRun`) fired live: "Perfect score! Bonus round unlocked!" —
   confirms the conditional step is unaffected by the new per-step feedback block.

This is the exact Part 1 deliverable: a step with a wrong pick reveals the correct answer
immediately (`Not quite — the answer was b`) and a running score line updates live as each
question is answered — both sourced from the same `evaluateQuizRunPolicy(state.draft)` call the
result step uses, not a second hardcoded correctness map.

## Part 2 — explainable result score

7. `result` — accessibility tree:

```
generic "Your Results" [ref_10]
group [ref_11]
 generic "⭐⭐⭐ (3/3)" [ref_22]
 generic "3 correct × 5 ⭐ = 15 ⭐" [ref_23]
 generic "Correct! +5 ⭐" [ref_24]
 generic "Correct! +5 ⭐" [ref_25]
 generic "Correct! +5 ⭐" [ref_26]
 generic "Player Name: Sara" [ref_12]
 generic "Q1 Answer: b" [ref_27]
 generic "Q2 Answer: a" [ref_28]
 generic "Q3 Answer: b" [ref_29]
button "Back" [ref_19]
button "Finish" [ref_20]
```

The score line now reads `3 correct × 5 ⭐ = 15 ⭐` — the arithmetic is shown, not a bare number.
Compare directly against `PROBE_FINDINGS_V12.md`'s result-step tree, which showed `Score: 15 ⭐`
with no breakdown. The star row (`⭐⭐⭐ (3/3)`) and the three success-tone `Correct! +5 ⭐` marks
are unchanged from v1.2 (no regression), matching the brief's constraint that "the v1.2 result-page
additions stay, only upgraded by Part 2."

8. Tapped **Finish** → no runtime errors; `read_console_messages(onlyErrors: true)` returned none
   for the full run.

## Method notes

- Screenshots were captured with `save_to_disk: true` at each key state (wrong-pick step, corrected
  step, running-score steps, result step) but — consistent with the v1.2 probe's finding — are not
  reachable from this session's Bash tool, so the accessibility-tree text above is the primary,
  verifiable evidence (screen text was also visually confirmed against each screenshot before
  advancing).
- The `⭐` glyph rendered correctly as a star (not a tofu box) in this run's screenshots, unlike
  v1.2's probe — likely a difference in which Chrome profile/font cache was active this session;
  the underlying text is identical either way and the AX tree is authoritative for both runs.

## Result

Both fixes from the v1.3 brief are verified live, end to end: (1) per-step feedback shows
correct/incorrect + reveals the right answer + a running score as soon as a chip is tapped, on
steps 1–3, not just the result page; (2) the result score is now explainable arithmetic
(`3 correct × 5 ⭐ = 15 ⭐`) instead of a magic number. No regressions to the v1.2 result-page
gamification or to the raw-answer summary lines.
