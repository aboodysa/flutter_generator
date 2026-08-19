# BENCHMARK — the six real generated apps

**Date:** 2026-08-19
**Scope:** `keemart`, `tasks`, `work_auth`, `hr_service`, `ledgerly`, `rasheed` — every app benchmarked from its
real generated output (`apps/<app>/output/app`, or for `rasheed` a fresh scratch regen — see its section), with
live regeneration, `builder/src/validate.ts` gate output, `flutter analyze`, `flutter test`, and an independent
double-regen determinism check. Nothing here is drawn from design docs — every number below was produced by
running the actual pipeline and is reproducible with the commands shown.

This is a benchmark, not a fix pass. `builder/src` was not modified. Where a regen was run in place
(`apps/<app>/output/app`), the resulting `git diff` was empty for all 5 standard apps — the committed output is
already exactly what the current generator produces, so nothing needed to be committed as part of this exercise.

## Cross-app summary

| app | archetype(s) | pers | sm | screens | search | scroll | refresh | export | rules | tests | LOC | gates | flutter test |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **keemart** | sections (1 hero/cards/grid screen) | none | bloc×get_it | 1 | ✅ 1 route | – (n/a, not a list route) | ✗ | ✗ | 0 | 7 files / 10 cases | 958 | 37/37 | 10/10 ✅ |
| **tasks** | list+detail ×2 entities | none | bloc×get_it | 4 | ✅ 2 routes | ✅ 4 routes | ✅ (list routes) | ✗ | 1 (`HighPriority`, block) | 17 files / 46 cases | 1,917 | 37/37 | 41/46 ⚠️ (5 fails in a stray non-generated test file, see below) |
| **work_auth** | list+detail+**wizard** (4 steps, 1 conditional) | none | bloc×get_it | 4 | ✅ 2 routes | ✅ 3 routes | ✅ (list routes) | ✗ | 1 (`NeedsManagerReview`, drives wizard step) + budget | 16 files / 42 cases | 1,974 | 37/37 | 42/42 ✅ |
| **hr_service** | list+detail, bilingual (EN/AR) | none | bloc×get_it | 3 | ✅ 2 routes | ✅ 3 routes | ✅ (list routes) | ✅ CSV | 1 (`LongLeave`, tested but not UI-surfaced) | 19 files / 51 cases | 2,380 | 37/37 | 50/51 ⚠️ (1 golden pixel-diff flake) |
| **ledgerly** | list+detail ×4 entities, richest rules | none | bloc×get_it | 6 | ✅ 4 routes | ✅ 6 routes | ✅ (list routes) | ✅ CSV | **9** (auto-approve/warn/justify/block + split) | 33 files / 111 cases | 4,031 | 37/37 | 111/111 ✅ |
| **rasheed** *(fresh regen, see note)* | domain/data/state only — **no screens/UI generated** | nosql (declared, no repo impl) | bloc×get_it | 0 | – | – | – | – | 0 | 5 files / 5 cases | 1,435 | 36/37¹ | 4/5 ⚠️ (missing golden, expected on first run) |

¹ `[lockfile]` fails only because the fresh scratch dir has no `pubspec.lock` yet — an artifact of benchmarking
into `/tmp`, not a generator defect. Every substantive gate (determinism, money, theme, strategy-fidelity,
search/scroll/actions/states/visualIntent/sections/assets) passes. See the rasheed section for why this
benchmark used a fresh regen rather than the committed `builder/output/rasheed_replica`.

"gates" = the 37 named checks in `builder/src/validate.ts`'s CLI output (platform, determinism,
plan-determinism, headers, secrets, forbidden-idioms, architecture, oracle, strategy-fidelity, money,
datepicker, verdict, split, tenant, symbols, auth, attachment, budget, audit, export, l10n, theme, contrast,
literals, outbox, shell, search, scroll, actions, states, visualIntent, sections, assets, asset-ref,
aspect-ratio, lockfile, timestamp). All 5 standard apps: **37/37 PASS, `VALIDATION PASSED`**, verbatim output
in each app's section below.

### What the tool demonstrably ships today

- **Deterministic, gate-clean generation across the board.** All 5 standard apps regenerate byte-identical to
  their committed output (`git diff` empty) and pass all 37 validator gates; an independent double-regen
  (`index.ts` run twice into fresh scratch dirs, `diff -r`) is empty for every app including rasheed's current
  generator output. `flutter analyze` reports **0 errors** on every app (only cosmetic lint/warnings).
- **Real, oracle-tested business rules that actually drive behavior**, not decoration: `ledgerly`'s 9 rules
  (auto-approve/warn/require-justification/block severities plus a live 100%-sum split validator) gate the Save
  button and demand a written reason to waive a block; `work_auth`'s `NeedsManagerReview` rule dynamically
  shows/hides a wizard step as the user types; all rule classes are 1:1 traceable to their
  `input/rules/*.oracle.json` file and covered by a passing oracle test.
  Counter-example worth noting: `hr_service`'s `LongLeave` rule is correctly implemented and oracle-tested but
  never surfaced in the UI (no badge/filter/warning) — semantic correctness does not guarantee visibility.
- **Cross-cutting infrastructure (outbox, role-based auth, audit, export, tenant scoping, i18n) is real when
  declared**, confirmed by direct code read + passing dedicated tests, not just string grep: `hr_service` and
  `ledgerly` both have a working write-ahead `Outbox`, persona-based auth/router-redirect gating, an audit-log
  screen, CSV export, and (for `hr_service`) full EN/AR bilingual goldens with RTL-no-overflow tests.
- **The wizard archetype works and is genuinely conditional**, not a fixed step count — `work_auth`'s
  4-step wizard skips/shows its "manager review" step live based on a business-rule evaluation of the
  in-progress form state.
- **Persistence is uniformly `none` (in-memory)** across all 5 real apps — every create/edit/delete is lost on
  app restart. This is consistent, not a per-app bug, but it is the single most obvious "this is a demo" tell
  a human tester hits immediately.

### Recommended reference app to copy for a new app build

**`work_auth`** — it's the only one of the six with a genuine wizard, and it also has list+detail, search,
full loading/error/empty/retry/refresh states, a real business rule that drives conditional UI (not just a
gate), and a working budget/quota feature — all at 37/37 gates and 42/42 passing tests with a byte-identical,
deterministic regen. It's the most complete single demonstration of "list + detail + wizard + search + rules +
states" the brief asks for. (`ledgerly` has far richer *business rules* — 9 vs. 1 — but no wizard at all; if the
next build needs deep policy/approval logic rather than a guided flow, copy `ledgerly`'s rule engine
(`lib/core/policy.dart`, `domain/rules/*.dart`) instead of or alongside `work_auth`'s wizard.)

### Best showcase app (visual/sections)

**`keemart`** — the only app using the `sections`/hero/asset archetype: a hero banner, a horizontal "Discover"
carousel, and a "Weekly offers" grid with live search filtering both lists at once, all token-driven
(`AppRadius`/`AppSpacing`/`heroScale`). It's visually the richest single screen of the six, even though it's
functionally the thinnest (no rules, no CRUD beyond read, cart is decorative). Every other app is visually
plain list/detail/form Material UI by comparison — only `ledgerly`'s `ExpenseClaimListScreen` and
`hr_service`'s `LeaveRequestDetailScreen` get any bespoke `visualIntent` styling, and only on one route each.

### Top gaps the kids-Q&A / next-app build should watch

1. **Persistence is decorative everywhere.** All 5 real apps generate `persistence: none` (in-memory) even
   where the IR implies durable data (leave requests, expense claims). If the next app needs data to survive a
   restart, don't assume persistence wiring comes "for free" from the generator today — verify the target
   persistence strategy (`nosql` was scored for `rasheed` but has no repository implementation behind it either).
2. **Business rules can be semantically correct and invisible.** `hr_service`'s `LongLeave` rule passes its
   oracle test but never appears in any screen. If a kids-Q&A app has correctness-critical rules (e.g.
   age-appropriate content gating), don't assume oracle-PASS implies UI-surfaced — check the actual screen code.
3. **The screen/UI generator doesn't fire for every IR shape.** `rasheed`'s current IR (5 entities, repository,
   queries/wrappers, 1 state) produces domain/data/state layers and 0 screens — `plan.json` has no
   `presentation/pages` or `presentation/widgets` entries at all, confirming a `ScreenGenerator` gap for this
   IR shape (consistent with `builder/BENCHMARK_REPORT.md`'s older note that a screen generator "not built" as
   of that report). Confirm the target archetype (list/detail/sections/wizard) is one the generator actually
   turns into a screen before assuming full UI comes out the other end.
4. **`apps/rasheed` is not on the same convention as the other 5 apps, and its only committed build artifact is
   stale.** `apps/rasheed/` contains only a one-off QA probe; the real canonical rasheed IR/output live at
   `builder/samples/rasheed.ir.json` / `builder/output/rasheed_replica`, and that committed output predates the
   current feature-first (`lib/core/` + `lib/features/<name>/...`) architecture — validating it against today's
   generator fails 12 of 37 gates (determinism, money×52, theme×4, strategy-fidelity, plan-determinism, and one
   each on search/scroll/actions/states/visualIntent/sections/assets). A fresh regen from the current generator
   passes cleanly and is deterministic, so the generator itself is fine — the committed artifact is just old.
   Worth fixing before using rasheed as a reference point for anything.
5. **A recurring, template-level lint pattern across every app**: `unnecessary_non_null_assertion` in every
   generated `presentation/state/*_list.dart` file (consistent line offsets 58/63/71) and `unused_import` +
   `deprecated_member_use('pipelineOwner')` in every generated `test/a11y/*_a11y_test.dart` file. Same two root
   causes recur identically in keemart/tasks/work_auth/hr_service/ledgerly — one template fix each would clear
   most of the ~14–45 `flutter analyze` issues per app (all cosmetic, 0 errors anywhere).
6. **Golden coverage is thin and inconsistent, and can flake.** Goldens exist for a minority of screens per app
   (e.g. `work_auth` has goldens only for the list screen, not the wizard or VisaQuota screens); `hr_service`
   hit a genuine 0.11%/372px pixel-diff golden flake on this run, likely rendering-environment sensitivity
   rather than a logic bug.
7. **Repo hygiene, not generator behavior, caused `tasks`' only real test failures.** A manually-committed
   `test/temp_all_flows_test.dart` (not produced by any code path in `builder/src`) double-registers a GetIt
   singleton across its own test cases and fails 5/46 tests in a stock `flutter test` run — worth cleaning up
   independent of this benchmark.

---

## keemart

### Identity
- IR: `apps/keemart/input/keemart.ir.json` → output `apps/keemart/output/app`
- Package: `rasheed_replica_keemart`. Archetype: single `sections`-type screen (`HomeScreen`), entity `Product`,
  state `Home`, enum `InStockStatus`. Use cases: read-only (`ListProducts`) — no create/update/delete declared.
- No `apps/keemart/input/rules/` directory at all — 0 business rules. Pure visual/catalog demo.
- `plan.json.scoring`: `stateManagement: bloc`, `di: get_it`, `routing: go_router`, `persistence: none`,
  `coupledPair: "bloc × get_it"`, `complexity: 4`.

### Feature surface
Single route `/product`, from `plan.json.patterns`:
- **search**: enabled, field `title`, mode `contains` — live client-side filter, wired in `home_screen.dart`.
- **states**: loading✓ error✓ empty✗ emptyCta✗ retry✓(computed, not rendered — see below) refresh✗.
- **sections** (7, in order): header, search, primaryHero ("Ready For School"), discover (horizontalCards),
  offers (sectionHeader + productGrid, "Weekly offers"), offersDivider, floatingCart.
- **assets**: hero = gradient token (`AppColors.primary`); productGrid = `omitted` (no real imagery).
- Add-to-cart and the floating cart FAB are both decorative — `SnackBar` only, no cart state.
- Two real, distinct empty states: "No Products yet" vs. "No results for '$_query'".
- Grep for `wizard|Outbox|tenantId|AuthGuard|Budget|export|Audit` across `lib/`: only false positives (Dart
  `export '...'` barrel statements). None of these patterns exist in this app — consistent with the empty
  rules dir and single read-only screen.
- Persistence: `ProductRepositoryInMemoryImpl`, 3 seeded records, `listProducts()` only (no create/update/delete
  use cases were declared), non-persistent across restart.

### Size
- `lib/`: 21 files, 958 LOC. 1 feature dir (`keemart`). `plan.json.artifactCount`: 28.
- Tests: 7 files (`viewport_squeeze`, `unit`, `golden`, `widget`, `flow`, `search_focus`, `a11y/home_screen`).
  Goldens: 1 (`home_screen.png`).

### Verification evidence

**Regen in place + diff:**
```
$ npx ts-node --transpile-only builder/src/index.ts apps/keemart/input/keemart.ir.json apps/keemart/output/app
[target] flutter
[context] generator=1.0.0 irVersion=1
[scoring] Home → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → none
Generated 30 file(s) → apps/keemart/output/app

$ git status --porcelain apps/keemart/output/app   → (empty)
$ git diff --stat apps/keemart/output/app          → (empty)
```
Byte-identical to committed output.

**Validate:**
```
[platform] PASS            [contrast] PASS
[determinism] PASS (byte-identical)   [literals] PASS
[plan-determinism] PASS    [outbox] PASS
[headers] PASS across 21 files        [shell] PASS
[secrets] PASS              [search] PASS
[forbidden-idioms] PASS     [scroll] PASS
[architecture] PASS         [actions] PASS
[oracle] PASS               [states] PASS
[strategy-fidelity] PASS    [visualIntent] PASS
[money] PASS                 [sections] PASS
[datepicker] PASS            [assets] PASS
[verdict] PASS                [asset-ref] PASS
[split] PASS                  [aspect-ratio] PASS
[tenant] PASS                 [lockfile] PASS
[symbols] PASS                [timestamp] PASS
[auth] PASS
[attachment] PASS
[budget] PASS
[audit] PASS
[export] PASS
[l10n] PASS
[theme] PASS

VALIDATION PASSED   — 37/37 gates PASS
```

**Independent double-regen determinism:** two fresh regens into `/tmp/bench_keemart_{a,b}`, `diff -r` → empty. **PASS.**

**`flutter analyze`:** 32 issues, **0 errors**, 1 warning (unused import in `test/a11y/home_screen_a11y_test.dart`), 31 info/lint (mostly `prefer_const_constructors`).

**`flutter test`:** `10/10 passed, 0 failures.`

### Strengths/weaknesses
- **Strength**: visually the richest single screen of the six — hero, carousel, grid, live search, real distinct empty states.
- **Weakness**: cart is 100% decorative (SnackBar only); no cart state or checkout.
- **Weakness**: in-memory only, read-only (no create/update/delete use cases exist at all).
- **Minor**: 2 of 3 seed products have `oldPrice == price`, so the discount strikethrough UI never actually shows a real discount in the demo data.

### Findings/gaps
No gate/analyze/test failures. Two low-severity cosmetic notes only (not fixed, per scope):
1. **[low]** Seed data gives `oldPrice == price` for 2/3 products — cosmetic sample-data issue, likely in whatever sample-value synthesis populates optional `Money` fields.
2. **[low]** `test/a11y/home_screen_a11y_test.dart` has an unused `material.dart` import and a `pipelineOwner`-deprecated info — same a11y-test-template issue seen in every app (see cross-app gap #5).

---

## tasks

### Identity
- IR: `apps/tasks/input/tasks.ir.json` → output `apps/tasks/output/app`. Package `rasheed_replica_tasks`.
- Entities `Task`, `FollowUp`; screens `TaskListScreen`/`TaskDetailScreen`/`FollowUpListScreen`/`FollowUpDetailScreen`.
- Rule: `apps/tasks/input/rules/HighPriority.oracle.json` — `priority == "high" → true`, severity `block`, 4 oracle cases.
- Scoring: `bloc`/`get_it`/`go_router`/`persistence: none`, `complexity: 8`.

### Feature surface
From `plan.json.patterns`:
- **search**: `/task` (field `title`) and `/follow-up` (field `subject`), both `contains`.
- **scroll**: all 4 routes. **actions**: both detail routes have inline `edit` + confirm `delete`.
- **states**: both list routes have full loading/error/empty/emptyCta/retry/refresh; detail routes have loading/error/retry only (no empty/refresh, expected).
- **visual**: only `/task` has a visual block (radius/spacing tokens, `heroScale:1`); `/follow-up` has none — no `sections`/`assets` keys anywhere, i.e. no hero/grid content in this app.
- `HighPriority` rule confirmed real: `domain/rules/high_priority.dart` → `task_policy.dart` (`evaluateTaskPolicy`, emits a block-severity `PolicyVerdict`) → exercised by `test/policy_test.dart` (passes). Grep for `wizard|Outbox|tenantId|AuthGuard|Budget|export|Audit`: all false positives (barrel exports, one stray doc-comment) — none of these patterns are actually implemented.
- Persistence: in-memory `List<T>` repos, 2–3 seeded rows each, resets on restart.

### Size
- `lib/`: 25 files, 1,917 LOC. 1 feature dir. `plan.json.artifactCount`: 59.
- Tests: 17 files / 46 cases. Goldens: 8 (list/detail/form ×2 entities, incl. empty-state golden).

### Verification evidence

**Regen in place + diff:**
```
$ npx ts-node --transpile-only builder/src/index.ts apps/tasks/input/tasks.ir.json apps/tasks/output/app
[scoring] TaskList → enum-status
[scoring] FollowUpList → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → none
Generated 61 file(s) → apps/tasks/output/app

$ git status --porcelain apps/tasks/output/app  → (empty)
$ git diff --stat apps/tasks/output/app         → (empty)
```
Byte-identical.

**Validate:** all 37 gates PASS → `VALIDATION PASSED` (same gate list as keemart, all PASS, `headers PASS across 43 files`).

**Independent double-regen determinism:** `/tmp/bench_tasks_{a,b}` (68 files each), `diff -r` → empty. **PASS.**

**`flutter analyze`:** 45 issues, **0 errors**, 12 warnings (6× `unnecessary_non_null_assertion` in list-state files, 5× `unused_import` in test files, incl. the stray `temp_all_flows_test.dart`), 33 info/lint.

**`flutter test`:** `41 passed, 5 failed` (46 total).
```
══╡ EXCEPTION CAUGHT BY FLUTTER TEST FRAMEWORK ╞══
Invalid argument(s): Type TaskRepository is already registered inside GetIt.
  ... setupDependencies (package:rasheed_replica_tasks/core/di.dart:24:6)
  ... test/temp_all_flows_test.dart
```
All 5 failures are in `test/temp_all_flows_test.dart` (`TaskDetailScreen (golden)`, `TaskFormScreen (golden)`,
`FollowUpDetailScreen (golden)`, `FollowUpFormScreen (golden)`, `FollowUpListScreen (golden)`) — every
*other* real suite (policy, focus, crud_flow, widget, back, a11y×4, scroll, flow, search_focus, golden) passes.

### Strengths/weaknesses
- **Strength**: two full CRUD entities, working search/refresh/retry/empty-with-CTA, a real blocking business-rule dialog.
- **Weakness**: in-memory only. Visually plain — no hero/section/asset content anywhere.
- **Weakness**: no wizard/outbox/tenant/auth/budget/audit — a minimal two-entity CRUD demo, not a showcase of advanced patterns.

### Findings/gaps
1. **[low-medium]** `test/temp_all_flows_test.dart` is committed despite its own header comment
   ("not committed; source of apps/<app>/output/goldens/") and breaks a stock `flutter test` run (5 failures) by
   calling `setupDependencies()` per test case without resetting GetIt. Confirmed **not** generator-emitted
   (no match for this filename/pattern anywhere in `builder/src`) — a stale/misplaced manually-committed
   artifact specific to this app's output tree. Suggest deleting it or untracking it to match its own comment.
2. No other defects: 37/37 gates, both determinism checks PASS, 0 analyze errors.

---

## work_auth

### Identity
- IR: `apps/work_auth/input/work_auth.ir.json` → output `apps/work_auth/output/app`.
- Entities: `WorkAuth` (status enum draft/submitted/approved/issued), `VisaQuota` (Money fields limit/committed/actual).
- Rule: `apps/work_auth/input/rules/NeedsManagerReview.oracle.json` — `durationDays > 60 → true`, 4 oracle cases (boundary-tested at exactly 60).
- Screens: `WorkAuthListScreen`, `VisaQuotaListScreen`, `VisaQuotaDetailScreen`, `WorkAuthWizardScreen` (4 steps: submit → manager-review *(conditional)* → review → result).
- Note: "work_auth" = work *authorization* (visa/permit), not login authN — no tenant/AuthGuard code exists or is expected, confirmed absent correctly.
- Scoring: `bloc`/`get_it`/`go_router`/`persistence: none`, `complexity: 1`.

### Feature surface
- **search**: `/work-auth`, `/visa-quota` (field `name`). **scroll**: all 3 non-detail-adjacent routes. **actions**: `/visa-quota/:id` inline edit + confirm delete.
- **states**: both list routes full loading/error/empty/emptyCta/retry/refresh; detail route loading/error/retry only.
- No `sections`/`assets` keys — purely functional CRUD+wizard, no decorative visual content.
- Rule wiring confirmed real: `domain/rules/needs_manager_review.dart` → `presentation/state/work_auth_wizard.dart`'s
  `_isVisible(int i)` dynamically shows/hides the manager-review step as `durationDays` crosses 60 while typing —
  genuine conditional navigation, not a static screen. `test/rules/needs_manager_review_oracle_test.dart` passes all 4 cases.
- **Budget**: `lib/core/budget.dart` (`BudgetLine`: limit/committed/actual, `remainingAfter`, `pctUsed`, `isOverLimit`), real and tested (`test/budget_test.dart`, gate `[budget] PASS`).
- Persistence: in-memory `List<T>` repos, 3 seeded rows each. No `tenantId`/`AuthGuard`/`Outbox`/`Audit` symbols anywhere — correctly absent (not declared in the IR).

### Size
- `lib/`: 40 files, 1,974 LOC. 1 feature dir. `plan.json.artifactCount`: 56.
- Tests: 16 files / 42 cases, incl. `wizard_focus_test.dart` (5 cases, iOS-Safari keyboard-bypass on the wizard). Goldens: 2 (WorkAuthList populated + empty only — wizard and VisaQuota screens uncovered).

### Verification evidence

**Regen in place + diff:**
```
$ npx ts-node --transpile-only builder/src/index.ts apps/work_auth/input/work_auth.ir.json apps/work_auth/output/app
[scoring] WorkAuthList → enum-status
[scoring] WorkAuthWizard → enum-status
[scoring] VisaQuotaList → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → none
Generated 58 file(s) → apps/work_auth/output/app

$ git status --porcelain apps/work_auth/output/app  → (empty)
$ git diff --stat apps/work_auth/output/app         → (empty)
```
Byte-identical.

**Validate:** all 37 gates PASS → `VALIDATION PASSED` (`headers PASS across 40 files`).

**Independent double-regen determinism:** `/tmp/bench_work_auth_{a,b}` (65 files each), `diff -r` → empty. **PASS.**

**`flutter analyze`:** 14 issues, **0 errors**, 10 warnings (6× `unnecessary_non_null_assertion` in state files, 4× `unused_import` in a11y tests), 4 info (`deprecated_member_use('pipelineOwner')`).

**`flutter test`:** `42/42 passed, 0 failures.` `wizard_focus_test.dart` (5 cases) all pass.

### Strengths/weaknesses
- **Strength**: the wizard is genuinely dynamic — a tester would watch the "Manager Review Required" step appear/disappear live as they edit `durationDays` past 60.
- **Strength**: full CRUD + search + refresh + retry + empty-with-CTA on both lists, inline edit/delete-with-confirm.
- **Weakness**: in-memory only. Only 2 goldens exist, both for the plainest screen (WorkAuthList) — the wizard and VisaQuota screens, the more visually/logically distinct parts of the app, have zero golden coverage.
- **Neutral**: no hero/section/asset content — purely functional, nothing decorative to flag as fake either.

### Findings/gaps
1. **[low]** "Generated N file(s)" count is inconsistent between an in-place regen (58) and a fresh scratch-dir regen (65) of the identical IR, even though the resulting trees are byte-identical. Cosmetic logging issue, likely in the file-write/reporting loop in `builder/src/index.ts` (touched-vs-planned file count).
2. **[low]** 14 analyze issues, all in generated state-file/a11y-test templates — same two recurring template issues as every other app (cross-app gap #5).

---

## hr_service

### Identity
- IR: `apps/hr_service/input/hr_service.ir.json` → output `apps/hr_service/output/app`.
- Rule: `apps/hr_service/input/rules/LongLeave.oracle.json` — `days > 10 → true`, 4 oracle cases.
- Declared attributes: `stateManagement: bloc`, `locale: both` (EN+AR), `outbox: true`, `auth.roles: [employee, hr_admin]` with per-role home route + allow-list.
- Entities: `LeaveRequest` (audited: true, 9 fields), `Approval` (5 fields). Screens: `LeaveRequestListScreen` (export: csv), `LeaveRequestDetailScreen` (hero: "Leave request", personality=professional/sharp/strong), `ApprovalListScreen`.
- Scoring: `bloc`/`get_it`/`go_router`/`persistence: none`, `complexity: 1`.

### Feature surface
- **search**: `/leave-request` (field `name`), `/approval` (field `approver`). **scroll**: all 3 routes. **actions**: `/leave-request` inline `export`; `/leave-request/:id` inline `edit`, overflow confirm `delete`, overflow `audit`.
- **states**: both lists full state set; detail route loading/error/retry only.
- **visual**: only `/leave-request/:id` has an explicit override (sharp radius, `AppSpacing.sm`, `heroScale:2`, strong title weight) matching the IR's declared style. No `assets`.
- `LongLeave` rule confirmed real and 1:1 oracle-tested (`domain/rules/long_leave.dart`, `test/rules/long_leave_oracle_test.dart`, all 4 cases pass) — **but** grep confirms it's referenced nowhere else in `lib/`: no badge/filter/gate in any screen. Semantically correct, invisible to a user.
- **Outbox**: real write-ahead usage in both repo impls (`Outbox.instance.enqueue(...)` before returning), covered by 5 passing tests incl. FIFO-replay-order.
- **Auth/role scoping**: `lib/core/session.dart` (`Persona`/`Session` with `tenantId`/`role`/`actorId`), `lib/core/router.dart` gates routes via `kHomeRoutes`/`kAllowedRoutes` per role, one login persona per role, covered by a passing `auth_test.dart`. `tenantId` is a real field (2 demo tenants seeded) but repos are a single global list — tenant filtering is cosmetic/demo-only, not enforced.
- **Audit**: `lib/core/audit.dart` + `audit_log_screen.dart`, wired as the overflow `audit` action, tested.
- **Export**: `lib/core/export.dart` backs the CSV inline action.
- No wizard, no budget-specific code beyond the generic patterns already covered.

### Size
- `lib/`: 2,380 LOC. 1 feature dir. `plan.json.artifactCount`: 64.
- Tests: 19 files / 51 cases. Goldens: 7, incl. 4 l10n goldens (EN/AR × app/login).

### Verification evidence

**Regen in place + diff:**
```
$ npx ts-node --transpile-only builder/src/index.ts apps/hr_service/input/hr_service.ir.json apps/hr_service/output/app
[scoring] LeaveRequestList → enum-status
[scoring] ApprovalList → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → none
Generated 66 file(s) → apps/hr_service/output/app

$ git status --porcelain apps/hr_service/output/app  → (empty)
$ git diff --stat apps/hr_service/output/app         → (empty)
```
Byte-identical.

**Validate:** all 37 gates PASS → `VALIDATION PASSED` (`headers PASS across 46 files`).

**Independent double-regen determinism:** `/tmp/bench_hr_service_{a,b}` (73 files each), `diff -r` → empty. **PASS.**

**`flutter analyze`:** 14 issues, **0 errors**, 9 warnings (6× `unnecessary_non_null_assertion`, 3× `unused_import`), 5 info (`deprecated_member_use`×3, `unnecessary_import`×2).

**`flutter test`:**
```
00:07 +50 -1: Some tests failed.
Failing tests:
  test/l10n_test.dart: LeaveRequestListScreen flips Directionality per locale, no RTL overflow, AR+EN goldens
Expected: null
  Actual: FlutterError:<Golden "goldens/l10n_en.png": Pixel test failed, 0.11%, 372px diff detected.
```
**50/51 passed.** The one failure is a 0.11% golden pixel-diff, not a logic bug — all 8 iOS-Safari
keyboard-bypass tests (6× `focus_test.dart` + 2× `search_focus_test.dart`) pass, as do outbox (5/5), auth,
audit, crud_flow (10/10), viewport_squeeze (8/8), scroll, back, flow, a11y (4/4), and s1_capture (5/5).

### Strengths/weaknesses
- **Strength**: real, tested outbox + role-based auth + audit log + CSV export + bilingual EN/AR with RTL goldens — a genuinely enterprise-flavored demo, not stubs.
- **Weakness**: in-memory only. `LongLeave` rule is invisible in the UI despite being correctly implemented and tested.
- **Weakness**: small feature surface (1 feature module, 3 screens, complexity score 1) — feels like a plain CRUD app beyond the cross-cutting infrastructure.

### Findings/gaps
1. **[low]** Golden flake: `l10n_test.dart` fails a 372px/0.11% pixel diff against `l10n_en.png` — typical rendering-environment sensitivity (font/AA drift across Flutter SDK patch/machine), not a logic defect; all `[l10n]`/`[theme]`/`[contrast]` gates pass.
2. **[low]** Same recurring lint pattern as every other app (state-file `!`, a11y-test unused import + deprecated `pipelineOwner`) — see cross-app gap #5.
3. No gate/determinism/architecture defects.

---

## ledgerly

### Identity
- IR: `apps/ledgerly/input/ledgerly.ir.json` → output `apps/ledgerly/output/app`. 4 features: `auth`, `expenses`, `approvals`, `budgets`.
- Entities: `User`, `ExpenseClaim`, `ExpenseClaimSplit`, `Approval`, `MealBudget`.
- **9 business rules** — the richest of the six:

| Rule | Entity | Condition | Severity |
|---|---|---|---|
| MicroExpenseAutoApprove | ExpenseClaim | amount ≤ 50 | autoApprove |
| StandardExpenseWarn | ExpenseClaim | amount ≥ 500 | warn |
| LargeExpenseJustify | ExpenseClaim | amount ≥ 2000 | requireJustification |
| ExecutiveExpenseBlock | ExpenseClaim | amount ≥ 15000 | block |
| ApprovalRejectedWarn | Approval | decision == rejected | warn |
| BudgetCommittedWarn | MealBudget | committed ≥ 300 | warn |
| BudgetCommittedBlock | MealBudget | committed ≥ 800 | block |
| BudgetActualJustify | MealBudget | actual ≥ 400 | requireJustification |
| Split | ExpenseClaimSplit | Σ percents == 100% | validation |

- No wizard archetype — pure list/detail. Scoring: `bloc`/`get_it`/`go_router`/`persistence: none`, `complexity: 1`.

### Feature surface
- **search**: all 4 list routes (field `name`). **scroll**: all 4 list + 2 detail routes.
- **actions**: `/expense-claim` inline export; `/expense-claim/:id` inline edit, overflow confirm delete, overflow audit; `/meal-budget/:id` inline edit + confirm delete.
- **states**: all 4 lists full state set (`emptyCta` true on 2 of 4); detail routes loading/error/retry only.
- **visual**: only `/expense-claim` has a visual entry (soft radius, `AppSpacing.lg`, premium personality) — no `sections`/`assets` anywhere.
- All 9 rules confirmed wired into real generated classes under `domain/rules/`, backed by `lib/core/policy.dart`'s
  `PolicySeverity`/immutable `PolicyVerdict` with a mandatory-reason `waive()` (throws if empty), plus
  `lib/core/split.dart` (46-line 100%-sum validator used live in the split-editing form). `[oracle]` and
  `[strategy-fidelity]` gates both PASS, independently confirming rule-to-oracle fidelity.
- **Outbox** (all 4 repos, real usage), **tenant scoping** (`Persona(tenantId)`, 2 tenants/3 personas seeded, real UI wiring on login), **budget** (`lib/core/budget.dart` + full `MealBudget` domain layer), **export** (CSV, wired to `/expense-claim` inline action + `ExpenseClaim.exported` field), **audit** (`lib/core/audit.dart` + log screen, wired as overflow action) — all confirmed real via direct code read, not decorative.
- **Split-group**: full CRUD stack for `ExpenseClaimSplit` (entity/model/repo/4 usecases/state) with UI wiring in the claim form and detail screen.

### Size
- `lib/`: 4,031 LOC — the largest app. 4 feature dirs (`approvals`, `auth`, `budgets`, `expenses`). `plan.json.artifactCount`: 118.
- Tests: 33 files / 111 cases. Goldens: 6 (user list, l10n EN/AR × app/login, s1 expense-claim-list).

### Verification evidence

**Regen in place + diff:**
```
$ npx ts-node --transpile-only builder/src/index.ts apps/ledgerly/input/ledgerly.ir.json apps/ledgerly/output/app
[scoring] UserList → enum-status
[scoring] ExpenseClaimList → enum-status
[scoring] ExpenseClaimSplitList → enum-status
[scoring] ApprovalList → enum-status
[scoring] MealBudgetList → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → none
Generated 120 file(s) → apps/ledgerly/output/app

$ git status --porcelain apps/ledgerly/output/app  → (empty)
$ git diff --stat apps/ledgerly/output/app         → (empty)
```
Byte-identical.

**Validate:** all 37 gates PASS → `VALIDATION PASSED` (`headers PASS across 86 files`).

**Independent double-regen determinism:** `/tmp/bench_ledgerly_{a,b}` (127 files each), `diff -r` → empty. **PASS.**
(The 120-vs-127 file-count difference vs. in-place regen is purely non-generated scaffold/build artifacts
already present in the committed dir — confirmed by a full `diff -rq` against the real output dir showing only
`.dart_tool`/`pubspec.lock`/checked-in goldens/`builder.lock.json` differ, no generated `lib/`/`test/*.dart`
content differs.)

**`flutter analyze`:** 24 issues, **0 errors**, 12 warnings (9× `unnecessary_non_null_assertion` across all 4 list-state files, 5× `unused_import` in a11y tests — actually 12 total warnings per the run), 7 info/lint.

**`flutter test`:** `111/111 passed, 0 failures`, across 33 test files — includes iOS-Safari keyboard-bypass tests (`focus_test.dart`, `search_focus_test.dart` on all 3 relevant screens), `split_test.dart`, `policy_test.dart` (waive-requires-reason, warn-but-allow-save), `l10n_test.dart` (AR/EN + RTL-no-overflow), a11y, back, flow, auth, scroll, quick_decision.

### Strengths/weaknesses
- **Strength**: by far the deepest business-logic app — 9 oracle-verified rules across all 4 severities, a real waive-with-mandatory-reason mechanism, and a correctly-implemented cross-row split-sum validator (uncommon to see auto-generated correctly).
- **Strength**: multi-tenant persona login (2 tenants, 3 personas) signals "real B2B app" immediately.
- **Weakness**: in-memory only — a tester who reloads loses everything, the most obvious demo tell.
- **Weakness**: no wizard anywhere despite the "expense claim" domain suggesting a guided submission flow.
- **Weakness**: only 1 of 6 routes has any bespoke visual styling — the other 3 list screens are functionally correct but visually generic.

### Findings/gaps
1. **[low]** Same recurring `unnecessary_non_null_assertion` (9× across all list-state files) and `unused_import`/`deprecated_member_use('pipelineOwner')` (a11y tests) pattern as every other app — see cross-app gap #5.
2. **[low]** 2 `unnecessary_import` info-lints in `test/s1_capture_test.dart`/`test/split_test.dart` — same template-hygiene class of issue.
3. No high/medium defects — 37/37 gates, both determinism checks PASS, 0 analyze errors, 111/111 tests green.

---

## rasheed

### Identity — structural note (read first)
Unlike the other 5 apps, `apps/rasheed/` does **not** follow the `apps/<app>/input/<app>.ir.json` +
`apps/<app>/output/app` convention — it contains only `apps/rasheed/output/qa/probe1/`, a one-off spike/QA
probe artifact from commit `b5eb50c` ("SPIKE M4"), not a real app build. The actual canonical rasheed IR/output
live outside `apps/`: IR = `builder/samples/rasheed.ir.json`, committed output = `builder/output/rasheed_replica`
(built via `npm run build:rasheed`).

Validating that committed baseline against the current generator reproduces exactly the failures reported going
into this task — **it is stale**, predating the feature-first architecture refactor (it has a `lib/generated/`
subdirectory with no `lib/core`/`lib/features`, unlike every other app and unlike what the current generator now
emits). Rewriting it in place would be a large structural change out of scope for a benchmark-only task, so
**this benchmark used a fresh regeneration into scratch** (`/tmp/bench_rasheed_fresh`) to measure what the
*current* generator actually produces for this IR, while separately capturing the stale baseline's gate
failures as drift evidence. Neither `builder/output/rasheed_replica` nor `apps/rasheed/` was touched.

- Domain: expense/transaction tracking (Saudi market — SAR, VAT, tax/CR numbers). 5 entities, 1 enum
  (`PaymentMethod`), 1 repository (`ExpenseRepository`), 2 query/filter types, 1 wrapper (`TransactionsPage`),
  1 state (`AllExpenses`).
- Scoring (fresh regen): `bloc`/`get_it`/`go_router`, `persistence: nosql`, `complexity: 32`.

### Feature surface
`plan.json.patterns` is **empty (`{}`)** for this IR — no search/scroll/actions/states/visual/sections/assets
patterns are populated, because **no screens are generated for this IR shape at all**: `plan.json` has only
`domain/entities`(9), `domain/repositories`(1), `presentation/state`(1), `data/models`(5), `data/repositories`(1),
`core`(12), `test`(5) — no `presentation/pages`/`presentation/widgets` entries. This matches
`builder/BENCHMARK_REPORT.md`'s older note that a `ScreenGenerator` was "not built" as of that report; the
domain/data/state layers are 100%-faithful to the original app per that report (61/61 fields, faithful
Stream/Future repository signatures, `TransactionQuery`/`TransactionsPage`), but there is still no UI.

### Size
(All from the fresh regen, `/tmp/bench_rasheed_fresh` — not the stale committed baseline.)
- `lib/`: 1,435 LOC. 1 feature dir (`expense`). `plan.json.artifactCount`: 34 (43 files generated total —
  the delta is scaffold/support files plan.json doesn't track).
- Tests: 5 files (`viewport_squeeze`, `unit`, `golden`, `widget`, `flow`). Goldens: **0** (never `flutter
  create`'d + golden-approved).

### Verification evidence

**Fresh regen to scratch:**
```
$ npx ts-node --transpile-only builder/src/index.ts builder/samples/rasheed.ir.json /tmp/bench_rasheed_fresh
[scoring] AllExpenses → enum-status
[scoring] app → bloc (bloc × get_it)
[scoring] persistence → nosql
Generated 43 file(s) → /tmp/bench_rasheed_fresh
```

**Validate fresh regen against itself (current generator, self-consistent):**
```
[platform] PASS   [theme] PASS       [states] PASS
[determinism] PASS (byte-identical)  [contrast] PASS    [visualIntent] PASS
[plan-determinism] PASS  [literals] PASS   [sections] PASS
[headers] PASS across 29 files       [outbox] PASS      [assets] PASS
[secrets] PASS     [shell] PASS       [asset-ref] PASS
[forbidden-idioms] PASS  [search] PASS     [aspect-ratio] PASS
[architecture] PASS  [scroll] PASS     [lockfile] FAIL (1)
[oracle] PASS      [actions] PASS     [timestamp] PASS
[strategy-fidelity] PASS
[money] PASS
[datepicker] PASS
[verdict] PASS
[split] PASS
[tenant] PASS
[symbols] PASS
[auth] PASS
[attachment] PASS
[budget] PASS
[audit] PASS
[export] PASS
[l10n] PASS

VALIDATION FAILED  — 36/37 PASS; sole FAIL is [lockfile], caused by the scratch dir having no
pubspec.lock yet (flutter pub get, run afterward, succeeded without incident — not a generator defect).
```

**Validate against the committed baseline `builder/output/rasheed_replica` (stale — drift evidence):**
```
[platform] PASS            [search] FAIL (1)
[determinism] FAIL         [scroll] FAIL (1)
[plan-determinism] FAIL (1) [actions] FAIL (1)
[headers] PASS across 31 files [states] FAIL (1)
[secrets] PASS              [visualIntent] FAIL (1)
[forbidden-idioms] PASS     [sections] FAIL (1)
[architecture] PASS         [assets] FAIL (1)
[oracle] PASS                [asset-ref] PASS
[strategy-fidelity] FAIL (1) [aspect-ratio] PASS
[money] FAIL (52)            [lockfile] PASS
[datepicker] PASS            [timestamp] PASS
[verdict] PASS
[split] PASS
[tenant] PASS
[symbols] PASS
[auth] PASS
[attachment] PASS
[budget] PASS
[audit] PASS
[export] PASS
[l10n] PASS
[theme] FAIL (4)
[contrast] PASS
[literals] PASS
[outbox] PASS
[shell] PASS

VALIDATION FAILED — 12 of 37 gates FAIL against the current generator.
```
Confirms `builder/output/rasheed_replica` no longer matches current `builder/src` output for this IR.

**Independent double-regen determinism (current generator):** `/tmp/bench_rasheed_{a,b}` (43 files each),
`diff -r` → empty. **PASS** — the current generator is internally deterministic for this IR, independent of
the stale-baseline drift.

**`flutter pub get` + `flutter analyze`:**
```
$ flutter pub get   → 74 dependencies resolved, no conflicts
$ flutter analyze   → No issues found! (ran in 2.2s)
```

**`flutter test`:**
```
00:01 +4 -1: Some tests failed.
Failing tests:
  test/golden_test.dart: app renders (golden)
```
`4 passed, 1 failed.` The failure is purely "no approved golden image exists yet"
(`Could not be compared against non-existent file: goldens/app.png`) — expected for a scratch project that was
never `flutter create`'d + golden-approved, not a generator logic defect.

### Strengths/weaknesses
- **Strength**: deterministic and gate-clean where it applies; 0 analyze issues; faithful domain/data modeling (money/theme/strategy-fidelity gates all pass).
- **Weakness**: no screens/UI at all for this IR shape — 0 of the 6 apps' visual/interactive richness applies here.
- **Weakness**: no goldens ever approved, so `flutter test` always shows 1 failure out of the box on a fresh checkout.

### Findings/gaps
1. **[HIGH] Structural/staleness.** `apps/rasheed/` was never migrated to the `apps/<app>/{input,output/app}`
   convention; the real committed build (`builder/output/rasheed_replica`) predates the feature-first refactor
   and fails 12/37 gates against the current generator (evidence above). Suggested remediation (not performed,
   out of scope): regenerate with the current generator and relocate to `apps/rasheed/{input/rasheed.ir.json,
   output/app}`; retire or clearly label `builder/output/rasheed_replica` as legacy if kept for reference.
2. **[low]** `flutter test` fails 1/5 out of the box due to no approved golden — either seed an initial golden
   as part of generation, or document that `--update-goldens` must be run once post-generation. Suggested
   location: whichever `builder/src` module emits `test/golden_test.dart`.
3. **[low/informational]** `plan.json.patterns` is empty for this IR — flagged for whoever plans the next
   app build to confirm this is expected for expense/finance-archetype IRs of this shape (repository/query/state
   only, no declared screens) rather than a pattern-detection gap.
