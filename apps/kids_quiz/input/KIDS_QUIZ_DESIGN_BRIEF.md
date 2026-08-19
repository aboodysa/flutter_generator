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

## Open decisions for owner

1. **Quiz flow shape**: (a) list→detail learning mode (browse questions + answer, tap to check)
   AND wizard for a timed quiz run; or (b) wizard-only run. Default: (a) both, wizard for
   "Play Quiz".
2. **Points vs stars**: plain int points, or star emoji in verdict messages (stars render fine —
   real text, not Ahem).
3. **Demo seed data**: sample questions per category with real, human-readable content (the
   generator's demo rows read off `title`), sample badges.

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