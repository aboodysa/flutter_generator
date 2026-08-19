# KIDS-QUIZ — offline-first kids Q&A app with gamification — design brief (owner, 2026-08-19)

**Owner asks (verbatim, in order):**
1. "build offline first kids questions and answers using this tool"
2. "want it to have gamification components on it"

**Pending inputs:** Claude's real-apps benchmark (`apps/BENCHMARK_APPS_REPORT.md`) — will be
used to copy the best reference-app shape before scaffolding.

## Product intent

A kids Q&A / quiz app a parent hands their phone: **offline-first** (generated app keeps
working with no network — in-memory repo + hive_ce/drift schema present), **gamified** so kids
are motivated to keep answering (points, badges, streaks, progress).

## Domain model (IR entities)

1. `Question` — the Q&A core:
   - `title` (String, required) — the question text (primary display; list rows read human).
   - `category` (enum `QuizCategory` — e.g. animals/colors/numbers/science/logic, default
     `animals`).
   - `difficulty` (enum `QuizDifficulty` — easy/medium/hard, default `easy`).
   - `answerA`/`answerB`/`answerC`/`answerD` (String, required) — the four choices.
   - `correct` (enum `CorrectOption` — a/b/c/d, default `a`) — which choice is right.
   - `explanation` (String, required?) — shown after answering (learning value).
   - `points` (int, default 5) — how much answering this correctly earns.
   - `id` String identity.
2. `Badge` — the gamification achievement ledger:
   - `title` (String, required) — badge name (e.g. "First Answer", "Streak x5", "Perfect 10").
   - `kind` (enum `BadgeKind` — firstQuiz/streak3/streak10/score50/perfect10/api10, default
     `firstQuiz`).
   - `earned` (enum/bool `EarnedStatus` — locked/earned, default `locked`).
   - `points` (int, default 0) — bonus points when earned.
1. `QuizSession` (optional phase-2 entity — wizard flow) — a run through N questions:
   - `id`, `category`, `startedAt`, `answered`, `correct`, `score`, `streak`.
   - Could be a **wizard** screen: step = one question (choice chips), final step = result
     (points + streaks + badges earned).

## Gamification mapping onto EXISTING generator capabilities (no new generator work)

- **Points/verdicts → business rules (`RuleModel`)** — e.g. `ScoreRule` computing
  `correct*points` with `severity` + `message` so the policy panel shows "Correct! +5 ⭐";
  `BadgeEligibility` rule firing when `score >= threshold`. All oracle-backed
  (`input/rules/<rule>.oracle.json`, validator gate).
- **Badges → status-chip list rows** — Badge entity with `kind` + `earned` gives color-coded
  rows (earned vs locked) via AppChip/AppStatusDot; detail screen explains the badge.
- **Progress → wizard `LinearProgressIndicator`** (already emitted) + a visible "You're at
  step 4/10" + streak counter as a rule result or state field.
- **Quiz home → sections archetype** (keemart-shape): hero banner ("Let's Play!"), horizontal
  badge rail, question grid, floating "Start Quiz" cart-like FAB.
- **Kid-friendly visualStyle** — friendly personality, rounded corners, strong hierarchy;
  golden tests set 390×844.
- **Offline-first** — `persistence: "nosql"` (hive_ce adapter emitted alongside in-memory
  repo, which is what actually runs deterministically).

## L10n — Arabic, English, FRENCH (owner req, 2026-08-19)

The owner requires the kids Q&A app to support **ar, en, fr**. **Generator finding (L4.1 gap):**
today `localeOf()` (`builder/src/operations.ts` `"en" | "ar" | "both"`) and `AppStrings`
(`builder/src/generators/infra.ts` — `_ar`/`_en` maps) only cover en+ar; `supportedLocales` in
project.ts:91 is hard-coded to `Locale('en'), Locale('ar')`. French is NOT representable.

Required additive generator slice (L4.1) — small, mirrors the existing ar branch:
1. `localeOf`/`localeTypes` gain `"fr"` and a tri-locale mode (e.g. `"enArFr"` or a 3-array —
   decide with implementer; keep `"en"|"ar"|"both"` byte-identical for existing apps).
2. `infra.ts` `AppStrings` gains a `_fr` map (same fixed chrome vocabulary: appTitle/loading/
   error/retry/save/create/back/edit/delete/cancel/audit/noData/newLabel, translated to French).
3. `project.ts` `titleAndLocaleBlock` wires the third `Locale('fr')` + `supportedLocales` list.
4. `[l10n]` validate gate re-derived to match (French IR → fr strings present, ar→ar, etc.).
5. Regenerate samples that use locale (ledgerly `locale: "both"` untouched / byte-identical).
   IR attr proposal: `"locale": "enArFr"` (three languages) — the tri-locale kids app. Or reuse
   `"both"` + a `fr: true` sub-flag; owner/investigation decision. A 3-language enum keeps it one
   closed attribute: `"en" | "ar" | "enAr" | "enArFr"`.
6. RTL: Arabic already flips Directionality via supportedLocales (project.ts:91-100); French +
   English are LTR — the fix is purely the third locale + strings, no layout change.
7. Seeded question content itself (question title/choices/explanation) is generated seed data —
   for a trilingual kids app the DEMO ROWS should carry human content, and per-locale seed
   versions are an enhancement (see enhancement roadmap); v1 ships en seed rows, UI chrome in all
   three.

This is an **additive generator slice** for the implementer (Claude), NOT hand-editing a
generated app.

## Open decisions for owner — ANSWERED 2026-08-19 (orchestrator, post-benchmark)

1. **Quiz flow shape**: **(b) wizard-only run** — the stepped quiz IS a wizard: one question per
   step (choice chips), final step = result (stars + badges earned). Rationale: benchmark showed
   the wizard archetype is the proven (work_auth) and most polished; stepper progress + conditional
   steps map directly. No separate browse/detail learning mode in v1.
2. **Points vs stars**: **stars** — 1–3 stars per run + star counter on home/badges; verdict
   messages carry real star text (e.g. "Correct! +5 ⭐"). Points stay as the internal numeric
   accumulator that stars/badges derive from.
3. **Demo seed data**: **general knowledge** — topics like Animals/Space/Body/Colors; neutral,
   trilingual-friendly (en seed rows in v1; ar/fr chrome; per-locale seeds are an enhancement).
   Seed badges (First Quiz, Streak x5, Perfect 10) human-readable from the title field.

## Execution plan (after benchmark lands)

1. Read `apps/BENCHMARK_APPS_REPORT.md` → pick reference app (search + wizard + rules + states
   + sections all demonstrated).
2. Write `apps/kids_quiz/input/kids_quiz.ir.json` + `input/rules/*.oracle.json` + `brief.md`.
3. `index.ts` generate → `validate.ts` all gates → `flutter pub get` + analyze + test
   (goldens) → build web `--base-href=/kids_quiz/` → tailnet expose additive `/kids_quiz` →
   CDP probe (home, quiz run, badge list, search) at 320/390/768/1280 → screenshots + URL to
   owner on Telegram.
4. If any gamification need exceeds the current generator surface (e.g. launcher/celebration),
   recommend as an S-slice or enhancement — never hand-edit the generated app.