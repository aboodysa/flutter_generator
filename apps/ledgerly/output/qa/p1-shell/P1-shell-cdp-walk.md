# P1 CDP walk — global bottom-navigation shell, 2026-08-17

Live end-to-end drive of the regenerated `apps/ledgerly/output/app` against
`INTERFACE_PATTERN_CONTRACT.md` §3.3's acceptance list, run via the claude-in-chrome browser
tools against a local `flutter build web` + `python3 -m http.server 8735` serve of `build/web`.
Session storage cleared between persona checks (`localStorage.clear(); sessionStorage.clear()`),
same pre-existing convention as the LM6 CDP walk (no in-app sign-out button).

> **Screenshot persistence**: same limitation as the LM6 CDP walk (`cdp-acceptance/
> LM6-approve-reject-rerun.md`) — `computer` screenshot/`save_to_disk: true` returned success
> with an internal id but no locally-resolvable file path, so no PNGs could be copied into this
> directory. Every observation below was visually confirmed live in-session; this file is the
> record of exactly what was seen at each step, not a guess.

## Bug found and fixed during this walk

**Symptom**: tapping the "Expense Claims" tab (an entity with a create/edit form) landed on a
blank "New ExpenseClaim" form instead of the Expense Claims list. Tapping "Meal Budgets" (also
form-capable) had the same problem. Tapping "Users" or "Approvals" (list-only, no form) worked
correctly.

**Root cause**: `StatefulShellBranch` defaults to its **first registered route** as the branch's
initial location when a tab is tapped fresh. `route.ts`'s `branchRoutes()` deliberately orders
form routes (`/expense-claim/new`, `/expense-claim/:id/edit`) before screen routes
(`/expense-claim`, `/expense-claim/:id`) — required for go_router's first-match path resolution
(so `/expense-claim/new` doesn't get captured by the `/expense-claim/:id` pattern) — but that same
ordering also happened to become the shell branch's default landing route, which is wrong: the
first route in the array was never meant to signal "this is the tab's home."

**Fix**: added an explicit `initialLocation: '<rootPath>'` to every `StatefulShellBranch`, reusing
`ShellDestination.rootPath` — the root screen path composition.ts's `shellFor` had already decided
(contract §3.1) — so route.ts still only *consumes* the decision, it doesn't derive a new one.
Route match ordering inside each branch is untouched (form-before-screen, unchanged reasoning).

Verified after the fix: typecheck clean, all 4 apps' `[shell]` gate still PASS, single-feature
byte-identical proof re-run (unaffected — `shell` is `null` there), `flutter analyze`/`flutter
test` on the real `apps/ledgerly/output/app` both clean (83/83, 1 pre-existing unrelated lint),
and the CDP walk below re-run against the rebuilt web bundle to confirm the fix.

## Steps + observations (post-fix)

1. **Sign in — Rana Yousef (finance · acme)**. Chosen because finance's `attributes.auth.allow`
   reaches all four shell destinations (`ExpenseClaim`, `Approval`, `User`, `MealBudget`) — the
   only role that can exercise every tab in one session. Landed on `/approval` (finance's home).

2. **Bottom `NavigationBar` renders with exactly 4 destinations, in `features[]` IR order**:
   Users (person icon) → Expense Claims (receipt_long icon) → Approvals (approval icon, selected/
   highlighted on landing) → Meal Budgets (account_balance_wallet icon). Matches
   `plan.json`'s `patterns.shell.destinations` and the IR's `features[].name` order exactly —
   confirms the `[shell]` gate's "destination order == features[] order" check is checking a
   real, correct invariant, not a vacuous one.

3. **Tap "Expense Claims"**: lands on the Expense Claims **list** (3 seeded rows, "0.00/150.00/
   250.00 SAR · pending") — confirms the `initialLocation` fix above.

4. **Tap into "Sample ExpenseClaim" row** → Expense Claim detail screen renders (Amount/Exported/
   Split breakdown fields, edit pencil + delete icon in the AppBar).

5. **Tap "Meal Budgets" tab**: switches immediately to the Meal Budgets list (3 seeded rows,
   58%/98%/113% used — same figures as the pre-P1 CDP run, non-regression). The Expense Claims
   branch's Navigator was NOT torn down — its state is preserved off-screen.

6. **Tap "Expense Claims" tab again**: lands back on the **Expense Claim detail** screen for
   "Sample ExpenseClaim" — exactly where step 4 left it, not reset to the list. This is the
   contract's core per-destination-state requirement (§3.1: "Navigation stack/state per
   destination... each destination retains its own stack/scroll/search state across switches"),
   and it holds.

7. **Tap "Users" tab**: switches to the Users list (3 seeded rows, all "employee"). All four
   destinations confirmed reachable and rendering their correct root screen from one signed-in
   session.

## Overflow scan (320 / 390 / 768 / 1280)

The browser session's `resize_window` tool reported success but did not change the page's actual
rendered viewport (`window.innerWidth`/`innerHeight` stayed fixed at 1200×726 regardless of the
requested size, before and after a full reload); page-zoom keyboard shortcuts are explicitly
blocked by the browser tool ("page zoom keyboard shortcuts are not supported"). This is an
environment/tooling constraint, not a shell defect — documented rather than faked, same posture as
the LM6 walk's screenshot-path limitation.

Substituted a directly-controlled Flutter widget-test viewport (`tester.view.physicalSize` — the
same mechanism `golden_test.dart`/`scroll_test.dart` already use for their own fixed-size
renders) to prove the actual requirement — no `RenderFlex` overflow on any shell destination —
at each of the four required breakpoints. Probe file: `overflow_probe_test.dart` in this
directory (signs in as finance, pumps `ReplicaApp`, taps all 4 destinations, asserts
`tester.takeException()` is null after each). Run by copying into
`apps/ledgerly/output/app/test/` (needed for package resolution) and removing again afterward —
this qa/ directory is its permanent home, not the generated test suite.

```
00:00 +0: shell renders every destination with no overflow at 320w (small phone)
00:00 +1: shell renders every destination with no overflow at 390w (iPhone-class)
00:00 +2: shell renders every destination with no overflow at 768w (tablet)
00:00 +3: shell renders every destination with no overflow at 1280w (desktop)
00:00 +4: All tests passed!
```

All 4/4 pass — every destination renders cleanly with no overflow exception at all four
breakpoints.

## Result

The global bottom-navigation shell is real, CDP-observable, and matches every §3.3 acceptance
item: 4-destination bar in IR order, all four reachable, per-destination stack preserved across
switches, no overflow at 320/390/768/1280. One real bug (branch default-landing-route) was found
via this exact walk and fixed at the source (`route.ts`'s `StatefulShellBranch.initialLocation`),
not patched around.
