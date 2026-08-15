# Generator UI/UX Enhancement Plan (grilled from the tasks review)

Status: plan. Source review: owner-provided UI/UX review of the generated tasks app (equal-cards,
weak hierarchy, technical titles, raw-Material inputs). Every claim below was verified against the
actual generated output (`apps/tasks/output/app/`) and `builder/src` before planning. Fixes land in
the GENERATOR, never the generated app.

## Grilled verdicts (challenge → resolution)

| Review claim | Verdict | Resolution |
|---|---|---|
| Every field = same large card, `Id` equal weight | ✅ TRUE | Role-aware layout (Slice C) + ID de-emphasis (Slice B) |
| Page titles are implementation names | ✅ TRUE | Domain-aware titles (Slice B) |
| Circular initial avatar is meaningless | ✅ TRUE | Status/priority strip or icon leading instead (Slice C) |
| Priority dropdown = big raw overlay | ✅ TRUE | ChoiceChip / segmented control (Slice D) |
| Dates raw / ISO | ⚠️ Partly | Humanized date formatting (Slice E) |
| Need a client-side `FieldPresentation` schema | ❌ REJECT | **Infer roles deterministically from field names + `semanticType` in the generator**; optional IR `role` override when inference is wrong. Keeps 0% LLM, no new Dart config surface. |
| Need template presets (Minimal/Productivity/Admin) | ✅ LATER | `attributes.template` at the arch layer, default unchanged (Slice G) |
| Dark mode first-class | ✅ LATER | `attributes.themeMode: light|dark|system`, default light to avoid golden churn (Slice A) |
| Skeletons/empty/confirm/validation | ✅ LATER | State polish (Slice F) |

## Slices (each: typecheck → all-samples validate → flutter analyze/test → small commit → Telegram)

### Slice B — Domain-aware titles + ID de-emphasis  (quick win, screen.ts)
- AppBar title from entity + screen kind: `TaskListScreen` → **"Tasks"**, detail → **"Task details"**,
  form → **"New task" / "Edit task"** (deterministic: humanize entity name + screen type).
- `Id` renders LAST, muted, in an "Additional details" section (never first/equal weight).
- No golden churn beyond titles (goldens will update once).

### Slice A — Visual system (theme.ts generator)
- Add semantic colors `success`/`warning`/`danger`/`info` to `AppColors`.
- Typography scale: display / title / body / label styles (labels small+muted, values prominent).
- Radius tokens 12/16/24; near-zero elevation; `InputDecorationTheme` (filled, no border).
- `CardTheme` (elevation 0, radius 16).
- Dark mode: `attributes.themeMode`, default light.

### Slice C — Field-role inference + role→widget mapping (operations.ts + screen.ts)
- Infer roles deterministically: `title/description/dueDate/status/priority/id/<Parent>Id`
  (+ `semanticType: Money`), optional IR `role` override.
- Detail screen layout by role: title as main heading; status+priority chips below title; due-date
  as compact metadata row w/ icon; description as content section (not a card); id muted last;
  child relations (`View FollowUps`) as a section with count + preview, not one big card.
- List leading: priority-colored strip or status icon instead of the generic initial avatar when a
  status/priority field exists.

### Slice D — Status/priority chips (components.ts + crud_form.ts + screen.ts)
- `ChoiceChip` / segmented control for enum fields named `status`/`priority` (priority:
  low=neutral, medium=amber, high=red; status: open=blue, in progress=amber, done=green).
- Replaces the bare `DropdownButton` for these roles; other enums keep dropdown.

### Slice E — Humanized formatting (screen.ts + crud_form.ts)
- Dates: `Jan 1, 2025`, "Due tomorrow" (relative for dueDate), never ISO in the field.
- Enum labels: Title-Case humanized, not raw member names.

### Slice F — State polish (state.ts + components.ts)
- Delete confirmation dialog (destructive actions need confirm — AGENTS rule).
- Empty-state icon/message; skeleton loader; success feedback after save.

### Slice G — Template presets (arch.ts + index.ts)
- `attributes.template: minimal|productivity|dashboard|admin`; productivity = task default.
- Composition registry keys off the template; default = current behavior (backward compatible).

## Sequencing
B (quick win) → A (visual system) → C (role-aware layout) → D (chips) → E (formatting) →
F (state polish) → G (templates). A and C are the core "design-aware" change; B lands immediately
so the iPhone-visible output stops looking like an internal demo.

## Notes
- G2 (date picker) is in flight in claude (crud_form.ts) — D/E must land AFTER G2 to avoid
  crud_form.ts collisions.
- Every slice keeps determinism + `[generated]` headers + all-7-samples regression bar.
