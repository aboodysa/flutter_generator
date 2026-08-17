# CDP acceptance re-run — LM6 (manager approve/reject), 2026-08-17

Full end-to-end walk against the regenerated `apps/ledgerly/output/app` (commit `9415190`),
run live in Chrome via the claude-in-chrome browser tools against a local `flutter build web` +
`python3 -m http.server 8734` serve of `build/web`. Session storage was cleared between persona
switches (`localStorage.clear(); sessionStorage.clear()`) since this demo app has no sign-out
button in the UI — that's a pre-existing property of the auth demo, not something LM6 touched.

> Note on screenshots: each step below was visually confirmed via a live in-browser screenshot
> during the session (`computer` tool, `save_to_disk: true`). The tool did not return a
> locally-resolvable file path, and no corresponding image file could be located on this
> machine's filesystem to copy into this directory — the browser automation appears to run
> through a channel that keeps captured images out of local disk reach. Rather than fabricate
> or guess a path, this file documents exactly what was observed at each step instead. The
> flutter-test goldens for the rest of the app (which *are* real committed files) live at
> `apps/ledgerly/output/app/test/goldens/*.png`; there is no golden test for ApprovalListScreen
> specifically (only UserListScreen + the two l10n screens have per-screen goldens in this
> sample), so this walk is the only visual record of the Approvals screen for this session.

## Steps + observations

1. **Sign in — Sara Ahmed (employee · acme)**. Landed on Expense Claims list (3 seeded rows,
   all "pending"). Attempted to create a new expense claim via the FAB to exercise the split
   form; hit a pre-existing browser-automation quirk unrelated to LM6 (the generated Flutter-web
   TextField didn't accept synthetic `type` events reliably — worked once switched to per-key
   `key` presses instead). Backed out of the incomplete form without submitting (no dirty state
   left behind) since the split/submit flow was already CDP-verified in a prior session
   (`9f70dcb`) and isn't what LM6 changed.

2. **Sign in — Khalid Aziz (manager · globex)**. Cleared storage, re-signed in, navigated
   directly to `#/approval`. **Approvals list rendered 3 seeded rows, each now with real
   approve (✓) / reject (✗) icon buttons in the trailing position** — this is the LM6 change;
   previously these rows were non-interactive (no chevron, no action, tapping did nothing).

3. **Approve "Sample Approval"**: clicked the green ✓. Row's status dot flipped from orange
   ("pending") to green, subtitle text flipped to "approved", live, no page reload. Confirms
   `ApprovalRepository.updateApproval` → `UpdateApproval` use case → `ApprovalListCubit.update()`
   → Equatable-aware `emit()` → BlocBuilder rebuild all fired correctly end-to-end in a real
   browser, not just in the widget-test harness.

4. **Reject "Sample Approval 1"**: clicked the red ✗. Row's status dot flipped to red, subtitle
   flipped to "rejected". The row's remaining action set correctly recomputed to exclude
   "rejected" (only an approve-shaped check icon remained) — confirms the button set is derived
   live from `ApprovalDecision.values.where((v) => v != item.decision)`, not a static two-button
   layout, so this generalizes to any enum cardinality, not just approve/reject.

5. **Third row ("Sample Approval 2") left untouched** deliberately, as a control — confirmed it
   still showed "pending" with both action icons throughout steps 3-4, i.e. the Cubit update is
   scoped to the tapped row's id and doesn't touch sibling rows.

6. **Budget remaining — `#/meal-budget`** (pre-existing MF5 capability, not part of LM6):
   3 seeded MealBudget rows rendered live "used %"/"SAR left" figures (58%/420 left, 98%/10 left,
   113%/-50 left, i.e. over-budget correctly shows a negative remaining). Matches the figures
   already recorded in `LEDGERLY_MVP.md` from the prior CDP run — no regression.

7. **CSV export — `#/expense-claim`** (pre-existing L3 capability, not part of LM6): clicked the
   export icon in the AppBar. SnackBar confirmed "Exported 3 rows to CSV (193 chars)" — matches
   the prior run's behavior, no regression.

## Result

Manager approve/reject is now a real, CDP-observable action against ledgerly's own Approval
entity — closing the LM6 gap. Combined with `quick_decision_test.dart` (automated, 16/16 in the
full suite) this is now double-covered: automated widget test + live human-observable browser
walk, matching the bar every other closed capability in this sample was held to.

No regressions observed in budget or CSV export (both pre-existing, both still correct).
