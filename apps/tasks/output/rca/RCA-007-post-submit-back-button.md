# RCA-007 — no in-app back button after create/edit (go_router stack collapse)

App: tasks (apps/tasks/). Date: 2026-08-17. Severity: p1 (owner-reported on iPhone — no way back
to the list except the browser back, which doesn't exist on the phone).

## 1. Symptom

Owner verbatim (Telegram): *"after create task, there is no return to home back button, i need to go
back by browser which is not available in app."* After creating a task, the app lands on the new
task's **detail** screen with no AppBar back arrow; the only way back was the browser back (absent
on the iPhone). Reproduced on the tailnet-hosted tasks app.

## 2. Investigation

- Read the generated flow: `task_list_screen.dart` opens the form with
  `context.push('/task/new')`; `task_form_screen.dart:189` navigated after submit with
  `context.go('/task/${item.id}')`. Detail's Edit does the same via `context.go('/task/${id}')`
  from `task_form_screen.dart` (edit branch shares the same submit handler).
- go_router semantics: `push` adds a page on top (stack grows, AppBar auto-back appears);
  `go` **replaces the whole navigation stack** with the target location. From `[/task, /task/new]`,
  `go('/task/:id')` collapsed the stack to `[/task/:id]` alone → `Navigator.canPop() == false` →
  no auto back button.
- Confirmed via CDP (CFT headless + shared driver) on the tailnet build: form reached via push
  shows a working `Back` button; after create the detail had NO back affordance.
- The root cause is entirely in the generator's post-submit navigation choice, not the form/list
  screens' push behavior.

## 3. Root cause

`builder/src/generators/crud_form.ts:550` emitted `context.go('${postSubmitPath}')` after every
submit. `postSubmitPath` is the detail path (`/task/${item.id}`) when the entity has a detail
screen (`crud_form.ts:438`). `context.go` **resets the route stack to only the target location**,
so the detail screen — the sole entry — never gets an AppBar back button. Same for edit (form was
pushed over the detail; `go` dropped both the list and the detail beneath it).

## 4. Fix / solution

Generator change in `builder/src/generators/crud_form.ts`:

- Added `postSubmitNav` that selects the navigation by target:
  - **detail path** (`hasDetail`): `context.pushReplacement('${postSubmitPath}')` — replaces the
    top page (the form) with the detail, **keeping the list beneath it**, so the AppBar auto-back
    button renders and pops back to the list.
  - **list path** (no detail screen): keep `context.go('${postSubmitPath}')` — the list is home,
    there's no parent to pop to.
- Replaced the hard-coded `context.go(...)` at line 550 with `${postSubmitNav}`.

Why `pushReplacement` and not `go`: the form is always reached by `push` (screen.ts:106), so the
list is guaranteed to be beneath it. Replacing only the top page preserves that parent; the
auto-back button appears because `canPop` is true. This also keeps the edit flow correct: stack
`[/task, /task/:id, /task/:id/edit]` → `pushReplacement('/task/:id')` → `[/task, /task/:id]`
(back → list, same as the natural detail→list path).

Rejected alternatives:
- `context.go(...)` (status quo) — collapses the stack, which is the bug.
- `context.pop()` — would return to whatever pushed the form, but for create that's the list, not
  the just-created detail; the user would never see the result. `pushReplacement` shows the
  created item AND keeps home reachable.
- Browser-back shim / manual leading arrow — would fight the framework instead of fixing the
  navigation model.

## 5. Logic / rationale

`pushReplacement` = "swap the current page for this one" — the correct "form → result detail"
transition. Because the AppBar back arrow is driven by `Navigator.canPop()`, preserving the list
entry below the detail is exactly what makes the arrow appear. This matches Flutter/go_router
convention (submit form → see created/edited resource → back to the parent list).

## 6. Verification

- `npm run typecheck:builder` — clean.
- Regenerated all 4 apps + all 9 samples; `validate.ts` **13/13 PASS** (`[scroll] [search]
  [shell] [plan-determinism] [determinism] [verdict]` all green).
- `flutter analyze` on tasks — no NEW issues (15 pre-existing P1-era infos unchanged);
  `flutter test test/golden_test.dart test/focus_test.dart test/scroll_test.dart` → **+7 passed**.
- **CDP live verification** (fresh tailnet web build):
  1. List → `New Task` → form (Back button present — via `push`).
  2. Entered a title, tapped `Create`.
  3. Landed on `Task details` with **Back + Edit + Delete** in the AppBar (was: no Back).
  4. Tapped `Back` → returned to the task list with the new task visible.
- Bundle grep: rebuilt `main.dart.js` contains `pushReplacement`.

## 7. Prevention

- Generator-level: post-submit navigation is now target-aware (detail → `pushReplacement`, list →
  `go`). The navigation model is emitted, never hand-edited (generated files are disposable).
- Optional hardening (not this slice): a `[nav]` validate gate that asserts every form screen's
  submit handler uses `pushReplacement`/`pop` (never bare `go` to a detail path) — matches the
  [scroll]/[search] re-derive-and-diff posture. Tracked in `LEFTOVER_NOTES.md`.
