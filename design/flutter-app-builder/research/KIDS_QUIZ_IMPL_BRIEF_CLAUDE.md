# KIDS-QUIZ — offline-first kids Q&A with gamification (ar/en/fr) — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner asks, in order — "build offline first kids questions and answers using
this tool", "want it to have gamification components on it", "support Arabic, English, French".
Design brief: `apps/kids_quiz/input/KIDS_QUIZ_DESIGN_BRIEF.md`. Benchmark (reference): committed
`apps/BENCHMARK_APPS_REPORT.md` — reference app **work_auth** (wizard+rules+search+states).

## Owner decisions (answered 2026-08-19, recorded in the design brief)

1. **Quiz flow shape:** wizard-style stepped quiz — one question per step (choice chips),
   final step = result (stars + badges). This is a genre fit for work_auth's wizard archetype.
2. **Currency: stars** — verdict messages show real star text ("Correct! +5 ⭐"); 1–3 stars per
   run + star counter on home/badges. `points` stays as the internal numeric accumulator.
3. **Seed data: general knowledge** — Animals / Space / Body / Colors etc.; human-readable
   titles, trilingual-friendly. v1 ships EN seed rows; ar/fr UI chrome; per-locale seeds are an
   enhancement, not v1.

## Scope — TWO slices (small commits, in order)

### Slice A — L4.1 generator slice: French locale (additive, no behavior change for existing apps)

Required additive change to `builder/src` so the kids app can hard-wire `fr`:

1. `operations.ts` `localeOf()` return type + the locale attribute validation gain `"fr"` and a
   tri-locale mode. Keep existing `"en"|"ar"|"both"` byte-identical (all existing apps' outputs
   unchanged — the benchmark proves byte-identical regen; a `[determinism]`/`[l10n]` regression
   run guards this).
2. `generators/infra.ts` `AppStrings` gains a `_fr` map (same fixed chrome vocabulary:
   appTitle/loading/error/retry/save/create/back/edit/delete/cancel/audit/noData/newLabel —
   translate to French). Re-derive `generateLocaleAwareLocalization()` for the new mode.
3. `generators/project.ts` `titleAndLocaleBlock()` + `supportedLocales` list gains
   `Locale('fr')` when the tri mode is set; MaterialApp wiring for tri (LTR en+fr, RTL ar float —
   French/English are LTR, Arabic flips Directionality already, no layout change).
4. `validate.ts` `[l10n]` gate re-derived: map the new attribute value → asserts fr strings
   present when set.
5. Type: `"en" | "ar" | "both" | "enArFr"` in one closed enum (design brief §L10n item 5).

Regression contract: `npm run validate:gen` + all sample regens stay byte-identical EXCEPT the
kids app; keemart/tasks/work_auth/hr_service/ledgerly/rasheed outputs must NOT change.

### Slice B — Kids quiz app build from IR (`apps/kids_quiz/`)

1. Write `apps/kids_quiz/input/kids_quiz.ir.json` per the design brief domain model +
   decisions: `Question` (title/category/difficulty/answerA–D/correct/explanation/points),
   `Badge` (title/kind/earned/points), wizard quiz-run screen (steps = one question per step,
   choice chips via enum `CorrectOption` field, final step = results), states declared. Follow
   the sample IR style (`apps/work_auth/input/work_auth.ir.json` as the closest shape).
2. `apps/kids_quiz/input/rules/<rule>.oracle.json` ≥1 case each for the gamification rules you
   declare (e.g. `ScoreRule` correct*points, `BadgeEligibility` score ≥ threshold). **A rule
   without an oracle stays blocked** (non-negotiable #4).
3. `apps/kids_quiz/input/brief.md` (1 paragraph: product intent + decisions + anything you
   discovered while wiring the wizard).
4. Generate → `apps/kids_quiz/output/app/`:
   `npx ts-node --transpile-only builder/src/index.ts apps/kids_quiz/input/kids_quiz.ir.json apps/kids_quiz/output/app`
5. Validate ALL gates (`validate.ts <ir> <out>`) — must pass. Then in the output app:
   `flutter pub get && flutter analyze && flutter test --update-goldens && flutter test`.
6. Commit: brief (dd2d185 already has design brief; new commit = IR+oracles+brief+regenerated
   app+goldens).

## Hard constraints

- **Never delete; additive only.** No edits to generated app source by hand. Fix any generator
  shortfall in `builder/src` (as an S-slice proposal if it needs a design call — do NOT silently
  invent generator surface beyond the L4.1 slice). Anything that exceeds the current wizard
  surface (e.g. celebration/launcher screens) → record as a proposed enhancement in the brief,
  don't hand-write it into the generated app.
- Deterministic core stays 0% LLM. Your `builder/src` edit is the L4.1 locale slice only.
- Small commits, 2 sliices. Commit only after green.

## Deliverable

`apps/kids_quiz/` fully generated + verified (validate ALL gates PASS, flutter analyze 0 errors,
flutter test green with goldens), L4.1 committed, both slices pushed. Final message to the
orchestrator (this session): IR entity map, rule list, wizard step list, validation + analyze +
test outputs. Do NOT report to the owner directly.