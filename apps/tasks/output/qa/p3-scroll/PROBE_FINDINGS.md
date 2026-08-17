# P3 scroll behavior — CDP probe findings

Slice: P3 (scroll behavior: `scroll.enabled = screen.kind ∈ {list, detail}`)
App under test: `apps/tasks/output/app` (web build, `--base-href=/tasks/`, served on the tailnet).
Driver: shared `CdpSession` (`new_chrome_ext/tools/cdp_driver.py`) against CFT headless on `:9222`
(relaunched with the anti-throttle flags from `FLUTTER_TESTING_LESSONS.md §1` after the stale
instance stopped serving screenshots).

## Findings

| # | Severity | Symptom | Root cause | Location | Verdict |
|---|----------|---------|------------|----------|---------|
| G0 | none | At-rest AppBar pixel color `(244,251,248)` is byte-identical pre-P3 vs post-P3 (0/329160 px differ). | `backgroundColor: _scrolled ? … : null` — `null` means "theme default", so at-rest render is untouched. | `screen.ts` `scrollAppBarSuffix` | PASS — intended |
| G1 | none | Wheel-scrolling a list/detail over ~300px viewport changes AppBar color to `(204,218,215)` (21.2–21.7k px in the appbar band); scrolling back to top restores `(244,251,248)` byte-identically. | `NotificationListener<ScrollNotification>` flips `_scrolled` on `extentBefore > 0`; `_scrolled` is widget-local UI state (contract §5). | `screen.ts` scroll wrapper | PASS — intended |
| G2 | none | No RenderFlex/overflow errors at 320x568 / 390x844 / 768x1024 / 1280x800 (console `drain_errors` clean, no `Network.loadingFailed`). | N/A | all screens | PASS |
| G3 | none | Navigation to `/task/1` detail renders clean, scrolls, tints. | N/A | detail screen | PASS |
| G4 | note | At 390x844 (real iPhone size) a 3-row list does NOT overflow, so no tint fires — correct: nothing is scrolled (`extentBefore` stays 0). Verification required a short viewport (300px) to force scroll. | List is shorter than viewport | task list | expected |

## Evidence

- `cdp/task_list_rest.png` — list at-rest (390x844, default AppBar)
- `cdp/t_rest300.png` → `cdp/t_scroll300.png` — list at-rest vs scrolled (390x300): AppBar tint fires
- `cdp/t_back300.png` — after scroll-back: pixel-identical to `t_rest300.png` (0 px diff)
- `cdp/t_detail_rest260.png` → `cdp/t_detail_scrolled260.png` — detail at-rest vs scrolled (390x260): tint fires
- `cdp/list_320x568.png`, `list_390x844.png`, `list_768x1024.png`, `list_1280x800.png` — overflow scan
- `scroll_negative_harness.ts` — output-side negative control: `[scroll]` FAIL(1) when the listener is stripped

## Enhancement needed

None. P3 behaves as specified in `INTERFACE_PATTERN_CONTRACT §5` (scroll = list/detail, additive
AppBar tint, no pagination/fetch-on-scroll in scope).

## Regression note (pre-existing, not P3)

`test/temp_all_flows_test.dart` (P1-era all-flows harness) reports 5 failures BEFORE and AFTER P3:
`ArgumentError: Type TaskRepository is already registered inside GetIt` — the harness calls
`main()`/`setupDependencies()` per test into a shared GetIt singleton. Not a pixel diff, not a P3
regression; out of scope for this slice (tracked in `LEFTOVER_NOTES.md`).
