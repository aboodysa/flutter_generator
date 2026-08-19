# KIDS-QUIZ v1.1 — choice-chips for quiz answers + Play entry from home — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner asked for a kids Q&A with gamification and approved "wizard-style
stepped quiz" with choice selection; the live CDP probe confirmed quiz answers render as
`DropdownButton` (AX `menuitem:a/b/c/d`) — the owner's intended UX (tappable choices) is not
produced by the generator, and the home screen has no in-app entry to the wizard. This slice fixes
both on the **generator** side (never hand-edit the generated app).

Sources: `apps/kids_quiz/output/qa/PROBE_FINDINGS.md`, `apps/kids_quiz/input/brief.md` findings
#1–#3, `design/flutter-app-builder/research/LESSONS_LEARNED_ROUND_2026-08-19.md` (principles #3/#4).

## Task — TWO additive generator changes (small commits, in order)

### Part 1 — new `FieldRole = "choice"` renders as ChoiceChip everywhere (fixes findings #1–#3 in one move)

Root cause (confirmed): `fieldRole()` (`builder/src/operations.ts:252-271`) grants ChoiceChip
treatment only to enum fields literally named `status`/`decision`/`priority`. Every other enum
field (e.g. `q1Answer: CorrectOption`) falls to a bare `DropdownButton`. Three generators then
behave inconsistently:

- `screen.ts` wizard field input (`wizardFieldInput`, ~`:131-177` + the chip branch at `:841`)
- `crud_form.ts` (`:143-150`) — status/priority → ChoiceChip Wrap
- `test.ts` `PolicyTestGenerator.policyTriggerSteps` — **assumes** chip (`find.widgetWithText(
  ChoiceChip, cond.value)`) with no `fieldRole` check → a severity'd rule over a plain enum field
  generates a failing `policy_test.dart`
- `A11yTestGenerator` — dropdowns never bind `isEnabled`; chips do (already `isInMutuallyExclusiveGroup`+selected)

**Fix:** add `"choice"` to the `FieldRole` union and a rule in `fieldRole()` so an enum field whose
"of" enum type is a *multiple-choice candidate* resolves to `"choice"`:

1. **IR-level explicit hint (primary, per the existing `secret`/`currency`/`primaryDisplayField`
   explicit-marker pattern):** extend `types.ts` `Field` with `role?: "choice"` (additive; absent =
   today's behavior, byte-identical). `fieldRole()` checks it BEFORE the name-list heuristics.
2. **Value-shape heuristic (secondary, for IRs that don't declare the hint):** an enum field whose
   `enumValues` length is >= 2 AND whose field name does NOT match the status/priority/decision
   name-list → `"choice"`. Keep `status`/`priority`/`decision` matched FIRST (fixed order) so all
   existing apps stay byte-identical; only previously-"plain" enum fields change role.

Consumers to make consistent with `"choice"`:
- `screen.ts` wizard field input: chip branch for `"choice"` (mirror crud_form's ChoiceChip Wrap
  exactly, incl. `AppChip.colorForTone` + `AppChip.toneForStatus`? NO — use a neutral tone for
  choice, e.g. primary/selected color, NOT a status-tone heuristic; document the choice).
- `crud_form.ts`: add `"choice"` to the chip condition so a form field on a choice enum renders as
  chips too.
- `test.ts` `policyTriggerSteps`: check `fieldRole`; chip path for `"choice"`/`"status"`/
  `"priority"`, `DropdownButton` interaction path (tap trigger, tap the `DropdownMenuItem` whose
  text == cond.value) for every other enum field.
- `A11yTestGenerator`: choice-chip fields already bind semantics correctly (chips path); no change
  beyond what the chip branch emits.

**Regression contract:** all existing sample apps byte-identical (`npm run validate:gen` +
determinism gate + `git diff` on the 6 app outputs). Only IRs with a `role:"choice"` hint or a
previously-"plain" multi-value enum field change output.

### Part 2 — in-app entry: home → wizard ("Play")

The sections home (`question_list_screen.dart`, keemart archetype) has no link to `/quiz-run/wizard`.
Fix on the generator side:

- Add a **router action affordance** on the sections archetype's floating FAB so an IR can declare
  it as a navigation target instead of the decorative "Add to cart" SnackBar. Design with the
  implementer's judgment, additive: e.g. extend the `floatingCart` section type (or add a new
  `play` section type) with an optional `target` route + label; when `target` is set, the FAB
  becomes `FloatingActionButton.extended(label: '<label>', onPressed: () => context.go('<target>'))`.
- Apply it to `apps/kids_quiz/input/kids_quiz.ir.json` (label "Play Quiz", target `/quiz-run/wizard`)
  so the home screen actually launches the wizard. All other apps keep the decorative cart (absent
  `target` = today's behavior, byte-identical).

## Hard constraints

- **Never delete; additive only.** `builder/src` edits are the two changes above and nothing else.
- Deterministic core stays 0% LLM.
- Small commits: (1) fieldRole "choice" + consumers + gates/tests, (2) FAB navigation target +
  kids_quiz IR update + regen. Commit only when green.
- Regression tests: add `test/` cases for (a) a `role:"choice"` enum field renders ChoiceChip in
  wizard + CRUD form, (b) `policyTriggerSteps` dropdown path for plain-enum conditions, (c) FAB
  with `target` navigates. Prove each new test can fail pre-fix where practical.

## Deliverable

Both parts committed + pushed, `apps/kids_quiz/` regenerated (Part 2), all 6 existing apps
byte-identical, `npm test` green (new tests included), `validate.ts` ALL gates PASS on kids_quiz +
regression samples. Rebuild web + re-probe via CDP (home shows "Play Quiz" FAB → launches wizard;
quiz answers are ChoiceChips) per the probe checklist, evidence under
`apps/kids_quiz/output/cdp/` + `qa/`. Final message to the orchestrator (this session) with exact
command outputs; do NOT report to the owner directly.