# tasks app — CDP AX/a11y/UX probe findings (driver session)

Probed the release build at `/tasks/` via CFT/CDP (mall-session pattern: boot → semantics
activation → full AX tree → console/network errors → route exercise → overflow scan → keyboard).

Driver: `apps/tasks/output/qa/tasks_probe.py` (uses `new_chrome_ext/tools/cdp_driver.py`).

## Confirmed findings (generator gaps)

### G1 — Demo seed data was junk  ✅ FIXED (sampling.ts)
- Symptom: list cards read `x X x 2024-01-01 · low`, `Sample item 1 S Sample item 1 2025-01-01 · low`.
- Root cause: `builder/src/sampling.ts` used `'x'` for row-0 string fields and `'Sample item N'`
  for EVERY string field in rows 1+ — including the primary display field (title) and the identity
  (`id: 'Sample item 1'` leaked into URLs like `/task/Sample item 1`).
- Fix: primary title field → `'Sample Task'` / `'Sample Task 1'`; identity → `'task-1'` (kebab+index).
- After: `Sample Task 2024-01-01 · low` ✓

### G2 — DateTime fields are plain text, not a date picker  ❌ OPEN
- Symptom: edit form's "Due Date" is `<input type=text>`; user must type `YYYY-MM-DD` by hand;
  no `showDatePicker`, no validation. This is the "no date/time selector" complaint.
- Location: `builder/src/generators/crud_form.ts` + `screen.ts` wizard field input
  (`TextFormField` with `hintText: 'YYYY-MM-DD'`). claude owns crud_form.ts (MF1 in flight).

### G3 — Detail screens have NO back affordance  ❌ OPEN
- Symptom: on `/task/:id` the AX tree has Edit/Delete/View FollowUps but no back button/chevron;
  `context.go('/task/:id')` replaces the history entry, so browser back and the AppBar both lack a
  way home (except the Delete button). On the follow-up list reached via a parent link there is
  also no explicit "back to task".
- Location: `builder/src/generators/screen.ts` (detail AppBar) + `routing.ts` (`context.go` vs push).

### G4 — Enum dropdowns render but CDP cannot open them (automation/a11y quirk)
- Symptom: Priority/Status render as Flutter `DropdownButton` (AX `[button] low`, `[button] open`);
  neither AX-node click nor DOM click opens the menu (Flutter web renders it as an overlay the AX
  tree doesn't expose until open). Keyboard focus travels; Enter on the browser root navigates.
- Assessment: works for a human tapping; a11y tree for the open menu is weak. Flag for L5/C2 polish.

### G5 — Regeneration destroys the `web/` platform  ❌ OPEN
- Symptom: `index.ts` regeneration removes `web/` (not in generator output), so the app lost web
  after re-generate; had to `flutter create . --platforms web` again before `flutter build web`.
- Root cause: the generator never emits a `web/` dir; only lib/ + test/ + pubspec. Additive fix:
  make `flutter build web` a documented post-generate step, or emit `web/index.html` in the generator.

### G6 — Follow-up form's taskId is a free-text field
- The FollowUp create form requires typing the parent task's id by hand (no picker/deep-link
  prefill). The parent→child link works for *navigation* (G2's `?taskId=` filter works, verified),
  but child *creation* doesn't prefill. Low severity; fold into C2 (multi-role UI) work.

## Verified OK
- Boot + semantics activation: OK. Console/network: no errors on any route.
- Overflow scan: 320×568, 390×844, 768×1024, 1280×800 all clean (no RenderFlex overflow).
- Navigation: list → detail → edit form → `/follow-up?taskId=x` filter all work.
- Keyboard: tapping a text field focuses the DOM `<input>` and typing lands (tested `insertText`).
- Delete: works (detail Delete → returns to list). New: FAB works.

## Priority for generator work
1. G2 date picker (owner-flagged "date and time selectors")
2. G3 back affordance (owner-flagged "navigating back")
3. G5 web/ regeneration preservation
4. G1 already fixed; G4/G6 minor polish.

## How to re-run
```
python3 apps/tasks/output/qa/tasks_probe.py
```
(Requires CFT on :9222 + tasks web server on :8081 + tailscale /tasks mount.)
