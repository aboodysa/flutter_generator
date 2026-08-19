# KEYBOARD-ALL — iOS-Safari keyboard bypass on EVERY generated input field + $_query fix — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner directive "fix it for all input fields"; RCA-002 precedent
(create-form fix crud_form.ts:88-110; SearchBar fix just landed f7adb4f)

## Task A — keyboard bypass on ALL text-input fields

RCA-002's mechanism (iOS Safari drops the soft keyboard when `.focus()` doesn't run
synchronously inside the tap's own gesture — Flutter web's lazy DOM-input proxy pushes it outside
the window) applies to EVERY generated text-input field, not just SearchBar and the first CRUD
field. Extend the established bypass — explicit `FocusNode` + `onTap: () => node.requestFocus()`,
**never autofocus** — to every keyboard-invoking input the generator emits:

1. **crud_form.ts `fieldWidget`** — currently only the first editable field gets it
   (`focusBypassTarget` = `f === firstFocusable`, crud_form.ts:457-480). Give EVERY
   controller-backed text-input field (String/int/double/Money — the non-readOnly keyboard
   types) its own `FocusNode` + `onTap` bypass. Keep DateTime excluded (readOnly → opens
   date picker, no keyboard) and bool/enum (Checkbox/Dropdown/ChoiceChip — no text keyboard).
   Keep the existing field-loop code structure; widen the flag from
   `f === firstFocusable` to `isTextInput(f)`. Every such field gets its own `_<f>Focus`
   declaration + dispose (alongside the existing firstFocusable handling — generalize, don't
   duplicate).

2. **screen.ts `wizardFieldInput`** (`:131-177`) — the wizard's TextFormFields (String/int/
   double/Money) are controller-less but still need the bypass. Give each a local
   `FocusNode` (`final _<fieldName>Focus = FocusNode();` inside the step's State? NO — the
   wizard body is generated as pure widgets inside the screen State; follow the CRUD pattern:
   declare `_<fieldName>Focus` in the screen state, dispose, and wire
   `focusNode: _<fieldName>Focus, onTap: () => _<fieldName>Focus.requestFocus()` on the
   TextFormField). Skip bool/enum/DateTime (no text keyboard; DateTime is readOnly+onTap
   already). Keyed-field remounting (P8-W1 key) is unaffected by adding focusNode/onTap.

3. **form.ts (legacy generator)** — same bypass on its `TextField` (`:24`), if that generator
   is still wired into any live sample's output. If it's dead/legacy-only, leave it and say so.

4. **SearchBar** — already fixed (list `:882` + sections `:471` now carry `focusNode:
   _searchFocus, onTap: () => _searchFocus.requestFocus()`). Verify intact; no change.

## Task B — fix `$_query` interpolation (sections branch only)

`sections` archetype's no-results EmptyState emits `'No results for "\\$_query"'`
(`screen.ts:497`) → generated Dart `'No results for "\$_query"'` → renders the LITERAL text
`No results for $_query` (backslash-dollars = escaped literal in Dart), never the typed term.
The list archetype (`screen.ts:945`) emits `"\$_query"` correctly (Dart `$_query` interpolates).
Fix the sections branch to emit the same interpolating form as the list branch. (This bug
pre-dates RCA-001 — introduced in P2 commit 99da57b and carried verbatim into sections.)

## Verification (report every output)

- `npm run typecheck:builder`
- `npx jest test/s1_visual_intent.test.ts` → 20/20
- `npm test` → 96/96 + new/updated guard tests:
  - every generated text-input field (CRUD String/int/double/Money, wizard String/int/double/
    Money, SearchBar) carries a `focusNode:` + an `onTap:` that calls `.requestFocus()`;
  - a generated screen with no input fields emits zero FocusNode;
  - the sections no-results EmptyState emits the interpolating form (`$_query`), never `\$`.
- regen keemart (and at least one CRUD + one wizard sample, e.g. tasks/work_auth) →
  validate.ts ALL PASS + flutter analyze clean + flutter test green (squeeze 320/390/1400).
- determinism: two regens `diff -r` empty (byte-identical).
- CDP on /keemart: searchbox focuses/types/filters; type a no-match term → EmptyState shows the
  typed term, not `$_query`.
- Owner re-test on iPhone: keyboard opens + typing works in the search field AND every form
  field.

## Contract reminders

- Additive only; never delete; small commits; no secrets; `[generated]` headers + content-hash
  preserved; generators pure `(IR, ctx) → string`.
- Commit slices: `fix(generator): iOS-Safari keyboard bypass on every generated text-input
  field (FocusNode + gesture onTap, owner req, RCA-002)`, `fix(sections): no-results EmptyState
  interpolates $_query (list-branch parity)`, test commit(s), regen commit(s).
- When done, report to the orchestrator with command outputs. Push to master.