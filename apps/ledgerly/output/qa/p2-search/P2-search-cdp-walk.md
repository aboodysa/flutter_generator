# P2 CDP walk — per-list search, ledgerly, 2026-08-17

Live end-to-end drive of the regenerated `apps/ledgerly/output/app` against
`INTERFACE_PATTERN_CONTRACT.md` §4 + `P2_IMPLEMENTATION_BRIEF.md` deliverable 6, run via the
claude-in-chrome browser tools against a local `flutter build web` + `python3 -m http.server 8736`
serve of `build/web`. Same screenshot-persistence limitation as the P1 walk (`save_to_disk`
returns an internal id, no locally-resolvable path) — every observation below was visually
confirmed live in-session; documented here rather than faked.

## Steps + observations

1. **Sign in — Rana Yousef (finance · acme)**. Chosen for the same reason as the P1 walk:
   finance's `attributes.auth.allow` reaches every shell destination. Landed on `/approval`
   (finance's home).

2. **Approvals list renders a `SearchBar` above the row list**, hint text "Search Approvals",
   coexisting correctly with the P1 bottom `NavigationBar` (Users / Expense Claims / Approvals /
   Meal Budgets still visible and functional below it) — confirms P1 and P2 compose cleanly, no
   layout conflict between the two patterns.

3. **Filter as-you-type**: typed "1" — list narrowed live from 3 rows ("Sample Approval",
   "Sample Approval 1", "Sample Approval 2") to exactly 1 ("Sample Approval 1"), no page reload,
   no flicker.

4. **Case-insensitive `contains`**: typed "sample" (lowercase) — all 3 rows matched (their
   display field is "Sample Approval…", capital S) — confirms `toLowerCase()` on both sides
   (contract §4 grill C5 resolution), not an exact-case match.

5. **No-results EmptyState**: typed a gibberish query ("zxqwzzz") — list area replaced by
   "No results for "zxqwzzz"" (the literal typed query echoed back), no overflow, bottom nav
   still rendered correctly below it.

6. **Clear restores the full list**: backspaced the query to empty — all 3 rows reappeared
   immediately, in original order.

7. **Cross-app check — tasks (`apps/tasks/output/app`, single-feature, no shell)**: same walk
   repeated against `localhost:8737` (a separate `flutter build web` serve). Tasks list renders
   its own `SearchBar` ("Search Tasks"); typing "2" narrowed 3 rows to "Sample Task 2" only;
   gibberish ("qqqxxx") produced "No results for "qqqxxx""; clearing restored all 3 rows. Confirms
   the capability isn't ledgerly-specific — same generator, same behavior, on an app with no shell
   at all (search and shell are independently composable, contract §9.2/§3 invariant).

## Overflow scan (320 / 390 / 768 / 1280)

Same environment constraint as the P1 walk: the browser session's `resize_window` tool reports
success but does not change the page's actual rendered viewport (`window.innerWidth` stayed fixed
regardless of the requested size); page-zoom keyboard shortcuts are explicitly blocked by the
browser tool. Documented rather than faked, same posture as the P1 walk.

Substituted a directly-controlled Flutter widget-test viewport (`tester.view.physicalSize`) to
prove the actual requirement — SearchBar + filtered list + no-results EmptyState all render with
no `RenderFlex` overflow — at each of the four required breakpoints, driving the SAME sequence
(boot → filter → no-results → clear) at each size, not just a static render. Probe file:
`overflow_probe_test.dart` in this directory. Run by copying into
`apps/ledgerly/output/app/test/` (needed for package resolution) and removing again afterward.

```
00:00 +0: Approvals search renders with no overflow at 320w (small phone)
00:00 +1: Approvals search renders with no overflow at 390w (iPhone-class)
00:00 +2: Approvals search renders with no overflow at 768w (tablet)
00:00 +3: Approvals search renders with no overflow at 1280w (desktop)
00:00 +4: All tests passed!
```

All 4/4 pass — filter, no-results, and clear all render cleanly with zero overflow exceptions at
every required breakpoint.

## Bug found and fixed during this walk (generalizes beyond search)

**Symptom**: `scroll_test.dart`'s `LeaveRequestListScreen` case (hr_service) started failing after
search landed — `tester.drag(find.byType(ListView), const Offset(0, -2000))` no longer reached the
last seeded row, even at drag magnitudes far larger than the theoretical scroll extent (-6000).
Root-caused via a live bisection: the drag's synthetic pointer gesture, released via
`pumpAndSettle()`, was not reliably settling the ListView's `ScrollPosition` all the way to
`maxScrollExtent` in this SDK version once a second `Scrollable` exists in the tree (the
SearchBar's own internal `TextField`/`EditableText` horizontal scrollable) — confirmed via
`ScrollableState.position.jumpTo(...)`, which DID reach the last row reliably, proving the
Scrollable/data layer was correct and the fragility was specifically in the drag-and-settle
gesture simulation, not in search's rendering.

**Fix**: `test.ts`'s `generateScrollTest` (both the bloc and riverpod branches) now uses Flutter's
own `tester.scrollUntilVisible(finder, delta, scrollable: ...)` SDK helper — built precisely for
"repeat a bounded drag until the target is visible" — instead of a single fixed-magnitude drag.
The `scrollable:` argument is now required explicitly (`find.descendant(of: find.byType(ListView),
matching: find.byType(Scrollable))`) since a searchable screen has two `Scrollable`s and the
default finder requires exactly one. This is strictly more robust regardless of search — it no
longer depends on a magic pixel constant matching whatever viewport happens to be available.
Verified: all 4 apps' `scroll_test.dart` pass (tasks 2/2, hr_service 2/2, work_auth 2/2, ledgerly
4/4), and the fix required zero changes to screen.ts's search implementation itself.

## Result

Per-list search is real, CDP-observable, and matches every deliverable-6 acceptance item: SearchBar
renders only on screens the selector decided are searchable, filter-as-you-type works, no-results
EmptyState renders correctly, clearing restores the list, and it composes cleanly with the P1
shell. No overflow at any of the four required breakpoints. One real (pre-existing, latent) test
fragility was found and fixed at its actual source (test.ts's scroll-test generator), not patched
around in screen.ts.
