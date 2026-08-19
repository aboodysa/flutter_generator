# HANDOFF — nosql persistence fixed (round: 2026-08-19, part 4)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**nosql offline persistence — CLOSED.** `generateHiveAdapter`/`generateDriftTable` now receive
`GenContext` and resolve entity + enum imports via `ctx.symbols`. kids_quiz flipped to
`persistence:"nosql"` and verified: 37/37 gates, 57/57 tests, 0 analyze errors, byte-identical
determinism, all 5 benchmark apps byte-identical. HEAD `27bb1e9` → new commit pending.

## This round

### nosql persistence fix — DONE (zen impl + verified)

- **Root cause**: `generateHiveAdapter` (`persistence.ts`) emitted a bare relative import
  (`import 'question.dart';`) from `data/local/` — the entity lives at `domain/entities/`.
  The function never received `GenContext`, so it had no access to `ctx.symbols` (the symbol
  table every other generator uses). Enum types (`f.of`) were also missing imports entirely.
- **Fix** (`persistence.ts`): both `generateDriftTable(entity, ctx?)` and
  `generateHiveAdapter(entity, enums, valueObjects, typeId, ctx?)` now accept `GenContext` and
  resolve entity + enum imports via `ctx.symbols.get(...)`. `index.ts` passes `ctx` through.
- **kids_quiz**: `persistence:"none"` → `"nosql"` — 3 adapter files now compile with correct
  package imports (`package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/...`).
- **Verification**: typecheck clean, validate 37/37, flutter analyze 0 errors, flutter test 57/57,
  double-regen byte-identical, keemart/tasks/work_auth/hr_service/ledgerly all byte-identical.

## Open findings still ahead (all documented)

1. `screen.ts` `appStringsUsed` unused_import (v1.1 probe, low).
2. `tasks` stray `test/temp_all_flows_test.dart` (breaks 5 tests, not generator-emitted).
3. Per-locale / human seed-content IR block (nice-to-have).

## This round (part 3: v1.1 slice) — ARCHIVED

### kids_quiz v1.1 — DONE (Claude impl, zen-verified, all pushed)

- **Part 1 — `FieldRole "choice"`** (`27f6fb2`): `fieldRole()` (operations.ts) gains `"choice"` for
  genuine multi-choice enum fields (explicit `Field.role:"choice"` hint + value-shape heuristic,
  status/priority/decision matched FIRST so existing apps stay byte-identical). Consumers made
  consistent: `screen.ts` wizard field chips, `crud_form.ts` chips, `test.ts` `policyTriggerSteps`
  now fieldRole-aware (chip OR dropdown-interaction path). Smoke-verified via `choice_demo.ir.json`.
- **Part 2 — FAB navigation target** (`98f65a9`): sections `floatingCart` accepts `target` route +
  label → `FloatingActionButton.extended(label, onPressed: context.go(target))`. kids_quiz updated:
  home "Play Quiz" → `/quiz-run/wizard`. Other apps keep decorative cart (absent target).
- **Independent re-probe** (`eab743a`): home shows `button:Play Quiz`; quiz answers render
  `checkbox:a/b/c/d` (real chips); full chip-driven run — name→Q1(b)→Q2(a)→Q3(b)→bonus "Perfect
  score!"→Your Results @100%, zero runtime errors. kids_quiz 52/52 tests, 37/37 gates, **0 analyze
  errors**. Generated surface of keemart/tasks/work_auth/hr_service/ledgerly **byte-identical**.
- New finding (low, latent): `screen.ts` `appStringsUsed` flag → unused_import of app_strings.dart
  on home (documented in `input/brief.md` v1.1 addendum; 0 errors held; fix in `screen.ts`).

## This round (part 2: post-benchmark) — ARCHIVED

### Fixes owner found while testing — DONE (Claude, zen-verified, all pushed)

- **keemart search (RCA-001)** `db7800f`/`08b1ba5`/`7e08400` — functional sections search; CDP-verified.
- **iOS keyboard (RCA-002)** `f7adb4f`/`9a9c355`/`21cd8b3` — SearchBar focus-bypass; then **KEYBOARD_ALL**
  `0f0921f` + regens `2b4daef`/`53f26d3`/`897be6b` (every CRUD/wizard text field gets the bypass).
- Wizard overflow (owner-approved) `019377b`.

### Benchmark — DONE (`apps/BENCHMARK_APPS_REPORT.md`, f04979a)

- 6 real apps: byte-identical regen, **37/37 gates**, 0 analyze errors, double-regen deterministic.
- Reference = **work_auth** (wizard+rules+search+states); showcase = **keemart**; deepest rules =
  **ledgerly** (9). Top gap = persistence in-memory everywhere (nosql has no repo impl behind it).

### kids_quiz + L4.1 — DONE (Claude, zen-verified, pushed)

- **L4.1 French locale** (`b7f20e2`): `attributes.locale="enArFr"`, `_fr` AppStrings, 3× `Locale` —
  existing apps byte-identical.
- **kids_quiz app** (`dca6ebc`): `apps/kids_quiz/` — `Question`/`Achievement`/`QuizRun`, 5
  oracle-backed rules (`Question1-3Correct`, `PerfectRun`→conditional bonus step, `RunCompleted`→
  "+5 ⭐" verdict), wizard 6 steps (intro/q1/q2/q3/bonus/result). 37/37 gates, **52/52 tests**, 0
  analyze errors, determinism byte-identical.
- **Exposed**: `/kids_quiz` → 127.0.0.1:8084, URIs 200. **Probed via CDP**: full quiz run driven —
  name → 3 questions → bonus unlocked (perfect score) → result at 100%. Zero errors. Evidence +
  findings: `apps/kids_quiz/output/cdp/`, `output/qa/PROBE_FINDINGS.md`.
- **Lessons** committed: `LESSONS_LEARNED_ROUND_2026-08-19.md` + AGENTS.md guiding principles
  (e98688c); web scaffold tracked (f1d34e3).

## Ground truth

| Item | Value |
|---|---|
| HEAD | `27bb1e9` (master, pushed; equals origin/master) |
| typecheck | clean (`npm run typecheck:builder`) |
| jest s1 | 20/20; `npm test` green; validate 37/37 per app |
| kids_quiz flutter | 57/57, **0 analyze errors** (warnings only); nosql adapters compile clean |
| Lanes | `s-hermetic` idle @ `❯`; `germany3` idle |
| Tailnet | `/kids_quiz`@8084, `/keemart`@8083, `/tasks`@8081, `/hr_service`@8082, `/api`@3000. `/`@8080 down (pre-existing) |
| Remotes | tracematrix `/root/fg-p5` — synced to origin/master |

## Next steps

1. `screen.ts` `appStringsUsed` unused_import cleanup (v1.1 probe finding, low).
2. `tasks` stray `test/temp_all_flows_test.dart` cleanup + lint template fixes
   (`unnecessary_non_null_assertion`, a11y-test unused_import/pipelineOwner).
3. Seed-data IR block (per-locale, human content for `Question` bank) — nice-to-have.
4. S4 (asset library+manifest) remains the roadmap slice after P5 baseline v1.

## Key files

- `builder/src/generators/persistence.ts` — `GenContext` threading + enum imports
- `apps/kids_quiz/output/rca/RCA-002-nosql-hive-adapter-import.md`
- `apps/BENCHMARK_APPS_REPORT.md`, `apps/kids_quiz/input/{KIDS_QUIZ_DESIGN_BRIEF.md, brief.md}`,
  `research/KIDS_QUIZ_IMPL_BRIEF_CLAUDE.md`
- `apps/kids_quiz/output/{app, cdp/, qa/PROBE_FINDINGS.md}`
- RCAs: `apps/keemart/output/rca/RCA-001…`, `apps/kids_quiz/output/rca/RCA-001…`, `RCA-002…`, `apps/tasks/output/rca/RCA-005…`
- `design/flutter-app-builder/research/LESSONS_LEARNED_ROUND_2026-08-19.md`; AGENTS.md guiding principles