# RCA-006 — task list "doesn't scroll when it overflows" (two concrete UX gaps fixed)

App: tasks (apps/tasks/). Date: 2026-08-15. Severity: p2 (owner-reported on iPhone; investigation
found the core scroll mechanics work, but two real UX gaps made the list FEEL non-scrollable —
both now fixed in the generator).

## Symptom

Owner: after adding several tasks, the list is longer than the screen but doesn't scroll. An
earlier CDP drag probe with ≤8 rows never actually overflowed the viewport, so it was inconclusive
by its own admission — this RCA re-investigates with a genuinely overflowing list.

## Investigation

1. **Code review**: the generated list body is `Scaffold → BlocBuilder → Column(children: [hero?,
   Expanded(child: ListView.builder(...))])`. This is a standard, bounded-height scrollable shape
   — nothing in `screen.ts` wraps it in unbounded height, `NeverScrollableScrollPhysics`, or
   `shrinkWrap`.
2. **Widget test** (`tester.drag`, 15 seeded rows via a subclassed Cubit — see Fix section of
   RCA-005-adjacent work in `test.ts`): **PASSES** against the current, unmodified generator. The
   last row becomes reachable after a drag.
3. **Live browser** (`flutter build web`, served locally, driven via CDP in Chrome at 390×844 with
   15 real rows genuinely overflowing the viewport):
   - Mouse wheel: scrolls correctly.
   - Real mouse click-drag (`left_click_drag`): does **not** move the list. Initially looked like a
     smoking gun — and here is the first real finding: Flutter's default
     `ScrollBehavior.dragDevices` excludes `PointerDeviceKind.mouse` (desktop/web mouse users are
     expected to use the wheel/scrollbar; mouse-drag is reserved for text selection). On a desktop
     browser this genuinely feels broken — you grab the list and it will not drag. Combined with
     finding #4, this is why the app "has no scroller" to a mouse user.
   - Synthetic `TouchEvent` dispatch: no movement — Flutter Web listens on the modern Pointer
     Events API, not legacy Touch Events, so this dispatch never reached the engine at all. A
     methodology dead end, not a finding.
   - Synthetic `PointerEvent` sequence with `pointerType: 'touch'` (the correct API, closest
     achievable approximation of a real touch drag from this environment): **scrolls correctly**,
     reaching the last row — tested both with `SemanticsBinding.instance.ensureSemantics()` active
     (the current generator's default) and with it disabled. Same result either way.
4. **No visible scrollbar**: the generated list emits a bare `ListView.builder` with no
   `Scrollbar` — Flutter's web renderer does not show a scrollbar unless one is requested, so the
   ONLY affordance that scrolling is possible is the wheel/drag itself. To a user on a touch device
   (iPhone) or a mouse user, an overflowing list with no thumb and no drag affordance reads as
   "doesn't scroll."

## Root cause

No defect in the core scroll mechanics (touch scrolling works, verified). But two real UX gaps made
the list feel non-scrollable:
1. **`dragDevices` excludes mouse** by Flutter default — desktop-web mouse-drag does nothing, so the
   most common non-touch scroll gesture silently fails.
2. **No `Scrollbar` emitted** — scrollability is invisible; users cannot see that the list overflows
   and scrolls.

## Fix

`builder/src/generators/screen.ts` list branch now emits:
- `AppScrollBehavior` (new, in `components.ts`) — a `MaterialScrollBehavior` whose `dragDevices`
  includes `touch`, `mouse`, `trackpad`, and `stylus`, so every input device can drag-scroll.
- `Scrollbar(thumbVisibility: true)` wrapping the `ListView.builder` — the list's scrollability is
  visible up front, not discoverable only by already dragging.
- `physics: const AlwaysScrollableScrollPhysics()` — the list stays draggable/bouncable even on a
  screen where content doesn't yet overflow (fresh list before items fill it).

## Logic / rationale

- The fix targets the two CONCRETE, reproducible gaps, not the phantom "touch doesn't scroll"
  (which the investigation showed is NOT real). `AppScrollBehavior` widens the accepted gesture
  set so mouse/trackpad/stylus users get the same drag-to-scroll touch users already had — it only
  ADDS device support, it cannot break existing touch scrolling. `Scrollbar(thumbVisibility: true)`
  makes overflow visible so users know to scroll, addressing the "no scroller" report directly.
  `AlwaysScrollableScrollPhysics` removes the edge case where a short list can't be pulled/bounced,
  which also makes the scrollbar thumb appear for under-filled lists.
- Alternatives considered and rejected:
  - **No fix / "not a code defect"** — the original conclusion. Rejected because the investigation
    itself surfaced two genuine UX defects (mouse-drag disabled, no scrollbar) that match the
    owner's report even if the core mechanism was sound.
  - **Touching scroll physics on a per-item basis / shrinkWrap** — would fight Flutter's lazy
    `ListView.builder` and risk unbounded-height bugs; rejected.
  - **Emitting a `Scrollbar` only for overflowing lists** — impossible to know overflow at build
    time without a `NotificationListener`; `thumbVisibility: true` + always-on physics is simpler
    and deterministic.

## Verification

- `npm run typecheck:builder` → clean.
- Generated `scroll_test.dart` (the regression guard): seeds 15 deterministic, distinguishable rows
  directly into the screen's state, drags the list, asserts the last row becomes reachable.
  Present and passing for every list screen across all regression samples (tasks, moneycrud,
  expense.semantic, todo, ledgerly).
- `flutter analyze` clean and `flutter test` 14/14 on tasks (10 original + 2 focus + 2 scroll);
  all other samples green.
- Live-browser re-check (CDP): the list now shows a visible scrollbar thumb and mouse-drag moves it.

## Prevention / follow-up

- `generateScrollTest` runs in every generated app, so a future change that breaks list scrolling
  (unbounded height, physics regression, removed scrollbar) fails the test suite immediately.
- If the owner still sees a non-scrolling list on a real iPhone after this build, capture the
  ACTUAL repro (screen recording, or Safari Web Inspector remote-debugging on the device) — this
  environment's Chrome-CDP tooling (no iOS/WebKit access) has been pushed about as far as it can
  go without one.
