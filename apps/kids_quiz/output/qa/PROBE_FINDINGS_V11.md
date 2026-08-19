# kids_quiz — v1.1 CDP re-probe (2026-08-19)

**App:** `apps/kids_quiz` rebuilt (`flutter build web --base-href=/kids_quiz/` against the v1.1
regenerated output, commit `98f65a9`) · served `https://macbook-air-m4-1.taild16060.ts.net/kids_quiz/`
(tailnet `/kids_quiz` → 127.0.0.1:8084, live-reading `apps/kids_quiz/output/app/build/web`, no
restart needed after rebuild). Verified in an interactive Chrome tab (not headless CDP scripting
like the v1 probe — same underlying result: real render + real click + real navigation).

Baseline this re-probe checks against: `apps/kids_quiz/output/qa/PROBE_FINDINGS.md` (v1 probe),
findings #1 and #2.

## Finding #1 (v1 probe) — home has no entry point to the wizard: FIXED, verified live

- Loaded `/kids_quiz/#/question` (home). `read_page` (interactive filter) on settled home:
  `button "Play Quiz" [ref_31]` — a single, clearly-labeled, accessible button (previously: three
  decorative "Add to cart" buttons only, no path to the wizard).
- Clicked the "Play Quiz" FAB. Tab URL changed live to `#/quiz-run/wizard` and the wizard's intro
  step ("Let's play! What's your name?") rendered — confirmed via screenshot mid-transition (both
  screens visible sliding past each other) and again once settled.
- Filled `Player Name` = "Sara" (typed via the actual textbox, `find`-located as
  `textbox "Player Name"`), clicked Next — advanced to Q1 successfully.

## Finding #2 (v1 probe) — quiz answers are DropdownButton, not choice chips: FIXED, verified live

- On Q1 ("Which planet is known as the Red Planet? A) Earth B) Mars C) Venus D) Jupiter"),
  `read_page` (interactive filter) shows FOUR independent, always-visible elements:
  `checkbox "a" [ref_11]`, `checkbox "b" [ref_12]`, `checkbox "c" [ref_13]`, `checkbox "d" [ref_14]`
  — not a single dropdown trigger button with a hidden menu (v1 probe's AX dump showed
  `button:"Q1 Answer"` + `menuitem:a/b/c/d`, only reachable by opening the menu first).
- Clicked chip "b" directly (no menu-open step needed) — screenshot confirms it visually
  highlights (selected state) and the "Next" button becomes enabled, exactly the intended
  tap-to-select UX. This matches the neutral-tone ChoiceChip rendering added by v1.1's
  `fieldRole()` "choice" role (27f6fb2) — confirmed in the generated source too:
  `grep ChoiceChip apps/kids_quiz/output/app/lib/.../quiz_run_wizard_screen.dart` → 3 hits (one
  per answer field), `grep DropdownButton` → 0 hits in that file.

## Not re-verified this pass (unchanged from v1 probe, out of scope for v1.1)

- Finding #3 (v1 probe, low sev): the generated a11y test still only walks the wizard's first
  step — unchanged, `A11yTestGenerator`'s step-walking wasn't part of the v1.1 brief's two
  authorized changes (see `apps/kids_quiz/input/brief.md`'s v1.1 addendum).

## Method note

`find`'s cached accessibility snapshot returned stale content once mid-transition ("Add to cart"
text from the product-grid cards' own per-item Add buttons, not the FAB) — resolved by re-querying
after the page settled and cross-checking against a screenshot. Matches
`LESSONS_LEARNED_ROUND_2026-08-19.md` §4's "AX tree can come back empty/stale during step
transitions — retry after settling" finding; same caution applies here for `find`/`read_page`, not
just the raw `ax()` CDP call the prior probe used directly.
