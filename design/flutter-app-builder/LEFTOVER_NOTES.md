# LEFTOVER NOTES — tracked, actionable queue from claude reports

Compiled from every claude slice report + probe findings. Each item: source, what, why it
matters, status. Update on every slice. This is the "don't lose the notes" index.

## Bugs round (committed 53ae2d2) — 2026-08-15
| Note | Detail | Status |
|---|---|---|
| Bug A create-keyboard | iOS Safari keyboard not showing on create (no DOM `<input>` proxy until first tap). Fixed: autofocus on create only. RCA-005 + focus_test guard | ✅ FIXED |
| Bug B list-scroll | No visible Scrollbar + mouse excluded from dragDevices. Fixed: AppScrollBehavior + Scrollbar(thumbVisibility) + AlwaysScrollableScrollPhysics. RCA-006 + scroll_test guard | ✅ FIXED |
| G6 FK-prefill | New-FollowUp drops ?taskId and form doesn't prefill. Fixed: FAB preserves query param + CRUD form prefills <Parent>Id | ✅ FIXED |
| B2 leftover | focus/scroll tests boot real DI per case; focus_test resets GetIt between cases | DOCUMENTED |
| B3 leftover | G6 prefill handles String FKs only (no sample uses non-String FK) | WONTFIX (documented) |

## From UIX Slice D (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| D1 ChoiceChip `onSelected` not exercised by generated test | crud_flow_test targets `firstCrudTextField` (never status/priority), so chip-tap interaction is only proven by render + analyze, not by a tap test | OPEN — fold into the bugs/regression-test task (claude in flight) |
| D2 ChoiceChip selected tint 0.2 vs AppChip 0.12 | deliberate stronger "selected" look; documented, no action | WONTFIX (documented) |

## From G2 date-picker (committed) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| G2a `firstCrudTextField` could pick a DateTime field | generated crud_flow_test does `enterText(first TextField)`; a readOnly date field would fail. No sample triggers it today (first fields are String/double) | OPEN (latent) |
| G2b `datepickerCheck` reads `ir.entities` directly | vacuously passes for multi-feature AppModel IR (entities under `ir.features[].entities`) — same pre-existing gap as `moneyCheck` | OPEN (latent) |

## From MF1 multi-feature (committed 76f8a0f) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| M1 flow/crud tests only exercise feature[0] | multi-feature apps' generated tests drive the first feature only | OPEN (by design, document) |
| M2 arch-linter layer detection vacuous for multi-feature | path-segment mismatch (`features/<name>/`), passes without checking | OPEN |
| M3 symbol-table collisions across features | last-registered wins silently | OPEN |
| M4 rasheed strategy-fidelity mismatch | plan.json declares sealed-events, template emits enum-status; real but unrelated | OPEN (pre-existing) |

## From L1 Money (committed 739f933) — report 2026-08-15
| Note | Detail | Status |
|---|---|---|
| L1a `generateCrudFlowTest` doesn't special-case money fields | typing into first TextField with a money field unchecked; reimbursement has no list/CRUD so it never fired | OPEN — moneycrud sample exercises CRUD+money; verify |
| L1b Money.format hardcodes 2-decimal exponent | JPY/BHD (0/3-decimal) not handled | WONTFIX (no sample needs it; documented) |
| L1c Money +/- assert() on currency match | asserts stripped in release | WONTFIX (demo; revisit if load-bearing) |

## From tasks probe (committed 039904a) — 2026-08-15
| Note | Detail | Status |
|---|---|---|
| P1 list-screen filter uses GoRouterState.of | child list screens throw under plain MaterialApp golden mount — latent; goldens render screens[0] only | OPEN (latent; flagged to claude) |
| P2 heroBlock + title-role heading could stack | no sample sets both; left as-is | WONTFIX (documented) |
| P3 list leading picks status over priority | deliberate tie-break when both present | DOCUMENTED |
| P4 AppChip tones are substring/vocab matches | non-English status vocabulary → default tone | WONTFIX (deterministic by design) |
