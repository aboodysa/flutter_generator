# RCA-005 — create-form keyboard doesn't show on iOS Safari (edit form is fine)

App: tasks (apps/tasks/). Date: 2026-08-15. Severity: p1 (owner-reported, real device — the
create flow for every entity is unusable if the keyboard never opens).

## Symptom

Owner, iPhone Safari: tap "New Task" (FAB → `/task/new`), tap the Title field — the keyboard
does NOT appear. After entering edit mode (`/task/:id/edit`), tapping Title shows the keyboard
normally. Same generated `_TaskFormScreenBody` renders both routes — only the `initial`/`id`
values passed in differ.

## Investigation

Built the current generator's tasks output for web (`flutter build web`), served it locally, and
inspected real DOM state in Chrome via CDP (not just widget tests, which don't exercise the
browser's DOM/focus pipeline at all):

- Landing fresh on `/task/new` (empty fields): `document.querySelectorAll('input,textarea').length`
  is **0** — Flutter Web has not yet created the invisible native `<input>` DOM proxy each
  `TextField` needs for real keyboard/IME interaction. It only appears after the user's first tap
  on a field (all of the form's proxies are created together at that point, not lazily per-field).
- Landing fresh on `/task/:id/edit` (pre-filled fields): the SAME query immediately returns **3**
  — every field's DOM input proxy already exists at mount, before any tap.

This is the concrete, reproducible difference between the two routes. iOS Safari only opens the
on-screen keyboard when `.focus()` is called **synchronously within the tap's own event handler**
— a well-documented WebKit restriction that exists specifically to stop pages from popping the
keyboard without genuine user interaction. On the edit route, the first tap only needs to call
`.focus()` on an *already-existing* `<input>` — a fast, synchronous operation safely inside the
gesture. On the create route, that same tap ALSO has to trigger Flutter's DOM-proxy creation
first — an extra step that can push the actual `.focus()` call outside Safari's synchronous-gesture
window, so the keyboard request gets silently dropped.

(Not independently reproducible from this environment on real iOS hardware — Chrome/CDP has no
iOS WebKit keyboard-suppression policy to trigger. The DOM-input-proxy-timing asymmetry above is
real, reproducible, and is the mechanism iOS Safari's own documented restriction would act on; it
is the strongest available evidence without physical device access.)

## Root cause

`builder/src/generators/crud_form.ts`'s `fieldWidget()` never sets `autofocus` on any field, so
DOM-proxy creation for the create route is entirely deferred to the user's first tap — the one
interaction iOS Safari is strictest about.

## Fix

The first editable field that renders a *real* (non-readOnly) keyboard-invoking `TextField` now
gets `autofocus: widget.id == null` — true on create, always false on edit (so edit's existing,
working behavior is provably unchanged). Autofocusing forces Flutter to build the DOM input proxy
on the very first frame, before the user ever taps, so by the time they do tap, only a fast
synchronous `.focus()` re-assertion is needed — closing the timing gap identified above.

`operations.ts` gained `firstAutofocusableField(entity, identityField)` — the *first* editable
field whose type is a real (non-DateTime) controller-backed field. DateTime is excluded even
though it uses a controller: G2 made it `readOnly: true` (opens `showDatePicker` on tap), so
autofocusing it would never show a keyboard at all. This is the single source of truth for "which
field is the autofocus target" — both `crud_form.ts` (the fix) and `test.ts`'s new
`generateFocusTest` (the regression guard) call it, so they can't silently drift apart.

## Verification

- `npm run typecheck:builder` → clean.
- Generated tasks form: `TextField(autofocus: widget.id == null, controller: _title, ...)` on
  `Task`'s first field; `FollowUp`'s form autofocuses `_taskId` (its own first field) the same way.
- New generated `focus_test.dart`: mounts the real app, jumps straight to `/task/new` via
  `appRouter.go(...)`, asserts the first `TextField`'s `autofocus` property is `true`.
- **Stash proof**: `git stash push -- builder/src/generators/crud_form.ts` (reverting only the
  fix, keeping the test generator), regenerated tasks → `focus_test.dart` **FAILS**:
  `Expected: true, Actual: <false>` on both entities. `git stash pop` (fix restored), regenerated
  → **PASSES**, both entities, both `flutter test` runs.
- Full regression: `flutter analyze` clean and `flutter test` all-green across tasks +
  moneycrud/expense.semantic/todo/reimbursement/wizard/ledgerly.

## Logic / rationale

Autofocus on the create route works because it moves the expensive, one-time DOM-proxy creation
OUT of the user's first tap. On iOS Safari, the keyboard only opens when `.focus()` runs
synchronously inside the tap's own event handler; by forcing the proxy to exist at first frame
(`autofocus: true` at mount), the subsequent tap becomes a pure re-assertion of focus on an
existing `<input>` — a single fast step that stays inside the gesture window. Edit never autofocuses
so its already-working path is untouched. Alternatives considered and rejected:
- **A `FocusNode` + `requestFocus()` in a post-frame callback** — still runs outside the tap's
  synchronous handler on iOS, so it does not fix the mechanism.
- **Autofocusing on edit too** — would change working behavior for no benefit and could steal focus
  from a user mid-form; rejected as an unnecessary behavior change.
- **Not fixing / "tell the user to tap twice"** — unacceptable for a create flow used constantly.

## Prevention

Any create/edit form generator should default the FIRST real text-input field to
`autofocus: <is-create>` — never leave DOM-proxy creation entirely to the user's first tap on a
freshly-pushed route, since that's exactly the interaction mobile Safari is strictest about.
`firstAutofocusableField` is now the shared place that decision lives; a future field-kind
addition (e.g. a new controller-backed type) should extend it there, not re-derive its own
"which field gets focus" logic in a new generator.
