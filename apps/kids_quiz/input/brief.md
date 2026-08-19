# kids_quiz — implementer brief (Slice B)

## Product intent + decisions

Offline-first kids Q&A/quiz app with gamification, per the owner's asks ("build offline first
kids questions and answers using this tool", "want it to have gamification components on it",
"support Arabic, English, French") and the three answered decisions in
`KIDS_QUIZ_DESIGN_BRIEF.md`: (1) a **wizard-style stepped quiz** — one question per step (choice
selection), final step = result; (2) **stars as the visible currency** — verdict messages carry
real star text ("+5 ⭐"), `points`/rule conditions stay the internal numeric mechanism; (3)
**general-knowledge seed content** (space/animals/colors/body), EN seed rows in v1, ar/fr UI
chrome via the new L4.1 `enArFr` locale mode.

Reference app: `work_auth` (list + detail + wizard + rules + budget + states, per
`apps/BENCHMARK_APPS_REPORT.md`) — this IR mirrors its shape closely: `QuizRun` is walked by both
a `QuizRunListScreen` (list, gets an auto CRUD create/edit form since its repo has create+update)
and a `QuizRunWizardScreen` (wizard), exactly like `WorkAuth`/`WorkAuthListScreen`/
`WorkAuthWizardScreen`.

## Entity map

- **Question** (`QuestionRepository`, read-only bank): title/category(`QuizCategory`)/
  difficulty(`QuizDifficulty`)/answerA-D/correct(`CorrectOption`)/explanation/points. Browsed via
  `QuestionListScreen` (type `sections`, keemart-shaped: header/search/hero "Let's Play & Learn!"/
  horizontalCards "Fresh Questions"/section+productGrid "All Questions").
- **Achievement** (`AchievementRepository`, read-only ledger) — the design brief's "Badge" entity,
  renamed (see Findings #2 below): title/kind(`BadgeKind`)/earned(`EarnedStatus`)/points. Browsed
  via `AchievementListScreen` (list).
- **QuizRun** (`QuizRunRepository`, full create+update — this is what makes it BOTH list- and
  wizard-reachable): playerName/category/q1Answer/q2Answer/q3Answer (all `CorrectOption`)/
  status(`RunStatus`: inProgress/completed).

## Wizard step list (`QuizRunWizardScreen`)

1. `intro` — "Let's play! What's your name?" (`playerName`)
2. `q1` — "Q1: Which planet is known as the Red Planet? A) Earth B) Mars C) Venus D) Jupiter"
   (`q1Answer`, correct = b)
3. `q2` — "Q2: Which animal says 'Moo'? A) Cow B) Cat C) Dog D) Duck" (`q2Answer`, correct = a)
4. `q3` — "Q3: What color do you get by mixing blue and yellow? A) Purple B) Green C) Orange
   D) Pink" (`q3Answer`, correct = b)
5. `bonus` — "Perfect score! Bonus round unlocked!" — **conditional**, `when: PerfectRun`, no
   fields (pure celebratory info step, mirrors `work_auth`'s `NeedsManagerReview` conditional-step
   pattern exactly)
6. `result` — "Your Results" (review/summary of everything collected)

## Business rules (all oracle-backed, `input/rules/*.oracle.json`, 4 cases each)

| Rule | Entity | Condition | Severity | Wired into |
|---|---|---|---|---|
| `Question1Correct` | QuizRun | q1Answer == b | *(plain)* | oracle-verified only (see gap below) |
| `Question2Correct` | QuizRun | q2Answer == a | *(plain)* | oracle-verified only |
| `Question3Correct` | QuizRun | q3Answer == b | *(plain)* | oracle-verified only |
| `PerfectRun` | QuizRun | q1==b AND q2==a AND q3==b | *(plain)* | wizard's `bonus` step `when:` gate (live, conditional) |
| `RunCompleted` | QuizRun | status == completed | **warn** | `QuizRunListScreen`'s auto CRUD form policy panel — live "Great job finishing the quiz! +5 ⭐" verdict |

## Verification (all green)

- `index.ts` regen: **deterministic** — two independent fresh regens diff empty; in-place regen
  matches committed output byte-for-byte.
- `validate.ts`: **all 37 gates PASS**, `VALIDATION PASSED` (incl. `[l10n]` for the new `enArFr`
  mode, `[oracle]`/`[verdict]` for all 5 rules, `[sections]` for the sections-type home).
- `flutter analyze`: **0 errors** (11 lint/warning issues, the exact same two recurring cosmetic
  patterns — `unnecessary_non_null_assertion` in generated state files, `unused_import`+
  `deprecated_member_use('pipelineOwner')` in generated a11y tests — already documented across
  every app in `apps/BENCHMARK_APPS_REPORT.md`).
- `flutter test --update-goldens` then `flutter test`: **52/52 passed**, including the
  auto-generated `policy_test.dart` (RunCompleted verdict) and the wizard's a11y test.

## Findings — real generator gaps discovered building this app (not fixed; out of scope per the
brief's "your builder/src edit is the L4.1 locale slice only")

All three trace to the same root cause: **`fieldRole()` (`builder/src/operations.ts`) only grants
`ChoiceChip` treatment to an enum field literally named `status`/`decision`/`priority`** — every
other enum field (e.g. a quiz answer, `q1Answer: CorrectOption`) falls through to a bare
`DropdownButton`. That's a reasonable default on its own, but three OTHER generators assume the
chip path unconditionally, and none of the 6 previously-benchmarked apps ever exercised a plain
(non-status/priority) enum field in a wizard or CRUD form, so this never surfaced before:

1. **[medium] `PolicyTestGenerator` (`generators/test.ts`'s `policyTriggerSteps`) assumes ANY
   `field.type === "enum" && operator === "=="` condition is chip-driven** (`find.widgetWithText(
   ChoiceChip, cond.value)`), with no `fieldRole` check. A severity'd rule whose condition targets
   a plain enum field (e.g. an original draft of `Question1Correct` with `severity: "warn"`)
   generates a `policy_test.dart` that fails outright — it searches for a `ChoiceChip` that was
   never rendered (a `DropdownButton` was). Worked around here by keeping `Question1Correct` et
   al. severity-less (plain, oracle-verified rules) and putting the one severity'd/policy-panel
   rule (`RunCompleted`) on a genuinely `status`-named field instead — an honest, non-gamed
   modeling choice (a "run" entity naturally has a lifecycle status), not a workaround that
   distorts the domain. Recommend: teach `policyTriggerSteps` to check `fieldRole` and emit a
   `DropdownButton` interaction (`tester.tap` + `tester.tap` the matching `DropdownMenuItem`) for
   non-chip enum fields, or widen the chip-eligible role set.
2. **[medium] `A11yTestGenerator`'s generated wizard test only renders/inspects the wizard's
   INITIAL step** — `appRouter.go('/quiz-run/wizard')` then `pumpAndSettle()`, never taps "Next".
   Combined with gap #3 below, this means any a11y issue on step 2+ is invisible to the generated
   test today. Discovered because the original wizard design had `category` (a plain enum,
   `QuizCategory`) on the first step, which tripped gap #3 directly in the one step that IS
   checked; `category` was moved off the wizard's `intro` step to avoid it (kept as a plain entity
   field, still valid/available for a future CRUD-editable use). Recommend: drive the a11y test
   through every wizard step (tap Next after asserting each), not just the first.
3. **[medium] A bare Flutter `DropdownButton` never explicitly binds `SemanticsData.isEnabled`**
   (stays `Tristate.none`) even though it's flagged `isButton` — so `A11yTestGenerator`'s "every
   button node must have a bound enabled/disabled state" check fails on ANY plain-enum
   `DropdownButton`, wizard or CRUD form. `ChoiceChip`-rendered fields don't have this problem
   (they're `isInMutuallyExclusiveGroup`+explicit `selected:`, a different, correctly-bound flag).
   This is why `q1Answer`/`q2Answer`/`q3Answer` (both wizard-step and — via the auto CRUD form —
   `QuizRunListScreen`'s "New" form) still carry this latent gap even after the `category` fix
   above; it's simply never exercised by the generated a11y test today (gap #2). Recommend, as one
   shared fix for gaps #1–#3: broaden `fieldRole`'s chip eligibility beyond the fixed
   status/priority/decision name list (e.g. an explicit IR-level `Field.role: "choice"` hint, or a
   value-shape heuristic), so a genuine multiple-choice field like a quiz answer renders as a
   properly-bound `ChoiceChip` everywhere — which would fix the a11y binding AND make
   `PolicyTestGenerator`'s existing chip-tap logic correct for it, in one move. This is also
   exactly the "chip, not dropdown" UX the design brief's decision #1 asked for — recommend as a
   real S-slice for a v1.1 gamification/quiz-app pass.
4. **[low] Entity name collision: `Badge` vs. `package:flutter/material.dart`'s own `Badge`
   widget.** The design brief's gamification-ledger entity was originally named `Badge`
   (per `KIDS_QUIZ_DESIGN_BRIEF.md`'s domain model); the generated `test/scroll_test.dart` imports
   both `material.dart` and the generated barrel (`generated.dart`, which exports the entity),
   producing an `ambiguous_import`/`invocation_of_non_function` compile error on every
   `Badge(...)` construction. Renamed to `Achievement` in this IR (semantically equivalent,
   collision-free) rather than working around it in generated code. Not a generator bug — it's a
   real hazard for any IR author naming an entity after a common Material widget (`Badge`, `Card`,
   `Chip`, `Icon`, `Text`, `Banner`, ...); worth a documented naming-convention note (e.g. `[arch]`
   or a new lint gate warning when an entity name shadows a `package:flutter/material.dart` export)
   rather than a code fix.
5. **[low, previously latent] `generateHiveAdapter` (`generators/persistence.ts`) emits a bare
   relative import — `import '${fileName(entity.name)}';` (e.g. `import 'question.dart';`) — from
   `lib/features/<f>/data/local/<entity>_adapter.dart`, which does NOT resolve (the entity file
   actually lives at `domain/entities/<entity>.dart`), because `index.ts`'s call site
   (`generateHiveAdapter(entity, ir.enums, ir.valueObjects, index)`) never passes a `GenContext`/
   `ctx.symbols` the way every other generator (e.g. `rule.ts`) does to resolve an entity's real
   import path. Discovered by first attempting `attributes.persistence: "nosql"` per the design
   brief's offline-first framing (`flutter analyze` → 5+ `uri_does_not_exist`/`undefined_class`
   errors per entity). Never caught before: `rasheed` is the only other `nosql`-scored real app,
   and it generates zero screens/CRUD extras, so the `arch.persistence !== "none"` → hive-adapter
   code path in `index.ts` was never actually reached by any of the 6 benchmarked apps. This app
   ships with `persistence: "none"` instead (matches every other real app; functionally identical
   at runtime either way — even `nosql` apps currently seed/mutate through the same in-memory
   `_items` list, the persistence axis today only changes which schema-scaffold files are
   emitted alongside it). Recommend: pass `GenContext` into `generateHiveAdapter`/
   `generateDriftTable` and resolve the entity import via `ctx.symbols.get(entity.name)`.

None of the above were fixed here — `builder/src` was touched only for the L4.1 French-locale
slice (Slice A), per the brief's explicit scope. All five are reported as findings for a future
S-slice.

## Other honest gaps (not generator defects, just v1 scope)

- Per-row seed content (`Question`/`Achievement`/`QuizRun` demo rows) is 100%
  deterministically-synthesized placeholder text (`"Sample Question 0"`, etc.) — this is universal
  generator behavior, true for all 6 benchmarked apps (even keemart's "showcase" product rows read
  "Sample Product 1"). The real, human-authored general-knowledge content lives in the wizard
  step's literal `title` text (fully IR-controlled), which is the only place today an IR author
  can put bespoke copy. A first-class per-entity seed-data IR block would let the `Question` bank
  itself show real trivia rows too — noted as a nice-to-have, not attempted here.
- `status` defaults to `inProgress` even after finishing the wizard (the wizard's `finish()` only
  ever sets step-collected fields + entity defaults) — marking a run `completed` today happens via
  the separate `QuizRunListScreen` → "Edit" CRUD form. Wiring the wizard's own Finish action to
  also flip `status` would need either a step that binds it, or a small enhancement letting a
  wizard's `finish()` set an additional literal field value beyond what's step-collected.
- French seed content: per the design brief, v1 ships EN seed rows with ar/fr UI chrome only
  (`AppStrings`); per-locale seed content is future work, same scoping the design brief already
  called out.
