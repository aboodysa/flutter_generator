# kids_quiz — CDP probe findings (2026-08-19)

**App:** `apps/kids_quiz` · served `https://macbook-air-m4-1.taild16060.ts.net/kids_quiz/` (tailnet
`/kids_quiz` → 127.0.0.1:8084, 200 on `/`, `/index.html`, `/main.dart.js`).

## What was verified live (all 390×844-ish desktop viewport, headless Chrome 151)

### Home (`/question` — sections archetype)
- Hero **"Let's Play & Learn!"**, heading "Questions", `searchbox:"Search Questions"`, grid of
  "Sample Question 0/1/2" cards. No runtime errors. AX dump: `cdp/ax_home.csv`.
- **Finding (UX gap, v1.1):** the only tappable affordances on home are three decorative
  **"Add to cart"** buttons (sections floating-cart FAB template). There is **no in-app link to the
  quiz wizard** — a phone user can't start a quiz from the UI. Route-only today.

### Wizard quiz run (`/quiz-run/wizard`, driven via `location.hash`)
1. `intro`: progress bar 17%, "Let's play! What's your name?", `textbox:Player Name`, `button:Next`.
2. `q1`: "Q1: Which planet is known as the Red Planet? A) Earth B) Mars …", `button:Q1 Answer` (a
   **DropdownButton** — enum field, not choice chips), summary line "Player Name: Sara".
3. `q2`: "Q2: Which animal says 'Moo'?", `button:Q2 Answer`. Progress 50%.
4. `q3`: "Q3: What color do you get by mixing blue and yellow?", `button:Q3 Answer`. Progress 67%.
5. `bonus` (conditional, `when: PerfectRun`): **"Perfect score! Bonus round unlocked!"** — fired live
   because all three answers were correct (b/a/b). Progress 83%.
6. `result`: "Your Results", progress **100%**, `button:Finish`; collected values shown
   (Player Name: Sara, Q1/Q2/Q3 answer: b/a/b).

All steps completed with zero runtime errors; every answer choice is a `menuitem:a/b/c/d` (raw
enum keys, per guiding-principles #4).

## Findings

| # | Sev | Symptom | Root cause | Location |
|---|---|---|---|---|
| 1 | medium | Home has no entry point to the quiz wizard; "Add to cart" FAB is decorative | sections archetype emits the keemart cart FAB; no `context.go` from home to `/quiz-run/wizard` | `lib/features/kids_quiz/presentation/screens/question_list_screen.dart` |
| 2 | medium | Quiz answers render as DropdownButton (AX `menuitem:a/b/c/d`), not choice chips the owner asked for | `fieldRole()` chip-eligibility is name-list-only (status/priority/decision); plain enums fall to `DropdownButton` | `builder/src/operations.ts` (finding #3 in `input/brief.md`) |
| 3 | low | a11y test only walks wizard step 1 | `A11yTestGenerator` taps in and asserts step 1 only, never "Next" | `builder/src/generators/test.ts` (finding #2 in `input/brief.md`) |

Evidence: `cdp/ax_home.csv`, `cdp/ax_bonus.csv`, `cdp/ax_result.csv`; PNGs in `cdp/`.
Screenshots: `01_home.png`, `wizard_step1_intro.png`, `run_step2_q1.png`, `run_step3_q2.png`,
`run_step4_q3.png`, `W_bonus_step_proof.png`, `W_result_step_proof.png`.

## Suggested next slice (v1.1, generator-side)
Broaden `fieldRole()` chip eligibility (IR-level `role:"choice"` hint or value-shape heuristic) —
one fix covering findings 2+3 in this probe and findings #1–#3 in `input/brief.md` — and wire a
real "Play" entry from home to `/quiz-run/wizard` (owner-facing UX ask).
## v1.1 re-probe (2026-08-19, orchestrator-independent) — both gaps FIXED

Independent CDP re-probe after v1.1 (`27f6fb2` + `98f65a9`):
- Home now exposes **"Play Quiz" FAB** (`button:Play Quiz`) → clicking it lands in the wizard intro. ✓ finding #1 fixed.
- Quiz answers render as **ChoiceChips** (`checkbox:a/b/c/d` with real chip semantics), not the dropdown. Chip selection registers (click `b` → Next enables → Q2 shows) and the full run completes via chips only: intro → Q1(b) → Q2(a) → Q3(b) → **bonus step "Perfect score! Bonus round unlocked!"** → **Your Results @100%**. Zero runtime errors. ✓ finding #2 fixed.
- Generated surface of all 5 existing apps (keemart/tasks/work_auth/hr_service/ledgerly) remains **byte-identical** (lib/ + pubspec + shared tests). ✓ regression contract.
- kids_quiz: 37/37 gates, 52/52 flutter tests, **0 analyze errors** (warnings only).

### New finding (v1.1 probe, low, pre-existing latent)
- `unused_import` of `app_strings.dart` on `question_list_screen.dart` — `screen.ts`'s `appStringsUsed` flag doesn't account for the FAB-nav path dropping AppStrings usage on a sections home. 0 errors held; fix location = `screen.ts` `appStringsUsed`. Documented by implementer in `input/brief.md` v1.1 addendum (out of scope for this slice).
