# SEARCH-KEYBOARD — iOS Safari keyboard bypass for generated SearchBar — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** RCA `apps/keemart/output/rca/RCA-002-search-keyboard-ios.md`
(owner, iPhone Safari, /keemart: "i can not type search term" — keyboard never opens)

## Task

Give every generated SearchBar (sections archetype AND list archetype) the same iOS-Safari
keyboard bypass the create-form already has (RCA-005, crud_form.ts:88-110): an explicit
`FocusNode` + gesture-bound `onTap: () => node.requestFocus()`. Fix the GENERATOR, never the
generated app.

## Why

iOS Safari only shows the soft keyboard when `.focus()` runs synchronously inside the tap's own
event handler. Flutter web's lazy DOM `<input>` proxy creation pushes `.focus()` outside that
window on the first tap, so the keyboard never appears. The repo already fixed this for
create-forms (crud_form.ts:88-110 comment explains the mechanism + rejected alternatives;
flutter/flutter#111433/#84106/#103410 confirm). The SearchBar emits do NOT have the bypass.

## Files / sites

1. `builder/src/generators/screen.ts`:
   - Stateful search branch (`needsLocalState`): `_searchController`/`_query` declared near
     `:1251`, `_searchController.dispose()` at `:1255`. ADD `final _searchFocus = FocusNode();`
     beside `_searchController`, and `_searchFocus.dispose();` beside
     `_searchController.dispose();`.
   - List-archetype SearchBar emit `:882-886` (`controller: _searchController, hintText: ...,
     onChanged: ...`).
   - Sections `search`-section emit `:471` (same shape).
   - BOTH emit sites get `focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(),`
     inserted. NO autofocus anywhere (RCA-005 removed it — it makes the bug worse).

2. Regression guard — mirror `generateFocusTest` (test.ts:611-647) for search: assert a
   generated searchable screen's SearchBar carries a non-null `focusNode` and an `onTap` that
   calls `requestFocus()` synchronously; assert a searchless sections screen emits NO FocusNode
   (StatelessWidget, byte-identical). Add to the suite.

3. Regenerate `apps/keemart` (index.ts → output/app), run all gates (validate.ts — all PASS),
   `flutter analyze` clean, `flutter test` green (squeeze 320/390/1400).

## Verification (report every output)

- `npm run typecheck:builder`
- `npx jest test/s1_visual_intent.test.ts` → 20/20
- `npm test` → 96/96 + your new guard tests
- regen keemart → validate ALL PASS + flutter analyze clean + flutter test green
- determinism: two regens `diff -r` empty (byte-identical)
- negative control: a scratch sections screen WITHOUT search → generated screen has zero
  FocusNode/`_searchFocus` references, byte-identical to pre-change output for that screen
  (scratch removed after)
- CDP (desktop regression only): searchbox still focuses + types + filters on /keemart

## Contract reminders

- Additive only; never delete; small commits; no secrets; `[generated]` headers + content-hash
  preserved; generators pure `(IR, ctx) → string`.
- Commit slices: `fix(sections,list): generated SearchBar gets iOS-Safari keyboard bypass
  (focusNode + gesture onTap, RCA-002)`, test commit, regen commit.
- When done, report to the orchestrator with command outputs. Push to master.