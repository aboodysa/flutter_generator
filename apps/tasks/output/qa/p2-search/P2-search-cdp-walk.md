# P2 CDP walk — per-list search, tasks, 2026-08-17

Tasks-specific findings. The full narrative walk (filter/no-results/clear on both ledgerly and
tasks, plus the scroll_test.dart fix this slice required) lives at
`apps/ledgerly/output/qa/p2-search/P2-search-cdp-walk.md` step 7 — this file covers the
tasks-specific overflow-probe run only, per the brief's "folder per app" instruction.

## Steps (tasks app, single-feature, no P1 shell)

Live drive against a local `flutter build web` + `python3 -m http.server 8737` serve of
`build/web`:

1. **TaskListScreen renders a `SearchBar`** ("Search Tasks") above the row list — no bottom nav
   (tasks is single-feature, P1's shell never applies here — confirms search and shell compose
   independently, contract §9.2 invariant).
2. **Filter as-you-type**: typed "2" — list narrowed from 3 seeded rows ("Sample Task", "Sample
   Task 1", "Sample Task 2") to exactly "Sample Task 2".
3. **No-results EmptyState**: typed "qqqxxx" — rendered "No results for "qqqxxx"", no overflow.
4. **Clear**: backspaced to empty — all 3 rows restored.

## Overflow scan (320 / 390 / 768 / 1280)

Same environment constraint documented in the ledgerly walk (browser `resize_window` doesn't
change the actual rendered viewport in this session) — substituted a Flutter widget-test viewport
proof instead. Probe file: `overflow_probe_test.dart` in this directory (boot → filter →
no-results → clear at each of the four required breakpoints).

```
00:00 +0: Tasks search renders with no overflow at 320w (small phone)
00:00 +1: Tasks search renders with no overflow at 390w (iPhone-class)
00:00 +2: Tasks search renders with no overflow at 768w (tablet)
00:00 +3: Tasks search renders with no overflow at 1280w (desktop)
00:00 +4: All tests passed!
```

All 4/4 pass.
