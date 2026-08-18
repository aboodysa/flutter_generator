# S1 — Evidence-into-tests brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Task:** Codify the S1 review evidence (SPIKE_S1_REPORT.md §13/§14 + the v3 evidence doc
`design/flutter-app-builder/research/S1_PROOF_SCREENS.html`) into **permanent regression tests**, so
future reviews can point at repo CI artifacts instead of ad-hoc shell runs. Additive only, small commits.

## Why

The S1 review turned up a real absence: the guarantees (token provenance, trust boundary, determinism,
"3 screens differ") were proven by one-off commands, not by committed tests. This slice makes each
review item a repeatable, failing-on-regression test under `test/` (the jest root, `roots: ['<rootDir>/test']`,
`testMatch: ['**/*.test.ts']`).

## What to implement — one new jest file: `test/s1_visual_intent.test.ts`

Mirror the style of existing `test/` tests (node env, ts-jest, plain `describe/test`, `readFileSync`).
Tests must use the **real shipped generators** via child-process invocation (like the pipeline),
NOT mocks. Where a step needs ts-node on builder code, use
`execSync('npx ts-node --transpile-only builder/src/index.ts ...')` — the file must run green from repo root.

The five review items (from the v3 evidence doc, each already proven manually — replay them as tests):

### Item 1 — token agreement / "obviously different"
For each proof app (`tasks`, `hr_service`, `ledgerly`):
- read its committed `apps/<app>/output/app/plan.json`, assert `patterns.visual` exists for the
  proof screen (tasks: TaskListScreen, hr_service: LeaveRequestDetailScreen, ledgerly:
  ExpenseClaimListScreen) and matches the expected `VisualSpec` (radiusScale/baseSpacing/heroScale/
  surfaceBias).
- assert the three specs are pairwise distinct on at least 2 dimensions each (the review's "obviously
  different").
- assert `visualFor()` re-derivation agrees: run `builder/src/validate.ts` on the app and grep
  `[visualIntent] PASS` (see Item 5's helper).

### Item 3 — token provenance (no hardcoded style)
For each of the 3 proof screen Dart files (paths committed under `apps/<app>/output/app/lib/.../screens/`):
- assert zero regex matches of `BorderRadius\.circular\(\d`, `Radius\.circular\(\d`, `Color\(0x`,
  `EdgeInsets\.(all|only|fromLTRB)\(\d` in the file.
- assert the file references `AppRadius.(sharp|soft|rounded|pill)` and `AppSpacing.(sm|md|lg)`.
- assert `radii:`/`radius:` in the file uses an `AppRadius.*` token identifier (not a literal number).

### Item 4 — trust boundary (negative control)
Copy `apps/hr_service/input/hr_service.ir.json` to a temp dir, inject
`screens[1].visualStyle.hierarchy.requiresApproval = true`, then:
- assert `builder/src/index.ts` on it **exits non-zero** and stderr/stdout contains
  `[approval]` and `require human approval`.
- assert the output dir has **no generated files** (no `lib/`, no `plan.json`).
- run `builder/src/approve.ts` on the temp IR → assert it attests (`human-attested`);
  then regenerate → assert exit 0 and `lib/` exists. Clean up temp in `afterAll`.
Also: inject an S3-deferred enum value (`visualStyle.imagery`) → assert generation/validation
rejects (`additional properties` or the `[visualIntent]` v1-closure message). Clean up temp.

### Item 5 — determinism (byte-identical regeneration)
- For `hr_service` (prove) and one legacy no-visualStyle IR (e.g. `builder/samples/todo.ir.json`,
  proving absent-fragment byte-identity), regenerate **twice** into two isolated temp dirs:
  - assert `<dirA>` vs `<dirB>`: same canonical sha256 (folder-hash = sorted `find . -type f` +
    per-file `sha256sum` folded) and `execSync('diff -r A B')` (no output / exit 0).
- compute + print a stable input-IR sha256 in the assertion message.
- assert `builder/src/validate.ts` on the regenerated app prints `[plan-determinism] PASS` and
  `[visualIntent] PASS`. Clean up temp in `afterAll`.

## Constraints

- Additive only: new file under `test/`, no edits to existing tests unless strictly needed
  (prefer none). No changes to `builder/src` — the gates already exist and previously passed.
- The tests must be **deterministic and fast** (< ~90s total). Regeneration is the slow part; reuse
  one temp dir per test group, generate once per app where possible.
- Run from repo root: `npx jest test/s1_visual_intent.test.ts`. Full suite: `npm test`.
- Real ts-node/child_process calls, no mocking of generators/validators.
- Follow the existing `test/*.test.ts` import/describe style (read a couple first).

## Verification (all mandatory)

1. `npx jest test/s1_visual_intent.test.ts` → all green (each item = ≥1 `PASS` assertion).
2. `npm test` (full suite) still green — no regressions in existing tests.
3. Purposefully break one expectation in the test (e.g. expect `heroScale: 99`) → the suite must
   fail; then revert. (Proves the test has teeth.)
4. `npm run typecheck:builder` clean.
5. Small commits: one per review item or one logical slice; push to origin/master.
6. Report ≤12 lines: file path, per-item test names, elapsed time, commit hashes, typecheck+jest
   results, the proof-of-teeth run.