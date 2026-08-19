# RCA-002 — keemart search field: iOS Safari keyboard never opens (can't type)

**Finders:** owner (live iPhone testing), 2026-08-19
**Lane:** zen orchestrator diagnosis → Claude Code fix (dispatch in progress)
**App:** `apps/keemart` (S2 sections proof sample) — also affects list-archetype search
**Severity:** p1 — user cannot type any search term on iPhone
**State:** CONFIRMED, fix dispatched

## 1. Symptom

Owner, iPhone Safari, live `/keemart`: taps the search field, the software keyboard does NOT
open — "i can not type search term". The search *filtering* itself works (RCA-001 fixed);
the field simply never engages input on iOS.

## 2. Investigation

- Generated `home_screen.dart` line 26 SearchBar: `SearchBar(controller: _searchController,
  hintText: ..., leading: ..., onChanged: (v) => setState(() => _query = v), shape: ...)` —
  **no `focusNode`, no `onTap`**.
- List-archetype SearchBar (`screen.ts:882-886`): same shape — `controller`, `onChanged`, no
  focus bypass.
- The repo ALREADY fixed this exact bug class for the create-form: **RCA-005**
  (`apps/tasks/output/rca/RCA-005-create-form-keyboard.md`) — iOS Safari only shows the on-screen
  keyboard when `.focus()` runs **synchronously inside the tap's own event handler**; Flutter
  web's lazy DOM `<input>` proxy creation pushes the `.focus()` call outside that gesture window,
  so the keyboard request is silently dropped. The current fix (crud_form.ts:88-110) is an
  explicit `FocusNode` + `onTap: () => node.requestFocus()` on the first real text field, with
  **autofocus removed** (it made the bug worse — flutter/flutter#103410/#58498 confirm).
- SearchBar *does* have its own internal InkWell that calls `requestFocus()` on tap
  (search_anchor.dart:1773-1777) — but that is exactly the same lazy-proxy-first-tap path that
  fails on iOS Safari; it is not the gesture-bound bypass the repo proven. The create-form was
  fixed precisely because relying on Flutter's own focus-on-tap was insufficient.
- CDP (desktop Chrome) cannot reproduce iOS WebKit's keyboard-suppression policy — same
  limitation RCA-005 documented. But the mechanism (lazy DOM proxy vs synchronous-gesture
  `.focus()`) is the same, and the create-form fix is the proven in-repo precedent.

## 3. Root cause

The **sections and list archetype SearchBar emits lack the iOS-Safari keyboard bypass** that
the create-form already got in RCA-005: an explicit `FocusNode` + gesture-bound
`onTap: () => node.requestFocus()`. The SearchBar's stock InkWell requestFocus relies on
Flutter's lazy DOM-proxy timing, which iOS Safari drops on the first tap. Any generated search
field (sections home OR list screen) is unusable on iPhone.

## 4. Fix / solution (generator only — never the generated app)

Dispatch `SEARCH_KEYBOARD_BRIEF_CLAUDE.md`, mirroring crud_form.ts:88-110 exactly:
1. In `screen.ts`'s stateful search branch (`needsLocalState`), add
   `final _searchFocus = FocusNode();` next to `_searchController`, dispose it in `dispose()`
   (alongside `_searchController.dispose()`, :1255).
2. Both SearchBar emit sites (list `:882-886`, sections `:471`) get
   `focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(),` — the synchronous,
   gesture-bound call iOS requires. NO autofocus (proven to make it worse).
3. Regenerate keemart; run all gates + `flutter analyze/test`; determinism ×2; negative
   control (searchless screen keeps zero focus-node declarations — byte-identical).
4. Regression guard (mirror `focus_test` in test.ts:611-647): generated searchable screens must
   emit `focusNode: _searchFocus` + `onTap: () => _searchFocus.requestFocus()` on the SearchBar,
   and a searchless screen must NOT — structural check so a revert fails the suite.
5. Rebuild web `/keemart`, re-serve 8083, CDP-verify the field still focuses + types (proves no
   regression on desktop), send to owner to re-test iPhone keyboard.

## 5. Logic / rationale

- The create-form bypass is the proven, already-shipped fix for this exact WebKit restriction —
  reusing it keeps one consistent mechanism across every generated text input.
- `onTap` on SearchBar fires synchronously inside the user's gesture; the explicit FocusNode
  means our `requestFocus()` is the gesture's own focus transition (a real unfocused→focused
  change, never a no-op), exactly what iOS Safari requires to pop the keyboard.
- Autofocus rejected: RCA-005 removed it because an already-focused field makes the first tap a
  no-op focus call — the DOM proxy still may not exist, and the keyboard still doesn't show.
- SearchBar's internal InkWell requestFocus rejected as the fix: it's the same lazy-proxy-first-tap
  path that fails; the repo's own precedent exists because Flutter's default handling was
  insufficient.

## 6. Verification

```bash
npm run typecheck:builder
npx jest test/s1_visual_intent.test.ts   # 20/20
npm test                                 # 96/96 + new focus-guard tests
# regen keemart + validate PASS + flutter analyze/test (incl squeeze 320/390/1400)
# determinism: two regens diff -r empty
# negative control: searchless sections screen → no FocusNode emitted, byte-identical
# CDP: searchbox focuses + types + filters (desktop regression check)
# owner re-test on iPhone: keyboard must open + typing must filter
```

## 7. Prevention

- Same guard class as RCA-005's `focus_test`: a structural test asserting every generated
  SearchBar carries the focusNode + gesture-bound onTap bypass, and searchless screens emit none.
- IR/generator guideline: any emitted text-input (SearchBar, TextField) gets the FocusNode +
  onTap bypass by default — never rely on Flutter's stock tap-to-focus on web.

## Open / follow-ups

- None blocking. RCA-001 (functional search) + RCA-002 (keyboard) together make /keemart search
  usable end-to-end on iPhone.